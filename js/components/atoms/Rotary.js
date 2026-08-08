/**
 * Rotary - Hardware Rotary Knob Component
 * Realistic 3D rotary with drag interaction
 *
 * @example
 * const rotary = new Rotary(container, {
 *   preset: 'threshold',    // 'threshold' | 'gain' | 'custom'
 *   label: 'THR',
 *   value: -30,
 *   min: -90,
 *   max: 6,
 *   step: 1,
 *   sensitivity: 0.3,
 *   reconcileTimeout: 500,    // ms d'autorite locale apres le geste
 *   onInput: (value) => {},   // Called during drag (real-time)
 *   onChange: (value) => {}   // Called at end of drag
 * })
 *
 * CONTRAT DES COMMANDES TEMPS REEL (issue #43)
 * --------------------------------------------
 * Le Rotary est la source de verite de sa propre valeur pendant et apres un
 * geste utilisateur ; le serveur ne la reprend qu'une fois l'echo revenu (ou
 * apres expiration). Les appelants ne rejouent pas cette logique : ils
 * poussent l'entrant via externalSync(), qui rend false quand le rotary garde
 * l'autorite — a charge de l'appelant de ne pas toucher aux autres faces du
 * widget (indicateur, etat interne) dans ce cas.
 *
 *   startDrag  -> beginLocalEdit()          (autorite pendant le geste)
 *   stopDrag   -> endLocalEdit(valeur)      (autorite jusqu'a l'echo, ~500 ms)
 *   ecriture programmee -> commitLocalValue(valeur)
 *   entrant serveur     -> externalSync(valeur) : bool applique
 *   destruction         -> destroy() : retire aussi les ecouteurs de document
 *
 * Corollaire du dernier point : detruire un rotary interrompt le geste en
 * cours. C'est voulu — un widget detruit ne doit plus emettre — mais cela
 * n'est tenable que si l'appelant ne detruit pas ses rotaries a chaque
 * broadcast (issue #92).
 */

// Rotary Presets
const ROTARY_PRESETS = {
  threshold: {
    label: 'THR',
    min: -90,
    max: 6,
    step: 1,
    sensitivity: 0.3,
    format: (v) => `${v}`
  },
  gain: {
    label: 'GAIN',
    min: -30,
    max: 12,
    step: 1,
    sensitivity: 0.2,
    format: (v) => {
      const sign = v >= 0 ? '+' : '';
      return `${sign}${v}dB`;
    }
  },
  pan: {
    label: 'PAN',
    min: -100,
    max: 100,
    step: 1,
    sensitivity: 0.5,
    format: (v) => {
      if (v === 0) return 'C';
      return v < 0 ? `L${Math.abs(v)}` : `R${v}`;
    }
  }
};

class Rotary {
  constructor(container, config = {}) {
    this.container = container;

    // Apply preset if provided
    const preset = config.preset ? ROTARY_PRESETS[config.preset] : {};

    this.config = {
      preset: null,
      label: 'ROT',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      sensitivity: 0.5,        // Drag sensitivity (dB per pixel)
      reconcileTimeout: 500,   // ms : duree d'autorite locale apres une ecriture
      size: 'sm',              // 'sm' (24px, default) | 'lg' (80px)
      format: (v) => `${v}`,   // Value formatter
      onInput: null,           // Called during drag (real-time)
      onChange: null,          // Called at end of drag
      ...preset,
      ...config
    };

    // Indicator pivot Y (from indicator top-left to knob geometric center).
    // = knobRadius - indicatorTopOffset (matches CSS).
    // sm: knob 24px (r=12), indicator top=2px -> 10
    // lg: knob 80px (r=40), indicator top=6px -> 34 (to be revisited when bigknob is redesigned)
    this._knobRadius = this.config.size === 'lg' ? 34 : 10;

    this.element = null;
    this.knobEl = null;
    this.valueEl = null;
    this.indicatorEl = null;

    this.isDragging = false;
    this.startY = 0;
    this.startValue = 0;

    // Ecouteurs de drag : poses sur `document` (le doigt sort du bouton), donc
    // hors de portee d'un simple `element.remove()`. Gardes ici pour que
    // destroy() puisse les retirer.
    this._onDragMove = null;
    this._onDragEnd = null;

    // Autorite locale : vraie pendant un geste (isDragging ou _localEdit pour
    // une edition programmee), puis jusqu'a _pendingDeadline apres la derniere
    // valeur ecrite localement (_pendingValue).
    this._localEdit = false;
    this._pendingValue = null;
    this._pendingDeadline = 0;

    this.render();
    this.setupEventListeners();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const rotary = document.createElement('div');
    rotary.className = 'rotary';
    if (this.config.size === 'lg') rotary.classList.add('rotary--lg');

    // Calculate rotation angle based on value
    const rotation = this.valueToRotation(this.config.value);
    const origin = `center ${this._knobRadius}px`;

    // Le label est masque (div omis) quand label vide -> economie d'espace
    const labelHtml = this.config.label
      ? `<div class="rotary__label">${this.config.label}</div>`
      : '';

    rotary.innerHTML = `
      <div class="rotary__knob">
        <div class="rotary__indicator" style="transform: translateX(-50%) rotate(${rotation}deg); transform-origin: ${origin};"></div>
      </div>
      <div class="rotary__value">${this.config.format(this.config.value)}</div>
      ${labelHtml}
    `;

    if (this.element) {
      this.container.replaceChild(rotary, this.element);
    } else {
      this.container.appendChild(rotary);
    }

    this.element = rotary;
    this.knobEl = rotary.querySelector('.rotary__knob');
    this.valueEl = rotary.querySelector('.rotary__value');
    this.indicatorEl = rotary.querySelector('.rotary__indicator');
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  setupEventListeners() {
    this.knobEl.addEventListener('mousedown', (e) => this.startDrag(e));
  }

  startDrag(e) {
    e.preventDefault();

    this.isDragging = true;
    this.startY = e.clientY;
    this.startValue = this.config.value;
    this.altKeyPressed = e.altKey; // Track if Alt was pressed at start

    this.beginLocalEdit();

    this._releaseDragListeners();
    this._onDragMove = (ev) => this.handleDrag(ev);
    this._onDragEnd = (ev) => this.stopDrag(ev);

    document.addEventListener('mousemove', this._onDragMove);
    document.addEventListener('mouseup', this._onDragEnd);

    // Add dragging visual feedback
    this.knobEl.classList.add('rotary__knob--dragging');
  }

  handleDrag(e) {
    if (!this.isDragging) return;

    const deltaY = this.startY - e.clientY; // Inverted: up = increase
    const valueDelta = deltaY * this.config.sensitivity;
    const newValue = this.startValue + valueDelta;

    // Track alt key state during drag (can change mid-drag)
    this.altKeyPressed = e.altKey;

    // Clamp and step
    const clampedValue = Math.max(this.config.min, Math.min(this.config.max, newValue));
    const steppedValue = Math.round(clampedValue / this.config.step) * this.config.step;

    this.setValue(steppedValue, false); // Update visual without triggering onChange during drag

    // Trigger onInput during drag for real-time updates
    // Pass altKey state to callback for global apply feature
    if (this.config.onInput) {
      this.config.onInput(steppedValue, { altKey: this.altKeyPressed });
    }
  }

  stopDrag(e) {
    this.isDragging = false;

    this._releaseDragListeners();

    // Remove dragging visual feedback
    this.knobEl.classList.remove('rotary__knob--dragging');

    // Arme la reconciliation AVANT onChange : la valeur relachee est celle que
    // l'appelant s'apprete a envoyer, c'est donc l'echo a attendre.
    this.endLocalEdit(this.config.value);

    // Trigger onChange at end of drag
    // Pass altKey state for global apply feature
    if (this.config.onChange) {
      this.config.onChange(this.config.value, { altKey: e?.altKey || this.altKeyPressed });
    }
  }

  // ========================================================================
  // VALUE & ROTATION
  // ========================================================================

  valueToRotation(value) {
    const { min, max } = this.config;
    const range = max - min;
    const normalized = (value - min) / range;  // 0 to 1
    return normalized * 270 - 135;  // Map to -135deg to +135deg
  }

  setValue(value, triggerChange = true) {
    // Early-return if value unchanged: matters for global-apply paths
    // (Alt+drag iterates N tracks per pointermove) and 30Hz external syncs.
    if (value === this.config.value) {
      if (triggerChange && this.config.onChange) {
        this.config.onChange(value);
      }
      return;
    }

    this.config.value = value;

    // Update visual
    const rotation = this.valueToRotation(value);
    this.indicatorEl.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    this.indicatorEl.style.transformOrigin = `center ${this._knobRadius}px`;
    this.valueEl.textContent = this.config.format(value);

    // Trigger onChange if requested
    if (triggerChange && this.config.onChange) {
      this.config.onChange(value);
    }
  }

  getValue() {
    return this.config.value;
  }

  // ========================================================================
  // AUTORITE LOCALE & RECONCILIATION SERVEUR
  // ========================================================================

  /**
   * Ouvre un geste local : le rotary devient seul maitre de sa valeur.
   * Appele automatiquement par startDrag ; public pour les gestes pilotes
   * de l'exterieur (clavier, molette, futurs faders).
   */
  beginLocalEdit() {
    this._localEdit = true;
    this._clearPending();
  }

  /**
   * Ferme le geste local et arme la fenetre de reconciliation : jusqu'a
   * expiration, seule la valeur envoyee (ou une valeur equivalente au pas
   * pres) est acceptee de l'exterieur. Sans cette fenetre, un PATCH plus
   * ancien encore en vol — il en part 30 a 60 par seconde pendant un drag —
   * revient apres le relachement et rappelle la commande en arriere.
   *
   * @param {number} [sentValue] - Valeur envoyee au serveur (defaut: valeur courante)
   */
  endLocalEdit(sentValue) {
    this._localEdit = false;
    this._armPending(sentValue === undefined ? this.config.value : sentValue);
  }

  /**
   * Ecriture locale hors geste (apply global Alt+drag, preset, raccourci) :
   * s'applique sans passer par la garde puisqu'elle vient de l'utilisateur,
   * et arme la meme fenetre de reconciliation qu'un relachement de drag.
   *
   * @param {number} value - Valeur a appliquer
   */
  commitLocalValue(value) {
    this.setValue(value, false);
    this._armPending(value);
  }

  /**
   * Pousse une valeur venue du serveur (broadcast WS, switch de bus, refetch).
   * L'entrant est ignore tant que le rotary garde l'autorite locale.
   *
   * @param {number} value - Valeur entrante
   * @returns {boolean} true si appliquee, false si l'autorite locale l'emporte.
   *   L'appelant DOIT propager ce false aux autres faces du widget (indicateur,
   *   etat interne) : sinon le composant affiche la valeur de l'utilisateur et
   *   memorise celle du serveur.
   */
  externalSync(value) {
    if (!this._acceptsExternal(value)) return false;
    this.setValue(value, false);
    return true;
  }

  /**
   * true si le rotary tient encore la main sur sa valeur (geste en cours ou
   * fenetre de reconciliation non expiree).
   */
  hasLocalAuthority() {
    return this.isDragging || this._localEdit || this._pendingValue !== null;
  }

  /**
   * Abandonne l'autorite locale. A appeler quand le widget change de sujet
   * (switch de bus : le meme rotary edite desormais une autre grandeur) —
   * l'echo attendu ne concerne plus ce qu'il affiche.
   */
  resetLocalAuthority() {
    this._localEdit = false;
    this._clearPending();
  }

  _acceptsExternal(value) {
    // Pendant le geste : aucune face du widget ne bouge.
    if (this.isDragging || this._localEdit) return false;

    // Hors fenetre de reconciliation : le serveur fait autorite.
    if (this._pendingValue === null) return true;

    if (this._now() >= this._pendingDeadline) {
      // Expiration : l'echo attendu n'est jamais venu, on refait confiance
      // au serveur plutot que de figer l'affichage indefiniment.
      this._clearPending();
      return true;
    }

    // La fenetre reste armee meme apres l'echo attendu : les PATCH partent sur
    // plusieurs connexions HTTP et peuvent revenir dans le desordre, un echo
    // intermediaire arrivant apres le bon. La regle 6 du contrat (numero de
    // sequence par commande) remplacera cette heuristique temporelle.
    return Math.abs(value - this._pendingValue) <= this._echoTolerance();
  }

  _echoTolerance() {
    // Les valeurs sont quantifiees au pas ; une demi-marche absorbe les
    // arrondis de conversion d'unite (ex: pan -1.0..+1.0 <-> -100..+100).
    return Math.max(Math.abs(this.config.step) / 2, 1e-6);
  }

  _armPending(value) {
    this._pendingValue = value;
    this._pendingDeadline = this._now() + this.config.reconcileTimeout;
  }

  _clearPending() {
    this._pendingValue = null;
    this._pendingDeadline = 0;
  }

  _now() {
    // Horloge monotone : Date.now() saute avec la resynchro NTP du poste.
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Retire le widget et **tout** ce qu'il a pose ailleurs.
   *
   * Les ecouteurs de drag vivent sur `document` : les oublier laissait un
   * rotary detruit continuer a suivre la souris et a appeler ses callbacks —
   * un zombie qui emettait des PATCH pour un bouton qui n'existait plus.
   * `stopDrag` n'etant plus atteignable, la fenetre de reconciliation n'est
   * pas armee : le widget est detruit, il n'y a plus rien a reconcilier.
   */
  destroy() {
    this.isDragging = false;
    this._releaseDragListeners();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  _releaseDragListeners() {
    if (this._onDragMove) document.removeEventListener('mousemove', this._onDragMove);
    if (this._onDragEnd) document.removeEventListener('mouseup', this._onDragEnd);
    this._onDragMove = null;
    this._onDragEnd = null;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.Rotary = Rotary;
  window.ROTARY_PRESETS = ROTARY_PRESETS;
}

// Export for module usage
export { Rotary, ROTARY_PRESETS };
export default Rotary;

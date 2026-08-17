/**
 * AudioTrack - Complete Audio Track Strip
 * Professional console track with adaptive layout
 *
 * @example
 * const track = new AudioTrack(container, {
 *   trackId: 1,
 *   size: 'normal',        // 'condensed' | 'compact' | 'normal' | 'large'
 *   location: 'P',         // code du site
 *   sublocation: '01',     // code de la salle, optionnel
 *   locationLabel: 'P-01', // le couple deja ecrit par l'hote — ce qui s'affiche
 *   language: 'FR',
 *   customName: 'Speaker 1', // optionnel, prioritaire sur location/language
 *   secondaryRecordingEnabled: false, // second fichier ecrit en parallele
 *   threshold: -30,
 *   gain: 0,
 *   pan: 0,
 *   mute: false,           // per-bus (spec MASTER-SECTION)
 *   solo: false,           // per-bus (spec MASTER-SECTION)
 *   trackState: 0,         // 0=IDLE, 1=ARMED, 2=RECORDING (backend enum)
 *   onMuteToggle: (enabled) => {},
 *   onSoloToggle: (enabled) => {},
 *   onRecordToggle: (trackState) => {},  // Callback avec trackState UInt32
 *   onThresholdChange: (value) => {},
 *   onGainChange: (value) => {},
 *   onPanChange: (value) => {},
 *   onLocationClick: (value) => {},
 *   onLanguageClick: (value) => {}
 * })
 */

import ButtonGroup, { BUTTON_SETS } from '../molecules/ButtonGroup.js';
import RecordControl from '../molecules/RecordControl.js';
import Rotary from '../atoms/Rotary.js';
import CanvasMeter from '../../CanvasMeter.js';

// Mapping mode -> CanvasMeter preset/config
// See CANVAS-METER.md and TRACK-UI-MVP.md section 3
// Track width 40px: meter 24px + ticks 4px = 28px canvas (labels overlay on meter, Reaper style)
//
// Chaque entree redit **tous** les drapeaux que `condensed` eteint :
// `setConfig()` fusionne, il ne re-resout pas le preset, donc un drapeau eteint
// par une bascule vers `condensed` resterait eteint au retour.
const METER_CONFIG_BY_MODE = {
  condensed: {
    // Tranche de 6 px : 4 px de metre entre les deux bordures. Il ne reste que
    // la barre — ni echelle, ni chiffre, ni RMS, ni maintien de crete.
    // `showClipIndicator` est le seul drapeau qui revient : 4x4 px en tete de
    // barre, aucune largeur, et il porte l'ecretage — la seule anomalie qu'une
    // grappe rangee doive encore crier.
    preset: 'track',
    override: {
      width: 4,
      showScale: false,
      showScaleLabels: false,
      showNumeric: false,
      showNumericTop: false,
      showRMS: false,
      showPeakHold: false,
      showClipIndicator: true
    }
  },
  compact: {
    // Compact 40px track: 28px canvas (24px meter + 4px ticks), labels overlay
    preset: 'track',
    override: {
      width: 24,
      showScale: true,
      showScaleLabels: true,  // Labels drawn ON meter (Reaper style)
      showNumeric: false,
      showNumericTop: true,
      showRMS: true,
      showPeakHold: true,
      showClipIndicator: true
    }
  },
  normal: {
    preset: 'track',
    override: { width: 24, showScale: true, showScaleLabels: true, showNumeric: false, showNumericTop: true, showRMS: true, showPeakHold: true }
  },
  large: {
    preset: 'track',
    override: { width: 32, showScale: true, showScaleLabels: true, showNumeric: true, showNumericTop: true, showRMS: true, showPeakHold: true }
  }
};

// Les classes de taille que `setSize()` retire avant de poser la nouvelle.
// `normal` n'y figure pas : c'est le defaut, et il se dit par l'absence de
// classe (cf. `getClassNames()`).
const SIZE_CLASSES = ['audio-track--condensed', 'audio-track--compact', 'audio-track--large'];

// Marqueur d'enregistrement secondaire : la piste ecrit un second fichier.
// C'est une propriete de configuration, pas un etat de transport — d'ou un
// marqueur discret sur la ligne du numero, la seule du pied qui ne soit pas
// editable au clic (donc la seule qui ne bouge jamais sous le doigt).
const SECONDARY_REC_CLASS = 'audio-track--secondary-rec';
const SECONDARY_REC_TITLE = 'Secondary recording enabled';

// Le filet d'une tranche a qui personne n'a donne de couleur : un gris qui ne
// pretend rien. Il vit ici parce que deux chemins l'ecrivent — `render()` au
// premier rendu, `setColor()` ensuite — et que deux litteraux divergeraient.
const DEFAULT_STRIP_COLOR = '#333';

class AudioTrack {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      trackId: 1,
      size: 'normal',        // condensed | compact | normal | large
      location: 'P',         // code du site (premier niveau du lieu)
      sublocation: null,     // code de la salle (second niveau), optionnel
      locationLabel: null,   // le couple deja ecrit par l'hote — ce qui s'affiche
      language: 'FR',
      customName: null,      // optionnel (ex: "Speaker 1 FR") - prioritaire sur location/language
      secondaryRecordingEnabled: false,  // second fichier ecrit en parallele
      color: null,           // hex color pour le color strip (ex: "#ff5500"), null = gris neutre
      threshold: -30,
      gain: 0,
      pan: 0,
      mute: false,
      solo: false,
      trackState: 0,         // 0=IDLE, 1=ARMED, 2=RECORDING
      inBus: true,           // true = track est source du bus courant (controls visibles)
      onMuteToggle: null,
      onSoloToggle: null,
      onRecordToggle: null,  // Callback avec trackState (UInt32)
      onThresholdChange: null,
      onGainChange: null,
      onPanChange: null,
      onEnableBus: null,     // Callback quand user clique "+ Enable" (track pas dans le bus)
      onLocationClick: null,
      onLanguageClick: null,
      ...config
    };

    this.element = null;
    this.meter = null;
    this.buttonGroup = null;
    this.recordControl = null;
    this.thresholdRotary = null;
    this.gainRotary = null;
    this.panRotary = null;

    // Dirty-check cache for updateMetering (avoid useless DOM writes at 30Hz)
    this._lastTrackState = undefined;
    this._lastThresholdExceeded = undefined;
    this._lastGateState = undefined;
    this._lastDurationSec = undefined;

    // Geometrie de reference de `setSize()`, relevee une seule fois : sans elle
    // un aller-retour de taille derive (voir `setSize`). `undefined` dit
    // « pas encore relevee », et `__pendingSize` une bascule qui attend le
    // metre.
    this.__baseMeterHeight = undefined;
    this.__baseStripHeight = undefined;
    this.__pendingSize = null;

    // L'attente de geometrie d'une tranche nee masquee (voir `initMeter`).
    // `null` dit « rien en attente », jamais « pas de metre ».
    this.__meterWatch = null;

    this.render();
  }

  // ========================================================================
  // STATE DERIVATION (trackState → armed/recording)
  // 0=IDLE, 1=ARMED, 2=RECORDING (auto), 3=MANUAL_RECORDING
  // ========================================================================

  get armed() {
    return this.config.trackState >= 1;
  }

  get recording() {
    // RECORDING (2) ou MANUAL_RECORDING (3)
    return this.config.trackState === 2 || this.config.trackState === 3;
  }

  // ========================================================================
  // NAMING HELPERS (customName + lieu + langue)
  // ========================================================================

  /**
   * Les lignes du pied de tranche, derivees des champs d'identite.
   *
   * **Statique et pure** : ni `this`, ni DOM, ni echappement — c'est elle qui
   * se verifie sous `node --test`, la pose dans le document restant a
   * `applyTrackFields`. Les chaines rendues sont brutes, l'echappement se fait
   * a l'ecriture (`textContent`, ou `escape()` au premier rendu).
   *
   * **La tranche ne joint plus le couple elle-meme.** Elle l'a fait de #164 a
   * #175, et c'etait une seconde ecriture de la regle : l'hote en tient une, et
   * un separateur grave ici la contredisait des que l'installation en declarait
   * un autre. Une tranche n'a pas a savoir ce qu'est un lieu — elle recoit le
   * libelle deja ecrit, `locationLabel`, et l'affiche.
   *
   * `location` et `sublocation` restent dans la config parce que l'hote s'en
   * sert (identite du couple, menu de saisie) ; ils ne servent plus a
   * l'affichage. Sans `locationLabel`, la vue rend le site **seul** — jamais un
   * separateur invente.
   *
   * @param {Object} config - au moins {locationLabel, language, customName}
   * @returns {{customName: string|null, lang: string, location: string}}
   *   `location` porte le libelle a afficher. `customName` vaut `null` quand il
   *   n'y en a pas : la ligne n'existe alors pas dans le pied, elle n'y figure
   *   pas vide.
   */
  static namingView({ location, locationLabel, language, customName } = {}) {
    const custom = typeof customName === 'string' && customName.trim() ? customName : null;
    const label = typeof locationLabel === 'string' ? locationLabel : null;
    return {
      customName: custom,
      lang: language ?? '',
      location: label ?? (location ?? '')
    };
  }

  /**
   * Nom d'affichage prioritaire : customName si defini et non vide,
   * sinon fallback sur "lieu langue" — le lieu etant la contraction.
   * Match la logique Swift Track.displayName.
   */
  getCustomNameDisplay() {
    const view = AudioTrack.namingView(this.config);
    if (view.customName !== null) return this.escape(view.customName);

    // Fallback : lieu langue
    return this.escape(`${view.location} ${view.lang}`);
  }

  /**
   * Ligne meta sous le nom : lang + lieu contracte.
   * Meme si customName est defini, on affiche ces infos en petit en dessous.
   */
  getMetaDisplay() {
    const view = AudioTrack.namingView(this.config);
    return this.escape(`${view.lang} ${view.location}`);
  }

  escape(str) {
    // Escape HTML minimal pour injection innerHTML
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const track = document.createElement('div');
    track.className = this.getClassNames();
    track.dataset.trackId = this.config.trackId;

    // Color strip : couleur du groupe (ou defaut neutre)
    const stripColor = this.config.color || DEFAULT_STRIP_COLOR;
    track.style.setProperty('--track-color', stripColor);

    // Une tranche condensee reprend sa hauteur ici. `render()` remplace
    // l'element, donc jette le style en ligne que `setSize()` avait pose — et
    // le CSS de `condensed` ne declare aucune hauteur, deliberement. Sans cette
    // reprise, la tranche re-rendue (bascule de bus, cf. `setBusValues`)
    // s'ecrase a zero : `initMeter` mesure alors un conteneur nul, abandonne, et
    // la piste repliee perd la seule chose qu'elle montrait — son niveau.
    if (this.config.size === 'condensed' && this.__baseStripHeight) {
      track.style.height = `${this.__baseStripHeight}px`;
    }

    // Le pied se derive du meme calcul que la mise a jour partielle : deux
    // chemins d'ecriture, une seule regle d'affichage.
    const naming = AudioTrack.namingView(this.config);

    track.innerHTML = `
      <!-- Color Strip (5px, couleur groupe) -->
      <div class="audio-track__color-strip" style="background:${stripColor}"></div>

      <!-- VU Meter Section -->
      <div class="audio-track__meter">
        <div class="audio-track__meter-target"></div>
      </div>

      <!-- Control Section (M/S, Pan, Gain) ou bouton Enable si pas dans le bus -->
      <div class="audio-track__controls">
        ${this.config.inBus === false ? `
          <button class="audio-track__enable-bus">+ Enable</button>
        ` : `
          <div class="audio-track__buttons"></div>
          <div class="audio-track__pan"></div>
          <div class="audio-track__gain"></div>
        `}
      </div>

      <!-- Record Section (Threshold, REC button, Timer, LEDs) -->
      <div class="audio-track__record-section">
        <!-- Threshold Rotary (en haut de la section record) -->
        <div class="audio-track__threshold"></div>

        <!-- Record Control (REC button, Timer, LEDs en bas) -->
        <div class="audio-track__record"></div>
      </div>

      <!-- Naming Section -->
      <div class="audio-track__footer">
        <div class="audio-track__footer-item audio-track__custom-name"${naming.customName === null ? ' hidden' : ''}>${this.escape(naming.customName ?? '')}</div>
        <div class="audio-track__footer-item audio-track__lang">${this.escape(naming.lang)}</div>
        <div class="audio-track__footer-item audio-track__location">${this.escape(naming.location)}</div>
        <div class="audio-track__footer-item audio-track__number"${this.config.secondaryRecordingEnabled ? ` title="${SECONDARY_REC_TITLE}"` : ''}>#${String(this.config.trackId).padStart(3, '0')}</div>
      </div>
    `;

    if (this.element) {
      this.container.replaceChild(track, this.element);
    } else {
      this.container.appendChild(track);
    }

    this.element = track;

    // Les rotaries pointaient sur le DOM qu'on vient de remplacer : ils sont
    // recrees ci-dessous, ou n'existent pas dans ce mode (hors bus). Garder
    // une instance orpheline lui laisserait porter une autorite locale sur un
    // widget invisible.
    this.panRotary = null;
    this.gainRotary = null;
    this.thresholdRotary = null;

    // Initialize components
    this.initMeter();
    if (this.config.inBus !== false) {
      // Controls per-bus (M/S/Pan/Gain) — seulement si track est source du bus
      this.initButtonGroup();
      this.initPan();
      this.initGainRotary();
    } else {
      // Bouton "+ Enable" — track pas dans le bus courant
      const enableBtn = this.element.querySelector('.audio-track__enable-bus');
      if (enableBtn) {
        enableBtn.addEventListener('click', () => {
          if (this.config.onEnableBus) this.config.onEnableBus();
        });
      }
    }
    // Threshold + Record : toujours visibles (track-level, pas per-bus)
    this.initThresholdRotary();
    this.initRecordControl();
    this.setupEventListeners();
  }

  getClassNames() {
    const classes = ['audio-track'];

    // Size modifier
    if (this.config.size !== 'normal') {
      classes.push(`audio-track--${this.config.size}`);
    }

    // State modifiers (derived from trackState)
    if (this.armed) classes.push('audio-track--armed');
    if (this.recording) classes.push('audio-track--recording');

    // Enregistrement secondaire : marqueur permanent, pas un etat de transport
    if (this.config.secondaryRecordingEnabled) classes.push(SECONDARY_REC_CLASS);

    return classes.join(' ');
  }

  initMeter() {
    const meterTarget = this.element.querySelector('.audio-track__meter-target');
    if (!meterTarget) return;

    // Un rendu precedent peut avoir laisse une attente sur le conteneur qu'on
    // vient de remplacer : elle poserait un metre dans un noeud orphelin.
    this._stopAwaitingMeterGeometry();

    // RAF guard - ensure layout complete before measuring (Chrome flexbox timing)
    requestAnimationFrame(() => {
      if (!this._buildMeter(meterTarget)) this._awaitMeterGeometry(meterTarget);
    });
  }

  /**
   * Pose le metre, si le conteneur a de quoi le mesurer.
   *
   * `false` ne dit pas « rate » mais « pas maintenant » : c'est l'appelant qui
   * decide d'attendre. Le metre prend la hauteur disponible, donc une mesure
   * nulle donnerait un canvas nul — invisible, et definitif.
   *
   * @returns {boolean} vrai si le metre est desormais en place
   * @private
   */
  _buildMeter(meterTarget) {
    const availableHeight = meterTarget.offsetHeight;
    const availableWidth = meterTarget.offsetWidth;
    if (availableHeight <= 0 || availableWidth <= 0) return false;

    // Get meter config based on track size mode
    const meterConfig = METER_CONFIG_BY_MODE[this.config.size] || METER_CONFIG_BY_MODE.normal;

    // Create CanvasMeter instance
    this.meter = new CanvasMeter(meterTarget, {
      preset: meterConfig.preset,
      ...meterConfig.override,
      // Override height to match available space
      height: availableHeight,
      context: 'track'
    });

    // Add threshold indicator (overlay, separate from meter)
    this.addThresholdIndicator();

    // Une bascule de taille arrivee avant ce RAF s'est mise en attente :
    // la geometrie de reference peut maintenant se relever.
    if (this.__pendingSize) {
      const pending = this.__pendingSize;
      this.__pendingSize = null;
      this.setSize(pending);
    }

    return true;
  }

  /**
   * Attend que le conteneur ait une geometrie, et pose le metre a ce moment-la.
   *
   * **Une tranche naît regulierement sans geometrie** : sa grappe est repliee au
   * chargement (`display: none` sur le corps de la section), ou son ecran est
   * derriere un onglet. `offsetHeight` vaut alors 0 — et la version qui
   * abandonnait sur un avertissement laissait la tranche **sans metre pour
   * toujours** : deplier la grappe ne construisait rien, et il fallait recharger
   * la page pour voir un niveau. Ce n'etait pas une peinture qui manquait, il
   * n'y avait pas de canvas a peindre.
   *
   * L'observateur se retire des qu'il a servi : une tranche ne naît qu'une fois,
   * et ce qui suit — le repli, la bascule de taille — passe par `setSize()`.
   *
   * @private
   */
  _awaitMeterGeometry(meterTarget) {
    if (typeof ResizeObserver === 'undefined') {
      console.warn('AudioTrack: meter skipped - zero dimensions, no ResizeObserver');
      return;
    }

    this.__meterWatch = new ResizeObserver(() => {
      if (meterTarget.offsetHeight <= 0 || meterTarget.offsetWidth <= 0) return;

      // Se retirer AVANT de construire : le canvas se pose dans le conteneur
      // observe, donc le redimensionne — s'observer soi-meme en train d'ecrire
      // relancerait la boucle que le navigateur signale.
      this._stopAwaitingMeterGeometry();
      this._buildMeter(meterTarget);
    });
    this.__meterWatch.observe(meterTarget);
  }

  /** Retire l'attente de geometrie, s'il y en a une. @private */
  _stopAwaitingMeterGeometry() {
    if (!this.__meterWatch) return;
    this.__meterWatch.disconnect();
    this.__meterWatch = null;
  }

  addThresholdIndicator() {
    const container = this.element.querySelector('.audio-track__meter-target');
    if (!container) return;

    // Ensure container has relative positioning for absolute threshold indicator
    container.style.position = 'relative';

    const triangle = document.createElement('div');
    triangle.className = 'audio-track__threshold-indicator';
    container.appendChild(triangle);

    this.updateThresholdIndicatorPosition();
  }

  updateThresholdIndicatorPosition() {
    const triangle = this.element.querySelector('.audio-track__threshold-indicator');
    if (!triangle) return;

    // Get range from meter config or use defaults
    const dbMin = this.meter?.config?.minDB ?? -60;
    const dbMax = this.meter?.config?.maxDB ?? 0;
    const threshold = this.config.threshold;

    // Calculate percentage within dB range
    let percent;
    if (threshold <= dbMin) {
      percent = 0;
    } else if (threshold >= dbMax) {
      percent = 100;
    } else {
      percent = ((threshold - dbMin) / (dbMax - dbMin)) * 100;
    }

    // Get meter dimensions from CanvasMeter instance
    // Layout from top to bottom:
    // - numericTopHeight (14px if showNumericTop)
    // - clipHeight (4px if showClipIndicator)
    // - barHeight (rest of meterHeight minus clipHeight)
    if (this.meter) {
      const numericTopHeight = this.meter._numericTopHeight || 0;
      const clipHeight = this.meter.config.showClipIndicator ? 4 : 0;
      const meterHeight = this.meter._meterHeight;
      const barHeight = meterHeight - clipHeight;
      const barStartY = numericTopHeight + clipHeight;

      // Position from top: barStartY + barHeight * (1 - percent/100)
      // At 0 dB (100%), position = barStartY (top of bar)
      // At -60 dB (0%), position = barStartY + barHeight (bottom of bar)
      const posFromTop = barStartY + barHeight * (1 - percent / 100);
      triangle.style.top = `${posFromTop}px`;
      triangle.style.bottom = 'auto';
    } else {
      // Fallback to percentage if meter not ready
      triangle.style.bottom = `${percent}%`;
      triangle.style.top = 'auto';
    }
  }

  initButtonGroup() {
    const buttonsContainer = this.element.querySelector('.audio-track__buttons');
    if (!buttonsContainer) return;

    this.buttonGroup = new ButtonGroup(buttonsContainer, {
      size: this.config.size,
      buttonSize: this.config.size === 'compact' ? 'compact' : 'normal',
      states: {
        mute: this.config.mute || false,
        solo: this.config.solo || false
      },
      onToggle: (buttonId, active) => this.handleButtonToggle(buttonId, active)
    });
  }

  initPan() {
    const panContainer = this.element.querySelector('.audio-track__pan');
    if (!panContainer) return;

    // Pan Rotary - visible in ALL modes (compact, normal, large)
    // Preparation for sends-on-faders (Epic C)
    const rotaryContainer = document.createElement('div');
    panContainer.appendChild(rotaryContainer);
    // Unites : l'API publique de AudioTrack (config.pan, onPanChange,
    // setBusValues, setPan) parle la meme langue que le backend, -1.0 a +1.0.
    // Le preset 'pan' du Rotary, lui, travaille en pourcents (-100 a +100).
    // La conversion vit donc ici, aux deux frontieres du composant — sans quoi
    // un pan serveur de -1.0 s'affichait "L1" (1 % a gauche) et un drag
    // envoyait 17 la ou le backend attend 0.17. Meme conversion que
    // bus-ui.js pour les rotaries du panneau bus.
    this.panRotary = new Rotary(rotaryContainer, {
      preset: 'pan',
      label: '',  // Label "PAN" masque - spec AUDIOTRACK-UI MVP
      value: AudioTrack._panToPercent(this.config.pan),
      onInput: (percent) => {
        this.config.pan = AudioTrack._percentToPan(percent);
        if (this.config.onPanChange) {
          this.config.onPanChange(this.config.pan, { realtime: true });
        }
      },
      onChange: (percent) => {
        this.config.pan = AudioTrack._percentToPan(percent);
        if (this.config.onPanChange) {
          this.config.onPanChange(this.config.pan);
        }
      }
    });
  }

  initThresholdRotary() {
    // Threshold Rotary (track-level, toujours visible, section record)
    const thresholdContainer = this.element.querySelector('.audio-track__threshold');
    if (thresholdContainer) {
      this.thresholdRotary = new Rotary(thresholdContainer, {
        preset: 'threshold',
        label: '',  // Label "THR" masque - spec AUDIOTRACK-UI MVP
        value: this.config.threshold,
        onInput: (value, options) => {
          this.config.threshold = value;
          this.updateThresholdIndicatorPosition();
          if (options?.altKey && this.config.onThresholdChange) {
            this.config.onThresholdChange(value, { altKey: true, realtime: true });
          }
        },
        onChange: (value, options) => {
          this.config.threshold = value;
          this.updateThresholdIndicatorPosition();
          if (this.config.onThresholdChange) {
            this.config.onThresholdChange(value, { altKey: options?.altKey || false });
          }
        }
      });
    }
  }

  initGainRotary() {
    // Gain Rotary (per-bus, section control, sous le Pan)
    const gainContainer = this.element.querySelector('.audio-track__gain');
    if (gainContainer) {
      this.gainRotary = new Rotary(gainContainer, {
        preset: 'gain',
        label: '',  // Label "GAIN" masque - spec AUDIOTRACK-UI MVP
        value: this.config.gain,
        onInput: (value) => {
          this.config.gain = value;
          if (this.config.onGainChange) {
            this.config.onGainChange(value, { realtime: true });
          }
        },
        onChange: (value) => {
          this.config.gain = value;
          if (this.config.onGainChange) {
            this.config.onGainChange(value);
          }
        }
      });
    }
  }

  initRecordControl() {
    const recordContainer = this.element.querySelector('.audio-track__record');
    if (!recordContainer) return;

    this.recordControl = new RecordControl(recordContainer, {
      armed: this.armed,
      recording: this.recording,
      thresholdExceeded: false,
      onStateChange: (state) => {
        // Convert armed/recording → trackState for backend
        // 0=IDLE, 1=ARMED, 2=RECORDING (auto), 3=MANUAL_RECORDING
        let newTrackState = 0; // IDLE

        if (state.manualRecording === true) {
          newTrackState = 3; // MANUAL_RECORDING (force record, ignore threshold)
        } else if (state.recording) {
          newTrackState = 2; // RECORDING (auto threshold)
        } else if (state.armed) {
          newTrackState = 1; // ARMED
        }

        // Note: on ne met plus à jour this.config.trackState ici
        // L'UI sera mise à jour par le WebSocket (flux unidirectionnel)

        if (this.config.onRecordToggle) {
          this.config.onRecordToggle(newTrackState);
        }
      }
    });
  }

  setupEventListeners() {
    // Footer clicks
    const langEl = this.element.querySelector('.audio-track__lang');
    const locationEl = this.element.querySelector('.audio-track__location');

    if (langEl) {
      langEl.addEventListener('click', (e) => {
        if (this.config.onLanguageClick) {
          this.config.onLanguageClick(this.config.language, e.currentTarget);
        }
      });
    }

    if (locationEl) {
      locationEl.addEventListener('click', (e) => {
        if (this.config.onLocationClick) {
          // La **contraction**, pas le seul code de site : c'est ce que la
          // ligne affiche, donc ce que le menu doit reconnaitre pour marquer
          // le lieu courant comme selectionne (issue #164).
          this.config.onLocationClick(
            AudioTrack.namingView(this.config).location, e.currentTarget
          );
        }
      });
    }
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  handleButtonToggle(buttonId, active) {
    if (buttonId === 'mute') {
      this.config.mute = active;
      if (this.config.onMuteToggle) {
        this.config.onMuteToggle(active);
      }
    } else if (buttonId === 'solo') {
      this.config.solo = active;
      if (this.config.onSoloToggle) {
        this.config.onSoloToggle(active);
      }
    }
    // Note: monitor supprime du MVP (voir spec AUDIOTRACK-UI.md).
    // Rien n'est fait en local pour les autres buttonId (phase, etc.) - ajouter ici si besoin.
  }

  updateRecordState() {
    // Update track-level classes (derived from trackState)
    this.element.classList.toggle('audio-track--armed', this.armed);
    this.element.classList.toggle('audio-track--recording', this.recording);
  }

  /**
   * Met a jour les valeurs per-bus (gain/pan/mute/solo) et le mode inBus.
   * Appele par switchBus() et onEnableBus() sans re-render complet.
   * Si inBus change, re-render la section controls (swap enable button / rotaries).
   *
   * @param {Object} [options]
   * @param {boolean} [options.rebind=false] - true quand les rotaries changent
   *   de sujet (switch de bus) : l'autorite locale acquise sur l'ancien bus
   *   n'a plus lieu d'etre, l'echo attendu ne concerne plus ce qu'ils editent.
   */
  setBusValues(gain, pan, mute, solo, inBus, options = {}) {
    const wasInBus = this.config.inBus;
    this.config.mute = mute;
    this.config.solo = solo;
    this.config.inBus = inBus;

    if (options.rebind) {
      if (this.panRotary) this.panRotary.resetLocalAuthority();
      if (this.gainRotary) this.gainRotary.resetLocalAuthority();
    }

    if (wasInBus !== inBus) {
      // Mode change : re-render complet necessaire (swap enable/controls)
      this.config.gain = gain;
      this.config.pan = pan;
      this.render();
      return;
    }

    // Update in-place si meme mode. externalSync() rend false quand le rotary
    // garde l'autorite locale (geste en cours, ou echo pas encore revenu) :
    // l'etat interne ne bouge pas non plus dans ce cas — cf. contrat #43.
    this.setPan(pan);
    this.setGain(gain);

    if (inBus && this.buttonGroup) {
      this.buttonGroup.setState('mute', mute);
      this.buttonGroup.setState('solo', solo);
    }
  }

  /**
   * Set gain value externally (e.g. from WebSocket bus source sync).
   * Soumis a l'autorite locale du rotary : si le rotary refuse l'entrant,
   * config.gain n'est pas ecrit non plus.
   * @param {number} value - Gain value in dB
   */
  setGain(value) {
    if (this.gainRotary && !this.gainRotary.externalSync(value)) return;
    this.config.gain = value;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  updateMetering(peak, rms, trackState, thresholdExceeded, gateState, recordingDurationSeconds, clip, peakHold, truePeak, ppm) {
    // Canvas meter: always update (audio values change continuously)
    if (this.meter) {
      // CanvasMeter uses setValues() with all available metrics from backend
      // All values are pre-calculated in dB by backend
      this.meter.setValues({
        peak: peak,
        rms: rms,
        clip: clip || false,
        peakHold: peakHold,
        truePeak: truePeak,
        ppm: ppm
      });
    }

    // Dirty-check: skip DOM work unless backend state actually changed.
    // Without this, 30Hz updates x N tracks saturate the main thread with
    // useless className/textContent rewrites and starve user input handlers
    // (pointermove on rotaries, click on buttons). See FIX-FRONTEND-BUTTON-LAG.md

    // Track state (IDLE/ARMED/RECORDING) - only touches DOM on transition
    if (trackState !== undefined && trackState !== this._lastTrackState) {
      this._lastTrackState = trackState;
      this.config.trackState = trackState;
      this.updateRecordState();

      if (this.recordControl) {
        this.recordControl.setState(this.armed, this.recording);
      }
    }

    // Threshold LED - update only when exceeded or gateState changes
    if (thresholdExceeded !== undefined && this.recordControl &&
        (thresholdExceeded !== this._lastThresholdExceeded ||
         gateState !== this._lastGateState)) {
      this._lastThresholdExceeded = thresholdExceeded;
      this._lastGateState = gateState;
      this.recordControl.setThresholdExceeded(thresholdExceeded, gateState);
    }

    // Timer - update only when integer seconds change (display is mm:ss)
    if (recordingDurationSeconds !== undefined && this.recordControl) {
      const intSec = Math.floor(recordingDurationSeconds);
      if (intSec !== this._lastDurationSec) {
        this._lastDurationSec = intSec;
        this.recordControl.setDuration(recordingDurationSeconds);
      }
    }
  }

  paintMeter() {
    if (this.meter) {
      this.meter.paint();
    }
  }

  /**
   * Applique les champs d'identite d'une piste **sans reconstruire la tranche**.
   *
   * `render()` remplace l'element et recree les rotaries : appele sur l'echo
   * d'un autre poste, il detruirait sous le doigt le widget qui porte
   * l'autorite locale (contrat #43). D'ou l'ecriture chirurgicale — quelques
   * `textContent`, une classe, et rien d'autre. Aucun rotary, aucun meter,
   * aucun bouton n'est touche.
   *
   * Une cle absente de `fields` ne change rien ; une cle a `null` efface —
   * c'est ce que le backend diffuse pour un effacement (`NSNull` cote Swift,
   * cf. `TrackRoutes.swift`), et `null` n'est pas `undefined`.
   *
   * Rien n'est ecrit dans le document quand rien ne change : le metering
   * republie la piste entiere a 30-60 Hz par `TrackManager.updateTrack`, donc
   * l'echo arrive en boucle et le filtre en tete est ce qui l'empeche de
   * couter quoi que ce soit.
   *
   * @param {Object} fields - sous-ensemble de `AudioTrack.SYNCED_FIELDS`
   * @returns {string[]} les champs reellement appliques (vide si aucun)
   */
  applyTrackFields(fields = {}) {
    const changed = AudioTrack.changedTrackFields(this.config, fields);
    const keys = Object.keys(changed);
    if (keys.length === 0) return keys;

    Object.assign(this.config, changed);

    if (keys.some(key => key !== 'secondaryRecordingEnabled')) this.paintNaming();
    if ('secondaryRecordingEnabled' in changed) this.paintSecondaryRecording();

    return keys;
  }

  /** Les champs d'identite qu'une tranche rend, et qu'`applyTrackFields` lit. */
  static get SYNCED_FIELDS() {
    return [
      'location', 'sublocation', 'locationLabel',
      'language', 'customName', 'secondaryRecordingEnabled'
    ];
  }

  /**
   * Le sous-ensemble de `fields` qui change vraiment quelque chose.
   *
   * Statique et pure : c'est le filtre anti-echo, et il se verifie sans DOM.
   * Une cle hors de `SYNCED_FIELDS` est ignoree — la tranche ne rend que ce
   * qu'elle sait rendre, et `TrackManager` lui passe la piste entiere.
   *
   * @param {Object} config - config courante de la tranche
   * @param {Object} fields - champs entrants
   * @returns {Object} les changements, `{}` si l'entrant ne dit rien de neuf
   */
  static changedTrackFields(config = {}, fields = {}) {
    const changed = {};
    for (const key of AudioTrack.SYNCED_FIELDS) {
      if (fields[key] === undefined) continue;
      const value = key === 'secondaryRecordingEnabled' ? !!fields[key] : fields[key];
      if (value === config[key]) continue;
      changed[key] = value;
    }
    return changed;
  }

  /**
   * Ecrit les lignes du pied.
   *
   * **N'ecrit que dans des noeuds qui existent deja** — pas de `document`, pas
   * de creation, pas de retrait. C'est ce qui la rend verifiable sous
   * `node --test` (issue #132) : un peintre qui appellerait
   * `document.createElement` exigerait un DOM simule pour etre exerce, et ne
   * serait donc couvert par rien. La ligne de nom personnalise vit en
   * permanence dans le pied ; c'est son attribut `hidden` qui varie, pas son
   * existence — et `render()` pose exactement le meme etat de depart.
   */
  paintNaming() {
    const footer = this.element?.querySelector('.audio-track__footer');
    if (!footer) return;

    const view = AudioTrack.namingView(this.config);

    const langEl = footer.querySelector('.audio-track__lang');
    if (langEl) langEl.textContent = view.lang;

    const locationEl = footer.querySelector('.audio-track__location');
    if (locationEl) locationEl.textContent = view.location;

    const customEl = footer.querySelector('.audio-track__custom-name');
    if (!customEl) return;
    // Un nom absent n'est pas une ligne vide : `[hidden]` la sort du flux, donc
    // le pied ne garde ni interligne ni cible de survol pour rien.
    customEl.textContent = view.customName ?? '';
    customEl.hidden = view.customName === null;
  }

  /**
   * Pose la couleur du filet — **sans reconstruire la tranche**.
   *
   * La couleur suit la grappe qui tient la piste, et la grappe change des que
   * l'ecran change d'axe de rangement. Passer par `render()` recreerait les
   * rotaries, donc detruirait sous le doigt l'autorite locale d'un geste en
   * cours (contrat #43) — pour un changement qui ne pese que deux ecritures.
   *
   * Deux ecritures, aucune creation ni retrait : la propriete personnalisee,
   * que le pied lit pour teinter le numero, et le fond du filet. Sans couleur,
   * le gris neutre — jamais une chaine vide, qui laisserait un filet
   * transparent.
   *
   * La couleur passe aussi par `config`, et pas seulement par le document : un
   * `render()` ulterieur — changement de bus, par exemple — repose alors la
   * meme, au lieu de revenir au gris.
   *
   * Ce que l'appelant donne fait autorite : la tranche ne derive rien. C'est ce
   * qui laisse la couleur de grappe n'etre qu'un **defaut surchargeable**, le
   * jour ou le moteur portera une couleur propre a la piste.
   *
   * @param {string|null} color - hex (ex: `#4a7ee0`), ou `null` pour le neutre
   */
  setColor(color) {
    this.config.color = color || null;
    if (!this.element) return;

    const stripColor = this.config.color || DEFAULT_STRIP_COLOR;
    this.element.style.setProperty('--track-color', stripColor);

    const strip = this.element.querySelector('.audio-track__color-strip');
    if (strip) strip.style.background = stripColor;
  }

  /**
   * Change la taille de la tranche — **sans la reconstruire**.
   *
   * Trois ecritures et pas une de plus : la classe de taille, la hauteur, la
   * config du metre. Jamais `render()`, donc jamais un rotary detruit sous le
   * doigt (contrat #43) — en `condensed` ils sont masques par le CSS, leurs
   * noeuds restent dans le document, et revenir ne recree rien.
   *
   * Elle est **idempotente**, et son hote en depend : redire la taille en place
   * ne coute rien, parce qu'elle est redite a chaque rangement pour chaque
   * tranche (voir la garde en tete du corps).
   *
   * La geometrie de reference se releve **une fois**, a la premiere bascule,
   * tant que la tranche porte encore sa taille de depart : la hauteur de son
   * metre et la hauteur de la tranche entiere. Tout le reste s'y cale.
   *
   * PIEGE : on ne peut pas remesurer le conteneur du metre a chaque bascule.
   * Une fois le canvas pose, c'est LUI qui donne sa hauteur au conteneur, et
   * `_createCanvas()` y ajoute la reserve de `showNumericTop` — chaque
   * aller-retour gonflait alors la tranche d'autant (mesure sur prototype :
   * 393, 407, 421...). D'ou une hauteur posee en style en ligne et un
   * `clientHeight` qui, sur cette hauteur-la, est deterministe.
   *
   * En `condensed` le metre **remplit** la tranche, il ne reprend pas la
   * hauteur du metre compact : la consequence assumee est que l'echelle en dB
   * n'est plus celle d'une grappe ouverte voisine. Fermee, on lit « il y a du
   * signal », pas « combien ».
   *
   * Aucun 14 n'est grave ici : la reserve que `showNumericTop` prend en tete du
   * canvas est une interface interne de `CanvasMeter`, et le seul endroit qui
   * en a besoin la relit sur l'instance (`_numericTopHeight`, cf.
   * `updateThresholdIndicatorPosition`). Une variante qui voudrait caler les
   * deux echelles fera pareil.
   *
   * `condensed` se rejoint par cette methode, **jamais a la construction** :
   * c'est la tranche ouverte qui porte la geometrie de reference, et une
   * tranche nee condensee n'en a aucune a relever.
   *
   * @param {'condensed'|'compact'|'normal'|'large'} size
   */
  setSize(size) {
    const el = this.element;
    if (!el) return;

    // Une taille deja posee ne se repose pas, et ce n'est pas une economie de
    // detail : la suite lit `clientHeight` — donc force un calcul de mise en
    // page — et refait le canvas du metre. L'hote redit sa taille a **chaque**
    // tranche a chaque rangement (cf. `paintSection` cote MR3), et sur l'axe
    // de l'etat un rangement part a chaque transition : 256 calculs de mise en
    // page forces pour 256 tranches qui n'ont pas change de taille.
    //
    // La bascule en attente s'efface avec, sinon elle arriverait apres coup :
    // une tranche condensee avant que son metre n'existe, puis depliee dans le
    // meme souffle, verrait le `condensed` en attente se poser au RAF — sur une
    // section desormais ouverte.
    if (this.config.size === size) {
      this.__pendingSize = null;
      return;
    }

    // Le metre naît dans un RAF (garde de layout Chrome). Une bascule qui
    // arrive avant lui — un hote qui rend un ecran deja replie, par exemple —
    // ne peut rien relever : elle attend ce RAF plutot que de condenser une
    // tranche dont la geometrie de reference serait alors prise **condensee**,
    // donc fausse pour toujours.
    if (!this.meter) {
      this.__pendingSize = size;
      return;
    }

    if (this.__baseMeterHeight === undefined) {
      this.__baseMeterHeight = this.meter.config.height;
      this.__baseStripHeight = Math.round(el.getBoundingClientRect().height);
    }

    SIZE_CLASSES.forEach(cls => el.classList.remove(cls));
    if (size !== 'normal') el.classList.add(`audio-track--${size}`);
    this.config.size = size;

    // La tranche condensee prend la hauteur qu'elle avait : sinon une grappe
    // fermee et une grappe ouverte ne commencent ni ne finissent au meme
    // endroit, et la mise en page saute a chaque bascule.
    el.style.height = (size === 'condensed' && this.__baseStripHeight)
      ? `${this.__baseStripHeight}px`
      : '';

    const colorStrip = el.querySelector('.audio-track__color-strip');
    const fullHeight = el.clientHeight - (colorStrip?.offsetHeight ?? 0);
    const mode = METER_CONFIG_BY_MODE[size] || METER_CONFIG_BY_MODE.normal;

    this.meter.setConfig(size === 'condensed'
      ? { ...mode.override, height: fullHeight }
      : { ...mode.override, height: this.__baseMeterHeight });

    // PIEGE : `setConfig()` appelle `_createCanvas()`, qui fait
    // `container.innerHTML = ''`. Le triangle de seuil vit dans ce meme
    // conteneur — il vient d'etre efface, il faut le reposer.
    if (size !== 'condensed') this.addThresholdIndicator();
  }

  /** Pose ou retire le marqueur d'enregistrement secondaire. */
  paintSecondaryRecording() {
    if (!this.element) return;
    const on = this.config.secondaryRecordingEnabled === true;
    this.element.classList.toggle(SECONDARY_REC_CLASS, on);

    const numberEl = this.element.querySelector('.audio-track__number');
    if (!numberEl) return;
    if (on) numberEl.title = SECONDARY_REC_TITLE;
    else numberEl.removeAttribute('title');
  }

  updateLocation(location, sublocation, locationLabel) {
    // Passe par le chemin partiel : la ligne porte le **libelle** du couple, et
    // l'ecrire a la main y perdait la salle.
    //
    // La salle et le libelle ne s'ecrivent que si l'appelant les donne :
    // `undefined` veut dire « je ne parle que du site », et `null` « efface ».
    // La tranche ne fabrique pas le libelle a partir des codes — elle ne connait
    // pas la convention de l'installation (issue #175).
    const fields = { location };
    if (sublocation !== undefined) fields.sublocation = sublocation;
    if (locationLabel !== undefined) fields.locationLabel = locationLabel;
    this.applyTrackFields(fields);
  }

  updateLanguage(language) {
    this.applyTrackFields({ language });
  }

  /**
   * Set threshold value (global threshold feature + WS sync).
   *
   * Le widget a trois faces — le bouton du rotary, l'indicateur sur le meter,
   * et config.threshold — qui doivent bouger ensemble ou pas du tout. La
   * decision appartient au rotary : tant qu'il garde l'autorite locale, rien
   * ne bouge, sinon le bouton suit le doigt pendant que l'indicateur saute a
   * la valeur de l'echo (issue #43).
   *
   * @param {number} value - Threshold in dB
   * @param {Object} [options]
   * @param {boolean} [options.local=false] - true : ecriture locale (apply
   *   global Alt+drag), appliquee sans garde et protegee de l'echo ;
   *   false : valeur entrante serveur, soumise a l'autorite locale.
   */
  setThreshold(value, options = {}) {
    if (this.thresholdRotary) {
      if (options.local) {
        this.thresholdRotary.commitLocalValue(value);
      } else if (!this.thresholdRotary.externalSync(value)) {
        return;
      }
    }
    this.config.threshold = value;
    this.updateThresholdIndicatorPosition();
  }

  /**
   * Set pan value externally (e.g. from WebSocket bus source update).
   * Soumis a l'autorite locale du rotary, comme setGain/setThreshold.
   * @param {number} value - Pan value (-1.0 L .. 0.0 C .. +1.0 R), unite backend
   */
  setPan(value) {
    if (this.panRotary && !this.panRotary.externalSync(AudioTrack._panToPercent(value))) return;
    this.config.pan = value;
  }

  /**
   * Conversions entre l'unite backend du pan (-1.0 a +1.0) et l'unite du
   * Rotary preset 'pan' (-100 a +100, pas de 1).
   * @private
   */
  static _panToPercent(pan) {
    return Math.round((pan ?? 0) * 100);
  }

  static _percentToPan(percent) {
    return (percent ?? 0) / 100;
  }

  destroy() {
    // Avant le metre : une attente survivante rouvrirait un metre sur une
    // tranche qu'on vient de defaire.
    this._stopAwaitingMeterGeometry();

    if (this.meter) {
      this.meter.destroy();
      this.meter = null;
    }

    if (this.buttonGroup) {
      this.buttonGroup.destroy();
      this.buttonGroup = null;
    }

    if (this.recordControl) {
      this.recordControl.destroy();
      this.recordControl = null;
    }

    if (this.thresholdRotary) {
      this.thresholdRotary.destroy();
      this.thresholdRotary = null;
    }

    if (this.gainRotary) {
      this.gainRotary.destroy();
      this.gainRotary = null;
    }

    if (this.panRotary) {
      this.panRotary.destroy();
      this.panRotary = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.AudioTrack = AudioTrack;
}

// Export for module usage
export default AudioTrack;

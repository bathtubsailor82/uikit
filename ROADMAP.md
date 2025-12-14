# UIKit Roadmap

Plan de developpement des composants manquants.

---

## Phase 1 - Atomes essentiels [COMPLETE]

### 1.1 Icons manquantes
**Fichier:** `css/components/icons.css`

| Categorie | Icones a ajouter |
|-----------|------------------|
| Navigation | `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right` |
| Actions | `close`, `check`, `plus`, `minus`, `edit`, `trash`, `copy`, `download`, `upload`, `refresh` |
| Media | `pause`, `skip-forward`, `skip-back`, `rewind`, `fast-forward`, `loop`, `shuffle` |
| UI | `menu`, `more-vertical`, `more-horizontal`, `expand`, `collapse`, `search`, `filter`, `sort` |
| Feedback | `info-circle`, `warning-triangle`, `error-circle`, `success-circle` |

### 1.2 Range/Slider
**Fichier:** `css/components/range.css`

- [x] Style de base pour `input[type="range"]`
- [x] Variantes : horizontal, vertical
- [x] Tailles : sm, md, lg
- [x] Track et thumb personnalises
- [x] Support des couleurs (primary, success, warning, danger)
- [x] Affichage de valeur optionnel
- [x] Dark mode

### 1.3 Divider
**Fichier:** `css/components/divider.css`

- [x] Separateur horizontal
- [x] Separateur vertical
- [x] Avec texte centre (ex: "ou")
- [x] Variantes : solid, dashed, dotted
- [x] Espacements configurables

---

## Phase 2 - Ameliorations composants existants [COMPLETE]

### 2.1 Buttons - Variantes manquantes
**Fichier:** `css/components/buttons.css`

- [x] `btn-warning` - Bouton orange/jaune
- [x] `btn-outline-primary`, `btn-outline-danger`, etc.
- [x] `btn-pill` - Bords completement arrondis

### 2.2 Badges - Types manquants
**Fichier:** `css/components/badges.css`

- [x] Badge dot (point de notification sans texte)
- [x] Badge count (compact pour nombres)
- [x] Badge pill (arrondi)
- [x] Badge avec icone
- [x] Badge removable (avec bouton X)

### 2.3 Segmented Control
**Fichier:** `css/components/segmented.css`

- [x] Groupe de boutons mutuellement exclusifs
- [x] Style iOS/macOS
- [x] Tailles : sm, md, lg
- [x] Support icones
- [x] Animation de selection

### 2.4 Tooltip ameliore
**Fichier:** `css/components/tooltip.css`

- [x] Positions : top, bottom, left, right
- [x] Fleche pointant vers l'element
- [x] Variantes de couleur
- [x] Delai configurable (CSS custom properties)

### 2.5 Dropdown ameliore
**Fichier:** `css/components/dropdown.css`

- [x] Support sous-menus
- [x] Items avec icones
- [x] Items avec description
- [x] Separateurs de groupe
- [x] Header de section

---

## Phase 3 - Composants formulaire avances [COMPLETE]

### 3.1 Number Input
**Fichier:** `css/components/number-input.css`

- [x] Input avec boutons +/-
- [x] Tailles : sm, md, lg
- [x] Variante compacte (boutons cote a cote)
- [x] Variante verticale (boutons empiles)

### 3.2 Tag Input
**Fichier:** `css/components/tags.css`

- [x] Tag/chip de base
- [x] Tag removable
- [x] Tag avec icone
- [x] Variantes de couleur
- [x] Tag input (champ multi-selection)

### 3.3 File Input
**Fichier:** `css/components/file-input.css`

- [x] Style pour input type="file"
- [x] Zone de drop (drag & drop)
- [x] Apercu de fichier
- [x] Liste de fichiers selectionnes

---

## Phase 4 - Composants audio

### 4.1 Knob/Rotary
**Fichier:** `js/knob.js` + `css/components/knob.css`

- [ ] Potentiometre rotatif SVG
- [ ] Tailles : sm, md, lg, xl
- [ ] Indicateur de valeur (arc, ligne, point)
- [ ] Affichage numerique optionnel
- [ ] Support souris + touch + clavier
- [ ] Presets : volume, pan, EQ
- [ ] Dark mode

### 4.2 Transport Bar
**Fichier:** `css/components/transport.css`

- [ ] Barre de controles transport
- [ ] Boutons : play, pause, stop, record, loop
- [ ] Etats actifs (recording, playing, looping)
- [ ] Variantes : minimal, standard, full

### 4.3 Time Display
**Fichier:** `css/components/time-display.css`

- [ ] Affichage timecode (00:00:00.000)
- [ ] Formats : hh:mm:ss, mm:ss, samples, bars:beats
- [ ] Style LCD/7-segments optionnel
- [ ] Tailles configurables

### 4.4 Waveform
**Fichier:** `js/waveform.js` + `css/components/waveform.css`

- [ ] Affichage forme d'onde Canvas
- [ ] Mode statique (fichier charge)
- [ ] Couleurs personnalisables
- [ ] Curseur de position
- [ ] Selection de region
- [ ] Zoom horizontal

### 4.5 Channel Strip
**Fichier:** `css/components/channel-strip.css`

- [ ] Combinaison fader + meter + mute/solo
- [ ] Orientation verticale
- [ ] Label de canal
- [ ] Indicateur de clip

### 4.6 Spectrum Analyzer
**Fichier:** `js/spectrum.js` + `css/components/spectrum.css`

- [ ] Visualisation FFT Canvas
- [ ] Modes : bars, line, filled
- [ ] Echelle logarithmique/lineaire
- [ ] Couleurs personnalisables

---

## Phase 5 - Composants UI supplementaires

### 5.1 Stepper
**Fichier:** `css/components/stepper.css`

- [ ] Indicateur d'etapes numerotees
- [ ] Etats : completed, active, pending
- [ ] Orientation : horizontal, vertical
- [ ] Avec descriptions

### 5.2 Timeline
**Fichier:** `css/components/timeline.css`

- [ ] Chronologie verticale
- [ ] Points avec icones/dates
- [ ] Contenu flexible
- [ ] Alternance gauche/droite optionnelle

### 5.3 Empty State
**Fichier:** `css/components/empty-state.css`

- [ ] Etat vide centre
- [ ] Icone/illustration
- [ ] Titre + description
- [ ] Action optionnelle (bouton)

### 5.4 Popover
**Fichier:** `css/components/popover.css`

- [ ] Contenu riche au click
- [ ] Positions multiples
- [ ] Fleche de direction
- [ ] Header optionnel
- [ ] Fermeture au click exterieur

---

## Tokens a ajouter

**Fichier:** `css/tokens.css`

```css
/* Tailles de composants */
--component-height-sm: 28px;
--component-height-md: 36px;
--component-height-lg: 44px;

/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;

/* Animations */
--animation-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--animation-smooth: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Conventions

### Nommage des fichiers
- CSS : `css/components/{nom}.css`
- JS : `js/{nom}.js`
- Demo : `docs/{nom}-demo.html`

### Structure CSS
```css
/* Base */
.component { }

/* Variantes */
.component-primary { }
.component-sm { }

/* Etats */
.component:hover { }
.component:disabled { }
.component.active { }

/* Dark mode */
[data-theme="dark"] .component { }
```

### Structure JS (modules)
```javascript
export class Component {
    constructor(element, options = {}) { }
    destroy() { }
}

export const COMPONENT_PRESETS = { };
```

---

## Changelog

### v1.3.1 (actuel)
- VUMeter avec ballistics configurable
- Support presets (minimal, standard, broadcast, compact)

### v1.4.0 (prochain)
- [x] Icons manquantes
- [x] Range/Slider
- [x] Divider

### v1.5.0 (prochain)
- [x] Buttons: btn-warning, btn-outline-*, btn-pill
- [x] Badges: dot, count, pill, icon, removable
- [x] Segmented Control (nouveau composant)
- [x] Tooltip avec positions et fleches
- [x] Dropdown avec sous-menus et icones
- [x] Number Input avec variantes
- [x] Tags/Chips avec tag input
- [x] File Input avec dropzone

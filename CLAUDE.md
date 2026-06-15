# UIKit - Design System MR3

Design system réutilisable pour interfaces audio professionnelles.

## Stack & Versions

- Vanilla CSS (tokens + atomic design)
- ES6 modules (composants JS)
- No framework dependencies

## Structure

```
css/
├── tokens.css              # Variables design (couleurs, spacing, transitions)
├── reset.css               # Reset CSS baseline
├── layout.css, layouts.css # Système de layout grille
├── components/
│   ├── atoms/              # Composants atomiques (Button, LED, Rotary, etc.)
│   ├── molecules/          # Composants composés (ButtonGroup, RecordControl)
│   └── organisms/          # Composants complexes (AudioTrack)
└── dist/uikit.css          # ⚠️ BUNDLE COMPILÉ (source de vérité)

js/
├── dark-mode.js            # Utilitaire dark mode toggle
├── CanvasMeter.js          # Canvas 2D meter (remplace VUMeter)
└── components/
    ├── atoms/
    ├── molecules/
    └── organisms/          # AudioTrack.js, AudioTrackGroup.js

docs/                       # Documentation HTML (démo locale)
test-*.html                 # Pages test locales
```

## Conventions Code

**CSS:**
- YOU MUST: Build dist/ après modif sources → `npm run build`
- YOU MUST: Utiliser UNIQUEMENT `dist/uikit.css` dans les apps (jamais sources individuelles)
- NEVER: Commit dist/ sans rebuild (sources et dist désynchronisés)
- Transitions CSS : Éviter sur composants haute fréquence (ex: matrix 128+ cells)
- Custom properties : Obligatoires pour valeurs dynamiques JS (pseudo-elements)

**JavaScript:**
- Modules ES6 avec export/import
- Classes pour composants stateful
- Callbacks permettent customization comportement
- Callbacks reçoivent event + élément DOM (`onCallback(data, element)`)

**Organisation:**
- Atomic Design : atoms → molecules → organisms
- Composants autonomes : styles + JS dans même niveau hiérarchique
- Tests/docs : Fichiers séparés pour développement local

**Git:**
- Commits : Conventional Commits (feat/fix/perf/docs)
- Commit order : UIKit submodule AVANT parent app
- Modifications dist/ : TOUJOURS incluides avec sources modifiées
- ⚠️ YOU MUST: Rebuilder dist/ AVANT chaque commit CSS → `npm run build` ou `./css/build.sh`
- ⚠️ REMINDER: Demander rebuild si tu modifies CSS (pas de hook auto dans submodule)
- NEVER: Commit sources CSS sans rebuilder dist/ (désynchronisation)

## Build Commands

```bash
npm install                # Install dependencies
npm run build              # Build dist/uikit.css
npm run watch              # Watch mode (rebuild auto)
```

## Intégration dans Apps

**Dans HTML (exemple MR3):**
```html
<!-- ✓ CORRECT -->
<link rel="stylesheet" href="/uikit/dist/uikit.css">

<!-- ✗ INCORRECT (duplication, sources déjà dans dist/) -->
<link rel="stylesheet" href="/uikit/css/uikit.css">
<link rel="stylesheet" href="/uikit/css/components/stats.css">
```

**Dans JS (exemple):**
```javascript
import AudioTrack from './uikit/js/components/organisms/AudioTrack.js';
import AudioTrackGroup from './uikit/js/components/organisms/AudioTrackGroup.js';

const trackGroup = new AudioTrackGroup(container, {
  onRecordToggle: (trackId, enabled) => { ... },
  onGainChange: (trackId, value) => { ... },
  onLanguageClick: (lang, element) => { ... },  // element pour dropdown positioning
});
```

## Quirks Projet

YOU MUST: Rebuild dist/ après tout changement CSS sources
YOU MUST: Apps chargent dist/ uniquement (pas sources CSS individuelles)
YOU MUST: Déclarer explicitement flex-direction sur classes orientation (Chrome assume row par défaut)
NOTE: Chrome refuse height: 100% dans flex children → height: auto + align-self: stretch
NOTE: AudioTrack callbacks reçoivent DOM element (positioning dropdowns, tooltips)
NOTE: Performance matrix : transitions CSS supprimées pour 128+ cells
NOTE: CSS custom properties = seul moyen JS contrôler pseudo-elements (::before/::after)
NOTE: RAF centralisé dans AudioTrackGroup (~60fps pour 128+ meters)
NOTE: CanvasMeter.paint() appelé depuis RAF externe (pas RAF interne par meter)

## Utilisation dans MR3

UIKit est submodule git dans `static/uikit/`.
Convention parent app (MR3):
- `static/uikit/dist/uikit.css` → Design system base
- `static/css/app-layout.css` → Layout app + composition MR3-specific
- `static/css/*.css` → Overrides contextuels si nécessaire

Ordre chargement CSS (MR3 index.html):
1. `/uikit/dist/uikit.css` (design system)
2. `/css/app-layout.css` (layout app, peut override tokens)
3. Autres CSS app-specific si besoin

## Agent skills

### Issue tracker

Les issues et PRD de ce repo vivent dans GitHub Issues (`bathtubsailor82/uikit`), via la CLI `gh`. Voir `docs/agents/issue-tracker.md`.

### Triage labels

Cinq rôles canoniques de triage, libellés par défaut (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). Voir `docs/agents/triage-labels.md`.

### Domain docs

Layout single-context : `CONTEXT.md` + `docs/adr/` à la racine. Voir `docs/agents/domain.md`.

## Language policy (working / output axes)

This repo declares two explicit language axes. `CLAUDE.md` is load-bearing —
auto-injected every session, it reaches every skill.

- **`working_language` = `fr`** — the language of live, non-persisted
  interaction: chat replies, grill sessions, review reports shown in the
  conversation.
- **`output_language` = `fr`** — the language of artefacts persisted on
  the tracker: issue/PRD titles and bodies, comments, PR descriptions, commit
  message bodies. Inherits `working_language` unless declared distinct.

These tokens stay **frozen EN** regardless of either axis, because they are
technical identifiers and not human prose: tags/labels (`ready-for-agent`,
`prd`, `blocked`, …), Conventional Commits prefixes (`feat:`, `fix:`, …), Ralph
keywords (`BLOCKED:`), code identifiers, and paths. When in doubt: technical
identifier → EN; prose for a human → the declared language.

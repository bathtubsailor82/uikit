# UIKit v2 — EPIC & Stories

Spec d'evolution du design system UIKit vers une architecture multi-projets
avec Atomic Design complet, support themes, palettes et bonnes pratiques
design systems matures.

**Version actuelle** : v1.10.3
**Cible** : v2.0.0
**Projets consommateurs** : Sillage Jobs, MR3

---

## ⚠ Composants Proteges — NE PAS MODIFIER

Les composants audio hérités du projet MR3 sont **stables, testés, et
critiques**. Pendant toute la migration v2 ils ne doivent **jamais** être
réécrits, refactorés, ni avoir leurs classes CSS renommées.

**Seule opération autorisée** : déplacement de fichier (changement de path)
+ mise à jour `build.sh`.

| Composant | Fichier(s) | Catégorie |
|---|---|---|
| VU Meter (Canvas) | `js/meter.js` (692L) + `css/components/meter.css` (651L) | Organism |
| AudioTrack | `css/organisms/audio-track.css` | Organism |
| Matrix | `css/components/matrix.css` | Organism |
| LED indicator | `css/atoms/led.css` | Atom |
| Rotary knob | `css/atoms/rotary.css` | Atom |
| Record button | `css/atoms/record-button.css` | Atom |
| Timer display | `css/atoms/timer.css` | Atom |
| Button group | `css/molecules/button-group.css` | Molecule |
| Record control | `css/molecules/record-control.css` | Molecule |

**Raisons** :
- `meter.js` utilise Canvas avec ballistics PPM IEC Type I, peak/RMS/hold/LUFS — réécrire = régresser
- AudioTrack orchestre meter + waveform + routing pour 128+ pistes — architecture validée en prod
- Les atoms audio (led, rotary, record-button, timer) sont couplés visuellement avec les organisms
- Toute modification CSS peut casser les proportions Canvas / les alignements sub-pixel

**Règle de migration** : `git mv` uniquement. Si un path change, mettre à jour
les imports dans les projets consommateurs et `build.sh`. C'est tout.

---

## Classification Atomic Design — Etat Cible

Cartographie complète de chaque composant (existant et nouveau).

### Atoms (elements indivisibles)

| Fichier cible | Source actuelle | Statut |
|---|---|---|
| `atoms/button.css` | `atoms/button.css` + `buttons.css` | Fusionner |
| `atoms/input.css` | extraire de `forms.css` | Nouveau |
| `atoms/checkbox.css` | extraire de `forms.css` | Nouveau |
| `atoms/radio.css` | extraire de `forms.css` | Nouveau |
| `atoms/switch.css` | extraire de `forms.css` | Nouveau |
| `atoms/badge.css` | `badges.css` | Migrer |
| `atoms/icon.css` | `icons.css` | Migrer |
| `atoms/spinner.css` | extraire de `loading.css` | Nouveau |
| `atoms/tag.css` | `tags.css` | Migrer |
| `atoms/divider.css` | `divider.css` | Migrer |
| `atoms/tooltip.css` | `tooltip.css` | Migrer |
| `atoms/progress.css` | `progress.css` | Migrer |
| `atoms/avatar.css` | `avatar.css` | Migrer |
| `atoms/led.css` | `atoms/led.css` | OK |
| `atoms/rotary.css` | `atoms/rotary.css` | OK |
| `atoms/record-button.css` | `atoms/record-button.css` | OK |
| `atoms/timer.css` | `atoms/timer.css` | OK |

### Molecules (combinaisons d'atoms)

| Fichier cible | Source actuelle | Statut |
|---|---|---|
| `molecules/form-group.css` | extraire de `forms.css` | Nouveau |
| `molecules/input-group.css` | extraire de `forms.css` | Nouveau |
| `molecules/search-input.css` | extraire de `forms.css` | Nouveau |
| `molecules/alert.css` | `alerts.css` | Migrer |
| `molecules/breadcrumb.css` | `breadcrumb.css` | Migrer |
| `molecules/tab-bar.css` | `tabs.css` | Migrer |
| `molecules/pagination.css` | `pagination.css` | Migrer |
| `molecules/card.css` | `cards.css` | Migrer |
| `molecules/list-item.css` | `list-items.css` | Migrer |
| `molecules/notification.css` | `notifications.css` | Migrer |
| `molecules/dropdown.css` | `dropdown.css` | Migrer |
| `molecules/popover.css` | `popover.css` | Migrer |
| `molecules/segmented.css` | `segmented.css` | Migrer |
| `molecules/stepper.css` | `stepper.css` | Migrer |
| `molecules/timeline.css` | `timeline.css` | Migrer |
| `molecules/empty-state.css` | `empty-state.css` | Migrer |
| `molecules/stat-card.css` | `stats.css` | Migrer |
| `molecules/number-input.css` | `number-input.css` | Migrer |
| `molecules/range.css` | `range.css` | Migrer |
| `molecules/file-input.css` | `file-input.css` | Migrer |
| `molecules/skeleton.css` | extraire de `loading.css` | Nouveau |
| `molecules/nav-item.css` | nouveau | Nouveau |
| `molecules/choice-card.css` | Sillage `.job-type-card` | Nouveau |
| `molecules/inline-edit.css` | nouveau | Nouveau |
| `molecules/code-block.css` | nouveau | Nouveau |
| `molecules/button-group.css` | `molecules/button-group.css` | OK |
| `molecules/record-control.css` | `molecules/record-control.css` | OK |

### Organisms (sections completes)

| Fichier cible | Source actuelle | Statut |
|---|---|---|
| `organisms/header.css` | `header.css` | Migrer + enrichir |
| `organisms/nav.css` | nouveau | Nouveau |
| `organisms/table.css` | `tables.css` | Migrer |
| `organisms/modal.css` | `modals.css` | Migrer |
| `organisms/accordion.css` | `accordion.css` | Migrer |
| `organisms/action-bar.css` | Sillage `.selection-bar` | Nouveau |
| `organisms/log-viewer.css` | `logs.css` | Migrer |
| `organisms/meter.css` | `meter.css` | Migrer |
| `organisms/matrix.css` | `matrix.css` | Migrer |
| `organisms/audio-track.css` | `organisms/audio-track.css` | OK |
| `organisms/form.css` | restes de `forms.css` | Nouveau |

### Foundation (non-composants)

Pas de changement de dossier, restent à la racine `css/` :
- `primitives.css` (nouveau)
- `tokens.css`
- `reset.css`
- `accessibility.css`
- `layout.css`
- `layouts.css`

---

## EPIC 1 — Architecture Tokens 3 Niveaux

> Séparer les couleurs brutes (palette), les rôles sémantiques, et les tokens
> non-couleurs pour permettre le swap de palettes et de thèmes sans toucher
> aux composants.

### Story 1.1 — Extraire les primitives couleurs

**Fichier** : `css/primitives.css` (nouveau)

Extraire toutes les valeurs hex de `tokens.css` dans une échelle nommée :

```css
:root {
    --white: #ffffff;
    --black: #000000;

    --gray-50:  #fafafa;
    --gray-100: #f8f8f8;
    --gray-200: #f5f5f5;
    --gray-300: #eee;
    --gray-400: #ddd;
    --gray-500: #ccc;
    --gray-600: #999;
    --gray-700: #86868b;
    --gray-800: #666;
    --gray-900: #333;
    --gray-950: #1d1d1f;

    --blue-50:  #e8f4f8;
    --blue-500: #5a90c7;
    --blue-600: #4a80b7;

    --green-50:  #e8f4e8;
    --green-500: #7db46c;
    --green-600: #4a7c59;

    --red-500:   #d84444;
    --orange-500: #cc8800;
}
```

**Critères d'acceptation** :
- [ ] Toutes les valeurs hex actuelles de tokens.css sont extraites
- [ ] L'échelle couvre 50-950 pour chaque teinte (gray, blue, green, red, orange)
- [ ] Aucune valeur hex dans tokens.css — uniquement des `var(--primitive-*)`
- [ ] Tests visuels : le rendu est identique avant/après

---

### Story 1.2 — Refactorer tokens.css en semantique

**Fichier** : `css/tokens.css` (refactoré)

Remplacer les valeurs hex par des références aux primitives :

```css
:root {
    --color-primary: var(--blue-500);
    --color-primary-hover: var(--blue-600);
    --color-success: var(--green-500);
    --color-bg-primary: var(--white);
    --color-text-primary: var(--gray-900);
    /* ... */
}

[data-theme="dark"] {
    --color-bg-primary: var(--gray-950);
    --color-bg-secondary: var(--gray-900);
    /* ... remap sémantique */
}
```

**Critères d'acceptation** :
- [ ] Zéro valeur hex dans tokens.css (tout passe par primitives)
- [ ] Dark mode utilise les mêmes primitives avec remap sémantique
- [ ] `@media (prefers-color-scheme: dark)` utilise aussi les primitives
- [ ] Tokens non-couleurs (typo, spacing, shadows, z-index) restent dans tokens.css
- [ ] Tests visuels identiques

---

### Story 1.3 — Auditer et fixer le contraste WCAG

Vérifier chaque combinaison text/background contre WCAG AA (4.5:1 minimum).

**Problèmes connus** :
- `--color-text-tertiary` (#999) sur `--color-bg-primary` (#fff) = ratio 2.85:1 ✗
- `--color-text-disabled` (#6e6e73) sur fonds clairs

**Critères d'acceptation** :
- [ ] Toutes les combinaisons sémantiques text/bg respectent WCAG AA (4.5:1)
- [ ] Les couleurs ajustées sont documentées dans primitives.css
- [ ] Vérification light ET dark mode

---

## EPIC 2 — Systeme de Palettes

> Permettre de changer la palette de couleurs d'un projet sans toucher
> au design system core.

### Story 2.1 — Creer le dossier palettes/ avec la palette par defaut

**Structure** :
```
palettes/
├── default.css         ← palette Apple/macOS actuelle (noop)
├── README.md           ← comment créer une palette custom
```

**Critères d'acceptation** :
- [ ] `palettes/default.css` existe (palette baseline = noop)
- [ ] README explique le contrat d'une palette (quelles variables overrider)
- [ ] Exemple de palette custom documenté

---

### Story 2.2 — Creer 2-3 palettes alternatives

Palettes pour valider l'architecture :
- **purple.css** : violet comme couleur primaire
- **earth.css** : tons chauds (marron/terracotta)
- **mono.css** : noir & blanc, pas de couleur d'accent

**Critères d'acceptation** :
- [ ] Chaque palette ne contient QUE des overrides de primitives
- [ ] Chaque palette fonctionne en light ET dark mode
- [ ] Aucun composant ne casse visuellement
- [ ] Test visuel : `uikit.css` + `palettes/purple.css` → OK

---

### Story 2.3 — Documenter l'integration palettes

**Critères d'acceptation** :
- [ ] README et CLAUDE.md mis à jour
- [ ] Ordre de chargement documenté

---

## EPIC 3 — Systeme de Themes

> Permettre de changer le "feeling" visuel (border-radius, shadows,
> typography, density) sans changer les couleurs.

### Story 3.1 — Extraire le theme Apple actuel

**Fichier** : `themes/theme-apple.css` (noop, documente les valeurs par défaut)

Tokens "style Apple" : border-radius petits, shadows subtiles, font system
stack, font-size base 11px, spacing compact.

**Critères d'acceptation** :
- [ ] Dossier `themes/` créé avec README
- [ ] Les valeurs "style Apple" sont documentées

---

### Story 3.2 — Creer un theme alternatif (corporate/flat)

```css
/* themes/theme-corporate.css */
:root {
    --border-radius-sm: 0;
    --border-radius-md: 2px;
    --font-family-base: 'Inter', -apple-system, sans-serif;
    --font-size-base: 14px;
    --shadow-sm: none;
}
```

**Critères d'acceptation** :
- [ ] Override uniquement tokens de style (pas les couleurs)
- [ ] Combinable avec n'importe quelle palette
- [ ] Test visuel : `uikit.css` + `themes/corporate.css` + `palettes/purple.css` → OK

---

### Story 3.3 — Documenter le systeme de themes

**Critères d'acceptation** :
- [ ] README section "Themes" ajoutée
- [ ] Distinction claire palette (couleurs) vs theme (feeling)

---

## EPIC 4 — Migration Atomic Design

> Réorganiser TOUS les composants flat existants dans la hiérarchie
> atoms/molecules/organisms. Les classes CSS ne changent pas, seuls
> les fichiers sont déplacés/éclatés.

### Story 4.1 — Migrer les atoms

Déplacer les composants flat qui sont des éléments indivisibles :

```
badges.css      → atoms/badge.css
icons.css       → atoms/icon.css
tags.css        → atoms/tag.css
divider.css     → atoms/divider.css
tooltip.css     → atoms/tooltip.css
progress.css    → atoms/progress.css
avatar.css      → atoms/avatar.css
```

Extraire de `loading.css` :
```
loading.css (spinners)  → atoms/spinner.css
loading.css (skeletons) → molecules/skeleton.css
```

Fusionner les deux buttons :
```
buttons.css (flat) + atoms/button.css (audio) → atoms/button.css (unifié)
```

> **PROTEGE** : `atoms/led.css`, `atoms/rotary.css`, `atoms/record-button.css`,
> `atoms/timer.css` sont déjà au bon endroit — ne pas toucher leur contenu.

**Critères d'acceptation** :
- [ ] Tous les fichiers listés sont déplacés
- [ ] Zéro changement de nom de classe CSS
- [ ] `build.sh` mis à jour avec les nouveaux paths
- [ ] Tests visuels identiques sur Sillage et MR3
- [ ] Atoms audio protégés : contenu identique bit-for-bit

---

### Story 4.2 — Eclater forms.css en atoms

Extraire de `forms.css` (682 lignes) :

```
atoms/input.css       ← .form-input, .form-textarea, .form-select, tailles, états
atoms/checkbox.css    ← .form-checkbox-*, tous états
atoms/radio.css       ← .form-radio-*, tous états
atoms/switch.css      ← .form-switch-*, tailles, variantes couleur
```

**Critères d'acceptation** :
- [ ] Chaque atom fonctionne en isolation
- [ ] Classes existantes inchangées
- [ ] Dark mode + focus-visible sur chaque atom
- [ ] `forms.css` passe de 682 à < 80 lignes

---

### Story 4.3 — Migrer les molecules

Déplacer les composants flat qui combinent des atoms :

```
alerts.css        → molecules/alert.css
breadcrumb.css    → molecules/breadcrumb.css
tabs.css          → molecules/tab-bar.css
pagination.css    → molecules/pagination.css
cards.css         → molecules/card.css
list-items.css    → molecules/list-item.css
notifications.css → molecules/notification.css
dropdown.css      → molecules/dropdown.css
popover.css       → molecules/popover.css
segmented.css     → molecules/segmented.css
stepper.css       → molecules/stepper.css
timeline.css      → molecules/timeline.css
empty-state.css   → molecules/empty-state.css
stats.css         → molecules/stat-card.css
number-input.css  → molecules/number-input.css
range.css         → molecules/range.css
file-input.css    → molecules/file-input.css
```

Extraire de `forms.css` :
```
molecules/form-group.css     ← .form-group, .form-label, .form-help, .form-error
molecules/input-group.css    ← .input-group, prepend/append
molecules/search-input.css   ← .form-search-*
```

> **PROTEGE** : `molecules/button-group.css` et `molecules/record-control.css`
> sont déjà au bon endroit — ne pas toucher leur contenu.

**Critères d'acceptation** :
- [ ] Tous les fichiers listés sont déplacés
- [ ] Zéro changement de nom de classe CSS
- [ ] `build.sh` mis à jour
- [ ] Tests visuels identiques
- [ ] Molecules audio protégées : contenu identique bit-for-bit

---

### Story 4.4 — Migrer les organisms

Déplacer les composants flat qui sont des sections complètes :

```
header.css     → organisms/header.css
tables.css     → organisms/table.css
modals.css     → organisms/modal.css
accordion.css  → organisms/accordion.css
logs.css       → organisms/log-viewer.css
meter.css      → organisms/meter.css      ← PROTEGE : git mv uniquement
matrix.css     → organisms/matrix.css     ← PROTEGE : git mv uniquement
```

Créer depuis les restes de `forms.css` :
```
organisms/form.css  ← .form-inline, .form-row, .form-compact, .form-fieldset
```

> **PROTEGE** : `meter.css` (651L) et `matrix.css` sont des composants audio
> critiques. Déplacement de fichier uniquement (`git mv`), zéro modification
> du contenu CSS. `organisms/audio-track.css` est déjà au bon endroit.
> Le fichier `js/meter.js` (692L, Canvas) ne bouge pas non plus.

**Critères d'acceptation** :
- [ ] Tous les fichiers listés sont déplacés
- [ ] Zéro changement de nom de classe CSS
- [ ] `build.sh` mis à jour (ordre : atoms → molecules → organisms)
- [ ] Tests visuels identiques
- [ ] Organisms audio protégés : contenu identique bit-for-bit
- [ ] `js/meter.js` inchangé (même checksum)

---

### Story 4.5 — Supprimer les fichiers flat obsoletes

Une fois la migration validée :
- [ ] Supprimer tous les `.css` flat dans `css/components/` (sauf si re-export)
- [ ] Supprimer `forms.css` (éclaté dans atoms + molecules + organisms)
- [ ] Supprimer `loading.css` (éclaté dans atoms/spinner + molecules/skeleton)
- [ ] Supprimer `buttons.css` flat (fusionné dans atoms/button)
- [ ] Vérifier qu'aucun projet ne charge les anciens paths directement
- [ ] `build.sh` ne référence plus aucun fichier flat

---

## EPIC 5 — Nouveaux Composants

> Composants manquants, classés directement dans la bonne catégorie Atomic.
> Inspiration principale : esthétique Claude Desktop / developer tools —
> tree views, disclosure patterns, icônes inline, hiérarchie visuelle.

### Story 5.0a — molecules/tree-view.css (Claude Desktop style)

Tree view hiérarchique collapsible. C'est LE pattern central de
l'esthétique Claude Desktop — utilisable pour :
- Afficher des arborescences fichiers
- Résultats de recherche groupés
- Logs structurés avec détails collapsibles
- Workflows par phases avec sous-éléments

```css
/* Container */
.tree { }

/* Node = disclosure toggle + content */
.tree-node { }
.tree-node-header { }             /* Ligne cliquable */
.tree-node-toggle { }             /* Chevron ▸/▾ (unicode ou icon-chevron) */
.tree-node-icon { }               /* Icône contextuelle (fichier, dossier, etc.) */
.tree-node-label { }              /* Texte principal */
.tree-node-meta { }               /* Texte secondaire muted (ex: "682 lignes") */
.tree-node-badge { }              /* Badge/count inline */

/* Children container */
.tree-node-children { }           /* Indenté, avec ligne verticale subtile */

/* États */
.tree-node.expanded { }           /* Enfants visibles */
.tree-node.collapsed { }          /* Enfants cachés */
.tree-node.leaf { }               /* Pas d'enfants (pas de chevron) */
.tree-node.selected { }           /* Sélection active */
.tree-node.highlighted { }        /* Highlight temporaire */

/* Variantes */
.tree-compact { }                 /* Spacing réduit */
.tree-connected { }               /* Lignes verticales entre nodes */
.tree-flat { }                    /* Sans indentation (liste plate avec disclosure) */
```

**HTML de référence** (style Claude Desktop) :
```html
<div class="tree">
  <div class="tree-node expanded">
    <div class="tree-node-header">
      <span class="tree-node-toggle">▾</span>
      <span class="icon icon-sm icon-file"></span>
      <span class="tree-node-label">Read forms.css component stylesheet</span>
    </div>
    <div class="tree-node-children">
      <div class="tree-node leaf">
        <div class="tree-node-header">
          <span class="icon icon-sm icon-file"></span>
          <span class="tree-node-label">/path/to/forms.css</span>
        </div>
        <div class="tree-node-meta">682 lignes lues</div>
      </div>
    </div>
  </div>
</div>
```

**Critères d'acceptation** :
- [ ] Indentation hiérarchique via padding-left progressif
- [ ] Lignes verticales subtiles en mode `.tree-connected`
- [ ] Toggle chevron avec transition rotate
- [ ] Support icônes inline (SVG mask ou unicode)
- [ ] Texte meta en `--color-text-tertiary` + font-size-sm
- [ ] Fond hover subtil sur tree-node-header
- [ ] Dark mode OK
- [ ] Focus-visible pour navigation clavier
- [ ] Imbrication infinie (niveaux N)

---

### Story 5.0b — molecules/disclosure.css (Claude Desktop style)

Block collapsible simple (non-hiérarchique). Différent de l'accordion
(qui est un groupe) — le disclosure est un block autonome.

```css
.disclosure { }
.disclosure-header { }            /* Ligne cliquable */
.disclosure-toggle { }            /* Chevron */
.disclosure-icon { }              /* Icône optionnelle */
.disclosure-title { }             /* Titre */
.disclosure-meta { }              /* Info secondaire (count, status) */
.disclosure-content { }           /* Contenu caché/visible */
.disclosure.open { }              /* Content visible */

/* Variantes */
.disclosure-bordered { }          /* Avec bordure et fond */
.disclosure-inline { }            /* Compact, sans bordure */
```

**Critères d'acceptation** :
- [ ] Transition smooth open/close
- [ ] Support icône + titre + meta dans le header
- [ ] Fond subtil sur hover
- [ ] Dark mode OK

---

### Story 5.0c — molecules/activity-entry.css (Claude Desktop style)

Entrée d'activité/log avec icône, label, et métadonnées.
C'est le pattern de chaque "action" dans Claude Desktop.

```css
.activity-entry { }
.activity-entry-icon { }          /* Icône de l'action */
.activity-entry-content { }       /* Texte principal */
.activity-entry-meta { }          /* Metadata (durée, count, path) */
.activity-entry-status { }        /* Badge status inline */

/* Variantes */
.activity-entry.success { }
.activity-entry.error { }
.activity-entry.pending { }

/* Dans un contexte tree */
.tree-node > .activity-entry { }
```

**Critères d'acceptation** :
- [ ] Layout flex : icône | contenu | meta
- [ ] Icône colorée selon le type d'action
- [ ] Meta en font mono + couleur muted
- [ ] Composable dans un tree-node
- [ ] Dark mode OK

---

### Story 5.0d — Strategie icônes : documenter l'approche hybride

Documenter la stratégie icônes du design system :

**Approche SVG mask (existante, ~60 icônes)** :
Pour les icônes d'action/interface. Héritent `currentColor`,
scalables, pas de dépendance externe.

**Approche Unicode (à documenter)** :
Pour les indicateurs inline légers. Classes utilitaires :

```css
/* Utility classes pour unicode courants */
.indicator-expand::before { content: '▸'; }
.indicator-collapse::before { content: '▾'; }
.indicator-dot::before { content: '●'; }
.indicator-circle::before { content: '○'; }
.indicator-check::before { content: '✓'; }
.indicator-cross::before { content: '✗'; }
.indicator-arrow::before { content: '→'; }
.indicator-dash::before { content: '—'; }
```

**Icônes SVG manquantes à ajouter** :
- `icon-terminal` (pour les blocs commande/output)
- `icon-code` (pour les blocs code)
- `icon-database` (pour DB/storage)
- `icon-server` (pour les services)
- `icon-git-branch` (pour les branches/versions)
- `icon-git-commit` (pour les commits)
- `icon-package` (pour les modules/packages)
- `icon-cpu` (pour les process/jobs)
- `icon-hard-drive` (pour le storage)
- `icon-wifi` / `icon-wifi-off` (pour la connectivité)
- `icon-zap` (pour les actions rapides/lightning)
- `icon-layers` (pour les stacks)
- `icon-box` (pour les containers)
- `icon-tool` (pour la maintenance)
- `icon-globe` (pour le web/network)
- `icon-hash` (pour les tags/channels)

**Critères d'acceptation** :
- [ ] Section "Icons" dans docs/index.html avec galerie visuelle
- [ ] Convention documentée : quand utiliser unicode vs SVG mask
- [ ] Nouvelles icônes ajoutées dans `icons.css`
- [ ] Classes `.indicator-*` ajoutées

---

### Story 5.1 — molecules/nav-item.css

Item de navigation réutilisable dans les sidebars et menus.

```css
.nav-item { }
.nav-item.active { }
.nav-item.disabled { }
.nav-item-icon { }
.nav-item-label { }
.nav-item-badge { }
```

**Critères d'acceptation** :
- [ ] Hover/active/disabled/focus-visible
- [ ] Support icônes + labels + badges
- [ ] Dark mode OK

---

### Story 5.2 — organisms/nav.css

Navigation latérale complète composée de `nav-item` molecules.

```css
.nav { }
.nav-section { }
.nav-section-title { }
.nav-divider { }
.nav-collapsible { }
.nav-collapsed .nav-item-label { display: none; }
```

**Critères d'acceptation** :
- [ ] Groupes avec titres et séparateurs
- [ ] Mode collapsed (icônes seulement)
- [ ] Dark mode OK

---

### Story 5.3 — molecules/choice-card.css

Sélection d'une option parmi N (radio visuel en carte).
Upstream depuis Sillage `.job-type-card`.

```css
.choice-card-group { }
.choice-card { }
.choice-card.selected { }
.choice-card-icon { }
.choice-card-title { }
.choice-card-description { }
.choice-card.disabled { }
```

**Critères d'acceptation** :
- [ ] Grille de cards clickables
- [ ] État selected + disabled
- [ ] Dark mode + focus-visible

---

### Story 5.4 — organisms/action-bar.css

Barre contextuelle sur sélection (bulk actions).
Upstream depuis Sillage `.selection-bar`.

```css
.action-bar { }
.action-bar.visible { }
.action-bar-info { }
.action-bar-actions { }
.action-bar-dismiss { }
```

**Critères d'acceptation** :
- [ ] Position sticky/fixed en bas
- [ ] Animation apparition/disparition
- [ ] Dark mode OK

---

### Story 5.5 — molecules/inline-edit.css

Click-to-edit pour valeurs texte/nombre.

```css
.inline-edit { }
.inline-edit-display { }
.inline-edit-input { }
.inline-edit-actions { }
.inline-edit.editing { }
```

**Critères d'acceptation** :
- [ ] Transition smooth display → input
- [ ] Indicateur hover "editable"
- [ ] Dark mode OK

---

### Story 5.6 — molecules/code-block.css

Affichage de code/output avec copy-to-clipboard.

```css
.code-block { }
.code-block-header { }
.code-block-content { }
.code-block-copy { }
.code-block-copy.copied { }
.code-inline { }
```

**Critères d'acceptation** :
- [ ] Font mono, fond distinct
- [ ] Bouton copy avec feedback visuel
- [ ] Scroll horizontal si overflow
- [ ] Dark mode OK

---

## EPIC 6 — Amelioration Composants Existants

> Enrichir les composants avant ou après leur migration.

### Story 6.1 — organisms/header.css : enrichir

Le header actuel est quasi vide. Ajouter :

```css
.header-brand { }
.header-nav { }
.header-nav-item { }
.header-actions { }
.header-sticky { }
.header-compact { }
```

**Critères d'acceptation** :
- [ ] Layout flex brand/nav/actions
- [ ] Support sticky + compact
- [ ] Dark mode OK

---

### Story 6.2 — molecules/tab-bar.css : variantes

Ajouter :
- [ ] Variantes : `.tabs-pills`, `.tabs-underline`, `.tabs-buttons`
- [ ] Tailles : `.tabs-sm`, `.tabs-lg`
- [ ] `.tab-button:disabled`
- [ ] `.tabs-scrollable` (overflow horizontal)
- [ ] `.tabs-vertical`
- [ ] Support icônes et badges dans tabs

---

### Story 6.3 — molecules/notification.css : positions et actions

Ajouter :
- [ ] Positions : `.notification-top-right`, `bottom-left`, etc.
- [ ] Container : `.notification-container`
- [ ] Dismiss : `.notification-close`
- [ ] Progress bar auto-dismiss : `.notification-progress`
- [ ] Actions : `.notification-actions`

---

### Story 6.4 — molecules/card.css : variantes

Ajouter :
- [ ] `.card-elevated`, `.card-outlined`, `.card-interactive`
- [ ] `.card-horizontal`
- [ ] `.card-group`

---

### Story 6.5 — organisms/table.css : sticky header et expand

Ajouter :
- [ ] `.table-sticky-header`
- [ ] `.table-expandable` + `.table-row-expanded`
- [ ] `.table-toolbar`
- [ ] `.table-loading`

---

## EPIC 7 — Outillage et DX

### Story 7.1 — CSS Layers

```css
@layer uikit-primitives, uikit-tokens, uikit-reset, uikit-layout,
       uikit-atoms, uikit-molecules, uikit-organisms, uikit-utilities;
```

**Critères d'acceptation** :
- [ ] `build.sh` ajoute les `@layer` wrappers par catégorie Atomic
- [ ] Les projets peuvent override via `@layer uikit-overrides`
- [ ] Aucune régression visuelle

---

### Story 7.2 — Build script ameliore

Refactorer `build.sh` pour :
- [ ] Respecter l'ordre Atomic : foundation → atoms → molecules → organisms
- [ ] `--minify` flag
- [ ] Banner avec version et date
- [ ] Erreur si fichier source manquant
- [ ] `dist/uikit.min.css` généré

---

### Story 7.3 — Versioning semantique strict

- **MAJOR** (2.0.0) : breaking change tokens/classes
- **MINOR** (2.1.0) : nouveau composant, nouvelle variante
- **PATCH** (2.0.1) : fix CSS, ajustement couleur

**Critères d'acceptation** :
- [ ] CHANGELOG.md créé
- [ ] Convention documentée dans CLAUDE.md
- [ ] Tags git sur chaque release

---

### Story 7.4 — Documentation composants (docs/index.html)

- [ ] Tous les composants classés par catégorie Atomic
- [ ] Section "Palettes" avec preview live
- [ ] Section "Themes" avec toggle
- [ ] Showcase des nouvelles variantes

---

## EPIC 8 — Upstream depuis Sillage Jobs

### Story 8.1 — Badges status jobs

`.badge-running`, `.badge-completed`, `.badge-cancelled` → `atoms/badge.css`

**Statut** : Prêt (déjà codé, en staging)

---

### Story 8.2 — Progress bar processing

`.progress-bar.processing` (rayures animées) → `atoms/progress.css`

**Statut** : Prêt (déjà codé, en staging)

---

### Story 8.3 — Settings menu items

`.settings-menu-item` → `molecules/nav-item.css`

---

## Ordre d'Implementation Suggere

```
Phase 1 — Fondations tokens (EPIC 1 + 7.2)
├── 1.1  Primitives
├── 1.2  Tokens sémantiques
├── 1.3  Audit WCAG
├── 7.2  Build script (intégrer primitives.css)
└── 7.3  Versioning → tag v2.0.0-alpha

Phase 2 — Migration Atomic Design (EPIC 4)
├── 4.1  Migrer atoms
├── 4.2  Éclater forms.css
├── 4.3  Migrer molecules
├── 4.4  Migrer organisms
└── 4.5  Supprimer fichiers flat

Phase 3 — Theming (EPIC 2 + 3)
├── 2.1  Palette default
├── 2.2  Palettes alternatives
├── 3.1  Theme Apple
├── 3.2  Theme corporate
├── 2.3 + 3.3  Documentation
└── 7.1  CSS Layers

Phase 4 — Patterns Claude Desktop (EPIC 5 prioritaire)
├── 5.0a Tree View                   ← pattern central
├── 5.0b Disclosure                  ← block collapsible simple
├── 5.0c Activity Entry              ← entrées action/log
├── 5.0d Stratégie icônes            ← unicode + SVG manquants
├── 5.6  Code Block                  ← output/terminal blocks
└── 5.1  Nav item (molecule)

Phase 5 — Autres composants (EPIC 5 + 6)
├── 5.2  Nav (organism)
├── 6.1  Header enrichi
├── 6.2  Tabs variantes
├── 6.3  Notifications positions
├── 6.4  Cards variantes
├── 6.5  Tables sticky/expand
├── 5.3  Choice Card
├── 5.4  Action Bar
├── 5.5  Inline Edit

Phase 6 — Upstream & Polish (EPIC 8 + 7.4)
├── 8.1  Badges status
├── 8.2  Progress processing
├── 8.3  Menu items
├── 7.4  Documentation complète
└── Tag v2.0.0
```

---

## Hors Scope (reste app-specific)

- Sequence editor Sillage → trop spécifique
- Job type definitions → logique métier
- Waveform player → composant applicatif
- Calendar / Date picker custom → input natif ou lib dédiée
- Charts / Data viz → lib dédiée (Chart.js, etc.)
- Réécriture composants audio (VU meter, AudioTrack, matrix) → protégés, cf. section en tête de spec

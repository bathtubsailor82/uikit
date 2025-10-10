# UIKit

Design system réutilisable pour projets web classiques (HTML/CSS/JS).
Inspiré du style Apple/macOS moderne.

## Installation

### Option 1 : Fichier compilé (recommandé)

```html
<link rel="stylesheet" href="path/to/uikit/dist/uikit.css">
```

### Option 2 : Import personnalisé

Importez uniquement les composants dont vous avez besoin :

```html
<link rel="stylesheet" href="path/to/uikit/css/tokens.css">
<link rel="stylesheet" href="path/to/uikit/css/reset.css">
<link rel="stylesheet" href="path/to/uikit/css/components/buttons.css">
```

## Structure

```
uikit/
├── css/
│   ├── tokens.css              # Variables CSS (couleurs, spacing, typo)
│   ├── reset.css               # Reset basique
│   ├── layout.css              # Utilitaires grid/flex
│   └── components/
│       ├── buttons.css         # Boutons
│       ├── badges.css          # Badges & status
│       ├── cards.css           # Cards & stats
│       ├── progress.css        # Barres de progression
│       ├── tabs.css            # Navigation par onglets
│       ├── logs.css            # Logs & monitoring
│       ├── header.css          # En-têtes
│       └── notifications.css   # Notifications toast
├── dist/
│   └── uikit.css              # Fichier compilé (tout-en-un)
└── docs/
    └── index.html             # Documentation avec exemples
```

## Usage rapide

### Buttons

```html
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-sm">Small</button>
```

### Badges

```html
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Paused</span>
<span class="status-badge error">Error</span>
```

### Cards

```html
<div class="stat-card">
    <div class="stat-value">42</div>
    <div class="stat-label">Active Jobs</div>
</div>

<div class="card">
    <div class="card-header">Title</div>
    <div class="card-body">Content</div>
</div>
```

### Progress

```html
<div class="progress-bar">
    <div class="progress-fill" style="width: 45%"></div>
    <div class="progress-text">45% Complete</div>
</div>
```

### Tabs

```html
<div class="tabs-nav">
    <button class="tab-button active">Tab 1</button>
    <button class="tab-button">Tab 2</button>
</div>
<div class="tab-content active">Content 1</div>
<div class="tab-content">Content 2</div>
```

### Layout utilities

```html
<div class="grid grid-3 gap-4">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>

<div class="flex-between p-4">
    <span>Left</span>
    <span>Right</span>
</div>
```

## Personnalisation

Modifiez les variables dans `css/tokens.css` :

```css
:root {
    --color-primary: #5a90c7;    /* Votre couleur principale */
    --font-size-base: 11px;       /* Taille de police de base */
    --spacing-4: 8px;             /* Espacement standard */
}
```

## Documentation

Ouvrez `docs/index.html` dans votre navigateur pour voir tous les composants avec exemples.

## Compatibilité

- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- CSS Variables (IE11 non supporté)
- Vanilla JS (pas de dépendances)

## License

Libre d'utilisation pour vos projets personnels et professionnels.

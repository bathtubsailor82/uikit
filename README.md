# UIKit

Design system réutilisable pour projets web classiques (HTML/CSS/JS).
Inspiré du style Apple/macOS moderne avec support **Dark Mode** intégré.

## ✨ Caractéristiques

- **13+ composants** prêts à l'emploi
- **Dark Mode** automatique ou manuel
- **9 layouts CSS** réutilisables (Grid + Flexbox)
- **100% Vanilla** - pas de dépendances
- **Responsive** - optimisé mobile
- **Personnalisable** - variables CSS

## 📦 Installation

### Option 1 : Fichier compilé (recommandé)

```html
<link rel="stylesheet" href="path/to/uikit/dist/uikit.css">
<script src="path/to/uikit/js/dark-mode.js"></script>
```

### Option 2 : Import personnalisé

Importez uniquement les composants dont vous avez besoin :

```html
<link rel="stylesheet" href="path/to/uikit/css/tokens.css">
<link rel="stylesheet" href="path/to/uikit/css/reset.css">
<link rel="stylesheet" href="path/to/uikit/css/components/buttons.css">
```

## 📁 Structure

```
uikit/
├── css/
│   ├── tokens.css              # Variables CSS + Dark Mode
│   ├── reset.css               # Reset basique
│   ├── layout.css              # Utilitaires grid/flex
│   ├── layouts.css             # 9 layouts CSS réutilisables
│   └── components/
│       ├── buttons.css         # Boutons
│       ├── badges.css          # Badges & status
│       ├── cards.css           # Cards & stats
│       ├── progress.css        # Barres de progression
│       ├── tabs.css            # Navigation par onglets
│       ├── forms.css           # Inputs, selects, checkboxes
│       ├── tables.css          # Tables responsive
│       ├── alerts.css          # Messages inline
│       ├── loading.css         # Spinners & skeletons
│       ├── modals.css          # Modals, dropdowns, tooltips
│       ├── logs.css            # Logs & monitoring
│       ├── header.css          # En-têtes
│       └── notifications.css   # Notifications toast
├── js/
│   └── dark-mode.js           # Dark mode toggle + API
├── layouts/
│   └── index.html             # Showcase de 9 layouts CSS
├── dist/
│   └── uikit.css              # Fichier compilé (tout-en-un)
└── docs/
    └── index.html             # Documentation complète + dark mode
```

## 🎨 Composants

### Buttons

```html
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-block">Block</button>
```

### Forms

```html
<div class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-input" placeholder="you@example.com">
    <span class="form-help">Helper text</span>
</div>

<div class="form-check">
    <input type="checkbox" class="form-check-input" id="check1">
    <label class="form-check-label" for="check1">Remember me</label>
</div>

<div class="form-switch">
    <input type="checkbox" class="form-switch-input" id="switch1">
    <label class="form-switch-label" for="switch1">Enable feature</label>
</div>
```

### Tables

```html
<table class="table table-striped">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John Doe</td>
            <td>john@example.com</td>
            <td><span class="badge badge-success">Active</span></td>
        </tr>
    </tbody>
</table>
```

### Alerts

```html
<div class="alert alert-info">
    <div class="alert-icon">ℹ️</div>
    <div class="alert-content">
        <div class="alert-title">Info</div>
        <div class="alert-message">This is an informational message.</div>
    </div>
</div>

<div class="alert alert-success">Success message!</div>
<div class="alert alert-warning">Warning message!</div>
<div class="alert alert-danger">Error message!</div>
```

### Loading States

```html
<!-- Spinners -->
<div class="spinner"></div>
<div class="spinner spinner-lg"></div>
<div class="spinner-dots">
    <span></span>
    <span></span>
    <span></span>
</div>

<!-- Skeletons -->
<div class="skeleton-card">
    <div class="skeleton-title"></div>
    <div class="skeleton-text"></div>
    <div class="skeleton-text"></div>
</div>

<!-- Button loading -->
<button class="btn btn-primary loading">Loading...</button>
```

### Modals

```html
<div class="modal-backdrop show">
    <div class="modal">
        <div class="modal-header">
            <h3 class="modal-title">Modal Title</h3>
            <button class="modal-close">✕</button>
        </div>
        <div class="modal-body">
            <p>Modal content goes here...</p>
        </div>
        <div class="modal-footer">
            <button class="btn">Cancel</button>
            <button class="btn btn-primary">Confirm</button>
        </div>
    </div>
</div>
```

## 🌓 Dark Mode

### Activation automatique

Le dark mode s'active automatiquement :

```html
<script src="path/to/uikit/js/dark-mode.js"></script>
```

Le script détecte les préférences système et persiste le choix dans localStorage.

### Toggle manuel

```html
<button data-theme-toggle>
    <span data-theme-icon>🌙</span>
    Toggle Theme
</button>
```

### API JavaScript

```javascript
// Définir le thème
UIKitTheme.set('dark');    // ou 'light'

// Basculer le thème
UIKitTheme.toggle();

// Récupérer le thème actuel
const current = UIKitTheme.get();

// Écouter les changements
window.addEventListener('themechange', (e) => {
    console.log('Nouveau thème:', e.detail.theme);
});
```

## 📐 Layouts CSS

**9 structures CSS réutilisables** utilisant Grid et Flexbox moderne.

Chaque layout est une classe CSS qui définit la structure. Voir `layouts/index.html` pour la démo complète.

### Layouts disponibles

1. **layout-3col** - Dashboard 3 colonnes (280px / 400px / flex)
2. **layout-sidebar-left** - Sidebar gauche + content (260px / flex)
3. **layout-sidebar-right** - Sidebar droite + content (flex / 280px)
4. **layout-holy-grail** - Header + Nav + Main + Aside + Footer
5. **layout-split** - Split screen 50/50 (variantes 30/70, 70/30)
6. **layout-header-content** - Header + Content (option sticky)
7. **layout-app** - Header + Nav + Main (Grid areas)
8. **layout-masonry** - Auto grid responsive (min 250px)
9. **layout-dashboard** - Dashboard complexe (5 zones)
10. **layout-centered** - Contenu centré (login, erreurs)

### Exemple d'usage

```html
<!-- Layout 3 colonnes -->
<div class="layout-3col">
    <aside>Liste</aside>
    <section>Détails</section>
    <main>Activité</main>
</div>

<!-- Sidebar Left -->
<div class="layout-sidebar-left">
    <aside>Navigation</aside>
    <main>Content</main>
</div>

<!-- Holy Grail -->
<div class="layout-holy-grail">
    <header class="layout-holy-grail-header">Header</header>
    <nav class="layout-holy-grail-nav">Nav</nav>
    <main class="layout-holy-grail-main">Main</main>
    <aside class="layout-holy-grail-aside">Aside</aside>
    <footer class="layout-holy-grail-footer">Footer</footer>
</div>
```

**Tous les layouts sont responsive** avec breakpoints automatiques.

## 🎨 Personnalisation

Modifiez les variables dans `css/tokens.css` :

```css
:root {
    /* Couleurs */
    --color-primary: #5a90c7;
    --color-success: #7db46c;
    --color-warning: #cc8800;
    --color-danger: #d84444;

    /* Typographie */
    --font-size-base: 11px;
    --font-weight-medium: 500;

    /* Espacement */
    --spacing-4: 8px;
    --spacing-6: 12px;

    /* Bordures */
    --border-radius-md: 3px;
}
```

## 📖 Documentation

- **Documentation complète** : `docs/index.html` (tous les composants + dark mode)
- **Layouts Showcase** : `layouts/index.html` (9 layouts CSS visuels)

## 🔧 Utilitaires

Classes utilitaires disponibles :

```html
<!-- Grid -->
<div class="grid grid-3 gap-4">...</div>

<!-- Flexbox -->
<div class="flex-between">...</div>
<div class="flex-center">...</div>

<!-- Spacing -->
<div class="p-4 m-6">...</div>
<div class="px-4 py-6">...</div>

<!-- Text -->
<div class="text-center text-lg font-medium">...</div>

<!-- Colors -->
<div class="text-primary bg-secondary">...</div>
```

## ✅ Compatibilité

- **Navigateurs modernes** : Chrome, Firefox, Safari, Edge
- **CSS Variables** : IE11 non supporté
- **JavaScript** : Vanilla JS (pas de dépendances)
- **Responsive** : Mobile-first

## 📄 License

Libre d'utilisation pour vos projets personnels et professionnels.

## 🚀 Démarrage rapide

```bash
# Documentation complète (composants + dark mode)
open docs/index.html

# Layouts showcase (9 structures CSS)
open layouts/index.html
```

---

**Inspiré par** : UltimateArchiver3 Dashboard • Apple Design Language • Pico CSS

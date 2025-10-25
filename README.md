# UIKit

Design system réutilisable pour projets web classiques (HTML/CSS/JS).
Inspiré du style Apple/macOS moderne avec support **Dark Mode** intégré.

**🔗 GitHub:** https://github.com/bathtubsailor82/uikit

## ✨ Caractéristiques

- **18 composants** prêts à l'emploi
- **Dark Mode** automatique ou manuel
- **9 layouts CSS** réutilisables (Grid + Flexbox)
- **100% Vanilla** - pas de dépendances
- **Responsive** - optimisé mobile
- **Personnalisable** - variables CSS
- **Accessibilité** - WCAG 2.1 AA

## 📦 Installation

### Option 1 : Git Submodule (recommandé)

Intégrez l'UIKit comme submodule Git dans vos projets :

```bash
cd /path/to/votre/projet
git submodule add https://github.com/bathtubsailor82/uikit.git
git commit -m "Ajout UIKit submodule"
```

Puis dans votre HTML :

```html
<link rel="stylesheet" href="uikit/dist/uikit.css">
<script src="uikit/js/dark-mode.js"></script>
```

**Mise à jour du submodule :**
```bash
cd uikit
git pull origin main
cd ..
git add uikit
git commit -m "Update UIKit"
```

### Option 2 : CDN (jsDelivr)

Utilisez directement depuis le CDN :

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/bathtubsailor82/uikit@main/dist/uikit.css">
<script src="https://cdn.jsdelivr.net/gh/bathtubsailor82/uikit@main/js/dark-mode.js"></script>
```

### Option 3 : Clone simple

```bash
cd /path/to/votre/projet
git clone https://github.com/bathtubsailor82/uikit.git
```

### Option 4 : Import personnalisé

Importez uniquement les composants dont vous avez besoin :

```html
<link rel="stylesheet" href="uikit/css/tokens.css">
<link rel="stylesheet" href="uikit/css/reset.css">
<link rel="stylesheet" href="uikit/css/components/buttons.css">
```

## 📁 Structure

```
uikit/
├── css/
│   ├── tokens.css              # Variables CSS + Dark Mode
│   ├── reset.css               # Reset basique
│   ├── layout.css              # Utilitaires grid/flex
│   ├── layouts.css             # 9 layouts CSS réutilisables
│   ├── accessibility.css       # Styles accessibilité WCAG
│   └── components/
│       ├── buttons.css         # Boutons
│       ├── badges.css          # Badges & status
│       ├── cards.css           # Cards & stats
│       ├── progress.css        # Barres de progression
│       ├── tabs.css            # Navigation par onglets
│       ├── accordion.css       # Accordéons
│       ├── avatar.css          # Avatars & groupes
│       ├── breadcrumb.css      # Fil d'Ariane
│       ├── pagination.css      # Pagination
│       ├── forms.css           # Inputs, selects, checkboxes, switch
│       ├── tables.css          # Tables responsive
│       ├── alerts.css          # Messages inline
│       ├── loading.css         # Spinners & skeletons
│       ├── modals.css          # Modals, dropdowns, tooltips
│       ├── logs.css            # Logs & monitoring
│       ├── list-items.css      # Liste d'items
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

### Badges

```html
<span class="badge">Default</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-active">Active</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Error</span>
<span class="badge badge-idle">Idle</span>

<!-- Status badge (plus grand) -->
<span class="status-badge active">Running</span>
<span class="status-badge paused">Paused</span>
<span class="status-badge error">Failed</span>
```

### Cards

```html
<!-- Card simple -->
<div class="card">
    <div class="card-header">Card Title</div>
    <div class="card-body">Card content goes here...</div>
    <div class="card-footer">Card footer</div>
</div>

<!-- Stat card -->
<div class="stat-card">
    <div class="stat-value">1,234</div>
    <div class="stat-label">Total Users</div>
    <div class="stat-detail">+12% from last month</div>
</div>

<!-- Clickable stat card -->
<div class="stat-card stat-card-button" tabindex="0">
    <div class="stat-value">42</div>
    <div class="stat-label">Active Tasks</div>
</div>
```

### Progress Bars

```html
<!-- Progress bar standard -->
<div class="progress-bar">
    <div class="progress-fill" style="width: 65%"></div>
    <div class="progress-text">65%</div>
</div>

<!-- Progress bar avec variantes -->
<div class="progress-bar">
    <div class="progress-fill success" style="width: 85%"></div>
</div>

<div class="progress-bar">
    <div class="progress-fill warning" style="width: 50%"></div>
</div>

<div class="progress-bar">
    <div class="progress-fill danger" style="width: 25%"></div>
</div>

<!-- Storage bar (petite) -->
<div class="storage-item">
    <div class="storage-header">
        <span class="storage-name">Documents</span>
        <span class="storage-usage">45.2 GB / 100 GB</span>
    </div>
    <div class="storage-bar">
        <div class="storage-fill ok" style="width: 45%"></div>
    </div>
</div>
```

### Tabs

```html
<div class="tabs-nav">
    <button class="tab-button active">Overview</button>
    <button class="tab-button">Settings</button>
    <button class="tab-button">Analytics</button>
</div>

<div class="tab-content active">
    <p>Overview content...</p>
</div>
<div class="tab-content">
    <p>Settings content...</p>
</div>
<div class="tab-content">
    <p>Analytics content...</p>
</div>
```

### Accordion

```html
<div class="accordion">
    <div class="accordion-item">
        <button class="accordion-header" aria-expanded="false">
            <span class="accordion-header-content">Item 1</span>
            <span class="accordion-icon">▼</span>
        </button>
        <div class="accordion-content" aria-hidden="true">
            <p>Content for item 1...</p>
        </div>
    </div>
    <div class="accordion-item">
        <button class="accordion-header" aria-expanded="false">
            <span class="accordion-header-content">Item 2</span>
            <span class="accordion-icon">▼</span>
        </button>
        <div class="accordion-content" aria-hidden="true">
            <p>Content for item 2...</p>
        </div>
    </div>
</div>

<!-- Variantes : accordion-flush, accordion-compact, accordion-lg -->
```

### Avatar

```html
<!-- Avatar avec image -->
<div class="avatar">
    <img src="user.jpg" alt="User">
</div>

<!-- Avatar avec initiales -->
<div class="avatar avatar-primary">
    <span class="avatar-initials">JD</span>
</div>

<!-- Tailles : avatar-xs, avatar-sm, avatar-md, avatar-lg, avatar-xl, avatar-2xl -->
<div class="avatar avatar-sm">
    <img src="user.jpg" alt="User">
</div>

<!-- Avatar avec status -->
<div class="avatar">
    <img src="user.jpg" alt="User">
    <span class="avatar-status online"></span>
</div>

<!-- Avatar group -->
<div class="avatar-group">
    <div class="avatar"><img src="user1.jpg" alt="User 1"></div>
    <div class="avatar"><img src="user2.jpg" alt="User 2"></div>
    <div class="avatar"><img src="user3.jpg" alt="User 3"></div>
    <div class="avatar-group-count">+5</div>
</div>

<!-- Avatar avec label -->
<div class="avatar-wrapper">
    <div class="avatar">
        <img src="user.jpg" alt="User">
    </div>
    <div class="avatar-label">
        <div class="avatar-name">John Doe</div>
        <div class="avatar-description">Developer</div>
    </div>
</div>
```

### Breadcrumb

```html
<!-- Breadcrumb basique -->
<nav aria-label="Breadcrumb">
    <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="#">Home</a></li>
        <li class="breadcrumb-item"><a href="#">Library</a></li>
        <li class="breadcrumb-item" aria-current="page">Data</li>
    </ol>
</nav>

<!-- Variantes de séparateurs -->
<ol class="breadcrumb breadcrumb-chevron">...</ol>
<ol class="breadcrumb breadcrumb-arrow">...</ol>
<ol class="breadcrumb breadcrumb-dot">...</ol>

<!-- Autres variantes : breadcrumb-compact, breadcrumb-lg, breadcrumb-bg -->
```

### Pagination

```html
<!-- Pagination standard -->
<nav class="pagination">
    <div class="pagination-item pagination-prev">
        <a href="#" class="pagination-link">Previous</a>
    </div>
    <div class="pagination-item">
        <a href="#" class="pagination-link">1</a>
    </div>
    <div class="pagination-item">
        <a href="#" class="pagination-link active">2</a>
    </div>
    <div class="pagination-item">
        <a href="#" class="pagination-link">3</a>
    </div>
    <div class="pagination-ellipsis">...</div>
    <div class="pagination-item">
        <a href="#" class="pagination-link">10</a>
    </div>
    <div class="pagination-item pagination-next">
        <a href="#" class="pagination-link">Next</a>
    </div>
</nav>

<!-- Variantes : pagination-sm, pagination-lg, pagination-rounded, pagination-pills -->
```

### Forms

```html
<!-- Input basique -->
<div class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-input" placeholder="you@example.com">
    <span class="form-help">Helper text</span>
</div>

<!-- Select -->
<div class="form-group">
    <label class="form-label">Country</label>
    <select class="form-select">
        <option>France</option>
        <option>Canada</option>
        <option>United States</option>
    </select>
</div>

<!-- Textarea -->
<div class="form-group">
    <label class="form-label">Message</label>
    <textarea class="form-textarea" placeholder="Your message"></textarea>
</div>

<!-- Checkbox simple -->
<div class="form-check">
    <input type="checkbox" class="form-check-input" id="check1">
    <label class="form-check-label" for="check1">Remember me</label>
</div>

<!-- Checkbox custom avec checkmark -->
<div class="form-checkbox">
    <input type="checkbox" class="form-checkbox-input" id="custom1">
    <div class="form-checkbox-custom"></div>
    <label class="form-checkbox-label">Custom checkbox</label>
</div>

<!-- Radio buttons custom -->
<div class="form-radio">
    <input type="radio" class="form-radio-input" name="option" id="opt1">
    <div class="form-radio-custom"></div>
    <label class="form-radio-label">Option 1</label>
</div>

<!-- Switch toggle -->
<div class="form-switch">
    <input type="checkbox" class="form-switch-input" id="switch1">
    <label class="form-switch-label" for="switch1">Enable feature</label>
</div>

<!-- Input avec icône -->
<div class="form-input-wrapper">
    <span class="form-input-icon left">🔍</span>
    <input type="text" class="form-input form-input-icon-left" placeholder="Search...">
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

<!-- Variantes de taille : modal-sm, modal-lg, modal-xl, modal-full -->
<!-- Variantes de position : modal-drawer, modal-drawer-left, modal-bottom -->
```

### Dropdowns

```html
<div class="dropdown show">
    <button class="btn">Menu ▼</button>
    <div class="dropdown-menu">
        <button class="dropdown-item">Action</button>
        <button class="dropdown-item active">Current item</button>
        <button class="dropdown-item">Another action</button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item">Separated link</button>
    </div>
</div>

<!-- Position : dropdown-menu-right pour alignement à droite -->
```

### Tooltips

```html
<div class="tooltip">
    <button class="btn">Hover me</button>
    <span class="tooltip-text">Tooltip content here</span>
</div>

<!-- Position : tooltip-text.bottom pour affichage en bas -->
```

### Notifications

```html
<div class="notification success show">Operation completed!</div>
<div class="notification error show">An error occurred!</div>
<div class="notification info show">New message received</div>
<div class="notification warning show">Warning: Low disk space</div>
```

### Header

```html
<header class="header">
    <h1>Application Name</h1>
    <div class="status">
        <span class="badge badge-success">Online</span>
    </div>
</header>
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

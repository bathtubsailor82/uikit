# Design System Best Practices

> Guide de référence basé sur [Design System Checklist](https://www.designsystemchecklist.com)
>
> Date: 2025-10-13

## Table des matières

- [Structure d'un Design System](#structure-dun-design-system)
- [Foundations](#foundations)
- [Composants - Checklist universelle](#composants---checklist-universelle)
- [Composants spécifiques](#composants-spécifiques)
- [Accessibilité](#accessibilité)
- [Maintenance & Documentation](#maintenance--documentation)

---

## Structure d'un Design System

Un design system complet doit couvrir **4 piliers principaux** :

### 1. Design Language
- **Identité de marque** : Logo, couleurs signature, voice & tone
- **Principes directeurs** : Guidelines de conception
- **Vision** : Objectifs et philosophie du système

### 2. Foundations
- Système de couleurs
- Grilles et layouts
- Typographie
- Élévation et ombres
- Motion et animations
- Iconographie

### 3. Composants Core
- 20+ composants UI essentiels
- États et variantes
- Interactions et comportements
- Accessibilité intégrée

### 4. Maintenance
- Documentation complète
- Versioning
- Guidelines de contribution
- Support et communauté
- Processus de mise à jour

---

## Foundations

### Couleurs

#### Système de base
- **Couleurs primaires** : Identité de marque (1-3 couleurs)
- **Couleurs sémantiques** : Success, Warning, Danger, Info
- **Couleurs neutres** : Échelle de gris (bg, borders, text)
- **Couleurs d'état** : Hover, Active, Focus, Disabled

#### Dark mode
- Variables CSS pour chaque couleur
- Support automatique via `prefers-color-scheme`
- Toggle manuel avec persistance localStorage
- Contraste suffisant dans les deux modes (WCAG AA minimum)

#### Tokens recommandés
```css
/* Primaires */
--color-primary
--color-primary-hover
--color-primary-active
--color-primary-light (backgrounds)

/* Sémantiques */
--color-success / -warning / -danger / -info
--color-{semantic}-light
--color-{semantic}-dark

/* Backgrounds */
--color-bg-primary / -secondary / -tertiary
--color-bg-hover / -active

/* Text */
--color-text-primary / -secondary / -tertiary
--color-text-disabled

/* Borders */
--color-border-light / -medium / -dark
```

---

### Typographie

#### Éléments essentiels
- **Famille de polices** : Base + Mono
- **Échelle de tailles** : 6-8 tailles (xs → 3xl)
- **Poids** : Light, Regular, Medium, Semibold, Bold
- **Line height** : Tight (headings), Base (body), Relaxed (paragraphs)
- **Letter spacing** : Pour titres et labels

#### Tokens recommandés
```css
/* Familles */
--font-family-base
--font-family-mono
--font-family-heading (optionnel)

/* Tailles */
--font-size-xs → --font-size-3xl

/* Poids */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700

/* Line height */
--line-height-tight: 1.2
--line-height-base: 1.5
--line-height-relaxed: 1.6
```

---

### Espacement

#### Échelle cohérente
- **Progression** : Multiples de 4px ou 8px (ex: 4, 8, 12, 16, 24, 32, 48, 64)
- **Nommage** : Numérique (1-12) ou sémantique (xs-xl)

```css
--spacing-1: 4px
--spacing-2: 8px
--spacing-3: 12px
--spacing-4: 16px
--spacing-6: 24px
--spacing-8: 32px
--spacing-10: 40px
--spacing-12: 48px
```

---

### Bordures & Radius

```css
/* Largeurs */
--border-width: 1px
--border-width-thick: 2px

/* Radius */
--border-radius-sm: 2px
--border-radius-md: 4px
--border-radius-lg: 8px
--border-radius-xl: 12px
--border-radius-full: 9999px
```

---

### Ombres & Élévation

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
--shadow-sm: 0 2px 4px rgba(0,0,0,0.1)
--shadow-md: 0 4px 8px rgba(0,0,0,0.15)
--shadow-lg: 0 8px 16px rgba(0,0,0,0.2)
--shadow-xl: 0 12px 24px rgba(0,0,0,0.25)

/* Z-index */
--z-base: 0
--z-sticky: 10
--z-dropdown: 100
--z-modal: 1000
--z-notification: 2000
```

---

### Transitions & Animations

```css
/* Durées */
--transition-fast: 150ms
--transition-base: 200ms
--transition-slow: 300ms

/* Easing */
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
```

---

## Composants - Checklist universelle

Cette checklist s'applique à **TOUS** les composants interactifs :

### États visuels obligatoires
- [ ] **Default** : État de base
- [ ] **Hover** : Au survol (desktop)
- [ ] **Active** : Lors du clic/pression
- [ ] **Focus** : Navigation clavier (CRITIQUE pour a11y)
- [ ] **Disabled** : Non interactif (opacity + cursor)
- [ ] **Loading** : Indicateur de chargement (si async)

### Variantes de taille
- [ ] Small (compact)
- [ ] Medium/Default
- [ ] Large (emphasis)

### Variantes sémantiques
- [ ] Default/Neutral
- [ ] Primary (action principale)
- [ ] Success (confirmation)
- [ ] Warning (attention)
- [ ] Danger (destruction)
- [ ] Info (information)

### Support visuel
- [ ] **Icônes** : Position prefix/suffix
- [ ] **Labels** : Texte clair
- [ ] **Placeholder** : Texte d'aide (inputs)

### Accessibilité (WCAG 2.1 AA minimum)
- [ ] **Contraste** : 4.5:1 texte, 3:1 UI
- [ ] **Focus visible** : Outline ou ring distinct
- [ ] **ARIA roles** : Rôles sémantiques appropriés
- [ ] **ARIA labels** : Labels pour screen readers
- [ ] **Keyboard navigation** : Tab, Enter, Space, Escape
- [ ] **Touch target** : Min 44x44px (mobile)

### Responsive
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

### Documentation requise
- [ ] Exemples de code HTML
- [ ] Classes CSS disponibles
- [ ] Props/Options JavaScript (si applicable)
- [ ] Cas d'usage recommandés
- [ ] Pièges à éviter

---

## Composants spécifiques

### Button

#### Checklist
- [ ] Variantes : default, primary, secondary, outline, ghost, link
- [ ] États : default, hover, active, focus, disabled, loading
- [ ] Tailles : sm, md, lg
- [ ] Largeur : inline, block, auto
- [ ] Icônes : prefix, suffix, icon-only
- [ ] Loading state avec spinner
- [ ] Groups : button-group pour actions groupées

#### Accessibilité
```html
<!-- Bon exemple -->
<button
    type="button"
    class="btn btn-primary"
    aria-label="Submit form"
    disabled>
    Submit
</button>

<!-- Bouton icon-only -->
<button class="btn btn-icon" aria-label="Close dialog">
    <svg>...</svg>
</button>
```

#### CSS Focus
```css
.btn:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
```

---

### Form Controls

#### Input

**Checklist**
- [ ] Types : text, email, password, number, search, tel, url
- [ ] États : default, focus, error, success, disabled, readonly
- [ ] Tailles : sm, md, lg
- [ ] Prefix/suffix : icônes ou texte
- [ ] Helper text : instructions sous le champ
- [ ] Error message : message d'erreur visible
- [ ] Character counter : pour limites (ex: 140/280)

**Structure recommandée**
```html
<div class="form-group">
    <label for="email" class="form-label">
        Email <span class="required">*</span>
    </label>
    <input
        type="email"
        id="email"
        class="form-input"
        placeholder="you@example.com"
        aria-describedby="email-help"
        required>
    <span id="email-help" class="form-help">
        We'll never share your email.
    </span>
    <span class="form-error" role="alert">
        Please enter a valid email.
    </span>
</div>
```

---

#### Checkbox & Radio

**Checklist**
- [ ] Custom styling (remplacer natif)
- [ ] États : unchecked, checked, indeterminate (checkbox), disabled
- [ ] Label associé (for + id)
- [ ] Group : fieldset pour groupes
- [ ] Inline vs stacked layout

**Accessibilité**
```html
<fieldset>
    <legend>Choose your plan</legend>

    <div class="form-check">
        <input
            type="radio"
            id="basic"
            name="plan"
            value="basic"
            class="form-check-input">
        <label for="basic" class="form-check-label">
            Basic Plan
        </label>
    </div>

    <div class="form-check">
        <input
            type="radio"
            id="pro"
            name="plan"
            value="pro"
            class="form-check-input">
        <label for="pro" class="form-check-label">
            Pro Plan
        </label>
    </div>
</fieldset>
```

---

#### Select

**Checklist**
- [ ] Single select
- [ ] Multi select
- [ ] Searchable (optionnel)
- [ ] Placeholder
- [ ] États : default, focus, disabled, error
- [ ] Custom dropdown styling
- [ ] Groupes d'options (optgroup)

---

#### Textarea

**Checklist**
- [ ] Resize : none, vertical, both
- [ ] Auto-grow : expansion automatique
- [ ] Character counter
- [ ] Min/max height
- [ ] États : default, focus, error, disabled

---

#### Switch/Toggle

**Checklist**
- [ ] États : off, on, disabled
- [ ] Tailles : sm, md, lg
- [ ] Labels : position left/right
- [ ] Animation de transition
- [ ] Accessible via checkbox sous-jacent

```html
<div class="form-switch">
    <input
        type="checkbox"
        id="notifications"
        class="form-switch-input"
        role="switch"
        aria-checked="false">
    <label for="notifications" class="form-switch-label">
        Enable notifications
    </label>
</div>
```

---

### Alert

**Checklist**
- [ ] Variantes : info, success, warning, danger
- [ ] Icône représentative
- [ ] Titre + message
- [ ] Dismissible : bouton fermer
- [ ] Actions : boutons d'action inline
- [ ] Tailles : sm, md, lg
- [ ] Banner : full-width pour messages système

**Accessibilité**
```html
<div class="alert alert-warning" role="alert">
    <div class="alert-icon" aria-hidden="true">⚠</div>
    <div class="alert-content">
        <div class="alert-title">Warning</div>
        <div class="alert-message">Your session will expire soon.</div>
    </div>
    <button class="alert-close" aria-label="Dismiss alert">×</button>
</div>
```

---

### Badge

**Checklist**
- [ ] Variantes sémantiques : success, warning, danger, info, neutral
- [ ] Tailles : sm, md, lg
- [ ] Pill : border-radius full
- [ ] Dot : badge point (notifications)
- [ ] Icône intégrée
- [ ] Dismissible : avec croix
- [ ] Positionnement : absolute pour overlays (ex: avatar)
- [ ] Counter : affichage numérique (notifications)

---

### Modal/Dialog

**Checklist**
- [ ] Backdrop : overlay avec opacité
- [ ] Header : titre + bouton fermer
- [ ] Body : contenu scrollable
- [ ] Footer : actions (Cancel/Confirm)
- [ ] Tailles : sm, md, lg, xl, fullscreen
- [ ] Centrée verticalement
- [ ] Animation : fade + scale
- [ ] Fermeture : ESC, backdrop click, bouton
- [ ] Scroll lock : empêcher scroll body

**Accessibilité**
```html
<div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description">

    <div class="modal-header">
        <h3 id="modal-title" class="modal-title">
            Confirm action
        </h3>
        <button
            class="modal-close"
            aria-label="Close dialog">
            ×
        </button>
    </div>

    <div class="modal-body" id="modal-description">
        <p>Are you sure you want to continue?</p>
    </div>

    <div class="modal-footer">
        <button class="btn">Cancel</button>
        <button class="btn btn-primary">Confirm</button>
    </div>
</div>
```

**Focus trap requis**
```javascript
// Piéger le focus dans la modal
modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }
});
```

---

### Tooltip

**Checklist**
- [ ] Positions : top, right, bottom, left
- [ ] Trigger : hover, focus, click
- [ ] Delay : apparition/disparition
- [ ] Arrow/pointer
- [ ] Max-width : éviter tooltips trop larges
- [ ] Dark/light variants

**Accessibilité**
```html
<button
    aria-describedby="tooltip-1"
    data-tooltip="Save changes">
    Save
</button>

<div
    id="tooltip-1"
    role="tooltip"
    class="tooltip">
    Save changes
</div>
```

---

### Dropdown

**Checklist**
- [ ] Trigger : button, link, input
- [ ] Positions : bottom-left, bottom-right, top-left, top-right
- [ ] Items : links, buttons, dividers, headers
- [ ] Multi-level : sub-menus
- [ ] Keyboard navigation : Arrow keys, ESC
- [ ] Click outside : fermeture automatique

---

### Accordion

**Checklist**
- [ ] Header : titre + icône expand/collapse
- [ ] Content : zone collapsible
- [ ] Animation : smooth transition
- [ ] Single vs multiple : un ou plusieurs ouverts simultanément
- [ ] Icône rotation : indication visuelle
- [ ] Keyboard : Space/Enter pour toggle

**Accessibilité**
```html
<div class="accordion">
    <button
        class="accordion-header"
        aria-expanded="false"
        aria-controls="panel-1">
        Section 1
        <span class="accordion-icon" aria-hidden="true">▼</span>
    </button>
    <div
        id="panel-1"
        class="accordion-content"
        role="region"
        hidden>
        Content goes here...
    </div>
</div>
```

---

### Card

**Checklist**
- [ ] Header : titre + actions
- [ ] Body : contenu principal
- [ ] Footer : actions ou metadata
- [ ] Image : support image top/left
- [ ] Hover state : élévation/shadow
- [ ] Clickable : card entière cliquable
- [ ] Variants : outlined, elevated, flat

---

### Avatar

**Checklist**
- [ ] Image : avec fallback
- [ ] Initiales : texte 1-2 caractères
- [ ] Icône : placeholder générique
- [ ] Tailles : xs, sm, md, lg, xl
- [ ] Shape : circle, rounded, square
- [ ] Status indicator : badge online/offline
- [ ] Group : stack multiple avatars

**Fallback cascade**
```html
<!-- 1. Image prioritaire -->
<div class="avatar">
    <img src="user.jpg" alt="John Doe">
</div>

<!-- 2. Initiales si pas d'image -->
<div class="avatar" style="background: #5a90c7;">
    <span>JD</span>
</div>

<!-- 3. Icône par défaut -->
<div class="avatar">
    <svg><!-- user icon --></svg>
</div>
```

---

### Table

**Checklist**
- [ ] Header : sticky optionnel
- [ ] Striped rows : alternance couleur
- [ ] Hover row : highlight
- [ ] Sorting : colonnes triables
- [ ] Selection : checkboxes
- [ ] Actions : boutons par ligne
- [ ] Pagination : intégrée ou séparée
- [ ] Empty state : message si vide
- [ ] Loading state : skeleton ou spinner
- [ ] Responsive : scroll horizontal ou stacked mobile

---

### Breadcrumb

**Checklist**
- [ ] Items : liens + séparateur
- [ ] Current page : non cliquable
- [ ] Truncation : ellipsis si trop long
- [ ] Collapse : mobile avec dropdown
- [ ] Icône home : optionnel pour racine

**Accessibilité**
```html
<nav aria-label="Breadcrumb">
    <ol class="breadcrumb">
        <li><a href="/">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li aria-current="page">Item Detail</li>
    </ol>
</nav>
```

---

### Pagination

**Checklist**
- [ ] First/Last : boutons extrêmes
- [ ] Previous/Next : navigation adjacente
- [ ] Page numbers : numéros cliquables
- [ ] Truncation : ellipsis pour longues listes
- [ ] Current page : highlighted
- [ ] Disabled state : début/fin
- [ ] Jump to page : input optionnel
- [ ] Items per page : sélecteur

---

### Tabs

**Checklist**
- [ ] Tab list : navigation horizontale
- [ ] Active indicator : underline ou background
- [ ] Disabled tabs
- [ ] Vertical tabs : layout optionnel
- [ ] Keyboard : Arrow keys pour navigation
- [ ] Icon support : icônes + labels

**Accessibilité**
```html
<div class="tabs" role="tablist">
    <button
        role="tab"
        aria-selected="true"
        aria-controls="panel-1"
        id="tab-1">
        Tab 1
    </button>
    <button
        role="tab"
        aria-selected="false"
        aria-controls="panel-2"
        id="tab-2">
        Tab 2
    </button>
</div>

<div
    role="tabpanel"
    id="panel-1"
    aria-labelledby="tab-1">
    Content 1
</div>
```

---

### Progress Bar

**Checklist**
- [ ] Determinate : pourcentage connu
- [ ] Indeterminate : animation infinie
- [ ] Tailles : height variants
- [ ] Colors : success, warning, danger
- [ ] Label : pourcentage visible
- [ ] Striped : animation optionnelle

---

### Loading States

**Checklist**
- [ ] Spinner : circular loader
- [ ] Skeleton : placeholder animé
- [ ] Progress bar : chargement linéaire
- [ ] Overlay : loading sur contenu existant
- [ ] Tailles : sm, md, lg

---

### Toast/Notification

**Checklist**
- [ ] Positions : top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
- [ ] Variantes : info, success, warning, danger
- [ ] Auto-dismiss : timeout configurable
- [ ] Action buttons : CTA inline
- [ ] Stack : multiple toasts
- [ ] Animation : slide + fade
- [ ] Close button : dismissible

**Accessibilité**
```html
<div
    class="toast toast-success"
    role="status"
    aria-live="polite"
    aria-atomic="true">
    <div class="toast-icon">✓</div>
    <div class="toast-content">
        <div class="toast-title">Success</div>
        <div class="toast-message">Item saved successfully</div>
    </div>
    <button class="toast-close" aria-label="Close notification">×</button>
</div>
```

---

## Accessibilité

### Principes WCAG 2.1 (AA minimum)

#### 1. Perceivable (Perceptible)

**Contraste**
- Texte normal : 4.5:1 minimum
- Texte large (18px+) : 3:1 minimum
- Composants UI : 3:1 minimum
- Outils : [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Alternatives textuelles**
```html
<!-- Images -->
<img src="chart.png" alt="Sales chart showing 20% increase">

<!-- Icons fonctionnelles -->
<button aria-label="Close dialog">
    <svg aria-hidden="true">...</svg>
</button>

<!-- Icons décoratives -->
<span class="icon" aria-hidden="true">★</span>
```

---

#### 2. Operable (Utilisable)

**Navigation clavier**
- Tab : navigation avant
- Shift+Tab : navigation arrière
- Enter : activation
- Space : activation (checkbox, button)
- Escape : fermeture (modal, dropdown)
- Arrow keys : navigation dans listes/menus

**Focus visible**
```css
/* Moderne : focus-visible (uniquement clavier) */
button:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

/* Supprimer le focus souris */
button:focus:not(:focus-visible) {
    outline: none;
}

/* Fallback ancien navigateur */
button:focus {
    outline: 2px solid var(--color-primary);
}
```

**Touch targets**
- Minimum 44x44px (iOS) ou 48x48px (Android)
- Espacement entre cibles : 8px minimum

---

#### 3. Understandable (Compréhensible)

**Labels et instructions**
```html
<!-- Labels visibles ET associés -->
<label for="username">Username</label>
<input id="username" type="text">

<!-- Instructions claires -->
<label for="password">
    Password
    <span class="form-help">
        Must be at least 8 characters
    </span>
</label>
<input id="password" type="password" aria-describedby="pwd-help">
<span id="pwd-help" class="form-help">
    Include uppercase, lowercase, and numbers
</span>

<!-- Messages d'erreur -->
<input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error">
<span id="email-error" role="alert" class="form-error">
    Please enter a valid email address
</span>
```

---

#### 4. Robust (Robuste)

**HTML sémantique**
```html
<!-- Bon : sémantique -->
<nav>
    <ul>
        <li><a href="/">Home</a></li>
    </ul>
</nav>

<main>
    <article>
        <h1>Title</h1>
        <p>Content...</p>
    </article>
</main>

<!-- Mauvais : divs sans sens -->
<div class="navigation">
    <div class="link">Home</div>
</div>
```

**ARIA roles et attributs**
```html
<!-- Status updates -->
<div role="status" aria-live="polite">
    Item added to cart
</div>

<!-- Alerts urgentes -->
<div role="alert" aria-live="assertive">
    Error: Form submission failed
</div>

<!-- Hidden content -->
<div aria-hidden="true">Decorative content</div>

<!-- Expanded/collapsed -->
<button
    aria-expanded="false"
    aria-controls="menu">
    Menu
</button>
<div id="menu" hidden>...</div>
```

---

### Checklist accessibilité par composant

#### Buttons
- [ ] Type défini (button, submit, reset)
- [ ] Label ou aria-label
- [ ] Focus visible
- [ ] Disabled avec aria-disabled (si interactive)
- [ ] Loading avec aria-busy="true"

#### Links
- [ ] Href valide
- [ ] Texte descriptif (pas "click here")
- [ ] Nouvelle fenêtre : aria-label="Opens in new window"
- [ ] Focus visible

#### Forms
- [ ] Label pour chaque input
- [ ] Error messages avec aria-describedby
- [ ] Required avec aria-required ou required
- [ ] Validation avec aria-invalid
- [ ] Fieldset pour groupes

#### Modals
- [ ] role="dialog"
- [ ] aria-modal="true"
- [ ] aria-labelledby (titre)
- [ ] aria-describedby (description)
- [ ] Focus trap
- [ ] ESC pour fermer
- [ ] Restore focus après fermeture

#### Images
- [ ] Alt text descriptif
- [ ] Alt vide si décorative (alt="")
- [ ] Figure + figcaption pour contexte

---

## Maintenance & Documentation

### Versioning (Semantic Versioning)

```
MAJOR.MINOR.PATCH

1.0.0 → Initial release
1.0.1 → Bug fixes
1.1.0 → New features (backward compatible)
2.0.0 → Breaking changes
```

**CHANGELOG.md requis**
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New Accordion component
- Avatar component with fallbacks

### Changed
- Improved button focus states
- Updated color contrast for WCAG AA

### Fixed
- Modal focus trap on Safari
- Badge alignment in flex containers

### Deprecated
- `.btn-outline` (use `.btn-secondary` instead)

## [1.1.0] - 2024-01-01
...
```

---

### Documentation structure

```
docs/
├── index.html              # Hub central
├── getting-started.md      # Installation, setup
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   └── accessibility.md
├── components/
│   ├── button.md
│   ├── input.md
│   ├── modal.md
│   └── ...
├── patterns/              # Recipes, exemples complets
│   ├── forms.md
│   ├── navigation.md
│   └── dashboard.md
├── design-tokens.md       # Variables CSS complètes
└── changelog.md
```

**Chaque composant doit documenter :**
1. Description et cas d'usage
2. Exemples de code (HTML + CSS)
3. Variantes disponibles
4. Props/Options JavaScript (si applicable)
5. Accessibilité (keyboard, ARIA)
6. Pièges courants
7. Compat navigateurs si spécifique

---

### Guidelines de contribution

**CONTRIBUTING.md**
```markdown
# Comment contribuer

## Proposer un composant

1. Vérifier qu'il n'existe pas déjà
2. Ouvrir une issue avec use case
3. Soumettre PR avec :
   - CSS du composant
   - Documentation
   - Exemples HTML
   - Tests accessibilité

## Standards de code

- BEM naming convention
- Variables CSS pour tout
- Mobile-first responsive
- WCAG AA minimum
- Support IE11 (ou documenter fallback)

## Checklist avant PR

- [ ] Testé sur Chrome, Firefox, Safari
- [ ] Testé en dark mode
- [ ] Testé navigation clavier
- [ ] Testé avec screen reader
- [ ] Documentation à jour
- [ ] Exemples fonctionnels
```

---

## Ressources

### Outils essentiels

**Accessibilité**
- [WAVE](https://wave.webaim.org/) - Test accessibilité
- [axe DevTools](https://www.deque.com/axe/) - Extension navigateur
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Design Tokens**
- [Style Dictionary](https://amzn.github.io/style-dictionary/) - Transformer tokens multi-plateformes

**Documentation**
- [Storybook](https://storybook.js.org/) - UI component explorer
- [Docusaurus](https://docusaurus.io/) - Site documentation

**Inspiration**
- [Material Design](https://material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Pico CSS](https://picocss.com/)
- [Tailwind UI](https://tailwindui.com/)

### Références

- [Design System Checklist](https://www.designsystemchecklist.com) - Source de ce document
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

---

## Notes d'implémentation pour UIKit

### Priorité HAUTE
1. Focus states pour tous composants interactifs
2. Button loading + icon support
3. Forms : textarea, radio, input-group

### Priorité MOYENNE
4. Accordion
5. Avatar
6. Breadcrumb
7. Pagination

### Priorité BASSE
8. Motion tokens documentés
9. Icon system SVG
10. Playground interactif

---

**Dernière mise à jour :** 2025-10-13
**Basé sur :** Design System Checklist v1.0
**Maintenu par :** UIKit team

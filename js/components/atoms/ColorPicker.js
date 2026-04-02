/**
 * ColorPicker - Grille de swatches pour selection de couleur entite
 * Composant UIKit atom reutilisable pour HW Labels, Buses, Tracks
 *
 * @example
 * const picker = new ColorPicker(container, {
 *   value: '#4caf50',
 *   preset: 'normal',
 *   onChange: (color) => console.log(color)  // '#e54545'
 * });
 *
 * picker.setValue('#e59a30');
 * picker.getValue();  // '#e59a30'
 * picker.destroy();
 */

// ============================================================================
// DEFAULT PALETTE (24 couleurs optimisees fond sombre)
// Peut etre overridee via config.palette
// Source de verite app-level : static/js/utils/color-utils.js
// ============================================================================

const DEFAULT_PALETTE = [
    { hex: '#e54545', name: 'Red' },
    { hex: '#e8725a', name: 'Coral' },
    { hex: '#e59a30', name: 'Orange' },
    { hex: '#c8a030', name: 'Amber' },
    { hex: '#d4c840', name: 'Yellow' },
    { hex: '#8cc63f', name: 'Lime' },
    { hex: '#4caf50', name: 'Green' },
    { hex: '#2e9e6e', name: 'Emerald' },
    { hex: '#2e9e9e', name: 'Teal' },
    { hex: '#30b8c8', name: 'Cyan' },
    { hex: '#4aa4e0', name: 'Sky' },
    { hex: '#4a7ee0', name: 'Blue' },
    { hex: '#5a5ec8', name: 'Indigo' },
    { hex: '#8050c8', name: 'Purple' },
    { hex: '#a050c0', name: 'Violet' },
    { hex: '#c850a0', name: 'Magenta' },
    { hex: '#e05088', name: 'Rose' },
    { hex: '#e07088', name: 'Pink' },
    { hex: '#708090', name: 'Slate' },
    { hex: '#6088a8', name: 'Steel' },
    { hex: '#689878', name: 'Sage' },
    { hex: '#a89860', name: 'Sand' },
    { hex: '#987858', name: 'Brown' },
    { hex: '#c8b898', name: 'Cream' },
];

// ============================================================================
// PRESETS
// ============================================================================

const COLORPICKER_PRESETS = {
    compact: { swatchSize: 16, gap: 2, columns: 8 },
    normal:  { swatchSize: 20, gap: 3, columns: 8 },
    large:   { swatchSize: 24, gap: 4, columns: 6 }
};

// ============================================================================
// CLASS
// ============================================================================

class ColorPicker {
    constructor(container, config = {}) {
        this.container = container;

        // Apply preset
        const presetName = config.preset || 'normal';
        const preset = COLORPICKER_PRESETS[presetName] || COLORPICKER_PRESETS.normal;

        this.config = {
            value: null,
            palette: DEFAULT_PALETTE,
            allowNone: false,
            disabled: false,
            onChange: null,
            ...preset,
            ...config
        };

        this.value = this.config.value;
        this.element = null;
        this.swatches = [];

        this.render();
        this.setupEventListeners();
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    render() {
        const el = document.createElement('div');
        const presetName = this.config.preset || 'normal';
        el.className = `color-picker color-picker--${presetName}`;
        if (this.config.disabled) {
            el.classList.add('color-picker--disabled');
        }
        el.setAttribute('role', 'radiogroup');
        el.setAttribute('aria-label', 'Color selection');

        // Swatches
        this.swatches = [];
        this.config.palette.forEach((entry, i) => {
            const hex = typeof entry === 'string' ? entry : entry.hex;
            const name = typeof entry === 'string' ? hex : entry.name;
            const btn = this._createSwatch(hex, name, i);
            el.appendChild(btn);
            this.swatches.push(btn);
        });

        // Optional "none" swatch
        if (this.config.allowNone) {
            const noneBtn = this._createNoneSwatch();
            el.appendChild(noneBtn);
            this.swatches.push(noneBtn);
        }

        // Replace or append
        if (this.element) {
            this.container.replaceChild(el, this.element);
        } else {
            this.container.appendChild(el);
        }

        this.element = el;
        this._updateActiveState();
    }

    _createSwatch(hex, name, index) {
        const btn = document.createElement('button');
        btn.className = 'color-picker__swatch';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', name);
        btn.setAttribute('title', name);
        btn.setAttribute('tabindex', index === 0 ? '0' : '-1');
        btn.style.setProperty('--swatch-color', hex);
        btn.dataset.color = hex;
        return btn;
    }

    _createNoneSwatch() {
        const btn = document.createElement('button');
        btn.className = 'color-picker__swatch color-picker__swatch--none';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', 'No color');
        btn.setAttribute('title', 'No color');
        btn.setAttribute('tabindex', '-1');
        btn.dataset.color = '';
        btn.innerHTML = '<span class="color-picker__none-icon">\u00d7</span>';
        return btn;
    }

    _updateActiveState() {
        this.swatches.forEach(btn => {
            const color = btn.dataset.color;
            const isActive = this.value
                ? color.toLowerCase() === this.value.toLowerCase()
                : color === '' && this.value === null;

            btn.classList.toggle('color-picker__swatch--active', isActive);
            btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // If nothing active, first swatch gets tabindex 0
        const hasActive = this.swatches.some(
            btn => btn.classList.contains('color-picker__swatch--active')
        );
        if (!hasActive && this.swatches.length > 0) {
            this.swatches[0].setAttribute('tabindex', '0');
        }
    }

    // ========================================================================
    // EVENT LISTENERS
    // ========================================================================

    setupEventListeners() {
        // Click delegation
        this._onClick = (e) => {
            const swatch = e.target.closest('.color-picker__swatch');
            if (!swatch || this.config.disabled) return;

            const color = swatch.dataset.color || null;
            this.value = color;
            this._updateActiveState();
            swatch.focus();

            if (this.config.onChange) {
                this.config.onChange(color);
            }
        };
        this.container.addEventListener('click', this._onClick);

        // Keyboard navigation
        this._onKeydown = (e) => {
            const swatch = e.target.closest('.color-picker__swatch');
            if (!swatch || this.config.disabled) return;

            const index = this.swatches.indexOf(swatch);
            if (index === -1) return;

            const cols = this.config.columns;
            let next = -1;

            switch (e.key) {
                case 'ArrowRight':
                    next = index + 1;
                    break;
                case 'ArrowLeft':
                    next = index - 1;
                    break;
                case 'ArrowDown':
                    next = index + cols;
                    break;
                case 'ArrowUp':
                    next = index - cols;
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    swatch.click();
                    return;
                case 'Home':
                    next = 0;
                    break;
                case 'End':
                    next = this.swatches.length - 1;
                    break;
                default:
                    return;
            }

            e.preventDefault();

            if (next >= 0 && next < this.swatches.length) {
                swatch.setAttribute('tabindex', '-1');
                this.swatches[next].setAttribute('tabindex', '0');
                this.swatches[next].focus();
            }
        };
        this.container.addEventListener('keydown', this._onKeydown);
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Set value programmatically
     * @param {string|null} hex - Hex color or null for none
     */
    setValue(hex) {
        this.value = hex;
        this._updateActiveState();
    }

    /**
     * Get current value
     * @returns {string|null}
     */
    getValue() {
        return this.value;
    }

    /**
     * Enable or disable the picker
     * @param {boolean} disabled
     */
    setDisabled(disabled) {
        this.config.disabled = disabled;
        if (this.element) {
            this.element.classList.toggle('color-picker--disabled', disabled);
        }
    }

    /**
     * Cleanup DOM and event listeners
     */
    destroy() {
        if (this._onClick) {
            this.container.removeEventListener('click', this._onClick);
            this._onClick = null;
        }
        if (this._onKeydown) {
            this.container.removeEventListener('keydown', this._onKeydown);
            this._onKeydown = null;
        }
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        this.swatches = [];
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Browser global
if (typeof window !== 'undefined') {
    window.ColorPicker = ColorPicker;
    window.COLORPICKER_PRESETS = COLORPICKER_PRESETS;
}

// ES6 modules
export { ColorPicker, COLORPICKER_PRESETS };
export default ColorPicker;

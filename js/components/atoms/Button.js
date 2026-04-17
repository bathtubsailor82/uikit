/**
 * Button - Audio Console Button Component
 * Hardware-inspired 3D button with configurable states and colors
 *
 * @example
 * const btn = new Button(container, {
 *   type: 'latch',           // 'latch' | 'momentary'
 *   label: 'M',              // Text or HTML
 *   preset: 'monitor',       // 'monitor' | 'solo' | 'phase' | 'mute' | 'record'
 *   size: 'normal',          // 'normal' | 'compact'
 *   active: false,
 *   disabled: false,
 *   onToggle: (active) => {}
 * })
 */

// Button Presets (colors and behavior)
const BUTTON_PRESETS = {
  monitor: {
    type: 'latch',
    label: 'M',
    colorActive: 'blue',    // CSS modifier: .audio-btn--blue
    title: 'Monitor'
  },
  solo: {
    type: 'latch',
    label: 'S',
    colorActive: 'amber',
    title: 'Solo'
  },
  phase: {
    type: 'latch',
    label: 'Ø',
    colorActive: 'blue',
    title: 'Phase Invert'
  },
  mute: {
    type: 'latch',
    label: 'M',
    colorActive: 'red',
    title: 'Mute'
  },
  record: {
    type: 'latch',
    label: '●',
    colorActive: 'red',
    title: 'Record'
  }
};

class Button {
  constructor(container, config = {}) {
    this.container = container;

    // Apply preset if provided
    const preset = config.preset ? BUTTON_PRESETS[config.preset] : {};

    this.config = {
      type: 'latch',        // latch (toggle) or momentary (hold)
      label: 'BTN',
      preset: null,
      colorActive: 'blue',  // blue | amber | red | green
      size: 'normal',       // normal | compact
      active: false,
      disabled: false,
      title: '',
      onToggle: null,
      ...preset,
      ...config
    };

    this.element = null;
    this.render();
    this.setupEventListeners();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const btn = document.createElement('button');
    btn.className = this.getClassNames();
    btn.type = 'button';
    btn.disabled = this.config.disabled;

    if (this.config.title) {
      btn.title = this.config.title;
    }

    btn.innerHTML = this.config.label;

    if (this.element) {
      this.container.replaceChild(btn, this.element);
    } else {
      this.container.appendChild(btn);
    }

    this.element = btn;
  }

  getClassNames() {
    const classes = ['audio-btn'];

    // Size modifier
    if (this.config.size !== 'normal') {
      classes.push(`audio-btn--${this.config.size}`);
    }

    // Active state
    if (this.config.active) {
      classes.push('audio-btn--active');
      classes.push(`audio-btn--${this.config.colorActive}`);
    }

    // Disabled state
    if (this.config.disabled) {
      classes.push('audio-btn--disabled');
    }

    return classes.join(' ');
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  setupEventListeners() {
    if (this.config.type === 'latch') {
      this.element.addEventListener('click', () => this.handleLatchClick());
    } else if (this.config.type === 'momentary') {
      this.element.addEventListener('mousedown', () => this.handleMomentaryDown());
      this.element.addEventListener('mouseup', () => this.handleMomentaryUp());
      this.element.addEventListener('mouseleave', () => this.handleMomentaryUp());
    }
  }

  handleLatchClick() {
    if (this.config.disabled) return;

    this.config.active = !this.config.active;
    this.updateVisualState();

    if (this.config.onToggle) {
      this.config.onToggle(this.config.active);
    }
  }

  handleMomentaryDown() {
    if (this.config.disabled) return;

    this.config.active = true;
    this.updateVisualState();

    if (this.config.onToggle) {
      this.config.onToggle(true);
    }
  }

  handleMomentaryUp() {
    if (this.config.disabled) return;

    this.config.active = false;
    this.updateVisualState();

    if (this.config.onToggle) {
      this.config.onToggle(false);
    }
  }

  // ========================================================================
  // STATE UPDATES
  // ========================================================================

  updateVisualState() {
    this.element.className = this.getClassNames();
  }

  setState(active) {
    this.config.active = active;
    this.updateVisualState();
  }

  setDisabled(disabled) {
    this.config.disabled = disabled;
    this.element.disabled = disabled;
    this.updateVisualState();
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.Button = Button;
  window.BUTTON_PRESETS = BUTTON_PRESETS;
}

// Export for module usage
export { Button, BUTTON_PRESETS };
export default Button;

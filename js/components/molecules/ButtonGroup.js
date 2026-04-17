/**
 * ButtonGroup - Adaptive Button Layout for Audio Tracks
 * Displays buttons according to track size with predefined sets
 *
 * @example
 * const group = new ButtonGroup(container, {
 *   size: 'normal',           // 'compact' | 'normal' | 'large'
 *                              // Note: 'mini' (no VU-meter) will be added
 *   buttons: ['monitor', 'solo', 'phase', 'mute'],
 *   states: {
 *     monitor: false,
 *     solo: false
 *   },
 *   onToggle: (buttonId, active) => {}
 * })
 */

import Button from '../atoms/Button.js';

// Button sets for each track size
// MVP : Mute + Solo (per-bus). Monitor supprime du MVP (voir spec AUDIOTRACK-UI).
// Note: mini variant (40px, no VU-meter) will be added separately
const BUTTON_SETS = {
  compact: ['mute', 'solo'],                       // 40px (formerly mini)
  normal: ['mute', 'solo', 'phase'],               // 60px (formerly compact)
  large: ['mute', 'solo', 'phase']                 // 75px (formerly normal)
};

class ButtonGroup {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      size: 'normal',              // compact | normal | large (mini will be added)
      buttons: null,               // Custom list, or use BUTTON_SETS[size]
      states: {},                  // Initial button states
      buttonSize: 'normal',        // Size of individual buttons
      onToggle: null,
      ...config
    };

    // Use predefined button set if custom list not provided
    if (!this.config.buttons) {
      this.config.buttons = BUTTON_SETS[this.config.size] || BUTTON_SETS.normal;
    }

    this.element = null;
    this.buttons = {}; // Map of button ID -> Button instance

    this.render();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const group = document.createElement('div');
    group.className = this.getClassNames();

    if (this.element) {
      this.container.replaceChild(group, this.element);
    } else {
      this.container.appendChild(group);
    }

    this.element = group;

    // Create button instances
    this.config.buttons.forEach(buttonId => {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'button-group__item';
      group.appendChild(btnContainer);

      const button = new Button(btnContainer, {
        preset: buttonId,
        size: this.config.buttonSize,
        active: this.config.states[buttonId] || false,
        onToggle: (active) => this.handleToggle(buttonId, active)
      });

      this.buttons[buttonId] = button;
    });
  }

  getClassNames() {
    const classes = ['button-group'];

    // Size modifier (determines grid layout)
    if (this.config.size !== 'normal') {
      classes.push(`button-group--${this.config.size}`);
    }

    return classes.join(' ');
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  handleToggle(buttonId, active) {
    // Update local state
    this.config.states[buttonId] = active;

    // Notify parent
    if (this.config.onToggle) {
      this.config.onToggle(buttonId, active);
    }
  }

  // ========================================================================
  // STATE UPDATES
  // ========================================================================

  setState(buttonId, active) {
    if (this.buttons[buttonId]) {
      this.buttons[buttonId].setState(active);
      this.config.states[buttonId] = active;
    }
  }

  getState(buttonId) {
    return this.config.states[buttonId] || false;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  destroy() {
    // Destroy all button instances
    Object.values(this.buttons).forEach(btn => btn.destroy());
    this.buttons = {};

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.ButtonGroup = ButtonGroup;
  window.BUTTON_SETS = BUTTON_SETS;
}

// Export for module usage
export { ButtonGroup, BUTTON_SETS };
export default ButtonGroup;

/**
 * LED - Hardware LED Indicator Component
 * Realistic LED with glow effects and animations
 *
 * @example
 * const led = new LED(container, {
 *   state: 'off',           // 'off' | 'active' | 'recording'
 *   color: 'green',         // 'green' | 'red' | 'amber' | 'blue'
 *   size: 'normal',         // 'normal' | 'small' | 'large'
 *   blink: false            // Enable blink animation
 * })
 */

class LED {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      state: 'off',          // off | active | recording
      color: 'green',        // green | red | amber | blue
      size: 'normal',        // normal | small | large
      blink: false,          // Enable blink animation
      ...config
    };

    this.element = null;
    this.render();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const led = document.createElement('div');
    led.className = this.getClassNames();

    if (this.element) {
      this.container.replaceChild(led, this.element);
    } else {
      this.container.appendChild(led);
    }

    this.element = led;
  }

  getClassNames() {
    const classes = ['led'];

    // Size modifier
    if (this.config.size !== 'normal') {
      classes.push(`led--${this.config.size}`);
    }

    // State modifier
    if (this.config.state === 'active') {
      classes.push('led--active');
      classes.push(`led--${this.config.color}`);
    } else if (this.config.state === 'recording') {
      classes.push('led--recording');
      classes.push(`led--${this.config.color}`);
    }

    // Blink modifier (only applies when active or recording)
    if (this.config.blink && this.config.state !== 'off') {
      classes.push('led--blink');
    }

    return classes.join(' ');
  }

  // ========================================================================
  // STATE UPDATES
  // ========================================================================

  setState(state) {
    this.config.state = state;
    this.updateVisualState();
  }

  setColor(color) {
    this.config.color = color;
    this.updateVisualState();
  }

  setBlink(blink) {
    this.config.blink = blink;
    this.updateVisualState();
  }

  updateVisualState() {
    this.element.className = this.getClassNames();
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
  window.LED = LED;
}

// Export for module usage
export default LED;

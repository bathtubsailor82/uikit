/**
 * Timer - LCD-Style Timer Display
 * Configurable colors for idle/running states
 *
 * @example
 * const timer = new Timer(container, {
 *   state: 'idle',           // 'idle' | 'running'
 *   time: 0,                 // seconds
 *   colorIdle: '#666',
 *   colorRunning: '#0f0'
 * })
 */

class Timer {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      state: 'idle',           // idle | running
      time: 0,                 // seconds
      colorIdle: '#666666',
      colorRunning: '#ff3333',  // Red for recording
      ...config
    };

    this.element = null;

    this.render();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const timer = document.createElement('div');
    timer.className = this.getClassNames();
    timer.textContent = this.formatTime(this.config.time);

    // Apply color based on state
    this.applyColor(timer);

    if (this.element) {
      this.container.replaceChild(timer, this.element);
    } else {
      this.container.appendChild(timer);
    }

    this.element = timer;
  }

  getClassNames() {
    const classes = ['timer'];

    if (this.config.state === 'running') {
      classes.push('timer--running');
    }

    return classes.join(' ');
  }

  applyColor(element) {
    const el = element || this.element;
    if (!el) return;

    const color = this.config.state === 'running'
      ? this.config.colorRunning
      : this.config.colorIdle;

    el.style.color = color;
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  setState(state) {
    if (state === this.config.state) return;
    this.config.state = state;
    this.updateVisualState();
  }

  setTime(seconds) {
    if (seconds === this.config.time) return;
    this.config.time = seconds;
    if (this.element) {
      this.element.textContent = this.formatTime(seconds);
    }
  }

  updateVisualState() {
    if (!this.element) return;

    this.element.className = this.getClassNames();
    this.applyColor();
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
  window.Timer = Timer;
}

// Export for module usage
export default Timer;

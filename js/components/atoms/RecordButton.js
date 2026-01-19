/**
 * RecordButton - Circular Record Button
 * Hardware-inspired button with inner dot and states
 *
 * @example
 * const btn = new RecordButton(container, {
 *   state: 'idle',          // 'idle' | 'armed' | 'recording'
 *   onClick: (state) => {},
 *   onCancel: () => {}
 * })
 */

class RecordButton {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      state: 'idle',        // idle | armed | recording
      onClick: null,
      onCancel: null,
      ...config
    };

    this.element = null;
    this.dotEl = null;

    this.render();
    this.setupEventListeners();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const button = document.createElement('div');
    button.className = this.getClassNames();

    button.innerHTML = `
      <div class="record-button__dot"></div>
    `;

    if (this.element) {
      this.container.replaceChild(button, this.element);
    } else {
      this.container.appendChild(button);
    }

    this.element = button;
    this.dotEl = button.querySelector('.record-button__dot');
  }

  getClassNames() {
    const classes = ['record-button'];

    if (this.config.state === 'armed') {
      classes.push('record-button--armed');
    } else if (this.config.state === 'recording') {
      classes.push('record-button--recording');
    }

    return classes.join(' ');
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  setupEventListeners() {
    // Left click
    this.element.addEventListener('click', (e) => {
      if (e.button === 0 && !e.shiftKey) {
        if (this.config.onClick) {
          this.config.onClick(this.config.state);
        }
      }
    });

    // Right click or Shift+click = cancel
    this.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.config.onCancel) {
        this.config.onCancel();
      }
    });

    this.element.addEventListener('click', (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        if (this.config.onCancel) {
          this.config.onCancel();
        }
      }
    });
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  setState(state) {
    this.config.state = state;
    this.updateVisualState();
  }

  getState() {
    return this.config.state;
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
  window.RecordButton = RecordButton;
}

// Export for module usage
export default RecordButton;

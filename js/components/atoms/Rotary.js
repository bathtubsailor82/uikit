/**
 * Rotary - Hardware Rotary Knob Component
 * Realistic 3D rotary with drag interaction
 *
 * @example
 * const rotary = new Rotary(container, {
 *   preset: 'threshold',    // 'threshold' | 'gain' | 'custom'
 *   label: 'THR',
 *   value: -30,
 *   min: -90,
 *   max: 6,
 *   step: 1,
 *   sensitivity: 0.3,
 *   onChange: (value) => {}
 * })
 */

// Rotary Presets
const ROTARY_PRESETS = {
  threshold: {
    label: 'THR',
    min: -90,
    max: 6,
    step: 1,
    sensitivity: 0.3,
    format: (v) => `${v}`
  },
  gain: {
    label: 'GAIN',
    min: -30,
    max: 12,
    step: 1,
    sensitivity: 0.2,
    format: (v) => {
      const sign = v >= 0 ? '+' : '';
      return `${sign}${v}dB`;
    }
  }
};

class Rotary {
  constructor(container, config = {}) {
    this.container = container;

    // Apply preset if provided
    const preset = config.preset ? ROTARY_PRESETS[config.preset] : {};

    this.config = {
      preset: null,
      label: 'ROT',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      sensitivity: 0.5,        // Drag sensitivity (dB per pixel)
      format: (v) => `${v}`,   // Value formatter
      onChange: null,
      ...preset,
      ...config
    };

    this.element = null;
    this.knobEl = null;
    this.valueEl = null;
    this.indicatorEl = null;

    this.isDragging = false;
    this.startY = 0;
    this.startValue = 0;

    this.render();
    this.setupEventListeners();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const rotary = document.createElement('div');
    rotary.className = 'rotary';

    // Calculate rotation angle based on value
    const rotation = this.valueToRotation(this.config.value);

    rotary.innerHTML = `
      <div class="rotary__knob">
        <div class="rotary__indicator" style="transform: translateX(-50%) rotate(${rotation}deg); transform-origin: center 12px;"></div>
      </div>
      <div class="rotary__value">${this.config.format(this.config.value)}</div>
      <div class="rotary__label">${this.config.label}</div>
    `;

    if (this.element) {
      this.container.replaceChild(rotary, this.element);
    } else {
      this.container.appendChild(rotary);
    }

    this.element = rotary;
    this.knobEl = rotary.querySelector('.rotary__knob');
    this.valueEl = rotary.querySelector('.rotary__value');
    this.indicatorEl = rotary.querySelector('.rotary__indicator');
  }

  // ========================================================================
  // EVENT LISTENERS
  // ========================================================================

  setupEventListeners() {
    this.knobEl.addEventListener('mousedown', (e) => this.startDrag(e));
  }

  startDrag(e) {
    e.preventDefault();

    this.isDragging = true;
    this.startY = e.clientY;
    this.startValue = this.config.value;

    const onMouseMove = (e) => this.handleDrag(e);
    const onMouseUp = () => this.stopDrag(onMouseMove, onMouseUp);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // Add dragging visual feedback
    this.knobEl.classList.add('rotary__knob--dragging');
  }

  handleDrag(e) {
    if (!this.isDragging) return;

    const deltaY = this.startY - e.clientY; // Inverted: up = increase
    const valueDelta = deltaY * this.config.sensitivity;
    const newValue = this.startValue + valueDelta;

    // Clamp and step
    const clampedValue = Math.max(this.config.min, Math.min(this.config.max, newValue));
    const steppedValue = Math.round(clampedValue / this.config.step) * this.config.step;

    this.setValue(steppedValue, false); // Update visual without triggering onChange during drag
  }

  stopDrag(onMouseMove, onMouseUp) {
    this.isDragging = false;

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    // Remove dragging visual feedback
    this.knobEl.classList.remove('rotary__knob--dragging');

    // Trigger onChange at end of drag
    if (this.config.onChange) {
      this.config.onChange(this.config.value);
    }
  }

  // ========================================================================
  // VALUE & ROTATION
  // ========================================================================

  valueToRotation(value) {
    const { min, max } = this.config;
    const range = max - min;
    const normalized = (value - min) / range;  // 0 to 1
    return normalized * 270 - 135;  // Map to -135deg to +135deg
  }

  setValue(value, triggerChange = true) {
    this.config.value = value;

    // Update visual
    const rotation = this.valueToRotation(value);
    this.indicatorEl.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
    this.indicatorEl.style.transformOrigin = 'center 12px';
    this.valueEl.textContent = this.config.format(value);

    // Trigger onChange if requested
    if (triggerChange && this.config.onChange) {
      this.config.onChange(value);
    }
  }

  getValue() {
    return this.config.value;
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
  window.Rotary = Rotary;
  window.ROTARY_PRESETS = ROTARY_PRESETS;
}

// Export for module usage
export { Rotary, ROTARY_PRESETS };
export default Rotary;

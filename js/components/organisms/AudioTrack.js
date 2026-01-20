/**
 * AudioTrack - Complete Audio Track Strip
 * Professional console track with adaptive layout
 *
 * @example
 * const track = new AudioTrack(container, {
 *   trackId: 1,
 *   size: 'normal',        // 'compact' | 'normal' | 'large'
 *                          // Note: 'mini' (40px, no VU-meter) will be added
 *   location: 'P-01',
 *   language: 'FR',
 *   threshold: -30,
 *   gain: 0,
 *   monitoring: false,
 *   solo: false,
 *   armed: false,
 *   recording: false,
 *   onMonitorToggle: (enabled) => {},
 *   onSoloToggle: (enabled) => {},
 *   onRecordToggle: (state) => {},
 *   onThresholdChange: (value) => {},
 *   onGainChange: (value) => {},
 *   onLocationClick: (value) => {},
 *   onLanguageClick: (value) => {}
 * })
 */

import ButtonGroup, { BUTTON_SETS } from '../molecules/ButtonGroup.js';
import RecordControl from '../molecules/RecordControl.js';
import Rotary from '../atoms/Rotary.js';

class AudioTrack {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      trackId: 1,
      size: 'normal',        // compact | normal | large (mini will be added)
      location: 'P-01',
      language: 'FR',
      threshold: -30,
      gain: 0,
      monitoring: false,
      solo: false,
      armed: false,
      recording: false,
      onMonitorToggle: null,
      onSoloToggle: null,
      onRecordToggle: null,
      onThresholdChange: null,
      onGainChange: null,
      onLocationClick: null,
      onLanguageClick: null,
      ...config
    };

    this.element = null;
    this.meter = null;
    this.buttonGroup = null;
    this.recordControl = null;
    this.thresholdRotary = null;
    this.gainRotary = null;

    this.render();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const track = document.createElement('div');
    track.className = this.getClassNames();
    track.dataset.trackId = this.config.trackId;

    track.innerHTML = `
      <!-- VU Meter Section -->
      <div class="audio-track__meter">
        <div class="audio-track__meter-target"></div>
      </div>

      <!-- Controls Section -->
      <div class="audio-track__controls">
        <!-- Button Group -->
        <div class="audio-track__buttons"></div>

        <!-- Rotaries (Threshold + Gain) -->
        <div class="audio-track__rotaries"></div>

        <!-- Record Control -->
        <div class="audio-track__record"></div>
      </div>

      <!-- Footer -->
      <div class="audio-track__footer">
        <div class="audio-track__footer-item audio-track__lang">${this.config.language}</div>
        <div class="audio-track__footer-item audio-track__location">${this.config.location}</div>
        <div class="audio-track__footer-item audio-track__number">#${String(this.config.trackId).padStart(3, '0')}</div>
      </div>
    `;

    if (this.element) {
      this.container.replaceChild(track, this.element);
    } else {
      this.container.appendChild(track);
    }

    this.element = track;

    // Initialize components
    this.initVUMeter();
    this.initButtonGroup();
    this.initRotaries();
    this.initRecordControl();
    this.setupEventListeners();
  }

  getClassNames() {
    const classes = ['audio-track'];

    // Size modifier
    if (this.config.size !== 'normal') {
      classes.push(`audio-track--${this.config.size}`);
    }

    // State modifiers
    if (this.config.armed) classes.push('audio-track--armed');
    if (this.config.recording) classes.push('audio-track--recording');

    return classes.join(' ');
  }

  initVUMeter() {
    const meterTarget = this.element.querySelector('.audio-track__meter-target');
    if (!meterTarget) return;

    // Get dimensions directly - no RAF needed
    // Browser has already laid out the element after render()
    const availableHeight = meterTarget.offsetHeight;
    const availableWidth = meterTarget.offsetWidth;

    if (window.VUMeter && availableHeight > 0) {
      // Use full available width - CSS handles padding
      const meterWidth = Math.max(20, availableWidth);

      this.meter = new window.VUMeter(meterTarget, {
        preset: 'track',
        orientation: 'vertical',
        showRMS: true,
        width: meterWidth,
        height: availableHeight,
        dbMin: -90,
        dbMax: 6,
        ballistics: true,
        releaseRate: 11.8
      });

      // Stop individual RAF - use shared RAF loop
      this.meter.stopAnimation();

      // Add threshold indicator
      this.addThresholdIndicator();
    }
  }

  addThresholdIndicator() {
    let container = this.element.querySelector('.vu-meter__scale');
    if (!container) {
      container = this.element.querySelector('.vu-meter');
    }
    if (!container) return;

    const triangle = document.createElement('div');
    triangle.className = 'audio-track__threshold-indicator';
    container.appendChild(triangle);

    this.updateThresholdIndicatorPosition();
  }

  updateThresholdIndicatorPosition() {
    const triangle = this.element.querySelector('.audio-track__threshold-indicator');
    if (!triangle) return;

    const dbMin = -90;
    const dbMax = 6;
    const threshold = this.config.threshold;

    let percent;
    if (threshold <= dbMin) {
      percent = 0;
    } else if (threshold >= dbMax) {
      percent = 100;
    } else {
      percent = ((threshold - dbMin) / (dbMax - dbMin)) * 100;
    }

    triangle.style.bottom = `${percent}%`;
  }

  initButtonGroup() {
    const buttonsContainer = this.element.querySelector('.audio-track__buttons');
    if (!buttonsContainer) return;

    this.buttonGroup = new ButtonGroup(buttonsContainer, {
      size: this.config.size,
      buttonSize: this.config.size === 'compact' ? 'compact' : 'normal',
      states: {
        monitor: this.config.monitoring,
        solo: this.config.solo
      },
      onToggle: (buttonId, active) => this.handleButtonToggle(buttonId, active)
    });
  }

  initRotaries() {
    const rotariesContainer = this.element.querySelector('.audio-track__rotaries');
    if (!rotariesContainer) return;

    // Threshold Rotary
    const thresholdContainer = document.createElement('div');
    rotariesContainer.appendChild(thresholdContainer);
    this.thresholdRotary = new Rotary(thresholdContainer, {
      preset: 'threshold',
      value: this.config.threshold,
      onChange: (value) => {
        this.config.threshold = value;
        this.updateThresholdIndicatorPosition();
        if (this.config.onThresholdChange) {
          this.config.onThresholdChange(value);
        }
      }
    });

    // Gain Rotary (skip for compact size)
    if (this.config.size !== 'compact') {
      const gainContainer = document.createElement('div');
      rotariesContainer.appendChild(gainContainer);
      this.gainRotary = new Rotary(gainContainer, {
        preset: 'gain',
        value: this.config.gain,
        onChange: (value) => {
          this.config.gain = value;
          if (this.config.onGainChange) {
            this.config.onGainChange(value);
          }
        }
      });
    }
  }

  initRecordControl() {
    const recordContainer = this.element.querySelector('.audio-track__record');
    if (!recordContainer) return;

    this.recordControl = new RecordControl(recordContainer, {
      armed: this.config.armed,
      recording: this.config.recording,
      onStateChange: (state) => {
        this.config.armed = state.armed;
        this.config.recording = state.recording;
        this.updateRecordState();

        if (this.config.onRecordToggle) {
          this.config.onRecordToggle(state);
        }
      }
    });
  }

  setupEventListeners() {
    // Footer clicks
    const langEl = this.element.querySelector('.audio-track__lang');
    const locationEl = this.element.querySelector('.audio-track__location');

    if (langEl) {
      langEl.addEventListener('click', () => {
        if (this.config.onLanguageClick) {
          this.config.onLanguageClick(this.config.language);
        }
      });
    }

    if (locationEl) {
      locationEl.addEventListener('click', () => {
        if (this.config.onLocationClick) {
          this.config.onLocationClick(this.config.location);
        }
      });
    }
  }

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  handleButtonToggle(buttonId, active) {
    if (buttonId === 'monitor') {
      this.config.monitoring = active;
      if (this.config.onMonitorToggle) {
        this.config.onMonitorToggle(active);
      }
    } else if (buttonId === 'solo') {
      this.config.solo = active;
      if (this.config.onSoloToggle) {
        this.config.onSoloToggle(active);
      }
    }
  }

  updateRecordState() {
    // Update track-level classes
    this.element.classList.toggle('audio-track--armed', this.config.armed);
    this.element.classList.toggle('audio-track--recording', this.config.recording);
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  updateMetering(peak, rms) {
    if (this.meter) {
      this.meter.update({ peak, rms });
    }
  }

  paintMeter() {
    if (this.meter) {
      this.meter.paint();
    }
  }

  updateLocation(location) {
    this.config.location = location;
    const locationEl = this.element.querySelector('.audio-track__location');
    if (locationEl) {
      locationEl.textContent = location;
    }
  }

  updateLanguage(language) {
    this.config.language = language;
    const langEl = this.element.querySelector('.audio-track__lang');
    if (langEl) {
      langEl.textContent = language;
    }
  }

  destroy() {
    if (this.meter) {
      this.meter.destroy();
      this.meter = null;
    }

    if (this.buttonGroup) {
      this.buttonGroup.destroy();
      this.buttonGroup = null;
    }

    if (this.recordControl) {
      this.recordControl.destroy();
      this.recordControl = null;
    }

    if (this.thresholdRotary) {
      this.thresholdRotary.destroy();
      this.thresholdRotary = null;
    }

    if (this.gainRotary) {
      this.gainRotary.destroy();
      this.gainRotary = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.AudioTrack = AudioTrack;
}

// Export for module usage
export default AudioTrack;

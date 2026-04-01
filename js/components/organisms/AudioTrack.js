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
 *   trackState: 0,         // 0=IDLE, 1=ARMED, 2=RECORDING (backend enum)
 *   onMonitorToggle: (enabled) => {},
 *   onSoloToggle: (enabled) => {},
 *   onRecordToggle: (trackState) => {},  // Callback avec trackState UInt32
 *   onThresholdChange: (value) => {},
 *   onGainChange: (value) => {},
 *   onLocationClick: (value) => {},
 *   onLanguageClick: (value) => {}
 * })
 */

import ButtonGroup, { BUTTON_SETS } from '../molecules/ButtonGroup.js';
import RecordControl from '../molecules/RecordControl.js';
import Rotary from '../atoms/Rotary.js';
import CanvasMeter from '../../CanvasMeter.js';

// Mapping mode -> CanvasMeter preset/config
// See CANVAS-METER.md and TRACK-UI-MVP.md section 3
// Track width 40px: meter 24px + ticks 4px = 28px canvas (labels overlay on meter, Reaper style)
const METER_CONFIG_BY_MODE = {
  compact: {
    // Compact 40px track: 28px canvas (24px meter + 4px ticks), labels overlay
    preset: 'track',
    override: {
      width: 24,
      showScale: true,
      showScaleLabels: true,  // Labels drawn ON meter (Reaper style)
      showNumeric: false,
      showNumericTop: true,
      showRMS: true,
      showPeakHold: true,
      showClipIndicator: true
    }
  },
  normal: {
    preset: 'track',
    override: { width: 24, showScaleLabels: true, showNumeric: false, showNumericTop: true, showPeakHold: true }
  },
  large: {
    preset: 'track',
    override: { width: 32, showScaleLabels: true, showNumeric: true, showNumericTop: true, showPeakHold: true }
  }
};

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
      pan: 0,
      monitoring: false,
      solo: false,
      trackState: 0,         // 0=IDLE, 1=ARMED, 2=RECORDING
      onMonitorToggle: null,
      onSoloToggle: null,
      onRecordToggle: null,  // Callback avec trackState (UInt32)
      onThresholdChange: null,
      onGainChange: null,
      onPanChange: null,
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
    this.panRotary = null;

    this.render();
  }

  // ========================================================================
  // STATE DERIVATION (trackState → armed/recording)
  // 0=IDLE, 1=ARMED, 2=RECORDING (auto), 3=MANUAL_RECORDING
  // ========================================================================

  get armed() {
    return this.config.trackState >= 1;
  }

  get recording() {
    // RECORDING (2) ou MANUAL_RECORDING (3)
    return this.config.trackState === 2 || this.config.trackState === 3;
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

        <!-- Pan Rotary (isolated between buttons and THR/GAIN) -->
        <div class="audio-track__pan"></div>

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
    this.initMeter();
    this.initButtonGroup();
    this.initPan();
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

    // State modifiers (derived from trackState)
    if (this.armed) classes.push('audio-track--armed');
    if (this.recording) classes.push('audio-track--recording');

    return classes.join(' ');
  }

  initMeter() {
    const meterTarget = this.element.querySelector('.audio-track__meter-target');
    if (!meterTarget) return;

    // RAF guard - ensure layout complete before measuring (Chrome flexbox timing)
    requestAnimationFrame(() => {
      const availableHeight = meterTarget.offsetHeight;
      const availableWidth = meterTarget.offsetWidth;

      // Guard against zero dimensions (Chrome flexbox race condition)
      if (availableHeight > 0 && availableWidth > 0) {
        // Get meter config based on track size mode
        const meterConfig = METER_CONFIG_BY_MODE[this.config.size] || METER_CONFIG_BY_MODE.normal;

        // Build config object with preset and overrides
        const config = {
          preset: meterConfig.preset,
          ...meterConfig.override,
          // Override height to match available space
          height: availableHeight,
          context: 'track'
        };

        // Create CanvasMeter instance
        this.meter = new CanvasMeter(meterTarget, config);

        // Add threshold indicator (overlay, separate from meter)
        this.addThresholdIndicator();
      } else {
        console.warn('AudioTrack: Meter init skipped - zero dimensions', {
          height: availableHeight,
          width: availableWidth
        });
      }
    });
  }

  addThresholdIndicator() {
    // Threshold indicator is an overlay on the meter container
    // Works with both CanvasMeter and legacy VUMeter
    let container = this.element.querySelector('.audio-track__meter-target');
    if (!container) {
      // Fallback to old selectors for backwards compatibility
      container = this.element.querySelector('.vu-meter__scale');
      if (!container) {
        container = this.element.querySelector('.vu-meter');
      }
    }
    if (!container) return;

    // Ensure container has relative positioning for absolute threshold indicator
    container.style.position = 'relative';

    const triangle = document.createElement('div');
    triangle.className = 'audio-track__threshold-indicator';
    container.appendChild(triangle);

    this.updateThresholdIndicatorPosition();
  }

  updateThresholdIndicatorPosition() {
    const triangle = this.element.querySelector('.audio-track__threshold-indicator');
    if (!triangle) return;

    // Get range from meter config or use defaults
    const dbMin = this.meter?.config?.minDB ?? -60;
    const dbMax = this.meter?.config?.maxDB ?? 0;
    const threshold = this.config.threshold;

    // Calculate percentage within dB range
    let percent;
    if (threshold <= dbMin) {
      percent = 0;
    } else if (threshold >= dbMax) {
      percent = 100;
    } else {
      percent = ((threshold - dbMin) / (dbMax - dbMin)) * 100;
    }

    // Get meter dimensions from CanvasMeter instance
    // Layout from top to bottom:
    // - numericTopHeight (14px if showNumericTop)
    // - clipHeight (4px if showClipIndicator)
    // - barHeight (rest of meterHeight minus clipHeight)
    if (this.meter) {
      const numericTopHeight = this.meter._numericTopHeight || 0;
      const clipHeight = this.meter.config.showClipIndicator ? 4 : 0;
      const meterHeight = this.meter._meterHeight;
      const barHeight = meterHeight - clipHeight;
      const barStartY = numericTopHeight + clipHeight;

      // Position from top: barStartY + barHeight * (1 - percent/100)
      // At 0 dB (100%), position = barStartY (top of bar)
      // At -60 dB (0%), position = barStartY + barHeight (bottom of bar)
      const posFromTop = barStartY + barHeight * (1 - percent / 100);
      triangle.style.top = `${posFromTop}px`;
      triangle.style.bottom = 'auto';
    } else {
      // Fallback to percentage if meter not ready
      triangle.style.bottom = `${percent}%`;
      triangle.style.top = 'auto';
    }
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

  initPan() {
    const panContainer = this.element.querySelector('.audio-track__pan');
    if (!panContainer) return;

    // Pan Rotary - visible in ALL modes (compact, normal, large)
    // Preparation for sends-on-faders (Epic C)
    const rotaryContainer = document.createElement('div');
    panContainer.appendChild(rotaryContainer);
    this.panRotary = new Rotary(rotaryContainer, {
      preset: 'pan',
      value: this.config.pan,
      onInput: (value) => {
        this.config.pan = value;
        if (this.config.onPanChange) {
          this.config.onPanChange(value, { realtime: true });
        }
      },
      onChange: (value) => {
        this.config.pan = value;
        if (this.config.onPanChange) {
          this.config.onPanChange(value);
        }
      }
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
      onInput: (value, options) => {
        // Real-time update during drag (visual only, smooth)
        this.config.threshold = value;
        this.updateThresholdIndicatorPosition();
        // Pass options.altKey for global threshold feature
        if (options?.altKey && this.config.onThresholdChange) {
          this.config.onThresholdChange(value, { altKey: true, realtime: true });
        }
      },
      onChange: (value, options) => {
        // Final update at end of drag (send to backend)
        this.config.threshold = value;
        this.updateThresholdIndicatorPosition();
        if (this.config.onThresholdChange) {
          // Pass options.altKey for global threshold feature
          this.config.onThresholdChange(value, { altKey: options?.altKey || false });
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
      armed: this.armed,
      recording: this.recording,
      thresholdExceeded: false,
      onStateChange: (state) => {
        // Convert armed/recording → trackState for backend
        // 0=IDLE, 1=ARMED, 2=RECORDING (auto), 3=MANUAL_RECORDING
        let newTrackState = 0; // IDLE

        if (state.manualRecording === true) {
          newTrackState = 3; // MANUAL_RECORDING (force record, ignore threshold)
        } else if (state.recording) {
          newTrackState = 2; // RECORDING (auto threshold)
        } else if (state.armed) {
          newTrackState = 1; // ARMED
        }

        // Note: on ne met plus à jour this.config.trackState ici
        // L'UI sera mise à jour par le WebSocket (flux unidirectionnel)

        if (this.config.onRecordToggle) {
          this.config.onRecordToggle(newTrackState);
        }
      }
    });
  }

  setupEventListeners() {
    // Footer clicks
    const langEl = this.element.querySelector('.audio-track__lang');
    const locationEl = this.element.querySelector('.audio-track__location');

    if (langEl) {
      langEl.addEventListener('click', (e) => {
        if (this.config.onLanguageClick) {
          this.config.onLanguageClick(this.config.language, e.currentTarget);
        }
      });
    }

    if (locationEl) {
      locationEl.addEventListener('click', (e) => {
        if (this.config.onLocationClick) {
          this.config.onLocationClick(this.config.location, e.currentTarget);
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
    // Update track-level classes (derived from trackState)
    this.element.classList.toggle('audio-track--armed', this.armed);
    this.element.classList.toggle('audio-track--recording', this.recording);
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  updateMetering(peak, rms, trackState, thresholdExceeded, gateState, recordingDurationSeconds, clip, peakHold, truePeak, ppm) {
    if (this.meter) {
      // CanvasMeter uses setValues() with all available metrics from backend
      // All values are pre-calculated in dB by backend
      this.meter.setValues({
        peak: peak,
        rms: rms,
        clip: clip || false,
        peakHold: peakHold,
        truePeak: truePeak,
        ppm: ppm
      });
    }

    // Update trackState from backend (toujours, sans condition)
    // Flux unidirectionnel: le WebSocket est la source de vérité
    if (trackState !== undefined) {
      this.config.trackState = trackState;
      this.updateRecordState();

      // Toujours synchroniser RecordControl avec l'état backend
      if (this.recordControl) {
        this.recordControl.setState(this.armed, this.recording);
      }
    }

    // Update LED from backend
    if (thresholdExceeded !== undefined && this.recordControl) {
      this.recordControl.setThresholdExceeded(thresholdExceeded, gateState);
    }

    // Update timer from backend
    if (recordingDurationSeconds !== undefined && this.recordControl) {
      this.recordControl.setDuration(recordingDurationSeconds);
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

  /**
   * Set threshold value (for global threshold feature)
   * Updates rotary, config, and visual indicator
   * @param {number} value - Threshold in dB
   */
  setThreshold(value) {
    this.config.threshold = value;
    if (this.thresholdRotary) {
      this.thresholdRotary.setValue(value, false); // false = don't trigger callback
    }
    this.updateThresholdIndicatorPosition();
  }

  /**
   * Set pan value externally (e.g. from WebSocket bus source update)
   * @param {number} value - Pan value (-100 to +100)
   */
  setPan(value) {
    this.config.pan = value;
    if (this.panRotary) {
      this.panRotary.setValue(value, false);
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

    if (this.panRotary) {
      this.panRotary.destroy();
      this.panRotary = null;
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

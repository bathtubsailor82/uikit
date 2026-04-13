/**
 * RecordControl - Record Button with LEDs and Timer
 * Manages record states: idle → armed → recording
 * LEDs: 1=threshold exceeded, 2=armed, 3=recording
 *
 * @example
 * const recordControl = new RecordControl(container, {
 *   armed: false,
 *   recording: false,
 *   thresholdExceeded: false,
 *   onStateChange: (state) => {}  // state: { armed, recording }
 * })
 */

import LED from '../atoms/LED.js';
import RecordButton from '../atoms/RecordButton.js';
import Timer from '../atoms/Timer.js';

class RecordControl {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      armed: false,
      recording: false,
      thresholdExceeded: false,
      onStateChange: null,  // Callback avec {armed, recording, manualRecording}
      ...config
    };

    this.element = null;
    this.recordButton = null;
    this.thresholdLED = null;  // LED 1: threshold exceeded (yellow)
    this.armedLED = null;      // LED 2: armed (green)
    this.recordingLED = null;  // LED 3: recording (red)
    this.timer = null;

    this.recordingStartTime = null;
    this.timerInterval = null;
    this.backendDuration = null;  // Duration from backend (overrides local timer)

    this.render();
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const control = document.createElement('div');
    control.className = 'record-control';

    control.innerHTML = `
      <!-- LEDs -->
      <div class="record-control__leds"></div>

      <!-- Timer -->
      <div class="record-control__timer"></div>

      <!-- Record Button -->
      <div class="record-control__button"></div>
    `;

    if (this.element) {
      this.container.replaceChild(control, this.element);
    } else {
      this.container.appendChild(control);
    }

    this.element = control;

    // Create LED instances
    const ledsContainer = control.querySelector('.record-control__leds');

    // LED 1: Threshold exceeded (amber/orange)
    const thresholdLEDContainer = document.createElement('div');
    ledsContainer.appendChild(thresholdLEDContainer);
    this.thresholdLED = new LED(thresholdLEDContainer, {
      state: this.config.thresholdExceeded ? 'active' : 'off',
      color: 'amber'
    });

    // LED 2: Armed (green)
    const armedLEDContainer = document.createElement('div');
    ledsContainer.appendChild(armedLEDContainer);
    this.armedLED = new LED(armedLEDContainer, {
      state: this.config.armed ? 'active' : 'off',
      color: 'green'
    });

    // LED 3: Recording (red)
    const recordingLEDContainer = document.createElement('div');
    ledsContainer.appendChild(recordingLEDContainer);
    this.recordingLED = new LED(recordingLEDContainer, {
      state: this.config.recording ? 'recording' : 'off',
      color: 'red'
    });

    // Create Timer instance
    const timerContainer = control.querySelector('.record-control__timer');
    this.timer = new Timer(timerContainer, {
      state: this.config.recording ? 'running' : 'idle',
      time: 0,
      colorIdle: '#666666',
      colorRunning: '#ff3333'  // Red for recording
    });

    // Create RecordButton instance
    const buttonContainer = control.querySelector('.record-control__button');
    this.recordButton = new RecordButton(buttonContainer, {
      state: this.getState(),
      onClick: () => this.toggleRecord(false),
      onCancel: () => this.toggleRecord(true)
    });

    // Start timer if recording
    if (this.config.recording && !this.timerInterval) {
      this.startTimer();
    }
  }

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  toggleRecord(isCancel) {
    const currentState = this.getState();

    // Option 1: Flux unidirectionnel - on envoie juste l'intention au backend
    // L'UI ne change que quand le WebSocket renvoie le nouvel état
    // Ca garantit que l'UI reflète toujours l'état réel du moteur

    if (!this.config.onStateChange) return;

    if (isCancel && (currentState === 'armed' || currentState === 'recording')) {
      // Cancel to idle (Shift+clic ou clic droit)
      this.config.onStateChange({ armed: false, recording: false });

    } else if (currentState === 'idle') {
      // CYCLE: idle -> armed
      this.config.onStateChange({ armed: true, recording: false });

    } else if (currentState === 'armed') {
      // CYCLE: armed -> force recording (manual)
      this.config.onStateChange({ manualRecording: true });

    } else {
      // CYCLE: recording -> idle
      this.config.onStateChange({ armed: false, recording: false });
    }

    // PAS de updateVisualState() ici - l'UI sera mise à jour par le WebSocket
  }

  getState() {
    if (this.config.recording) return 'recording';
    if (this.config.armed) return 'armed';
    return 'idle';
  }

  updateVisualState() {
    // Update RecordButton
    if (this.recordButton) {
      this.recordButton.setState(this.getState());
    }

    // Update individual LEDs
    if (this.thresholdLED) {
      this.thresholdLED.setState(this.config.thresholdExceeded ? 'active' : 'off');
    }
    if (this.armedLED) {
      this.armedLED.setState(this.config.armed ? 'active' : 'off');
    }
    if (this.recordingLED) {
      this.recordingLED.setState(this.config.recording ? 'recording' : 'off');
    }
  }

  /**
   * Set threshold exceeded state (external control from metering)
   * @param {boolean} exceeded - True if signal exceeds threshold
   * @param {string} gateState - Gate state machine: 'idle', 'attacking', 'recording', 'releasing'
   */
  setThresholdExceeded(exceeded, gateState = 'idle') {
    this.config.thresholdExceeded = exceeded;
    this.config.gateState = gateState;

    if (this.thresholdLED) {
      // Comportement LED selon gateState :
      // - idle/attack : LED suit thresholdExceeded en temps réel
      // - recording : LED fixe active
      // - release : LED clignote (signal absent mais still recording)
      if (gateState === 'recording') {
        this.thresholdLED.setState('active');
        this.thresholdLED.setBlink(false);
      } else if (gateState === 'release') {
        this.thresholdLED.setState('active');
        this.thresholdLED.setBlink(true);  // Clignote à 4Hz
      } else {
        // idle ou attack : suit le signal en temps réel
        this.thresholdLED.setState(exceeded ? 'active' : 'off');
        this.thresholdLED.setBlink(false);
      }
    }
  }

  setState(armed, recording) {
    if (armed === this.config.armed && recording === this.config.recording) {
      return;
    }

    const wasRecording = this.config.recording;

    this.config.armed = armed;
    this.config.recording = recording;

    // Start/stop timer based on recording state
    if (recording && !wasRecording) {
      this.startTimer();
    } else if (!recording && wasRecording) {
      this.stopTimer();
    }

    this.updateVisualState();
  }

  // ========================================================================
  // TIMER
  // ========================================================================

  startTimer() {
    this.recordingStartTime = Date.now();
    if (this.timer) {
      this.timer.setState('running');
    }
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.recordingStartTime = null;
    if (this.timer) {
      this.timer.setState('idle');
    }
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    if (!this.timer) return;

    let seconds = 0;

    // Priorité : durée backend > timer local
    if (this.backendDuration !== undefined && this.backendDuration !== null) {
      seconds = Math.floor(this.backendDuration);
    } else if (this.recordingStartTime) {
      seconds = Math.floor((Date.now() - this.recordingStartTime) / 1000);
    }

    this.timer.setTime(seconds);
  }

  /**
   * Set recording duration from backend (overrides local timer)
   * @param {number} durationSeconds - Duration in seconds
   */
  setDuration(durationSeconds) {
    this.backendDuration = durationSeconds;
    this.updateTimerDisplay();
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  destroy() {
    this.stopTimer();

    // Destroy Timer
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }

    // Destroy RecordButton
    if (this.recordButton) {
      this.recordButton.destroy();
      this.recordButton = null;
    }

    // Destroy individual LED instances
    if (this.thresholdLED) {
      this.thresholdLED.destroy();
      this.thresholdLED = null;
    }
    if (this.armedLED) {
      this.armedLED.destroy();
      this.armedLED = null;
    }
    if (this.recordingLED) {
      this.recordingLED.destroy();
      this.recordingLED = null;
    }

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.RecordControl = RecordControl;
}

// Export for module usage
export default RecordControl;

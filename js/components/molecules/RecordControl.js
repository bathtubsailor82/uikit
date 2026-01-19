/**
 * RecordControl - Record Button with LEDs and Timer
 * Manages record states: idle → armed → recording
 *
 * @example
 * const recordControl = new RecordControl(container, {
 *   armed: false,
 *   recording: false,
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
      onStateChange: null,
      ...config
    };

    this.element = null;
    this.recordButton = null;
    this.leds = [];
    this.timer = null;

    this.recordingStartTime = null;
    this.timerInterval = null;

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
    for (let i = 0; i < 2; i++) {
      const ledContainer = document.createElement('div');
      ledsContainer.appendChild(ledContainer);

      const led = new LED(ledContainer, {
        state: this.getLEDState(),
        color: this.config.recording ? 'red' : 'green'
      });
      this.leds.push(led);
    }

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

    if (isCancel && (currentState === 'armed' || currentState === 'recording')) {
      // Cancel to idle
      this.config.armed = false;
      this.config.recording = false;
      this.stopTimer();
    } else if (currentState === 'idle') {
      // idle → armed
      this.config.armed = true;
      this.config.recording = false;
    } else if (currentState === 'armed') {
      // armed → recording
      this.config.armed = false;
      this.config.recording = true;
      this.startTimer();
    } else {
      // recording → idle
      this.config.armed = false;
      this.config.recording = false;
      this.stopTimer();
    }

    this.updateVisualState();

    if (this.config.onStateChange) {
      this.config.onStateChange({
        armed: this.config.armed,
        recording: this.config.recording
      });
    }
  }

  getState() {
    if (this.config.recording) return 'recording';
    if (this.config.armed) return 'armed';
    return 'idle';
  }

  getLEDState() {
    if (this.config.recording) return 'recording';
    if (this.config.armed) return 'active';
    return 'off';
  }

  updateVisualState() {
    // Update RecordButton
    if (this.recordButton) {
      this.recordButton.setState(this.getState());
    }

    // Update LEDs
    const ledState = this.getLEDState();
    const ledColor = this.config.recording ? 'red' : 'green';
    this.leds.forEach(led => {
      led.setState(ledState);
      led.setColor(ledColor);
    });
  }

  setState(armed, recording) {
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

    if (this.recordingStartTime) {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      this.timer.setTime(elapsed);
    } else {
      this.timer.setTime(0);
    }
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

    // Destroy LED instances
    this.leds.forEach(led => led.destroy());
    this.leds = [];

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

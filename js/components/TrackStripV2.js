/**
 * TrackStripV2 - Professional Audio Console Track Strip
 * Hardware-inspired design with realistic 3D controls
 *
 * @example
 * const track = new TrackStripV2(container, {
 *   trackId: 1,
 *   location: 'P-01',
 *   language: 'FR',
 *   threshold: -30,
 *   gain: 0,
 *   monitoring: false,
 *   solo: false,
 *   onMonitorToggle: (enabled) => {},
 *   onSoloToggle: (enabled) => {},
 *   onRecordToggle: (state) => {},
 *   onThresholdChange: (value) => {},
 *   onLocationClick: (value) => {},
 *   onLanguageClick: (value) => {}
 * })
 *
 * track.updateMetering(peak, rms)
 * track.updateLocation('NEW-LOC')
 * track.updateLanguage('EN')
 */

class TrackStripV2 {
    constructor(container, config = {}) {
        this.container = container;
        this.config = {
            trackId: 1,
            location: 'P-01',
            language: 'FR',
            threshold: -30,
            gain: 0,
            monitoring: false,
            solo: false,
            armed: false,
            recording: false,
            ...config
        };

        this.meter = null;
        this.element = null;
        this.draggingThreshold = false;
        this.recordingStartTime = null;
        this.timerInterval = null;

        this.render();
        this.setupEventListeners();
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    render() {
        const div = document.createElement('div');
        div.className = 'track-strip-v2';
        div.dataset.trackId = this.config.trackId;

        // Apply state classes
        if (this.config.armed) div.classList.add('track-strip-v2--armed');
        if (this.config.recording) div.classList.add('track-strip-v2--recording');
        if (this.config.compact) div.classList.add('track-strip-v2--compact01');

        div.innerHTML = `
            <!-- VU Meter Section -->
            <div class="track-strip-v2__meter">
                <div class="track-strip-v2__meter-wrapper">
                    <div class="track-strip-v2__meter-target"></div>
                </div>
            </div>

            <!-- LEDs -->
            <div class="track-strip-v2__leds">
                <div class="track-strip-v2__led ${this.getLEDClass(0)}"></div>
                <div class="track-strip-v2__led ${this.getLEDClass(1)}"></div>
            </div>

            <!-- Timer -->
            <div class="track-strip-v2__timer">${this.formatTimer(0)}</div>

            <!-- Controls -->
            <div class="track-strip-v2__controls">
                <!-- Buttons Grid (4 for normal, 3 for compact01) -->
                <div class="track-strip-v2__btn-grid">
                    <button class="track-strip-v2__btn track-strip-v2__btn--monitor ${this.config.monitoring ? 'track-strip-v2__btn--active' : ''}"
                            data-control="monitor" title="Monitor">M</button>
                    <button class="track-strip-v2__btn track-strip-v2__btn--solo ${this.config.solo ? 'track-strip-v2__btn--active' : ''}"
                            data-control="solo" title="Solo">S</button>
                    ${this.config.compact ? `
                    <button class="track-strip-v2__btn" disabled style="opacity: 0.3;" title="Phase">Ø</button>
                    ` : `
                    <button class="track-strip-v2__btn" disabled style="opacity: 0.3;" title="Phase (wider track)">Ø</button>
                    <button class="track-strip-v2__btn" disabled style="opacity: 0.3;" title="Mute (wider track)">μ</button>
                    `}
                </div>

                <!-- Dual Rotaries (Threshold + Gain) -->
                <div class="track-strip-v2__rotaries">
                    <!-- Threshold Rotary -->
                    <div class="track-strip-v2__rotary" data-control="threshold">
                        <div class="track-strip-v2__rotary-knob">
                            <div class="track-strip-v2__rotary-indicator"
                                 style="transform: translateX(-50%) rotate(${this.thresholdToRotation(this.config.threshold)}deg); transform-origin: center 12px;"></div>
                        </div>
                        <div class="track-strip-v2__rotary-value">${this.config.threshold}</div>
                        <div class="track-strip-v2__rotary-label">THR</div>
                    </div>

                    <!-- Gain Rotary -->
                    <div class="track-strip-v2__rotary" data-control="gain">
                        <div class="track-strip-v2__rotary-knob">
                            <div class="track-strip-v2__rotary-indicator"
                                 style="transform: translateX(-50%) rotate(${this.gainToRotation(this.config.gain)}deg); transform-origin: center 12px;"></div>
                        </div>
                        <div class="track-strip-v2__rotary-value">${this.formatGain(this.config.gain)}</div>
                        <div class="track-strip-v2__rotary-label">GAIN</div>
                    </div>
                </div>

                <!-- Record Button -->
                <div class="track-strip-v2__record ${this.getRecordClass()}"
                     data-control="record">
                    <div class="track-strip-v2__record-dot"></div>
                </div>
            </div>

            <!-- Footer -->
            <div class="track-strip-v2__footer">
                <div class="track-strip-v2__footer-item track-strip-v2__lang">${this.config.language}</div>
                <div class="track-strip-v2__footer-item track-strip-v2__location">${this.config.location}</div>
                <div class="track-strip-v2__footer-item track-strip-v2__number">${String(this.config.trackId).padStart(2, '0')}</div>
            </div>
        `;

        if (this.element) {
            this.container.replaceChild(div, this.element);
        } else {
            this.container.appendChild(div);
        }

        this.element = div;

        // Initialize VUMeter
        this.initVUMeter();

        // Start timer if recording
        if (this.config.recording && !this.timerInterval) {
            this.startTimer();
        }
    }

    initVUMeter() {
        const meterTarget = this.element.querySelector('.track-strip-v2__meter-target');
        if (!meterTarget) return;

        // Wait for DOM to calculate height
        requestAnimationFrame(() => {
            const availableHeight = meterTarget.offsetHeight;

            if (window.VUMeter) {
                this.meter = new window.VUMeter(meterTarget, {
                    preset: 'standard',
                    showScale: true,
                    showNumeric: true,
                    showRMS: true,
                    showHold: true,
                    orientation: 'vertical',
                    width: 55,
                    height: availableHeight,
                    dbMin: -90,
                    dbMax: 6,
                    ballistics: true
                });

                // Add threshold indicator triangle
                this.addThresholdIndicator();
            }
        });
    }

    addThresholdIndicator() {
        // Add triangle to the scale element (same parent as ticks for correct positioning)
        const scale = this.element.querySelector('.vu-meter__scale');
        if (!scale) return;

        const triangle = document.createElement('div');
        triangle.className = 'track-strip-v2__threshold-indicator-triangle';
        scale.appendChild(triangle);

        this.updateThresholdIndicatorPosition();
    }

    updateThresholdIndicatorPosition() {
        const triangle = this.element.querySelector('.track-strip-v2__threshold-indicator-triangle');
        if (!triangle) return;

        // Use the same dbToPercent logic as VUMeter for precise alignment
        const dbMin = -90;
        const dbMax = 6;
        const threshold = this.config.threshold;

        // Same formula as VUMeter.dbToPercent()
        let percent;
        if (threshold <= dbMin) {
            percent = 0;
        } else if (threshold >= dbMax) {
            percent = 100;
        } else {
            percent = ((threshold - dbMin) / (dbMax - dbMin)) * 100;
        }

        // Position using bottom (same as VUMeter scale ticks)
        triangle.style.bottom = `${percent}%`;
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    setupEventListeners() {
        // Control buttons
        this.element.addEventListener('click', (e) => {
            const control = e.target.closest('[data-control]');
            if (!control) return;

            const type = control.dataset.control;
            switch (type) {
                case 'monitor':
                    this.toggleMonitor();
                    break;
                case 'solo':
                    this.toggleSolo();
                    break;
                case 'record':
                    this.toggleRecord(e);
                    break;
            }
        });

        // Footer clicks
        const langEl = this.element.querySelector('.track-strip-v2__lang');
        const locationEl = this.element.querySelector('.track-strip-v2__location');

        if (langEl) {
            langEl.addEventListener('click', () => this.onLanguageClick());
        }

        if (locationEl) {
            locationEl.addEventListener('click', () => this.onLocationClick());
        }

        // Rotary drags (threshold and gain)
        const rotaries = this.element.querySelectorAll('.track-strip-v2__rotary');
        rotaries.forEach(rotary => {
            const control = rotary.dataset.control;
            const knob = rotary.querySelector('.track-strip-v2__rotary-knob');
            if (knob) {
                if (control === 'threshold') {
                    knob.addEventListener('mousedown', (e) => this.startThresholdDrag(e));
                } else if (control === 'gain') {
                    knob.addEventListener('mousedown', (e) => this.startRotaryDrag(e));
                }
            }
        });

        // Prevent context menu on record button
        const recordBtn = this.element.querySelector('[data-control="record"]');
        if (recordBtn) {
            recordBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleRecord(e);
            });
        }
    }

    // =========================================================================
    // CONTROL ACTIONS
    // =========================================================================

    toggleMonitor() {
        this.config.monitoring = !this.config.monitoring;
        this.updateButtonState('monitor', this.config.monitoring);

        if (this.config.onMonitorToggle) {
            this.config.onMonitorToggle(this.config.monitoring);
        }
    }

    toggleSolo() {
        this.config.solo = !this.config.solo;
        this.updateButtonState('solo', this.config.solo);

        if (this.config.onSoloToggle) {
            this.config.onSoloToggle(this.config.solo);
        }
    }

    toggleRecord(event) {
        const isCancel = event && (event.button === 2 || event.shiftKey);
        const currentState = this.getRecordState();

        if (isCancel && (currentState === 'armed' || currentState === 'recording')) {
            // Cancel to idle
            this.config.armed = false;
            this.config.recording = false;
            this.stopTimer();
        } else if (currentState === 'idle') {
            // idle -> armed
            this.config.armed = true;
            this.config.recording = false;
        } else if (currentState === 'armed') {
            // armed -> recording
            this.config.armed = false;
            this.config.recording = true;
            this.startTimer();
        } else {
            // recording -> idle
            this.config.armed = false;
            this.config.recording = false;
            this.stopTimer();
        }

        this.updateRecordState();

        if (this.config.onRecordToggle) {
            this.config.onRecordToggle({
                armed: this.config.armed,
                recording: this.config.recording
            });
        }
    }

    startThresholdDrag(e) {
        e.preventDefault();

        const rotary = e.target.closest('.track-strip-v2__rotary');
        const indicator = rotary.querySelector('.track-strip-v2__rotary-indicator');
        const valueDisplay = rotary.querySelector('.track-strip-v2__rotary-value');
        const startY = e.clientY;
        const startThreshold = this.config.threshold;

        const onMouseMove = (e) => {
            const deltaY = startY - e.clientY; // Inverted: up = increase
            const thresholdDelta = deltaY * 0.3; // Sensitivity
            const newThreshold = Math.max(-90, Math.min(6, startThreshold + thresholdDelta));

            this.config.threshold = Math.round(newThreshold);

            // Update visual
            const rotation = this.thresholdToRotation(this.config.threshold);
            indicator.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
            indicator.style.transformOrigin = 'center 12px';
            valueDisplay.textContent = `${this.config.threshold}`;

            // Update triangle position
            this.updateThresholdIndicatorPosition();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (this.config.onThresholdChange) {
                this.config.onThresholdChange(this.config.threshold);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    startRotaryDrag(e) {
        e.preventDefault();

        const rotary = e.target.closest('.track-strip-v2__rotary');
        const indicator = rotary.querySelector('.track-strip-v2__rotary-indicator');
        const valueDisplay = rotary.querySelector('.track-strip-v2__rotary-value');
        const startY = e.clientY;
        const startGain = this.config.gain;

        const onMouseMove = (e) => {
            const deltaY = startY - e.clientY; // Inverted: up = increase
            const gainDelta = deltaY * 0.2; // Sensitivity
            const newGain = Math.max(-30, Math.min(12, startGain + gainDelta));

            this.config.gain = Math.round(newGain);

            // Update visual
            const rotation = this.gainToRotation(this.config.gain);
            indicator.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
            indicator.style.transformOrigin = 'center 12px';
            valueDisplay.textContent = this.formatGain(this.config.gain);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (this.config.onGainChange) {
                this.config.onGainChange(this.config.gain);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    onLocationClick() {
        if (this.config.onLocationClick) {
            this.config.onLocationClick(this.config.location);
        }
    }

    onLanguageClick() {
        if (this.config.onLanguageClick) {
            this.config.onLanguageClick(this.config.language);
        }
    }

    // =========================================================================
    // STATE UPDATES
    // =========================================================================

    updateButtonState(control, active) {
        const btn = this.element.querySelector(`[data-control="${control}"]`);
        if (btn) {
            btn.classList.toggle('track-strip-v2__btn--active', active);
        }
    }

    updateRecordState() {
        const recordBtn = this.element.querySelector('[data-control="record"]');
        const strip = this.element;
        const leds = this.element.querySelectorAll('.track-strip-v2__led');

        // Remove all state classes
        recordBtn.classList.remove('track-strip-v2__record--armed', 'track-strip-v2__record--recording');
        strip.classList.remove('track-strip-v2--armed', 'track-strip-v2--recording');

        // Apply current state
        if (this.config.recording) {
            recordBtn.classList.add('track-strip-v2__record--recording');
            strip.classList.add('track-strip-v2--recording');
            leds.forEach(led => {
                led.classList.remove('track-strip-v2__led--active');
                led.classList.add('track-strip-v2__led--recording');
            });
        } else if (this.config.armed) {
            recordBtn.classList.add('track-strip-v2__record--armed');
            strip.classList.add('track-strip-v2--armed');
            leds.forEach(led => {
                led.classList.remove('track-strip-v2__led--recording');
                led.classList.add('track-strip-v2__led--active');
            });
        } else {
            leds.forEach(led => {
                led.classList.remove('track-strip-v2__led--active', 'track-strip-v2__led--recording');
            });
        }
    }

    updateMetering(peak, rms) {
        if (this.meter) {
            this.meter.update({ peak, rms });
        }
    }

    updateLocation(location) {
        this.config.location = location;
        const locationEl = this.element.querySelector('.track-strip-v2__location');
        if (locationEl) {
            locationEl.textContent = location;
        }
    }

    updateLanguage(language) {
        this.config.language = language;
        const langEl = this.element.querySelector('.track-strip-v2__lang');
        if (langEl) {
            langEl.textContent = language;
        }
    }

    // =========================================================================
    // TIMER
    // =========================================================================

    startTimer() {
        this.recordingStartTime = Date.now();
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.recordingStartTime = null;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const timerEl = this.element.querySelector('.track-strip-v2__timer');
        if (!timerEl) return;

        if (this.recordingStartTime) {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            timerEl.textContent = this.formatTimer(elapsed);
        } else {
            timerEl.textContent = this.formatTimer(0);
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    dbToPercent(db) {
        // -60dB = 100%, 6dB = 0%
        return 100 - ((db + 60) / 66) * 100;
    }

    percentToDb(percent) {
        // 100% = -60dB, 0% = 6dB
        return -60 + ((100 - percent) / 100) * 66;
    }

    formatGain(gain) {
        const sign = gain >= 0 ? '+' : '';
        return `${sign}${gain}dB`;
    }

    gainToRotation(gain) {
        // Map -30dB to +12dB to -135deg to +135deg
        return ((gain + 30) / 42) * 270 - 135;
    }

    thresholdToRotation(threshold) {
        // Map -90dB to +6dB to -135deg to +135deg
        return ((threshold + 90) / 96) * 270 - 135;
    }

    formatTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    getRecordState() {
        if (this.config.recording) return 'recording';
        if (this.config.armed) return 'armed';
        return 'idle';
    }

    getRecordClass() {
        const state = this.getRecordState();
        if (state === 'recording') return 'track-strip-v2__record--recording';
        if (state === 'armed') return 'track-strip-v2__record--armed';
        return '';
    }

    getLEDClass(index) {
        if (this.config.recording) return 'track-strip-v2__led--recording';
        if (this.config.armed) return 'track-strip-v2__led--active';
        return '';
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    destroy() {
        this.stopTimer();

        if (this.meter) {
            this.meter.destroy();
            this.meter = null;
        }

        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.TrackStripV2 = TrackStripV2;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackStripV2;
}

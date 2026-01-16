/**
 * TrackStripSlim - Composant track strip vertical compact
 * Intègre VUMeter + contrôles + footer
 *
 * @example
 * const track = new TrackStripSlim(container, {
 *   trackId: 1,
 *   location: 'AG01',
 *   language: 'FR',
 *   threshold: -30,
 *   gain: 0,
 *   onMonitorToggle: (enabled) => {},
 *   onSoloToggle: (enabled) => {},
 *   onRecordToggle: (state) => {},
 *   onThresholdChange: (value) => {},
 *   onLocationChange: (value) => {},
 *   onLanguageChange: (value) => {}
 * })
 *
 * track.updateMetering(peak, rms)
 */

class TrackStripSlim {
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

        this.render();
        this.setupEventListeners();
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    render() {
        const div = document.createElement('div');
        div.className = 'track-strip-slim';
        div.dataset.trackId = this.config.trackId;

        // Apply state classes
        if (this.config.armed) div.classList.add('track-strip-slim--armed');
        if (this.config.recording) div.classList.add('track-strip-slim--recording');

        const thresholdPercent = this.dbToPercent(this.config.threshold);

        div.innerHTML = `
            <!-- VU-Mètre Zone -->
            <div class="track-strip-slim__meter">
                <div class="track-strip-slim__meter-wrapper">
                    <div class="track-strip-slim__meter-target"></div>
                    <div class="track-strip-slim__threshold"
                         style="top: ${thresholdPercent}%;"
                         data-threshold="${this.config.threshold}">
                    </div>
                </div>
            </div>

            <!-- LEDs Status (triangle: 1 en haut, 2 en bas) -->
            <div class="track-strip-slim__leds">
                <div class="track-strip-slim__led ${this.config.recording ? 'track-strip-slim__led--recording' : ''}"></div>
                <div class="track-strip-slim__led ${this.config.recording ? 'track-strip-slim__led--recording' : ''}"></div>
                <div class="track-strip-slim__led ${this.config.recording ? 'track-strip-slim__led--recording' : ''}"></div>
            </div>

            <!-- Timer d'enregistrement -->
            <div class="track-strip-slim__timer">00:00</div>

            <!-- Controls -->
            <div class="track-strip-slim__controls">
                <!-- Monitor -->
                <div class="track-strip-slim__control track-strip-slim__control--monitor ${this.config.monitoring ? 'track-strip-slim__control--active' : ''}"
                     data-control="monitor">
                    <span class="track-strip-slim__control-label">M</span>
                </div>

                <!-- Solo -->
                <div class="track-strip-slim__control track-strip-slim__control--solo ${this.config.solo ? 'track-strip-slim__control--active' : ''}"
                     data-control="solo">
                    <span class="track-strip-slim__control-label">S</span>
                </div>

                <!-- Rotary Gain -->
                <div class="track-strip-slim__control track-strip-slim__rotary"
                     data-control="gain">
                    <div class="track-strip-slim__rotary-icon"></div>
                    <div class="track-strip-slim__rotary-value">${this.formatGain(this.config.gain)}</div>
                </div>

                <!-- Record -->
                <div class="track-strip-slim__control track-strip-slim__control--record ${this.getRecordClass()}"
                     data-control="record">
                    <span class="track-strip-slim__control-label">●</span>
                </div>
            </div>

            <!-- Footer -->
            <div class="track-strip-slim__footer">
                <div class="track-strip-slim__footer-item track-strip-slim__lang">${this.config.language}</div>
                <div class="track-strip-slim__footer-item track-strip-slim__location">${this.config.location}</div>
                <div class="track-strip-slim__footer-item track-strip-slim__number">#${String(this.config.trackId).padStart(3, '0')}</div>
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
    }

    initVUMeter() {
        const meterTarget = this.element.querySelector('.track-strip-slim__meter-target');
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
                    width: 20,
                    height: availableHeight,
                    dbMin: -60,
                    dbMax: 6,
                    ballistics: true
                });
            }
        });
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

        // Footer clicks (location, language)
        const langEl = this.element.querySelector('.track-strip-slim__lang');
        const locationEl = this.element.querySelector('.track-strip-slim__location');

        if (langEl) {
            langEl.addEventListener('click', () => this.onLanguageClick());
        }

        if (locationEl) {
            locationEl.addEventListener('click', () => this.onLocationClick());
        }

        // Threshold drag
        const thresholdLine = this.element.querySelector('.track-strip-slim__threshold');
        if (thresholdLine) {
            thresholdLine.addEventListener('mousedown', (e) => this.startThresholdDrag(e));
        }

        // Prevent context menu on record button (used for cancel)
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
        this.updateControlState('monitor', this.config.monitoring);

        if (this.config.onMonitorToggle) {
            this.config.onMonitorToggle(this.config.monitoring);
        }
    }

    toggleSolo() {
        this.config.solo = !this.config.solo;
        this.updateControlState('solo', this.config.solo);

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
        } else if (currentState === 'idle') {
            // idle -> armed
            this.config.armed = true;
            this.config.recording = false;
        } else if (currentState === 'armed') {
            // armed -> recording
            this.config.armed = false;
            this.config.recording = true;
        } else {
            // recording -> idle
            this.config.armed = false;
            this.config.recording = false;
        }

        this.render();

        if (this.config.onRecordToggle) {
            this.config.onRecordToggle({
                armed: this.config.armed,
                recording: this.config.recording
            });
        }
    }

    startThresholdDrag(e) {
        e.preventDefault();
        this.draggingThreshold = true;

        const thresholdLine = this.element.querySelector('.track-strip-slim__threshold');
        const meterWrapper = this.element.querySelector('.track-strip-slim__meter-wrapper');
        const startY = e.clientY;
        const startTop = parseFloat(thresholdLine.style.top);

        const onMouseMove = (e) => {
            if (!this.draggingThreshold) return;

            const deltaY = e.clientY - startY;
            const meterHeight = meterWrapper.offsetHeight;
            const deltaPercent = (deltaY / meterHeight) * 100;
            const newTop = Math.max(5, Math.min(95, startTop + deltaPercent));

            thresholdLine.style.top = newTop + '%';

            const thresholdDb = this.percentToDb(newTop);
            thresholdLine.dataset.threshold = thresholdDb.toFixed(0);
        };

        const onMouseUp = () => {
            if (!this.draggingThreshold) return;

            this.draggingThreshold = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const newThreshold = parseFloat(thresholdLine.dataset.threshold);
            this.config.threshold = newThreshold;

            if (this.config.onThresholdChange) {
                this.config.onThresholdChange(newThreshold);
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

    updateControlState(control, active) {
        const controlEl = this.element.querySelector(`[data-control="${control}"]`);
        if (controlEl) {
            controlEl.classList.toggle('track-strip-slim__control--active', active);
        }
    }

    updateMetering(peak, rms) {
        if (this.meter) {
            this.meter.update({ peak, rms });
        }
    }

    updateLocation(location) {
        this.config.location = location;
        const locationEl = this.element.querySelector('.track-strip-slim__location');
        if (locationEl) {
            locationEl.textContent = location;
        }
    }

    updateLanguage(language) {
        this.config.language = language;
        const langEl = this.element.querySelector('.track-strip-slim__lang');
        if (langEl) {
            langEl.textContent = language;
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    dbToPercent(db) {
        // -60dB = 100%, 0dB = 0%
        return 100 - ((db + 60) / 60) * 100;
    }

    percentToDb(percent) {
        // 100% = -60dB, 0% = 0dB
        return -60 + ((100 - percent) / 100) * 60;
    }

    formatGain(gain) {
        const sign = gain >= 0 ? '+' : '';
        return `${sign}${gain.toFixed(0)}`;
    }

    getRecordState() {
        if (this.config.recording) return 'recording';
        if (this.config.armed) return 'armed';
        return 'idle';
    }

    getRecordClass() {
        const state = this.getRecordState();
        if (state === 'recording') return 'track-strip-slim__control--recording';
        if (state === 'armed') return 'track-strip-slim__control--armed';
        return '';
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    destroy() {
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
    window.TrackStripSlim = TrackStripSlim;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackStripSlim;
}

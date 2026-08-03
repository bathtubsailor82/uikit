/**
 * CanvasMeter - Composant Canvas haute performance pour metering audio
 *
 * Remplace VUMeter CSS pour supporter 512+ pistes @ 60fps.
 * Le backend calcule TOUTES les valeurs (peak, rms, ballistics, etc.)
 * Le frontend affiche uniquement - "dumb display".
 *
 * @example
 * // Avec preset string
 * const meter = new CanvasMeter(container, 'track');
 *
 * // Avec config object
 * const meter = new CanvasMeter(container, {
 *   preset: 'track',
 *   showRMS: false
 * });
 *
 * // Mise a jour (depuis WebSocket)
 * meter.setValues({ peak: -12.5, rms: -18.2, clip: false });
 *
 * // Paint (appele par RAF centralise)
 * meter.paint();
 */

// ============================================================================
// PRESETS (voir CANVAS-METER.md section 6)
// ============================================================================

const CANVAS_METER_PRESETS = {
  // Track (Piste d'enregistrement)
  track: {
    orientation: 'vertical',
    width: 24,
    height: 200,
    showScale: true,
    showScaleLabels: false,
    showNumeric: false,
    showNumericTop: true,
    showRMS: true,
    showPeakHold: true,
    showClipIndicator: true,
    meterType: 'peak',
    scale: 'linear',
    minDB: -60,
    maxDB: 0,
    context: 'track'
  },

  // Compact (Header, inline)
  compact: {
    orientation: 'horizontal',
    width: 120,
    height: 12,
    showScale: false,
    showScaleLabels: false,
    showNumeric: false,
    showRMS: true,
    showPeakHold: false,
    showClipIndicator: false,
    meterType: 'peak',
    scale: 'linear',
    minDB: -60,
    maxDB: 0,
    context: 'track'
  },

  // HW I/O (Hardware Input/Output)
  'hw-io': {
    orientation: 'vertical',
    width: 16,
    height: 150,
    showScale: false,
    showScaleLabels: false,
    showNumeric: false,
    showRMS: false,
    showPeakHold: false,
    showClipIndicator: true,
    meterType: 'peak',
    scale: 'linear',
    minDB: -60,
    maxDB: 0,
    context: 'hw-input'
  },

  // Broadcast (Mixage broadcast)
  broadcast: {
    orientation: 'vertical',
    width: 32,
    height: 300,
    showScale: true,
    showScaleLabels: true,
    showNumeric: true,
    showRMS: true,
    showPeakHold: true,
    showClipIndicator: true,
    meterType: 'ppm',
    scale: 'linear',
    minDB: -42,
    maxDB: 12,
    peakHoldTime: 2000,
    context: 'master'
  },

  // LUFS (Loudness monitoring)
  lufs: {
    orientation: 'vertical',
    width: 48,
    height: 300,
    showScale: true,
    showScaleLabels: true,
    showNumeric: true,
    showRMS: false,
    showPeakHold: false,
    showClipIndicator: true,
    meterType: 'lufs',
    scale: 'linear',
    minDB: -60,
    maxDB: 0,
    context: 'master'
  }
};

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG = {
  orientation: 'vertical',
  width: 24,
  height: 200,
  showScale: true,
  showScaleLabels: true,
  showNumeric: true,
  showNumericTop: false,
  showRMS: true,
  showPeakHold: true,
  showClipIndicator: true,
  meterType: 'peak',
  scale: 'linear',
  minDB: -60,
  maxDB: 0,
  peakHoldTime: 2000,
  peakFallback: 15,
  context: 'track',
  colors: null  // Use default colors
};

// ============================================================================
// COLORS (voir CANVAS-METER.md section 3)
// ============================================================================

const DEFAULT_COLORS = {
  background: '#1a1a1a',
  safe: '#22c55e',       // -60 to -20 (green)
  nominal: '#22c55e',    // -20 to -6 (green)
  caution: '#eab308',    // -6 to -3 (yellow)
  warning: '#ef4444',    // -3 to 0 (red)
  clip: '#dc2626',       // 0+ (bright red)
  rms: '#60a5fa',        // Blue semi-transparent
  peakHold: '#ffffff',   // White
  scale: '#404040',      // Scale lines gray
  text: '#9ca3af'        // Scale text light gray
};

// PPM color scheme (IEC 60268-10)
const PPM_COLORS = {
  background: '#1a1a1a',
  low: '#22c55e',        // -42 to -12 (green)
  normal: '#22c55e',     // -12 to 0 (green)
  high: '#eab308',       // 0 to +6 (yellow)
  peak: '#ef4444',       // +6 to +12 (red)
  rms: '#60a5fa',
  peakHold: '#ffffff',
  scale: '#404040',
  text: '#9ca3af'
};

// ============================================================================
// CANVAS METER CLASS
// ============================================================================

class CanvasMeter {
  /**
   * @param {HTMLElement|string} container - Element DOM ou selecteur
   * @param {string|Object} config - Preset string ou config object
   */
  constructor(container, config = {}) {
    // Resolve container
    if (typeof container === 'string') {
      this.container = document.querySelector(container);
    } else {
      this.container = container;
    }

    if (!this.container) {
      throw new Error('CanvasMeter: container not found');
    }

    // Resolve config from preset or object
    this.config = this._resolveConfig(config);

    // Initialize values (all in dB, from backend)
    this._values = {
      peak: -Infinity,
      rms: -Infinity,
      peakHold: -Infinity,
      truePeak: -Infinity,
      ppm: -Infinity,
      lufsM: -Infinity,
      lufsS: -Infinity,
      lufsI: -Infinity,
      clip: false
    };

    // Dirty flag for optimization
    this._needsRepaint = true;
    this._lastValues = { ...this._values };

    // Create canvas
    this._createCanvas();

    // Get 2D context
    this.ctx = this.canvas.getContext('2d');

    // Cache computed values
    this._cacheComputedValues();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Resolve config from preset string or config object
   * @private
   */
  _resolveConfig(config) {
    let baseConfig = { ...DEFAULT_CONFIG };

    if (typeof config === 'string') {
      // Preset string
      const preset = CANVAS_METER_PRESETS[config];
      if (!preset) {
        console.warn(`CanvasMeter: unknown preset "${config}", using defaults`);
      } else {
        baseConfig = { ...baseConfig, ...preset };
      }
    } else if (typeof config === 'object') {
      // Config object, may include preset
      if (config.preset) {
        const preset = CANVAS_METER_PRESETS[config.preset];
        if (preset) {
          baseConfig = { ...baseConfig, ...preset };
        }
      }
      // Override with provided config
      baseConfig = { ...baseConfig, ...config };
    }

    // Resolve colors
    baseConfig.colors = {
      ...(baseConfig.meterType === 'ppm' ? PPM_COLORS : DEFAULT_COLORS),
      ...(config.colors || {})
    };

    return baseConfig;
  }

  /**
   * Create and setup canvas element
   * @private
   */
  _createCanvas() {
    const { width, height, orientation, showNumeric, showScale, showScaleLabels, showNumericTop } = this.config;

    // Calculate total dimensions including numeric display and scale
    let totalWidth = width;
    let totalHeight = height;
    let numericTopHeight = 0;

    if (orientation === 'vertical') {
      // Add space for numeric display on top (above clip indicator)
      if (showNumericTop) {
        numericTopHeight = 14; // Space for numeric above meter
        totalHeight += numericTopHeight;
      }
      // Add space for numeric display below
      if (showNumeric) {
        totalHeight += 20; // Space for numeric below meter
      }
      // Add space for scale labels
      // Compact mode: labels drawn as overlay on meter (no extra width needed)
      // Full mode: labels to the right (28px)
      const isCompactLabels = this.config.context === 'track';
      this._compactLabels = isCompactLabels;

      if (isCompactLabels) {
        // Compact: overlay labels on meter, no extra width needed
        // (labels are drawn directly on the meter bars)
      } else if (showScale && showScaleLabels) {
        totalWidth += 28; // Full: labels on right
      } else if (showScale) {
        totalWidth += 8; // Space for tick marks only
      }
    } else {
      // Horizontal: numeric on right
      if (showNumeric) {
        totalWidth += 45; // Space for numeric
      }
    }

    this._numericTopHeight = numericTopHeight;

    // Store dimensions
    this._totalWidth = totalWidth;
    this._totalHeight = totalHeight;
    this._meterWidth = width;
    this._meterHeight = height;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'canvas-meter';

    // Handle device pixel ratio for Retina displays
    const dpr = window.devicePixelRatio || 1;
    this._dpr = dpr;

    // Set display size
    this.canvas.style.width = `${totalWidth}px`;
    this.canvas.style.height = `${totalHeight}px`;

    // Set actual canvas size (accounting for DPR)
    this.canvas.width = Math.round(totalWidth * dpr);
    this.canvas.height = Math.round(totalHeight * dpr);

    // Clear container and add canvas
    this.container.innerHTML = '';
    this.container.appendChild(this.canvas);
  }

  /**
   * Cache computed values for painting performance
   * @private
   */
  _cacheComputedValues() {
    const { minDB, maxDB, orientation, meterType } = this.config;
    const dpr = this._dpr;

    // DB range
    this._dbRange = maxDB - minDB;

    // Meter area (in canvas pixels, accounting for DPR)
    if (orientation === 'vertical') {
      this._meterX = 0;
      this._meterY = 0;
      this._meterW = this._meterWidth * dpr;
      this._meterH = this._meterHeight * dpr;
    } else {
      this._meterX = 0;
      this._meterY = 0;
      this._meterW = this._meterWidth * dpr;
      this._meterH = this._meterHeight * dpr;
    }

    // Invalidate memoised bar gradient (geometry and/or config just changed)
    this._gradientCache = null;

    // Scale tick positions
    if (this.config.showScale) {
      this._computeScaleTicks();
    }
  }

  /**
   * Compute scale tick positions
   * @private
   */
  _computeScaleTicks() {
    const { minDB, maxDB, meterType } = this.config;

    // Standard tick positions
    let majorTicks, minorTicks;

    if (meterType === 'ppm') {
      // PPM scale: -42 to +12
      majorTicks = [12, 6, 0, -6, -12, -18, -24, -30, -36, -42];
      minorTicks = [9, 3, -3, -9, -15, -21, -27, -33, -39];
    } else {
      // Peak scale: -60 to 0
      majorTicks = [0, -6, -12, -18, -24, -36, -48, -60];
      minorTicks = [-3, -9, -15, -21, -30, -42, -54];
    }

    // Filter to range
    this._majorTicks = majorTicks.filter(db => db >= minDB && db <= maxDB);
    this._minorTicks = minorTicks.filter(db => db >= minDB && db <= maxDB);
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Update values from WebSocket data
   * All values are in dB, pre-calculated by backend
   * @param {Object} data - { peak, rms, peakHold, truePeak, ppm, clip, ... }
   */
  setValues(data) {
    if (data.peak !== undefined) {
      this._values.peak = this._clampDB(data.peak);
    }
    if (data.rms !== undefined) {
      this._values.rms = this._clampDB(data.rms);
    }
    if (data.peakHold !== undefined) {
      this._values.peakHold = this._clampDB(data.peakHold);
    }
    if (data.truePeak !== undefined) {
      this._values.truePeak = this._clampDB(data.truePeak);
    }
    if (data.ppm !== undefined) {
      this._values.ppm = this._clampDB(data.ppm);
    }
    if (data.lufsM !== undefined) {
      this._values.lufsM = data.lufsM;
    }
    if (data.lufsS !== undefined) {
      this._values.lufsS = data.lufsS;
    }
    if (data.lufsI !== undefined) {
      this._values.lufsI = data.lufsI;
    }
    if (data.clip !== undefined) {
      this._values.clip = data.clip;
    }

    // Mark for repaint
    this._needsRepaint = true;
  }

  /**
   * Paint the meter (called by centralized RAF loop)
   */
  paint() {
    // Skip if not visible (optimization)
    if (!this._isVisible()) return;

    // Skip if no changes (optimization)
    if (!this._needsRepaint && this._valuesUnchanged()) return;

    this._doPaint();
    this._needsRepaint = false;
    this._lastValues = { ...this._values };
  }

  /**
   * Change config at runtime
   * @param {Object} newConfig - Partial config to update
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.colors) {
      this.config.colors = { ...this.config.colors, ...newConfig.colors };
    }
    this._createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this._cacheComputedValues();
    this._needsRepaint = true;
  }

  /**
   * Reset peak hold (request to backend, local immediate reset for UX)
   */
  resetPeakHold() {
    this._values.peakHold = -Infinity;
    this._needsRepaint = true;
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this._gradientCache = null;
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /**
   * Get current values (read-only)
   */
  get values() {
    return { ...this._values };
  }

  // ==========================================================================
  // PAINTING
  // ==========================================================================

  /**
   * Main paint function
   * @private
   */
  _doPaint() {
    const ctx = this.ctx;
    const dpr = this._dpr;
    const { orientation, colors, showRMS, showPeakHold, showClipIndicator, showScale, showNumeric } = this.config;

    // Scale context for DPR
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear canvas
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, this._totalWidth, this._totalHeight);

    // Get display value based on meter type
    const displayDB = this._getDisplayValue();

    if (orientation === 'vertical') {
      this._paintVertical(displayDB);
    } else {
      this._paintHorizontal(displayDB);
    }

    // Paint scale
    if (showScale) {
      this._paintScale();
    }

    // Paint numeric display
    if (showNumeric) {
      this._paintNumeric(displayDB);
    }
  }

  /**
   * Paint vertical meter
   * @private
   */
  _paintVertical(displayDB) {
    const ctx = this.ctx;
    const { colors, showRMS, showPeakHold, showClipIndicator, showNumericTop } = this.config;
    const meterW = this._meterWidth;
    const meterH = this._meterHeight;
    const numericTopHeight = this._numericTopHeight || 0;

    // Numeric value on top (above clip indicator)
    if (showNumericTop) {
      let text;
      if (displayDB <= this.config.minDB) {
        text = '-inf';
      } else {
        text = displayDB.toFixed(1);
      }
      ctx.fillStyle = this._values.clip ? colors.clip : colors.text;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, meterW / 2, 1);
    }

    // Clip indicator area (below numeric top)
    const clipHeight = showClipIndicator ? 4 : 0;
    const clipY = numericTopHeight;
    const barHeight = meterH - clipHeight;

    // Paint clip indicator
    if (showClipIndicator) {
      ctx.fillStyle = this._values.clip ? colors.clip : colors.background;
      ctx.fillRect(0, clipY, meterW, clipHeight);
      // Border for visibility
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, clipY + 0.5, meterW - 1, clipHeight - 1);
    }

    // Bar start position (after numeric top and clip indicator)
    const barStartY = clipY + clipHeight;

    // Side-by-side layout: Peak/PPM (left) | RMS (right)
    if (showRMS) {
      const gap = 1; // Gap between bars
      const peakWidth = Math.floor((meterW - gap) * 0.70); // 70% for PPM
      const rmsWidth = meterW - gap - peakWidth; // 30% for RMS
      const rmsX = peakWidth + gap;

      // Paint peak/PPM bar (left side)
      if (displayDB > -Infinity) {
        const peakPercent = this._dbToPercent(displayDB);
        const peakHeight = barHeight * peakPercent;
        const peakY = barStartY + (barHeight - peakHeight);

        ctx.fillStyle = this._getBarGradient(0, barStartY + barHeight, 0, barStartY);
        ctx.fillRect(0, peakY, peakWidth, peakHeight);
      }

      // Paint RMS bar (right side)
      if (this._values.rms > -Infinity) {
        const rmsPercent = this._dbToPercent(this._values.rms);
        const rmsHeight = barHeight * rmsPercent;
        const rmsY = barStartY + (barHeight - rmsHeight);

        ctx.fillStyle = colors.rms;
        ctx.fillRect(rmsX, rmsY, rmsWidth, rmsHeight);
      }

      // Paint peak hold indicator (1px line, PPM width only, colored like PPM gradient)
      if (showPeakHold && this._values.peakHold > -Infinity) {
        const holdPercent = this._dbToPercent(this._values.peakHold);
        const holdY = barStartY + barHeight - (barHeight * holdPercent);

        // Use gradient color at hold position for consistent look
        ctx.fillStyle = this._getBarGradient(0, barStartY + barHeight, 0, barStartY);
        ctx.fillRect(0, Math.round(holdY) - 0.5, peakWidth, 1);
      }
    } else {
      // Single bar mode (no RMS) - full width peak
      if (displayDB > -Infinity) {
        const peakPercent = this._dbToPercent(displayDB);
        const peakHeight = barHeight * peakPercent;
        const peakY = barStartY + (barHeight - peakHeight);

        ctx.fillStyle = this._getBarGradient(0, barStartY + barHeight, 0, barStartY);
        ctx.fillRect(0, peakY, meterW, peakHeight);
      }

      // Paint peak hold indicator (1px line, colored like gradient)
      if (showPeakHold && this._values.peakHold > -Infinity) {
        const holdPercent = this._dbToPercent(this._values.peakHold);
        const holdY = barStartY + barHeight - (barHeight * holdPercent);

        // Use gradient color at hold position
        ctx.fillStyle = this._getBarGradient(0, barStartY + barHeight, 0, barStartY);
        ctx.fillRect(0, Math.round(holdY) - 0.5, meterW, 1);
      }
    }
  }

  /**
   * Paint horizontal meter
   * @private
   */
  _paintHorizontal(displayDB) {
    const ctx = this.ctx;
    const { colors, showRMS, showClipIndicator } = this.config;
    const meterW = this._meterWidth;
    const meterH = this._meterHeight;

    // Clip indicator area (right 4px)
    const clipWidth = showClipIndicator ? 4 : 0;
    const barWidth = meterW - clipWidth;

    // Side-by-side layout: Peak (top) | RMS (bottom)
    if (showRMS) {
      const gap = 1;
      const peakHeight = Math.floor((meterH - gap) * 0.55);
      const rmsHeight = meterH - gap - peakHeight;
      const rmsY = peakHeight + gap;

      // Paint peak bar (top)
      if (displayDB > -Infinity) {
        const peakPercent = this._dbToPercent(displayDB);
        const peakWidth = barWidth * peakPercent;

        ctx.fillStyle = this._getBarGradient(0, 0, barWidth, 0);
        ctx.fillRect(0, 0, peakWidth, peakHeight);
      }

      // Paint RMS bar (bottom)
      if (this._values.rms > -Infinity) {
        const rmsPercent = this._dbToPercent(this._values.rms);
        const rmsWidth = barWidth * rmsPercent;

        ctx.fillStyle = colors.rms;
        ctx.fillRect(0, rmsY, rmsWidth, rmsHeight);
      }
    } else {
      // Single bar mode (no RMS) - full height peak
      if (displayDB > -Infinity) {
        const peakPercent = this._dbToPercent(displayDB);
        const peakWidth = barWidth * peakPercent;

        ctx.fillStyle = this._getBarGradient(0, 0, barWidth, 0);
        ctx.fillRect(0, 0, peakWidth, meterH);
      }
    }

    // Paint clip indicator
    if (showClipIndicator) {
      ctx.fillStyle = this._values.clip ? colors.clip : colors.background;
      ctx.fillRect(barWidth, 0, clipWidth, meterH);
      // Border for visibility
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(barWidth + 0.5, 0.5, clipWidth - 1, meterH - 1);
    }
  }

  /**
   * Paint scale ticks and labels
   * @private
   */
  _paintScale() {
    const ctx = this.ctx;
    const { colors, orientation, showScaleLabels, showClipIndicator } = this.config;
    const meterW = this._meterWidth;
    const meterH = this._meterHeight;
    const numericTopHeight = this._numericTopHeight || 0;

    const clipOffset = showClipIndicator ? 4 : 0;
    const barHeight = meterH - clipOffset;
    const barStartY = numericTopHeight + clipOffset;

    if (orientation !== 'vertical') return; // Only vertical scale for now

    const isCompact = this._compactLabels;

    if (isCompact) {
      // Compact mode: overlay labels ON the meter (Reaper style)
      // Labels are centered on meter with dashes: -XX-
      if (showScaleLabels) {
        const compactLabels = [0, 6, 12, 24, 48]; // Key dB values (absolute)

        // Get current meter level to determine label color
        const displayDB = this._getDisplayValue();
        const meterPercent = this._dbToPercent(displayDB);

        ctx.font = '7px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (const dbAbs of compactLabels) {
          const db = -dbAbs;
          if (db < this.config.minDB || db > this.config.maxDB) continue;

          const labelPercent = this._dbToPercent(db);
          const y = barStartY + barHeight - (barHeight * labelPercent);

          // If label is below meter level (in the colored bar), use dark color
          // Otherwise use light color (on dark background)
          const isInMeterBar = labelPercent <= meterPercent;
          ctx.fillStyle = isInMeterBar ? 'rgba(0, 0, 0, 0.8)' : 'rgba(200, 200, 200, 0.9)';

          const label = dbAbs === 0 ? '-0-' : `-${dbAbs}-`;
          ctx.fillText(label, meterW / 2, y);
        }
      }
      // No external ticks in compact mode - labels are the visual reference
    } else {
      // Full mode: ticks and labels to the right of meter
      const scaleX = meterW + 1;

      ctx.strokeStyle = colors.scale;
      ctx.fillStyle = colors.text;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (const db of this._majorTicks) {
        const percent = this._dbToPercent(db);
        const y = barStartY + barHeight - (barHeight * percent);

        // Tick line
        ctx.beginPath();
        ctx.moveTo(scaleX, y);
        ctx.lineTo(scaleX + 4, y);
        ctx.stroke();

        // Label
        if (showScaleLabels) {
          const label = db > 0 ? `+${db}` : String(db);
          ctx.fillText(label, scaleX + 6, y);
        }
      }

      // Minor ticks
      for (const db of this._minorTicks) {
        const percent = this._dbToPercent(db);
        const y = barStartY + barHeight - (barHeight * percent);

        ctx.beginPath();
        ctx.moveTo(scaleX, y);
        ctx.lineTo(scaleX + 2, y);
        ctx.stroke();
      }
    }
  }

  /**
   * Paint numeric display (bottom)
   * @private
   */
  _paintNumeric(displayDB) {
    const ctx = this.ctx;
    const { colors, orientation } = this.config;
    const meterW = this._meterWidth;
    const meterH = this._meterHeight;
    const numericTopHeight = this._numericTopHeight || 0;

    let text;
    if (displayDB <= this.config.minDB) {
      text = '-inf';
    } else {
      text = displayDB.toFixed(1);
    }

    // Color based on clip
    ctx.fillStyle = this._values.clip ? colors.clip : colors.text;

    if (orientation === 'vertical') {
      // Below meter (account for numericTopHeight offset)
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(text, meterW / 2, numericTopHeight + meterH + 4);
    } else {
      // Right of meter
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, this._meterWidth + 4, this._meterHeight / 2);
    }
  }

  /**
   * Get the bar gradient, memoised on bar geometry.
   *
   * Les arrets de couleur ne dependent que de la config (meterType, colors,
   * minDB/maxDB) et jamais des valeurs audio courantes : a geometrie egale, un
   * meme CanvasGradient sert la barre et le trait de peak hold, frame apres
   * frame. Le cache est invalide par _cacheComputedValues() (constructeur et
   * setConfig), seuls chemins ou config et geometrie changent.
   *
   * La cle porte sur la geometrie de BARRE, jamais sur la hauteur totale du
   * meter : les coordonnees passees ici sont exactement celles d'avant la
   * memoisation, donc les seuils de couleur ne bougent pas d'un pixel.
   *
   * @private
   */
  _getBarGradient(x0, y0, x1, y1) {
    const cached = this._gradientCache;
    if (cached && cached.x0 === x0 && cached.y0 === y0 && cached.x1 === x1 && cached.y1 === y1) {
      return cached.gradient;
    }

    const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
    this._applyGradientStops(gradient);
    this._gradientCache = { x0, y0, x1, y1, gradient };

    return gradient;
  }

  /**
   * Apply gradient color stops
   * @private
   */
  _applyGradientStops(gradient) {
    const { meterType, colors, minDB, maxDB } = this.config;

    if (meterType === 'ppm') {
      // PPM gradient
      const lowEnd = Math.max(0, Math.min(1, this._dbToPercent(-12)));
      const normalEnd = Math.max(0, Math.min(1, this._dbToPercent(0)));
      const highEnd = Math.max(0, Math.min(1, this._dbToPercent(6)));

      gradient.addColorStop(0, colors.low || colors.safe);
      if (lowEnd > 0) gradient.addColorStop(lowEnd, colors.low || colors.safe);
      if (lowEnd < 1) gradient.addColorStop(lowEnd + 0.001, colors.normal || colors.nominal);
      if (normalEnd > 0 && normalEnd < 1) gradient.addColorStop(normalEnd, colors.normal || colors.nominal);
      if (normalEnd < 1) gradient.addColorStop(normalEnd + 0.001, colors.high || colors.caution);
      if (highEnd > 0 && highEnd < 1) gradient.addColorStop(highEnd, colors.high || colors.caution);
      if (highEnd < 1) gradient.addColorStop(highEnd + 0.001, colors.peak || colors.warning);
      gradient.addColorStop(1, colors.peak || colors.warning);
    } else {
      // Peak gradient
      const safeEnd = Math.max(0, Math.min(1, this._dbToPercent(-20)));
      const nominalEnd = Math.max(0, Math.min(1, this._dbToPercent(-6)));
      const cautionEnd = Math.max(0, Math.min(1, this._dbToPercent(-3)));
      const warningEnd = Math.max(0, Math.min(1, this._dbToPercent(0)));

      gradient.addColorStop(0, colors.safe);
      if (safeEnd > 0) gradient.addColorStop(safeEnd, colors.safe);
      if (safeEnd < 1) gradient.addColorStop(safeEnd + 0.001, colors.nominal);
      if (nominalEnd > 0 && nominalEnd < 1) gradient.addColorStop(nominalEnd, colors.nominal);
      if (nominalEnd < 1) gradient.addColorStop(nominalEnd + 0.001, colors.caution);
      if (cautionEnd > 0 && cautionEnd < 1) gradient.addColorStop(cautionEnd, colors.caution);
      if (cautionEnd < 1) gradient.addColorStop(cautionEnd + 0.001, colors.warning);
      if (warningEnd > 0 && warningEnd < 1) gradient.addColorStop(warningEnd, colors.warning);
      if (warningEnd < 1) {
        gradient.addColorStop(warningEnd + 0.001, colors.clip);
        gradient.addColorStop(1, colors.clip);
      } else {
        gradient.addColorStop(1, colors.warning);
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Get display value based on meter type
   * PPM (with ballistics) is preferred for smoother display when available.
   * @private
   */
  _getDisplayValue() {
    const { meterType } = this.config;

    switch (meterType) {
      case 'truePeak':
        return this._values.truePeak;
      case 'ppm':
        return this._values.ppm;
      case 'lufs':
        return this._values.lufsM; // Momentary for display
      case 'peak':
      default:
        // Use PPM value if available (smoother with ballistics)
        // Fallback to raw peak if PPM not available
        if (this._values.ppm > -Infinity) {
          return this._values.ppm;
        }
        return this._values.peak;
    }
  }

  /**
   * Convert dB to percent (0-1) based on scale
   * @private
   */
  _dbToPercent(db) {
    const { minDB, maxDB, scale } = this.config;

    if (db <= minDB) return 0;
    if (db >= maxDB) return 1;

    // Linear scale (all scales currently linear, K-System just shifts reference)
    return (db - minDB) / (maxDB - minDB);
  }

  /**
   * Clamp dB value to config range
   * @private
   */
  _clampDB(db) {
    if (!Number.isFinite(db)) return -Infinity;
    return Math.max(this.config.minDB, Math.min(this.config.maxDB + 6, db));
  }

  /**
   * Convert hex color to RGBA
   * @private
   */
  _hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Check if canvas is visible (in viewport)
   * @private
   */
  _isVisible() {
    if (!this.canvas) return false;

    // Check if document is hidden (tab inactive)
    if (document.hidden) return false;

    // Simple bounds check (could use IntersectionObserver for better perf)
    const rect = this.canvas.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  }

  /**
   * Check if values changed since last paint
   * @private
   */
  _valuesUnchanged() {
    return (
      this._values.peak === this._lastValues.peak &&
      this._values.rms === this._lastValues.rms &&
      this._values.peakHold === this._lastValues.peakHold &&
      this._values.clip === this._lastValues.clip
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// ES6 module export
export default CanvasMeter;
export { CanvasMeter, CANVAS_METER_PRESETS };

// Browser global export
if (typeof window !== 'undefined') {
  window.CanvasMeter = CanvasMeter;
  window.CANVAS_METER_PRESETS = CANVAS_METER_PRESETS;
}

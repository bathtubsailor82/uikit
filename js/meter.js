/**
 * VUMeter - Composant de visualisation de niveaux audio
 * Supporte: Peak, RMS, Hold, LUFS (donnees externes)
 * Orientations: vertical, horizontal
 *
 * @example
 * const meter = new VUMeter(document.getElementById('meter'), { preset: 'standard' })
 * meter.update({ peak: -12.5, rms: -18.2 })
 */

// ============================================================================
// PRESETS
// ============================================================================

const METER_PRESETS = {
  // Barre simple sans graduation
  minimal: {
    orientation: 'vertical',
    showScale: false,
    showNumeric: false,
    showRMS: true,    // RMS inclus meme en minimal
    showHold: false,
    width: 20,
    height: 120
  },

  // Peak + RMS avec graduation (defaut)
  standard: {
    orientation: 'vertical',
    showScale: true,
    showNumeric: true,
    showRMS: true,
    showHold: true,
    width: 44,
    height: 200
  },

  // Complet type broadcast
  broadcast: {
    orientation: 'vertical',
    showScale: true,
    showNumeric: true,
    showRMS: true,
    showHold: true,
    showLUFS: true,
    width: 52,
    height: 300
  },

  // Horizontal compact (pour listes de pistes) - comme minimal mais horizontal
  compact: {
    orientation: 'horizontal',
    showScale: false,
    showNumeric: false,
    showRMS: true,
    showHold: false,
    width: 120,
    height: 12
  }
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_CONFIG = {
  preset: 'standard',
  orientation: 'vertical',

  // Affichage
  showScale: true,
  showNumeric: true,
  showRMS: true,
  showHold: true,
  showLUFS: false,

  // Range dB
  dbMin: -90,
  dbMax: 6,
  dbClip: 0,

  // Dimensions
  width: 24,
  height: 200,

  // Peak hold
  holdTime: 1500,      // ms avant decay
  decayRate: 20,       // dB/s

  // Ballistics (meter response)
  // Release rate in dB/s (like Logic Pro):
  //   4 = Tres lent, 6.3 = EBU lent, 8.6 = IEC Type II/EBU Normal
  //   11.8 = IEC Type I (default), 20 = Rapide, 30 = Plus rapide, 50 = Tres rapide
  ballistics: true,          // Activer les ballistics
  releaseRate: 11.8,         // dB/s - IEC Type I (recommande par Logic)

  // Couleurs (CSS variables ou valeurs directes)
  colors: {
    background: 'var(--meter-bg, #1a1a1a)',
    peak: 'var(--meter-peak, #00ff00)',
    rms: 'var(--meter-rms, #007700)',
    hold: 'var(--meter-hold, #ffffff)',
    warning: 'var(--meter-warning, #ffff00)',
    danger: 'var(--meter-danger, #ff0000)',
    scale: 'var(--meter-scale, #666666)',
    text: 'var(--meter-text, #cccccc)'
  },

  // Seuils (dB) - ITU-R style
  thresholds: {
    warning: -20,  // Start of yellow zone
    danger: -10    // Start of red zone (0 to -10 is red per ITU-R)
  }
}

// ============================================================================
// VUMETER CLASS
// ============================================================================

class VUMeter {
  /**
   * @param {HTMLElement} container - Element DOM conteneur
   * @param {Object} config - Configuration (voir DEFAULT_CONFIG)
   */
  constructor(container, config = {}) {
    // Merge preset + config + defaults
    const preset = METER_PRESETS[config.preset] || METER_PRESETS.standard
    this.config = { ...DEFAULT_CONFIG, ...preset, ...config }
    this.config.colors = { ...DEFAULT_CONFIG.colors, ...preset.colors, ...config.colors }
    this.config.thresholds = { ...DEFAULT_CONFIG.thresholds, ...config.thresholds }

    this.container = container
    this.values = {
      peak: -Infinity,
      rms: -Infinity,
      hold: -Infinity,
      lufs: -Infinity
    }

    // Peak hold state
    this.holdValue = -Infinity
    this.holdTimestamp = 0

    // Smoothed values (for PPM ballistics on peak only)
    this.smoothedPeak = -Infinity
    this.lastUpdateTime = performance.now()

    // Animation
    this.animationId = null

    this.render()
    this.startAnimation()
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  render() {
    const { orientation, width, height, showScale, showNumeric, showLUFS } = this.config
    const isVertical = orientation === 'vertical'

    this.container.innerHTML = ''
    this.container.classList.add('vu-meter', `vu-meter--${orientation}`)
    if (showScale) {
      this.container.classList.add('vu-meter--with-scale')
    }
    // Hide tick labels if meter is too short (< 180px)
    if (height < 180) {
      this.container.classList.add('vu-meter--compact-scale')
    }

    // Structure
    const wrapper = document.createElement('div')
    wrapper.className = 'vu-meter__wrapper'

    // Numeric display (top)
    if (showNumeric) {
      this.numericEl = document.createElement('div')
      this.numericEl.className = 'vu-meter__numeric'
      this.numericEl.textContent = '---'
      wrapper.appendChild(this.numericEl)
    }

    // Main meter area
    const meterArea = document.createElement('div')
    meterArea.className = 'vu-meter__area'

    // Bars container (before scale so labels appear on right)
    const barsContainer = document.createElement('div')
    barsContainer.className = 'vu-meter__bars'

    // Peak/ITU-R bar (main bar, normal width)
    this.peakBarEl = this.createBar('peak')
    barsContainer.appendChild(this.peakBarEl)

    // Hold indicator inside peak bar
    if (this.config.showHold) {
      this.holdEl = document.createElement('div')
      this.holdEl.className = 'vu-meter__hold'
      this.peakBarEl.appendChild(this.holdEl)
    }

    // RMS bar (thin, to the right of peak)
    if (this.config.showRMS) {
      this.rmsBarEl = this.createBar('rms')
      barsContainer.appendChild(this.rmsBarEl)
    }

    // LUFS bar (thin, to the right of RMS) - only in broadcast preset
    if (this.config.showLUFS) {
      this.lufsBarEl = this.createBar('lufs')
      barsContainer.appendChild(this.lufsBarEl)
    }

    meterArea.appendChild(barsContainer)

    // Scale (overlaid, with labels on right)
    if (showScale) {
      this.scaleEl = this.createScale()
      meterArea.appendChild(this.scaleEl)
    }

    wrapper.appendChild(meterArea)

    // LUFS display (bottom)
    if (showLUFS) {
      this.lufsEl = document.createElement('div')
      this.lufsEl.className = 'vu-meter__lufs'
      this.lufsEl.innerHTML = '<span class="vu-meter__lufs-label">LUFS</span><span class="vu-meter__lufs-value">---</span>'
      wrapper.appendChild(this.lufsEl)
    }

    this.container.appendChild(wrapper)

    // Apply dimensions
    this.applyDimensions()
  }

  createScale() {
    const { dbMin, dbMax, orientation } = this.config
    const isVertical = orientation === 'vertical'

    const scale = document.createElement('div')
    scale.className = 'vu-meter__scale'

    // ITU-R style graduation pattern (like professional meters)
    const majorTicks = []
    const minorTicks = []

    // Major ticks: +6, 0, then every 4dB to -40, then every 10dB
    if (dbMax >= 6) majorTicks.push(6)
    majorTicks.push(0) // Always include 0
    for (let db = -4; db >= -40 && db >= dbMin; db -= 4) {
      majorTicks.push(db)
    }
    // Below -40: every 10dB
    for (let db = -50; db >= dbMin; db -= 10) {
      majorTicks.push(db)
    }

    // Minor ticks: more precision around 0 (every 1dB from +5 to -3)
    for (let db = 5; db >= -3; db -= 1) {
      if (db <= dbMax && db >= dbMin && !majorTicks.includes(db)) {
        minorTicks.push(db)
      }
    }
    // Standard minor ticks elsewhere (every 2dB between majors)
    for (let db = -2; db >= -40 && db >= dbMin; db -= 4) {
      if (!minorTicks.includes(db)) minorTicks.push(db)
    }

    // Render major ticks with labels
    for (const db of majorTicks) {
      if (db < dbMin || db > dbMax) continue

      const tick = document.createElement('div')
      tick.className = 'vu-meter__tick vu-meter__tick--major'

      const percent = this.dbToPercent(db)
      if (isVertical) {
        tick.style.bottom = `${percent}%`
      } else {
        tick.style.left = `${percent}%`
      }

      const label = document.createElement('span')
      label.className = 'vu-meter__tick-label'
      label.textContent = db > 0 ? `+${db}` : (db === 0 ? '0' : db.toString())
      tick.appendChild(label)

      scale.appendChild(tick)
    }

    // Render minor ticks (no labels)
    for (const db of minorTicks) {
      if (db < dbMin || db > dbMax) continue

      const tick = document.createElement('div')
      tick.className = 'vu-meter__tick vu-meter__tick--minor'

      const percent = this.dbToPercent(db)
      if (isVertical) {
        tick.style.bottom = `${percent}%`
      } else {
        tick.style.left = `${percent}%`
      }

      scale.appendChild(tick)
    }

    return scale
  }

  createBar(type) {
    const bar = document.createElement('div')
    bar.className = `vu-meter__bar vu-meter__bar--${type}`

    const fill = document.createElement('div')
    fill.className = 'vu-meter__fill'
    bar.appendChild(fill)

    return bar
  }

  applyDimensions() {
    const { width, height, orientation } = this.config
    const isVertical = orientation === 'vertical'

    if (isVertical) {
      this.container.style.width = `${width + (this.config.showScale ? 30 : 0)}px`
      this.container.style.height = `${height + (this.config.showNumeric ? 24 : 0) + (this.config.showLUFS ? 32 : 0)}px`
    } else {
      this.container.style.width = `${width}px`
      this.container.style.height = `${height + (this.config.showNumeric ? 16 : 0)}px`
    }
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  /**
   * Met a jour les valeurs du metre
   * @param {Object} data - { peak, rms, hold, lufs } en dB
   */
  update(data) {
    const now = performance.now()
    const deltaTime = (now - this.lastUpdateTime) / 1000  // en secondes
    this.lastUpdateTime = now

    if (data.peak !== undefined) {
      const targetPeak = this.clampDb(data.peak)
      if (this.config.ballistics) {
        this.smoothedPeak = this.applyBallistics(this.smoothedPeak, targetPeak, deltaTime)
        this.values.peak = this.smoothedPeak
      } else {
        this.values.peak = targetPeak
      }
      this.updateHold(this.values.peak)
    }
    if (data.rms !== undefined) {
      // RMS is already smoothed by backend (300ms EMA), no additional smoothing needed
      this.values.rms = this.clampDb(data.rms)
    }
    if (data.lufs !== undefined) {
      this.values.lufs = data.lufs
    }
    if (data.hold !== undefined) {
      // Hold externe (du backend)
      this.holdValue = this.clampDb(data.hold)
    }
  }

  /**
   * Applique les ballistics (attack instantane, release lineaire en dB/s)
   * @param {number} current - Valeur actuelle (dB)
   * @param {number} target - Valeur cible (dB)
   * @param {number} deltaTime - Temps ecoule en secondes
   * @returns {number} - Nouvelle valeur (dB)
   */
  applyBallistics(current, target, deltaTime) {
    if (!Number.isFinite(current)) current = this.config.dbMin

    if (target >= current) {
      // Attack instantane
      return target
    } else {
      // Release lineaire en dB/s
      const decay = this.config.releaseRate * deltaTime
      return Math.max(current - decay, target)
    }
  }

  updateHold(peakDb) {
    const now = Date.now()

    if (peakDb > this.holdValue) {
      this.holdValue = peakDb
      this.holdTimestamp = now
    } else if (now - this.holdTimestamp > this.config.holdTime) {
      // Decay
      const elapsed = (now - this.holdTimestamp - this.config.holdTime) / 1000
      const decay = elapsed * this.config.decayRate
      this.holdValue = Math.max(this.holdValue - decay, this.config.dbMin)
    }
  }

  // ==========================================================================
  // ANIMATION
  // ==========================================================================

  startAnimation() {
    const animate = () => {
      this.paint()
      this.animationId = requestAnimationFrame(animate)
    }
    this.animationId = requestAnimationFrame(animate)
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  paint() {
    const { orientation } = this.config
    const isVertical = orientation === 'vertical'

    // Peak bar - gradient fixe, seule la hauteur change
    const peakPercent = this.dbToPercent(this.values.peak)
    const peakFill = this.peakBarEl.querySelector('.vu-meter__fill')

    if (isVertical) {
      peakFill.style.height = `${peakPercent}%`
      // Gradient fixe par rapport au conteneur
      if (peakPercent > 0) {
        peakFill.style.background = this.getGradient()
        peakFill.style.backgroundSize = `100% ${(100 / peakPercent) * 100}%`
        peakFill.style.backgroundPosition = 'bottom'
      }
    } else {
      peakFill.style.width = `${peakPercent}%`
      if (peakPercent > 0) {
        peakFill.style.background = this.getGradientHorizontal()
        peakFill.style.backgroundSize = `${(100 / peakPercent) * 100}% 100%`
        peakFill.style.backgroundPosition = 'left'
      }
    }

    // RMS bar (separate thin bar)
    if (this.rmsBarEl) {
      const rmsPercent = this.dbToPercent(this.values.rms)
      const rmsFill = this.rmsBarEl.querySelector('.vu-meter__fill')
      if (isVertical) {
        rmsFill.style.height = `${rmsPercent}%`
      } else {
        rmsFill.style.width = `${rmsPercent}%`
      }
    }

    // LUFS bar (separate thin bar)
    if (this.lufsBarEl) {
      const lufsPercent = this.dbToPercent(this.values.lufs)
      const lufsFill = this.lufsBarEl.querySelector('.vu-meter__fill')
      if (isVertical) {
        lufsFill.style.height = `${lufsPercent}%`
      } else {
        lufsFill.style.width = `${lufsPercent}%`
      }
    }

    // Hold indicator
    if (this.holdEl) {
      const holdPercent = this.dbToPercent(this.holdValue)
      if (isVertical) {
        this.holdEl.style.bottom = `${holdPercent}%`
      } else {
        this.holdEl.style.left = `${holdPercent}%`
      }

      // Clip indicator
      if (this.holdValue >= this.config.dbClip) {
        this.holdEl.classList.add('vu-meter__hold--clip')
      } else {
        this.holdEl.classList.remove('vu-meter__hold--clip')
      }
    }

    // Numeric display - shows peak hold value (more useful than instant peak)
    if (this.numericEl) {
      const displayValue = this.holdValue > this.config.dbMin
        ? this.holdValue.toFixed(1)
        : '---'
      this.numericEl.textContent = displayValue

      // Red when clipping
      if (this.holdValue >= this.config.dbClip) {
        this.numericEl.classList.add('vu-meter__numeric--clip')
      } else {
        this.numericEl.classList.remove('vu-meter__numeric--clip')
      }
    }

    // LUFS display
    if (this.lufsEl) {
      const lufsValue = this.lufsEl.querySelector('.vu-meter__lufs-value')
      if (this.values.lufs > -70) {
        lufsValue.textContent = this.values.lufs.toFixed(1)
      } else {
        lufsValue.textContent = '---'
      }
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Convertit dB en pourcentage - echelle lineaire
   * Espacement regulier des graduations comme les metres pro
   */
  dbToPercent(db) {
    const { dbMin, dbMax } = this.config
    if (db <= dbMin) return 0
    if (db >= dbMax) return 100

    // Echelle lineaire : espacement regulier
    return ((db - dbMin) / (dbMax - dbMin)) * 100
  }

  /**
   * Retourne la couleur selon le niveau dB (pas proportionnel)
   */
  getColorForLevel(db) {
    const { colors, thresholds } = this.config
    if (db >= thresholds.danger) return colors.danger
    if (db >= thresholds.warning) return colors.warning
    return colors.peak
  }

  clampDb(db) {
    if (!Number.isFinite(db)) return this.config.dbMin
    return Math.max(this.config.dbMin, Math.min(this.config.dbMax, db))
  }

  /**
   * Genere le gradient vertical avec zones fixes
   * Les zones sont positionnees selon l'echelle logarithmique
   */
  getGradient() {
    const { colors, thresholds } = this.config

    // Positions en % selon echelle log
    const warningPos = this.dbToPercent(thresholds.warning)
    const dangerPos = this.dbToPercent(thresholds.danger)

    return `linear-gradient(to top,
      ${colors.peak} 0%,
      ${colors.peak} ${warningPos}%,
      ${colors.warning} ${warningPos}%,
      ${colors.warning} ${dangerPos}%,
      ${colors.danger} ${dangerPos}%,
      ${colors.danger} 100%)`
  }

  /**
   * Genere le gradient horizontal avec zones fixes
   */
  getGradientHorizontal() {
    const { colors, thresholds } = this.config

    const warningPos = this.dbToPercent(thresholds.warning)
    const dangerPos = this.dbToPercent(thresholds.danger)

    return `linear-gradient(to right,
      ${colors.peak} 0%,
      ${colors.peak} ${warningPos}%,
      ${colors.warning} ${warningPos}%,
      ${colors.warning} ${dangerPos}%,
      ${colors.danger} ${dangerPos}%,
      ${colors.danger} 100%)`
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Change le preset a runtime
   * @param {string} presetName - nom du preset
   */
  setPreset(presetName) {
    const preset = METER_PRESETS[presetName]
    if (preset) {
      this.config = { ...this.config, ...preset }
      this.render()
    }
  }

  /**
   * Reset le peak hold
   */
  resetHold() {
    this.holdValue = -Infinity
    this.holdTimestamp = 0
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopAnimation()
    this.container.innerHTML = ''
    this.container.classList.remove(
      'vu-meter',
      'vu-meter--vertical',
      'vu-meter--horizontal',
      'vu-meter--with-scale',
      'vu-meter--compact-scale'
    )
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VUMeter, METER_PRESETS }
}

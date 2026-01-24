/**
 * AudioTrackGroup - Groupe de tracks audio avec RAF centralisé
 * Gère automatiquement le rendering optimisé pour N tracks
 *
 * Performance : Un seul RAF pour tous les meters (optimisé pour 128+ tracks)
 *
 * @example
 * const group = new AudioTrackGroup(container, {
 *   layout: 'horizontal',  // 'horizontal' | 'vertical' | 'grid'
 *   gap: 8
 * });
 *
 * // Ajouter track
 * const track = group.addTrack({
 *   trackId: 1,
 *   size: 'compact',
 *   location: 'P-01',
 *   onThresholdChange: (value) => {}
 * });
 *
 * // Update metering (RAF automatique)
 * group.updateMetering(1, { peak: -12, rms: -18 });
 *
 * // Ou batch update
 * group.batchUpdateMetering([
 *   { trackId: 1, peak: -12, rms: -18 },
 *   { trackId: 2, peak: -15, rms: -21 }
 * ]);
 */

import AudioTrack from './AudioTrack.js';

class AudioTrackGroup {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      layout: 'horizontal',  // horizontal | vertical | grid
      gap: 8,                // Gap between tracks (px)
      autoRAF: true,         // Auto start RAF loop
      rafRate: 60,           // Max RAF rate (Hz) - 0 = unlimited
      ...config
    };

    this.tracks = new Map();        // trackId -> AudioTrack instance
    this.rafId = null;
    this.element = null;

    this.render();

    if (this.config.autoRAF) {
      this.startRAF();
    }
  }

  // ========================================================================
  // RENDERING
  // ========================================================================

  render() {
    const container = document.createElement('div');
    container.className = this.getClassNames();
    container.style.display = 'flex';
    container.style.gap = `${this.config.gap}px`;

    if (this.config.layout === 'horizontal') {
      container.style.flexDirection = 'row';
      container.style.flexWrap = 'wrap';
    } else if (this.config.layout === 'vertical') {
      container.style.flexDirection = 'column';
    } else if (this.config.layout === 'grid') {
      container.style.display = 'grid';
      container.style.gridTemplateColumns = `repeat(auto-fill, minmax(60px, 1fr))`;
      container.style.gridGap = `${this.config.gap}px`;
    }

    if (this.element) {
      this.container.replaceChild(container, this.element);
    } else {
      this.container.appendChild(container);
    }

    this.element = container;

    // Re-render existing tracks
    this.tracks.forEach(track => {
      this.element.appendChild(track.element);
    });
  }

  getClassNames() {
    const classes = ['audio-track-group'];
    classes.push(`audio-track-group--${this.config.layout}`);
    return classes.join(' ');
  }

  // ========================================================================
  // TRACK MANAGEMENT
  // ========================================================================

  /**
   * Add track to group
   * @param {Object} config - AudioTrack config
   * @returns {AudioTrack} Created track instance
   */
  addTrack(config) {
    if (config.trackId === undefined || config.trackId === null) {
      throw new Error('AudioTrackGroup.addTrack: trackId is required');
    }

    if (this.tracks.has(config.trackId)) {
      console.warn(`AudioTrackGroup: Track ${config.trackId} already exists, replacing`);
      this.removeTrack(config.trackId);
    }

    // Create container for track
    const trackContainer = document.createElement('div');
    this.element.appendChild(trackContainer);

    // Create AudioTrack
    const track = new AudioTrack(trackContainer, config);
    this.tracks.set(config.trackId, track);

    // Start RAF if first track and autoRAF enabled
    if (this.tracks.size === 1 && this.config.autoRAF && !this.rafId) {
      this.startRAF();
    }

    return track;
  }

  /**
   * Remove track from group
   * @param {Number} trackId
   */
  removeTrack(trackId) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.destroy();
    this.tracks.delete(trackId);
    this.meteringQueue.delete(trackId);

    // Stop RAF if no tracks left
    if (this.tracks.size === 0 && this.rafId) {
      this.stopRAF();
    }
  }

  /**
   * Get track instance
   * @param {Number} trackId
   * @returns {AudioTrack|undefined}
   */
  getTrack(trackId) {
    return this.tracks.get(trackId);
  }

  /**
   * Remove all tracks
   */
  clear() {
    this.tracks.forEach(track => track.destroy());
    this.tracks.clear();
    this.element.innerHTML = '';

    if (this.rafId) {
      this.stopRAF();
    }
  }

  // ========================================================================
  // METERING
  // ========================================================================

  /**
   * Update metering for single track
   * Updates data immediately, painting happens in RAF loop
   * @param {Number} trackId
   * @param {Number} peak - Peak level in dB
   * @param {Number} rms - RMS level in dB
   * @param {Boolean} recording - Recording state from backend
   * @param {Boolean} thresholdExceeded - Threshold exceeded state from backend
   */
  updateMetering(trackId, peak, rms, recording, thresholdExceeded, gateState) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Update data directly (pass new params from backend)
    track.updateMetering(peak, rms, recording, thresholdExceeded, gateState);
  }

  /**
   * Batch update metering for multiple tracks
   * More efficient than calling updateMetering() multiple times
   * @param {Array} updates - Array of {trackId, peak, rms, recording, thresholdExceeded}
   */
  batchUpdateMetering(updates) {
    updates.forEach(({ trackId, peak, rms, recording, thresholdExceeded, gateState }) => {
      const track = this.tracks.get(trackId);
      if (track) {
        track.updateMetering(peak, rms, recording, thresholdExceeded, gateState);
      }
    });
  }

  /**
   * Paint all meters - Simple RAF loop like in index.html
   * Called automatically by RAF loop at ~60fps
   */
  paintAll() {
    const start = performance.now();

    // Just paint all meters - simple and performant
    this.tracks.forEach(track => {
      track.paintMeter();
    });

    this.lastPaintDuration = performance.now() - start;
  }

  // ========================================================================
  // RAF LOOP
  // ========================================================================

  /**
   * Start RAF loop for automatic painting
   */
  startRAF() {
    if (this.rafId) return; // Already running

    const loop = () => {
      this.paintAll();
      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Stop RAF loop
   */
  stopRAF() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Check if RAF is running
   * @returns {Boolean}
   */
  isRAFRunning() {
    return this.rafId !== null;
  }

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  /**
   * Get number of tracks in group
   * @returns {Number}
   */
  getTrackCount() {
    return this.tracks.size;
  }

  /**
   * Get all track IDs
   * @returns {Array<Number>}
   */
  getTrackIds() {
    return Array.from(this.tracks.keys());
  }

  /**
   * Set layout
   * @param {String} layout - 'horizontal' | 'vertical' | 'grid'
   */
  setLayout(layout) {
    this.config.layout = layout;
    this.render();
  }

  /**
   * Destroy group and all tracks
   */
  destroy() {
    this.stopRAF();
    this.clear();

    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.AudioTrackGroup = AudioTrackGroup;
}

// Export for module usage
export default AudioTrackGroup;

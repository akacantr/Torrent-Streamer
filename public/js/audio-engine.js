/**
 * Web Audio API 5.1 Surround & Dolby Atmos Spatial Virtualizer.
 *
 * Channel order follows W3C / SMPTE 5.1:
 *   0: L   (Front Left)
 *   1: R   (Front Right)
 *   2: C   (Center / Dialogue)
 *   3: LFE (Subwoofer / Low Frequency Effects)
 *   4: LS  (Surround Left)
 *   5: RS  (Surround Right)
 */

const CHANNEL_KEYS = ['L', 'R', 'C', 'LFE', 'LS', 'RS'];
const VALID_PRESETS = new Set(['atmos', 'cinema51', 'dialogue', 'passthrough', 'stereo']);
const ANALYSER_FFT_SIZE = 256;
const MIN_DB_FLOOR = -54;

/**
 * Cache MediaElementAudioSourceNode instances per HTMLMediaElement because the
 * Web Audio API allows only one createMediaElementSource() call per element.
 * @type {WeakMap<HTMLMediaElement, { ctx: AudioContext, sourceNode: MediaElementAudioSourceNode }>}
 */
const elementSourceRegistry = new WeakMap();

/**
 * Convert decibels to linear gain multiplier.
 * @param {number} db
 * @returns {number}
 */
function dbToGain(db) {
  return 10 ** (db / 20);
}

/**
 * Parse a finite number from a number or numeric string, returning null otherwise.
 * @param {unknown} value
 * @returns {number | null}
 */
function toFiniteNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Create a DynamicsCompressorNode tuned for Dolby Night Mode DRC.
 * @param {AudioContext} ctx
 * @returns {DynamicsCompressorNode}
 */
function createNightDrcCompressor(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -28;
  comp.knee.value = 20;
  comp.ratio.value = 6;
  comp.attack.value = 0.005;
  comp.release.value = 0.25;
  return comp;
}

/**
 * Create a 2500 Hz peaking filter for dialogue clarity.
 * @param {AudioContext} ctx
 * @returns {BiquadFilterNode}
 */
function createDialoguePeakingFilter(ctx) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'peaking';
  filter.frequency.value = 2500;
  filter.Q.value = 1.1;
  filter.gain.value = 0;
  return filter;
}

/**
 * Compute normalized 0..100 audio level from an AnalyserNode using preallocated buffers.
 * @param {AnalyserNode} analyser
 * @param {Float32Array} floatBuf
 * @param {Uint8Array} byteBuf
 * @returns {number}
 */
function measureAnalyserLevel(analyser, floatBuf, byteBuf) {
  let sumSq = 0;
  let peak = 0;

  if (typeof analyser.getFloatTimeDomainData === 'function') {
    analyser.getFloatTimeDomainData(floatBuf);
    for (let i = 0; i < floatBuf.length; i++) {
      const s = floatBuf[i];
      const abs = s < 0 ? -s : s;
      if (abs > peak) peak = abs;
      sumSq += s * s;
    }
  } else {
    analyser.getByteTimeDomainData(byteBuf);
    for (let i = 0; i < byteBuf.length; i++) {
      const s = (byteBuf[i] - 128) / 128;
      const abs = s < 0 ? -s : s;
      if (abs > peak) peak = abs;
      sumSq += s * s;
    }
  }

  const rms = Math.sqrt(sumSq / floatBuf.length);
  const level = Math.max(rms, peak * 0.55);
  if (!Number.isFinite(level) || level <= 0.0005) return 0;

  const db = 20 * Math.log10(level);
  const normalized = ((db - MIN_DB_FLOOR) / -MIN_DB_FLOOR) * 100;
  return Math.max(0, Math.min(100, normalized));
}

export class SurroundAudioEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    /** @type {HTMLMediaElement | null} */
    this.videoEl = null;
    /** @type {MediaElementAudioSourceNode | null} */
    this.sourceNode = null;
    /** @type {boolean} */
    this.hasDiscrete6Ch = false;

    /** @type {'atmos' | 'cinema51' | 'dialogue' | 'passthrough' | 'stereo'} */
    this.activePreset = 'atmos';
    /** @type {boolean} */
    this._nightMode = false;
    /** @type {number} */
    this._sourceChannels = 6;
    this.gains = {
      centerDb: 0,
      lfeDb: 0,
      surroundDb: 0,
      masterGain: 1,
    };

    /** @type {Record<string, { analyser: AnalyserNode, floatBuf: Float32Array, byteBuf: Uint8Array }>} */
    this._meters = {};
    this._smoothedLevels = { L: 0, R: 0, C: 0, LFE: 0, LS: 0, RS: 0 };

    /** @type {any} */
    this._nodes = null;
    /** @type {DynamicsCompressorNode | null} */
    this.compressor = null;
    /** @type {WeakSet<HTMLMediaElement>} */
    this._playBoundElements = new WeakSet();
  }

  /** @returns {boolean} */
  get nightMode() {
    return this._nightMode;
  }

  /**
   * Attach an HTMLMediaElement (<video> or <audio>) to the Web Audio 5.1/Atmos graph.
   * Safe against repeated calls on the same element.
   * @param {HTMLMediaElement} videoEl
   * @returns {SurroundAudioEngine}
   */
  attach(videoEl) {
    if (!videoEl) {
      throw new TypeError('SurroundAudioEngine.attach requires a media element.');
    }

    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) {
      return this;
    }

    const cached = elementSourceRegistry.get(videoEl);
    if (
      this.videoEl === videoEl &&
      this.ctx &&
      this.ctx.state !== 'closed' &&
      this.sourceNode &&
      this._nodes
    ) {
      this._configureDestination();
      if (!this._nodes) {
        this._buildGraph();
        this.sourceNode.connect(this._nodes.splitter);
      }
      this._applyDspState();
      return this;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {
        // Ignore if not currently connected
      }
    }

    if (cached && cached.ctx && cached.ctx.state !== 'closed') {
      if (this.ctx !== cached.ctx) {
        this.ctx = cached.ctx;
        this._nodes = null;
      }
      this.sourceNode = cached.sourceNode;
      try {
        this.sourceNode.disconnect();
      } catch (_) {
        // Ignore if not currently connected
      }
    } else {
      if (!this.ctx || this.ctx.state === 'closed') {
        try {
          this.ctx = new AudioCtx({ latencyHint: 'interactive' });
        } catch (_) {
          this.ctx = new AudioCtx();
        }
        this._nodes = null;
      }
      this.sourceNode = this.ctx.createMediaElementSource(videoEl);
      elementSourceRegistry.set(videoEl, {
        ctx: this.ctx,
        sourceNode: this.sourceNode,
      });
    }

    this.videoEl = videoEl;
    this._configureDestination();

    if (!this._nodes) {
      this._buildGraph();
    }

    this.sourceNode.connect(this._nodes.splitter);
    this._applyDspState();

    if (!this._playBoundElements.has(videoEl) && typeof videoEl.addEventListener === 'function') {
      this._playBoundElements.add(videoEl);
      videoEl.addEventListener('play', () => {
        void this.resume();
      });
    }

    return this;
  }

  /**
   * Resume AudioContext if suspended (must be invoked from user gesture or play).
   * @returns {Promise<string>}
   */
  async resume() {
    if (!this.ctx) return 'uninitialized';
    if (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted') {
      try {
        await this.ctx.resume();
      } catch (_) {
        // Browser may still block resume prior to user gesture
      }
    }
    return this.ctx.state;
  }

  /**
   * Set active spatial/surround DSP preset.
   * @param {'atmos' | 'spatial' | 'cinema51' | 'dialogue' | 'passthrough' | 'stereo'} presetName
   */
  setPreset(presetName) {
    const normalized = presetName === 'spatial' ? 'atmos' : presetName;
    if (!VALID_PRESETS.has(normalized)) return;
    this.activePreset = normalized;
    this._applyDspState();
  }

  /**
   * Record the channel count of the active media audio track.
   * @param {number} [channels=6]
   */
  setSourceChannels(channels = 6) {
    this._sourceChannels = Math.max(1, Number(channels) || 6);
  }

  /**
   * Update per-channel dB gains or master gain (supports partial updates).
   * @param {{ centerDb?: number, lfeDb?: number, surroundDb?: number, masterGain?: number }} gains
   */
  setGains(gains = {}) {
    if (!gains || typeof gains !== 'object') return;

    const centerDb = toFiniteNumber(gains.centerDb);
    const lfeDb = toFiniteNumber(gains.lfeDb);
    const surroundDb = toFiniteNumber(gains.surroundDb);
    const masterGain = toFiniteNumber(gains.masterGain);

    if (centerDb !== null) {
      this.gains.centerDb = Math.max(-60, Math.min(24, centerDb));
    }
    if (lfeDb !== null) {
      this.gains.lfeDb = Math.max(-60, Math.min(24, lfeDb));
    }
    if (surroundDb !== null) {
      this.gains.surroundDb = Math.max(-60, Math.min(24, surroundDb));
    }
    if (masterGain !== null) {
      this.gains.masterGain = Math.max(0, Math.min(2, masterGain));
    }

    this._applyDspState();
  }

  /**
   * Toggle Dolby-style Night Mode dynamic range compression.
   * @param {boolean} enabled
   */
  setNightMode(enabled) {
    this._nightMode = Boolean(enabled);
    this._applyDspState();
  }

  /**
   * Read real-time 0..100 levels for all 6 channels.
   * Handles 2-channel stereo inputs safely (C/LFE/LS/RS remain valid numbers 0..100).
   * @returns {{ L: number, R: number, C: number, LFE: number, LS: number, RS: number }}
   */
  getChannelLevels() {
    if (!this.ctx || !this._nodes || this.ctx.state !== 'running') {
      return { L: 0, R: 0, C: 0, LFE: 0, LS: 0, RS: 0 };
    }

    const out = {};
    for (const key of CHANNEL_KEYS) {
      const meter = this._meters[key];
      if (!meter) {
        out[key] = 0;
        continue;
      }
      const raw = measureAnalyserLevel(meter.analyser, meter.floatBuf, meter.byteBuf);
      const prev = this._smoothedLevels[key] || 0;
      const smoothed = raw > prev ? prev * 0.25 + raw * 0.75 : prev * 0.78 + raw * 0.22;
      const clamped = smoothed < 0.4 ? 0 : Math.min(100, Math.max(0, smoothed));
      this._smoothedLevels[key] = clamped;
      out[key] = Math.round(clamped * 10) / 10;
    }

    return /** @type {{ L: number, R: number, C: number, LFE: number, LS: number, RS: number }} */ (out);
  }

  /**
   * Report Web Audio hardware and engine state.
   * @returns {{ maxHardwareChannels: number, sampleRate: number, state: string, activePreset: string, nightMode: boolean, sourceChannels: number, baseLatency: number, outputLatency: number }}
   */
  getCapabilities() {
    const ctx = this.ctx;
    if (!ctx) {
      return {
        maxHardwareChannels: 2,
        sampleRate: 0,
        state: 'uninitialized',
        activePreset: this.activePreset,
        nightMode: this._nightMode,
        sourceChannels: this._sourceChannels,
        baseLatency: 0,
        outputLatency: 0,
      };
    }

    return {
      maxHardwareChannels: ctx.destination.maxChannelCount || 2,
      sampleRate: ctx.sampleRate,
      state: ctx.state,
      activePreset: this.activePreset,
      nightMode: this._nightMode,
      sourceChannels: this._sourceChannels,
      baseLatency: ctx.baseLatency ?? 0,
      outputLatency: ctx.outputLatency ?? 0,
    };
  }

  /**
   * Configure destination channel count for 5.1 hardware when available.
   */
  _configureDestination() {
    if (!this.ctx) return;
    const dest = this.ctx.destination;
    const maxCh = dest.maxChannelCount || 2;
    const targetCh = Math.min(6, maxCh);
    const prevDiscrete = this.hasDiscrete6Ch;
    this.hasDiscrete6Ch = maxCh >= 6;

    try {
      dest.channelCount = targetCh;
      dest.channelCountMode = 'explicit';
      dest.channelInterpretation = 'speakers';
    } catch (_) {
      // Some platforms lock AudioDestinationNode properties
    }

    if (this._nodes && prevDiscrete !== this.hasDiscrete6Ch) {
      try {
        this.sourceNode?.disconnect();
        this._nodes.masterGainNode?.disconnect();
      } catch (_) {
        // Ignore if nodes were already disconnected
      }
      this._nodes = null;
    }
  }

  /**
   * Construct the 6-channel splitter, per-channel DSP, analysers, virtualizer, and DRC output stage.
   */
  _buildGraph() {
    const ctx = this.ctx;
    if (!ctx) return;

    const splitter = ctx.createChannelSplitter(6);

    // Per-channel gain nodes
    const chGain = {
      L: ctx.createGain(),
      R: ctx.createGain(),
      C: ctx.createGain(),
      LFE: ctx.createGain(),
      LS: ctx.createGain(),
      RS: ctx.createGain(),
    };

    // Dialogue peaking filters (2500 Hz): Center for 5.1/dialogue, L/R for clean stereo dialogue boost
    const leftDialogueFilter = createDialoguePeakingFilter(ctx);
    const rightDialogueFilter = createDialoguePeakingFilter(ctx);
    const centerFilter = createDialoguePeakingFilter(ctx);

    // LFE 120 Hz low-pass filter + bypass gate for pure passthrough
    const lfeFilter = ctx.createBiquadFilter();
    lfeFilter.type = 'lowpass';
    lfeFilter.frequency.value = 120;
    lfeFilter.Q.value = 0.707;
    const lfeFilteredGate = ctx.createGain();
    const lfeBypassGate = ctx.createGain();

    // Virtual height air shelf filters (10000 Hz) for LS & RS
    const createAirShelf = () => {
      const shelf = ctx.createBiquadFilter();
      shelf.type = 'highshelf';
      shelf.frequency.value = 10000;
      shelf.gain.value = 0;
      return shelf;
    };
    const lsAirFilter = createAirShelf();
    const rsAirFilter = createAirShelf();

    // Create 6 single-channel AnalyserNodes (fftSize = 256)
    this._meters = {};
    for (const key of CHANNEL_KEYS) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = ANALYSER_FFT_SIZE;
      analyser.smoothingTimeConstant = 0.45;
      analyser.channelCount = 1;
      analyser.channelCountMode = 'explicit';
      this._meters[key] = {
        analyser,
        floatBuf: new Float32Array(ANALYSER_FFT_SIZE),
        byteBuf: new Uint8Array(analyser.frequencyBinCount * 2),
      };
    }

    // Wire splitter -> per-channel DSP -> per-channel analyser
    splitter.connect(leftDialogueFilter, 0);
    leftDialogueFilter.connect(chGain.L);
    chGain.L.connect(this._meters.L.analyser);

    splitter.connect(rightDialogueFilter, 1);
    rightDialogueFilter.connect(chGain.R);
    chGain.R.connect(this._meters.R.analyser);

    splitter.connect(centerFilter, 2);
    centerFilter.connect(chGain.C);
    chGain.C.connect(this._meters.C.analyser);

    splitter.connect(lfeFilter, 3);
    lfeFilter.connect(lfeFilteredGate);
    lfeFilteredGate.connect(chGain.LFE);
    splitter.connect(lfeBypassGate, 3);
    lfeBypassGate.connect(chGain.LFE);
    chGain.LFE.connect(this._meters.LFE.analyser);

    splitter.connect(lsAirFilter, 4);
    lsAirFilter.connect(chGain.LS);
    chGain.LS.connect(this._meters.LS.analyser);

    splitter.connect(rsAirFilter, 5);
    rsAirFilter.connect(chGain.RS);
    chGain.RS.connect(this._meters.RS.analyser);

    // Haas cross-feed delays (12ms-18ms) on LS & RS
    const lsHaasDelay = ctx.createDelay(0.1);
    lsHaasDelay.delayTime.value = 0.014;
    const rsHaasDelay = ctx.createDelay(0.1);
    rsHaasDelay.delayTime.value = 0.017;

    this._meters.LS.analyser.connect(lsHaasDelay);
    this._meters.RS.analyser.connect(rsHaasDelay);

    const masterGainNode = ctx.createGain();
    const drcDryGain = ctx.createGain();
    const drcWetGain = ctx.createGain();

    let mix2 = null;
    let mix6 = null;

    if (this.hasDiscrete6Ch) {
      // Discrete 6-channel bus via ChannelMergerNode(6)
      const merger6 = ctx.createChannelMerger(6);
      mix6 = {
        L_direct: ctx.createGain(),
        R_direct: ctx.createGain(),
        C_direct: ctx.createGain(),
        LFE_direct: ctx.createGain(),
        LS_direct: ctx.createGain(),
        RS_direct: ctx.createGain(),
        LS_width_to_RS: ctx.createGain(),
        RS_width_to_LS: ctx.createGain(),
        LS_haas_to_RS: ctx.createGain(),
        RS_haas_to_LS: ctx.createGain(),
      };

      this._meters.L.analyser.connect(mix6.L_direct);
      mix6.L_direct.connect(merger6, 0, 0);

      this._meters.R.analyser.connect(mix6.R_direct);
      mix6.R_direct.connect(merger6, 0, 1);

      this._meters.C.analyser.connect(mix6.C_direct);
      mix6.C_direct.connect(merger6, 0, 2);

      this._meters.LFE.analyser.connect(mix6.LFE_direct);
      mix6.LFE_direct.connect(merger6, 0, 3);

      this._meters.LS.analyser.connect(mix6.LS_direct);
      mix6.LS_direct.connect(merger6, 0, 4);

      this._meters.RS.analyser.connect(mix6.RS_direct);
      mix6.RS_direct.connect(merger6, 0, 5);

      // Surround spatial width + Haas cross-feed across LS <-> RS
      this._meters.LS.analyser.connect(mix6.LS_width_to_RS);
      mix6.LS_width_to_RS.connect(merger6, 0, 5);

      this._meters.RS.analyser.connect(mix6.RS_width_to_LS);
      mix6.RS_width_to_LS.connect(merger6, 0, 4);

      lsHaasDelay.connect(mix6.LS_haas_to_RS);
      mix6.LS_haas_to_RS.connect(merger6, 0, 5);

      rsHaasDelay.connect(mix6.RS_haas_to_LS);
      mix6.RS_haas_to_LS.connect(merger6, 0, 4);

      // Preserve 6 discrete channels across DRC (DynamicsCompressorNode clamps to 2ch)
      drcDryGain.channelCount = 6;
      drcDryGain.channelCountMode = 'explicit';
      drcDryGain.channelInterpretation = 'speakers';

      drcWetGain.channelCount = 6;
      drcWetGain.channelCountMode = 'explicit';
      drcWetGain.channelInterpretation = 'speakers';

      masterGainNode.channelCount = 6;
      masterGainNode.channelCountMode = 'explicit';
      masterGainNode.channelInterpretation = 'speakers';

      merger6.connect(drcDryGain);
      drcDryGain.connect(masterGainNode);

      const drcSplit = ctx.createChannelSplitter(6);
      const drcMerger6 = ctx.createChannelMerger(6);
      merger6.connect(drcSplit);

      const pairConfigs = [
        [0, 1],
        [2, 3],
        [4, 5],
      ];
      pairConfigs.forEach(([chA, chB], idx) => {
        const pairMerger = ctx.createChannelMerger(2);
        const comp = createNightDrcCompressor(ctx);
        const pairSplitter = ctx.createChannelSplitter(2);
        if (idx === 0) this.compressor = comp;

        drcSplit.connect(pairMerger, chA, 0);
        drcSplit.connect(pairMerger, chB, 1);
        pairMerger.connect(comp);
        comp.connect(pairSplitter);
        pairSplitter.connect(drcMerger6, 0, chA);
        pairSplitter.connect(drcMerger6, 1, chB);
      });

      drcMerger6.connect(drcWetGain);
      drcWetGain.connect(masterGainNode);
    } else {
      // 2-channel stereo / binaural folddown bus
      const merger2 = ctx.createChannelMerger(2);
      mix2 = {
        L_to_L: ctx.createGain(),
        R_to_R: ctx.createGain(),
        C_to_LR: ctx.createGain(),
        LFE_to_LR: ctx.createGain(),
        LS_to_L: ctx.createGain(),
        RS_to_R: ctx.createGain(),
        LS_width_to_R: ctx.createGain(),
        RS_width_to_L: ctx.createGain(),
        LS_haas_to_R: ctx.createGain(),
        RS_haas_to_L: ctx.createGain(),
      };

      this._meters.L.analyser.connect(mix2.L_to_L);
      mix2.L_to_L.connect(merger2, 0, 0);

      this._meters.R.analyser.connect(mix2.R_to_R);
      mix2.R_to_R.connect(merger2, 0, 1);

      this._meters.C.analyser.connect(mix2.C_to_LR);
      mix2.C_to_LR.connect(merger2, 0, 0);
      mix2.C_to_LR.connect(merger2, 0, 1);

      this._meters.LFE.analyser.connect(mix2.LFE_to_LR);
      mix2.LFE_to_LR.connect(merger2, 0, 0);
      mix2.LFE_to_LR.connect(merger2, 0, 1);

      this._meters.LS.analyser.connect(mix2.LS_to_L);
      mix2.LS_to_L.connect(merger2, 0, 0);

      this._meters.RS.analyser.connect(mix2.RS_to_R);
      mix2.RS_to_R.connect(merger2, 0, 1);

      this._meters.LS.analyser.connect(mix2.LS_width_to_R);
      mix2.LS_width_to_R.connect(merger2, 0, 1);

      this._meters.RS.analyser.connect(mix2.RS_width_to_L);
      mix2.RS_width_to_L.connect(merger2, 0, 0);

      lsHaasDelay.connect(mix2.LS_haas_to_R);
      mix2.LS_haas_to_R.connect(merger2, 0, 1);

      rsHaasDelay.connect(mix2.RS_haas_to_L);
      mix2.RS_haas_to_L.connect(merger2, 0, 0);

      const comp = createNightDrcCompressor(ctx);
      this.compressor = comp;

      merger2.connect(drcDryGain);
      drcDryGain.connect(masterGainNode);

      merger2.connect(comp);
      comp.connect(drcWetGain);
      drcWetGain.connect(masterGainNode);
    }

    masterGainNode.connect(ctx.destination);

    this._nodes = {
      splitter,
      chGain,
      leftDialogueFilter,
      rightDialogueFilter,
      centerFilter,
      lfeFilter,
      lfeFilteredGate,
      lfeBypassGate,
      lsAirFilter,
      rsAirFilter,
      lsHaasDelay,
      rsHaasDelay,
      mix2,
      mix6,
      drcDryGain,
      drcWetGain,
      masterGainNode,
    };
  }

  /**
   * Smoothly apply an AudioParam target value without clicks.
   * @param {AudioParam | undefined} param
   * @param {number} value
   */
  _setParam(param, value) {
    if (!param || !this.ctx) return;
    const target = Number.isFinite(value) ? value : 0;
    try {
      if (this.ctx.state === 'running' && typeof param.setTargetAtTime === 'function') {
        param.setTargetAtTime(target, this.ctx.currentTime, 0.02);
      } else {
        param.value = target;
      }
    } catch (_) {
      param.value = target;
    }
  }

  /**
   * Synchronize all DSP node parameters with activePreset, gains, and nightMode.
   */
  _applyDspState() {
    const n = this._nodes;
    if (!n || !this.ctx) return;

    const preset = this.activePreset;
    const isPassthrough = preset === 'passthrough';
    const isStereo = preset === 'stereo';
    const isUncolored = isPassthrough || isStereo;
    const isAtmos = preset === 'atmos';
    const isDialogue = preset === 'dialogue';

    // User gain multipliers (passthrough/stereo keep unity channel gains; stereo uses L/R dialogue boost)
    const userCenter = isUncolored ? 1 : dbToGain(this.gains.centerDb);
    const userLfe = isUncolored ? 1 : dbToGain(this.gains.lfeDb);
    const userSurround = isUncolored ? 1 : dbToGain(this.gains.surroundDb);

    // Preset-specific per-channel multipliers
    const frontMult = isDialogue ? 0.89 : 1;
    const centerMult = isDialogue ? 1.45 : 1;
    const lfeMult = isDialogue ? 0.63 : 1;
    const surroundMult = isDialogue ? 0.6 : 1;

    this._setParam(n.chGain.L.gain, frontMult);
    this._setParam(n.chGain.R.gain, frontMult);
    this._setParam(n.chGain.C.gain, userCenter * centerMult);
    this._setParam(n.chGain.LFE.gain, userLfe * lfeMult);
    this._setParam(n.chGain.LS.gain, userSurround * surroundMult);
    this._setParam(n.chGain.RS.gain, userSurround * surroundMult);

    // Per-channel EQ filters
    const stereoDialogueDb = isStereo ? Math.max(-9, Math.min(9, this.gains.centerDb * 0.65)) : 0;
    this._setParam(n.leftDialogueFilter.gain, stereoDialogueDb);
    this._setParam(n.rightDialogueFilter.gain, stereoDialogueDb);

    const centerEqDb = isAtmos ? 3.5 : preset === 'cinema51' ? 1.5 : isDialogue ? 6.0 : 0;
    this._setParam(n.centerFilter.gain, centerEqDb);

    this._setParam(n.lfeFilteredGate.gain, isUncolored ? 0 : 1);
    this._setParam(n.lfeBypassGate.gain, isUncolored ? 1 : 0);

    const airDb = isAtmos ? 4.5 : 0;
    this._setParam(n.lsAirFilter.gain, airDb);
    this._setParam(n.rsAirFilter.gain, airDb);

    // Spatial / folddown mix matrix
    if (n.mix2) {
      const m = n.mix2;
      if (isAtmos) {
        this._setParam(m.L_to_L.gain, 0.85);
        this._setParam(m.R_to_R.gain, 0.85);
        this._setParam(m.C_to_LR.gain, 0.58);
        this._setParam(m.LFE_to_LR.gain, 0.4);
        this._setParam(m.LS_to_L.gain, 0.78);
        this._setParam(m.RS_to_R.gain, 0.78);
        this._setParam(m.LS_width_to_R.gain, -0.2);
        this._setParam(m.RS_width_to_L.gain, -0.2);
        this._setParam(m.LS_haas_to_R.gain, 0.26);
        this._setParam(m.RS_haas_to_L.gain, 0.26);
      } else if (preset === 'cinema51') {
        this._setParam(m.L_to_L.gain, 0.85);
        this._setParam(m.R_to_R.gain, 0.85);
        this._setParam(m.C_to_LR.gain, 0.6);
        this._setParam(m.LFE_to_LR.gain, 0.38);
        this._setParam(m.LS_to_L.gain, 0.6);
        this._setParam(m.RS_to_R.gain, 0.6);
        this._setParam(m.LS_width_to_R.gain, 0);
        this._setParam(m.RS_width_to_L.gain, 0);
        this._setParam(m.LS_haas_to_R.gain, 0);
        this._setParam(m.RS_haas_to_L.gain, 0);
      } else if (isDialogue) {
        this._setParam(m.L_to_L.gain, 0.8);
        this._setParam(m.R_to_R.gain, 0.8);
        this._setParam(m.C_to_LR.gain, 0.6);
        this._setParam(m.LFE_to_LR.gain, 0.35);
        this._setParam(m.LS_to_L.gain, 0.55);
        this._setParam(m.RS_to_R.gain, 0.55);
        this._setParam(m.LS_width_to_R.gain, 0);
        this._setParam(m.RS_width_to_L.gain, 0);
        this._setParam(m.LS_haas_to_R.gain, 0);
        this._setParam(m.RS_haas_to_L.gain, 0);
      } else {
        // passthrough: clean unity stereo + standard ITU 5.1 folddown
        this._setParam(m.L_to_L.gain, 1);
        this._setParam(m.R_to_R.gain, 1);
        this._setParam(m.C_to_LR.gain, 0.7071);
        this._setParam(m.LFE_to_LR.gain, 0.5);
        this._setParam(m.LS_to_L.gain, 0.7071);
        this._setParam(m.RS_to_R.gain, 0.7071);
        this._setParam(m.LS_width_to_R.gain, 0);
        this._setParam(m.RS_width_to_L.gain, 0);
        this._setParam(m.LS_haas_to_R.gain, 0);
        this._setParam(m.RS_haas_to_L.gain, 0);
      }
    }

    if (n.mix6) {
      const m = n.mix6;
      this._setParam(m.L_direct.gain, 1);
      this._setParam(m.R_direct.gain, 1);
      this._setParam(m.C_direct.gain, 1);
      this._setParam(m.LFE_direct.gain, 1);
      this._setParam(m.LS_direct.gain, 1);
      this._setParam(m.RS_direct.gain, 1);
      this._setParam(m.LS_width_to_RS.gain, isAtmos ? -0.18 : 0);
      this._setParam(m.RS_width_to_LS.gain, isAtmos ? -0.18 : 0);
      this._setParam(m.LS_haas_to_RS.gain, isAtmos ? 0.2 : 0);
      this._setParam(m.RS_haas_to_LS.gain, isAtmos ? 0.2 : 0);
    }

    // Night Mode DRC toggle
    this._setParam(n.drcDryGain.gain, this._nightMode ? 0 : 1);
    this._setParam(n.drcWetGain.gain, this._nightMode ? 1.35 : 0);

    // Master output gain
    this._setParam(n.masterGainNode.gain, this.gains.masterGain);
  }
}

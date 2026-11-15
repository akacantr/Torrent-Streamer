import { SurroundAudioEngine } from './audio-engine.js';

const CHANNELS = ['L', 'C', 'R', 'LS', 'RS', 'LFE'];

const AUDIO_OUTPUT_CONFIG = {
  stereo: {
    audioMode: 'stereo',
    preset: 'stereo',
    label: 'Stereo (Doğal Çıkış)',
  },
  cinema51: {
    audioMode: 'surround51',
    preset: 'cinema51',
    label: '5.1 Sinema Ayrık (6 Kanal)',
  },
  atmos: {
    audioMode: 'surround51',
    preset: 'atmos',
    label: '5.1 Surround + Dolby Spatial',
  },
  passthrough: {
    audioMode: 'passthrough',
    preset: 'passthrough',
    label: 'Bitstream Passthrough (Donanım)',
  },
};

const el = {
  body: document.body,
  topChrome: document.getElementById('top-chrome'),
  inputSection: document.getElementById('torrent-input-section'),
  btnHeaderToggleInput: document.getElementById('btn-header-toggle-input'),
  magnetForm: document.getElementById('magnet-form'),
  magnetInput: /** @type {HTMLInputElement | null} */ (document.getElementById('magnet-input')),
  btnStartStream: document.getElementById('btn-start-stream'),
  dropzone: document.getElementById('torrent-dropzone'),
  torrentFileInput: /** @type {HTMLInputElement | null} */ (document.getElementById('torrent-file-input')),
  btnDemoSample: document.getElementById('btn-demo-sample'),
  btnIdleDemo: document.getElementById('btn-idle-demo'),
  btnOpenEmbed: document.getElementById('btn-open-embed'),
  btnEmbedCode: document.getElementById('btn-embed-code'),
  inputErrorBanner: document.getElementById('input-error-banner'),

  playerShell: document.getElementById('player-shell'),
  playerStage: document.getElementById('player-stage'),
  video: /** @type {HTMLVideoElement} */ (document.getElementById('cinema-video')),
  subtitleOverlay: document.getElementById('subtitle-overlay'),
  statsOverlay: document.getElementById('stats-overlay'),
  btnCloseStats: document.getElementById('btn-close-stats'),
  statsGrid: document.getElementById('stats-grid'),
  statSrcRes: document.getElementById('stat-src-res'),
  statDispRes: document.getElementById('stat-disp-res'),
  statFps: document.getElementById('stat-fps'),
  statDropped: document.getElementById('stat-dropped'),
  statVideo: document.getElementById('stat-video'),
  statAudio: document.getElementById('stat-audio'),
  statNetwork: document.getElementById('stat-network'),

  playerTitle: document.getElementById('player-title'),
  codecBadges: document.getElementById('codec-badges'),
  btnUnlockAudio: document.getElementById('btn-unlock-audio'),
  btnEmbedSourceToggle: document.getElementById('btn-embed-source-toggle'),
  embedQuickLoader: document.getElementById('embed-quick-loader'),
  embedMagnetForm: document.getElementById('embed-magnet-form'),
  embedMagnetInput: /** @type {HTMLInputElement | null} */ (document.getElementById('embed-magnet-input')),
  btnEmbedDemo: document.getElementById('btn-embed-demo'),
  btnToggleStudioTop: document.getElementById('btn-toggle-studio-top'),
  btnToggleFilesTop: document.getElementById('btn-toggle-files-top'),
  filesCountBadge: document.getElementById('files-count-badge'),

  filePickerOverlay: document.getElementById('file-picker-overlay'),
  filePickerList: document.getElementById('file-picker-list'),

  playerIdleState: document.getElementById('player-idle-state'),
  playerLoadingState: document.getElementById('player-loading-state'),
  playerLoadingText: document.getElementById('player-loading-text'),
  btnCenterPlay: document.getElementById('btn-center-play'),
  playerToast: document.getElementById('player-toast'),

  seekContainer: document.getElementById('seek-container'),
  pieceMapBar: document.getElementById('piece-map-bar'),
  bufferedBar: document.getElementById('buffered-bar'),
  playedBar: document.getElementById('played-bar'),
  seekThumb: document.getElementById('seek-thumb'),
  seekHoverTooltip: document.getElementById('seek-hover-tooltip'),

  btnPlayPause: document.getElementById('btn-play-pause'),
  iconPlay: document.getElementById('icon-play'),
  iconPause: document.getElementById('icon-pause'),
  btnSeekBack: document.getElementById('btn-seek-back'),
  btnSeekFwd: document.getElementById('btn-seek-fwd'),
  btnMute: document.getElementById('btn-mute'),
  iconVolOn: document.getElementById('icon-vol-on'),
  iconVolOff: document.getElementById('icon-vol-off'),
  volumeSlider: /** @type {HTMLInputElement | null} */ (document.getElementById('volume-slider')),
  timeDisplay: document.getElementById('time-display'),
  speedSelect: /** @type {HTMLSelectElement | null} */ (document.getElementById('speed-select')),

  btnAudioTracks: document.getElementById('btn-audio-tracks'),
  audioTrackMenu: document.getElementById('audio-track-menu'),
  audioTrackMenuList: document.getElementById('audio-track-menu-list'),
  btnSubtitles: document.getElementById('btn-subtitles'),
  subBadgeDot: document.getElementById('sub-badge-dot'),
  subtitleMenu: document.getElementById('subtitle-menu'),
  subtitleMenuList: document.getElementById('subtitle-menu-list'),
  btnMenuUploadSub: document.getElementById('btn-menu-upload-sub'),
  btnStats: document.getElementById('btn-stats'),
  btnToggleStudio: document.getElementById('btn-toggle-studio'),
  btnToggleFiles: document.getElementById('btn-toggle-files'),
  btnPip: document.getElementById('btn-pip'),
  btnFullscreen: document.getElementById('btn-fullscreen'),
  iconFsEnter: document.getElementById('icon-fs-enter'),
  iconFsExit: document.getElementById('icon-fs-exit'),

  cinemaDrawer: document.getElementById('cinema-drawer'),
  tabBtnStudio: document.getElementById('tab-btn-studio'),
  tabBtnFiles: document.getElementById('tab-btn-files'),
  btnCloseDrawer: document.getElementById('btn-close-drawer'),
  tabStudio: document.getElementById('tab-studio'),
  tabFiles: document.getElementById('tab-files'),

  sectionDetectedTech: document.getElementById('section-detected-tech'),
  detectedTechPills: document.getElementById('detected-tech-pills'),
  streamModePill: document.getElementById('stream-mode-pill'),

  sectionVideoHdr: document.getElementById('section-video-hdr'),
  hdrStatusBadge: document.getElementById('hdr-status-badge'),
  videoTechSummary: document.getElementById('video-tech-summary'),
  hdrTonemapPanel: document.getElementById('hdr-tonemap-panel'),
  sliderVidBrightness: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-vid-brightness')),
  sliderVidContrast: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-vid-contrast')),
  sliderVidSaturation: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-vid-saturation')),
  valVidBrightness: document.getElementById('val-vid-brightness'),
  valVidContrast: document.getElementById('val-vid-contrast'),
  valVidSaturation: document.getElementById('val-vid-saturation'),
  btnResetVideoFilters: document.getElementById('btn-reset-video-filters'),
  videoModeSelect: /** @type {HTMLSelectElement | null} */ (document.getElementById('video-mode-select')),

  sectionAudio: document.getElementById('section-audio'),
  audioTrackSelect: /** @type {HTMLSelectElement | null} */ (document.getElementById('audio-track-select')),
  audioOutputMode: /** @type {HTMLSelectElement | null} */ (document.getElementById('audio-output-mode')),
  audioCapabilitiesInfo: document.getElementById('audio-capabilities-info'),
  stereoControlsCard: document.getElementById('stereo-controls-card'),
  toggleVirtualUpmix: /** @type {HTMLInputElement | null} */ (document.getElementById('toggle-virtual-upmix')),
  surroundVisualizerCard: document.getElementById('surround-visualizer-card'),
  surroundOnlySliders: document.getElementById('surround-only-sliders'),
  speakerStage: document.getElementById('speaker-stage'),
  presetChips: Array.from(document.querySelectorAll('.preset-chip')),
  sliderCenterDb: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-center-db')),
  sliderLfeDb: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-lfe-db')),
  sliderSurroundDb: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-surround-db')),
  sliderMasterGain: /** @type {HTMLInputElement | null} */ (document.getElementById('slider-master-gain')),
  valCenterDb: document.getElementById('val-center-db'),
  valLfeDb: document.getElementById('val-lfe-db'),
  valSurroundDb: document.getElementById('val-surround-db'),
  valMasterGain: document.getElementById('val-master-gain'),
  toggleNightMode: /** @type {HTMLInputElement | null} */ (document.getElementById('toggle-night-mode')),
  btnResetGains: document.getElementById('btn-reset-gains'),

  subtitleDrawerList: document.getElementById('subtitle-drawer-list'),
  activeSubtitleStatus: document.getElementById('active-subtitle-status'),
  subtitleFileInput: /** @type {HTMLInputElement | null} */ (document.getElementById('subtitle-file-input')),
  btnUploadSubtitle: document.getElementById('btn-upload-subtitle'),
  torrentFilesList: document.getElementById('torrent-files-list'),
  drawerFilesSummary: document.getElementById('drawer-files-summary'),

  telStatusDot: document.getElementById('tel-status-dot'),
  telName: document.getElementById('tel-name'),
  telInfohash: document.getElementById('tel-infohash'),
  telDownSpeed: document.getElementById('tel-down-speed'),
  telUpSpeed: document.getElementById('tel-up-speed'),
  telPeers: document.getElementById('tel-peers'),
  telProgress: document.getElementById('tel-progress'),
  telEta: document.getElementById('tel-eta'),
  btnSaveVideo: /** @type {HTMLButtonElement | null} */ (document.getElementById('btn-save-video')),

  embedModal: document.getElementById('embed-modal'),
  btnCloseEmbed: document.getElementById('btn-close-embed'),
  btnCloseEmbedFooter: document.getElementById('btn-close-embed-footer'),
  embedIncludeMagnet: /** @type {HTMLInputElement | null} */ (document.getElementById('embed-include-magnet')),
  embedMagnetField: /** @type {HTMLInputElement | null} */ (document.getElementById('embed-magnet-field')),
  embedHeightInput: /** @type {HTMLInputElement | null} */ (document.getElementById('embed-height-input')),
  embedCodeOutput: /** @type {HTMLTextAreaElement | null} */ (document.getElementById('embed-code-output')),
  btnCopyEmbed: document.getElementById('btn-copy-embed'),
  embedCopyFeedback: document.getElementById('embed-copy-feedback'),
};

const audioEngine = new SurroundAudioEngine();

const vuEls = {};
const speakerEls = {};
for (const ch of CHANNELS) {
  vuEls[ch] = {
    fill: document.getElementById(`vu-fill-${ch}`),
    val: document.getElementById(`vu-val-${ch}`),
  };
  speakerEls[ch] = document.querySelector(`.spk-node[data-ch="${ch}"]`);
}

const state = {
  infoHash: null,
  torrentName: '',
  magnetUri: '',
  files: [],
  statusFiles: [],
  activeFileIndex: null,
  selectedFileProgress: 0,
  selectedFileDone: false,
  lastTelemetry: null,
  probeData: null,

  streamMode: 'remux', // 'direct' | 'remux'
  videoMode: 'copy', // 'copy' | 'transcode'
  audioOutputKey: 'stereo', // 'stereo' | 'cinema51' | 'atmos' | 'passthrough'
  audioMode: 'stereo', // 'stereo' | 'surround51' | 'passthrough'
  audioPreset: 'stereo', // 'stereo' | 'atmos' | 'cinema51' | 'dialogue' | 'passthrough'
  audioTrack: 0,
  virtualUpmix: false,

  streamStartOffset: 0,
  totalDuration: 0,
  isDraggingSeek: false,
  dragRatio: 0,
  wantsPlay: false,
  autoRetryCount: 0,

  pieceMap: new Array(100).fill(0),
  pieceSegments: [],

  subtitles: {
    activeId: 'off',
    cues: [],
    preparedTracks: [], // returned from /subtitles/prepare/:fileIndex
    localTracks: [], // { id, label, blobUrl, cues }
    trackEl: null,
  },

  statsOpen: false,
  statsTimer: null,
  fps: {
    frameTimes: [],
    lastTotalFrames: 0,
    lastSampleMs: 0,
    measuredFps: 0,
  },

  loadSeq: 0,
  statusPollTimer: null,
  toastTimer: null,
  controlsHideTimer: null,
  drawerOpen: false, // Closed by default
  activeTab: 'studio',
  isEmbed: false,
  requestedFileIndex: null,
};

// ============================================================================
// Formatting & Utilities
// ============================================================================

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / 1024 ** i;
  return `${val >= 100 || i === 0 ? val.toFixed(0) : val.toFixed(1)} ${units[i]}`;
}

function formatSpeed(bytesPerSec) {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 KB/s';
  if (bytesPerSec < 1024 * 1024) {
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  }
  return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
}

function formatBitrate(bps) {
  if (!Number.isFinite(bps) || bps <= 0) return '--';
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  return `${Math.round(bps / 1000)} kbps`;
}

function formatEta(ms, progress) {
  if (progress >= 0.999) return 'Tamamlandı';
  if (!Number.isFinite(ms) || ms <= 0 || ms > 86400000 * 30) return '--';
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec < 60) return `${totalSec} sn`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins < 60) return `${mins} dk ${secs} sn`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} sa ${mins % 60} dk`;
}

function formatDb(val) {
  const num = Number(val) || 0;
  return `${num > 0 ? '+' : ''}${num.toFixed(1)} dB`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function showInputError(msg) {
  if (!el.inputErrorBanner) return;
  if (!msg) {
    el.inputErrorBanner.textContent = '';
    el.inputErrorBanner.classList.add('hidden');
    return;
  }
  el.inputErrorBanner.textContent = msg;
  el.inputErrorBanner.classList.remove('hidden');
}

function showToast(msg, durationMs = 3600) {
  if (!el.playerToast) return;
  el.playerToast.textContent = msg;
  el.playerToast.classList.remove('hidden');
  if (state.toastTimer !== null) {
    clearTimeout(state.toastTimer);
  }
  state.toastTimer = setTimeout(() => {
    el.playerToast?.classList.add('hidden');
  }, durationMs);
}

function setLoading(isLoading, text = 'Yükleniyor...') {
  if (!el.playerLoadingState || !el.playerLoadingText) return;
  if (isLoading) {
    el.playerIdleState?.classList.add('hidden');
    el.btnCenterPlay?.classList.add('hidden');
    el.playerLoadingText.textContent = text;
    el.playerLoadingState.classList.remove('hidden');
  } else {
    el.playerLoadingState.classList.add('hidden');
  }
}

// ============================================================================
// Piece Map & Dual Progress Seek Bar
// ============================================================================

function initPieceMapSegments() {
  if (!el.pieceMapBar) return;
  el.pieceMapBar.innerHTML = '';
  state.pieceSegments = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 100; i++) {
    const seg = document.createElement('span');
    seg.className = 'piece-seg';
    frag.appendChild(seg);
    state.pieceSegments.push(seg);
  }
  el.pieceMapBar.appendChild(frag);
}

function renderPieceMap(pieceMap) {
  if (!Array.isArray(pieceMap) || state.pieceSegments.length !== 100) return;
  state.pieceMap = pieceMap;
  for (let i = 0; i < 100; i++) {
    const val = pieceMap[i] ?? 0;
    const seg = state.pieceSegments[i];
    if (!seg) continue;
    seg.className =
      val === 2 ? 'piece-seg piece-done' : val === 1 ? 'piece-seg piece-active' : 'piece-seg';
  }
}

function getEffectiveDuration() {
  if (state.streamMode === 'direct') {
    const vDur = el.video.duration;
    if (Number.isFinite(vDur) && vDur > 0) return vDur;
  }
  if (Number.isFinite(state.totalDuration) && state.totalDuration > 0) {
    return state.totalDuration;
  }
  const vDur = el.video.duration;
  return Number.isFinite(vDur) && vDur > 0 ? vDur : 0;
}

function getCurrentPlaybackTime() {
  const vTime = Number.isFinite(el.video.currentTime) ? el.video.currentTime : 0;
  if (state.streamMode === 'remux') {
    return state.streamStartOffset + vTime;
  }
  return vTime;
}

function getBufferedAheadSeconds() {
  if (!el.video.buffered || el.video.buffered.length === 0) return 0;
  const rawPos = Number.isFinite(el.video.currentTime) ? el.video.currentTime : 0;
  for (let i = 0; i < el.video.buffered.length; i++) {
    const start = el.video.buffered.start(i);
    const end = el.video.buffered.end(i);
    if (rawPos >= start - 0.5 && rawPos <= end) {
      return Math.max(0, end - rawPos);
    }
  }
  try {
    return Math.max(0, el.video.buffered.end(el.video.buffered.length - 1) - rawPos);
  } catch (_) {
    return 0;
  }
}

function updateTimeAndSeekUi(overrideTime = null) {
  const duration = getEffectiveDuration();
  const current = overrideTime !== null ? overrideTime : getCurrentPlaybackTime();

  if (el.timeDisplay) {
    el.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }

  const ratio = duration > 0 ? Math.max(0, Math.min(1, current / duration)) : 0;
  const pct = (state.isDraggingSeek ? state.dragRatio : ratio) * 100;

  if (el.playedBar) el.playedBar.style.width = `${pct}%`;
  if (el.seekThumb) el.seekThumb.style.left = `${pct}%`;
  if (el.seekContainer) el.seekContainer.setAttribute('aria-valuenow', String(Math.round(pct)));

  if (el.bufferedBar && duration > 0 && el.video.buffered.length > 0) {
    try {
      const bufEnd = el.video.buffered.end(el.video.buffered.length - 1);
      const effectiveBufEnd =
        state.streamMode === 'remux' ? state.streamStartOffset + bufEnd : bufEnd;
      const bufPct = Math.max(0, Math.min(100, (effectiveBufEnd / duration) * 100));
      el.bufferedBar.style.width = `${bufPct}%`;
    } catch (_) {
      // Ignore transient buffered errors
    }
  } else if (el.bufferedBar) {
    el.bufferedBar.style.width = '0%';
  }

  renderActiveSubtitleCue(current);
}

// ============================================================================
// Web Audio Engine Integration & Real-Time VU / Speaker Visualizer
// ============================================================================

function ensureAudioAttached() {
  try {
    audioEngine.attach(el.video);
    applyEngineSettings();
    updateAudioCapabilitiesUi();
  } catch (err) {
    console.warn('Audio engine attach failed:', err);
  }
}

async function resumeAudioSafely() {
  ensureAudioAttached();
  const st = await audioEngine.resume();
  updateAudioCapabilitiesUi();
  if (st === 'running') {
    el.btnUnlockAudio?.classList.add('hidden');
  }
}

function applyEngineSettings() {
  audioEngine.setPreset(state.audioPreset);
  audioEngine.setGains({
    centerDb: Number(el.sliderCenterDb?.value ?? 0),
    lfeDb: Number(el.sliderLfeDb?.value ?? 0),
    surroundDb: Number(el.sliderSurroundDb?.value ?? 0),
    masterGain: Number(el.sliderMasterGain?.value ?? 1),
  });
  audioEngine.setNightMode(Boolean(el.toggleNightMode?.checked));

  if (el.speakerStage) {
    el.speakerStage.setAttribute('data-preset', state.audioPreset);
  }

  for (const chip of el.presetChips) {
    const p = chip.getAttribute('data-preset');
    chip.classList.toggle('active', p === state.audioPreset);
  }
}

function updateAudioCapabilitiesUi() {
  const caps = audioEngine.getCapabilities();
  if (el.audioCapabilitiesInfo) {
    if (caps.state === 'uninitialized') {
      el.audioCapabilitiesInfo.textContent = 'Web Audio Bekleniyor';
    } else {
      const khz = caps.sampleRate ? `${(caps.sampleRate / 1000).toFixed(1)} kHz` : '';
      const stateTxt = caps.state === 'running' ? 'Aktif' : 'Askıda';
      el.audioCapabilitiesInfo.textContent = `${caps.maxHardwareChannels} Kanal · ${khz} · ${stateTxt}`;
    }
  }

  if (el.btnUnlockAudio) {
    const shouldPromptUnlock =
      caps.state === 'suspended' && !el.video.paused && !el.video.muted && Boolean(el.video.src);
    el.btnUnlockAudio.classList.toggle('hidden', !shouldPromptUnlock);
  }
}

function startVisualizerLoop() {
  const tick = () => {
    if (
      state.drawerOpen &&
      state.activeTab === 'studio' &&
      !el.surroundVisualizerCard?.classList.contains('hidden')
    ) {
      const levels = audioEngine.getChannelLevels();
      for (const ch of CHANNELS) {
        const val = Number.isFinite(levels[ch]) ? levels[ch] : 0;
        const meter = vuEls[ch];
        if (meter?.fill) {
          meter.fill.style.height = `${Math.max(2, val)}%`;
        }
        if (meter?.val) {
          meter.val.textContent = String(Math.round(val));
        }
        const spk = speakerEls[ch];
        if (spk instanceof HTMLElement) {
          spk.style.setProperty('--lvl', (val / 100).toFixed(3));
        }
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ============================================================================
// Video CSS Filters (HDR Tonemap / Brightness / Contrast / Saturation)
// ============================================================================

function applyVideoCssFilters() {
  const b = Number(el.sliderVidBrightness?.value ?? 1);
  const c = Number(el.sliderVidContrast?.value ?? 1);
  const s = Number(el.sliderVidSaturation?.value ?? 1);
  el.video.style.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
  if (el.valVidBrightness) el.valVidBrightness.textContent = `${Math.round(b * 100)}%`;
  if (el.valVidContrast) el.valVidContrast.textContent = `${Math.round(c * 100)}%`;
  if (el.valVidSaturation) el.valVidSaturation.textContent = `${Math.round(s * 100)}%`;
}

function resetVideoCssFilters() {
  if (el.sliderVidBrightness) el.sliderVidBrightness.value = '1';
  if (el.sliderVidContrast) el.sliderVidContrast.value = '1';
  if (el.sliderVidSaturation) el.sliderVidSaturation.value = '1';
  applyVideoCssFilters();
}

// ============================================================================
// Torrent Management, Selective File Picker & 1-Click Download
// ============================================================================

async function addTorrent(payload) {
  const seq = ++state.loadSeq;
  showInputError('');
  hideFilePickerOverlay();
  setLoading(true, 'Torrent meta verisi alınıyor...');
  resetPlayerForNewSource();

  try {
    const res = await fetch('/api/torrent/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Sunucu hatası (${res.status})`);
    }
    if (seq !== state.loadSeq) return;

    if (payload.magnet) {
      state.magnetUri = payload.magnet;
      if (el.magnetInput) el.magnetInput.value = payload.magnet;
    } else {
      state.magnetUri = `magnet:?xt=urn:btih:${data.infoHash}&dn=${encodeURIComponent(data.name || 'stream')}`;
    }

    await onTorrentLoaded(data, seq);
  } catch (err) {
    if (seq !== state.loadSeq) return;
    setLoading(false);
    el.playerIdleState?.classList.remove('hidden');
    const msg = err instanceof Error ? err.message : 'Torrent eklenirken hata oluştu.';
    showInputError(msg);
    showToast(msg, 5000);
  }
}

async function startDemoSample() {
  const seq = ++state.loadSeq;
  showInputError('');
  hideFilePickerOverlay();
  setLoading(true, 'Demo video (5.1 + Stereo + Çoklu Altyazı) hazırlanıyor...');
  resetPlayerForNewSource();

  try {
    const res = await fetch('/api/demo/sample', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Demo akışı başlatılamadı (${res.status})`);
    }
    if (seq !== state.loadSeq) return;

    state.magnetUri = `magnet:?xt=urn:btih:${data.infoHash}&dn=${encodeURIComponent(data.name || 'demo-video')}`;
    await onTorrentLoaded(data, seq);
    showToast('Demo video yüklendi');
  } catch (err) {
    if (seq !== state.loadSeq) return;
    setLoading(false);
    el.playerIdleState?.classList.remove('hidden');
    const msg = err instanceof Error ? err.message : 'Demo yüklenirken hata oluştu.';
    showInputError(msg);
    showToast(msg, 5000);
  }
}

function resetPlayerForNewSource() {
  stopStatusPolling();
  el.video.pause();
  el.video.removeAttribute('src');
  el.video.load();
  state.probeData = null;
  state.activeFileIndex = null;
  state.selectedFileProgress = 0;
  state.selectedFileDone = false;
  state.streamStartOffset = 0;
  state.totalDuration = 0;
  state.audioTrack = 0;
  state.videoMode = 'copy';
  state.virtualUpmix = false;
  state.subtitles.activeId = 'off';
  state.subtitles.cues = [];
  state.subtitles.preparedTracks = [];
  detachVideoTrackElement();
  if (el.subtitleOverlay) el.subtitleOverlay.innerHTML = '';
  if (el.videoModeSelect) el.videoModeSelect.value = 'copy';
  renderPieceMap(new Array(100).fill(0));
  updateTimeAndSeekUi(0);
  renderCodecBadges();
  renderDetectedTechnologies();
  renderVideoHdrPanel();
  updateSaveVideoButton();
}

async function onTorrentLoaded(data, seq) {
  state.infoHash = data.infoHash;
  state.torrentName = data.name || data.infoHash;
  state.files = Array.isArray(data.files) ? data.files : [];
  state.statusFiles = [];

  if (el.telName) el.telName.textContent = state.torrentName;
  if (el.telInfohash) el.telInfohash.textContent = `infoHash: ${data.infoHash}`;
  if (el.filesCountBadge) el.filesCountBadge.textContent = String(state.files.length);
  if (el.drawerFilesSummary) el.drawerFilesSummary.textContent = `${state.files.length} dosya`;

  renderFilesList();
  startStatusPolling();
  updateEmbedCodePreview();

  const videoFiles = state.files.filter((f) => f.isVideo);
  const videoCount =
    typeof data.videoFileCount === 'number' ? data.videoFileCount : videoFiles.length;

  // Check explicit ?file= query parameter first
  if (
    state.requestedFileIndex !== null &&
    state.files.some((f) => f.index === state.requestedFileIndex)
  ) {
    const requestedIdx = state.requestedFileIndex;
    state.requestedFileIndex = null;
    await selectAndPlayFile(requestedIdx, seq);
    return;
  }

  // Selective File Picker: when multiple video files exist and backend hasn't selected one
  if (
    videoCount > 1 &&
    (data.selectedFileIndex === null || data.selectedFileIndex === undefined)
  ) {
    setLoading(false);
    el.playerIdleState?.classList.add('hidden');
    if (el.playerTitle) {
      el.playerTitle.textContent = `${state.torrentName} — Dosya Seçimi Bekleniyor`;
    }
    showFilePickerOverlay(videoFiles);
    return;
  }

  const targetFileIndex =
    typeof data.selectedFileIndex === 'number'
      ? data.selectedFileIndex
      : typeof data.mainVideoIndex === 'number'
        ? data.mainVideoIndex
        : videoFiles[0]?.index ?? 0;

  await selectAndPlayFile(targetFileIndex, seq);
}

function showFilePickerOverlay(videoFiles) {
  if (!el.filePickerOverlay || !el.filePickerList) return;
  el.filePickerList.innerHTML = '';

  const list = videoFiles.length > 0 ? videoFiles : state.files;
  for (const f of list) {
    const row = document.createElement('div');
    row.className = 'file-picker-row';

    const info = document.createElement('div');
    info.className = 'file-picker-info';

    const nameEl = document.createElement('span');
    nameEl.className = 'file-picker-name';
    nameEl.textContent = f.name;

    const metaEl = document.createElement('span');
    metaEl.className = 'file-picker-meta';
    metaEl.textContent = `${formatBytes(f.length)}${f.path && f.path !== f.name ? ` · ${f.path}` : ''}`;

    info.appendChild(nameEl);
    info.appendChild(metaEl);

    const pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.className = 'btn btn-primary btn-sm';
    pickBtn.textContent = '▶ Seç ve İzle';
    pickBtn.addEventListener('click', () => {
      void resumeAudioSafely();
      void selectAndPlayFile(f.index, ++state.loadSeq);
    });

    row.appendChild(info);
    row.appendChild(pickBtn);
    el.filePickerList.appendChild(row);
  }

  el.filePickerOverlay.classList.remove('hidden');
}

function hideFilePickerOverlay() {
  el.filePickerOverlay?.classList.add('hidden');
}

function startStatusPolling() {
  stopStatusPolling();
  const poll = async () => {
    const hash = state.infoHash;
    if (!hash) return;
    try {
      const qs = state.activeFileIndex !== null ? `?fileIndex=${state.activeFileIndex}` : '';
      const res = await fetch(`/api/torrent/${encodeURIComponent(hash)}/status${qs}`);
      if (res.ok && state.infoHash === hash) {
        const st = await res.json();
        updateTelemetry(st);
      }
    } catch (_) {
      // Transient polling errors are safe to ignore
    }
    if (state.infoHash === hash) {
      state.statusPollTimer = setTimeout(poll, 1000);
    }
  };
  void poll();
}

function stopStatusPolling() {
  if (state.statusPollTimer !== null) {
    clearTimeout(state.statusPollTimer);
    state.statusPollTimer = null;
  }
}

function updateTelemetry(st) {
  if (!st) return;
  state.lastTelemetry = st;

  if (st.name && el.telName) {
    state.torrentName = st.name;
    el.telName.textContent = st.name;
  }
  if (Array.isArray(st.pieceMap) && st.pieceMap.length === 100) {
    renderPieceMap(st.pieceMap);
  }
  if (Array.isArray(st.files)) {
    state.statusFiles = st.files;
    renderFilesList();
  }

  // Track active/selected file progress
  const activeSf =
    state.activeFileIndex !== null
      ? state.statusFiles.find((f) => f.index === state.activeFileIndex)
      : null;

  if (state.activeFileIndex !== null) {
    const selProg =
      typeof st.selectedFileProgress === 'number'
        ? st.selectedFileProgress
        : activeSf?.progress ?? 0;
    const selDone =
      typeof st.selectedFileDone === 'boolean' ? st.selectedFileDone : selProg >= 0.999;

    state.selectedFileProgress = Math.max(0, Math.min(1, selProg));
    state.selectedFileDone = selDone;
  } else {
    state.selectedFileProgress = 0;
    state.selectedFileDone = false;
  }

  const displayProgress =
    state.activeFileIndex !== null
      ? state.selectedFileProgress
      : Math.max(0, Math.min(1, st.progress || 0));
  const pct = displayProgress * 100;

  if (el.telDownSpeed) el.telDownSpeed.textContent = formatSpeed(st.downloadSpeed || 0);
  if (el.telUpSpeed) el.telUpSpeed.textContent = formatSpeed(st.uploadSpeed || 0);
  if (el.telPeers) el.telPeers.textContent = String(st.numPeers ?? 0);
  if (el.telProgress) {
    el.telProgress.textContent =
      state.activeFileIndex === null && state.files.some((f) => f.isVideo)
        ? 'Seçim Bekleniyor'
        : `${pct.toFixed(1)}%`;
  }
  if (el.telEta) el.telEta.textContent = formatEta(st.timeRemaining, displayProgress);

  if (el.telStatusDot) {
    el.telStatusDot.className =
      pct >= 99.9 ? 'status-dot ready' : st.ready ? 'status-dot downloading' : 'status-dot idle';
  }

  updateSaveVideoButton();
}

function updateSaveVideoButton() {
  const btn = el.btnSaveVideo;
  if (!btn) return;

  if (!state.infoHash || state.activeFileIndex === null) {
    btn.disabled = true;
    btn.classList.remove('ready');
    btn.textContent = '⏳ Dosya Bekleniyor';
    return;
  }

  if (state.selectedFileDone || state.selectedFileProgress >= 0.999) {
    btn.disabled = false;
    btn.classList.add('ready');
    btn.textContent = '⬇ Videoyu Kaydet (Tamamlandı)';
  } else {
    btn.disabled = true;
    btn.classList.remove('ready');
    const pct = (state.selectedFileProgress * 100).toFixed(1);
    btn.textContent = `⏳ Dosya İniyor (%${pct})`;
  }
}

function triggerSelectedVideoDownload() {
  if (!state.infoHash || state.activeFileIndex === null) return;
  if (!state.selectedFileDone && state.selectedFileProgress < 0.999) {
    showToast('Dosya indirmesi henüz tamamlanmadı.');
    return;
  }
  const url = `/api/download/${encodeURIComponent(state.infoHash)}/${state.activeFileIndex}`;
  const fileObj = state.files.find((f) => f.index === state.activeFileIndex);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileObj?.name || 'video';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// ============================================================================
// Probe-First Selection, Pre-Loaded Subtitles & Adaptive Audio/HDR Controls
// ============================================================================

async function selectAndPlayFile(fileIndex, expectedSeq = state.loadSeq) {
  if (!state.infoHash) return;
  hideFilePickerOverlay();

  state.activeFileIndex = fileIndex;
  state.selectedFileProgress = 0;
  state.selectedFileDone = false;
  state.streamStartOffset = 0;
  state.audioTrack = 0;
  state.videoMode = 'copy';
  state.autoRetryCount = 0;
  state.virtualUpmix = false;
  if (el.toggleVirtualUpmix) el.toggleVirtualUpmix.checked = false;
  if (el.videoModeSelect) el.videoModeSelect.value = 'copy';
  updateSaveVideoButton();

  const fileObj = state.files.find((f) => f.index === fileIndex);
  if (el.playerTitle) {
    el.playerTitle.textContent = fileObj?.name || state.torrentName || 'Video Akışı';
  }
  renderFilesList();

  // 1) Selective download: lock torrent piece priorities to ONLY this file (+ subtitles)
  setLoading(true, 'Seçili dosya indirime hazırlanıyor...');
  try {
    await fetch(
      `/api/torrent/${encodeURIComponent(state.infoHash)}/select/${fileIndex}`,
      { method: 'POST' },
    );
  } catch (_) {
    // Proceed even if select endpoint hits transient error
  }
  if (expectedSeq !== state.loadSeq) return;
  startStatusPolling();

  // 2) Probe-first: inspect video, HDR, audio tracks, and technologies
  setLoading(true, 'Medya teknolojileri analiz ediliyor (FFprobe)...');
  let probe = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (expectedSeq !== state.loadSeq) return;
    try {
      const res = await fetch(
        `/api/torrent/${encodeURIComponent(state.infoHash)}/probe/${fileIndex}`,
      );
      if (res.ok) {
        probe = await res.json();
        break;
      }
    } catch (_) {
      // Retry briefly while initial metadata pieces arrive
    }
    await new Promise((r) => setTimeout(r, 900));
  }
  if (expectedSeq !== state.loadSeq) return;

  state.probeData = probe;
  state.totalDuration = Number(probe?.duration) > 0 ? Number(probe.duration) : 0;

  populateAudioTracksUi();
  adaptControlsToAudioTrack({ autoSelectMode: true });
  renderDetectedTechnologies();
  renderVideoHdrPanel();

  // 3) Pre-load & prepare subtitles in background so video playback starts immediately
  void prepareSubtitlesBeforePlayback(fileIndex, expectedSeq);
  if (expectedSeq !== state.loadSeq) return;

  // 4) Determine direct vs remux & start playback
  state.streamMode = shouldUseDirectStream() ? 'direct' : 'remux';
  renderCodecBadges();

  await loadPlaybackSource(0, true);
}

async function prepareSubtitlesBeforePlayback(fileIndex, expectedSeq) {
  if (!state.infoHash) return;
  state.subtitles.preparedTracks = [];
  state.subtitles.activeId = 'off';
  state.subtitles.cues = [];
  detachVideoTrackElement();
  if (el.subtitleOverlay) el.subtitleOverlay.innerHTML = '';

  try {
    const res = await fetch(
      `/api/torrent/${encodeURIComponent(state.infoHash)}/subtitles/prepare/${fileIndex}`,
    );
    if (!res.ok || expectedSeq !== state.loadSeq) {
      populateSubtitlesList();
      return;
    }
    const data = await res.json();
    if (expectedSeq !== state.loadSeq) return;

    const rawSubs = Array.isArray(data?.subtitles) ? data.subtitles : [];
    const prepared = [];

    for (const sub of rawSubs) {
      let vttText = typeof sub.vttContent === 'string' ? sub.vttContent : '';
      if (!vttText && sub.ready && sub.vttUrl) {
        try {
          const vRes = await fetch(sub.vttUrl);
          if (vRes.ok) vttText = await vRes.text();
        } catch (_) {
          // Ignore single subtitle fetch errors
        }
      }
      if (expectedSeq !== state.loadSeq) return;

      const cues = vttText ? parseWebVtt(vttText) : [];
      let blobUrl = sub.vttUrl || '';
      if (vttText) {
        const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
        blobUrl = URL.createObjectURL(blob);
      }

      prepared.push({
        ...sub,
        cues,
        blobUrl,
        isReady: Boolean(sub.ready || cues.length > 0),
      });
    }

    state.subtitles.preparedTracks = prepared;

    // Auto-select Turkish (tur/tr) if ready, otherwise the first ready track
    const isTurkish = (s) => {
      const lang = (s.language || '').toLowerCase();
      const title = (s.title || '').toLowerCase();
      return lang === 'tur' || lang === 'tr' || title.includes('türk') || title.includes('turk');
    };

    const preferred =
      prepared.find((s) => s.isReady && isTurkish(s)) || prepared.find((s) => s.isReady);

    if (preferred) {
      state.subtitles.activeId = preferred.id;
      state.subtitles.cues = preferred.cues;
      if (preferred.blobUrl) {
        attachVideoTrackElement(preferred.blobUrl, preferred.label || 'Altyazı');
      }
      renderActiveSubtitleCue(0);
    }
  } catch (_) {
    // Keep going even if subtitle preparation failed
  }

  populateSubtitlesList();
}

function getSelectedAudioTrack() {
  const tracks = state.probeData?.audio;
  if (!Array.isArray(tracks) || tracks.length === 0) return null;
  return (
    tracks.find((t) => Number(t.audioOrder) === Number(state.audioTrack)) || tracks[0] || null
  );
}

function adaptControlsToAudioTrack({ autoSelectMode = false } = {}) {
  const track = getSelectedAudioTrack();
  const channels = Number(track?.channels) || 2;
  const isSurroundTrack = Boolean(
    track && (channels >= 6 || track.isSurround51 || track.isAtmos),
  );
  const isAtmosTrack = Boolean(track?.isAtmos);

  if (typeof audioEngine.setSourceChannels === 'function') {
    audioEngine.setSourceChannels(channels);
  }

  if (autoSelectMode) {
    state.virtualUpmix = false;
    if (el.toggleVirtualUpmix) el.toggleVirtualUpmix.checked = false;

    if (!isSurroundTrack) {
      state.audioOutputKey = 'stereo';
      state.audioMode = 'stereo';
      state.audioPreset = 'stereo';
    } else if (isAtmosTrack) {
      state.audioOutputKey = 'atmos';
      state.audioMode = 'surround51';
      state.audioPreset = 'atmos';
    } else {
      state.audioOutputKey = 'cinema51';
      state.audioMode = 'surround51';
      state.audioPreset = 'cinema51';
    }

    if (el.audioOutputMode) {
      el.audioOutputMode.value = state.audioOutputKey;
    }
  }

  const showSurroundUi = isSurroundTrack || state.virtualUpmix;
  el.stereoControlsCard?.classList.toggle('hidden', isSurroundTrack);
  el.surroundVisualizerCard?.classList.toggle('hidden', !showSurroundUi);
  el.surroundOnlySliders?.classList.toggle('hidden', !showSurroundUi);

  applyEngineSettings();
}

function populateAudioTracksUi() {
  const tracks = state.probeData?.audio || [];

  // Drawer select
  if (el.audioTrackSelect) {
    el.audioTrackSelect.innerHTML = '';
    if (tracks.length === 0) {
      const opt = document.createElement('option');
      opt.value = '0';
      opt.textContent = 'Varsayılan Akış';
      el.audioTrackSelect.appendChild(opt);
    } else {
      tracks.forEach((track, i) => {
        const opt = document.createElement('option');
        const order = track.audioOrder ?? i;
        opt.value = String(order);
        const chLabel = track.channels >= 6 ? '5.1' : `${track.channels || 2}ch`;
        const lang = track.language ? track.language.toUpperCase() : 'UND';
        const codec = (track.codec || 'AUDIO').toUpperCase();
        opt.textContent = track.label || `#${order + 1} · ${lang} · ${codec} (${chLabel})`;
        el.audioTrackSelect?.appendChild(opt);
      });
    }
    el.audioTrackSelect.value = String(state.audioTrack);
  }

  // Bottom bar quick popup menu (#audio-track-menu-list)
  if (el.audioTrackMenuList) {
    el.audioTrackMenuList.innerHTML = '';
    if (tracks.length === 0) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-item active';
      btn.textContent = 'Varsayılan Akış';
      el.audioTrackMenuList.appendChild(btn);
    } else {
      tracks.forEach((track, i) => {
        const order = Number(track.audioOrder ?? i);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `sub-item ${Number(state.audioTrack) === order ? 'active' : ''}`;
        const chLabel = track.channels >= 6 ? '5.1' : `${track.channels || 2}ch`;
        const lang = track.language ? track.language.toUpperCase() : 'UND';
        const codec = (track.codec || 'AUDIO').toUpperCase();
        const label = track.label || `#${order + 1} · ${lang} · ${codec} (${chLabel})`;
        btn.textContent = `${Number(state.audioTrack) === order ? '✓ ' : ''}${label}`;
        btn.addEventListener('click', () => {
          el.audioTrackMenu?.classList.add('hidden');
          selectAudioTrack(order);
        });
        el.audioTrackMenuList?.appendChild(btn);
      });
    }
  }
}

function selectAudioTrack(trackOrder) {
  if (Number(state.audioTrack) === Number(trackOrder)) return;
  state.audioTrack = Number(trackOrder) || 0;
  if (el.audioTrackSelect) el.audioTrackSelect.value = String(state.audioTrack);
  populateAudioTracksUi();
  adaptControlsToAudioTrack({ autoSelectMode: true });
  renderCodecBadges();

  const track = getSelectedAudioTrack();
  if (track) {
    showToast(`Ses İzi: ${track.label || `#${state.audioTrack + 1}`}`);
  }
  if (state.infoHash) {
    switchStreamParameterAndReload();
  }
}

function renderDetectedTechnologies() {
  if (!el.detectedTechPills) return;
  el.detectedTechPills.innerHTML = '';

  const techs = state.probeData?.detectedTechnologies;
  if (!Array.isArray(techs) || techs.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'tech-pill muted';
    empty.textContent = state.infoHash
      ? 'Temel medya akışı algılandı'
      : 'Video seçildiğinde otomatik analiz edilir';
    el.detectedTechPills.appendChild(empty);
    return;
  }

  for (const label of techs) {
    const pill = document.createElement('span');
    const lower = String(label).toLowerCase();
    let cls = 'tech-pill';
    if (lower.includes('hdr') || lower.includes('dolby vision') || lower.includes('hlg') || lower.includes('bit')) {
      cls += ' amber';
    } else if (lower.includes('atmos') || lower.includes('5.1') || lower.includes('7.1') || lower.includes('eac3')) {
      cls += ' cyan';
    } else if (lower.includes('altyazı') || lower.includes('ses izi')) {
      cls += ' emerald';
    }
    pill.className = cls;
    pill.textContent = label;
    el.detectedTechPills.appendChild(pill);
  }
}

function renderVideoHdrPanel() {
  const v = state.probeData?.video?.[0];
  if (!el.sectionVideoHdr) return;

  if (!v) {
    el.sectionVideoHdr.classList.add('hidden');
    return;
  }

  el.sectionVideoHdr.classList.remove('hidden');

  const hdrFormat = v.hdrFormat || (v.hdr ? 'HDR' : 'SDR');
  if (el.hdrStatusBadge) {
    el.hdrStatusBadge.textContent = hdrFormat;
    el.hdrStatusBadge.classList.toggle('hdr-active', Boolean(v.hdr));
  }

  if (el.hdrTonemapPanel) {
    el.hdrTonemapPanel.classList.toggle('hdr-highlighted', Boolean(v.hdr));
  }

  if (el.videoTechSummary) {
    const res = v.width && v.height ? `${v.width} × ${v.height}` : '--';
    const fps = v.fps ? `${Number(v.fps).toFixed(v.fps % 1 === 0 ? 0 : 2)} FPS` : '--';
    const bitDepth = v.bitDepth ? `${v.bitDepth}-Bit` : '8-Bit';
    const colorSpace = v.colorSpace || v.pixFmt || 'bt709';
    const codec = (v.codec || '--').toUpperCase();

    el.videoTechSummary.innerHTML = `
      <div class="vtech-cell"><span>Çözünürlük &amp; FPS</span><strong>${res} · ${fps}</strong></div>
      <div class="vtech-cell"><span>Codec &amp; Derinlik</span><strong>${codec} · ${bitDepth}</strong></div>
      <div class="vtech-cell"><span>Dinamik Aralık</span><strong>${hdrFormat}</strong></div>
      <div class="vtech-cell"><span>Renk Uzayı</span><strong>${colorSpace}</strong></div>
    `;
  }
}

function renderCodecBadges() {
  if (!el.codecBadges) return;
  el.codecBadges.innerHTML = '';

  const addBadge = (text, cls = '') => {
    const span = document.createElement('span');
    span.className = `codec-badge ${cls}`.trim();
    span.textContent = text;
    el.codecBadges?.appendChild(span);
  };

  if (!state.infoHash || !state.probeData) {
    if (el.streamModePill) el.streamModePill.textContent = 'Hazır';
    return;
  }

  const video = state.probeData.video?.[0];
  const audio = getSelectedAudioTrack();

  if (video) {
    const vw = Number(video.width) || 0;
    const vh = Number(video.height) || 0;
    if (vw >= 3800 || vh >= 2160) addBadge('4K UHD', 'hdr');
    else if (vw >= 2500 || vh >= 1440) addBadge('1440p');
    else if (vw >= 1900 || vh >= 1080) addBadge('1080p');
    else if (vw >= 1200 || vh >= 720) addBadge('720p');
    else if (vh > 0) addBadge(`${vh}p`);

    if (video.fps) {
      addBadge(`${Math.round(video.fps)} FPS`);
    }
    if (video.hdr) {
      addBadge(video.hdrFormat || 'HDR', 'hdr');
    }
    if (video.codec) addBadge(video.codec.toUpperCase());
  }

  if (audio) {
    const codecUpper = (audio.codec || '').toUpperCase();
    if (audio.isAtmos) {
      addBadge(`DOLBY ATMOS / ${codecUpper}`, 'atmos');
    } else if (audio.isSurround51 || Number(audio.channels) >= 6) {
      addBadge(`${codecUpper} 5.1`, 'atmos');
    } else if (codecUpper) {
      addBadge(`${codecUpper} STEREO`);
    }
  }

  if (state.streamMode === 'direct') {
    addBadge('DIRECT 206');
    if (el.streamModePill) el.streamModePill.textContent = 'Doğrudan Akış';
  } else if (state.videoMode === 'transcode') {
    addBadge('H.264 TRANSCODE', 'remux');
    if (el.streamModePill) el.streamModePill.textContent = 'Transcode (fMP4)';
  } else {
    addBadge('LIVE REMUX', 'remux');
    if (el.streamModePill) el.streamModePill.textContent = 'Canlı Remux (fMP4)';
  }
}

// ============================================================================
// Smart Stream Routing, Playback & Seeking
// ============================================================================

function shouldUseDirectStream() {
  if (!state.probeData || state.activeFileIndex === null) return false;
  if (state.videoMode === 'transcode') return false;
  if (state.audioMode === 'passthrough') return false;
  if (state.audioTrack !== 0) return false;

  const fileObj = state.files.find((f) => f.index === state.activeFileIndex);
  const fileName = (fileObj?.name || '').toLowerCase();
  const extMatch = fileName.match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  const container = (state.probeData.container || '').toLowerCase();

  const isNativeContainer =
    (ext === 'mp4' || ext === 'm4v' || ext === 'webm') &&
    !container.includes('matroska') &&
    !container.includes('avi') &&
    !container.includes('mpegts');

  if (!isNativeContainer) return false;

  const vCodec = (state.probeData.video?.[0]?.codec || '').toLowerCase();
  const isNativeVideo = ['h264', 'avc1', 'vp8', 'vp9', 'av1'].includes(vCodec);
  if (!isNativeVideo) return false;

  const audio = getSelectedAudioTrack();
  if (!audio) return true;

  const aCodec = (audio.codec || '').toLowerCase();
  const isNativeAudio = ['aac', 'mp3', 'opus', 'vorbis'].includes(aCodec);
  if (!isNativeAudio) return false;

  return Number(audio.channels) <= 2;
}

function buildStreamUrl(startSec = 0) {
  const hash = encodeURIComponent(state.infoHash || '');
  const idx = state.activeFileIndex ?? 0;

  if (state.streamMode === 'direct') {
    return `/api/stream/${hash}/${idx}`;
  }

  const params = new URLSearchParams({
    audioTrack: String(state.audioTrack),
    audioMode: state.audioMode,
    videoMode: state.videoMode,
    start: String(Math.max(0, Number(startSec.toFixed(3)))),
  });
  return `/api/play/${hash}/${idx}?${params.toString()}`;
}

async function loadPlaybackSource(startSec = 0, autoPlay = true) {
  if (!state.infoHash || state.activeFileIndex === null) return;

  ensureAudioAttached();
  state.wantsPlay = autoPlay;
  state.streamStartOffset = state.streamMode === 'remux' ? Math.max(0, startSec) : 0;

  const url = buildStreamUrl(startSec);
  setLoading(true, startSec > 0 ? 'Konumlandırılıyor...' : 'Akış başlatılıyor...');

  el.video.src = url;
  el.video.playbackRate = Number(el.speedSelect?.value || 1);

  if (state.streamMode === 'direct' && startSec > 0) {
    const onMeta = () => {
      el.video.removeEventListener('loadedmetadata', onMeta);
      try {
        el.video.currentTime = startSec;
      } catch (_) {
        // Ignore seek errors before metadata stabilizes
      }
    };
    el.video.addEventListener('loadedmetadata', onMeta);
  }

  el.video.load();
  updateTimeAndSeekUi(startSec);
  renderCodecBadges();

  if (autoPlay) {
    try {
      await resumeAudioSafely();
      await el.video.play();
    } catch (_) {
      setLoading(false);
      updatePlayPauseUi();
    }
  } else {
    setLoading(false);
    updatePlayPauseUi();
  }
}

function switchStreamParameterAndReload() {
  if (!state.infoHash || state.activeFileIndex === null) return;
  const currentPos = getCurrentPlaybackTime();
  const wasPlaying = !el.video.paused || state.wantsPlay;
  state.streamMode = shouldUseDirectStream() ? 'direct' : 'remux';
  state.autoRetryCount = 0;
  void loadPlaybackSource(currentPos, wasPlaying);
}

function handleVideoErrorOrUnsupported() {
  if (!state.infoHash || state.activeFileIndex === null) return;
  if (state.autoRetryCount >= 2) {
    setLoading(false);
    showToast('Akış kod çözme hatası: Video veya ses biçimi desteklenmiyor.', 5500);
    return;
  }

  state.autoRetryCount += 1;
  const resumeAt = getCurrentPlaybackTime();

  if (state.streamMode === 'direct') {
    state.streamMode = 'remux';
    showToast('Doğrudan akış desteklenmedi, canlı FFmpeg remux moduna geçiliyor...');
    void loadPlaybackSource(resumeAt, true);
    return;
  }

  if (state.videoMode === 'copy') {
    state.videoMode = 'transcode';
    if (el.videoModeSelect) el.videoModeSelect.value = 'transcode';
    showToast('HEVC / uyumsuz video saptandı — H.264 canlı transcode başlatılıyor...');
    void loadPlaybackSource(resumeAt, true);
    return;
  }

  if (state.audioMode === 'passthrough') {
    state.audioMode = 'surround51';
    state.audioOutputKey = 'cinema51';
    state.audioPreset = 'cinema51';
    if (el.audioOutputMode) el.audioOutputMode.value = 'cinema51';
    applyEngineSettings();
    showToast('Bitstream desteklenmiyor — 5.1 Sinema moduna geçildi.');
    void loadPlaybackSource(resumeAt, true);
  }
}

function seekTo(targetSec) {
  const duration = getEffectiveDuration();
  const clamped =
    duration > 0 ? Math.max(0, Math.min(duration - 0.25, targetSec)) : Math.max(0, targetSec);

  if (state.streamMode === 'direct') {
    if (Number.isFinite(el.video.duration) && el.video.duration > 0) {
      el.video.currentTime = clamped;
      updateTimeAndSeekUi(clamped);
    }
    return;
  }

  state.streamStartOffset = clamped;
  updateTimeAndSeekUi(clamped);
  void loadPlaybackSource(clamped, !el.video.paused || state.wantsPlay);
}

// ============================================================================
// Files List & Subtitles
// ============================================================================

function renderFilesList() {
  if (!el.torrentFilesList) return;
  if (!state.files.length) {
    el.torrentFilesList.innerHTML = '<div class="empty-list-msg">Henüz aktif bir torrent yok.</div>';
    return;
  }

  const statusByIndex = new Map();
  for (const sf of state.statusFiles) {
    statusByIndex.set(sf.index, sf);
  }

  const frag = document.createDocumentFragment();
  for (const f of state.files) {
    const sf = statusByIndex.get(f.index);
    const progressPct = sf ? Math.min(100, Math.max(0, (sf.progress || 0) * 100)) : 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `torrent-file-item ${f.index === state.activeFileIndex ? 'active' : ''}`;

    const tag = f.isVideo ? 'VIDEO' : f.isSubtitle ? 'ALTYAZI' : 'DOSYA';
    btn.innerHTML = `
      <div class="file-row-top">
        <span class="file-name"></span>
        <span class="file-type-tag">${tag}</span>
      </div>
      <div class="file-row-meta">
        <span>${formatBytes(f.length)}</span>
        <span>${progressPct.toFixed(1)}%</span>
      </div>
      <div class="file-progress-track">
        <div class="file-progress-fill" style="width:${progressPct.toFixed(1)}%"></div>
      </div>
    `;
    const nameEl = btn.querySelector('.file-name');
    if (nameEl) nameEl.textContent = f.name;

    btn.addEventListener('click', () => {
      if (f.isVideo) {
        if (f.index !== state.activeFileIndex) {
          void selectAndPlayFile(f.index, ++state.loadSeq);
        }
      } else if (f.isSubtitle) {
        void activateTorrentSubtitleFile(f);
      } else {
        showToast('Bu dosya oynatılabilir bir video değil.');
      }
    });

    frag.appendChild(btn);
  }

  el.torrentFilesList.innerHTML = '';
  el.torrentFilesList.appendChild(frag);
}

function getAvailableSubtitles() {
  const items = [{ id: 'off', label: 'Altyazı Kapalı', kind: 'off' }];
  const seenIds = new Set(['off']);
  const seenEmbeddedOrders = new Set();
  const seenFileIndices = new Set();

  // Prepared tracks from /subtitles/prepare/:fileIndex
  for (const sub of state.subtitles.preparedTracks) {
    const id =
      sub.id ||
      (sub.kind === 'embedded' ? `embedded-${sub.subOrder}` : `torrent-${sub.fileIndex}`);
    if (typeof sub.subOrder === 'number') seenEmbeddedOrders.add(Number(sub.subOrder));
    if (typeof sub.fileIndex === 'number') seenFileIndices.add(Number(sub.fileIndex));
    if (!seenIds.has(id)) {
      seenIds.add(id);
      items.push({
        id,
        label: sub.label || `Altyazı (${sub.language || 'UND'})`,
        kind: 'prepared',
        prepared: sub,
      });
    }
  }

  // Fallback embedded from probe if prepare didn't include them
  const embedded = state.probeData?.subtitles || [];
  embedded.forEach((sub, i) => {
    const subOrder = Number(sub.subOrder ?? i);
    const id = `embedded-${subOrder}`;
    if (!seenIds.has(id) && !seenEmbeddedOrders.has(subOrder)) {
      seenIds.add(id);
      seenEmbeddedOrders.add(subOrder);
      const lang = sub.language ? sub.language.toUpperCase() : 'UND';
      const title = sub.title ? ` — ${sub.title}` : '';
      items.push({
        id,
        label: `Gömülü #${subOrder + 1} (${lang})${title}`,
        kind: 'embedded',
        subOrder,
      });
    }
  });

  // Torrent external subtitle files if not already in preparedTracks
  for (const f of state.files) {
    const fileIdx = Number(f.index);
    const id = `torrent-${fileIdx}`;
    if (f.isSubtitle && !seenIds.has(id) && !seenFileIndices.has(fileIdx)) {
      seenIds.add(id);
      seenFileIndices.add(fileIdx);
      items.push({
        id,
        label: `Torrent: ${f.name}`,
        kind: 'torrent',
        file: f,
      });
    }
  }

  for (const local of state.subtitles.localTracks) {
    items.push({
      id: local.id,
      label: `Yerel: ${local.label}`,
      kind: 'local',
      local,
    });
  }

  return items;
}

function populateSubtitlesList() {
  const items = getAvailableSubtitles();
  const renderInto = (container, closeMenuOnClick) => {
    if (!container) return;
    container.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isActive = state.subtitles.activeId === item.id;
      btn.className = `sub-item ${isActive ? 'active' : ''}`;
      btn.textContent = `${isActive ? '✓ ' : ''}${item.label}`;
      btn.addEventListener('click', () => {
        void selectSubtitleItem(item);
        if (closeMenuOnClick) el.subtitleMenu?.classList.add('hidden');
      });
      container.appendChild(btn);
    }
  };

  renderInto(el.subtitleDrawerList, false);
  renderInto(el.subtitleMenuList, true);

  const isOff = state.subtitles.activeId === 'off';
  el.subBadgeDot?.classList.toggle('hidden', isOff);
  if (el.activeSubtitleStatus) {
    const active = items.find((x) => x.id === state.subtitles.activeId);
    el.activeSubtitleStatus.textContent = isOff ? 'Kapalı' : active?.label || 'Aktif';
  }
}

async function selectSubtitleItem(item) {
  if (item.kind === 'off') {
    state.subtitles.activeId = 'off';
    state.subtitles.cues = [];
    detachVideoTrackElement();
    if (el.subtitleOverlay) el.subtitleOverlay.innerHTML = '';
    populateSubtitlesList();
    return;
  }

  if (item.kind === 'prepared' && item.prepared) {
    const sub = item.prepared;
    if (Array.isArray(sub.cues) && sub.cues.length > 0) {
      state.subtitles.activeId = sub.id;
      state.subtitles.cues = sub.cues;
      if (sub.blobUrl) attachVideoTrackElement(sub.blobUrl, item.label);
      populateSubtitlesList();
      renderActiveSubtitleCue(getCurrentPlaybackTime());
      return;
    }
    if (sub.vttUrl) {
      try {
        const res = await fetch(sub.vttUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const vttText = await res.text();
        const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        sub.cues = parseWebVtt(vttText);
        sub.blobUrl = blobUrl;
        applyWebVttText(sub.id, item.label, vttText, blobUrl);
        return;
      } catch (_) {
        showToast('Altyazı henüz hazır değil.');
        return;
      }
    }
  }

  if (item.kind === 'embedded' && state.infoHash && state.activeFileIndex !== null) {
    const url = `/api/subtitles/${encodeURIComponent(state.infoHash)}/${state.activeFileIndex}/${item.subOrder}.vtt`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const vttText = await res.text();
      applyWebVttText(item.id, item.label, vttText, url);
    } catch (_) {
      showToast('Gömülü altyazı yüklenemedi.');
    }
    return;
  }

  if (item.kind === 'torrent' && item.file) {
    await activateTorrentSubtitleFile(item.file);
    return;
  }

  if (item.kind === 'local' && item.local) {
    state.subtitles.activeId = item.local.id;
    state.subtitles.cues = item.local.cues;
    attachVideoTrackElement(item.local.blobUrl, item.local.label);
    populateSubtitlesList();
    renderActiveSubtitleCue(getCurrentPlaybackTime());
  }
}

async function activateTorrentSubtitleFile(fileObj) {
  if (!state.infoHash) return;
  const subId = `torrent-${fileObj.index}`;
  const url = `/api/subtitles/${encodeURIComponent(state.infoHash)}/file/${fileObj.index}.vtt`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const vttText = await res.text();
    const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const existingPrepared = state.subtitles.preparedTracks.find(
      (s) => s.id === subId || Number(s.fileIndex) === Number(fileObj.index),
    );
    if (existingPrepared) {
      existingPrepared.cues = parseWebVtt(vttText);
      existingPrepared.blobUrl = blobUrl;
      existingPrepared.isReady = true;
    }
    applyWebVttText(subId, fileObj.name, vttText, blobUrl);
    showToast(`Altyazı aktif: ${fileObj.name}`);
  } catch (_) {
    showToast('Torrent altyazı dosyası henüz indirilemedi.');
  }
}

function handleLocalSubtitleUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const raw = typeof reader.result === 'string' ? reader.result : '';
    const vttText = file.name.toLowerCase().endsWith('.srt') ? convertSrtToVtt(raw) : raw;
    const blob = new Blob([vttText], { type: 'text/vtt;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const id = `local:${Date.now()}`;
    const cues = parseWebVtt(vttText);
    state.subtitles.localTracks.push({ id, label: file.name, blobUrl, cues });
    state.subtitles.activeId = id;
    state.subtitles.cues = cues;
    attachVideoTrackElement(blobUrl, file.name);
    populateSubtitlesList();
    renderActiveSubtitleCue(getCurrentPlaybackTime());
    showToast(`Harici altyazı yüklendi: ${file.name} (${cues.length} satır)`);
  };
  reader.readAsText(file, 'UTF-8');
}

function applyWebVttText(id, label, vttText, trackSrc) {
  const cues = parseWebVtt(vttText);
  state.subtitles.activeId = id;
  state.subtitles.cues = cues;
  attachVideoTrackElement(trackSrc, label);
  populateSubtitlesList();
  renderActiveSubtitleCue(getCurrentPlaybackTime());
}

function attachVideoTrackElement(src, label) {
  detachVideoTrackElement();
  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = label;
  track.srclang = 'tr';
  track.src = src;
  track.default = true;
  el.video.appendChild(track);
  if (track.track) track.track.mode = 'hidden';
  state.subtitles.trackEl = track;
}

function detachVideoTrackElement() {
  if (state.subtitles.trackEl) {
    state.subtitles.trackEl.remove();
    state.subtitles.trackEl = null;
  }
}

function convertSrtToVtt(srtText) {
  const normalized = srtText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const blocks = normalized.split(/\n{2,}/);
  const vttBlocks = ['WEBVTT\n'];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trimEnd());
    if (lines.length === 0) continue;
    let timeIdx = 0;
    if (/^\d+$/.test(lines[0].trim()) && lines[1] && lines[1].includes('-->')) {
      timeIdx = 1;
    }
    if (!lines[timeIdx] || !lines[timeIdx].includes('-->')) continue;
    const timestampLine = lines[timeIdx].replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    const cueText = lines.slice(timeIdx + 1).join('\n');
    if (cueText.trim()) {
      vttBlocks.push(`${timestampLine}\n${cueText}`);
    }
  }

  return vttBlocks.join('\n\n');
}

function parseVttTimestamp(ts) {
  const clean = ts.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return 0;
}

function parseWebVtt(vttText) {
  const normalized = vttText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const blocks = normalized.split(/\n{2,}/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    const arrowIdx = lines.findIndex((l) => l.includes('-->'));
    if (arrowIdx === -1) continue;

    const arrowLine = lines[arrowIdx];
    const [startRaw, endRest] = arrowLine.split('-->');
    if (!startRaw || !endRest) continue;
    const endRaw = endRest.trim().split(/\s+/)[0];
    const start = parseVttTimestamp(startRaw);
    const end = parseVttTimestamp(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;

    const rawText = lines.slice(arrowIdx + 1).join('\n').trim();
    const cleanedText = rawText
      .replace(/\{\\[^}]*\}/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (cleanedText) {
      cues.push({ start, end, text: cleanedText });
    }
  }
  return cues;
}

function renderActiveSubtitleCue(currentTime) {
  if (!el.subtitleOverlay) return;
  if (state.subtitles.activeId === 'off' || state.subtitles.cues.length === 0) {
    if (el.subtitleOverlay.childElementCount > 0) {
      el.subtitleOverlay.innerHTML = '';
    }
    return;
  }

  const activeCues = state.subtitles.cues.filter(
    (c) => currentTime >= c.start && currentTime <= c.end,
  );
  if (activeCues.length === 0) {
    if (el.subtitleOverlay.childElementCount > 0) {
      el.subtitleOverlay.innerHTML = '';
    }
    return;
  }

  const combined = activeCues.map((c) => c.text).join('\n');
  const existing = el.subtitleOverlay.querySelector('.subtitle-cue-pill');
  if (existing && existing.textContent === combined) return;

  el.subtitleOverlay.innerHTML = '';
  const pill = document.createElement('span');
  pill.className = 'subtitle-cue-pill';
  pill.textContent = combined;
  el.subtitleOverlay.appendChild(pill);
}

// ============================================================================
// Live Playback Statistics HUD (📊 İstatistikler)
// ============================================================================

function setupFpsTracker() {
  const vid = /** @type {HTMLVideoElement & { requestVideoFrameCallback?: (cb: (now: number) => void) => number }} */ (
    el.video
  );
  if (typeof vid.requestVideoFrameCallback === 'function') {
    const onFrame = (now) => {
      state.fps.frameTimes.push(now);
      const cutoff = now - 1000;
      while (state.fps.frameTimes.length > 0 && state.fps.frameTimes[0] < cutoff) {
        state.fps.frameTimes.shift();
      }
      state.fps.measuredFps = state.fps.frameTimes.length;
      vid.requestVideoFrameCallback?.(onFrame);
    };
    vid.requestVideoFrameCallback(onFrame);
  }
}

function getLiveRenderFps() {
  if (el.video.paused) return 0;
  const vid = /** @type {HTMLVideoElement & { requestVideoFrameCallback?: unknown }} */ (el.video);
  if (typeof vid.requestVideoFrameCallback === 'function') {
    const now = performance.now();
    const cutoff = now - 1200;
    while (state.fps.frameTimes.length > 0 && state.fps.frameTimes[0] < cutoff) {
      state.fps.frameTimes.shift();
    }
    return state.fps.frameTimes.length;
  }

  const quality = typeof el.video.getVideoPlaybackQuality === 'function'
    ? el.video.getVideoPlaybackQuality()
    : null;
  if (!quality) return 0;
  const now = performance.now();
  const dt = now - state.fps.lastSampleMs;
  if (state.fps.lastSampleMs > 0 && dt >= 250) {
    const df = quality.totalVideoFrames - state.fps.lastTotalFrames;
    if (df >= 0) {
      state.fps.measuredFps = (df / dt) * 1000;
    }
  }
  state.fps.lastTotalFrames = quality.totalVideoFrames;
  state.fps.lastSampleMs = now;
  return state.fps.measuredFps;
}

function updateStatsHud() {
  if (!state.statsOpen) return;

  const v = state.probeData?.video?.[0];
  const a = getSelectedAudioTrack();
  const caps = audioEngine.getCapabilities();

  const srcW = v?.width || el.video.videoWidth || 0;
  const srcH = v?.height || el.video.videoHeight || 0;
  if (el.statSrcRes) {
    el.statSrcRes.textContent = srcW && srcH ? `${srcW} × ${srcH}` : '--';
  }

  const dispW = Math.round(el.video.clientWidth || 0);
  const dispH = Math.round(el.video.clientHeight || 0);
  const dpr = globalThis.devicePixelRatio || 1;
  if (el.statDispRes) {
    el.statDispRes.textContent = dispW && dispH
      ? `${dispW} × ${dispH} (${Math.round(dispW * dpr)}×${Math.round(dispH * dpr)} @ ${dpr.toFixed(1)}x)`
      : '--';
  }

  const srcFps = v?.fps ? `${Number(v.fps).toFixed(v.fps % 1 === 0 ? 0 : 2)} fps` : '--';
  const liveFpsVal = getLiveRenderFps();
  const liveFps = el.video.paused ? '0 fps (Duraklatıldı)' : `${liveFpsVal.toFixed(1)} fps`;
  if (el.statFps) {
    el.statFps.textContent = `${srcFps} / ${liveFps}`;
  }

  const q = typeof el.video.getVideoPlaybackQuality === 'function'
    ? el.video.getVideoPlaybackQuality()
    : null;
  if (el.statDropped) {
    if (q) {
      const pct = q.totalVideoFrames > 0
        ? ((q.droppedVideoFrames / q.totalVideoFrames) * 100).toFixed(2)
        : '0.00';
      el.statDropped.textContent = `${q.droppedVideoFrames} / ${q.totalVideoFrames} (%${pct})`;
    } else {
      el.statDropped.textContent = 'Desteklenmiyor';
    }
  }

  if (el.statVideo) {
    const vCodec = (v?.codec || '--').toUpperCase();
    const bitDepth = v?.bitDepth ? `${v.bitDepth}-bit` : '8-bit';
    const hdrFmt = v?.hdrFormat || (v?.hdr ? 'HDR' : 'SDR');
    const cSpace = v?.colorSpace || v?.pixFmt || 'bt709';
    const vBitrate = formatBitrate(v?.bitrate || state.probeData?.bitrate || 0);
    const modeLabel = state.streamMode === 'direct'
      ? 'Direct 206'
      : state.videoMode === 'transcode'
        ? 'Transcode'
        : 'fMP4 Remux';
    el.statVideo.textContent = `${vCodec} · ${bitDepth} · ${hdrFmt} · ${cSpace} · ${vBitrate} · ${modeLabel}`;
  }

  if (el.statAudio) {
    const aCodec = (a?.codec || '--').toUpperCase();
    const aCh = a?.channels ? (a.channels >= 6 ? '5.1 (6ch)' : `${a.channels}ch`) : '--';
    const sr = a?.sampleRate
      ? `${(a.sampleRate / 1000).toFixed(1)} kHz`
      : caps.sampleRate
        ? `${(caps.sampleRate / 1000).toFixed(1)} kHz`
        : '--';
    const aRate = formatBitrate(a?.bitrate || 0);
    const waStatus = `${caps.state} (${caps.activePreset})`;
    el.statAudio.textContent = `${aCodec} · ${aCh} · ${sr} · ${aRate} · ${waStatus}`;
  }

  if (el.statNetwork) {
    const bufSec = getBufferedAheadSeconds().toFixed(1);
    const filePct = (state.selectedFileProgress * 100).toFixed(1);
    const down = formatSpeed(state.lastTelemetry?.downloadSpeed || 0);
    const up = formatSpeed(state.lastTelemetry?.uploadSpeed || 0);
    const peers = state.lastTelemetry?.numPeers ?? 0;
    el.statNetwork.textContent = `${bufSec} sn · %${filePct} · ↓${down} ↑${up} · ${peers} Eş`;
  }
}

function setStatsOpen(open) {
  state.statsOpen = Boolean(open);
  el.statsOverlay?.classList.toggle('hidden', !state.statsOpen);
  el.btnStats?.classList.toggle('active', state.statsOpen);

  if (state.statsTimer !== null) {
    clearInterval(state.statsTimer);
    state.statsTimer = null;
  }

  if (state.statsOpen) {
    updateStatsHud();
    state.statsTimer = setInterval(updateStatsHud, 500);
  }
}

// ============================================================================
// Player Controls, Drawer & Auto-Hide
// ============================================================================

function updatePlayPauseUi() {
  const isPaused = el.video.paused;
  el.iconPlay?.classList.toggle('hidden', !isPaused);
  el.iconPause?.classList.toggle('hidden', isPaused);

  const hasSrc = Boolean(el.video.getAttribute('src'));
  const isLoading = !el.playerLoadingState?.classList.contains('hidden');
  el.btnCenterPlay?.classList.toggle('hidden', !hasSrc || !isPaused || isLoading);
}

function togglePlayPause() {
  if (!el.video.getAttribute('src')) return;
  if (el.video.paused) {
    state.wantsPlay = true;
    void resumeAudioSafely();
    void el.video.play().catch(() => {});
  } else {
    state.wantsPlay = false;
    el.video.pause();
  }
}

function toggleMute() {
  el.video.muted = !el.video.muted;
  updateVolumeUi();
}

function updateVolumeUi() {
  const muted = el.video.muted || el.video.volume === 0;
  el.iconVolOn?.classList.toggle('hidden', muted);
  el.iconVolOff?.classList.toggle('hidden', !muted);
  if (el.volumeSlider) {
    el.volumeSlider.value = el.video.muted ? '0' : String(el.video.volume);
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else if (el.playerShell?.requestFullscreen) {
    void el.playerShell.requestFullscreen();
  }
}

async function togglePip() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (
      document.pictureInPictureEnabled &&
      typeof el.video.requestPictureInPicture === 'function'
    ) {
      await el.video.requestPictureInPicture();
    } else {
      showToast('Tarayıcınız Resim İçinde Resim (PiP) modunu desteklemiyor.');
    }
  } catch (_) {
    showToast('Resim İçinde Resim başlatılamadı.');
  }
}

function revealControlsTemporarily() {
  if (!el.playerShell) return;
  el.playerShell.setAttribute('data-controls-visible', 'true');
  if (state.controlsHideTimer !== null) {
    clearTimeout(state.controlsHideTimer);
  }
  if (!el.video.paused) {
    state.controlsHideTimer = setTimeout(() => {
      if (!el.video.paused && !state.isDraggingSeek) {
        el.playerShell?.setAttribute('data-controls-visible', 'false');
      }
    }, 3000);
  }
}

function setDrawerState(open, tab = state.activeTab) {
  state.drawerOpen = open;
  state.activeTab = tab;
  el.playerShell?.classList.toggle('drawer-open', open);

  el.tabStudio?.classList.toggle('hidden', tab !== 'studio');
  el.tabFiles?.classList.toggle('hidden', tab !== 'files');
  el.tabBtnStudio?.classList.toggle('active', tab === 'studio');
  el.tabBtnFiles?.classList.toggle('active', tab === 'files');

  el.btnToggleStudio?.classList.toggle('active', open && tab === 'studio');
  el.btnToggleStudioTop?.classList.toggle('active', open && tab === 'studio');
  el.btnToggleFiles?.classList.toggle('active', open && tab === 'files');
  el.btnToggleFilesTop?.classList.toggle('active', open && tab === 'files');
}

function toggleDrawerTab(tab) {
  if (state.drawerOpen && state.activeTab === tab) {
    setDrawerState(false, tab);
  } else {
    setDrawerState(true, tab);
  }
}

// ============================================================================
// Embed Modal
// ============================================================================

function updateEmbedCodePreview() {
  if (!el.embedCodeOutput) return;
  const includeMagnet = Boolean(el.embedIncludeMagnet?.checked);
  const magnetVal = (el.embedMagnetField?.value || state.magnetUri || '').trim();
  const heightVal = Math.max(280, Math.min(1440, Number(el.embedHeightInput?.value) || 600));

  const url = new URL(globalThis.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('embed', '1');
  if (includeMagnet && magnetVal) {
    url.searchParams.set('magnet', magnetVal);
  }

  el.embedCodeOutput.value = `<iframe src="${url.toString()}" width="100%" height="${heightVal}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
}

function openEmbedModal() {
  if (el.embedMagnetField && !el.embedMagnetField.value && state.magnetUri) {
    el.embedMagnetField.value = state.magnetUri;
  }
  updateEmbedCodePreview();
  el.embedCopyFeedback?.classList.add('hidden');
  el.embedModal?.classList.remove('hidden');
}

function closeEmbedModal() {
  el.embedModal?.classList.add('hidden');
}

async function copyEmbedCode() {
  const code = el.embedCodeOutput?.value || '';
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
  } catch (_) {
    el.embedCodeOutput?.select();
    document.execCommand('copy');
  }
  el.embedCopyFeedback?.classList.remove('hidden');
  setTimeout(() => el.embedCopyFeedback?.classList.add('hidden'), 2400);
}

// ============================================================================
// Event Bindings
// ============================================================================

function handleTorrentFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.torrent')) {
    showInputError('Lütfen geçerli bir .torrent dosyası seçin.');
    return;
  }
  file
    .arrayBuffer()
    .then((buf) => {
      const torrentBase64 = arrayBufferToBase64(buf);
      void addTorrent({ torrentBase64 });
    })
    .catch(() => {
      showInputError('.torrent dosyası okunamadı.');
    });
}

function bindDragDrop(targetEl, onDropFile) {
  if (!targetEl) return;
  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  ['dragenter', 'dragover'].forEach((ev) => {
    targetEl.addEventListener(ev, (e) => {
      prevent(e);
      targetEl.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach((ev) => {
    targetEl.addEventListener(ev, (e) => {
      prevent(e);
      targetEl.classList.remove('drag-over');
    });
  });
  targetEl.addEventListener('drop', (e) => {
    const dt = /** @type {DragEvent} */ (e).dataTransfer;
    const file = dt?.files?.[0];
    if (file) onDropFile(file);
  });
}

function bindEvents() {
  el.btnHeaderToggleInput?.addEventListener('click', () => {
    el.inputSection?.classList.toggle('collapsed');
  });

  el.magnetForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const magnet = (el.magnetInput?.value || '').trim();
    if (!magnet) {
      showInputError('Lütfen bir Magnet bağlantısı girin veya .torrent dosyası seçin.');
      return;
    }
    void resumeAudioSafely();
    void addTorrent({ magnet });
  });

  el.embedMagnetForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const magnet = (el.embedMagnetInput?.value || '').trim();
    if (!magnet) return;
    el.embedQuickLoader?.classList.add('hidden');
    void resumeAudioSafely();
    void addTorrent({ magnet });
  });

  el.btnEmbedSourceToggle?.addEventListener('click', () => {
    el.embedQuickLoader?.classList.toggle('hidden');
  });

  el.dropzone?.addEventListener('click', () => el.torrentFileInput?.click());
  el.dropzone?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.torrentFileInput?.click();
    }
  });
  el.torrentFileInput?.addEventListener('change', () => {
    const file = el.torrentFileInput?.files?.[0];
    if (file) handleTorrentFile(file);
    if (el.torrentFileInput) el.torrentFileInput.value = '';
  });

  bindDragDrop(el.dropzone, handleTorrentFile);
  bindDragDrop(el.playerStage, handleTorrentFile);

  const triggerDemo = () => {
    el.embedQuickLoader?.classList.add('hidden');
    void resumeAudioSafely();
    void startDemoSample();
  };
  el.btnDemoSample?.addEventListener('click', triggerDemo);
  el.btnIdleDemo?.addEventListener('click', triggerDemo);
  el.btnEmbedDemo?.addEventListener('click', triggerDemo);

  el.btnSaveVideo?.addEventListener('click', triggerSelectedVideoDownload);

  // Embed modal
  el.btnOpenEmbed?.addEventListener('click', openEmbedModal);
  el.btnEmbedCode?.addEventListener('click', openEmbedModal);
  el.btnCloseEmbed?.addEventListener('click', closeEmbedModal);
  el.btnCloseEmbedFooter?.addEventListener('click', closeEmbedModal);
  el.embedModal?.addEventListener('click', (e) => {
    if (e.target === el.embedModal) closeEmbedModal();
  });
  el.embedIncludeMagnet?.addEventListener('change', updateEmbedCodePreview);
  el.embedMagnetField?.addEventListener('input', updateEmbedCodePreview);
  el.embedHeightInput?.addEventListener('input', updateEmbedCodePreview);
  el.btnCopyEmbed?.addEventListener('click', () => void copyEmbedCode());

  // Video element events
  el.video.addEventListener('loadedmetadata', () => {
    if (state.streamMode === 'direct' && Number.isFinite(el.video.duration) && el.video.duration > 0) {
      state.totalDuration = el.video.duration;
    }
    updateTimeAndSeekUi();
  });

  el.video.addEventListener('canplay', () => {
    setLoading(false);
    updatePlayPauseUi();
    const hasVideoStream = (state.probeData?.video?.length || 0) > 0;
    if (
      hasVideoStream &&
      state.streamMode === 'remux' &&
      state.videoMode === 'copy' &&
      el.video.videoWidth === 0
    ) {
      setTimeout(() => {
        if (
          el.video.readyState >= 2 &&
          el.video.videoWidth === 0 &&
          state.videoMode === 'copy' &&
          state.infoHash
        ) {
          handleVideoErrorOrUnsupported();
        }
      }, 1500);
    }
  });

  el.video.addEventListener('waiting', () => {
    if (el.video.getAttribute('src')) {
      setLoading(true, 'Tamponlanıyor...');
    }
  });

  el.video.addEventListener('playing', () => {
    setLoading(false);
    updatePlayPauseUi();
    updateAudioCapabilitiesUi();
    revealControlsTemporarily();
  });

  el.video.addEventListener('pause', () => {
    updatePlayPauseUi();
    revealControlsTemporarily();
  });

  el.video.addEventListener('timeupdate', () => {
    if (!state.isDraggingSeek) {
      updateTimeAndSeekUi();
    }
  });

  el.video.addEventListener('progress', () => {
    updateTimeAndSeekUi();
  });

  el.video.addEventListener('ended', () => {
    state.wantsPlay = false;
    updatePlayPauseUi();
  });

  el.video.addEventListener('error', () => {
    if (el.video.getAttribute('src')) {
      handleVideoErrorOrUnsupported();
    }
  });

  // Video stage interactions
  el.video.addEventListener('click', () => {
    const subOpen = !el.subtitleMenu?.classList.contains('hidden');
    const audioOpen = !el.audioTrackMenu?.classList.contains('hidden');
    if (subOpen || audioOpen) {
      el.subtitleMenu?.classList.add('hidden');
      el.audioTrackMenu?.classList.add('hidden');
      return;
    }
    togglePlayPause();
  });
  el.video.addEventListener('dblclick', toggleFullscreen);
  el.playerStage?.addEventListener('mousemove', revealControlsTemporarily);
  el.playerStage?.addEventListener('mouseleave', () => {
    if (!el.video.paused) {
      el.playerShell?.setAttribute('data-controls-visible', 'false');
    }
  });

  // Playback buttons
  el.btnPlayPause?.addEventListener('click', togglePlayPause);
  el.btnCenterPlay?.addEventListener('click', togglePlayPause);
  el.btnUnlockAudio?.addEventListener('click', () => void resumeAudioSafely());
  el.btnSeekBack?.addEventListener('click', () => seekTo(getCurrentPlaybackTime() - 10));
  el.btnSeekFwd?.addEventListener('click', () => seekTo(getCurrentPlaybackTime() + 10));
  el.btnMute?.addEventListener('click', toggleMute);

  el.volumeSlider?.addEventListener('input', () => {
    const val = Number(el.volumeSlider?.value ?? 1);
    el.video.volume = val;
    el.video.muted = val === 0;
    updateVolumeUi();
  });

  el.speedSelect?.addEventListener('change', () => {
    el.video.playbackRate = Number(el.speedSelect?.value) || 1;
  });

  el.btnPip?.addEventListener('click', () => void togglePip());
  el.btnFullscreen?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    const isFs = Boolean(document.fullscreenElement);
    el.iconFsEnter?.classList.toggle('hidden', isFs);
    el.iconFsExit?.classList.toggle('hidden', !isFs);
  });

  // Stats HUD toggle
  el.btnStats?.addEventListener('click', () => setStatsOpen(!state.statsOpen));
  el.btnCloseStats?.addEventListener('click', () => setStatsOpen(false));

  // Seek bar scrubbing & hover preview
  const ratioFromPointer = (clientX) => {
    const rect = el.seekContainer?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  el.seekContainer?.addEventListener('pointerdown', (e) => {
    const duration = getEffectiveDuration();
    if (duration <= 0) return;
    state.isDraggingSeek = true;
    state.dragRatio = ratioFromPointer(e.clientX);
    el.seekContainer?.classList.add('dragging');
    el.seekContainer?.setPointerCapture(e.pointerId);
    updateTimeAndSeekUi(state.dragRatio * duration);
  });

  el.seekContainer?.addEventListener('pointermove', (e) => {
    const duration = getEffectiveDuration();
    const r = ratioFromPointer(e.clientX);
    if (el.seekHoverTooltip && duration > 0) {
      const hoverSec = r * duration;
      const segIdx = Math.min(99, Math.max(0, Math.floor(r * 100)));
      const pState = state.pieceMap[segIdx];
      const pLabel = pState === 2 ? 'Hazır' : pState === 1 ? 'İniyor' : 'Bekliyor';
      el.seekHoverTooltip.textContent = `${formatTime(hoverSec)} · ${pLabel}`;
      el.seekHoverTooltip.style.left = `${r * 100}%`;
      el.seekHoverTooltip.classList.remove('hidden');
    }
    if (state.isDraggingSeek && duration > 0) {
      state.dragRatio = r;
      updateTimeAndSeekUi(r * duration);
    }
  });

  el.seekContainer?.addEventListener('pointerleave', () => {
    el.seekHoverTooltip?.classList.add('hidden');
  });

  const commitSeekDrag = () => {
    if (!state.isDraggingSeek) return;
    state.isDraggingSeek = false;
    el.seekContainer?.classList.remove('dragging');
    const duration = getEffectiveDuration();
    if (duration > 0) {
      seekTo(state.dragRatio * duration);
    }
  };
  el.seekContainer?.addEventListener('pointerup', commitSeekDrag);
  el.seekContainer?.addEventListener('pointercancel', commitSeekDrag);

  // Drawer & tabs
  el.btnToggleStudio?.addEventListener('click', () => toggleDrawerTab('studio'));
  el.btnToggleStudioTop?.addEventListener('click', () => toggleDrawerTab('studio'));
  el.btnToggleFiles?.addEventListener('click', () => toggleDrawerTab('files'));
  el.btnToggleFilesTop?.addEventListener('click', () => toggleDrawerTab('files'));
  el.tabBtnStudio?.addEventListener('click', () => setDrawerState(true, 'studio'));
  el.tabBtnFiles?.addEventListener('click', () => setDrawerState(true, 'files'));
  el.btnCloseDrawer?.addEventListener('click', () => setDrawerState(false));

  // Video HDR / color sliders
  [el.sliderVidBrightness, el.sliderVidContrast, el.sliderVidSaturation].forEach((sl) => {
    sl?.addEventListener('input', applyVideoCssFilters);
  });
  el.btnResetVideoFilters?.addEventListener('click', resetVideoCssFilters);

  // Audio controls
  el.audioOutputMode?.addEventListener('change', () => {
    const key = el.audioOutputMode?.value || 'stereo';
    const cfg = AUDIO_OUTPUT_CONFIG[key] || AUDIO_OUTPUT_CONFIG.stereo;
    const backendChanged = state.audioMode !== cfg.audioMode;

    state.audioOutputKey = key;
    state.audioMode = cfg.audioMode;
    state.audioPreset = cfg.preset;

    void resumeAudioSafely();
    applyEngineSettings();
    showToast(`Ses Modu: ${cfg.label}`);

    if (backendChanged && state.infoHash) {
      switchStreamParameterAndReload();
    }
  });

  el.toggleVirtualUpmix?.addEventListener('change', () => {
    state.virtualUpmix = Boolean(el.toggleVirtualUpmix?.checked);
    state.audioPreset = state.virtualUpmix ? 'atmos' : 'stereo';
    adaptControlsToAudioTrack({ autoSelectMode: false });
    void resumeAudioSafely();
    showToast(
      state.virtualUpmix ? 'Sanal 5.1 / Spatial Upmix Açıldı' : 'Doğal Stereo Modu Aktif',
    );
  });

  for (const chip of el.presetChips) {
    chip.addEventListener('click', () => {
      const preset = chip.getAttribute('data-preset');
      if (!preset) return;
      state.audioPreset = preset;
      if (preset === 'atmos' || preset === 'cinema51') {
        const prevMode = state.audioMode;
        state.audioOutputKey = preset;
        state.audioMode = 'surround51';
        if (el.audioOutputMode) el.audioOutputMode.value = preset;
        if (prevMode !== 'surround51' && state.infoHash) {
          switchStreamParameterAndReload();
        }
      }
      void resumeAudioSafely();
      applyEngineSettings();
    });
  }

  el.audioTrackSelect?.addEventListener('change', () => {
    selectAudioTrack(Number(el.audioTrackSelect?.value) || 0);
  });

  el.videoModeSelect?.addEventListener('change', () => {
    state.videoMode = el.videoModeSelect?.value === 'transcode' ? 'transcode' : 'copy';
    if (state.infoHash) {
      switchStreamParameterAndReload();
    }
  });

  const bindGainSlider = (sliderEl, readoutEl, formatter) => {
    sliderEl?.addEventListener('input', () => {
      if (readoutEl) readoutEl.textContent = formatter(Number(sliderEl.value));
      void resumeAudioSafely();
      applyEngineSettings();
    });
  };
  bindGainSlider(el.sliderCenterDb, el.valCenterDb, formatDb);
  bindGainSlider(el.sliderLfeDb, el.valLfeDb, formatDb);
  bindGainSlider(el.sliderSurroundDb, el.valSurroundDb, formatDb);
  bindGainSlider(el.sliderMasterGain, el.valMasterGain, (v) => `${Math.round(v * 100)}%`);

  el.toggleNightMode?.addEventListener('change', () => {
    void resumeAudioSafely();
    applyEngineSettings();
    showToast(
      el.toggleNightMode?.checked ? 'Gece Modu (DRC) Aktif' : 'Gece Modu Kapatıldı',
    );
  });

  el.btnResetGains?.addEventListener('click', () => {
    if (el.sliderCenterDb) el.sliderCenterDb.value = '0';
    if (el.sliderLfeDb) el.sliderLfeDb.value = '0';
    if (el.sliderSurroundDb) el.sliderSurroundDb.value = '0';
    if (el.sliderMasterGain) el.sliderMasterGain.value = '1';
    if (el.valCenterDb) el.valCenterDb.textContent = '+0.0 dB';
    if (el.valLfeDb) el.valLfeDb.textContent = '+0.0 dB';
    if (el.valSurroundDb) el.valSurroundDb.textContent = '+0.0 dB';
    if (el.valMasterGain) el.valMasterGain.textContent = '100%';
    applyEngineSettings();
  });

  const speakerTargetMap = {
    C: { slider: el.sliderCenterDb, label: 'Merkez Kanal (Diyalog)' },
    LFE: { slider: el.sliderLfeDb, label: 'Subwoofer (LFE Bas)' },
    LS: { slider: el.sliderSurroundDb, label: 'Sol Surround (LS)' },
    RS: { slider: el.sliderSurroundDb, label: 'Sağ Surround (RS)' },
    L: { slider: el.sliderMasterGain, label: 'Sol Ön Kanal (L)' },
    R: { slider: el.sliderMasterGain, label: 'Sağ Ön Kanal (R)' },
  };
  for (const ch of CHANNELS) {
    speakerEls[ch]?.addEventListener('click', () => {
      const target = speakerTargetMap[ch];
      target?.slider?.focus();
      if (target) showToast(`${target.label} seçildi`, 1800);
    });
  }

  // Bottom bar popovers (Audio Track & Subtitles)
  el.btnAudioTracks?.addEventListener('click', (e) => {
    e.stopPropagation();
    el.subtitleMenu?.classList.add('hidden');
    el.audioTrackMenu?.classList.toggle('hidden');
  });

  el.btnSubtitles?.addEventListener('click', (e) => {
    e.stopPropagation();
    el.audioTrackMenu?.classList.add('hidden');
    el.subtitleMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    const target = /** @type {Node | null} */ (e.target);
    if (
      el.subtitleMenu &&
      !el.subtitleMenu.classList.contains('hidden') &&
      target &&
      !el.subtitleMenu.contains(target) &&
      target !== el.btnSubtitles
    ) {
      el.subtitleMenu.classList.add('hidden');
    }
    if (
      el.audioTrackMenu &&
      !el.audioTrackMenu.classList.contains('hidden') &&
      target &&
      !el.audioTrackMenu.contains(target) &&
      target !== el.btnAudioTracks
    ) {
      el.audioTrackMenu.classList.add('hidden');
    }
  });

  const openSubUpload = () => el.subtitleFileInput?.click();
  el.btnUploadSubtitle?.addEventListener('click', openSubUpload);
  el.btnMenuUploadSub?.addEventListener('click', openSubUpload);
  el.subtitleFileInput?.addEventListener('change', () => {
    const file = el.subtitleFileInput?.files?.[0];
    if (file) handleLocalSubtitleUpload(file);
    if (el.subtitleFileInput) el.subtitleFileInput.value = '';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'arrowleft':
        e.preventDefault();
        seekTo(getCurrentPlaybackTime() - 10);
        break;
      case 'arrowright':
        e.preventDefault();
        seekTo(getCurrentPlaybackTime() + 10);
        break;
      case 'arrowup':
        e.preventDefault();
        el.video.volume = Math.min(1, el.video.volume + 0.05);
        el.video.muted = false;
        updateVolumeUi();
        break;
      case 'arrowdown':
        e.preventDefault();
        el.video.volume = Math.max(0, el.video.volume - 0.05);
        updateVolumeUi();
        break;
      case 'm':
        toggleMute();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 's':
        toggleDrawerTab('studio');
        break;
      case 'i':
        setStatsOpen(!state.statsOpen);
        break;
      case 'escape':
        if (!el.embedModal?.classList.contains('hidden')) closeEmbedModal();
        else if (state.statsOpen) setStatsOpen(false);
        break;
    }
  });
}

// ============================================================================
// Initialization & URL Parameters (?magnet=...&embed=1)
// ============================================================================

function init() {
  initPieceMapSegments();
  setupFpsTracker();
  bindEvents();
  startVisualizerLoop();
  populateAudioTracksUi();
  populateSubtitlesList();

  const params = new URLSearchParams(globalThis.location.search);
  const embedParam = params.get('embed');
  const magnetParam = params.get('magnet');
  const fileParam = params.get('file');

  state.isEmbed = embedParam === '1' || embedParam === 'true';
  if (state.isEmbed) {
    el.body.classList.add('embed-mode');
  }

  // Keep side drawer closed by default in both standalone & embed modes
  setDrawerState(false, 'studio');

  if (fileParam !== null && /^\d+$/.test(fileParam)) {
    state.requestedFileIndex = Number(fileParam);
  }

  if (magnetParam && magnetParam.trim()) {
    const cleanMagnet = magnetParam.trim();
    if (el.magnetInput) el.magnetInput.value = cleanMagnet;
    if (el.embedMagnetInput) el.embedMagnetInput.value = cleanMagnet;
    void addTorrent({ magnet: cleanMagnet });
  }
}

init();

import WebTorrent from "webtorrent";
import { Buffer } from "node:buffer";
import { extname, join, normalize, resolve, sep } from "node:path";

const PORT = Number(Deno.env.get("PORT") || "8080");
const HOST = Deno.env.get("HOST") || "0.0.0.0";
const TORRENT_TTL_MINUTES = Math.max(5, Number(Deno.env.get("TORRENT_TTL_MINUTES") || "60") || 60);
const TORRENT_TTL_MS = TORRENT_TTL_MINUTES * 60_000;
const PUBLIC_DIR = resolve(Deno.cwd(), "public");
const CACHE_DIR = resolve(Deno.cwd(), ".torrent-cache");
const DEMO_FILENAME = "demo-5.1-v2.mkv";
const DEMO_PATH = join(CACHE_DIR, DEMO_FILENAME);

const DEFAULT_TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://exodus.desync.com:6969/announce",
  "wss://tracker.openwebtorrent.com",
  "wss://tracker.btorrent.xyz",
];

const VIDEO_EXTS = new Set([
  ".mp4",
  ".mkv",
  ".webm",
  ".avi",
  ".mov",
  ".m4v",
  ".ts",
  ".m2ts",
  ".mts",
  ".flv",
  ".wmv",
  ".mpg",
  ".mpeg",
  ".ogv",
  ".3gp",
]);

const SUBTITLE_EXTS = new Set([
  ".srt",
  ".vtt",
  ".ass",
  ".ssa",
  ".sub",
  ".idx",
]);

const STATIC_MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".vtt": "text/vtt; charset=utf-8",
};

const MEDIA_MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mov": "video/quicktime",
  ".ts": "video/mp2t",
  ".m2ts": "video/mp2t",
  ".mts": "video/mp2t",
  ".ogv": "video/ogg",
  ".flv": "video/x-flv",
  ".wmv": "video/x-ms-wmv",
  ".mpg": "video/mpeg",
  ".mpeg": "video/mpeg",
  ".3gp": "video/3gpp",
  ".mp3": "audio/mpeg",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".ogg": "audio/ogg",
  ".opus": "audio/opus",
  ".srt": "application/x-subrip; charset=utf-8",
  ".vtt": "text/vtt; charset=utf-8",
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range",
  "Access-Control-Expose-Headers":
    "Content-Range, Content-Length, Accept-Ranges, Content-Type, Content-Disposition",
};

// deno-lint-ignore no-explicit-any
type TorrentInstance = any;
// deno-lint-ignore no-explicit-any
type TorrentFile = any;
// deno-lint-ignore no-explicit-any
type WebTorrentClient = any;

interface TorrentFileSummary {
  index: number;
  name: string;
  path: string;
  length: number;
  isVideo: boolean;
  isSubtitle: boolean;
}

interface TorrentAddResponse {
  infoHash: string;
  name: string;
  files: TorrentFileSummary[];
  mainVideoIndex: number;
  videoFileCount: number;
  selectedFileIndex: number | null;
}

interface ProbeVideoStream {
  index: number;
  codec: string;
  codecLongName: string;
  profile: string;
  width: number;
  height: number;
  fps: number;
  bitDepth: number;
  pixFmt: string;
  colorSpace: string;
  colorTransfer: string;
  colorPrimaries: string;
  hdr: boolean;
  hdrFormat: string;
  bitrate: number;
}

interface ProbeAudioStream {
  index: number;
  audioOrder: number;
  codec: string;
  codecLongName: string;
  profile: string;
  channels: number;
  channelLayout: string;
  sampleRate: number;
  bitrate: number;
  language: string;
  title: string;
  isAtmos: boolean;
  isSurround51: boolean;
  isLossless: boolean;
  label: string;
}

interface ProbeSubtitleStream {
  index: number;
  subOrder: number;
  codec: string;
  language: string;
  title: string;
}

interface ProbeChapter {
  id: number;
  startTime: number;
  endTime: number;
  title: string;
}

interface ProbeResponse {
  duration: number;
  container: string;
  bitrate: number;
  chapters: ProbeChapter[];
  video: ProbeVideoStream[];
  audio: ProbeAudioStream[];
  subtitles: ProbeSubtitleStream[];
  detectedTechnologies: string[];
}

interface PreparedSubtitleItem {
  id: string;
  kind: "embedded" | "torrent";
  subOrder?: number;
  fileIndex?: number;
  language: string;
  title: string;
  codec: string;
  label: string;
  vttUrl: string;
  ready: boolean;
  vttContent?: string;
}

interface TorrentPieceTracker {
  selectedFileIndex: number | null;
  headerFooterPrioritized: Set<number>;
  headerFooterRanges: Array<{ from: number; to: number }>;
  slidingWindows: Map<number, { from: number; to: number }>;
  lastAccessedAt: number;
}

const pieceTrackers = new Map<string, TorrentPieceTracker>();
const probeCache = new Map<string, ProbeResponse>();
const vttCache = new Map<string, string>();
let demoSeedPromise: Promise<TorrentInstance> | null = null;
let actualListeningPort = PORT;

await Deno.mkdir(CACHE_DIR, { recursive: true });

function createWebTorrentClient(): WebTorrentClient {
  const client: WebTorrentClient = new WebTorrent({
    utp: false,
    tracker: {
      announce: DEFAULT_TRACKERS,
    },
    dht: true,
    webSeeds: true,
  });

  client.on("error", (err: unknown) => {
    console.error("[WebTorrent] Client error:", err instanceof Error ? err.message : err);
  });

  return client;
}

const client: WebTorrentClient = createWebTorrentClient();

function isVideoFile(name: string): boolean {
  return VIDEO_EXTS.has(extname(name).toLowerCase());
}

function isSubtitleFile(name: string): boolean {
  return SUBTITLE_EXTS.has(extname(name).toLowerCase());
}

function getMediaMimeType(name: string, fallbackType?: string): string {
  const ext = extname(name).toLowerCase();
  return MEDIA_MIME_TYPES[ext] || fallbackType || "application/octet-stream";
}

function getStaticMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  return STATIC_MIME_TYPES[ext] || "application/octet-stream";
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function errorResponse(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return jsonResponse({ error: message, ...extra }, status);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getTracker(infoHash: string): TorrentPieceTracker {
  const key = infoHash.toLowerCase();
  let tracker = pieceTrackers.get(key);
  if (!tracker) {
    tracker = {
      selectedFileIndex: null,
      headerFooterPrioritized: new Set<number>(),
      headerFooterRanges: [],
      slidingWindows: new Map<number, { from: number; to: number }>(),
      lastAccessedAt: Date.now(),
    };
    pieceTrackers.set(key, tracker);
  } else {
    tracker.lastAccessedAt = Date.now();
  }
  return tracker;
}

// Periodically evict inactive torrents & delete their downloaded files from disk
setInterval(() => {
  const now = Date.now();
  for (const t of [...client.torrents]) {
    if (!t || t.destroyed || !t.infoHash) continue;
    const key = t.infoHash.toLowerCase();
    const tracker = pieceTrackers.get(key);
    const lastActive = tracker?.lastAccessedAt ?? now;
    if (now - lastActive < TORRENT_TTL_MS) continue;

    const torrentPath = typeof t.path === "string" ? t.path : "";
    console.log(`[Cleanup] Removing inactive torrent ${key} (idle > ${TORRENT_TTL_MINUTES}m)`);
    try {
      t.destroy({ destroyStore: true }, () => {
        if (torrentPath) {
          Deno.remove(torrentPath, { recursive: true }).catch(() => {});
        }
      });
    } catch {
      if (torrentPath) {
        Deno.remove(torrentPath, { recursive: true }).catch(() => {});
      }
    }
    pieceTrackers.delete(key);
  }
}, 5 * 60_000);

function attachTorrentListeners(torrent: TorrentInstance): void {
  if (!torrent || torrent._torrentStreamerListenersAttached) return;
  torrent._torrentStreamerListenersAttached = true;

  torrent.on("error", (err: unknown) => {
    console.error(
      `[Torrent ${torrent.infoHash || "pending"}] error:`,
      err instanceof Error ? err.message : err,
    );
  });

  torrent.on("warning", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("unsupported")) {
      console.warn(`[Torrent ${torrent.infoHash || "pending"}] warning:`, msg);
    }
  });

  torrent.once("close", () => {
    if (torrent.infoHash) {
      const key = torrent.infoHash.toLowerCase();
      pieceTrackers.delete(key);
      for (const cacheKey of probeCache.keys()) {
        if (cacheKey.startsWith(`${key}:`)) {
          probeCache.delete(cacheKey);
        }
      }
      for (const cacheKey of vttCache.keys()) {
        if (cacheKey.startsWith(`${key}:`)) {
          vttCache.delete(cacheKey);
        }
      }
    }
  });
}

function findTorrentByHash(infoHash: string): TorrentInstance | null {
  const target = infoHash.trim().toLowerCase();
  if (!target) return null;
  for (const t of client.torrents) {
    if (!t.destroyed && typeof t.infoHash === "string" && t.infoHash.toLowerCase() === target) {
      return t;
    }
  }
  return null;
}

function computeMainVideoIndex(files: TorrentFile[]): number {
  let bestIdx = 0;
  let bestLength = -1;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (isVideoFile(f.name) && f.length > bestLength) {
      bestLength = f.length;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function formatTorrentAddPayload(torrent: TorrentInstance): TorrentAddResponse {
  const files: TorrentFileSummary[] = (torrent.files || []).map(
    (f: TorrentFile, index: number) => ({
      index,
      name: f.name,
      path: f.path,
      length: f.length,
      isVideo: isVideoFile(f.name),
      isSubtitle: isSubtitleFile(f.name),
    }),
  );
  const mainVideoIndex = computeMainVideoIndex(torrent.files || []);
  const videoFileCount = files.filter((f) => f.isVideo).length;
  const tracker = torrent.infoHash ? getTracker(torrent.infoHash) : null;
  return {
    infoHash: torrent.infoHash,
    name: torrent.name || torrent.infoHash,
    files,
    mainVideoIndex,
    videoFileCount,
    selectedFileIndex: tracker ? tracker.selectedFileIndex : null,
  };
}

function selectSmallSubtitles(torrent: TorrentInstance): void {
  if (!torrent || torrent.destroyed || !torrent.ready || !torrent.pieces?.length) return;
  const maxPiece = torrent.pieces.length - 1;
  for (let i = 0; i < (torrent.files?.length || 0); i++) {
    const subFile: TorrentFile = torrent.files[i];
    if (
      isSubtitleFile(subFile.name) &&
      subFile.length > 0 &&
      subFile.length < 5 * 1024 * 1024
    ) {
      const sp = clamp(subFile._startPiece ?? 0, 0, maxPiece);
      const ep = clamp(subFile._endPiece ?? maxPiece, sp, maxPiece);
      try {
        torrent.select(sp, ep, 25);
        torrent.critical(sp, ep);
      } catch {
        // Ignore selection errors for zero-piece edge cases
      }
    }
  }
}

function deselectAllFiles(torrent: TorrentInstance): void {
  if (!torrent || torrent.destroyed || !torrent.ready) return;
  const tracker = getTracker(torrent.infoHash);
  tracker.headerFooterPrioritized.clear();

  for (const r of tracker.headerFooterRanges) {
    try {
      torrent._deselect(r.from, r.to, true);
    } catch {
      // Ignore already deselected range
    }
  }
  tracker.headerFooterRanges = [];

  for (const w of tracker.slidingWindows.values()) {
    try {
      torrent._deselect(w.from, w.to, true);
    } catch {
      // Ignore already deselected range
    }
  }
  tracker.slidingWindows.clear();

  if (torrent.pieces?.length > 0) {
    try {
      torrent.deselect(0, torrent.pieces.length - 1, false);
    } catch {
      // Ignore
    }
  }
  for (const f of torrent.files || []) {
    try {
      f.deselect();
    } catch {
      // Ignore
    }
  }
  if (Array.isArray(torrent._critical)) {
    torrent._critical.length = 0;
  }
}

function selectOnlyFile(torrent: TorrentInstance, fileIndex: number): void {
  if (!torrent || torrent.destroyed || !torrent.ready || !torrent.pieces?.length) return;
  const file: TorrentFile | undefined = torrent.files?.[fileIndex];
  if (!file) return;

  const tracker = getTracker(torrent.infoHash);
  deselectAllFiles(torrent);

  const maxPiece = torrent.pieces.length - 1;
  if (file.length > 0) {
    const startPiece = clamp(file._startPiece ?? 0, 0, maxPiece);
    const endPiece = clamp(file._endPiece ?? maxPiece, startPiece, maxPiece);
    try {
      file.select();
      torrent.select(startPiece, endPiece, 1);
    } catch (err) {
      console.warn("[SelectOnlyFile] error:", err instanceof Error ? err.message : err);
    }
  }

  selectSmallSubtitles(torrent);
  tracker.selectedFileIndex = fileIndex;
  prioritizeFileHeaderFooter(torrent, fileIndex);
}

function prioritizeFileHeaderFooter(torrent: TorrentInstance, fileIndex: number): void {
  if (!torrent || torrent.destroyed || !torrent.ready || !torrent.pieces?.length) return;
  const file: TorrentFile | undefined = torrent.files?.[fileIndex];
  if (!file || file.length <= 0) return;

  const tracker = getTracker(torrent.infoHash);
  if (tracker.headerFooterPrioritized.has(fileIndex)) return;
  tracker.headerFooterPrioritized.add(fileIndex);

  const maxPiece = torrent.pieces.length - 1;
  const startPiece = clamp(file._startPiece ?? 0, 0, maxPiece);
  const endPiece = clamp(file._endPiece ?? maxPiece, startPiece, maxPiece);

  try {
    // Only select the full file if it is the chosen file; otherwise keep unselected and only fetch headers.
    if (tracker.selectedFileIndex === fileIndex) {
      torrent.select(startPiece, endPiece, 1);
    }
    selectSmallSubtitles(torrent);

    if (torrent.done || file.done) return;

    const totalFilePieces = endPiece - startPiece + 1;
    const headCount = Math.max(1, Math.ceil(totalFilePieces * 0.02));
    const tailCount = Math.max(1, Math.ceil(totalFilePieces * 0.01));

    const headStart = startPiece;
    const headEnd = Math.min(endPiece, headStart + headCount - 1);
    const tailEnd = endPiece;
    const tailStart = Math.max(startPiece, tailEnd - tailCount + 1);

    // Stream-flagged selections avoid interval merging with the base 1 priority selection.
    torrent._select(headStart, headEnd, 20, null, true);
    tracker.headerFooterRanges.push({ from: headStart, to: headEnd });
    torrent.critical(headStart, Math.min(headEnd, headStart + 3));

    if (tailStart > headEnd) {
      torrent._select(tailStart, tailEnd, 15, null, true);
      tracker.headerFooterRanges.push({ from: tailStart, to: tailEnd });
      torrent.critical(Math.max(tailStart, tailEnd - 1), tailEnd);
    }
  } catch (err) {
    console.warn("[Prioritize] header/footer selection error:", err instanceof Error ? err.message : err);
  }
}

function updateSlidingWindow(
  torrent: TorrentInstance,
  fileIndex: number,
  byteStart: number,
  byteEnd: number,
): void {
  if (!torrent || torrent.destroyed || !torrent.ready || !torrent.pieces?.length || torrent.done) return;
  const trackerCheck = getTracker(torrent.infoHash);
  if (trackerCheck.selectedFileIndex !== null && trackerCheck.selectedFileIndex !== fileIndex) {
    return;
  }
  const file: TorrentFile | undefined = torrent.files?.[fileIndex];
  if (!file || file.length <= 0 || file.done) return;

  const pieceLength = torrent.pieceLength || 16384;
  const maxPiece = torrent.pieces.length - 1;
  const fileStartPiece = clamp(file._startPiece ?? 0, 0, maxPiece);
  const fileEndPiece = clamp(file._endPiece ?? maxPiece, fileStartPiece, maxPiece);

  const reqStartPiece = clamp(
    Math.floor((byteStart + file.offset) / pieceLength),
    fileStartPiece,
    fileEndPiece,
  );
  const reqEndPiece = clamp(
    Math.floor((byteEnd + file.offset) / pieceLength),
    reqStartPiece,
    fileEndPiece,
  );

  // Look ahead ~16 MB (minimum 8 pieces) sequentially from the requested playhead byte offset.
  const lookaheadCount = Math.max(8, Math.ceil((16 * 1024 * 1024) / pieceLength));
  const winStart = reqStartPiece;
  const winEnd = Math.min(fileEndPiece, Math.max(reqEndPiece, winStart + lookaheadCount - 1));

  const tracker = getTracker(torrent.infoHash);
  const prev = tracker.slidingWindows.get(fileIndex);
  if (prev && prev.from === winStart && prev.to === winEnd) {
    return;
  }

  try {
    if (prev) {
      torrent._deselect(prev.from, prev.to, true);
    }
    torrent._select(winStart, winEnd, 10, null, true);
    torrent.critical(winStart, Math.min(winEnd, winStart + 2));
    tracker.slidingWindows.set(fileIndex, { from: winStart, to: winEnd });
  } catch (err) {
    console.warn("[Prioritize] sliding window error:", err instanceof Error ? err.message : err);
  }
}

function buildPieceMap(torrent: TorrentInstance, mainFile: TorrentFile | undefined): number[] {
  const BUCKETS = 100;
  if (!torrent || torrent.destroyed || !torrent.ready || !torrent.bitfield || !torrent.pieces?.length) {
    return new Array<number>(BUCKETS).fill(0);
  }

  const maxPiece = torrent.pieces.length - 1;
  const rangeStart = mainFile && mainFile.length > 0 ? clamp(mainFile._startPiece ?? 0, 0, maxPiece) : 0;
  const rangeEnd = mainFile && mainFile.length > 0 ? clamp(mainFile._endPiece ?? maxPiece, rangeStart, maxPiece) : maxPiece;
  const totalCount = Math.max(1, rangeEnd - rangeStart + 1);

  const prioritized = new Uint8Array(totalCount);
  if (torrent._selections) {
    for (const sel of torrent._selections) {
      if ((sel.priority ?? 0) > 0 || sel.isStreamSelection) {
        const s = Math.max(rangeStart, sel.from);
        const e = Math.min(rangeEnd, sel.to);
        for (let p = s; p <= e; p++) {
          prioritized[p - rangeStart] = 1;
        }
      }
    }
  }
  if (Array.isArray(torrent._critical)) {
    for (let p = rangeStart; p <= rangeEnd; p++) {
      if (torrent._critical[p]) {
        prioritized[p - rangeStart] = 1;
      }
    }
  }

  const map = new Array<number>(BUCKETS);
  for (let b = 0; b < BUCKETS; b++) {
    const bStart = rangeStart + Math.floor((b * totalCount) / BUCKETS);
    const bEnd = clamp(
      rangeStart + Math.floor(((b + 1) * totalCount) / BUCKETS) - 1,
      bStart,
      rangeEnd,
    );

    let allVerified = true;
    let anyVerified = false;
    let anyActive = false;

    for (let p = bStart; p <= bEnd; p++) {
      if (torrent.bitfield.get(p)) {
        anyVerified = true;
      } else {
        allVerified = false;
        const piece = torrent.pieces[p];
        if ((piece && piece.missing < piece.length) || prioritized[p - rangeStart] === 1) {
          anyActive = true;
        }
      }
    }

    if (allVerified) {
      map[b] = 2;
    } else if (anyVerified || anyActive) {
      map[b] = 1;
    } else {
      map[b] = 0;
    }
  }

  return map;
}

function waitForTorrentReady(torrent: TorrentInstance, timeoutMs = 35_000): Promise<TorrentInstance> {
  if (torrent.ready) return Promise.resolve(torrent);
  if (torrent.destroyed) return Promise.reject(new Error("Torrent was destroyed"));

  return new Promise((resolveReady, rejectReady) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectReady(new Error("Timed out waiting for torrent metadata"));
    }, timeoutMs);

    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolveReady(torrent);
    };

    const onError = (err: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectReady(err instanceof Error ? err : new Error(String(err)));
    };

    const onClose = () => {
      if (settled) return;
      settled = true;
      cleanup();
      rejectReady(new Error("Torrent closed before becoming ready"));
    };

    const cleanup = () => {
      clearTimeout(timer);
      torrent.removeListener("ready", onReady);
      torrent.removeListener("error", onError);
      torrent.removeListener("close", onClose);
    };

    torrent.once("ready", onReady);
    torrent.once("error", onError);
    torrent.once("close", onClose);
  });
}

function parseFps(raw: unknown): number {
  const str = String(raw || "").trim();
  if (!str) return 0;
  if (str.includes("/")) {
    const [numStr, denStr] = str.split("/");
    const num = Number(numStr);
    const den = Number(denStr);
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0 && num > 0) {
      return Math.round((num / den) * 100) / 100;
    }
    return 0;
  }
  const val = Number(str);
  return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : 0;
}

// deno-lint-ignore no-explicit-any
function detectHdrFormat(stream: any): string {
  const transfer = String(stream.color_transfer || "").toLowerCase();
  const tag = String(stream.codec_tag_string || "").toLowerCase();
  if (tag === "dvhe" || tag === "dvh1" || tag === "dav1") return "Dolby Vision";

  if (Array.isArray(stream.side_data_list)) {
    for (const sd of stream.side_data_list) {
      const sdType = String(sd?.side_data_type || "").toLowerCase();
      if (sdType.includes("dolby vision")) return "Dolby Vision";
      if (sdType.includes("hdr10+") || sdType.includes("smpte2094") || sdType.includes("dynamic hdr")) {
        return "HDR10+";
      }
    }
  }

  if (transfer === "smpte2084") return "HDR10";
  if (transfer === "arib-std-b67") return "HLG";
  return "SDR";
}

function formatVideoCodecPill(codec: string): string {
  const c = codec.toLowerCase();
  if (c === "h264" || c === "avc") return "H.264";
  if (c === "hevc" || c === "h265") return "HEVC / H.265";
  if (c === "av1") return "AV1";
  if (c === "vp9") return "VP9";
  return codec.toUpperCase();
}

function formatAudioCodecPill(codec: string): string {
  const c = codec.toLowerCase();
  if (c === "eac3") return "E-AC-3";
  if (c === "ac3") return "AC-3";
  if (c === "truehd") return "Dolby TrueHD";
  if (c === "dts") return "DTS";
  if (c === "aac") return "AAC";
  if (c === "opus") return "Opus";
  if (c === "flac") return "FLAC";
  return codec.toUpperCase();
}

function buildDetectedTechnologies(
  video: ProbeVideoStream[],
  audio: ProbeAudioStream[],
  subtitles: ProbeSubtitleStream[],
): string[] {
  const pills: string[] = [];
  const pushUnique = (label: string) => {
    if (label && !pills.includes(label)) pills.push(label);
  };

  const v = video[0];
  if (v) {
    if (v.height >= 2160 || v.width >= 3800) pushUnique("4K UHD");
    else if (v.height >= 1440 || v.width >= 2500) pushUnique("1440p QHD");
    else if (v.height >= 1080 || v.width >= 1900) pushUnique("1080p FHD");
    else if (v.height >= 720 || v.width >= 1200) pushUnique("720p HD");
    else if (v.height > 0) pushUnique(`${v.height}p`);

    if (v.fps > 0) pushUnique(`${v.fps} FPS`);
    pushUnique(v.hdrFormat || "SDR");
    if (v.bitDepth >= 10) pushUnique(`${v.bitDepth}-Bit`);
    pushUnique(formatVideoCodecPill(v.codec));
  }

  if (audio.length > 0) {
    const hasAtmos = audio.some((a) => a.isAtmos);
    const maxChannels = Math.max(...audio.map((a) => a.channels || 0));
    const hasSurround = audio.some((a) => a.isSurround51);

    if (hasAtmos) pushUnique("Dolby Atmos");
    if (maxChannels >= 8) pushUnique("7.1 Surround");
    else if (hasSurround || maxChannels >= 6) pushUnique("5.1 Surround");
    else pushUnique("Stereo");

    for (const a of audio) {
      pushUnique(formatAudioCodecPill(a.codec));
    }

    if (audio.length > 1) {
      pushUnique(`Çoklu Ses İzi (${audio.length})`);
    }
  }

  if (subtitles.length > 0) {
    pushUnique(`Altyazı (${subtitles.length})`);
  }

  return pills;
}

function buildAudioLabel(
  codec: string,
  channels: number,
  language: string,
  title: string,
  isAtmos: boolean,
): string {
  const langTag = language && language !== "und" ? `[${language.toUpperCase()}] ` : "";
  const titlePart = title ? `${title} — ` : "";
  const chTag = channels === 8
    ? "7.1"
    : channels >= 6
    ? "5.1"
    : channels === 1
    ? "Mono"
    : "Stereo";
  const atmosTag = isAtmos ? " (Dolby Atmos)" : "";
  return `${langTag}${titlePart}${codec.toUpperCase()} ${chTag}${atmosTag}`.trim();
}

async function runProbe(infoHash: string, fileIndex: number, signal?: AbortSignal): Promise<ProbeResponse> {
  const cacheKey = `${infoHash.toLowerCase()}:${fileIndex}`;
  const cached = probeCache.get(cacheKey);
  if (cached) return cached;

  const streamUrl = `http://127.0.0.1:${actualListeningPort}/api/stream/${infoHash}/${fileIndex}`;
  const timeoutSignal = AbortSignal.timeout(45_000);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const cmd = new Deno.Command("ffprobe", {
    args: [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      "-show_chapters",
      "-probesize",
      "5M",
      "-analyzeduration",
      "5M",
      streamUrl,
    ],
    stdout: "piped",
    stderr: "piped",
    signal: combinedSignal,
  });

  const output = await cmd.output();
  if (!output.success) {
    const errText = new TextDecoder().decode(output.stderr).trim();
    throw new Error(errText || `ffprobe failed with exit code ${output.code}`);
  }

  const rawJson = new TextDecoder().decode(output.stdout);
  // deno-lint-ignore no-explicit-any
  const parsed: any = JSON.parse(rawJson || "{}");
  // deno-lint-ignore no-explicit-any
  const streams: any[] = Array.isArray(parsed.streams) ? parsed.streams : [];
  // deno-lint-ignore no-explicit-any
  const rawChapters: any[] = Array.isArray(parsed.chapters) ? parsed.chapters : [];

  const video: ProbeVideoStream[] = [];
  const audio: ProbeAudioStream[] = [];
  const subtitles: ProbeSubtitleStream[] = [];

  let audioOrder = 0;
  let subOrder = 0;

  for (const s of streams) {
    const type = String(s.codec_type || "");
    if (type === "video") {
      if (s.disposition?.attached_pic === 1) continue;
      const pixFmt = String(s.pix_fmt || "");
      const rawDepth = Number(s.bits_per_raw_sample || 0);
      const bitDepth = rawDepth > 0
        ? rawDepth
        : pixFmt.includes("12")
        ? 12
        : pixFmt.includes("10")
        ? 10
        : 8;
      const fps = parseFps(s.avg_frame_rate) || parseFps(s.r_frame_rate);
      const hdrFormat = detectHdrFormat(s);
      video.push({
        index: Number(s.index ?? 0),
        codec: String(s.codec_name || "unknown"),
        codecLongName: String(s.codec_long_name || s.codec_name || "Unknown"),
        profile: String(s.profile || ""),
        width: Number(s.width || 0),
        height: Number(s.height || 0),
        fps,
        bitDepth,
        pixFmt,
        colorSpace: String(s.color_space || ""),
        colorTransfer: String(s.color_transfer || ""),
        colorPrimaries: String(s.color_primaries || ""),
        hdr: hdrFormat !== "SDR",
        hdrFormat,
        bitrate: Number(s.bit_rate || s.tags?.BPS || 0) || 0,
      });
    } else if (type === "audio") {
      const codec = String(s.codec_name || "unknown");
      const profile = String(s.profile || "");
      const codecLongName = String(s.codec_long_name || codec);
      const channels = Number(s.channels || 2);
      const channelLayout = String(s.channel_layout || "");
      const sampleRate = Number(s.sample_rate || 0);
      const bitrate = Number(s.bit_rate || s.tags?.BPS || 0) || 0;
      const language = String(s.tags?.language || "und");
      const title = String(s.tags?.title || s.tags?.HANDLER_NAME || "");
      const profileStr = `${profile} ${codecLongName} ${title}`;
      const isAtmos = /atmos|joc/i.test(profileStr);
      const isSurround51 = channels >= 6 || /5\.1|6\.1|7\.1/i.test(channelLayout);
      const cLower = codec.toLowerCase();
      const isLossless =
        ["truehd", "mlp", "flac", "alac", "wavpack"].includes(cLower) ||
        cLower.startsWith("pcm_") ||
        /ma|master audio/i.test(profile);

      audio.push({
        index: Number(s.index ?? 0),
        audioOrder: audioOrder++,
        codec,
        codecLongName,
        profile,
        channels,
        channelLayout,
        sampleRate,
        bitrate,
        language,
        title,
        isAtmos,
        isSurround51,
        isLossless,
        label: buildAudioLabel(codec, channels, language, title, isAtmos),
      });
    } else if (type === "subtitle") {
      subtitles.push({
        index: Number(s.index ?? 0),
        subOrder: subOrder++,
        codec: String(s.codec_name || "unknown"),
        language: String(s.tags?.language || "und"),
        title: String(s.tags?.title || ""),
      });
    }
  }

  let duration = Number(parsed.format?.duration || 0);
  if (!Number.isFinite(duration) || duration <= 0) {
    const firstDur = Number(streams.find((s) => Number(s.duration) > 0)?.duration || 0);
    duration = Number.isFinite(firstDur) ? firstDur : 0;
  }

  const chapters: ProbeChapter[] = rawChapters.map((c, idx) => ({
    id: Number(c.id ?? idx),
    startTime: Number(c.start_time || 0) || 0,
    endTime: Number(c.end_time || 0) || 0,
    title: String(c.tags?.title || `Bölüm ${idx + 1}`),
  }));

  const container = String(parsed.format?.format_name || "unknown");
  const bitrate = Number(parsed.format?.bit_rate || 0) || 0;
  const detectedTechnologies = buildDetectedTechnologies(video, audio, subtitles);

  const result: ProbeResponse = {
    duration,
    container,
    bitrate,
    chapters,
    video,
    audio,
    subtitles,
    detectedTechnologies,
  };

  if (video.length > 0 || audio.length > 0) {
    probeCache.set(cacheKey, result);
  }
  return result;
}

function parseByteRange(rangeHeader: string, fileLength: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());
  if (!match) return null;

  const [, startStr, endStr] = match;
  if (startStr === "" && endStr === "") return null;

  let start: number;
  let end: number;

  if (startStr === "") {
    const suffixLength = Number(endStr);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, fileLength - suffixLength);
    end = fileLength - 1;
  } else {
    start = Number(startStr);
    end = endStr ? Math.min(fileLength - 1, Number(endStr)) : fileLength - 1;
  }

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start >= fileLength ||
    end < start
  ) {
    return null;
  }

  return { start, end };
}

function encodeRFC5987(str: string): string {
  return encodeURIComponent(str).replace(
    /['()*!]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function serveTorrentFile(
  req: Request,
  requestSignal: AbortSignal,
  infoHash: string,
  fileIndexStr: string,
  opts: { attachment?: boolean } = {},
): Response {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  const file: TorrentFile = torrent.files[fileIndex];
  if (!opts.attachment && isVideoFile(file.name)) {
    prioritizeFileHeaderFooter(torrent, fileIndex);
  }

  const mimeType = getMediaMimeType(file.name, file.type);
  const dispositionHeaders: Record<string, string> = {};
  if (opts.attachment) {
    const safeAscii = file.name.replace(/["\\\r\n]/g, "_");
    dispositionHeaders["Content-Disposition"] =
      `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeRFC5987(file.name)}`;
  }

  if (file.length === 0) {
    return new Response(req.method === "HEAD" ? null : new Uint8Array(0), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": "0",
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        ...dispositionHeaders,
      },
    });
  }

  const rangeHeader = req.headers.get("range");
  let start = 0;
  let end = file.length - 1;
  let status = 200;

  if (rangeHeader) {
    const parsed = parseByteRange(rangeHeader, file.length);
    if (!parsed) {
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${file.length}`,
        },
      });
    }
    start = parsed.start;
    end = parsed.end;
    status = 206;
  }

  if (!opts.attachment && isVideoFile(file.name)) {
    updateSlidingWindow(torrent, fileIndex, start, end);
  }

  const contentLength = end - start + 1;
  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Content-Length": String(contentLength),
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    ...dispositionHeaders,
  };
  if (status === 206) {
    headers["Content-Range"] = `bytes ${start}-${end}/${file.length}`;
  }

  if (req.method === "HEAD") {
    return new Response(null, { status, headers });
  }

  // deno-lint-ignore no-explicit-any
  let nodeStream: any = null;
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    requestSignal.removeEventListener("abort", cleanup);
    if (nodeStream) {
      try {
        nodeStream.destroy();
      } catch {
        // Ignore cleanup errors on closed stream
      }
      nodeStream = null;
    }
    if (streamController) {
      try {
        streamController.close();
      } catch {
        // Ignore already closed controller
      }
      streamController = null;
    }
  };

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
      if (requestSignal.aborted || torrent.destroyed) {
        cleanup();
        return;
      }

      try {
        nodeStream = file.createReadStream({ start, end });
      } catch (err) {
        cleanup();
        controller.error(err);
        return;
      }

      requestSignal.addEventListener("abort", cleanup, { once: true });

      nodeStream.on("data", (chunk: Uint8Array) => {
        if (closed) return;
        try {
          // Copy chunk slice so underlying Buffer pool slab reuse cannot mutate queued frames.
          controller.enqueue(new Uint8Array(chunk));
          if (controller.desiredSize !== null && controller.desiredSize <= 0) {
            nodeStream?.pause();
          }
        } catch {
          cleanup();
        }
      });

      nodeStream.on("end", () => {
        if (closed) return;
        closed = true;
        requestSignal.removeEventListener("abort", cleanup);
        nodeStream = null;
        try {
          controller.close();
        } catch {
          // Ignore if already closed
        }
      });

      nodeStream.on("error", (err: unknown) => {
        if (closed) return;
        closed = true;
        requestSignal.removeEventListener("abort", cleanup);
        nodeStream = null;
        try {
          controller.error(err);
        } catch {
          // Ignore if already errored/closed
        }
      });
    },
    pull() {
      if (!closed && nodeStream && typeof nodeStream.resume === "function") {
        nodeStream.resume();
      }
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(body, { status, headers });
}

async function handlePlayRequest(
  requestSignal: AbortSignal,
  url: URL,
  infoHash: string,
  fileIndexStr: string,
): Promise<Response> {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  const file: TorrentFile = torrent.files[fileIndex];
  if (isVideoFile(file.name)) {
    prioritizeFileHeaderFooter(torrent, fileIndex);
  }

  const rawTrack = Number.parseInt(url.searchParams.get("audioTrack") ?? "0", 10);
  const audioTrack = Number.isFinite(rawTrack) && rawTrack >= 0 ? rawTrack : 0;

  const rawAudioMode = url.searchParams.get("audioMode") || "surround51";
  const audioMode = rawAudioMode === "passthrough" || rawAudioMode === "stereo"
    ? rawAudioMode
    : "surround51";

  const rawVideoMode = url.searchParams.get("videoMode") || "copy";
  const videoMode = rawVideoMode === "transcode" ? "transcode" : "copy";

  const rawStart = Number(url.searchParams.get("start") ?? "0");
  const startSec = Number.isFinite(rawStart) && rawStart > 0 ? rawStart : 0;

  let sourceAudioChannels = 0;
  if (audioMode === "stereo") {
    try {
      const probe = await runProbe(torrent.infoHash, fileIndex, requestSignal);
      const track = probe.audio.find((a) => a.audioOrder === audioTrack) || probe.audio[audioTrack];
      sourceAudioChannels = track?.channels || 2;
    } catch {
      sourceAudioChannels = 2;
    }
  }

  if (requestSignal.aborted) {
    return errorResponse("Client disconnected", 499);
  }

  const streamUrl = `http://127.0.0.1:${actualListeningPort}/api/stream/${torrent.infoHash}/${fileIndex}`;
  const args: string[] = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-fflags",
    "+genpts",
    "-ss",
    String(startSec),
    "-i",
    streamUrl,
    "-map",
    "0:v:0",
    "-map",
    `0:a:${audioTrack}?`,
    "-avoid_negative_ts",
    "make_zero",
  ];

  if (videoMode === "transcode") {
    args.push("-c:v", "libx264", "-preset", "ultrafast", "-tune", "zerolatency", "-crf", "22", "-pix_fmt", "yuv420p");
  } else {
    args.push("-c:v", "copy");
  }

  let movflags = "frag_keyframe+empty_moov+default_base_moof+faststart";
  if (audioMode === "passthrough") {
    args.push("-c:a", "copy");
    // E-AC-3 / AC-3 bitstream copy into fMP4 requires delay_moov so dec3/dac3 boxes parse first packet.
    movflags = "frag_keyframe+delay_moov+default_base_moof";
  } else if (audioMode === "stereo") {
    if (sourceAudioChannels >= 6) {
      args.push(
        "-af",
        "pan=stereo|FL=0.5*FC+0.707*FL+0.707*BL+0.5*LFE|FR=0.5*FC+0.707*FR+0.707*BR+0.5*LFE,aresample=async=1:first_pts=0",
      );
    } else {
      args.push("-af", "aresample=async=1:first_pts=0");
    }
    args.push("-c:a", "aac", "-ac", "2", "-b:a", "256k");
  } else {
    args.push("-af", "aresample=async=1:first_pts=0");
    args.push("-c:a", "aac", "-ac", "6", "-b:a", "640k");
  }

  args.push("-muxdelay", "0", "-muxpreload", "0", "-f", "mp4", "-movflags", movflags, "pipe:1");

  const child = new Deno.Command("ffmpeg", {
    args,
    stdout: "piped",
    stderr: "null",
  }).spawn();

  child.status.catch(() => {});

  const reader = child.stdout.getReader();
  let killed = false;

  const killChild = () => {
    if (killed) return;
    killed = true;
    requestSignal.removeEventListener("abort", killChild);
    reader.cancel().catch(() => {});
    try {
      child.kill();
    } catch {
      // Child already exited
    }
  };

  requestSignal.addEventListener("abort", killChild, { once: true });

  let firstChunk: Uint8Array | null = null;
  try {
    const first = await reader.read();
    if (!first.done && first.value) {
      firstChunk = first.value;
    }
  } catch (err) {
    killChild();
    return errorResponse(
      `FFmpeg failed to start stream: ${err instanceof Error ? err.message : String(err)}`,
      500,
    );
  }

  if (!firstChunk) {
    killChild();
    return errorResponse("FFmpeg produced no output for stream", 500);
  }

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstChunk!);
    },
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          requestSignal.removeEventListener("abort", killChild);
          controller.close();
          return;
        }
        if (value) {
          controller.enqueue(value);
        }
      } catch (err) {
        killChild();
        try {
          controller.error(err);
        } catch {
          // Ignore already closed stream
        }
      }
    },
    cancel() {
      killChild();
    },
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}

const BITMAP_SUBTITLE_CODECS = new Set([
  "hdmv_pgs_subtitle",
  "pgssub",
  "dvd_subtitle",
  "vobsub",
  "dvb_subtitle",
  "xsub",
]);

function srtToVtt(rawText: string): string {
  const cleaned = rawText.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (/^WEBVTT/i.test(cleaned)) {
    return `${cleaned}\n`;
  }
  const converted = cleaned.replace(
    /(\d{1,2}:\d{2}:\d{2}),(\d{3})/g,
    "$1.$2",
  ).replace(
    /(\d{1,2}:\d{2}),(\d{3})/g,
    "00:$1.$2",
  );
  return `WEBVTT\n\n${converted}\n`;
}

function inferSubtitleLangFromFilename(name: string): string {
  const lower = name.toLowerCase();
  if (/(^|[._\-\s])(tur|tr|turkish|türkçe|turkce)([._\-\s]|$)/.test(lower)) return "tur";
  if (/(^|[._\-\s])(eng|en|english)([._\-\s]|$)/.test(lower)) return "eng";
  if (/(^|[._\-\s])(deu|ger|de|german)([._\-\s]|$)/.test(lower)) return "deu";
  if (/(^|[._\-\s])(fra|fre|fr|french)([._\-\s]|$)/.test(lower)) return "fra";
  if (/(^|[._\-\s])(spa|es|spanish)([._\-\s]|$)/.test(lower)) return "spa";
  return "und";
}

function buildSubtitleLabel(
  language: string,
  title: string,
  codec: string,
  kind: "embedded" | "torrent",
): string {
  const langTag = language && language !== "und" ? `[${language.toUpperCase()}] ` : "";
  const titlePart = title || (kind === "torrent" ? "Harici Altyazı" : "Gömülü Altyazı");
  const codecTag = codec ? ` (${codec.toUpperCase()})` : "";
  return `${langTag}${titlePart}${codecTag}`.trim();
}

async function convertTorrentSubFileToVtt(
  file: TorrentFile,
  signal?: AbortSignal,
): Promise<string> {
  const buf = await Promise.race([
    file.arrayBuffer(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Subtitle read timeout")), 8_000)),
  ]);
  const bytes = new Uint8Array(buf);
  const ext = extname(file.name).toLowerCase();

  if (ext === ".vtt" || ext === ".srt") {
    const text = new TextDecoder().decode(bytes);
    return srtToVtt(text);
  }

  const combinedSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
    : AbortSignal.timeout(15_000);

  const child = new Deno.Command("ffmpeg", {
    args: ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-f", "webvtt", "pipe:1"],
    stdin: "piped",
    stdout: "piped",
    stderr: "null",
    signal: combinedSignal,
  }).spawn();

  const writer = child.stdin.getWriter();
  writer.write(bytes).then(() => writer.close()).catch(() => {});

  const output = await child.output();
  if (!output.success || output.stdout.byteLength === 0) {
    throw new Error(`Failed to convert subtitle ${file.name} to WebVTT`);
  }
  return new TextDecoder().decode(output.stdout);
}

async function extractEmbeddedSubVtt(
  infoHash: string,
  fileIndex: number,
  subOrder: number,
  signal?: AbortSignal,
): Promise<string> {
  const cacheKey = `${infoHash.toLowerCase()}:${fileIndex}:${subOrder}`;
  const cached = vttCache.get(cacheKey);
  if (cached) return cached;

  const streamUrl = `http://127.0.0.1:${actualListeningPort}/api/stream/${infoHash}/${fileIndex}`;
  const timeoutSignal = AbortSignal.timeout(45_000);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  const output = await new Deno.Command("ffmpeg", {
    args: [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      streamUrl,
      "-map",
      `0:s:${subOrder}`,
      "-f",
      "webvtt",
      "pipe:1",
    ],
    stdout: "piped",
    stderr: "null",
    signal: combinedSignal,
  }).output();

  if (!output.success || output.stdout.byteLength === 0) {
    throw new Error(`Subtitle track ${subOrder} not found or failed to extract`);
  }

  const vttText = new TextDecoder().decode(output.stdout);
  vttCache.set(cacheKey, vttText);
  return vttText;
}

async function waitForSmallSubtitles(torrent: TorrentInstance, timeoutMs = 3_000): Promise<void> {
  const smallSubs = (torrent.files || []).filter(
    (f: TorrentFile) => isSubtitleFile(f.name) && f.length > 0 && f.length < 5 * 1024 * 1024,
  );
  if (smallSubs.length === 0 || smallSubs.every((f: TorrentFile) => f.done)) return;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !torrent.destroyed) {
    if (smallSubs.every((f: TorrentFile) => f.done)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function handleFileSubtitleRequest(
  requestSignal: AbortSignal,
  infoHash: string,
  subFileIndexStr: string,
): Promise<Response> {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const subFileIndex = Number(subFileIndexStr);
  if (!Number.isInteger(subFileIndex) || subFileIndex < 0 || subFileIndex >= torrent.files.length) {
    return errorResponse("Subtitle file index not found", 404);
  }

  const subFile: TorrentFile = torrent.files[subFileIndex];
  if (!isSubtitleFile(subFile.name)) {
    return errorResponse("Requested file is not a supported subtitle file", 400);
  }
  if (subFile.length > 25 * 1024 * 1024) {
    return errorResponse("Subtitle file is too large", 413);
  }

  if (torrent.pieces?.length > 0 && subFile.length > 0) {
    const maxPiece = torrent.pieces.length - 1;
    const sp = clamp(subFile._startPiece ?? 0, 0, maxPiece);
    const ep = clamp(subFile._endPiece ?? maxPiece, sp, maxPiece);
    try {
      torrent.select(sp, ep, 25);
      torrent.critical(sp, ep);
    } catch {
      // Ignore
    }
  }

  try {
    const vttText = await convertTorrentSubFileToVtt(subFile, requestSignal);
    return new Response(vttText, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Failed to load subtitle file",
      500,
    );
  }
}

async function handlePrepareSubtitlesRequest(
  requestSignal: AbortSignal,
  infoHash: string,
  fileIndexStr: string,
): Promise<Response> {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  selectSmallSubtitles(torrent);
  prioritizeFileHeaderFooter(torrent, fileIndex);

  await waitForSmallSubtitles(torrent, 3_000);

  let probe: ProbeResponse | null = null;
  try {
    probe = await runProbe(torrent.infoHash, fileIndex, requestSignal);
  } catch {
    probe = null;
  }

  const subtitles: PreparedSubtitleItem[] = [];

  // 1. External subtitle files from the torrent
  for (let i = 0; i < (torrent.files?.length || 0); i++) {
    const f: TorrentFile = torrent.files[i];
    if (!isSubtitleFile(f.name) || f.length <= 0) continue;

    const lang = inferSubtitleLangFromFilename(f.name);
    const codec = extname(f.name).slice(1).toLowerCase() || "srt";
    const vttUrl = `/api/subtitles/${encodeURIComponent(torrent.infoHash)}/file/${i}.vtt`;
    let ready = false;
    let vttContent: string | undefined;

    if (f.done && f.length < 5 * 1024 * 1024) {
      try {
        vttContent = await convertTorrentSubFileToVtt(f, requestSignal);
        ready = true;
      } catch {
        ready = false;
      }
    }

    subtitles.push({
      id: `torrent-${i}`,
      kind: "torrent",
      fileIndex: i,
      language: lang,
      title: f.name,
      codec,
      label: buildSubtitleLabel(lang, f.name, codec, "torrent"),
      vttUrl,
      ready,
      ...(vttContent !== undefined ? { vttContent } : {}),
    });
  }

  // 2. Embedded subtitle tracks from probe (prioritize Turkish, English, track 0; extract at least first 3)
  if (probe && probe.subtitles.length > 0) {
    const scoreLang = (sub: ProbeSubtitleStream): number => {
      const l = sub.language.toLowerCase();
      if (l === "tur" || l === "tr") return 0;
      if (l === "eng" || l === "en") return 1;
      if (sub.subOrder === 0) return 2;
      return 3 + sub.subOrder;
    };

    const sortedTextSubs = probe.subtitles
      .filter((s) => !BITMAP_SUBTITLE_CODECS.has(s.codec.toLowerCase()))
      .slice()
      .sort((a, b) => scoreLang(a) - scoreLang(b));

    const preExtractSet = new Set<number>(
      sortedTextSubs.slice(0, Math.max(3, Math.min(6, sortedTextSubs.length))).map((s) => s.subOrder),
    );

    const embeddedResults = await Promise.all(
      probe.subtitles.map(async (sub): Promise<PreparedSubtitleItem> => {
        const vttUrl =
          `/api/subtitles/${encodeURIComponent(torrent.infoHash)}/${fileIndex}/${sub.subOrder}.vtt`;
        const isBitmap = BITMAP_SUBTITLE_CODECS.has(sub.codec.toLowerCase());
        let ready = false;
        let vttContent: string | undefined;

        const targetFileDone = Boolean(torrent.files[fileIndex]?.done);
        if (!isBitmap && targetFileDone && preExtractSet.has(sub.subOrder)) {
          try {
            vttContent = await extractEmbeddedSubVtt(
              torrent.infoHash,
              fileIndex,
              sub.subOrder,
              requestSignal,
            );
            ready = true;
          } catch {
            ready = false;
          }
        }

        return {
          id: `embedded-${sub.subOrder}`,
          kind: "embedded",
          subOrder: sub.subOrder,
          language: sub.language,
          title: sub.title,
          codec: sub.codec,
          label: buildSubtitleLabel(sub.language, sub.title, sub.codec, "embedded"),
          vttUrl,
          ready,
          ...(vttContent !== undefined ? { vttContent } : {}),
        };
      }),
    );

    subtitles.push(...embeddedResults);
  }

  return jsonResponse({ subtitles }, 200);
}

async function handleSubtitleRequest(
  requestSignal: AbortSignal,
  infoHash: string,
  fileIndexStr: string,
  subSegment: string,
): Promise<Response> {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  const subMatch = /^(\d+)\.vtt$/i.exec(subSegment);
  if (!subMatch) return errorResponse("Invalid subtitle track path", 400);
  const subOrder = Number(subMatch[1]);

  prioritizeFileHeaderFooter(torrent, fileIndex);

  try {
    const vttText = await extractEmbeddedSubVtt(
      torrent.infoHash,
      fileIndex,
      subOrder,
      requestSignal,
    );
    return new Response(vttText, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return errorResponse("Subtitle track not found or failed to extract", 404);
  }
}

async function ensureDemoSampleTorrent(): Promise<TorrentInstance> {
  // Check if demo torrent is already loaded in WebTorrent
  for (const t of client.torrents) {
    if (
      !t.destroyed &&
      t.files?.some((f: TorrentFile) => f.name === DEMO_FILENAME)
    ) {
      if (!t.ready) await waitForTorrentReady(t, 20_000);
      return t;
    }
  }

  if (demoSeedPromise) {
    return await demoSeedPromise;
  }

  demoSeedPromise = (async () => {
    await Deno.mkdir(CACHE_DIR, { recursive: true });

    let needsGenerate = true;
    try {
      const stat = await Deno.stat(DEMO_PATH);
      if (stat.isFile && stat.size > 1024) {
        needsGenerate = false;
      }
    } catch {
      needsGenerate = true;
    }

    if (needsGenerate) {
      const srtTurPath = join(CACHE_DIR, "demo-5.1-v2-tur.srt");
      const srtEngPath = join(CACHE_DIR, "demo-5.1-v2-eng.srt");
      const tmpMkvPath = join(CACHE_DIR, "demo-5.1-v2.tmp.mkv");

      const srtTurContent = [
        "1",
        "00:00:00,200 --> 00:00:03,600",
        "Dolby Digital Plus 5.1 Surround — E-AC-3 Test",
        "",
        "2",
        "00:00:03,800 --> 00:00:07,800",
        "FL • FC • FR • LFE • LS • RS Kanal Tarama Testi",
        "",
      ].join("\n");

      const srtEngContent = [
        "1",
        "00:00:00,200 --> 00:00:03,600",
        "Dolby Digital Plus 5.1 Surround — E-AC-3 Audio",
        "",
        "2",
        "00:00:03,800 --> 00:00:07,800",
        "FL • FC • FR • LFE • LS • RS Channel Sweep Demo",
        "",
      ].join("\n");

      await Promise.all([
        Deno.writeTextFile(srtTurPath, srtTurContent),
        Deno.writeTextFile(srtEngPath, srtEngContent),
      ]);

      // Track 0: 6-channel 5.1(side) sweep: FL (220Hz), FR (330Hz), FC (440Hz), LFE (60Hz), SL (550Hz), SR (660Hz)
      const audio51Expr = [
        "0.45*sin(2*PI*220*t)*(between(t\\,0\\,2.5)+0.3*between(t\\,6\\,8))",
        "0.45*sin(2*PI*330*t)*(between(t\\,1.5\\,4)+0.3*between(t\\,6\\,8))",
        "0.5*sin(2*PI*440*t)*(between(t\\,0.5\\,3)+between(t\\,5\\,7.5))",
        "0.6*sin(2*PI*60*t)*(0.5+0.5*sin(2*PI*0.75*t))",
        "0.45*sin(2*PI*550*t)*between(t\\,3\\,6)",
        "0.45*sin(2*PI*660*t)*between(t\\,4\\,7)",
      ].join("|");

      // Track 1: 2-channel Stereo AAC track (Turkish Stereo AAC)
      const audioStereoExpr = [
        "0.35*sin(2*PI*330*t)*(0.6+0.4*sin(2*PI*0.5*t))",
        "0.35*sin(2*PI*440*t)*(0.6+0.4*cos(2*PI*0.5*t))",
      ].join("|");

      const proc = await new Deno.Command("ffmpeg", {
        args: [
          "-y",
          "-hide_banner",
          "-loglevel",
          "error",
          "-f",
          "lavfi",
          "-i",
          "testsrc2=size=1920x1080:rate=30:duration=8",
          "-f",
          "lavfi",
          "-i",
          `aevalsrc=${audio51Expr}:s=48000:c=5.1(side):d=8`,
          "-f",
          "lavfi",
          "-i",
          `aevalsrc=${audioStereoExpr}:s=48000:c=stereo:d=8`,
          "-i",
          srtTurPath,
          "-i",
          srtEngPath,
          "-map",
          "0:v:0",
          "-map",
          "1:a:0",
          "-map",
          "2:a:0",
          "-map",
          "3:s:0",
          "-map",
          "4:s:0",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-g",
          "30",
          "-crf",
          "22",
          "-pix_fmt",
          "yuv420p",
          "-c:a:0",
          "eac3",
          "-b:a:0",
          "448k",
          "-ar:a:0",
          "48000",
          "-c:a:1",
          "aac",
          "-ac:a:1",
          "2",
          "-b:a:1",
          "192k",
          "-ar:a:1",
          "48000",
          "-c:s",
          "srt",
          "-disposition:a:0",
          "default",
          "-disposition:a:1",
          "0",
          "-disposition:s:0",
          "default",
          "-disposition:s:1",
          "0",
          "-metadata:s:a:0",
          "language=eng",
          "-metadata:s:a:0",
          "title=English 5.1 E-AC-3",
          "-metadata:s:a:1",
          "language=tur",
          "-metadata:s:a:1",
          "title=Türkçe Stereo AAC",
          "-metadata:s:s:0",
          "language=tur",
          "-metadata:s:s:0",
          "title=Türkçe Demo",
          "-metadata:s:s:1",
          "language=eng",
          "-metadata:s:s:1",
          "title=English Demo",
          tmpMkvPath,
        ],
        stdout: "null",
        stderr: "piped",
      }).output();

      await Promise.all([
        Deno.remove(srtTurPath).catch(() => {}),
        Deno.remove(srtEngPath).catch(() => {}),
      ]);

      if (!proc.success) {
        await Deno.remove(tmpMkvPath).catch(() => {});
        const errMsg = new TextDecoder().decode(proc.stderr).trim();
        throw new Error(`Failed to generate demo 5.1 MKV: ${errMsg || proc.code}`);
      }

      await Deno.rename(tmpMkvPath, DEMO_PATH);
    }

    const torrent = client.seed(DEMO_PATH, { announce: DEFAULT_TRACKERS });
    attachTorrentListeners(torrent);
    // Wait for `ready` rather than `seed` so offline/firewalled DHT announce never blocks.
    await waitForTorrentReady(torrent, 25_000);
    return torrent;
  })();

  try {
    const torrent = await demoSeedPromise;
    const mainVideoIndex = computeMainVideoIndex(torrent.files || []);
    selectOnlyFile(torrent, mainVideoIndex);
    return torrent;
  } finally {
    demoSeedPromise = null;
  }
}

async function handleTorrentAdd(req: Request): Promise<Response> {
  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON request body", 400);
  }

  const magnet = typeof body?.magnet === "string" ? body.magnet.trim() : "";
  const rawBase64 = typeof body?.torrentBase64 === "string" ? body.torrentBase64.trim() : "";
  const autoSelectMain = body?.autoSelectMain === true;

  if (!magnet && !rawBase64) {
    return errorResponse("Provide either magnet or torrentBase64", 400);
  }

  let torrentInput: string | Buffer;
  if (rawBase64) {
    const cleaned = rawBase64.replace(/^data:[^;]+;base64,/i, "");
    try {
      const buf = Buffer.from(cleaned, "base64");
      if (!buf.length) {
        return errorResponse("Empty torrentBase64 payload", 400);
      }
      torrentInput = buf;
    } catch {
      return errorResponse("Invalid base64 torrent payload", 400);
    }
  } else {
    torrentInput = magnet;
  }

  const applyInitialSelection = (torrent: TorrentInstance) => {
    const tracker = getTracker(torrent.infoHash);
    deselectAllFiles(torrent);
    selectSmallSubtitles(torrent);

    const files = torrent.files || [];
    const videoFileCount = files.filter((f: TorrentFile) => isVideoFile(f.name)).length;
    const mainVideoIndex = computeMainVideoIndex(files);

    if (files.length > 0 && (videoFileCount === 1 || autoSelectMain)) {
      selectOnlyFile(torrent, mainVideoIndex);
    } else {
      tracker.selectedFileIndex = null;
    }
  };

  try {
    const existing = await client.get(torrentInput);
    if (existing && !existing.destroyed) {
      attachTorrentListeners(existing);
      if (existing.done) {
        try { existing.pause?.(); } catch {}
      } else if (!existing.ready) {
        await waitForTorrentReady(existing, 35_000);
        applyInitialSelection(existing);
      } else if (autoSelectMain && getTracker(existing.infoHash).selectedFileIndex === null) {
        selectOnlyFile(existing, computeMainVideoIndex(existing.files || []));
      }
      const payload = formatTorrentAddPayload(existing);
      return jsonResponse(payload, 200);
    }
  } catch {
    // Proceed to client.add if parse failed or torrent wasn't loaded
  }

  const torrent = client.add(torrentInput, {
    path: CACHE_DIR,
    announce: DEFAULT_TRACKERS,
    strategy: "sequential",
    deselect: true,
  });
  attachTorrentListeners(torrent);

  try {
    await waitForTorrentReady(torrent, 35_000);
  } catch (err) {
    if (!torrent.metadata && !torrent.destroyed) {
      try {
        torrent.destroy();
      } catch {
        // Ignore cleanup failure
      }
    }
    return errorResponse(
      err instanceof Error ? err.message : "Failed to load torrent metadata",
      504,
      torrent.infoHash ? { infoHash: torrent.infoHash } : undefined,
    );
  }

  applyInitialSelection(torrent);
  const payload = formatTorrentAddPayload(torrent);
  return jsonResponse(payload, 200);
}

function handleSelectFile(infoHash: string, fileIndexStr: string): Response {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  selectOnlyFile(torrent, fileIndex);
  const file: TorrentFile = torrent.files[fileIndex];
  const progress = file.done
    ? 1
    : Number.isFinite(file.progress)
    ? clamp(file.progress, 0, 1)
    : 0;
  const downloaded = Number.isFinite(file.downloaded) ? file.downloaded : 0;

  return jsonResponse({
    ok: true,
    infoHash: torrent.infoHash,
    selectedFileIndex: fileIndex,
    file: {
      index: fileIndex,
      name: file.name,
      length: file.length,
      progress,
      downloaded,
    },
  });
}

function handleTorrentStatus(infoHash: string, url: URL): Response {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);

  const tracker = getTracker(torrent.infoHash);
  const selectedIdx = tracker.selectedFileIndex;

  const files = (torrent.files || []).map((f: TorrentFile, index: number) => {
    const prog = f.done ? 1 : Number.isFinite(f.progress) ? clamp(f.progress, 0, 1) : 0;
    return {
      index,
      name: f.name,
      length: f.length,
      progress: prog,
      downloaded: Number.isFinite(f.downloaded) ? f.downloaded : 0,
      isVideo: isVideoFile(f.name),
      isSubtitle: isSubtitleFile(f.name),
      isSelected: index === selectedIdx,
    };
  });

  const rawFileIndex = url.searchParams.get("fileIndex");
  let queryFileIndex: number | null = null;
  if (rawFileIndex !== null) {
    const parsedIdx = Number(rawFileIndex);
    if (Number.isInteger(parsedIdx) && parsedIdx >= 0 && parsedIdx < files.length) {
      queryFileIndex = parsedIdx;
    }
  }

  const mainVideoIndex = computeMainVideoIndex(torrent.files || []);
  const pieceMapTargetIdx = queryFileIndex ?? selectedIdx ?? mainVideoIndex;
  const targetFile = torrent.files?.[pieceMapTargetIdx];
  const pieceMap = buildPieceMap(torrent, targetFile);

  const selectedFile = selectedIdx !== null ? torrent.files?.[selectedIdx] : null;
  const selectedFileProgress = selectedFile
    ? (selectedFile.length === 0 || selectedFile.done
      ? 1
      : Number.isFinite(selectedFile.progress)
      ? clamp(selectedFile.progress, 0, 1)
      : 0)
    : 0;
  const selectedFileDownloaded = selectedFile
    ? (Number.isFinite(selectedFile.downloaded) ? selectedFile.downloaded : 0)
    : 0;
  const selectedFileLength = selectedFile ? selectedFile.length : 0;
  const selectedFileDone = selectedFile
    ? (selectedFileProgress >= 0.999 || Boolean(selectedFile.done))
    : false;

  const timeRemaining = Number.isFinite(torrent.timeRemaining)
    ? Math.max(0, Math.round(torrent.timeRemaining))
    : 0;

  return jsonResponse({
    infoHash: torrent.infoHash,
    name: torrent.name || torrent.infoHash,
    ready: Boolean(torrent.ready),
    progress: Number.isFinite(torrent.progress) ? clamp(torrent.progress, 0, 1) : 0,
    downloadSpeed: Math.round(torrent.downloadSpeed || 0),
    uploadSpeed: Math.round(torrent.uploadSpeed || 0),
    numPeers: torrent.numPeers || 0,
    timeRemaining,
    selectedFileIndex: selectedIdx,
    selectedFileProgress,
    selectedFileDownloaded,
    selectedFileLength,
    selectedFileDone,
    pieceMap,
    files,
  });
}

async function handleProbeRequest(
  requestSignal: AbortSignal,
  infoHash: string,
  fileIndexStr: string,
): Promise<Response> {
  const torrent = findTorrentByHash(infoHash);
  if (!torrent) return errorResponse("Torrent not found", 404);
  if (!torrent.ready) return errorResponse("Torrent metadata not ready yet", 503);

  const fileIndex = Number(fileIndexStr);
  if (!Number.isInteger(fileIndex) || fileIndex < 0 || fileIndex >= torrent.files.length) {
    return errorResponse("File index not found", 404);
  }

  prioritizeFileHeaderFooter(torrent, fileIndex);

  try {
    const result = await runProbe(torrent.infoHash, fileIndex, requestSignal);
    return jsonResponse(result, 200);
  } catch (err) {
    return errorResponse(
      `Probe failed: ${err instanceof Error ? err.message : String(err)}`,
      500,
    );
  }
}

async function serveStaticFile(req: Request, pathname: string): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return errorResponse("Method not allowed", 405);
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return errorResponse("Invalid URL path", 400);
  }

  const relativePath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const normalized = normalize(relativePath);
  const fullPath = resolve(PUBLIC_DIR, normalized);

  // Prevent directory traversal outside ./public
  if (fullPath !== PUBLIC_DIR && !fullPath.startsWith(PUBLIC_DIR + sep)) {
    return errorResponse("Forbidden", 403);
  }

  let targetPath = fullPath;
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(targetPath);
    if (stat.isDirectory) {
      targetPath = join(targetPath, "index.html");
      stat = await Deno.stat(targetPath);
    }
  } catch {
    return errorResponse("Not found", 404);
  }

  const headers = {
    "Content-Type": getStaticMimeType(targetPath),
    "Content-Length": String(stat.size),
    "Cache-Control": "no-cache",
  };

  if (req.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }

  const file = await Deno.open(targetPath, { read: true });
  return new Response(file.readable, { status: 200, headers });
}

async function handleRequest(req: Request, requestSignal: AbortSignal): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/api/torrent/add" && req.method === "POST") {
    return await handleTorrentAdd(req);
  }

  if (path === "/api/demo/sample" && req.method === "POST") {
    try {
      const torrent = await ensureDemoSampleTorrent();
      const payload = formatTorrentAddPayload(torrent);
      prioritizeFileHeaderFooter(torrent, payload.mainVideoIndex);
      return jsonResponse(payload, 200);
    } catch (err) {
      return errorResponse(
        err instanceof Error ? err.message : "Failed to initialize demo sample",
        500,
      );
    }
  }

  const selectMatch = /^\/api\/torrent\/([^/]+)\/select\/(\d+)$/.exec(path);
  if (selectMatch && req.method === "POST") {
    return handleSelectFile(decodeURIComponent(selectMatch[1]), selectMatch[2]);
  }

  const statusMatch = /^\/api\/torrent\/([^/]+)\/status$/.exec(path);
  if (statusMatch && req.method === "GET") {
    return handleTorrentStatus(decodeURIComponent(statusMatch[1]), url);
  }

  const probeMatch = /^\/api\/torrent\/([^/]+)\/probe\/(\d+)$/.exec(path);
  if (probeMatch && req.method === "GET") {
    return await handleProbeRequest(requestSignal, decodeURIComponent(probeMatch[1]), probeMatch[2]);
  }

  const prepareSubMatch = /^\/api\/torrent\/([^/]+)\/subtitles\/prepare\/(\d+)$/.exec(path);
  if (prepareSubMatch && req.method === "GET") {
    return await handlePrepareSubtitlesRequest(
      requestSignal,
      decodeURIComponent(prepareSubMatch[1]),
      prepareSubMatch[2],
    );
  }

  const streamMatch = /^\/api\/stream\/([^/]+)\/(\d+)$/.exec(path);
  if (streamMatch && (req.method === "GET" || req.method === "HEAD")) {
    return serveTorrentFile(req, requestSignal, decodeURIComponent(streamMatch[1]), streamMatch[2]);
  }

  const downloadMatch = /^\/api\/download\/([^/]+)\/(\d+)$/.exec(path);
  if (downloadMatch && (req.method === "GET" || req.method === "HEAD")) {
    return serveTorrentFile(
      req,
      requestSignal,
      decodeURIComponent(downloadMatch[1]),
      downloadMatch[2],
      { attachment: true },
    );
  }

  const playMatch = /^\/api\/play\/([^/]+)\/(\d+)$/.exec(path);
  if (playMatch && req.method === "GET") {
    return await handlePlayRequest(
      requestSignal,
      url,
      decodeURIComponent(playMatch[1]),
      playMatch[2],
    );
  }

  const subFileMatch = /^\/api\/subtitles\/([^/]+)\/file\/(\d+)\.vtt$/i.exec(path);
  if (subFileMatch && req.method === "GET") {
    return await handleFileSubtitleRequest(
      requestSignal,
      decodeURIComponent(subFileMatch[1]),
      subFileMatch[2],
    );
  }

  const subMatch = /^\/api\/subtitles\/([^/]+)\/(\d+)\/([^/]+)$/.exec(path);
  if (subMatch && req.method === "GET") {
    return await handleSubtitleRequest(
      requestSignal,
      decodeURIComponent(subMatch[1]),
      subMatch[2],
      decodeURIComponent(subMatch[3]),
    );
  }

  if (path.startsWith("/api/")) {
    return errorResponse("API endpoint not found", 404);
  }

  return await serveStaticFile(req, path);
}

const server = Deno.serve(
  {
    hostname: HOST,
    port: PORT,
    onListen({ hostname, port }) {
      actualListeningPort = port;
      console.log(`[Torrent Streamer] Server listening on http://${hostname}:${port}`);
    },
  },
  async (req: Request, info: Deno.ServeHandlerInfo) => {
    const abortController = new AbortController();
    info.completed
      .then(() => abortController.abort())
      .catch(() => abortController.abort());
    try {
      const res = await handleRequest(req, abortController.signal);
      return withCors(res);
    } catch (err) {
      console.error("[HTTP] Unhandled error:", err);
      return withCors(
        errorResponse(err instanceof Error ? err.message : "Internal server error", 500),
      );
    }
  },
);

const shutdown = () => {
  try {
    server.shutdown();
  } catch {
    // Ignore
  }
  try {
    if (!client.destroyed) {
      client.destroy();
    }
  } catch {
    // Ignore
  }
};

try {
  Deno.addSignalListener("SIGINT", shutdown);
  if (Deno.build.os !== "windows") {
    Deno.addSignalListener("SIGTERM", shutdown);
  } else {
    Deno.addSignalListener("SIGBREAK", shutdown);
  }
} catch {
  // Signal listeners may be restricted in some environments
}

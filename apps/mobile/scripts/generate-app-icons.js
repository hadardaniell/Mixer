/**
 * Regenerates the app icon PNGs from the Mixer x vector.
 *
 *   node scripts/generate-app-icons.js
 *
 * The single source is `src/shared/ui/mixerXPath.ts` — the same path the app renders —
 * so the launcher icon can never drift from the mark inside the product. Rerun this
 * after changing that path, or after changing a size/colour below.
 *
 * It rasterizes without an image library: the SVG cubics are flattened into polygons,
 * scanline-filled with nonzero winding at 4x4 supersampling, and written as real PNGs
 * with zlib plus a CRC implementation. That keeps the repo free of a native image
 * dependency for something that runs once in a blue moon.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src/assets/icon') + path.sep;

const VB = { x: 693.1, y: 295.3, w: 193.5, h: 209.4 };
const PATH = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'src/shared/ui/mixerXPath.ts'), 'utf8');
  const match = src.match(/MIXER_X_PATH\s*=\s*'([^']+)'/);
  if (!match) throw new Error('could not find MIXER_X_PATH in mixerXPath.ts');
  return match[1];
})();

// ── path → polygons ─────────────────────────────────────────────────────────
function parsePath(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/gi);
  const subpaths = [];
  let cur = null;
  let px = 0, py = 0;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);

  const CURVE_STEPS = 32;
  const cubic = (x1, y1, x2, y2, x3, y3) => {
    for (let s = 1; s <= CURVE_STEPS; s++) {
      const t = s / CURVE_STEPS, u = 1 - t;
      const x = u * u * u * px + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const y = u * u * u * py + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      cur.push([x, y]);
    }
    px = x3; py = y3;
  };

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case 'M':
        cur = [];
        subpaths.push(cur);
        px = num(); py = num();
        cur.push([px, py]);
        break;
      case 'L':
        px = num(); py = num();
        cur.push([px, py]);
        break;
      case 'C': {
        const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x3 = num(), y3 = num();
        cubic(x1, y1, x2, y2, x3, y3);
        break;
      }
      case 'Z':
        break;
      default:
        throw new Error('unsupported path command: ' + cmd);
    }
  }
  return subpaths.filter((s) => s.length > 2);
}

// ── scanline fill, nonzero winding, 4x4 supersampled ────────────────────────
const SS = 4;

function rasterize(polys, size, coverage) {
  // Fit the glyph's viewBox into `coverage` of the square, centred.
  const scale = (coverage * size) / Math.max(VB.w, VB.h);
  const offX = (size - VB.w * scale) / 2 - VB.x * scale;
  const offY = (size - VB.h * scale) / 2 - VB.y * scale;

  const edges = [];
  for (const poly of polys) {
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k];
      const b = poly[(k + 1) % poly.length];
      const ax = a[0] * scale + offX, ay = a[1] * scale + offY;
      const bx = b[0] * scale + offX, by = b[1] * scale + offY;
      if (ay === by) continue;
      edges.push({ ax, ay, bx, by, dir: by > ay ? 1 : -1, ymin: Math.min(ay, by), ymax: Math.max(ay, by) });
    }
  }

  const cov = new Uint16Array(size * size); // hits per pixel, 0..SS*SS
  const xs = [];
  for (let sy = 0; sy < size * SS; sy++) {
    const y = (sy + 0.5) / SS;
    xs.length = 0;
    for (const e of edges) {
      if (y < e.ymin || y >= e.ymax) continue;
      const t = (y - e.ay) / (e.by - e.ay);
      xs.push({ x: e.ax + t * (e.bx - e.ax), dir: e.dir });
    }
    if (!xs.length) continue;
    xs.sort((p, q) => p.x - q.x);

    let winding = 0;
    const row = Math.floor(sy / SS) * size;
    for (let k = 0; k < xs.length - 1; k++) {
      winding += xs[k].dir;
      if (winding === 0) continue;
      // Span [xs[k].x, xs[k+1].x) is inside. Sample it at subpixel centres.
      const from = Math.max(0, Math.ceil(xs[k].x * SS - 0.5));
      const to = Math.min(size * SS - 1, Math.floor(xs[k + 1].x * SS - 0.5));
      for (let sx = from; sx <= to; sx++) cov[row + Math.floor(sx / SS)]++;
    }
  }

  const alpha = new Uint8Array(size * size);
  const max = SS * SS;
  for (let p = 0; p < alpha.length; p++) alpha[p] = Math.round((Math.min(cov[p], max) / max) * 255);
  return alpha;
}

// ── PNG encoding ────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** `pixels` is raw RGB or RGBA rows; `channels` is 3 or 4. */
function writePng(file, size, pixels, channels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = channels === 4 ? 6 : 2; // RGBA : RGB
  const stride = size * channels;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
  return png.length;
}

// ── the four assets ─────────────────────────────────────────────────────────
const INK = [0x11, 0x18, 0x27];
const WHITE = [0xff, 0xff, 0xff];

function compose(size, alpha, { bg, fg }) {
  // bg = null → transparent RGBA; otherwise opaque RGB.
  const channels = bg ? 3 : 4;
  const buf = Buffer.alloc(size * size * channels);
  for (let p = 0; p < size * size; p++) {
    const a = alpha[p] / 255;
    const o = p * channels;
    if (bg) {
      for (let c = 0; c < 3; c++) buf[o + c] = Math.round(bg[c] * (1 - a) + fg[c] * a);
    } else {
      for (let c = 0; c < 3; c++) buf[o + c] = fg[c];
      buf[o + 3] = alpha[p];
    }
  }
  return { buf, channels };
}

const polys = parsePath(PATH);
fs.mkdirSync(OUT, { recursive: true });

const assets = [
  // Store / home-screen icon: opaque, no alpha channel — Apple rejects transparency.
  { name: 'icon.png', size: 1024, coverage: 0.6, bg: INK, fg: WHITE },
  // Android adaptive foreground: transparent, glyph kept well inside the 66% safe zone
  // so the launcher's circular mask never clips it.
  { name: 'adaptive-icon.png', size: 1024, coverage: 0.48, bg: null, fg: WHITE },
  // Android notification icon: the platform renders it as a white silhouette.
  { name: 'notification-icon.png', size: 96, coverage: 0.7, bg: null, fg: WHITE },
  { name: 'favicon.png', size: 64, coverage: 0.62, bg: INK, fg: WHITE },
];

for (const a of assets) {
  const alpha = rasterize(polys, a.size, a.coverage);
  const { buf, channels } = compose(a.size, alpha, { bg: a.bg, fg: a.fg });
  const bytes = writePng(OUT + a.name, a.size, buf, channels);
  // Sanity: how much of the square the glyph actually covers.
  let ink = 0;
  for (let p = 0; p < alpha.length; p++) if (alpha[p] > 127) ink++;
  console.log(
    `${a.name}  ${a.size}x${a.size}  ${channels === 4 ? 'RGBA' : 'RGB'}  ` +
      `${(bytes / 1024).toFixed(1)}KB  glyph=${((ink / alpha.length) * 100).toFixed(1)}%`,
  );
}

// Kleine Farb-Bibliothek für die Passepartout-Prüfskripte:
// Parsing (hex/rgb[a]), WCAG-Kontrast, sRGB->Lab, CIEDE2000, Alpha-Komposition,
// color-mix(in srgb) und Farbfehlsichtigkeits-Simulation (Viénot 1999 für Protan/Deutan,
// Brettel 1997 für Tritan; Matrizen nach Machado/Viénot in linearem sRGB).

export function parseColor(str) {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }
  m = s.match(/^color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/);
  if (m) {
    const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: +m[1] * 255, g: +m[2] * 255, b: +m[3] * 255, a };
  }
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  return null;
}

// alle rgb()/rgba()/hex-Farben in einem Wert (box-shadow, background-image …)
export function colorsIn(str) {
  if (!str || str === 'none') return [];
  const out = [];
  for (const m of String(str).matchAll(/rgba?\([^)]*\)|color\(srgb[^)]*\)|#[0-9a-f]{3,8}\b/gi)) {
    const c = parseColor(m[0]);
    if (c) out.push(c);
  }
  return out;
}

export const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();

const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const unlin = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function luminance(c) {
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

// Farbe mit Alpha über einen (deckenden) Hintergrund legen
export function over(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

export function contrast(a, b) {
  if (typeof a === 'string') a = parseColor(a);
  if (typeof b === 'string') b = parseColor(b);
  if ((b.a ?? 1) < 1) b = over(b, { r: 255, g: 255, b: 255 });
  if ((a.a ?? 1) < 1) a = over(a, b);
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// color-mix(in srgb, a p%, b)
export function mix(a, b, p) {
  if (typeof a === 'string') a = parseColor(a);
  if (typeof b === 'string') b = parseColor(b);
  const q = 1 - p;
  return { r: a.r * p + b.r * q, g: a.g * p + b.g * q, b: a.b * p + b.b * q, a: 1 };
}

export function toLab(c) {
  if (typeof c === 'string') c = parseColor(c);
  const R = lin(c.r), G = lin(c.g), B = lin(c.b);
  const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const Z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function deltaE2000(c1, c2) {
  const l1 = c1.L !== undefined ? c1 : toLab(c1);
  const l2 = c2.L !== undefined ? c2 : toLab(c2);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(l1.a, l1.b), C2 = Math.hypot(l2.a, l2.b);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1 = l1.a * (1 + G), a2 = l2.a * (1 + G);
  const C1p = Math.hypot(a1, l1.b), C2p = Math.hypot(a2, l2.b);
  const h = (x, y) => { if (x === 0 && y === 0) return 0; const v = Math.atan2(y, x) / rad; return v < 0 ? v + 360 : v; };
  const h1 = h(a1, l1.b), h2 = h(a2, l2.b);
  const dL = l2.L - l1.L, dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh / 2) * rad);
  const Lb = (l1.L + l2.L) / 2, Cbp = (C1p + C2p) / 2;
  let hb = h1 + h2;
  if (C1p * C2p !== 0) { if (Math.abs(h1 - h2) > 180) hb = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2; else hb = (h1 + h2) / 2; }
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// Farbfehlsichtigkeit (Dichromasie, volle Ausprägung). Matrizen in linearem sRGB.
// Protan/Deutan: Viénot, Brettel & Mollon 1999; Tritan: Brettel 1997 (zwei Halbebenen).
const M = {
  protan: [[0.11238, 0.88762, 0.0], [0.11238, 0.88762, 0.0], [0.00401, -0.00401, 1.0]],
  deutan: [[0.29275, 0.70725, 0.0], [0.29275, 0.70725, 0.0], [-0.02234, 0.02234, 1.0]],
};
const TRITAN = {
  a: [[1.01277, 0.13548, -0.14826], [-0.01243, 0.86812, 0.14431], [0.07589, 0.805, 0.11911]],
  b: [[0.93678, 0.18979, -0.12657], [0.06154, 0.81526, 0.1232], [-0.37562, 1.12767, 0.24796]],
  sep: [0.03901, -0.02788, -0.01113],
};
const mul = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);

export function simulate(c, type) {
  if (typeof c === 'string') c = parseColor(c);
  const v = [lin(c.r), lin(c.g), lin(c.b)];
  let o;
  if (type === 'tritan') {
    const d = v[0] * TRITAN.sep[0] + v[1] * TRITAN.sep[1] + v[2] * TRITAN.sep[2];
    o = mul(d >= 0 ? TRITAN.a : TRITAN.b, v);
  } else o = mul(M[type], v);
  const cl = (x) => Math.max(0, Math.min(1, x));
  return { r: unlin(cl(o[0])), g: unlin(cl(o[1])), b: unlin(cl(o[2])), a: 1 };
}

export const CVD = ['protan', 'deutan', 'tritan'];

// Lab -> sRGB (null, wenn außerhalb des Farbraums)
export function fromLab({ L, a, b }) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const finv = (t) => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = finv(fx) * 0.95047, Y = finv(fy), Z = finv(fz) * 1.08883;
  const R = X * 3.2404542 - Y * 1.5371385 - Z * 0.4985314;
  const G = -X * 0.969266 + Y * 1.8760108 + Z * 0.041556;
  const B = X * 0.0556434 - Y * 0.2040259 + Z * 1.0572252;
  if ([R, G, B].some((v) => v < -0.001 || v > 1.001)) return null;
  const c = (v) => Math.round(unlin(Math.max(0, Math.min(1, v))));
  return { r: c(R), g: c(G), b: c(B), a: 1 };
}
export const fromLch = (L, C, h) => fromLab({ L, a: C * Math.cos((h * Math.PI) / 180), b: C * Math.sin((h * Math.PI) / 180) });
export function toLch(c) { const { L, a, b } = toLab(c); let h = (Math.atan2(b, a) * 180) / Math.PI; if (h < 0) h += 360; return { L, C: Math.hypot(a, b), h }; }

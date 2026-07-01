// =============================================================
// card.js — Personalized share card (OG image) · Sprint 6.5
// -------------------------------------------------------------
// LINE/social crawler ไม่รัน JS → og:image ต้องเป็น PNG จริงที่ฝังค่ารายคน
//   cardImage : (GET ?p=&name=&color=&hex=&number=&time=&kind=)  → PNG 1200×630
//   cardShare : (GET ?...) → HTML ที่ตั้ง og:image = cardImage(?...) + redirect ไปแอป
// เรนเดอร์: สร้าง SVG เอง (resvg shape ไทยด้วย rustybuzz) → @resvg/resvg-js → PNG
// ฟอนต์ Sarabun (OFL) bundle ใน functions/fonts/ · มาสคอต m3 ฝังเป็น data URI
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const REGION = 'asia-southeast1';
const APP_LINK = 'https://capybarabu-mae-mhor.web.app/app.html';
const IMG_URL = 'https://capybarabu-mae-mhor.web.app/cardimg';   // hosting rewrite → cardImage

const FONT_FILES = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf', 'Sarabun-ExtraBold.ttf']
  .map((f) => path.join(__dirname, 'fonts', f));

// มาสคอต m3 (โปร่งใส clean) → data URI (โหลดครั้งเดียวตอน cold start)
let MASCOT_URI = '';
try {
  const buf = fs.readFileSync(path.join(__dirname, 'mascot-card.png'));
  MASCOT_URI = 'data:image/png;base64,' + buf.toString('base64');
} catch (e) { console.warn('mascot load', e.message); }

const C = { mango: '#ff6a2b', mango2: '#e8551a', ink: '#241a12', cream: '#fff9f1', cream2: '#fdeed8', ink2: '#5c5042' };
const xml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// ตัดคำไทยแบบง่าย (ไม่มีช่องว่าง) ตามจำนวนอักษร/บรรทัด
function wrap(s, perLine, maxLines) {
  s = String(s || ''); const out = [];
  for (let i = 0; i < s.length && out.length < maxLines; i += perLine) out.push(s.slice(i, i + perLine));
  if (out.length === maxLines && s.length > perLine * maxLines) out[maxLines - 1] = out[maxLines - 1].slice(0, perLine - 1) + '…';
  return out;
}

function buildSVG(p) {
  const power = clamp(parseInt(p.power, 10) || 0, 0, 100);
  const name = (p.name || 'คุณ').slice(0, 18);
  const colorName = (p.color || '').slice(0, 16);
  const hex = /^#[0-9a-fA-F]{6}$/.test(p.hex || '') ? p.hex : '#ff6f91';
  const number = (p.number || '').slice(0, 8);
  const time = (p.time || '').slice(0, 8);
  const kind = (p.kind || 'ดวงวันนี้').slice(0, 18);

  // ring (power gauge)
  const cx = 235, cy = 250, r = 120, sw = 26;
  const Ccirc = 2 * Math.PI * r;
  const prog = (power / 100) * Ccirc;

  // 3 chips bottom bar
  const chipY = 482, chipH = 112, cw = 350, gap = 25, cx0 = 50;
  function chip(i, label, value, swatch) {
    const x = cx0 + i * (cw + gap);
    let inner = '';
    if (swatch) {
      inner = `<circle cx="${x + 54}" cy="${chipY + 70}" r="20" fill="${swatch}" stroke="${C.ink}" stroke-width="3"/>`
        + `<text x="${x + 88}" y="${chipY + 80}" font-family="Sarabun" font-weight="800" font-size="34" fill="${C.ink}">${xml(value)}</text>`;
    } else {
      inner = `<text x="${x + cw / 2}" y="${chipY + 82}" text-anchor="middle" font-family="Sarabun" font-weight="800" font-size="44" fill="${C.ink}">${xml(value)}</text>`;
    }
    return `<g>
      <rect x="${x}" y="${chipY}" width="${cw}" height="${chipH}" rx="22" fill="${C.cream}" stroke="${C.ink}" stroke-width="3"/>
      <text x="${x + 28}" y="${chipY + 38}" font-family="Sarabun" font-weight="700" font-size="24" fill="${C.ink2}">${xml(label)}</text>
      ${inner}
    </g>`;
  }

  const mascot = MASCOT_URI ? `<image x="700" y="20" width="470" height="470" href="${MASCOT_URI}" preserveAspectRatio="xMidYMax meet"/>` : '';

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${C.mango}"/>
  ${mascot}
  <!-- brand -->
  <circle cx="78" cy="64" r="17" fill="#fff"/>
  <circle cx="78" cy="64" r="7" fill="${C.mango}"/>
  <text x="108" y="76" font-family="Sarabun" font-weight="800" font-size="34" fill="#fff">แม่หมอบาร่า</text>
  <!-- kind pill -->
  <rect x="110" y="96" width="${kind.length * 19 + 44}" height="46" rx="23" fill="${C.ink}"/>
  <text x="${110 + (kind.length * 19 + 44) / 2}" y="127" text-anchor="middle" font-family="Sarabun" font-weight="700" font-size="26" fill="${C.cream}">${xml(kind)}</text>
  <!-- power ring -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="${sw}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round"
    stroke-dasharray="${prog.toFixed(1)} ${(Ccirc - prog).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx + 6}" y="${cy + 38}" text-anchor="middle" font-family="Sarabun" font-weight="800" font-size="120" fill="#fff">${power}</text>
  <text x="${cx + 96}" y="${cy - 36}" text-anchor="middle" font-family="Sarabun" font-weight="800" font-size="44" fill="#fff">%</text>
  <!-- name label -->
  <text x="${cx}" y="430" text-anchor="middle" font-family="Sarabun" font-weight="700" font-size="32" fill="#fff">พลังของ ${xml(name)} วันนี้</text>
  <!-- chips -->
  ${chip(0, 'สีมงคล', colorName, hex)}
  ${chip(1, 'เลขมงคล', number, null)}
  ${chip(2, 'เวลามงคล', time, null)}
  <text x="1150" y="615" text-anchor="end" font-family="Sarabun" font-weight="700" font-size="22" fill="#ffe6de">capybarabu-mae-mhor.web.app</text>
</svg>`;
}

function renderPng(p) {
  const svg = buildSVG(p);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Sarabun' },
  });
  return resvg.render().asPng();
}

// =============================================================
// #4: Wallpaper เครื่องรางดิจิทัล (1080×1920) — โหลดเป็นภาพพักหน้าจอ
// ดาร์กสายมูตามธาตุ + มาสคอตเรืองแสง + แท็กมงคลของผู้ซื้อ (สี/เลข)
// =============================================================
const _mascotCache = {};
function mascotURI(n) {
  const k = String(n || 3);
  if (k in _mascotCache) return _mascotCache[k];
  try {
    const buf = fs.readFileSync(path.join(__dirname, 'mascots', 'm' + k + '.png'));
    _mascotCache[k] = 'data:image/png;base64,' + buf.toString('base64');
  } catch (e) { _mascotCache[k] = MASCOT_URI; }
  return _mascotCache[k];
}
// ธาตุ → palette ดาร์ก (top, bottom, accent)
const WP_PAL = {
  money:   ['#2a1e06', '#0f0b03', '#f7c96f'],
  love:    ['#2e0a1a', '#120410', '#ff5c93'],
  work:    ['#14123a', '#070615', '#8b7bff'],
  protect: ['#1d0e3a', '#0b0518', '#b79bff'],
  health:  ['#08241a', '#03110b', '#16b8a0'],
  luck:    ['#2a1606', '#100802', '#ffc23d'],
};
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function buildWallpaperSVG(p) {
  const W = 1080, H = 1920;
  const name = (p.name || 'เครื่องรางนำโชค').slice(0, 26);
  const intention = WP_PAL[p.intention] ? p.intention : 'luck';
  const [bgTop, bgBot, accent] = WP_PAL[intention];
  const hex = /^#[0-9a-fA-F]{6}$/.test(p.hex || '') ? p.hex : accent;
  const colorName = (p.color || '').slice(0, 16);
  const number = (p.number || '').slice(0, 8);
  const uname = (p.uname || '').slice(0, 18);
  const mURI = mascotURI(p.mascot);

  // sparkles (deterministic)
  const rnd = mulberry32(1234 + intention.length * 97);
  let stars = '';
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rnd() * W), y = Math.round(rnd() * H);
    const r = (rnd() * 2.4 + 0.8).toFixed(1), o = (rnd() * 0.6 + 0.25).toFixed(2);
    stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
  }
  // ✦ ดาวสี่แฉกเล็ก ๆ รอบมาสคอต
  function spark(cx, cy, s, op) {
    return `<path d="M${cx} ${cy - s} L${cx + s * 0.28} ${cy - s * 0.28} L${cx + s} ${cy} L${cx + s * 0.28} ${cy + s * 0.28} L${cx} ${cy + s} L${cx - s * 0.28} ${cy + s * 0.28} L${cx - s} ${cy} L${cx - s * 0.28} ${cy - s * 0.28} Z" fill="${accent}" opacity="${op}"/>`;
  }

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBot}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="0.55" stop-color="${accent}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars}
  <ellipse cx="540" cy="880" rx="520" ry="520" fill="url(#glow)"/>
  ${spark(250, 640, 26, 0.9)}${spark(840, 560, 20, 0.8)}${spark(880, 980, 30, 0.85)}${spark(180, 1020, 22, 0.8)}
  <image x="230" y="560" width="620" height="620" href="${mURI}" preserveAspectRatio="xMidYMid meet"/>
  <text x="540" y="1360" text-anchor="middle" font-family="Sarabun" font-weight="800" font-size="68" fill="#fff">${xml(name)}</text>
  <text x="540" y="1420" text-anchor="middle" font-family="Sarabun" font-weight="700" font-size="32" fill="${accent}">พกพลังมงคลติดตัวทุกวัน</text>
  <!-- amulet tag (personalized) -->
  <rect x="180" y="1520" width="720" height="210" rx="34" fill="#ffffff" fill-opacity="0.08" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
  ${uname ? `<text x="540" y="1576" text-anchor="middle" font-family="Sarabun" font-weight="700" font-size="28" fill="#ffffff" opacity="0.85">เครื่องรางของ ${xml(uname)}</text>` : ''}
  <circle cx="345" cy="1650" r="22" fill="${hex}" stroke="#fff" stroke-opacity="0.6" stroke-width="2"/>
  <text x="385" y="1645" font-family="Sarabun" font-weight="700" font-size="26" fill="#fff" opacity="0.9">สีมงคล</text>
  <text x="385" y="1680" font-family="Sarabun" font-weight="800" font-size="30" fill="#fff">${xml(colorName)}</text>
  <text x="700" y="1645" font-family="Sarabun" font-weight="700" font-size="26" fill="#fff" opacity="0.9">เลขมงคล</text>
  <text x="700" y="1683" font-family="Sarabun" font-weight="800" font-size="34" fill="${accent}">${xml(number)}</text>
  <text x="540" y="1840" text-anchor="middle" font-family="Sarabun" font-weight="700" font-size="26" fill="#fff" opacity="0.55">แม่หมอบาร่า · เครื่องรางดิจิทัล</text>
</svg>`;
}

function renderWallpaper(p) {
  const resvg = new Resvg(buildWallpaperSVG(p), {
    fitTo: { mode: 'width', value: 1080 },
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Sarabun' },
  });
  return resvg.render().asPng();
}

exports.wallpaperImage = onRequest(
  { region: REGION, cors: true, invoker: 'public', memory: '512MiB', concurrency: 40 },
  (req, res) => {
    try {
      const png = renderWallpaper({
        name: req.query.name, intention: req.query.intention, mascot: req.query.mascot,
        color: req.query.color, hex: req.query.hex, number: req.query.number, uname: req.query.uname,
      });
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');
      res.status(200).send(png);
    } catch (e) { console.error('wallpaperImage', e.message); res.status(500).send('render error'); }
  },
);

const q = (req) => ({
  power: req.query.p, name: req.query.name, color: req.query.color,
  hex: req.query.hex, number: req.query.number, time: req.query.time, kind: req.query.kind,
});

exports.cardImage = onRequest(
  { region: REGION, cors: true, invoker: 'public', memory: '512MiB', concurrency: 40 },
  (req, res) => {
    try {
      const png = renderPng(q(req));
      res.set('Content-Type', 'image/png');
      res.set('Cache-Control', 'public, max-age=86400');   // เดิม ๆ ต่อ param เดิม → cache ได้
      res.status(200).send(png);
    } catch (e) {
      console.error('cardImage', e.message);
      res.status(500).send('render error');
    }
  },
);

exports.cardShare = onRequest(
  { region: REGION, cors: true, invoker: 'public' },
  (req, res) => {
    const qs = req.originalUrl.split('?')[1] || '';
    const img = IMG_URL + (qs ? '?' + qs : '');
    const power = clamp(parseInt(req.query.p, 10) || 0, 0, 100);
    const name = xml((req.query.name || 'คุณ').slice(0, 18));
    const title = 'พลังวันนี้ของ ' + name + ' = ' + power + '% · แม่หมอบาร่า 🔮';
    const desc = 'เช็กดวงรายวันกับคาปิบาราหมอดู — สีมงคล เลขเด็ด เวลาดี ฟรี ลองเลย!';
    res.set('Cache-Control', 'public, max-age=3600');
    res.status(200).send(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${xml(title)}</title>
<meta property="og:title" content="${xml(title)}"/>
<meta property="og:description" content="${xml(desc)}"/>
<meta property="og:image" content="${xml(img)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:type" content="website"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta http-equiv="refresh" content="0; url=${xml(APP_LINK)}"/>
</head><body style="font-family:sans-serif;background:#fff6e9;text-align:center;padding-top:80px">
<p>กำลังพาไปเช็กดวงกับแม่หมอบาร่า… 🔮</p>
<a href="${xml(APP_LINK)}">แตะที่นี่ถ้าไม่เด้งอัตโนมัติ</a>
<script>location.replace(${JSON.stringify(APP_LINK)});</script>
</body></html>`);
  },
);

// ---- local test: node card.js → เขียน /tmp/card-test.png ----
if (require.main === module) {
  const png = renderPng({ power: '71', name: 'ต้อง', color: 'แดงชมพู', hex: '#ff6f91', number: '5 0', time: '18:18', kind: 'ดวงวันนี้' });
  fs.writeFileSync('/tmp/card-test.png', png);
  console.log('wrote /tmp/card-test.png', png.length, 'bytes');
  const wp = renderWallpaper({ name: 'โล่จันทรามณี', intention: 'protect', mascot: '8', color: 'ม่วงมณี', hex: '#b79bff', number: '3 9', uname: 'ต้อง' });
  fs.writeFileSync('/tmp/wp-test.png', wp);
  console.log('wrote /tmp/wp-test.png', wp.length, 'bytes');
}

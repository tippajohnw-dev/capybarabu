/* =============================================================
   แม่หมอบาร่า / Capybarabu — Share-card Engine V2  "CAPY POP"
   static · no build · canvas (client-side) → ดาวน์โหลด/แชร์
   --------------------------------------------------------------
   palette CAPY POP: cream/mango/ink (flat, neo-brutalist toy)
   เงาแข็ง (hard offset shadow) · ขอบหนา ink · มาสคอตเป็นพระเอก
   ฟอนต์ Anuphan (Thai) — โหลด <link> ในหน้าก่อนเรียก
   ทุกผลลัพธ์ = growth lever

   API (global `ShareCard` — drop-in แทน share-card.js ในหน้า v2):
     ShareCard.render(canvas, data)   -> Promise
     ShareCard.share(canvas, data)    -> Promise<bool> (Web Share, fallback download)
   contract: data = { power, colorName, colorHex, number, time, headline,
                      kind?, name?, date, mascot? }   (mascot = path, default m3)
   ============================================================= */
(function (global) {
  'use strict';

  const W = 1080, H = 1350;
  const FONT = "'Anuphan',ui-sans-serif,system-ui,-apple-system,sans-serif";
  const MONO = "'IBM Plex Mono',ui-monospace,monospace";

  // palette (sync กับ design-tokens-v2.css)
  const C = {
    cream:'#fff6e9', cream2:'#fdeed8', card:'#fff9f1',
    ink:'#241a12', ink2:'#5c5042', muted:'#9a8d79', line:'#efe1cd',
    mango:'#ff6a2b', mango2:'#e8551a',
    tilePink:'#ffd9e6', tileMint:'#c7f5ec', tileSun:'#ffe9ad',
  };

  const _cache = {};                    // path -> Image|null
  function loadImg(src) {
    if (src in _cache) return Promise.resolve(_cache[src]);
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => { _cache[src] = img; res(img); };
      img.onerror = () => { _cache[src] = null; res(null); };
      img.src = src;
    });
  }
  function ensureFonts() {
    if (!global.document || !document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load("700 200px 'Anuphan'"),
      document.fonts.load("600 40px 'Anuphan'"),
      document.fonts.load("500 40px 'IBM Plex Mono'"),
    ]).catch(() => {});
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  // บล็อก POP: เงาแข็ง offset ink + ขอบหนา ink
  function popBlock(c, x, y, w, h, r, fill, shadow) {
    c.fillStyle = C.ink;                          // เงาแข็ง
    roundRect(c, x, y + (shadow || 16), w, h, r); c.fill();
    c.fillStyle = fill;
    roundRect(c, x, y, w, h, r); c.fill();
    c.lineWidth = 5; c.strokeStyle = C.ink;
    roundRect(c, x, y, w, h, r); c.stroke();
  }
  function wrapText(ctx, text, cx, y, maxW, lh, max) {
    const chars = String(text).split('');         // ไทยไม่เว้นวรรค → ตัดทีละอักษร
    let line = '', yy = y, lines = 0;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, yy); line = ch; yy += lh; lines++;
        if (max && lines >= max) return yy;        // ตัดจบตามจำนวนบรรทัด
      } else line = test;
    }
    if (line) ctx.fillText(line, cx, yy);
    return yy;
  }

  // สีกราฟแท่ง 5 ด้าน (สด distinct ตาม intention)
  const BAR_COLORS = { love:'#ff5c93', money:'#ff6a2b', work:'#5b4bff', protect:'#7c4dff', health:'#16b8a0' };
  const BAR_FALLBACK = ['#ff5c93', '#ff6a2b', '#5b4bff', '#7c4dff', '#16b8a0'];

  // วงแหวนพลัง (power ring gauge) — track + arc + เลข % ตรงกลาง
  function powerRing(ctx, cx, cy, R, thick, pct) {
    const start = -Math.PI / 2, end = start + (Math.PI * 2) * (Math.max(0, Math.min(100, pct)) / 100);
    ctx.lineCap = 'round';
    // track
    ctx.beginPath(); ctx.lineWidth = thick; ctx.strokeStyle = 'rgba(255,255,255,.28)';
    ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    // progress
    ctx.beginPath(); ctx.lineWidth = thick; ctx.strokeStyle = '#fff';
    ctx.arc(cx, cy, R, start, end); ctx.stroke();
    ctx.lineCap = 'butt';
    // เลขตรงกลาง
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.font = "700 132px " + FONT;
    ctx.fillText(String(pct), cx + 6, cy + 30);
    ctx.font = "700 44px " + FONT;
    ctx.fillText('%', cx + 6 + ctx.measureText(String(pct)).width / 2 + 34, cy - 28);
  }

  async function render(canvas, d) {
    const ctx = canvas.getContext('2d');
    const mascotPath = d.mascot || 'mascots/m3.webp?v=2';
    const [mascot] = await Promise.all([loadImg(mascotPath), ensureFonts()]);
    const bars = Array.isArray(d.bars) && d.bars.length ? d.bars.slice(0, 5) : null;

    // ---- คำนวณ layout (ความสูง dynamic ตาม section) ----
    const hx = 60, hw = 960, hy = 70, hh = 560;            // hero
    const by = hy + hh + 40, bw = 960, bx = 60;             // speech bubble
    ctx.font = "500 40px " + FONT;                          // (วัด headline ก่อนตั้งขนาด canvas)
    const blines = Math.min(3, Math.ceil(ctx.measureText(d.headline || '').width / (bw - 130)) || 1);
    const bh = 96 + blines * 56;
    const gy = by + bh + 40;                                // graph card (ถ้ามี bars)
    const gh = bars ? (76 + bars.length * 74 + 24) : 0;
    const ty = gy + (bars ? gh + 40 : 0);                  // trio tiles
    const th = 230;
    const H2 = ty + th + 130;                               // footer + ขอบล่าง
    canvas.width = W; canvas.height = H2;

    // --- พื้นหลัง cream + จุดลายเบา ---
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H2);
    ctx.fillStyle = 'rgba(36,26,18,.04)';
    for (let y = 40; y < H2; y += 46) for (let x = 40; x < W; x += 46) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.28); ctx.fill(); }

    // --- HERO mango block ---
    popBlock(ctx, hx, hy, hw, hh, 56, C.mango, 22);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = "700 46px " + FONT;
    ctx.fillText('🔮 แม่หมอบาร่า', hx + 50, hy + 88);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = "500 26px " + MONO;
    ctx.fillText('CAPYBARA ORACLE', hx + 54, hy + 128);

    // kind pill (ป้ายหมวด) — มุมขวาบน เหนือมาสคอต (ไม่ชนวงแหวน)
    if (d.kind) {
      ctx.font = "600 28px " + FONT;
      const kw = ctx.measureText(d.kind).width + 52;
      ctx.fillStyle = C.ink;
      roundRect(ctx, hx + hw - kw - 44, hy + 56, kw, 52, 26); ctx.fill();
      ctx.fillStyle = C.cream; ctx.textAlign = 'center';
      ctx.fillText(d.kind, hx + hw - kw / 2 - 44, hy + 90);
      ctx.textAlign = 'left';
    }

    // มาสคอต (พระเอก) ขวาล่างของ hero
    if (mascot) {
      const mh = 360, mw = mh * (mascot.width / mascot.height);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      ctx.drawImage(mascot, hx + hw - mw - 12, hy + hh - mh + 22, mw, mh);
      ctx.restore();
    }

    // --- power ring (graph) ฝั่งซ้ายของ hero + label ---
    const cx = hx + 250, cy = hy + 336;
    powerRing(ctx, cx, cy, 150, 34, d.power);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = "600 34px " + FONT;
    ctx.fillText(d.name ? ('พลังของ ' + d.name + ' วันนี้') : 'พลังวันนี้', cx, hy + 544);
    ctx.textAlign = 'left';

    // --- speech bubble (headline) ---
    popBlock(ctx, bx, by, bw, bh, 40, C.card, 14);
    ctx.fillStyle = C.mango2; ctx.font = "700 34px " + FONT; ctx.textAlign = 'left';
    ctx.fillText('แม่หมอบอกว่า…', bx + 54, by + 64);
    ctx.fillStyle = C.ink; ctx.font = "500 40px " + FONT;
    wrapText(ctx, d.headline, bx + 54, by + 120, bw - 110, 56, 3);

    // --- graph card: กราฟแท่ง 5 ด้าน (เฉพาะตอนมี bars) ---
    if (bars) {
      popBlock(ctx, 60, gy, 960, gh, 40, C.card, 14);
      ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = "700 36px " + FONT;
      ctx.fillText('📊 ดวงวันนี้แต่ละด้าน', 60 + 50, gy + 56);
      const trackX = 60 + 360, trackW = 960 - 360 - 110, rowH = 74, barH = 34;
      bars.forEach((b, i) => {
        const ry = gy + 96 + i * rowH;
        ctx.textAlign = 'left'; ctx.font = "500 34px " + FONT; ctx.fillStyle = C.ink;
        ctx.fillText((b.emoji ? b.emoji + ' ' : '') + b.label, 60 + 50, ry + barH - 4);
        // track
        ctx.fillStyle = C.cream2; roundRect(ctx, trackX, ry, trackW, barH, barH / 2); ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = C.line; roundRect(ctx, trackX, ry, trackW, barH, barH / 2); ctx.stroke();
        // fill
        const v = Math.max(0, Math.min(100, b.value || 0));
        const fw = Math.max(barH, trackW * v / 100);
        ctx.fillStyle = BAR_COLORS[b.key] || BAR_FALLBACK[i % 5];
        roundRect(ctx, trackX, ry, fw, barH, barH / 2); ctx.fill();
        // value
        ctx.textAlign = 'right'; ctx.font = "700 30px " + MONO; ctx.fillStyle = C.ink;
        ctx.fillText(v + '%', 960 + 60 - 36, ry + barH - 6);
      });
    }

    // --- trio tiles (สี/เลข/เวลา) ---
    const gap = 28, tw = (960 - gap * 2) / 3, tx0 = 60;
    const tiles = [
      { label: 'สีมงคล',  value: d.colorName, fill: C.tilePink, sw: d.colorHex },
      { label: 'เลขมงคล', value: String(d.number), fill: C.tileMint },
      { label: 'เวลามงคล', value: d.time, fill: C.tileSun },
    ];
    tiles.forEach((t, i) => {
      const x = tx0 + i * (tw + gap);
      popBlock(ctx, x, ty, tw, th, 32, t.fill, 14);
      ctx.textAlign = 'center';
      ctx.fillStyle = C.ink2; ctx.font = "500 26px " + MONO;
      ctx.fillText(t.label, x + tw / 2, ty + 58);
      if (t.sw) {
        ctx.fillStyle = t.sw; ctx.beginPath(); ctx.arc(x + tw / 2, ty + 118, 26, 0, 6.28); ctx.fill();
        ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
        ctx.fillStyle = C.ink; ctx.font = "700 38px " + FONT;
        ctx.fillText(t.value, x + tw / 2, ty + 190);
      } else {
        ctx.fillStyle = C.ink; ctx.font = "700 64px " + FONT;
        ctx.fillText(t.value, x + tw / 2, ty + 156);
      }
    });

    // --- footer ---
    ctx.textAlign = 'center';
    ctx.fillStyle = C.ink2; ctx.font = "500 30px " + MONO;
    ctx.fillText((d.date ? d.date + '  ·  ' : '') + 'capybarabu.app', W / 2, H2 - 60);
  }

  function toBlob(canvas) { return new Promise((res) => canvas.toBlob(res, 'image/png')); }

  function download(canvas, name) {
    return toBlob(canvas).then((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name || 'maemorbara-card.png'; a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  async function share(canvas, d) {
    const blob = await toBlob(canvas);
    const file = new File([blob], 'maemorbara-card.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'ดวงวันนี้จากแม่หมอบาร่า', text: 'พลังวันนี้ ' + d.power + '% 🔮 ลองเช็กดวงคุณบ้าง → capybarabu.app' });
        return true;
      } catch (e) { return false; }
    }
    await download(canvas);
    return false;
  }

  global.ShareCard = { render, toBlob, download, share, W, H };
})(typeof window !== 'undefined' ? window : this);

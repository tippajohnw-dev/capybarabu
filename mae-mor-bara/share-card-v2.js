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

  async function render(canvas, d) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const mascotPath = d.mascot || 'mascots/m3.webp?v=1';
    const [mascot] = await Promise.all([loadImg(mascotPath), ensureFonts()]);

    // --- พื้นหลัง cream ---
    ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
    // จุดลายเบา ๆ (toy texture)
    ctx.fillStyle = 'rgba(36,26,18,.04)';
    for (let y = 40; y < H; y += 46) for (let x = 40; x < W; x += 46) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.28); ctx.fill(); }

    // --- HERO mango block ---
    const hx = 60, hy = 70, hw = 960, hh = 520;
    popBlock(ctx, hx, hy, hw, hh, 56, C.mango, 22);

    // brand
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = "700 46px " + FONT;
    ctx.fillText('🔮 แม่หมอบาร่า', hx + 50, hy + 88);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = "500 26px " + MONO;
    ctx.fillText('CAPYBARA ORACLE', hx + 54, hy + 128);

    // kind pill (ป้ายหมวด)
    if (d.kind) {
      ctx.font = "600 30px " + FONT;
      const kw = ctx.measureText(d.kind).width + 56;
      ctx.fillStyle = C.ink;
      roundRect(ctx, hx + 50, hy + 156, kw, 56, 28); ctx.fill();
      ctx.fillStyle = C.cream; ctx.textAlign = 'center';
      ctx.fillText(d.kind, hx + 50 + kw / 2, hy + 194);
      ctx.textAlign = 'left';
    }

    // มาสคอต (พระเอก) ขวาล่างของ hero
    if (mascot) {
      const mh = 360, mw = mh * (mascot.width / mascot.height);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
      ctx.drawImage(mascot, hx + hw - mw - 24, hy + hh - mh + 30, mw, mh);
      ctx.restore();
    }

    // label + power %
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.font = "600 38px " + FONT;
    ctx.fillText(d.name ? ('พลังของ ' + d.name + ' วันนี้') : 'พลังวันนี้', hx + 54, hy + 300);
    ctx.fillStyle = '#fff'; ctx.font = "700 232px " + FONT;
    ctx.fillText(d.power, hx + 44, hy + 478);
    const pw = ctx.measureText(String(d.power)).width;
    ctx.font = "700 70px " + FONT;
    ctx.fillText('%', hx + 60 + pw, hy + 478);

    // --- speech bubble (headline) ---
    const bx = 60, by = 632, bw = 960;
    ctx.font = "500 40px " + FONT;
    // วัดความสูงที่ต้องใช้
    const lines = Math.min(3, Math.ceil(ctx.measureText(d.headline).width / (bw - 130)) || 1);
    const bh = 96 + lines * 56;
    popBlock(ctx, bx, by, bw, bh, 40, C.card, 14);
    ctx.fillStyle = C.mango2; ctx.font = "700 34px " + FONT; ctx.textAlign = 'left';
    ctx.fillText('แม่หมอบอกว่า…', bx + 54, by + 64);
    ctx.fillStyle = C.ink; ctx.font = "500 40px " + FONT;
    wrapText(ctx, d.headline, bx + 54, by + 120, bw - 110, 56, 3);

    // --- trio tiles (สี/เลข/เวลา) ---
    const ty = by + bh + 40, gap = 28, tw = (960 - gap * 2) / 3, th = 230, tx0 = 60;
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
    ctx.fillText((d.date ? d.date + '  ·  ' : '') + 'capybarabu.app', W / 2, H - 64);
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

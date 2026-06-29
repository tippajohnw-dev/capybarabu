/* =============================================================
   แม่หมอบาร่า / Capybarabu — Share-card Engine  (C2, Sprint 2)
   static · no build · canvas (client-side) → ดาวน์โหลด/แชร์
   --------------------------------------------------------------
   restyle: palette "Cute Mystic Premium" (violet/pink/mint/gold)
   ฟอนต์ Inter + Noto Sans Thai  (โหลด <link> ในหน้าก่อนเรียก)
   ทุกผลลัพธ์ (Daily / Pick-a-Card / Quiz / Fortune) = growth lever

   API (global `ShareCard`):
     ShareCard.render(canvas, data)   -> Promise (เรนเดอร์เสร็จ)
     ShareCard.toBlob(canvas)         -> Promise<Blob>
     ShareCard.download(canvas, name?)-> ดาวน์โหลด PNG
     ShareCard.share(canvas, data)    -> Promise<bool> (Web Share, fallback download)
   contract: data = { power, colorName, colorHex, number, time, headline, kind?, name?, date }
   ============================================================= */
(function (global) {
  'use strict';

  const W = 1080, H = 1350;            // 4:5 — IG feed/story, TikTok
  const FONT = "'Noto Sans Thai','Inter',-apple-system,'Segoe UI',sans-serif";

  // palette (sync กับ design-tokens.css)
  const C = {
    deep:'#2b1458', violet:'#7c4dff', pink:'#ff9fcf', mint:'#a8e6cf',
    gold:'#f7c96f', goldSoft:'#fff2ae', lav:'#cdb8ff', cream:'#fff8ed', ink:'#211832',
  };

  let _mascot = undefined;             // undefined=ยังไม่โหลด, null=โหลดไม่ได้, Image=พร้อม
  function loadMascot() {
    if (_mascot !== undefined) return Promise.resolve(_mascot);
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => { _mascot = img; res(img); };
      img.onerror = () => { _mascot = null; res(null); };
      img.src = 'mascot.png';
    });
  }
  function ensureFonts() {
    if (!global.document || !document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load("900 100px 'Noto Sans Thai'"),
      document.fonts.load("700 40px 'Noto Sans Thai'"),
      document.fonts.load("800 40px 'Inter'"),
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
  function wrapText(ctx, text, cx, y, maxW, lh, max) {
    const chars = String(text).split('');   // ภาษาไทยไม่มีเว้นวรรค — ตัดทีละอักษร
    let line = '', yy = y, lines = 0;
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, yy); line = ch; yy += lh; lines++;
        if (max && lines >= max - 1) { /* บรรทัดสุดท้าย */ }
      } else line = test;
    }
    if (line) ctx.fillText(line, cx, yy);
    return yy;
  }

  async function render(canvas, d) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    await Promise.all([loadMascot(), ensureFonts()]);

    // --- พื้นหลังจักรวาล violet → deep → pink (จาก --grad-hero) ---
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, C.deep); g.addColorStop(.55, '#6b38a7'); g.addColorStop(1, '#a8458f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // แสงนวลมุมบน
    const glow = ctx.createRadialGradient(W * .8, H * .12, 0, W * .8, H * .12, W * .6);
    glow.addColorStop(0, 'rgba(255,255,255,.30)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // --- ดาวประกาย (deterministic ตาม power) ---
    for (let i = 0; i < 70; i++) {
      const x = (i * 137.5 + d.power * 7) % W, y = ((i * i * 53) % H);
      const s = (i % 3) + 1;
      ctx.globalAlpha = .12 + (i % 5) / 11;
      ctx.fillStyle = i % 2 ? C.gold : C.mint;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;

    // --- กรอบทองมน ---
    ctx.strokeStyle = 'rgba(247,201,111,.6)'; ctx.lineWidth = 4;
    roundRect(ctx, 34, 34, W - 68, H - 68, 44); ctx.stroke();

    ctx.textAlign = 'center';

    // --- หัวแบรนด์ ---
    ctx.fillStyle = C.gold;
    ctx.font = "800 42px " + FONT;
    ctx.fillText('🔮 แม่หมอบาร่า', W / 2, 124);
    // ป้ายหมวด (kind) เป็น pill mint
    if (d.kind) {
      ctx.font = "700 30px " + FONT;
      const kw = ctx.measureText(d.kind).width + 56;
      ctx.fillStyle = 'rgba(168,230,207,.18)';
      roundRect(ctx, (W - kw) / 2, 150, kw, 56, 28); ctx.fill();
      ctx.strokeStyle = 'rgba(168,230,207,.55)'; ctx.lineWidth = 2;
      roundRect(ctx, (W - kw) / 2, 150, kw, 56, 28); ctx.stroke();
      ctx.fillStyle = C.mint; ctx.fillText(d.kind, W / 2, 188);
    }

    // --- มาสคอต ---
    if (_mascot) {
      const mh = 290, mw = mh * (_mascot.width / _mascot.height);
      ctx.drawImage(_mascot, (W - mw) / 2, 224, mw, mh);
    }

    // --- พลัง % ---
    ctx.fillStyle = 'rgba(255,249,238,.82)';
    ctx.font = "600 42px " + FONT;
    ctx.fillText(d.name ? ('พลังของ ' + d.name + ' วันนี้') : 'พลังวันนี้', W / 2, 600);
    ctx.fillStyle = C.gold;
    ctx.font = "900 168px " + FONT;
    ctx.fillText(d.power + '%', W / 2, 768);

    // --- headline / คำทำนายสั้น ---
    ctx.fillStyle = C.cream;
    ctx.font = "500 40px " + FONT;
    wrapText(ctx, d.headline, W / 2, 856, W - 200, 56, 3);

    // --- trio มงคล: สี / เลข / เวลา ---
    const y0 = 1018, bw = 286, gap = 28, total = bw * 3 + gap * 2, x0 = (W - total) / 2;
    drawTile(ctx, x0,                  y0, bw, 'สีมงคล',  d.colorName, d.colorHex, true);
    drawTile(ctx, x0 + bw + gap,       y0, bw, 'เลขมงคล', String(d.number), C.lav, false);
    drawTile(ctx, x0 + (bw + gap) * 2, y0, bw, 'เวลามงคล', d.time, C.mint, false);

    // --- footer ---
    ctx.fillStyle = 'rgba(255,249,238,.58)';
    ctx.font = "400 30px " + FONT;
    ctx.fillText((d.date ? d.date + '   ·   ' : '') + 'capybarabu.app', W / 2, H - 74);
  }

  function drawTile(ctx, x, y, w, label, value, accent, isColor) {
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    roundRect(ctx, x, y, w, 196, 28); ctx.fill();
    ctx.strokeStyle = accent + '99'; ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, 196, 28); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,249,238,.74)'; ctx.font = "500 30px " + FONT;
    ctx.fillText(label, x + w / 2, y + 54);
    if (isColor) {
      ctx.fillStyle = accent; ctx.beginPath();
      ctx.arc(x + w / 2, y + 104, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.cream; ctx.font = "700 34px " + FONT;
      ctx.fillText(value, x + w / 2, y + 170);
    } else {
      ctx.fillStyle = '#fff9ee'; ctx.font = "800 60px " + FONT;
      ctx.fillText(value, x + w / 2, y + 138);
    }
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
    await download(canvas);   // อุปกรณ์ไม่รองรับ Web Share → ดาวน์โหลดแทน
    return false;
  }

  global.ShareCard = { render, toBlob, download, share, W, H };
})(typeof window !== 'undefined' ? window : this);

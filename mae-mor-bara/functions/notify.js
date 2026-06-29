// =============================================================
// notify.js — C7: LINE push ดวงรายวัน (Sprint 4 · Retention)
// -------------------------------------------------------------
// ส่งข้อความเตือน "เปิดเช็กดวงวันนี้" วันละ 1 ครั้ง ให้ผู้ใช้ที่ opt-in
//   (users/{uid}.notifPref.daily === true) ผ่าน LINE Messaging API
//
// ⚠️ setup ก่อนใช้ (ดู C7-SETUP.md):
//   1) สร้าง LINE Messaging API channel ใน **provider เดียวกับ** Login channel
//      (2010529290) → userId (sub) จะตรงกัน push หาได้
//   2) ผู้ใช้ต้องเพิ่มเพื่อน Official Account ถึงจะรับ push ได้
//   3) ตั้ง secret:  LINE_MESSAGING_TOKEN (channel access token)
//                     NOTIFY_ADMIN_KEY (กันคนเรียก trigger มั่ว)
//   4) deploy:  firebase deploy --only functions:sendDailyFortune,functions:sendDailyFortuneNow
//
// push ใช้ multicast (ข้อความเดียวกันทุกคน → batch 500/ครั้ง, ประหย่ง quota)
// ผลลัพธ์ของแต่ละ run เก็บที่ notifyRuns/ (สถิติ KPI: LINE push reach)
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const lineMessagingToken = defineSecret('LINE_MESSAGING_TOKEN');
const notifyAdminKey = defineSecret('NOTIFY_ADMIN_KEY');

const REGION = 'asia-southeast1';
const APP_LINK = 'https://capybarabu-mae-mhor.web.app/app.html';

// เสียงแม่หมอกวน (CAPY POP) — สุ่มตามวันที่ ไม่ให้ซ้ำทุกวัน
const DAILY_MESSAGES = [
  '🔮 แม่หมอบาร่าทักมาแล้วจ้า! วันนี้พลังดวงคุณเป็นไง อยากรู้มั้ย? มาเปิดดูสีมงคล เลขนำโชค กับไพ่ของวันนี้กันน้า',
  '✨ ตื่นมาเช็กดวงกับแม่หมอก่อนน้า! วันนี้แม่หมอเห็นลางดี ๆ รออยู่ รีบมาเปิดการ์ดประจำวันเลยจ้ะ',
  '🌙 แม่หมอบาร่าเปิดไพ่ให้แล้วน้า~ วันนี้มีอะไรเซอร์ไพรส์รออยู่ มาดูพลัง สีมงคล เลขเด็ดของวันนี้กัน',
  '💸 วันนี้ดวงการเงินมาแรงรึเปล่า? แม่หมอบาร่ารู้คำตอบอยู่นะ แวะมาเช็กดวงประจำวันหน่อยจ้า',
  '🧿 อย่าลืมเช็กดวงวันนี้กับแม่หมอน้า! สีมงคล เวลามงคล กับสิ่งที่ควรทำวันนี้ แม่หมอเตรียมไว้ให้แล้ว',
];
const pickMsg = (n) => DAILY_MESSAGES[((n % DAILY_MESSAGES.length) + DAILY_MESSAGES.length) % DAILY_MESSAGES.length];

// ผู้รับ = users ที่ opt-in daily + มี lineUserId (เพิ่มเพื่อน OA แล้วเท่านั้นถึงรับได้จริง)
async function collectRecipients() {
  const snap = await admin.firestore().collection('users').where('notifPref.daily', '==', true).get();
  const ids = [];
  snap.forEach((d) => { const u = d.data(); if (u.lineUserId) ids.push(u.lineUserId); });
  return [...new Set(ids)];
}

// multicast ทีละ 500 (ลิมิตของ LINE)
async function multicast(token, userIds, text) {
  let ok = 0, fail = 0;
  for (let i = 0; i < userIds.length; i += 500) {
    const to = userIds.slice(i, i + 500);
    const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    });
    if (res.ok) ok += to.length;
    else { fail += to.length; console.error('multicast fail', res.status, await res.text().catch(() => '')); }
  }
  return { ok, fail };
}

async function runDailyPush() {
  const token = lineMessagingToken.value();
  if (!token) { console.error('LINE_MESSAGING_TOKEN not set'); return { ok: false, reason: 'no_token' }; }

  const ids = await collectRecipients();
  if (!ids.length) { console.log('no recipients'); return { ok: true, sent: 0 }; }

  const text = pickMsg(new Date().getDate()) + '\n\n👉 ' + APP_LINK;
  const result = await multicast(token, ids, text);

  await admin.firestore().collection('notifyRuns').add({
    at: admin.firestore.FieldValue.serverTimestamp(),
    recipients: ids.length, ...result,
  }).catch((e) => console.error('log run', e.message));

  console.log('daily push done', { recipients: ids.length, ...result });
  return { ok: true, sent: result.ok, failed: result.fail, recipients: ids.length };
}

// ---- scheduled: ทุกวัน 08:00 (Asia/Bangkok) ----
exports.sendDailyFortune = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Asia/Bangkok', region: REGION, secrets: [lineMessagingToken] },
  async () => { await runDailyPush(); },
);

// ---- manual trigger (ทดสอบ / ส่งเอง) — ต้องมี header x-admin-key ตรงกับ NOTIFY_ADMIN_KEY ----
exports.sendDailyFortuneNow = onRequest(
  { region: REGION, cors: true, invoker: 'public', timeoutSeconds: 60, secrets: [lineMessagingToken, notifyAdminKey] },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    const key = notifyAdminKey.value();
    if (!key || req.get('x-admin-key') !== key) { res.status(403).json({ error: 'Forbidden' }); return; }
    try {
      const r = await runDailyPush();
      res.status(200).json(r);
    } catch (e) {
      console.error('sendDailyFortuneNow error:', e.message);
      res.status(500).json({ error: 'push failed' });
    }
  },
);

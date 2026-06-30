// =============================================================
// notify.js — C7: LINE push ดวงรายวัน (Sprint 4 · Retention)
//             + Sprint 6.5: personalized Flex Message card
// -------------------------------------------------------------
// ส่ง "การ์ดดวงเฉพาะคน" วันละ 1 ครั้ง ให้ผู้ใช้ที่ opt-in
//   (users/{uid}.notifPref.daily === true + มี lineUserId)
// ผ่าน LINE Messaging API → push เป็น **Flex Message** (การ์ดสวย)
//   โชว์ พลัง% · สีมงคล · เลขมงคล · เวลามงคล · คำทักจากแม่หมอ + ปุ่มเปิดแอป
//
// ⚠️ setup (ดู C7-SETUP.md):
//   1) Messaging API channel ใน **provider เดียวกับ** Login channel (2010529290)
//      → userId (sub) ตรงกัน push หาได้
//   2) ผู้ใช้ต้องเพิ่มเพื่อน OA ถึงจะรับได้
//   3) secret: LINE_MESSAGING_TOKEN (channel access token) · NOTIFY_ADMIN_KEY
//   4) deploy: firebase deploy --only functions:sendDailyFortune,functions:sendDailyFortuneNow
//
// personalized = ต้อง push ทีละคน (multicast ส่งได้แค่ข้อความเดียวกัน) →
//   ทำเป็น batch concurrency กัน rate limit · ผล run เก็บที่ notifyRuns/ (KPI reach)
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Fortune } = require('./fortune-engine.js');   // COPY ของ ../fortune-engine.js (bundle ไม่รวมไฟล์นอก functions/)

const lineMessagingToken = defineSecret('LINE_MESSAGING_TOKEN');
const notifyAdminKey = defineSecret('NOTIFY_ADMIN_KEY');

const REGION = 'asia-southeast1';
const APP_LINK = 'https://capybarabu-mae-mhor.web.app/app.html';
const HERO_IMG = 'https://capybarabu-mae-mhor.web.app/mascots/line-hero.png';   // มาสคอต m3 บนพื้นมะม่วง (PNG, LINE ไม่รองรับ webp)

// "วันนี้" ตามเวลาไทย (server = UTC → +7 ชม. แล้วอ่าน parts เป็น Bangkok wall-clock)
const bangkokNow = () => new Date(Date.now() + 7 * 3600 * 1000);

// ---- Flex bubble (CAPY POP card) ----
function statBox(label, value, bg) {
  return {
    type: 'box', layout: 'vertical', flex: 1, backgroundColor: bg, cornerRadius: '12px',
    paddingAll: '10px', borderWidth: '2px', borderColor: '#241a12', contents: [
      { type: 'text', text: label, size: 'xxs', color: '#5c5042', align: 'center', weight: 'bold' },
      { type: 'text', text: String(value), size: 'md', color: '#241a12', align: 'center', weight: 'bold', margin: 'xs', wrap: true },
    ],
  };
}
function buildFlex(d) {
  const name = (d.name && String(d.name).trim()) || 'คุณ';
  return {
    type: 'bubble', size: 'mega',
    body: {
      type: 'box', layout: 'vertical', paddingAll: '0px', backgroundColor: '#fff9f1', contents: [
        // HERO mango
        {
          type: 'box', layout: 'vertical', backgroundColor: '#ff6a2b', paddingAll: '18px', spacing: 'sm', contents: [
            { type: 'text', text: '🔮 แม่หมอบาร่า', size: 'sm', color: '#ffffff', weight: 'bold' },
            {
              type: 'box', layout: 'horizontal', contents: [
                {
                  type: 'box', layout: 'vertical', flex: 5, justifyContent: 'center', contents: [
                    { type: 'text', text: 'พลังของ ' + name + ' วันนี้', size: 'sm', color: '#ffffffe6', weight: 'bold', wrap: true },
                    {
                      type: 'box', layout: 'baseline', margin: 'sm', contents: [
                        { type: 'text', text: String(d.power), size: '5xl', color: '#ffffff', weight: 'bold', flex: 0 },
                        { type: 'text', text: '%', size: 'xxl', color: '#ffffff', weight: 'bold', flex: 0, margin: 'sm' },
                      ],
                    },
                  ],
                },
                { type: 'image', url: HERO_IMG, flex: 4, size: 'full', aspectRatio: '1:1', aspectMode: 'fit', gravity: 'bottom' },
              ],
            },
          ],
        },
        // BODY cream
        {
          type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md', contents: [
            {
              type: 'box', layout: 'vertical', backgroundColor: '#fff6e9', cornerRadius: '14px',
              paddingAll: '14px', borderWidth: '2px', borderColor: '#241a12', contents: [
                { type: 'text', text: 'แม่หมอบอกว่า…', size: 'xs', color: '#e8551a', weight: 'bold' },
                { type: 'text', text: d.headline, size: 'sm', color: '#241a12', wrap: true, margin: 'sm' },
              ],
            },
            {
              type: 'box', layout: 'horizontal', spacing: 'sm', contents: [
                statBox('สีมงคล', d.color.name, '#ffd9e6'),
                statBox('เลขมงคล', d.number, '#c7f5ec'),
                statBox('เวลามงคล', d.time, '#ffe9ad'),
              ],
            },
            {
              type: 'button', style: 'primary', color: '#241a12', height: 'md',
              action: { type: 'uri', label: 'เปิดดวงเต็มในแอป ✨', uri: APP_LINK },
            },
          ],
        },
      ],
    },
  };
}

// ผู้รับ = users ที่ opt-in daily + มี lineUserId (เพิ่มเพื่อน OA แล้วเท่านั้น) — เก็บ profile เพื่อ personalize
async function collectRecipients() {
  const snap = await admin.firestore().collection('users').where('notifPref.daily', '==', true).get();
  const out = [];
  const seen = new Set();
  snap.forEach((doc) => {
    const u = doc.data();
    if (u.lineUserId && !seen.has(u.lineUserId)) {
      seen.add(u.lineUserId);
      out.push({ uid: doc.id, lineUserId: u.lineUserId, displayName: u.displayName, birthDate: u.birthDate });
    }
  });
  return out;
}

async function pushFlex(token, to, flex, altText) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ to, messages: [{ type: 'flex', altText, contents: flex }] }),
  });
  if (!res.ok) console.error('push fail', res.status, await res.text().catch(() => ''));
  return res.ok;
}

async function runDailyPush() {
  const token = lineMessagingToken.value();
  if (!token) { console.error('LINE_MESSAGING_TOKEN not set'); return { ok: false, reason: 'no_token' }; }

  const users = await collectRecipients();
  if (!users.length) { console.log('no recipients'); return { ok: true, sent: 0 }; }

  const today = bangkokNow();
  let ok = 0, fail = 0;
  const CHUNK = 5;                                  // push ทีละ 5 กัน rate limit
  for (let i = 0; i < users.length; i += CHUNK) {
    const batch = users.slice(i, i + CHUNK);
    const results = await Promise.all(batch.map((u) => {
      const d = Fortune.daily({ uid: u.uid, displayName: u.displayName, birthDate: u.birthDate }, today);
      const name = (u.displayName && String(u.displayName).trim()) || 'คุณ';
      const altText = '🔮 ดวงวันนี้ของ ' + name + ' · พลัง ' + d.power + '% — เปิดดูเต็มในแอปแม่หมอบาร่า';
      return pushFlex(token, u.lineUserId, buildFlex(d), altText).catch(() => false);
    }));
    results.forEach((r) => (r ? ok++ : fail++));
  }

  await admin.firestore().collection('notifyRuns').add({
    at: admin.firestore.FieldValue.serverTimestamp(),
    recipients: users.length, ok, fail, kind: 'flex',
  }).catch((e) => console.error('log run', e.message));

  console.log('daily push done', { recipients: users.length, ok, fail });
  return { ok: true, sent: ok, failed: fail, recipients: users.length };
}

// ---- scheduled: ทุกวัน 08:00 (Asia/Bangkok) ----
exports.sendDailyFortune = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Asia/Bangkok', region: REGION, secrets: [lineMessagingToken] },
  async () => { await runDailyPush(); },
);

// ---- manual trigger (ทดสอบ/ส่งเอง) — ต้องมี header x-admin-key ตรงกับ NOTIFY_ADMIN_KEY ----
exports.sendDailyFortuneNow = onRequest(
  { region: REGION, cors: true, invoker: 'public', timeoutSeconds: 120, secrets: [lineMessagingToken, notifyAdminKey] },
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

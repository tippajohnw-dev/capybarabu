// =============================================================
// webhook.js — C7+: LINE Messaging webhook (follow/unfollow → oaFriend)
// -------------------------------------------------------------
// รับ event จาก OA แม่หมอบาร่า (channel 2010545788) เพื่อรู้ว่าใคร
// "เพิ่มเพื่อน / บล็อก" → เก็บ users/{uid}.oaFriend = true/false
// แอปอ่านค่านี้ไปซ่อนปุ่ม "เพิ่มเพื่อน" เมื่อเป็นเพื่อนแล้ว
//
// userId ใน event = Messaging-provider userId — ตรงกับ lineUserId ที่
// lineLogin เก็บ เพราะ Login + Messaging อยู่ provider เดียวกัน (2005291693)
//
// ⚠️ setup (ดู C7-SETUP.md):
//   1) secret LINE_MESSAGING_CHANNEL_SECRET (= "ความลับแชนแนล" ของ 2010545788)
//      — ตัวที่เคยโชว์ในแชตถูก exposed แนะนำ reissue ก่อนตั้ง
//   2) deploy:  firebase deploy --only functions:lineWebhook --project capybarabu-mae-mhor
//   3) ตั้ง Webhook URL ใน LINE Developers/OA = URL ของ lineWebhook + เปิด "Use webhook"
//      ปิด auto-reply ใน OA Manager
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');

const lineChannelSecret = defineSecret('LINE_MESSAGING_CHANNEL_SECRET');
const REGION = 'asia-southeast1';

// อัปเดต oaFriend ให้ทุก user doc ที่ lineUserId ตรง (ปกติมี 0–1)
async function setFriend(userId, isFriend) {
  const snap = await admin.firestore().collection('users').where('lineUserId', '==', userId).get();
  if (snap.empty) { console.log('webhook: no user for', userId, '(', isFriend ? 'follow' : 'unfollow', ')'); return; }
  await Promise.all(snap.docs.map((d) => d.ref.set({
    oaFriend: isFriend,
    oaFriendUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })));
}

exports.lineWebhook = onRequest(
  { region: REGION, invoker: 'public', secrets: [lineChannelSecret], timeoutSeconds: 30 },
  async (req, res) => {
    // 1) verify ลายเซ็น LINE (กัน event ปลอม)
    const secret = lineChannelSecret.value();
    const sig = req.get('x-line-signature') || '';
    const body = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64');
    if (!secret || expected !== sig) {
      console.error('webhook: bad signature');
      res.status(401).send('bad signature');
      return;
    }

    // 2) ตอบ 200 ให้ LINE ก่อนเสมอ แล้วค่อยประมวลผล
    res.status(200).send('ok');

    const events = (req.body && req.body.events) || [];
    for (const ev of events) {
      const userId = ev.source && ev.source.userId;
      if (!userId) continue;
      try {
        if (ev.type === 'follow') await setFriend(userId, true);
        else if (ev.type === 'unfollow') await setFriend(userId, false);
      } catch (e) { console.error('webhook event error:', e.message); }
    }
  },
);

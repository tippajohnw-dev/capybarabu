// =============================================================
// payment.js — D3: Charm Shop payment (Sprint 5)
// -------------------------------------------------------------
// PromptPay ผ่าน Omise (provider โฮสต์) — สร้าง charge ฝั่ง server
// ราคา/ออเดอร์ยืนยันที่ server (กัน client ปลอมราคา) · ไม่แตะบัตรที่ client
//   client ── POST {productId} + Firebase ID token ──► createCharge
//   createCharge ── สร้าง order(pending) + Omise PromptPay charge ──► คืน QR
//   user สแกนจ่าย → Omise ยิง webhook → omiseWebhook ── re-fetch charge ──► mark paid
//
// ⚠️ setup (ดู D3-SETUP.md):
//   secret OMISE_SECRET_KEY · ตั้ง CHARGE_URL ใน app.html · ตั้ง webhook URL ใน Omise dashboard
//   + แก้ firestore.rules (orders create=pending เท่านั้น, ห้าม client เขียน status=paid)
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const omiseSecretKey = defineSecret('OMISE_SECRET_KEY');
const SHARED = { cors: true, invoker: 'public', region: 'asia-southeast1', timeoutSeconds: 30 };

// แคตตาล็อกฝั่ง server (ราคาที่เชื่อถือได้) — sync กับ shop-catalog.js
const CATALOG = {
  'money-coin':    { name: 'เหรียญทองเรียกทรัพย์', price: 59 },
  'money-tree':    { name: 'ต้นไม้เงินงอกเงย',     price: 79 },
  'love-heart':    { name: 'หัวใจชมพูมัดใจ',       price: 59 },
  'love-knot':     { name: 'ด้ายแดงผูกเนื้อคู่',    price: 79 },
  'work-star':     { name: 'ดาวนำทางความสำเร็จ',   price: 59 },
  'protect-eye':   { name: 'ตาเทพกันพลังลบ',        price: 59 },
  'protect-shield':{ name: 'โล่จันทรามณี',          price: 89 },
  'health-leaf':   { name: 'ใบไม้เขียวเติมพลัง',    price: 39 },
  'luck-star':     { name: 'ดาวนำโชคคาปิบารา',      price: 49 },
  'luck-rainbow':  { name: 'สายรุ้งหลังพายุ',       price: 69 },
};

const omiseAuth = (sk) => 'Basic ' + Buffer.from(sk + ':').toString('base64');
const serverTime = () => admin.firestore.FieldValue.serverTimestamp();

// ---- POST /createCharge  { productId } + Bearer <Firebase ID token> → { orderId, qrImage } ----
exports.createCharge = onRequest({ ...SHARED, secrets: [omiseSecretKey] }, async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!m) { res.status(401).json({ error: 'Missing token' }); return; }

  let uid;
  try { uid = (await admin.auth().verifyIdToken(m[1])).uid; }
  catch (e) { res.status(401).json({ error: 'Invalid token' }); return; }

  const prod = CATALOG[(req.body || {}).productId];
  if (!prod) { res.status(400).json({ error: 'unknown product' }); return; }

  const sk = omiseSecretKey.value();
  if (!sk) { res.status(500).json({ error: 'payment not configured' }); return; }

  const orderRef = admin.firestore().collection('users').doc(uid).collection('orders').doc();
  const orderId = orderRef.id;

  try {
    // สร้าง Omise PromptPay charge (amount = สตางค์)
    const body = new URLSearchParams();
    body.set('amount', String(prod.price * 100));
    body.set('currency', 'thb');
    body.set('source[type]', 'promptpay');
    body.set('metadata[uid]', uid);
    body.set('metadata[orderId]', orderId);
    body.set('metadata[productId]', req.body.productId);

    const r = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: { Authorization: omiseAuth(sk), 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const charge = await r.json();
    if (!r.ok || charge.object === 'error') {
      console.error('omise charge error:', JSON.stringify(charge));
      res.status(502).json({ error: 'charge failed' });
      return;
    }
    const qr = charge.source && charge.source.scannable_code
      && charge.source.scannable_code.image && charge.source.scannable_code.image.download_uri;

    await orderRef.set({
      productId: req.body.productId, name: prod.name, price: prod.price,
      status: 'pending', chargeId: charge.id, createdAt: serverTime(),
    });

    res.status(200).json({ orderId, chargeId: charge.id, qrImage: qr });
  } catch (e) {
    console.error('createCharge error:', e.message);
    res.status(500).json({ error: 'payment service unavailable' });
  }
});

// ---- POST /omiseWebhook — Omise ยิงมาเมื่อ charge เปลี่ยนสถานะ ----
// ไม่เชื่อ body ตรง ๆ → re-fetch charge จาก Omise (authoritative) แล้วค่อย mark paid
exports.omiseWebhook = onRequest({ ...SHARED, secrets: [omiseSecretKey] }, async (req, res) => {
  res.status(200).send('ok');   // ack เร็ว
  try {
    const event = req.body;
    const chargeId = event && event.data && event.data.id;
    if (!event || event.object !== 'event' || !chargeId) return;

    const sk = omiseSecretKey.value();
    const r = await fetch('https://api.omise.co/charges/' + chargeId, { headers: { Authorization: omiseAuth(sk) } });
    const charge = await r.json();
    if (charge.status !== 'successful' || !charge.paid) return;

    const uid = charge.metadata && charge.metadata.uid;
    const orderId = charge.metadata && charge.metadata.orderId;
    if (!uid || !orderId) { console.warn('webhook: charge ไม่มี metadata', chargeId); return; }

    await admin.firestore().collection('users').doc(uid).collection('orders').doc(orderId)
      .set({ status: 'paid', paidAt: serverTime() }, { merge: true });
    console.log('order paid', uid, orderId, charge.amount);
    // TODO (delivery): ส่ง digital charm / push LINE ขอบคุณ — ต่อยอดภายหลัง
  } catch (e) { console.error('omiseWebhook error:', e.message); }
});

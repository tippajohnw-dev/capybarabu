// =============================================================
// auth.js — POC: LINE Login → Firebase custom token (Unblocker A)
// -------------------------------------------------------------
// flow:
//   client (LIFF) ── liff.getIDToken() ──► lineLogin Function
//   Function ── verify id_token กับ LINE ──► ได้ LINE userId (sub)
//   Function ── admin.auth().createCustomToken(uid) ──► firebaseToken
//   client ── signInWithCustomToken(firebaseToken) ──► Firebase user จริง
//
// ID token เป็น JWT (OIDC) — ยืนยันผ่าน endpoint ของ LINE เอง
// (ตรวจ signature/aud/exp ให้) จึงไม่ต้องใช้ channel secret ในขั้นนี้
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

// LINE Login channel ID ที่ LIFF app สังกัด — ใช้เป็น client_id/aud ตอน verify
// ตั้งค่าได้ตอน deploy:  firebase functions:config ผ่าน .env หรือ --set
// (ไม่ใช่ความลับ — แต่ใช้ defineString เพื่อ config ได้โดยไม่แก้โค้ด)
const lineChannelId = defineString('LINE_LOGIN_CHANNEL_ID');

const SHARED_OPTIONS = {
  cors: true,
  invoker: 'public',
  region: 'asia-southeast1',
  minInstances: 0,
};

// POST { idToken }  ->  { firebaseToken, profile, uid }
exports.lineLogin = onRequest(
  { ...SHARED_OPTIONS, timeoutSeconds: 20 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { idToken } = req.body || {};
    if (!idToken) {
      res.status(400).json({ error: 'Missing idToken' });
      return;
    }

    const channelId = lineChannelId.value();
    if (!channelId) {
      console.error('LINE_LOGIN_CHANNEL_ID not set');
      res.status(500).json({ error: 'LINE channel not configured' });
      return;
    }

    try {
      // 1) ยืนยัน LINE ID token — LINE ตรวจ signature/exp ให้
      const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
      });
      const payload = await verifyRes.json();

      if (!verifyRes.ok || payload.error) {
        console.error('LINE verify failed:', JSON.stringify(payload));
        res.status(401).json({ error: 'Invalid LINE token' });
        return;
      }
      // กัน token ที่ออกให้ channel อื่น
      if (payload.aud !== channelId) {
        console.error('aud mismatch:', payload.aud, '≠', channelId);
        res.status(401).json({ error: 'Token audience mismatch' });
        return;
      }

      const lineUserId = payload.sub;          // LINE userId (ถาวรต่อ channel)
      const uid = `line:${lineUserId}`;        // Firebase uid

      // 2) mint Firebase custom token
      //    หมายเหตุ: service account ของ Function ต้องมีสิทธิ์ signBlob
      //    (role: Service Account Token Creator) — ดู POC-AUTH.md
      const firebaseToken = await admin.auth().createCustomToken(uid, {
        provider: 'line',
      });

      // 3) upsert profile shell ใน users/{uid} (เก็บชื่อ/รูปจาก LINE)
      //    fire-and-forget — ไม่บล็อก response
      admin.firestore().collection('users').doc(uid).set(
        {
          provider: 'line',
          lineUserId,
          displayName: payload.name || null,
          photoURL: payload.picture || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      ).catch((err) => console.error('user upsert error:', err.message));

      res.status(200).json({
        firebaseToken,
        uid,
        profile: { name: payload.name || null, picture: payload.picture || null },
      });
    } catch (err) {
      console.error('lineLogin error:', err.message);
      res.status(500).json({ error: 'Login service unavailable' });
    }
  },
);

// =============================================================
// POST /claimReward — มอบ Capy Points แรกเข้า (server-side, idempotent)
// client เขียน capyPoints เองไม่ได้ (rules บล็อกกันโกง) → ต้องผ่าน function
// header: Authorization: Bearer <Firebase ID token>
// =============================================================
const SIGNUP_REWARD = 20;

exports.claimReward = onRequest(
  { ...SHARED_OPTIONS, timeoutSeconds: 20 },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

    const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!m) { res.status(401).json({ error: 'Missing token' }); return; }

    try {
      const decoded = await admin.auth().verifyIdToken(m[1]);
      const ref = admin.firestore().collection('users').doc(decoded.uid);

      const result = await admin.firestore().runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : {};
        if (data.signupRewardGranted) {
          return { granted: false, capyPoints: data.capyPoints || 0 };
        }
        const capyPoints = (data.capyPoints || 0) + SIGNUP_REWARD;
        tx.set(ref, {
          capyPoints,
          signupRewardGranted: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { granted: true, capyPoints };
      });

      res.status(200).json(result);
    } catch (err) {
      console.error('claimReward error:', err.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  },
);

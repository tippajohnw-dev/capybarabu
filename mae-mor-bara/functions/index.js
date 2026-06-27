const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const {
  SYSTEM_PROMPT, buildUserPrompt,
  SOULMATE_SYSTEM_PROMPT, buildSoulmatePrompt,
  LIFEGRAPH_SYSTEM_PROMPT, buildLifeGraphPrompt,
} = require('./prompt');

admin.initializeApp();
const db = admin.firestore();

// Auth: LINE Login → Firebase custom token + signup reward grant (Unblocker A)
exports.lineLogin = require('./auth').lineLogin;
exports.claimReward = require('./auth').claimReward;

const openaiApiKey = defineSecret('OPENAI_API_KEY');

// =============================================================
// Rate limiting
// =============================================================
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW };
  if (now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  rateMap.set(ip, entry);
  return false;
}

const SHARED_OPTIONS = {
  cors: true,
  invoker: 'public',
  region: 'asia-southeast1',
  minInstances: 0,
};

// =============================================================
// GET /getCount — return total fortune readings
// =============================================================
exports.getCount = onRequest(SHARED_OPTIONS, async (req, res) => {
  try {
    const snap = await db.collection('stats').doc('global').get();
    const count = snap.data()?.count || 0;
    res.status(200).json({ count });
  } catch (err) {
    console.error('getCount error:', err.message);
    res.status(200).json({ count: 0 });
  }
});

// =============================================================
// POST /askFortune — GPT-4o-mini fortune reading
// =============================================================
exports.askFortune = onRequest(
  { ...SHARED_OPTIONS, secrets: [openaiApiKey], timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const {
      birthDate, question, type, zodiac, zodiacTraits, chineseZodiac, today,
      birthDayName, birthDayColor, birthDayColorMeaning, lifePath, todayColor, todayColorMeaning,
    } = req.body || {};

    if (!birthDate || !question || !zodiac) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const userPrompt = buildUserPrompt({
      birthDate, question, type, zodiac, zodiacTraits, chineseZodiac, today,
      birthDayName, birthDayColor, birthDayColorMeaning, lifePath, todayColor, todayColorMeaning,
    });

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 550,
          temperature: 0.9,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const fortune = data.choices?.[0]?.message?.content;
      if (!fortune) throw new Error('Empty response from OpenAI');

      // Increment counter (fire-and-forget — ไม่ทำให้ช้า)
      db.collection('stats').doc('global')
        .set({ count: admin.firestore.FieldValue.increment(1) }, { merge: true })
        .catch(err => console.error('Counter error:', err.message));

      res.status(200).json({ fortune });
    } catch (err) {
      console.error('OpenAI API error:', err.message);
      res.status(500).json({ error: 'Fortune telling service unavailable' });
    }
  }
);

// =============================================================
// POST /askSoulmate — เนื้อคู่ประตูถัดไป (JSON output)
// =============================================================
exports.askSoulmate = onRequest(
  { ...SHARED_OPTIONS, secrets: [openaiApiKey], timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { birthDate, zodiac } = req.body || {};
    if (!birthDate || !zodiac) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const userPrompt = buildSoulmatePrompt(req.body);

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 500,
          temperature: 0.9,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SOULMATE_SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) throw new Error('Empty response from OpenAI');

      let soulmate;
      try { soulmate = JSON.parse(raw); }
      catch { throw new Error('Bad JSON from OpenAI'); }

      // clamp ตัวเลขให้อยู่ 0-100 กันค่าเพี้ยน
      const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
      soulmate.handsomeLevel = clamp(soulmate.handsomeLevel);
      soulmate.wealthLevel   = clamp(soulmate.wealthLevel);

      db.collection('stats').doc('global')
        .set({ count: admin.firestore.FieldValue.increment(1) }, { merge: true })
        .catch(err => console.error('Counter error:', err.message));

      res.status(200).json({ soulmate });
    } catch (err) {
      console.error('Soulmate API error:', err.message);
      res.status(500).json({ error: 'Soulmate service unavailable' });
    }
  }
);

// =============================================================
// POST /askLifeGraph — แม่หมออ่านกราฟชีวิต (สั้น + cache เพื่อประหยัด token)
// ตัวเลขกราฟคำนวณฝั่ง client (deterministic) ที่นี่แค่เล่าเป็นคำทำนาย
// =============================================================
exports.askLifeGraph = onRequest(
  { ...SHARED_OPTIONS, secrets: [openaiApiKey], timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown';
    if (isRateLimited(ip)) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }

    const { birthDate, zodiac, year } = req.body || {};
    if (!birthDate || !zodiac) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // cache key — input เป็น deterministic (วันเกิด + ปีปัจจุบัน) → cache ได้เต็มที่
    const cacheKey = `${String(birthDate).replace(/[^0-9-]/g, '')}_${String(year || 'na').replace(/[^0-9]/g, '')}`;

    // 1) ลอง cache ก่อน — hit = 0 token
    try {
      const snap = await db.collection('lifegraphCache').doc(cacheKey).get();
      const cached = snap.exists ? snap.data()?.narrative : null;
      if (cached) {
        res.status(200).json({ narrative: cached, cached: true });
        return;
      }
    } catch (err) {
      console.error('lifegraph cache read error:', err.message);
    }

    // 2) cache miss → เรียก AI (output สั้น ≤80 คำ)
    const userPrompt = buildLifeGraphPrompt(req.body);
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 380,
          temperature: 0.8,
          messages: [
            { role: 'system', content: LIFEGRAPH_SYSTEM_PROMPT },
            { role: 'user',   content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const narrative = data.choices?.[0]?.message?.content;
      if (!narrative) throw new Error('Empty response from OpenAI');

      // เก็บ cache (fire-and-forget)
      db.collection('lifegraphCache').doc(cacheKey)
        .set({ narrative, at: admin.firestore.FieldValue.serverTimestamp() })
        .catch(err => console.error('lifegraph cache write error:', err.message));

      res.status(200).json({ narrative, cached: false });
    } catch (err) {
      console.error('LifeGraph API error:', err.message);
      res.status(500).json({ error: 'Life graph service unavailable' });
    }
  }
);

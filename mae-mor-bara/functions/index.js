const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const openaiApiKey = defineSecret('OPENAI_API_KEY');

// =============================================================
// System prompt — persona of Mae Mor Bara
// =============================================================
const SYSTEM_PROMPT = `คุณคือ "แม่หมอบาร่า" — หมอดูแคปบาร่ายิปซีผู้ลึกลับ พูดจาแบบกระเทยไทยสุดๆ อบอุ่น ดราม่า เอ็นดูลูกค้ามาก

สไตล์การพูด (สำคัญมาก):
- พูดภาษาไทยล้วนๆ ห้ามใช้คำอังกฤษเด็ดขาด ยกเว้นชื่อดาวหรือราศีที่จำเป็น
- เรียกตัวเองว่า "แม่" เรียกผู้ใช้ว่า "ลูก" หรือ "หนู"
- ลงท้ายประโยคด้วย "จ้า" "นะจ้า" "เลย" "เนอะ" "อ่ะ" "โว้ย" สลับกันไป
- ใส่เสียงอุทานแบบกระเทย เช่น "โอ้โหหห" "เฮ้ยยย" "อ๊ะๆๆ" "โอ๊ยยย" "ว้าวววว" "ปังมากกก"
- พูดแบบห่วงใยจริงๆ มีเมตตา แต่แซวได้บ้าง
- ใช้คำเสริม เช่น "เลิศมาก" "เริ่ดโขก" "ปังแตก" "เฟี้ยวเว่อร์" "น่ารักมุ้งมิ้ง" "หล่อโคตร"
- ดราม่าได้บ้างแต่ไม่มากเกิน

กฎเนื้อหา (ห้ามละเมิด):
1. ใช้ภาษาไทยเท่านั้น ห้ามมีคำอังกฤษในคำตอบ
2. อ้างอิงราศีและนักษัตรจริงๆ เสมอ ใส่ข้อมูลโหราศาสตร์จริง เช่น ดาวประจำราศี ธาตุ ทิศมงคล
3. เปิดด้วยประโยคดึงดูด เช่น "โอ้โหหห ลูกฟังแม่ก่อนนะจ้า~" / "เฮ้ยยย ลูกแก้วบอกมาเลยนะ" / "อ๊ะๆๆ วันนี้ดาวมันแบบ..."
4. ถ้าดวงไม่ดี บอกตรงๆ แบบอ้อมๆ ขำๆ มีทางออกเสมอ ไม่ทำให้กลัว
5. ความยาวรวมไม่เกิน 120 คำ กระชับ อ่านง่าย ติดหู
6. ลงท้ายด้วยคำแนะนำ 1 ประโยค ขึ้นต้นด้วย "💡 แม่บอกเลยนะจ้า:"
7. ห้ามทำนายหวย หรือบอกวันตาย`;

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

    const { birthDate, question, type, zodiac, zodiacTraits, chineseZodiac, today } = req.body || {};

    if (!birthDate || !question || !zodiac) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const safeQuestion = String(question).slice(0, 300);

    const userPrompt = `ข้อมูลผู้ถาม:
- วันเกิด: ${birthDate}
- ราศี: ${zodiac}
- นิสัยประจำราศี: ${zodiacTraits || '-'}
- ปีนักษัตร: ${chineseZodiac || '-'}
- วันที่ถาม: ${today}
- ประเภทคำถาม: ดวง${type === 'daily' ? 'รายวัน' : 'รายเดือน'}

คำถาม: ${safeQuestion}`;

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
          max_tokens: 700,
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

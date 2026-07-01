// =============================================================
// deep.js — #1: ดวงรายวัน "เชิงลึก" ด้วย AI (GPT-4o-mini)
// -------------------------------------------------------------
// รับข้อมูลโหราศาสตร์ที่ client คำนวณมาแล้ว (ราศี/ธาตุ/นักษัตร/เลขชะตา/สีมงคล)
// → ให้ AI เขียนคำทำนายเชิงลึกเสียงแม่หมอ (JSON) → cache ต่อ uid+วัน
// (deterministic engine ยังเป็น fallback ฝั่ง client ถ้า AI ล่ม)
// house standard = OpenAI GPT-4o-mini (secret OPENAI_API_KEY เดิม)
// =============================================================
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const openaiApiKey = defineSecret('OPENAI_API_KEY');
const REGION = 'asia-southeast1';

function bkkDay() {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  const z = (n) => String(n).padStart(2, '0');
  return d.getUTCFullYear() + '-' + z(d.getUTCMonth() + 1) + '-' + z(d.getUTCDate());
}

const SYS = `คุณคือ "แม่หมอบาร่า" หมอดูแคปบารายิปซี พูดจาแบบกระเทยไทยอบอุ่น ขำ แซวได้ ห่วงใยลูกค้ามาก ใช้ภาษาไทยล้วน (ห้ามคำอังกฤษ ยกเว้นชื่อราศี) เรียกตัวเองว่า "แม่" เรียกผู้ใช้ว่า "ลูก" หรือ "หนู"
หน้าที่: อ่านดวง "รายวันเชิงลึก" จากข้อมูลโหราศาสตร์ที่คำนวณมาให้แล้ว — ใช้ตามที่ให้มาเป๊ะๆ ห้ามคำนวณเอง ห้ามมั่ว ห้ามขัดกันเอง
กฎ: โทนบวก ให้กำลังใจ มีทางออกเสมอ ไม่ทำให้กลัว · ห้ามทำนายหวย/เลขเด็ด/วันตาย · ห้าม markdown
ตอบเป็น JSON object เท่านั้น ตาม schema (ทุก field ภาษาไทยล้วน):
{
  "headline": "พาดหัวสั้นดึงดูด ไม่เกิน 26 ตัวอักษร ไม่ต้องมีอีโมจิ",
  "bubble": "คำทักสั้น 1 ประโยค เสียงแม่หมอกวน ๆ อบอุ่น",
  "deep": "ดวงเชิงลึกวันนี้ 3-4 ประโยค อ้างอิงราศี ธาตุ ปีนักษัตร และเลขชะตาอย่างน้อย 2 อย่างให้เป็นธรรมชาติ เล่าจังหวะวันนี้ + สิ่งที่ควรทำและควรระวัง แล้วปิดท้ายด้วยประโยคให้กำลังใจ 1 ประโยค"
}`;

function userPrompt(b) {
  return [
    'ข้อมูลผู้ถาม (คำนวณมาแล้ว ใช้ตามนี้เป๊ะ):',
    `- ราศี: ${b.zodiac || '-'}${b.element ? ` (ธาตุ${b.element})` : ''}`,
    `- นิสัยประจำราศี: ${b.zodiacTraits || '-'}`,
    `- ปีนักษัตร: ${b.chinese || '-'}`,
    `- เลขชะตา: ${b.lifePath || '-'}`,
    `- เกิดวัน: ${b.birthDayName || '-'}`,
    `- สีมงคลประจำตัว: ${b.luckyColor || '-'}${b.luckyColorMeaning ? ` (${b.luckyColorMeaning})` : ''}`,
    `- วันนี้เป็นวัน${b.todayDayName || '-'} (${b.today || '-'})`,
    b.name ? `- ชื่อเล่นผู้ถาม: ${b.name}` : '',
    '',
    'เขียนดวงรายวันเชิงลึกของวันนี้ ตอบเป็น JSON ตาม schema',
  ].filter(Boolean).join('\n');
}

exports.deepDaily = onRequest(
  { region: REGION, cors: true, invoker: 'public', secrets: [openaiApiKey], timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
    const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!m) { res.status(401).json({ error: 'Missing token' }); return; }
    try {
      const decoded = await admin.auth().verifyIdToken(m[1]);
      const b = req.body || {};
      if (!b.zodiac) { res.status(400).json({ error: 'missing astro' }); return; }

      const ref = admin.firestore().collection('users').doc(decoded.uid).collection('fortuneCache').doc(bkkDay());
      const cached = await ref.get();
      if (cached.exists) { res.status(200).json({ ...cached.data(), cached: true }); return; }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('API key not configured');
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini', max_tokens: 500, temperature: 0.9,
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: SYS }, { role: 'user', content: userPrompt(b) }],
        }),
      });
      if (!r.ok) throw new Error('openai ' + r.status + ' ' + (await r.text().catch(() => '')));
      const data = await r.json();
      let out;
      try { out = JSON.parse(data.choices[0].message.content); } catch (e) { throw new Error('bad json'); }
      const result = {
        headline: String(out.headline || '').slice(0, 60),
        bubble: String(out.bubble || '').slice(0, 220),
        deep: String(out.deep || '').slice(0, 700),
      };
      if (!result.deep) throw new Error('empty deep');
      await ref.set({ ...result, at: admin.firestore.FieldValue.serverTimestamp() });
      res.status(200).json(result);
    } catch (err) {
      console.error('deepDaily error:', err.message);
      res.status(500).json({ error: 'unavailable' });
    }
  },
);

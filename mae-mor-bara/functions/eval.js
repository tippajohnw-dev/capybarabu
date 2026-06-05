// =============================================================
// eval.js — offline quality harness for แม่หมอบาร่า
// Runs the SHIPPING prompt (./prompt.js) against OpenAI directly so we
// can compare cases (เสาร์ vs อังคาร, รายวัน vs รายเดือน) WITHOUT
// deploying. Astrology compute below mirrors index.html.
//
// Usage:
//   OPENAI_API_KEY=sk-... node eval.js
// =============================================================

const { SYSTEM_PROMPT, buildUserPrompt } = require('./prompt');

// ---- astrology compute (mirror of index.html) ----
const ZODIACS = [
  { name:'มกร',   en:'Capricorn',   traits:'มีวินัย อดทน มุ่งมั่น รักความมั่นคง',         start:[12,22], end:[1,19]  },
  { name:'กุมภ์', en:'Aquarius',    traits:'คิดนอกกรอบ รักอิสระ มีอุดมการณ์',             start:[1,20],  end:[2,18]  },
  { name:'มีน',   en:'Pisces',      traits:'อ่อนไหว มีจินตนาการ เมตตา ฝันมาก',           start:[2,19],  end:[3,20]  },
  { name:'เมษ',   en:'Aries',       traits:'กล้าหาญ กระตือรือร้น หุนหันพลันแล่น',         start:[3,21],  end:[4,19]  },
  { name:'พฤษภ',  en:'Taurus',      traits:'อดทน รักความงาม ดื้อแต่ซื่อสัตย์',            start:[4,20],  end:[5,20]  },
  { name:'เมถุน', en:'Gemini',      traits:'ฉลาด พูดเก่ง ปรับตัวดี ใจหลายแฉก',           start:[5,21],  end:[6,20]  },
  { name:'กรกฎ',  en:'Cancer',      traits:'อ่อนโยน รักครอบครัว อารมณ์ขึ้นๆ ลงๆ',       start:[6,21],  end:[7,22]  },
  { name:'สิงห์', en:'Leo',         traits:'มั่นใจ เอื้อเฟื้อ ชอบเป็นผู้นำ ต้องการคำชม', start:[7,23],  end:[8,22]  },
  { name:'กันย์', en:'Virgo',       traits:'ละเอียด ชอบวิเคราะห์ ขยันทำงาน',             start:[8,23],  end:[9,22]  },
  { name:'ตุลย์', en:'Libra',       traits:'รักความยุติธรรม สุนทรีย์ ชอบความสมดุล',      start:[9,23],  end:[10,22] },
  { name:'พิจิก', en:'Scorpio',     traits:'ลึกซึ้ง เข้มแข็ง ภักดีมาก',                  start:[10,23], end:[11,21] },
  { name:'ธนู',   en:'Sagittarius', traits:'รักอิสระ ชอบผจญภัย ตรงไปตรงมา',             start:[11,22], end:[12,21] },
];
const CHINESE = ['ชวด (หนู)','ฉลู (วัว)','ขาล (เสือ)','เถาะ (กระต่าย)','มะโรง (มังกร)','มะเส็ง (งู)','มะเมีย (ม้า)','มะแม (แพะ)','วอก (ลิง)','ระกา (ไก่)','จอ (หมา)','กุน (หมู)'];
const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
const SHIRT_COLORS = ['แดง','เหลือง','ชมพู','เขียว','ส้ม','ฟ้าอ่อน','ม่วง'];
const COLOR_MEANINGS = [
  'เสริมพลังอำนาจ มีเสน่ห์ดึงดูด',  // แดง
  'โชคลาภ ความร่ำรวย เงินทองไหลมา', // เหลือง
  'ความรัก เสน่ห์ มิตรภาพดี',       // ชมพู
  'สุขภาพแข็งแรง ก้าวหน้าในงาน',    // เขียว
  'วาสนาดี ฐานะมั่นคง บุญหนุนนำ',   // ส้ม
  'ความสุขสงบ โชคดี ราบรื่น',       // ฟ้าอ่อน
  'ปัดเป่าเคราะห์ เสริมบารมี',       // ม่วง
];

function getZodiac(s){const d=new Date(s),m=d.getMonth()+1,day=d.getDate();for(const z of ZODIACS){const[sm,sd]=z.start,[em,ed]=z.end;if((m===sm&&day>=sd)||(m===em&&day<=ed))return z;}return ZODIACS[0];}
function getChinese(s){return CHINESE[((new Date(s).getFullYear()-4)%12+12)%12];}
function lifePath(s){const[y,m,d]=s.split('-');let n=(d+m+y).split('').reduce((a,c)=>a+parseInt(c),0);while(n>9)n=String(n).split('').reduce((a,c)=>a+parseInt(c),0);return n||9;}

function deriveData(birthDate, question, type, today, todayColor, todayColorMeaning) {
  const z = getZodiac(birthDate);
  const idx = new Date(birthDate).getDay();
  return {
    birthDate, question, type, today, todayColor, todayColorMeaning,
    zodiac: `ราศี${z.name} (${z.en})`,
    zodiacTraits: z.traits,
    chineseZodiac: getChinese(birthDate),
    birthDayName: THAI_DAYS[idx],
    birthDayColor: SHIRT_COLORS[idx],
    birthDayColorMeaning: COLOR_MEANINGS[idx],
    lifePath: lifePath(birthDate),
  };
}

// ---- quality checks ----
function checks(text, d) {
  const hasLatin = /[A-Za-z]/.test(text);
  const endsTip = text.includes('💡 แม่บอกเลยนะจ้า:');
  const refsData = [String(d.lifePath), d.birthDayColor, d.todayColor, d.birthDayName]
    .some(v => v && text.includes(v));
  const noMarkdown = !/\*\*|^\s*#{1,6}\s|^\s*[-*]\s/m.test(text);
  const words = text.replace(/\s+/g, ' ').trim().length; // Thai = char count proxy
  return { thaiOnly: !hasLatin, endsTip, refsData, noMarkdown, chars: words };
}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1); }

async function ask(d) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini', max_tokens: 700, temperature: 0.9,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(d) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return (await res.json()).choices?.[0]?.message?.content || '';
}

(async () => {
  const today = 'วันศุกร์ที่ 5 มิถุนายน 2569';
  const todayColor = 'ฟ้าอ่อน';                 // Friday
  const todayColorMeaning = 'ความสุขสงบ โชคดี ราบรื่น';
  const Q = 'ดวงภาพรวมทุกด้านของฉันเป็นยังไงบ้าง';
  const cases = [
    ['เสาร์ · รายวัน',   deriveData('1995-07-15', Q, 'daily',   today, todayColor, todayColorMeaning)],
    ['เสาร์ · รายเดือน', deriveData('1995-07-15', Q, 'monthly', today, todayColor, todayColorMeaning)],
    ['อังคาร · รายวัน',   deriveData('1988-11-08', Q, 'daily',   today, todayColor, todayColorMeaning)],
    ['อังคาร · รายเดือน', deriveData('1988-11-08', Q, 'monthly', today, todayColor, todayColorMeaning)],
  ];

  for (const [label, d] of cases) {
    let text, c;
    try { text = await ask(d); c = checks(text, d); }
    catch (e) { console.log(`\n━━━ ${label} ━━━\n❌ ${e.message}`); continue; }
    const flag = b => b ? '✓' : '✗';
    console.log(`\n━━━ ${label}  [เกิดวัน${d.birthDayName} · ${d.zodiac} · สีวันเกิด${d.birthDayColor} · เลขชะตา${d.lifePath}] ━━━`);
    console.log(`checks: ไทยล้วน ${flag(c.thaiOnly)} | ปิดด้วย💡 ${flag(c.endsTip)} | อ้างข้อมูลจริง ${flag(c.refsData)} | ไม่มีมาร์กดาวน์ ${flag(c.noMarkdown)} | ${c.chars} ตัวอักษร`);
    console.log(text);
  }
})();

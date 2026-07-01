/* =============================================================
   แม่หมอบาร่า / Capybarabu — Fortune Engine  (C3, Sprint 2)
   static · no build · DOM-free · deterministic
   --------------------------------------------------------------
   "fold round 1": ราศี / ปีนักษัตร / เลขชะตา / สีมงคล
   (compute ported จาก index.html — LLM ทำเลข/วันในสัปดาห์ไม่แม่น
    จึงคำนวณฝั่ง client แล้วถักเข้าไปในคำทำนาย)

   API (global `Fortune`):
     Fortune.beToISO(birth)            -> 'YYYY-MM-DD' | null   (รับ {d,m,beYear} พ.ศ. หรือ string)
     Fortune.profileBase(profile)      -> ctx (ราศี/นักษัตร/เลขชะตา/สีมงคล)
     Fortune.daily(profile, date?)     -> { power, color, number, time, headline, bubble, fold, ... }
     Fortune.category(key, profile, d?)-> { key, label, emoji, score, text, advice, fold, color, number, time }
     Fortune.CATEGORIES                -> [{key,emoji,label,desc,featured}]
     Fortune.shareData(result, profile)-> payload สำหรับ share-card.js
   ============================================================= */
(function (global) {
  'use strict';

  // ---------- ข้อมูลโหราศาสตร์ (ported จาก index.html) ----------
  const ZODIACS = [
    { name:'มกร',   emoji:'♑', en:'Capricorn',   element:'ดิน', traits:'มีวินัย อดทน มุ่งมั่น', start:[12,22], end:[1,19] },
    { name:'กุมภ์', emoji:'♒', en:'Aquarius',    element:'ลม',  traits:'คิดนอกกรอบ รักอิสระ', start:[1,20],  end:[2,18] },
    { name:'มีน',   emoji:'♓', en:'Pisces',      element:'น้ำ', traits:'อ่อนไหว มีจินตนาการ', start:[2,19],  end:[3,20] },
    { name:'เมษ',   emoji:'♈', en:'Aries',       element:'ไฟ',  traits:'กล้าหาญ กระตือรือร้น', start:[3,21],  end:[4,19] },
    { name:'พฤษภ',  emoji:'♉', en:'Taurus',      element:'ดิน', traits:'อดทน รักความงาม', start:[4,20],  end:[5,20] },
    { name:'เมถุน', emoji:'♊', en:'Gemini',      element:'ลม',  traits:'ฉลาด พูดเก่ง ปรับตัวดี', start:[5,21],  end:[6,20] },
    { name:'กรกฎ',  emoji:'♋', en:'Cancer',      element:'น้ำ', traits:'อ่อนโยน รักครอบครัว', start:[6,21],  end:[7,22] },
    { name:'สิงห์', emoji:'♌', en:'Leo',         element:'ไฟ',  traits:'มั่นใจ ชอบเป็นผู้นำ', start:[7,23],  end:[8,22] },
    { name:'กันย์', emoji:'♍', en:'Virgo',       element:'ดิน', traits:'ละเอียด ชอบวิเคราะห์', start:[8,23],  end:[9,22] },
    { name:'ตุลย์', emoji:'♎', en:'Libra',       element:'ลม',  traits:'รักความยุติธรรม สุนทรีย์', start:[9,23],  end:[10,22] },
    { name:'พิจิก', emoji:'♏', en:'Scorpio',     element:'น้ำ', traits:'ลึกซึ้ง เข้มแข็ง ภักดี', start:[10,23], end:[11,21] },
    { name:'ธนู',   emoji:'♐', en:'Sagittarius', element:'ไฟ',  traits:'รักอิสระ ชอบผจญภัย', start:[11,22], end:[12,21] },
  ];
  const CHINESE = ['ชวด (หนู)','ฉลู (วัว)','ขาล (เสือ)','เถาะ (กระต่าย)','มะโรง (มังกร)','มะเส็ง (งู)',
                   'มะเมีย (ม้า)','มะแม (แพะ)','วอก (ลิง)','ระกา (ไก่)','จอ (หมา)','กุน (หมู)'];
  // สีมงคลตามวันเกิด — ปรับ hex ให้เข้ากับ palette "Cute Mystic Premium"
  const SHIRT_COLORS = [
    { day:0, name:'แดงชมพู', hex:'#ff6f91', meaning:'เสริมเสน่ห์ พลังอำนาจ' },  // อาทิตย์
    { day:1, name:'ครีมเหลือง', hex:'#f7c96f', meaning:'โชคลาภ เงินทองไหลมา' }, // จันทร์
    { day:2, name:'ชมพูพีช', hex:'#ff9fcf', meaning:'ความรัก มิตรภาพดี' },      // อังคาร
    { day:3, name:'มิ้นต์', hex:'#a8e6cf', meaning:'ก้าวหน้า สุขภาพดี' },        // พุธ
    { day:4, name:'ส้มอบอุ่น', hex:'#ffb27a', meaning:'วาสนาดี บุญหนุนนำ' },     // พฤหัสบดี
    { day:5, name:'ฟ้าใส', hex:'#7ec8ff', meaning:'ความสุขสงบ ราบรื่น' },        // ศุกร์
    { day:6, name:'ม่วงมณี', hex:'#b79bff', meaning:'ปัดเป่าเคราะห์ เสริมบารมี' }, // เสาร์
  ];
  const THAI_DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  // เลขนำโชคตามเลขชะตา (numerology)
  const LUCKY_DIGITS = {
    1:[1,9,5], 2:[2,6,8], 3:[3,7,1], 4:[4,8,2], 5:[5,0,9],
    6:[6,4,8], 7:[7,3,1], 8:[8,6,4], 9:[9,3,7],
  };
  const LUCKY_TIMES = ['07:09','08:19','09:09','10:10','11:11','13:39','14:00','15:15','16:09','17:19','18:18','19:09'];

  // ---------- helpers ----------
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  // รับวันเกิดได้ทั้ง {d,m,beYear} (พ.ศ.) หรือ ISO string -> 'YYYY-MM-DD' (ค.ศ.)
  function beToISO(b) {
    if (!b) return null;
    if (typeof b === 'string') return b.length >= 10 ? b.slice(0, 10) : null;
    if (b.beYear && b.m && b.d) { return (b.beYear - 543) + '-' + pad2(b.m) + '-' + pad2(b.d); }
    if (b.year && b.month && b.day) return b.year + '-' + pad2(b.month) + '-' + pad2(b.day);
    return null;
  }

  function getZodiac(iso) {
    const d = new Date(iso), m = d.getMonth() + 1, day = d.getDate();
    for (const z of ZODIACS) {
      const [sm, sd] = z.start, [em, ed] = z.end;
      if ((m === sm && day >= sd) || (m === em && day <= ed)) return z;
    }
    return ZODIACS[0];
  }
  function getChineseZodiac(iso) {
    const y = new Date(iso).getFullYear();
    return CHINESE[((y - 4) % 12 + 12) % 12];
  }
  function getLifePath(iso) {
    const [y, m, d] = iso.split('-');
    let sum = (d + m + y).split('').reduce((a, c) => a + (parseInt(c) || 0), 0);
    while (sum > 9) sum = String(sum).split('').reduce((a, c) => a + parseInt(c), 0);
    return sum || 9;
  }

  // FNV-1a hash -> uint32 (deterministic seed)
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(arr, seed) { return arr[seed % arr.length]; }

  function isoOf(date) { const d = date || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function thaiDateLabel(date) { const d = date || new Date(); return d.getDate() + ' ' + THAI_MONTHS[d.getMonth()] + ' ' + (d.getFullYear() + 543); }

  // ---------- ctx ส่วนตัว (compute ครั้งเดียว reuse) ----------
  function profileBase(profile) {
    profile = profile || {};
    const iso = beToISO(profile.birthDate);
    const zodiac = iso ? getZodiac(iso) : null;
    const chinese = iso ? getChineseZodiac(iso) : null;
    const lifePath = iso ? getLifePath(iso) : null;
    const dayIdx = iso ? new Date(iso).getDay() : (new Date()).getDay();
    const color = SHIRT_COLORS[dayIdx];
    return {
      iso, zodiac, chinese, lifePath, dayIdx, color,
      hasBirth: !!iso,
      birthDayName: iso ? THAI_DAYS[dayIdx] : null,
      seedKey: (profile.uid || 'guest') + '|' + (iso || 'noBD'),
      name: profile.displayName || profile.name || '',
      tone: profile.tone || 'ขำ ๆ',
    };
  }

  // ฟันเฟืองถัก "fold" — ประโยคสรุปจากศาสตร์ส่วนตัว
  function foldLine(base, seed) {
    if (!base.hasBirth) return 'ใส่วันเกิดเพื่อให้แม่หมออ่านราศี · ปีนักษัตร · เลขชะตาของคุณได้แม่นขึ้นน้า ✨';
    const z = base.zodiac;
    const lines = [
      `ราศี${z.name} ธาตุ${z.element} วันนี้พลัง${z.traits.split(' ')[0]}กำลังเด่น`,
      `คุณเกิดปี${base.chinese} เลขชะตา ${base.lifePath} — จังหวะนี้เหมาะกับการ "เริ่ม" มากกว่ารอ`,
      `ดาวประจำราศี${z.name}หนุนเรื่องที่คุณตั้งใจ ลองใช้สี${base.color.name}เสริมพลัง`,
      `เลขชะตา ${base.lifePath} บอกว่าคุณ${z.traits} — วันนี้ข้อนี้จะช่วยคุณได้จริง`,
    ];
    return pick(lines, seed);
  }

  // ---------- หมวดดูดวง (love + money = พระเอกตามมติ กก.) ----------
  const CATEGORIES = [
    { key:'love',    emoji:'💘', label:'ความรัก',   desc:'คนคุย คนเก่า ความสัมพันธ์', featured:true },
    { key:'money',   emoji:'💸', label:'การเงิน',   desc:'รายได้ โชค งานเสริม',       featured:true },
    { key:'work',    emoji:'💼', label:'การงาน',    desc:'โปรเจกต์ โอกาส',             featured:false },
    { key:'protect', emoji:'🧿', label:'กันพลังลบ', desc:'คน toxic ความเหนื่อยใจ',     featured:false },
    { key:'health',  emoji:'🌿', label:'สุขภาพใจ',  desc:'พลังกาย พลังใจ การพักผ่อน',  featured:false },
  ];
  const CAT_MAP = {};
  CATEGORIES.forEach(c => CAT_MAP[c.key] = c);

  // template คำทำนาย — ต่อหมวด: text (สถานการณ์) + advice (สิ่งที่ควรทำ)
  const TEMPLATES = {
    love: {
      text: [
        'วันนี้เสน่ห์คุณกำลังเปล่งประกายแบบเงียบ ๆ คนที่มองอยู่อาจขยับเข้ามาใกล้กว่าเดิม ใจเย็น ๆ แล้วเปิดโอกาสให้บทสนทนาได้ไหลเอง',
        'ความสัมพันธ์กำลังเข้าสู่จังหวะที่ชัดขึ้น ถ้ามีเรื่องค้างใจ วันนี้เหมาะกับการพูดตรง ๆ ด้วยน้ำเสียงอ่อนโยน อีกฝ่ายพร้อมรับฟังมากกว่าที่คิด',
        'คนเก่าหรือคนคุยเดิมอาจกลับเข้ามาในความคิด แต่แม่หมออยากให้โฟกัสคนที่ทำให้คุณรู้สึกสบายใจ ไม่ใช่คนที่ทำให้ต้องลุ้นตลอดเวลา',
        'หัวใจวันนี้ต้องการความจริงใจมากกว่าความหวือหวา ใครที่อยู่ข้าง ๆ แบบไม่ต้องเล่นเกม คือคนที่ควรให้เวลา',
      ],
      advice: ['ส่งข้อความทักก่อนสั้น ๆ', 'พกของสีชมพูติดตัว', 'ยิ้มให้ตัวเองในกระจกตอนเช้า', 'อย่าตัดสินใจเรื่องรักตอนใจร้อน'],
    },
    money: {
      text: [
        'การเงินวันนี้มีจังหวะดีแบบค่อยเป็นค่อยไป เหมาะกับการ "วางแผน" มากกว่าการเสี่ยงใจร้อน ถ้าจัดระเบียบรายรับรายจ่ายวันนี้ จะเห็นช่องที่เคยมองข้าม',
        'มีโอกาสรายได้ก้อนเล็กเข้ามาแบบไม่คาดคิด อาจเป็นงานเสริมหรือของที่ขายได้ อย่าเพิ่งรีบใช้ เก็บไว้ต่อยอดจะดีกว่า',
        'ดวงเงินกำลังเปิดทางใหม่ แต่แม่หมอเตือนว่าอย่ากดสั่งของตอนหิวหรือตอนเหงา การใช้เงินด้วยอารมณ์คือรูรั่วที่ใหญ่ที่สุดของสัปดาห์นี้',
        'วันนี้เหมาะกับการทวงสิ่งที่ค้างอยู่ หรือเก็บเงินที่เคยปล่อยให้ลอย ความมีวินัยเล็ก ๆ วันนี้จะกลายเป็นก้อนใหญ่ในอนาคต',
      ],
      advice: ['จดรายจ่าย 1 วันเต็ม', 'แยกเงินออม 10% ทันทีที่เงินเข้า', 'เลื่อนการช้อปที่ลังเลออกไป 1 คืน', 'เช็กยอดที่ค้างรับ'],
    },
    work: {
      text: [
        'งานวันนี้ลื่นไหลถ้าเริ่มจากสิ่งที่ยากที่สุดก่อน พลังสมองช่วงเช้าของคุณคมเป็นพิเศษ ใช้ให้คุ้มก่อนที่ความวุ่นจะเข้ามา',
        'มีโอกาสหรือคนที่พร้อมสนับสนุนอยู่ใกล้ตัว ลองกล้าพูดสิ่งที่คิด ไอเดียของคุณวันนี้มีน้ำหนักกว่าที่ตัวเองรู้สึก',
        'อาจมีงานแทรกหรือเรื่องชวนหงุดหงิด แต่ถ้าตั้งสติแล้วจัดลำดับใหม่ คุณจะปิดงานได้สวยกว่าที่วางไว้',
        'จังหวะนี้เหมาะกับการต่อยอดสิ่งที่ทำค้างไว้มากกว่าเริ่มของใหม่ทั้งหมด เก็บงานเก่าให้จบจะเปิดประตูบานใหม่เอง',
      ],
      advice: ['ทำงานยากสุดก่อน 11 โมง', 'พักสายตาทุก 1 ชั่วโมง', 'เขียน to-do แค่ 3 ข้อ', 'กล้าขอความช่วยเหลือ'],
    },
    protect: {
      text: [
        'รอบตัวอาจมีพลังงานที่ดูดความสดใสของคุณ วันนี้มีสิทธิ์ปฏิเสธสิ่งที่ทำให้เหนื่อยใจได้เต็มที่ ระยะห่างที่พอดีคือการดูแลตัวเอง',
        'ถ้ารู้สึกหนัก ๆ ไม่มีเหตุผล นั่นคือสัญญาณให้พักจากดราม่าของคนอื่น เก็บพลังไว้ให้เรื่องของตัวเองก่อน',
        'มีคนหรือข่าวที่อยากดึงคุณเข้าไปในความวุ่นวาย แม่หมอแนะนำให้ "อ่านแล้วผ่าน" ไม่ต้องรับทุกอารมณ์เข้ามาเป็นของเรา',
        'วันนี้เหมาะกับการเคลียร์พื้นที่ — ทั้งโต๊ะ ทั้งแชท ทั้งใจ ของที่ไม่ได้ใช้และคนที่ไม่ได้เติม ปล่อยไปบ้างก็ได้',
      ],
      advice: ['พกของสีม่วงกันพลังลบ', 'ลดเวลาเลื่อนฟีดดราม่า', 'พูดคำว่า "ไม่" โดยไม่ต้องอธิบายยาว', 'สูดหายใจลึก 5 ครั้ง'],
    },
    health: {
      text: [
        'ร่างกายกำลังขอเวลาพักมากกว่าที่คุณยอมรับ วันนี้ถ้าได้นอนเร็วขึ้นสักนิด พรุ่งนี้พลังจะกลับมาเต็มกว่าเดิม',
        'พลังใจวันนี้ขึ้นกับสิ่งเล็ก ๆ ที่คุณทำให้ตัวเอง น้ำอุ่นสักแก้ว เดินเล่นสั้น ๆ ก็เปลี่ยนทั้งวันได้',
        'อย่าฝืนเกินไปในวันที่ใจล้า การหยุดพักไม่ใช่ความขี้เกียจ แต่คือการเติมพลังให้ไปต่อได้ไกลกว่า',
        'ลองขยับร่างกายเบา ๆ แล้วคุณจะรู้สึกว่าความคิดที่พันกันคลายออกเอง สุขภาพกายกับใจวันนี้เดินทางคู่กัน',
      ],
      advice: ['ดื่มน้ำให้ครบวันนี้', 'นอนก่อนเที่ยงคืน', 'เดินรับแดดเช้า 10 นาที', 'วางมือถือก่อนนอน 30 นาที'],
    },
  };

  function scoreFromSeed(seed, lo, hi) { return lo + (seed % (hi - lo + 1)); }
  function luckyNumber(base, seed) {
    const digits = base.lifePath ? LUCKY_DIGITS[base.lifePath] : [seed % 9 + 1, (seed >>> 3) % 9 + 1, (seed >>> 6) % 9];
    return digits.slice(0, 2).join(' ');
  }

  // ---------- ดวงรายวัน (C1 home hero) ----------
  const HEADLINES = [
    'วันนี้พลังเสน่ห์แรง สิ่งดี ๆ กำลังเดินเข้ามาหา ✨',
    'เปิดใจรับโอกาสใหม่ จังหวะดีกำลังมาเคาะประตู',
    'ใจเย็นไว้แล้วจะผ่านฉลุย วันนี้ดวงหนุนคนที่อดทน',
    'การเงินมีจังหวะดี แต่อย่าตัดสินใจตอนใจร้อนน้า 💸',
    'วันของการเริ่มต้นเล็ก ๆ ที่จะกลายเป็นเรื่องใหญ่',
  ];
  const BUBBLES = [
    'วันนี้เงินมีจังหวะดี แต่แม่หมอขอเตือนว่าอย่ากดสั่งของตอนหิวน้า 💸',
    'ถ้ามีเรื่องอยากพูด วันนี้แหละจังหวะดี เปิดใจคุยแล้วจะโล่ง 💬',
    'พักบ้างก็ได้นะ พลังเต็มแล้วค่อยไปต่อ แม่หมอเป็นห่วง 🫶',
    'ใส่สี{color}วันนี้ แล้วลองทักคนที่คิดถึงดู เผื่อมีเซอร์ไพรส์ 🍀',
    'อย่าเพิ่งยอมแพ้เรื่องที่ทำอยู่ ใกล้จะเห็นผลแล้วน้า 🌟',
  ];

  function daily(profile, date) {
    const base = profileBase(profile);
    date = date || new Date();
    const today = isoOf(date);
    const seed = hashStr(base.seedKey + '|' + today);
    const power = scoreFromSeed(seed, 64, 96);
    const bubbleRaw = pick(BUBBLES, seed >>> 2);
    return {
      power,
      color: { name: base.color.name, hex: base.color.hex, meaning: base.color.meaning },
      number: luckyNumber(base, seed),
      time: pick(LUCKY_TIMES, seed >>> 5),
      headline: pick(HEADLINES, seed),
      bubble: bubbleRaw.replace('{color}', base.color.name),
      fold: foldLine(base, seed >>> 7),
      zodiac: base.zodiac, chinese: base.chinese, lifePath: base.lifePath,
      hasBirth: base.hasBirth, name: base.name,
      date: thaiDateLabel(date), dateISO: today,
    };
  }

  // ---------- ดวงรายหมวด (C3 fortune result) ----------
  function category(key, profile, date) {
    const cat = CAT_MAP[key] || CAT_MAP.love;
    const base = profileBase(profile);
    date = date || new Date();
    const today = isoOf(date);
    const seed = hashStr(base.seedKey + '|' + today + '|' + cat.key);
    const tpl = TEMPLATES[cat.key];
    return {
      key: cat.key, label: cat.label, emoji: cat.emoji,
      score: scoreFromSeed(seed, 58, 96),
      text: pick(tpl.text, seed),
      advice: pick(tpl.advice, seed >>> 4),
      fold: foldLine(base, seed >>> 6),
      color: { name: base.color.name, hex: base.color.hex },
      number: luckyNumber(base, seed),
      time: pick(LUCKY_TIMES, seed >>> 8),
      date: thaiDateLabel(date), dateISO: today,
      hasBirth: base.hasBirth,
    };
  }

  // ---------- C4 Pick a Card — ไพ่ทาโรต์จริง (Major Arcana 22 ใบ) ----------
  // อ่านแบบ "ตั้ง" (upright) โทนบวกตามมติ กก. — ไพ่หนัก (Death/Tower/Devil) ตีความเชิงเปลี่ยนผ่าน/ปลดปล่อย
  const CARDS = [
    { name:'คนเดินทาง (The Fool)',        emoji:'🃏', headline:'ก้าวใหม่ที่กล้าหาญกำลังเริ่มขึ้น',   meaning:'ไพ่แห่งการเริ่มต้นใหม่ วันนี้เหมาะกับการกล้าลองสิ่งที่ไม่เคยทำ เชื่อในเส้นทางของตัวเองแล้วออกเดิน', advice:'ลองทำสิ่งใหม่เล็ก ๆ 1 อย่างวันนี้' },
    { name:'นักเวท (The Magician)',       emoji:'🎩', headline:'คุณมีพลังเนรมิตสิ่งที่ต้องการ',      meaning:'ทุกเครื่องมือที่ต้องใช้อยู่ในมือคุณแล้ว วันนี้ความตั้งใจจะกลายเป็นการลงมือได้จริง', advice:'ลงมือทำเป้าหมายที่คิดไว้ทันที' },
    { name:'นักบวชหญิง (High Priestess)', emoji:'🌙', headline:'สัญชาตญาณของคุณแม่นเป็นพิเศษ',        meaning:'ปัญญาภายในกำลังพูดกับคุณ วันนี้คำตอบอยู่ในใจแล้ว เพียงแค่เงียบพอจะได้ยิน', advice:'หาเวลานิ่ง ๆ ฟังเสียงหัวใจ' },
    { name:'จักรพรรดินี (The Empress)',   emoji:'👑', headline:'ความอุดมสมบูรณ์กำลังโอบล้อมคุณ',      meaning:'ไพ่แห่งความรัก ความสร้างสรรค์ และการเติบโต สิ่งที่คุณดูแลด้วยใจจะผลิดอกออกผล', advice:'ดูแลตัวเองและคนรอบข้างด้วยความอ่อนโยน' },
    { name:'จักรพรรดิ (The Emperor)',     emoji:'🏛️', headline:'ความมั่นคงและระเบียบอยู่ข้างคุณ',    meaning:'วันนี้เหมาะกับการวางแผนและคุมเกม ความหนักแน่นของคุณจะสร้างรากฐานที่แข็งแรง', advice:'จัดลำดับความสำคัญให้ชัดเจน' },
    { name:'นักปราชญ์ (The Hierophant)',  emoji:'📿', headline:'คำแนะนำดี ๆ กำลังจะมาถึง',           meaning:'มีผู้รู้หรือประสบการณ์เดิมที่จะนำทางคุณ วันนี้การเรียนรู้จากคนอื่นคือทางลัด', advice:'ขอคำแนะนำจากคนที่คุณเชื่อใจ' },
    { name:'คู่รัก (The Lovers)',         emoji:'💕', headline:'หัวใจกำลังเจอทางเลือกที่ใช่',        meaning:'ไพ่แห่งความรักและการเลือกด้วยหัวใจ ความสัมพันธ์วันนี้มีจังหวะอบอุ่นและจริงใจ', advice:'เลือกสิ่งที่ทำให้ใจสบาย ไม่ใช่แค่ถูกใจ' },
    { name:'ราชรถ (The Chariot)',         emoji:'🏇', headline:'ชัยชนะรอคนที่มุ่งมั่น',              meaning:'พลังขับเคลื่อนของคุณแรงมากวันนี้ ถ้าโฟกัสเป้าหมายเดียว จะฝ่าทุกอุปสรรคไปได้', advice:'ทุ่มพลังให้เรื่องสำคัญที่สุดเรื่องเดียว' },
    { name:'พลังใจ (Strength)',           emoji:'🦁', headline:'ความกล้าหาญอ่อนโยนคือพลังของคุณ',   meaning:'ไพ่แห่งพลังใจ วันนี้คุณจัดการเรื่องยากได้ด้วยความสงบ ไม่ต้องใช้กำลังก็ชนะ', advice:'ใจเย็นกับตัวเองและสถานการณ์' },
    { name:'ฤๅษี (The Hermit)',           emoji:'🏮', headline:'คำตอบอยู่ในความเงียบของคุณ',        meaning:'ช่วงเวลาทบทวนตัวเองจะให้ปัญญา วันนี้การถอยมามองภาพรวมจะเห็นทางที่ชัดขึ้น', advice:'ให้เวลาตัวเองอยู่กับความคิดสัก 10 นาที' },
    { name:'วงล้อแห่งโชค (Wheel of Fortune)', emoji:'🎡', headline:'โชคกำลังหมุนมาทางคุณ',          meaning:'จังหวะชีวิตกำลังเปลี่ยนไปในทางที่ดี สิ่งที่เคยติดขัดจะเริ่มลื่นไหล จับโอกาสให้ทัน', advice:'พร้อมรับโอกาสที่เข้ามาแบบไม่คาดคิด' },
    { name:'ความยุติธรรม (Justice)',      emoji:'⚖️', headline:'สิ่งที่คุณทำไว้กำลังให้ผลที่ยุติธรรม', meaning:'ไพ่แห่งสมดุลและเหตุผล ความดีที่ทำมาจะได้รับการตอบแทน วันนี้ตัดสินใจด้วยความเป็นธรรม', advice:'ทำสิ่งที่ถูกต้อง แล้วผลดีจะตามมา' },
    { name:'คนกลับหัว (The Hanged Man)',  emoji:'🙃', headline:'มองต่างมุมแล้วจะเห็นทางออก',        meaning:'บางเรื่องต้องปล่อยวางและมองใหม่ วันนี้การยอมช้าลงนิดจะทำให้เข้าใจอะไรลึกขึ้น', advice:'ลองมองปัญหาจากมุมตรงข้าม' },
    { name:'การเปลี่ยนผ่าน (Death)',      emoji:'🦋', headline:'จุดจบเก่าคือจุดเริ่มต้นใหม่ที่ดีกว่า', meaning:'ไพ่แห่งการเปลี่ยนแปลง (ไม่ใช่เรื่องร้าย) สิ่งเก่าที่จบลงกำลังเปิดทางให้สิ่งใหม่ที่เหมาะกับคุณกว่า', advice:'ปล่อยสิ่งที่ไม่ใช่ เพื่อรับสิ่งที่ใช่' },
    { name:'ความพอดี (Temperance)',       emoji:'🕊️', headline:'ความกลมกลืนกำลังกลับคืนมา',        meaning:'ไพ่แห่งสมดุลและความสงบ วันนี้ทางสายกลางจะพาคุณไปได้ไกลกว่าการสุดโต่ง', advice:'หาจุดพอดีระหว่างงานกับการพัก' },
    { name:'รู้ทันพันธนาการ (The Devil)', emoji:'😈', headline:'คุณกำลังจะปลดโซ่ที่ล่ามตัวเองไว้',    meaning:'ไพ่นี้เตือนให้รู้ทันสิ่งที่ผูกมัดคุณ (นิสัย/คน/ความกลัว) เมื่อเห็นมันชัด คุณก็อิสระได้ทันที', advice:'ปล่อยสิ่งที่ทำให้คุณติดกับดัก 1 อย่าง' },
    { name:'ปลดปล่อย (The Tower)',        emoji:'⚡', headline:'ของเก่าที่พังไป เปิดทางให้ของใหม่',  meaning:'ไพ่แห่งการเปลี่ยนฉับพลัง สิ่งที่สั่นคลอนกำลังเคลียร์พื้นที่ให้ชีวิตที่มั่นคงและจริงกว่าเดิม', advice:'ยอมรับการเปลี่ยนแปลง แล้วเริ่มใหม่' },
    { name:'ดวงดาว (The Star)',           emoji:'⭐', headline:'ความหวังกำลังส่องสว่างให้คุณ',       meaning:'ไพ่แห่งความหวังและแรงบันดาลใจ หลังช่วงยาก ๆ วันนี้ท้องฟ้าเริ่มสว่าง เชื่อในฝันของตัวเองได้เลย', advice:'เขียนสิ่งที่หวังไว้ แล้วก้าวเข้าหามัน' },
    { name:'พระจันทร์ (The Moon)',        emoji:'🌕', headline:'ฟังสัญชาตญาณและความฝันของคุณ',      meaning:'ไพ่แห่งจินตนาการและสัญชาตญาณ วันนี้สิ่งที่รู้สึกลึก ๆ มักถูก ค่อย ๆ มองให้ชัดก่อนตัดสินใจ', advice:'อย่าเพิ่งด่วนสรุปเรื่องที่ยังคลุมเครือ' },
    { name:'ดวงอาทิตย์ (The Sun)',        emoji:'☀️', headline:'วันแห่งความสุขและความสำเร็จ',       meaning:'ไพ่ที่ดีที่สุดใบหนึ่ง พลังบวกล้นเหลือ เหมาะกับการเริ่มสิ่งใหม่ โชว์ของ และเฉลิมฉลอง', advice:'ทำสิ่งที่ทำให้คุณยิ้มได้วันนี้' },
    { name:'การตื่นรู้ (Judgement)',      emoji:'📯', headline:'โอกาสครั้งใหม่กำลังเรียกหาคุณ',      meaning:'ไพ่แห่งการตื่นรู้และเริ่มใหม่ สิ่งที่ผ่านมาสอนคุณมาพอแล้ว วันนี้ถึงเวลาลุกขึ้นอีกครั้ง', advice:'ให้อภัยตัวเองแล้วเริ่มบทใหม่' },
    { name:'ความสำเร็จ (The World)',      emoji:'🌏', headline:'บทหนึ่งกำลังจบอย่างสมบูรณ์แบบ',     meaning:'ไพ่แห่งความสำเร็จครบวงจร สิ่งที่คุณพยายามมากำลังลงตัว ภูมิใจในตัวเองได้เต็มที่', advice:'ฉลองสิ่งที่ทำสำเร็จ แล้วตั้งเป้าใหม่' },
  ];

  // เลือก n ใบไม่ซ้ำแบบ deterministic (salt = จำนวนครั้งที่สับไพ่ใหม่)
  function cards(profile, salt) {
    const base = profileBase(profile);
    const seed = hashStr(base.seedKey + '|' + isoOf() + '|cards|' + (salt || 0));
    const pool = CARDS.map((_, i) => i);
    const out = [];
    let s = seed;
    for (let k = 0; k < 3 && pool.length; k++) {
      const idx = s % pool.length;
      out.push(CARDS[pool.splice(idx, 1)[0]]);
      s = (Math.imul(s ^ (s >>> 13), 2246822519)) >>> 0;   // xorshift step
    }
    return out;
  }

  // ผลของไพ่ที่เลือก (ผูก chips มงคลส่วนตัว + power)
  function pickResult(card, profile, salt) {
    const base = profileBase(profile);
    const seed = hashStr(base.seedKey + '|' + isoOf() + '|' + card.name + '|' + (salt || 0));
    return {
      kind: 'ไพ่' + card.name, emoji: card.emoji, name: card.name,
      headline: card.headline, meaning: card.meaning, advice: card.advice,
      power: scoreFromSeed(seed, 72, 99),     // ไพ่ = บวกเสมอ → ช่วงสูง
      color: { name: base.color.name, hex: base.color.hex },
      number: luckyNumber(base, seed),
      time: pick(LUCKY_TIMES, seed >>> 4),
      date: thaiDateLabel(), dateISO: isoOf(),
    };
  }

  // ---------- C5 Lucky Charm Quiz — แนะนำเครื่องราง ----------
  const CHARMS = {
    money:   { name:'Money Flow Capy Coin', emoji:'🪙', colorHex:'#f7c96f', story:'เหรียญคาปิบาราเปิดทางรายได้ใหม่ เหมาะกับคนที่อยากให้เงินหมุนคล่องและมีโชคก้อนเล็ก ๆ เข้ามาเรื่อย ๆ' },
    love:    { name:'Pink Heart Capy',      emoji:'💗', colorHex:'#ff9fcf', story:'หัวใจชมพูคาปิบารา ดึงดูดความรักและคนดี ๆ เข้ามา เหมาะกับคนที่อยากเปิดใจให้ความสัมพันธ์อบอุ่น' },
    work:    { name:'Focus Star Capy',      emoji:'⭐', colorHex:'#cdb8ff', story:'ดาวแห่งสมาธิ ช่วยให้โฟกัสงานและคว้าโอกาสก้าวหน้า เหมาะกับคนที่กำลังลุยเป้าหมายใหญ่' },
    protect: { name:'Moonstone Shield',     emoji:'🧿', colorHex:'#b79bff', story:'โล่จันทรามณี กันพลังลบและคน toxic ช่วยให้ใจสงบ เหมาะกับคนที่เจอความเหนื่อยใจรอบตัว' },
    health:  { name:'Green Leaf Capy',       emoji:'🌿', colorHex:'#a8e6cf', story:'ใบไม้เขียวคาปิบารา เสริมพลังกายพลังใจ เหมาะกับคนที่อยากพักให้เต็มและกลับมาสดใส' },
    luck:    { name:'Lucky Star Capy',       emoji:'🌟', colorHex:'#f7c96f', story:'ดาวนำโชคคาปิบารา เสริมดวงโชคลาภโดยรวม เหมาะกับคนที่อยากให้ทุกด้านไหลลื่นขึ้น' },
  };
  const MOOD_PREFIX = {
    calm:   'ใจที่นิ่งของคุณคือพลัง',
    tired:  'วันที่เหนื่อยล้าแบบนี้',
    anxious:'ความกังวลที่แบกอยู่',
    fired:  'พลังไฟที่คุณมีตอนนี้',
  };

  function recommendCharm(answers, profile) {
    answers = answers || {};
    const intention = CHARMS[answers.intention] ? answers.intention : 'luck';
    const c = CHARMS[intention];
    const base = profileBase(profile);
    const seed = hashStr(base.seedKey + '|' + isoOf() + '|charm|' + intention + '|' + (answers.mood || ''));
    const prefix = MOOD_PREFIX[answers.mood] || 'พลังของคุณวันนี้';
    return {
      kind: 'เครื่องรางของฉัน', name: c.name, emoji: c.emoji,
      headline: prefix + ' เข้ากับ ' + c.name + ' ที่สุด',
      story: c.story,
      power: scoreFromSeed(seed, 78, 99),
      color: { name: base.color.name, hex: c.colorHex },
      number: luckyNumber(base, seed),
      time: pick(LUCKY_TIMES, seed >>> 4),
      date: thaiDateLabel(), dateISO: isoOf(),
      intention,
    };
  }

  // ---------- Phase 2 · ดวงเชิงลึก: กราฟชีวิต (Life Graph) ----------
  // deterministic ศาสตร์ไทย (ปีนักษัตร/ชง/โฉลก/จังหวะอายุ) — past 5 → future 5 ปี
  // port จาก index.html รอบ 1 (computeLifeGraph). ตัวเลขคำนวณที่นี่, AI (askLifeGraph) แค่เล่า
  function lifeGraph(profile, year) {
    const base = profileBase(profile);
    if (!base.iso) return { hasBirth: false, points: [], peak: null, low: null };
    const by = new Date(base.iso).getFullYear();
    const birthAnimal = ((by - 4) % 12 + 12) % 12;
    const now = year || new Date().getFullYear();
    const lp = base.lifePath || 5;
    const pts = [];
    for (let y = now - 5; y <= now + 5; y++) {
      const animal = ((y - 4) % 12 + 12) % 12;
      const age = y - by;
      const diff = ((animal - birthAnimal) % 12 + 12) % 12;
      let score = 60, tag = '';
      if (diff === 6)                     { score -= 28; tag = 'ปีชง'; }
      else if (diff === 3 || diff === 9)  { score -= 14; tag = 'ปีคัด/เล็ง'; }
      else if (diff === 0)                { score += 8;  tag = 'ปีนักษัตรตัวเอง'; }
      else if (diff === 4 || diff === 8)  { score += 20; tag = 'ปีถูกโฉลก'; }
      else if (diff === 1 || diff === 11) { score += 6; }
      if (age === 25 || age === 49)       { score -= 10; tag = tag || 'เบญจเพส/เลขกระทบ'; }
      if (age > 0 && age % 12 === 0)      { score += 6; }
      score += ((lp + Math.abs(y)) % 5) - 2;   // กันกราฟแบน
      score = Math.max(20, Math.min(95, score));
      pts.push({ year: y, be: y + 543, age, score, tag, isNow: y === now });
    }
    const peak = pts.reduce((a, b) => b.score > a.score ? b : a);
    const low  = pts.reduce((a, b) => b.score < a.score ? b : a);
    return {
      hasBirth: true, points: pts, peak, low, currentYear: now,
      zodiac: base.zodiac, chinese: base.chinese, birthDayName: base.birthDayName,
      lifePath: base.lifePath, iso: base.iso,
      age: pts.find(p => p.isNow) ? pts.find(p => p.isNow).age : (now - by),
    };
  }

  // ---------- payload สำหรับ share-card.js ----------
  function shareData(result, profile) {
    const base = profileBase(profile);
    return {
      power: result.power != null ? result.power : result.score,
      colorName: result.color.name,
      colorHex: result.color.hex,
      number: result.number,
      time: result.time,
      headline: result.headline || result.text,
      kind: result.kind || (result.label ? ('ดวง' + result.label) : 'ดวงวันนี้'),
      name: base.name,
      date: result.date,
    };
  }

  global.Fortune = {
    beToISO, profileBase, daily, category, shareData,
    cards, pickResult, recommendCharm, lifeGraph,
    CATEGORIES, CARDS, CHARMS, THAI_DAYS, THAI_MONTHS, SHIRT_COLORS,
    getZodiac, getChineseZodiac, getLifePath, thaiDateLabel,
  };
})(typeof window !== 'undefined' ? window : this);

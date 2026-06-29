/* =============================================================
   แม่หมอบาร่า / Capybarabu — Shop Catalog (D1, Sprint 5)
   static · no build · เครื่องรางดิจิทัล (digital charm) ≤ ฿99
   ส่งเข้า LINE ทันที — ไม่มีของจริง/ค่าส่ง (lean, Gen Z price-friendly)
   global `Shop`: PRODUCTS · INTENTIONS · byIntention(key) · get(id)
   ============================================================= */
(function (global) {
  'use strict';

  // หมวดตาม intention (sync กับ Fortune quiz)
  const INTENTIONS = [
    { key: 'all',     label: 'ทั้งหมด', emoji: '✨' },
    { key: 'money',   label: 'การเงิน', emoji: '💸' },
    { key: 'love',    label: 'ความรัก', emoji: '💘' },
    { key: 'work',    label: 'การงาน', emoji: '💼' },
    { key: 'protect', label: 'กันพลังลบ', emoji: '🧿' },
    { key: 'health',  label: 'สุขภาพใจ', emoji: '🌿' },
    { key: 'luck',    label: 'โชคลาภ', emoji: '🌟' },
  ];

  // tile สีตาม intention (ใช้ token CAPY POP)
  const TILE = { money:'var(--tile-mint)', love:'var(--tile-pink)', work:'var(--tile-grape)',
                 protect:'var(--tile-grape)', health:'var(--tile-mint)', luck:'var(--tile-sun)' };

  const PRODUCTS = [
    { id:'money-coin', intention:'money', name:'เหรียญทองเรียกทรัพย์', emoji:'🪙', price:59, mascot:'m5', color:'#f7c96f',
      tagline:'เปิดทางรายได้ใหม่ เงินหมุนคล่อง',
      story:'เหรียญคาปิบาราชุบทอง แม่หมอปลุกเสกให้เงินเข้าคล่อง เหมาะกับคนที่อยากให้รายได้หมุนดีและมีโชคก้อนเล็ก ๆ เข้ามาเรื่อย ๆ พกไว้ในวอลเปเปอร์มือถือ ดึงดูดทรัพย์ทุกครั้งที่หยิบจ่าย',
      bonus:'วอลเปเปอร์ Money Flow + ปลดล็อกดวงการเงินเชิงลึก 7 วัน' },
    { id:'money-tree', intention:'money', name:'ต้นไม้เงินงอกเงย', emoji:'🌳', price:79, mascot:'m5', color:'#16b8a0',
      tagline:'ค่อย ๆ โต มั่นคงระยะยาว',
      story:'ต้นไม้แห่งทรัพย์ของแม่หมอ เสริมการออมและการลงทุนที่ค่อย ๆ งอกเงย เหมาะกับสายเก็บเงินที่อยากเห็นเงินโตแบบมั่นคง ไม่หวือหวาแต่ไม่มีวันหมด',
      bonus:'วอลเปเปอร์ Money Tree + เช็กลิสต์ออมเงิน 30 วัน' },
    { id:'love-heart', intention:'love', name:'หัวใจชมพูมัดใจ', emoji:'💗', price:59, mascot:'m6', color:'#ff5c93',
      tagline:'ดึงดูดความรักและคนดี ๆ',
      story:'หัวใจชมพูคาปิบารา เปิดพลังเสน่ห์ให้คนรอบตัวเข้าหา เหมาะกับคนโสดที่อยากเจอคนใช่ หรือคนมีคู่ที่อยากให้ความสัมพันธ์อบอุ่นขึ้น',
      bonus:'วอลเปเปอร์ Pink Heart + ดวงความรักเชิงลึก 7 วัน' },
    { id:'love-knot', intention:'love', name:'ด้ายแดงผูกเนื้อคู่', emoji:'🧶', price:79, mascot:'m6', color:'#ff6f91',
      tagline:'เชื่อมโยงคนที่ใช่เข้าหากัน',
      story:'ด้ายแดงแห่งโชคชะตา แม่หมอผูกให้เส้นทางของคุณกับเนื้อคู่มาบรรจบ เหมาะกับคนที่กำลังรอใครสักคน หรืออยากให้ความสัมพันธ์ที่มีแน่นแฟ้นขึ้น',
      bonus:'วอลเปเปอร์ Red Thread + อ่านดวงเนื้อคู่ 1 ครั้ง' },
    { id:'work-star', intention:'work', name:'ดาวนำทางความสำเร็จ', emoji:'⭐', price:59, mascot:'m3', color:'#5b4bff',
      tagline:'โฟกัสงาน คว้าโอกาสก้าวหน้า',
      story:'ดาวแห่งสมาธิของแม่หมอ ช่วยให้ใจนิ่ง โฟกัสเป้าหมาย และมองเห็นโอกาสที่คนอื่นมองข้าม เหมาะกับคนที่กำลังลุยโปรเจกต์ใหญ่หรืออยากเลื่อนขั้น',
      bonus:'วอลเปเปอร์ Focus Star + ดวงการงานเชิงลึก 7 วัน' },
    { id:'protect-eye', intention:'protect', name:'ตาเทพกันพลังลบ', emoji:'🧿', price:59, mascot:'m8', color:'#7c4dff',
      tagline:'กันคน toxic ใจสงบ',
      story:'ดวงตาแห่งการปกป้องของแม่หมอ สะท้อนพลังลบและคน toxic ออกไป ช่วยให้ใจนิ่งเป็นเกราะ เหมาะกับคนที่เจอความเหนื่อยใจหรือดราม่ารอบตัว',
      bonus:'วอลเปเปอร์ Evil Eye + คาถากันพลังลบประจำวัน' },
    { id:'protect-shield', intention:'protect', name:'โล่จันทรามณี', emoji:'🛡️', price:89, mascot:'m8', color:'#b79bff',
      tagline:'เกราะใจชั้นพรีเมียม',
      story:'โล่ศักดิ์สิทธิ์จากแสงจันทร์ แม่หมอเสกให้เป็นเกราะปกป้องทั้งใจและดวง เหมาะกับช่วงที่รู้สึกว่าโดนรุมเร้าหนัก ๆ อยากมีพื้นที่ปลอดภัยให้ตัวเอง',
      bonus:'วอลเปเปอร์ Moon Shield + คาถาเสริมเกราะ 14 วัน' },
    { id:'health-leaf', intention:'health', name:'ใบไม้เขียวเติมพลัง', emoji:'🌿', price:39, mascot:'m9', color:'#a8e6cf',
      tagline:'เติมพลังกายพลังใจ',
      story:'ใบไม้เขียวคาปิบารา เติมความสดชื่นให้กายและใจ เหมาะกับคนที่เหนื่อยล้าอยากพักให้เต็มแล้วกลับมาสดใส แม่หมอเป็นห่วงสุขภาพคุณน้า',
      bonus:'วอลเปเปอร์ Green Leaf + เช็กลิสต์ดูแลใจ 7 วัน' },
    { id:'luck-star', intention:'luck', name:'ดาวนำโชคคาปิบารา', emoji:'🌟', price:49, mascot:'m1', color:'#ffc23d',
      tagline:'เสริมดวงโชคลาภรวม ๆ',
      story:'ดาวนำโชคของแม่หมอ เสริมดวงทุกด้านให้ไหลลื่นขึ้น เหมาะกับคนที่อยากได้ตัวช่วยกลาง ๆ ครอบจักรวาล พกไว้อุ่นใจทุกวัน',
      bonus:'วอลเปเปอร์ Lucky Star + ดวงรวมประจำสัปดาห์' },
    { id:'luck-rainbow', intention:'luck', name:'สายรุ้งหลังพายุ', emoji:'🌈', price:69, mascot:'m1', color:'#ff9fcf',
      tagline:'เปลี่ยนเรื่องหนักให้กลายเป็นโชค',
      story:'สายรุ้งแห่งความหวังของแม่หมอ ช่วยพลิกช่วงเวลายาก ๆ ให้เห็นแสงสว่าง เหมาะกับคนที่เพิ่งผ่านเรื่องหนักมาและอยากเริ่มต้นใหม่ด้วยพลังบวก',
      bonus:'วอลเปเปอร์ Rainbow + คำให้กำลังใจจากแม่หมอ 14 วัน' },
  ];

  function byIntention(key) { return (!key || key === 'all') ? PRODUCTS : PRODUCTS.filter((p) => p.intention === key); }
  function get(id) { return PRODUCTS.find((p) => p.id === id) || null; }
  function tile(intention) { return TILE[intention] || 'var(--cream-2)'; }

  global.Shop = { PRODUCTS, INTENTIONS, byIntention, get, tile };
})(typeof window !== 'undefined' ? window : this);

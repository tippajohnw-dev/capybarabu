# แม่หมอบาร่า — Product Spec
### Version 3.0 (reset) · June 2026 · Architecture-anchored

> **วิธีใช้เอกสารนี้**
> Spec นี้ **reset** จากแนวทาง rebuild เป็น Next.js/Vercel/Supabase (v2.x ยกเลิก) — กลับมา
> **ยึดสถาปัตยกรรมที่มีอยู่จริง (Existing)** เป็น *envelope ที่ล็อกไว้* แล้ว
> **business requirement ใหม่จะถูก input โดยเจ้าของผลิตภัณฑ์ (§5)** ทุก requirement ที่เข้ามา
> จะถูกประเมินกับ **Capacity Map (§4)** ว่าอยู่ในกรอบสถาปัตยกรรมนี้ได้ไหม / ต้องต่อเติมเท่าใด
>
> | ส่วน | สถานะ |
> |---|---|
> | §1–§4 สถาปัตยกรรม + ความสามารถ | 🔒 ล็อก (as-built ตรวจจากโค้ดจริง) |
> | §5 Business Requirements | ⏳ รอ input จากเจ้าของผลิตภัณฑ์ |
> | §6 Feature Backlog & Roadmap | 🧩 จะ derive จาก §5 |

---

## 1. Architecture Baseline (🔒 as-built)

แม่หมอบาร่าวันนี้คือ **single-page static app + serverless backend** ไม่มี framework ไม่มี build step

```
[ Browser / LINE WebView ]
        │
        │  static assets
        ▼
[ Firebase Hosting (capybarabu-mae-mhor) ]   index.html (HTML+CSS+JS ไฟล์เดียว) + mascot.png
        │                                     security headers: X-Content-Type-Options / X-Frame-Options / X-XSS-Protection
        │  fetch (HTTPS, CORS public)
        ▼
[ Firebase Cloud Functions v2 · nodejs22 · asia-southeast1 ]
   • askFortune (POST)  → OpenAI GPT-4o-mini  (secret OPENAI_API_KEY) → คำทำนาย ; rate-limit 10/นาที/IP
   • getCount   (GET)   → อ่านตัวนับ
        │
        ▼
[ Firestore ]  stats/global.count   (fire-and-forget increment)
```

| Layer | Technology (จริง) |
|---|---|
| Frontend | Static HTML/CSS/JS ไฟล์เดียว (`index.html`) — ไม่มี framework/build · theme จักรวาล ม่วง-ทอง |
| Hosting | Firebase Hosting · project `capybarabu-mae-mhor` · domain `capybarabu-mae-mhor.web.app` |
| Backend | Firebase Cloud Functions v2 (nodejs22, asia-southeast1) |
| AI | OpenAI **GPT-4o-mini** ผ่าน Function · persona ใน `functions/prompt.js` |
| Data | Firestore (`stats/global`) |
| Astrology engine | คำนวณ **client-side** (ราศี/นักษัตร/วันเกิด/เลขชะตา/สีมงคล+ความหมาย) → ส่งให้ Function → LLM เล่าเรื่อง |
| Identity | **ยังไม่มี auth** — เก็บวันเกิดใน `localStorage` เท่านั้น |
| Deploy | `firebase deploy --only functions\|hosting --project capybarabu-mae-mhor` |
| Dev tools | `functions/prompt.js` (shared persona), `functions/eval.js` (quality harness) |

---

## 2. Architecture Principles (กรอบที่ feature ใหม่ต้องเคารพ)

1. **เรียบง่ายแบบ static-first** — ไม่มี build step/framework ตราบที่ทำได้ (deploy = อัปไฟล์)
2. **LINE WebView compatible** — date เป็น 3 dropdown (ไม่ใช้ `input[type=date]`), CDN fallback, ไม่พึ่ง API ที่ WebView บล็อก
3. **Compute deterministic ฝั่ง client, LLM เฉพาะ narrative** — LLM ไม่แม่นวันในสัปดาห์/เลขคณิต → คำนวณเองแล้วป้อนเข้า prompt (pattern ปัจจุบัน)
4. **Secret อยู่ใน Cloud Functions เท่านั้น** — key ไม่หลุดมา client; ทุก AI call ผ่าน Function
5. **Cache + rate-limit เป็น default** — กัน cost/abuse (ตอนนี้ rate-limit ต่อ IP, cache ตัวนับ)
6. **Single Firebase project ต่อผลิตภัณฑ์** — `capybarabu-mae-mhor` (อย่าปนกับ `capybarabu-dec37` ของหารกันเอง)

---

## 3. Current Capabilities (มีแล้ววันนี้)
- ดูดวง **รายวัน / รายเดือน** (OpenAI) ด้วย persona แม่หมอแคปบาร่า
- คำนวณ ราศี · นักษัตรจีน · วันเกิดในสัปดาห์ + พื้นดวง · เลขชะตา + เลขมงคล · สีเสื้อมงคล (วันนี้/ประจำวันเกิด) + ความหมาย
- preset 6 หัวข้อ (รัก/เงิน/งาน/สุขภาพ/โชค/ภาพรวม) · ตัวนับเคส live · แชร์/คัดลอก/ถามใหม่
- eval harness ตรวจคุณภาพ (ไทยล้วน / ปิดด้วย💡 / อ้างข้อมูลจริง / ไม่มี markdown / ความยาว)

---

## 4. Capacity Map — สถาปัตยกรรมรองรับอะไรได้ (ใช้เช็ค requirement §5)

> 🟢 รองรับเลย · 🟡 ต่อเติมในกรอบเดิมได้ · 🔴 ขัดกรอบ/ต้องตัดสินใจสถาปัตยกรรมเพิ่ม

| ความสามารถที่ requirement อาจต้องการ | สถานะ | ถ้าจะทำ ต้องเพิ่มอะไร (ในกรอบ Firebase) |
|---|---|---|
| ดูดวงประเภทใหม่ (เนื้อคู่/การงาน/การเงิน ฯลฯ) | 🟢 | เพิ่ม persona variant ใน `prompt.js` + section ใน `index.html` |
| คำนวณโหราศาสตร์เพิ่ม (compatibility, timeline) | 🟢 | เพิ่มฟังก์ชัน client-side (deterministic) |
| เก็บประวัติ/โปรไฟล์ราย user | 🟡 | เพิ่ม **Firebase Auth** (anonymous→LINE/Google) + Firestore `users/` (เหมือนแอปหารกันเอง) |
| แชร์ผลพร้อม preview รูป (OG image) | 🟡 | static hosting ทำ dynamic OG ตรงๆ ไม่ได้ → ต้อง **Function เรนเดอร์รูป** (เช่น Cloud Function + canvas/satori) + หน้า result ต่อ id |
| chart/visual (การเงิน/กราฟชีวิต) | 🟢 | ใส่ chart lib แบบ CDN ใน `index.html` (ไม่ต้อง build) |
| ส่ง email รายวัน | 🔴→🟡 | ต้องเพิ่ม **Cloud Scheduler + email provider (Resend/SendGrid)** + Firestore opt-in + auth |
| โหงวเฮ้งจากรูป | 🟡 | face detect client-side (lib CDN) → ส่ง *feature number* (ไม่ใช่รูป) → Function แปลผล |
| AI chat ปลายเปิด (streaming) | 🟡 | Function stream ได้แต่ฝืด · ทางเลือก: ตอบทีเดียว (ไม่ stream) ให้เข้ากรอบ static ง่ายกว่า |
| ขายของ/ชำระเงิน | 🔴→🟡 | เพิ่ม **payment provider (Omise/PromptPay)** + Function + Firestore `orders/` |
| Premium / subscription gating | 🟡 | ต้องมี auth ก่อน + Firestore `subscriptions/` + เช็คสิทธิ์ใน client/Function |
| SEO/หน้า static หลายหน้า | 🟡 | static hosting รองรับหลายไฟล์ได้ แต่ไม่มี SSR — เนื้อหา personalized จะไม่ index (เป็นข้อจำกัดที่ยอมรับ) |

**ข้อจำกัดที่ต้องรู้ (จากการยึด static + Firebase):**
- ไม่มี SSR → หน้า personalized **ไม่ถูก index โดย search engine** (แลกกับความเรียบง่าย) ถ้า SEO สำคัญมากต้องทบทวนกรอบ
- Dynamic OG image ต้องผ่าน Function (static host เดี่ยวๆ ทำไม่ได้)
- หลาย feature (email/payment/premium) **ต้องมี Auth ก่อน** — ปัจจุบันยังไม่มี เป็น dependency ร่วม

---

## 5. Business Requirements (input รอบ 1 — เจ้าของผลิตภัณฑ์)

Requirement รอบแรก (2026-06-05) — ทั้ง 3 อยู่ในกรอบสถาปัตยกรรมเดิม (🟢/🟡 ตาม §4):

| # | Requirement | fit §4 | สิ่งที่เพิ่ม |
|---|---|---|---|
| 1 | **ลักขณาราศีจากวันเกิด (optional)** — กรอกวันเกิดได้/ไม่ได้; กรอกแล้วโชว์ลักขณาราศี, ไม่กรอกไม่โชว์ | 🟢 | client-side panel + ธาตุ/ดาวเจ้าเรือนใน ZODIACS |
| 2 | **เนื้อคู่ประตูถัดไป** — ฟีเจอร์แยก, โหมดโสด/มีคู่; แสดง รูปร่าง · อาชีพ · ระดับความหล่อ (บาร์) · ระดับการเงิน (บาร์) | 🟢 | persona variant + `askSoulmate` (JSON mode) + power bars |
| 3 | **กราฟชีวิต ±5 ปี (ศาสตร์ไทย)** — อดีต 5 ปี + อนาคต 5 ปี | 🟢 | deterministic compute (นักษัตร/ชง/โฉลก/อายุ) + Chart.js |

---

## 6. Feature Backlog & Roadmap

### รอบ 1 — ✅ DONE (deployed 2026-06-05)
- ✅ ลักขณาราศี (optional) — panel โชว์เมื่อมีวันเกิด, ซ่อนเมื่อไม่มี
- ✅ เนื้อคู่ประตูถัดไป — tab + `askSoulmate` Function (OpenAI JSON) + บาร์ค่าพลัง + โหมดโสด/มีคู่
- ✅ กราฟชีวิต — Chart.js, ปีนักษัตร ชง/โฉลก + จังหวะอายุ, ไฮไลต์ปีรุ่ง/ปีระวัง
- ✅ Tab nav 3 แท็บ (ดูดวง / เนื้อคู่ / กราฟชีวิต)

### Backlog (รอ requirement รอบถัดไป)
- ดวงประเภทอื่น (การงาน/การเงิน timeline) — 🟢 ในกรอบ
- ประวัติ/โปรไฟล์ user, แชร์ OG, premium — 🟡 ต้องเพิ่ม Auth ก่อน
- เบอร์มงคล e-commerce (milestone 100k เคส)

---

## 7. References
- `index.html` — แอป (single-file)
- `functions/index.js` — askFortune + getCount
- `functions/prompt.js` — persona + buildUserPrompt (shared)
- `functions/eval.js` — quality eval harness
- Roadmap เดิม (เบอร์มงคล milestone 100k): `~/.claude/.../memory/mae-mor-bara-roadmap.md`

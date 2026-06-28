# แม่หมอบาร่า — Development Roadmap V2
### Version 2.0 · June 2026 · จาก Product Committee Review (2026-06-27)

> **ที่มา:** `Capybarabu_Product_Review.pdf` (96 หน้า) — มติคณะกรรมการ **"เดินหน้า (มีเงื่อนไข)"**
> เอกสารนี้คือ **requirement รอบ 2** (อ้างอิง [SPEC.md §5](SPEC.md)) แปลงเป็นแผนพัฒนาเชิงวิศวกรรม
> โดย **ยึด envelope สถาปัตยกรรมเดิม** (Firebase Hosting static + Cloud Functions + Firestore + OpenAI)
> ตามที่ล็อกไว้ใน [SPEC.md §1–§4](SPEC.md)
>
> **5 เงื่อนไขของคณะกรรมการ (ต้องสะท้อนในทุกเฟส):**
> 1. ตัดสโคป MVP ให้กระชับ 2. ยก **การแชร์** + **ดวงความรัก** เป็นพระเอก
> 3. คุมการขายไม่ให้หนัก (Gen Z อ่อนไหวราคา) 4. เก็บข้อมูลเพื่อ personalization 5. ใช้ **LINE** เป็นช่องทางหลัก

---

## 🎨 อัปเดตทิศทางดีไซน์ (2026-06-28) — "CAPY POP" (Sprint R)
> หลัง Sprint 0–3 ทำ design review + research Gen Z (Boundev: muted=น่าลืม · Duolingo: มาสคอตมีบุคลิก · Marketing Oops Muketing: สายมูไทย mu-nimalistic).
> **มติ:** ธีม mockup เดิม "Cute Mystic Premium" (ม่วง gradient) เสี่ยงดู AI-slop สำหรับ Gen Z → เปลี่ยนเป็น **"CAPY POP"**: **มาสคอตคาปิบาราเป็นพระเอก** (asset §7) · สีส้มมะม่วง `#ff6a2b` flat · เสียงแม่หมอกวน · สไตล์เล่นสนุก POP · ฟอนต์ Anuphan.
> เป็น **re-skin** บนฟีเจอร์เดิม (logic `Fortune`/`ShareCard` reuse) → **Sprint R** ใน [TASKS.md](TASKS.md) (R1–R6, สร้าง `app-v2.html` parallel, รอ product owner sign-off ก่อน replace production). tokens: `design-tokens-v2.css` · concept: `redesign-capypop.html`.

---

## 0. Gap Analysis — ของที่มีวันนี้ vs. ที่ V2 ต้องการ

| มิติ | As-built วันนี้ | V2 ต้องการ | ช่องว่าง |
|---|---|---|---|
| โครงแอป | `index.html` ไฟล์เดียว 3 แท็บ | 10 หน้าจอ + nav | ต้องมี **app shell / router** (static, no build) |
| Identity | ไม่มี auth · localStorage | Guest-first → **LINE login** + เก็บวันเกิด/ความตั้งใจ | ต้องเพิ่ม **Firebase Auth + LINE custom token** 🔴→🟡 |
| Data | `stats/global.count` | profile, streak, journal, orders, collection | ต้องเพิ่ม Firestore collections + rules |
| ดูดวง | รายวัน/รายเดือน + (รอบ1) ลักขณา/เนื้อคู่/กราฟชีวิต | **Fortune Engine** เดียว หลายหมวด | refactor logic เดิม → engine แบบ template |
| แชร์ | copy/share text | **การ์ดรูปสวย** ลง TikTok/IG/LINE ทุกผลลัพธ์ | ต้องมี **share-card renderer** (canvas client-side) |
| เกม | — | streak · mood · power score · collection | ต้องสร้างชั้น gamification |
| คอมเมิร์ซ | — | Charm Shop + Product Detail + payment | ต้องเพิ่ม **payment provider** + `orders/` 🔴→🟡 |
| LINE | LIFF endpoint | login หลัก + push check-in | LIFF + Messaging API push |

**ของรอบ 1 ที่นำมา reuse ได้ทันที:** ลักขณาราศี, เนื้อคู่ประตูถัดไป, กราฟชีวิต, การคำนวณ ราศี/นักษัตร/เลขชะตา/สีมงคล client-side → กลายเป็น **หมวดใน Fortune Engine** และ feed เข้าหน้า Daily Home

---

## 1. Critical Path — 2 ตัวปลดล็อกที่ต้องทำก่อน

ทุกฟีเจอร์ V2 ที่จำราย user ได้ (journal/streak/collection/shop/premium) **บล็อกอยู่ที่ Auth** และทุก KPI growth บล็อกอยู่ที่ **Share-card**

> **สถานะ (อัปเดต 2026-06-28):**
> - ✅ **A — Auth**: e2e **ใช้งานจริง** — LINE/Guest login (custom token), `auth.html` 7 หน้าจอ + resume state machine, `lineLogin`+`claimReward` deployed (channel `2010529290`, LIFF `2010529290-KVVcb2tN`)
> - ✅ **Firestore rules**: merge เข้า autopost + **deployed** · แก้ security bug recursive wildcard · verify ครบ
> - ✅ **B — Share-card engine**: `share-card.js` (global `ShareCard`) 1080×1350 · ใช้จริงใน app + poc-share
> - ✅ **C — App shell**: `app.html` — component library + bottom-nav 5 แท็บ + hash router (+ sub-views pick/quiz)
> - ✅ **Design system**: `design-tokens.css` (Cute Mystic, production) + **`design-tokens-v2.css` (CAPY POP, Sprint R)**
> - ✅ **Core loop + Viral**: C1 Home · C3 Fortune Engine (5 หมวด) · C4 Pick a Card · C5 Charm Quiz — `fortune-engine.js` (global `Fortune`)

### 🔓 Unblocker A — Identity & Data (Firebase Auth)
- Firebase **Anonymous auth** = Guest-first (ลองดูดวงได้ทันที ไม่ต้องล็อกอิน)
- Upgrade เป็น **LINE login**: Firebase ไม่มี LINE provider ในตัว → ใช้ **LINE Login (LIFF) → mint Firebase custom token ผ่าน Cloud Function** (เป็น technical risk หลัก ต้อง POC ก่อน)

**ลำดับ provider (ตัดสินใจแล้ว — เริ่มจากตัวเสี่ยงสุด):**
| ลำดับ | Provider | ความเสี่ยง | วิธี |
|---|---|---|---|
| 1 (เสร็จ POC) | **LINE** | 🔴 Firebase ไม่มี provider | verify ID token + `createCustomToken` ผ่าน Function |
| 2 | **Guest** | 🟢 | `signInAnonymously` (entry point) |
| 3 | **Google** | 🟢 native | `GoogleAuthProvider` + redirect — ไม่ต้องแตะ backend |

ทั้ง 3 ลงเอยที่ **Firebase user เดียวกัน (uid)** → โค้ด app เขียนครั้งเดียว ไม่สน provider · Guest→LINE/Google ใช้ account linking (Google = `linkWithRedirect` native; LINE custom-token = merge data ฝั่ง backend)
- Firestore `users/{uid}`: `{ birthDate, intention, element, capyPoints, streak, createdAt }`
- Security rules: `users/{uid}` เขียนได้เฉพาะเจ้าของ (pattern เดียวกับแอปหารกันเอง)
- เก็บ **วันเกิด + ความตั้งใจ** แบบเบาตั้งแต่ Guest (ใช้ 3 dropdown เดิม — LINE WebView compatible)

### 🔓 Unblocker B — Share-card Engine
- เรนเดอร์การ์ดผลลัพธ์เป็น **รูป** ฝั่ง client (`<canvas>` หรือ lib CDN เช่น html-to-image) → ดาวน์โหลด/แชร์
- ใช้ซ้ำได้ทุกผลลัพธ์ (Daily, Pick a Card, Quiz, Fortune Engine) — template เดียว ใส่ตัวแปร
- (optional) **Dynamic OG image** สำหรับ link preview → ต้อง Cloud Function (satori/canvas) + หน้า result ต่อ id

### 🧱 Unblocker C — App Shell (static, no build)
- **แนะนำ:** hash-router ใน single-file (สอดคล้อง "static-first, no build step" + ของเดิม) — แต่ละหน้าจอเป็น view ที่ toggle ด้วย `#/home`, `#/card`...
- ทางเลือก: หลายไฟล์ `.html` (Firebase Hosting รองรับ) — แลกกับ shared state ยากขึ้น
- *(การตัดสินใจนี้กระทบทั้งโปรเจกต์ — ยืนยันก่อนเริ่ม Phase 1)*

---

## 2. Phase 1 — MVP: ฟรี + สนุก + แชร์ได้ (พิสูจน์ตลาด)

เรียงตาม **leverage ต่อ KPI** (Auth + Share-card + App Shell เป็น prerequisite)

| ลำดับ | ฟีเจอร์ | มติ กก. | งานหลัก | KPI ที่ขับ | Asset |
|---|---|---|---|---|---|
| P1.1 | **Daily Fortune Home** | KEEP (core) | dashboard: พลังวันนี้ % + trio (สี/เลข/เวลา) + daily hook + **ดันหมวดความรัก** + personalize ตามวันเกิด | D7 ≥ 25% | ออร์บ⚡7🕐💎 |
| P1.2 | **Share-card ทุกผลลัพธ์** | (เงื่อนไข #2) | Unblocker B → ปุ่มแชร์เป็น action หลักทุกหน้า | Share ≥ 25% | — |
| P1.3 | **Fortune Engine** | IMPROVE | รวมดวงเป็น engine เดียว template หลายหมวด, **เปิดด้วยความรัก+การเงิน**, ลด fear-based · fold ของรอบ 1 เข้ามา | CTA ≥ 15% | เหรียญ/ถุงเงิน |
| P1.4 | **Pick a Card** | KEEP | เลือก 1/3 ใบ + คำทำนายบวก + reshuffle + **แชร์เป็นปุ่มหลัก** ลด cross-sell | Share | ถือไพ่ 3 ใบ |
| P1.5 | **Lucky Charm Quiz** | KEEP | ควิซ <60 วิ → ผลแบบ personality + การ์ดแชร์ → สะพานสู่ shop · วัด completion | Quiz ≥ 60% | การ์ดคว่ำ "?" |
| P1.6 | **Journal / Streak** | KEEP | streak + reward · mood check · **ปุ่ม "ตรงไหม?"** (data flywheel) · ปฏิทินรายเดือน | D7 ↑ | เขียนสมุด |
| P1.7 | **Charm Shop (lean)** | IMPROVE | catalog เล็กคัดสรร · **ชาร์มดิจิทัล <฿99** · แยกดิจิทัล/ของจริง · wishlist · ไม่โปรหนัก | ATC ≥ 10% | ถาด+ถุงช้อป |
| P1.8 | **Product Detail** | KEEP | ราคาชัด · CTA เดียว · รับประกัน 7 วัน · **โบนัส Digital Charm ใน LINE** | ATC | จี้บนแท่น |
| P1.9 | **Landing Page** | IMPROVE | เหลือ **Hero CTA เดียว** ("เริ่มเช็กดวงเลย") · ดัน social proof · ลดแบนเนอร์ขาย | CTA | ลูกแก้ว/ไม้กายสิทธิ์ |
| P1.10 | **LINE integration** | KEEP | login หลัก (ปุ่มเด่น) · LIFF · push check-in รายวัน | LINE ≥ 70% | — |

**Payment (รองรับ P1.7/P1.8):** ใช้ provider โฮสต์ (Omise / PromptPay ผ่าน Omise/2C2P) — **ห้ามแตะบัตรฝั่ง client** · Cloud Function สร้าง charge · Firestore `orders/`

---

## 3. Phase 2 — ขยาย / หารายได้ (เมื่อมีฐานผู้ใช้ & ผ่าน KPI)

| ฟีเจอร์ | มติ กก. | งานหลัก |
|---|---|---|
| Profile & Collection (เต็ม) | DEFER | ขยายเป็น 40 ชิ้น · level · collection progress เต็ม |
| **Premium (Gold) tier** | DEFER | subscription gating → Firestore `subscriptions/` + เช็คสิทธิ์ (ต้องมี Auth ก่อน) |
| เพิ่มหมวดดวงเชิงลึก | Phase 2 | การงาน/สุขภาพ/**เนื้อคู่เชิงลึก** (ต่อยอดของรอบ 1) |
| ขยายคอลเลกชันเครื่องราง | Phase 2 | สินค้าจริงเพิ่ม |
| **LINE automation** | Phase 2 | push รายวัน/ตามธาตุ → Cloud Scheduler + Messaging API |
| คอลแลบครีเอเตอร์/อาจารย์ | Phase 2 | เพิ่มความน่าเชื่อถือ |

---

## 4. KPI Instrumentation (ต้องวัดได้ตั้งแต่ Phase 1)

| KPI | เป้า | event ที่ต้อง log |
|---|---|---|
| D7 Retention | ≥ 25% | session ราย uid ราย day |
| Share rate | ≥ 25% | คลิกปุ่มแชร์ / ผลลัพธ์ |
| CTA (เริ่มเช็กดวง) | ≥ 15% | landing → fortune |
| Quiz completion | ≥ 60% | quiz_start vs quiz_complete |
| Add-to-Cart | ≥ 10% | shop view → atc |
| LINE login | ≥ 70% | login provider = line |

→ ใช้ Firestore event log หรือ GA4 (เลือกอย่างเดียว, อย่าใส่ทั้งคู่)

---

## 5. ความเสี่ยง & การตัดสินใจสถาปัตยกรรม (ต้องเคลียร์ก่อน)

1. **LINE → Firebase Auth**: ไม่มี provider ในตัว ต้อง mint custom token เอง — **POC ก่อนสุด** (critical path)
2. **App shell**: hash-router single-file (แนะนำ) vs multi-page — ยืนยันก่อนเริ่ม
3. **Payment/PCI**: ใช้ provider โฮสต์เท่านั้น ห้ามจัดการบัตรเอง
4. **ไม่มี SSR**: หน้า personalized ไม่ถูก search index → การเติบโตพึ่ง **share-card รูป** ไม่ใช่ SEO (ยอมรับตามกรอบ §4)
5. **คุมการขาย**: core loop ต้องฟรี/คุ้มใจก่อนเสมอ — Shop/Premium ห้ามเด่นจนรู้สึก pay-to-win

---

## 6. ลำดับลงมือแนะนำ (sprint-level)

```
Sprint 0  Unblocker A (Auth POC: LINE custom token) + Firestore model + rules
Sprint 1  Unblocker C (app shell/router) + Unblocker B (share-card engine)
Sprint 2  P1.1 Daily Home + P1.3 Fortune Engine (fold รอบ1) + P1.9 Landing
Sprint 3  P1.4 Pick a Card + P1.5 Charm Quiz  (+ share-card ทุกผล)
Sprint 4  P1.6 Journal/Streak + P1.10 LINE push  (data flywheel)
Sprint 5  P1.7 Shop + P1.8 Product Detail + Payment + orders/
Sprint 6  P1.9 Landing (L1) + KPI instrumentation + polish + เปิด MVP → วัดผล
Sprint R  Redesign "CAPY POP" (re-skin, track แยก, รอ product owner) — ดู TASKS.md
─────────  ผ่าน KPI → Phase 2 (Profile/Collection, Premium, automation)
```

**สถานะจริง (2026-06-28):** Sprint 0–3 ✅ (commit `083daf1`) · ถัดไป = **Sprint R (user เลือก)** หรือ Sprint 4

---

## 7. Asset Map (มาสคอต 1 ท่า/ฟีเจอร์ — จาก `/img`)
| ท่ามาสคอต | ใช้กับ |
|---|---|
| ลูกแก้ว+เทียน+ไพ่ / ไม้กายสิทธิ์+ดาว | Landing (02) · brand hero |
| ออร์บพลัง ⚡7🕐💎 | Daily Fortune Home (03) |
| ถือไพ่ 3 ใบ | Pick a Card (04) |
| เหรียญทอง+ถุงเงิน+ลูกแก้ว | Fortune Engine การเงิน (05) |
| การ์ดคว่ำมี "?" | Lucky Charm Quiz (06) |
| ถาดเครื่องราง+ถุงช้อป | Charm Shop (07) |
| จี้อเมทิสต์บนแท่น | Product Detail (08) |
| เขียนสมุด+ปฏิทิน+หัวใจ+เหรียญ | Journal/Retention (09) |
| ล้อมรอบด้วยคอลเลกชันเครื่องราง | Profile & Collection (10) |

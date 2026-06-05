# Product Spec & Roadmap — แม่หมอบาร่า Web Edition
### Version 2.1 · June 2026 · Platform: Web (Next.js 14 + Firebase + OpenAI)

> **เอกสารนี้คืออะไร:** ฉบับปรับจาก *Spec v2.0 (HoroscopeWebApp_SpecRoadmap_v2.docx)* โดย
> (1) เปลี่ยน stack เป็น **Next.js + Firebase + OpenAI** (คงของเดิมที่ deploy แล้ว ไม่ย้าย Supabase/Claude)
> (2) เติม 3 ส่วนที่ v2.0 ปัดตก: **Horoscope Engine · Account/PDPA · Email Infrastructure**
> (3) จัดลำดับ sprint ใหม่ให้ front-load ฟีเจอร์ไวรัล
> (4) ตัด scope ที่เกินจำเป็นออกจาก MVP
>
> **บริบท:** นี่คือการ re-platform ของ **แม่หมอบาร่า** (เดิม single-file HTML บน Firebase Hosting + Cloud Functions + GPT-4o-mini) ขึ้นเป็น web app เต็มรูปแบบ — **คงแบรนด์/persona แม่หมอแคปบาร่า** ไว้ ไม่ใช่แอป generic

---

## 1. Overview & Objectives

| รายการ | รายละเอียด |
|--------|-----------|
| ชื่อ | แม่หมอบาร่า (Mae Mor Bara) — ดูดวง web app |
| เป้าหมายธุรกิจ | SEO-driven + viral sharing → monetize ด้วย premium subscription + e-commerce (เบอร์/สี/วัตถุมงคล) |
| กลุ่มเป้าหมาย | ผู้หญิง 22-38 สายมูเตลู ใช้ browser ทั้ง desktop/mobile |
| North Star | **WAU growth +20% MoM ภายใน 6 เดือน** ผ่าน organic + viral share |
| Persona | แม่หมอแคปบาร่ายิปซี กระเทยไทย อบอุ่น แม่นยำ (คงจาก `functions/prompt.js`) |
| Timeline | 18 สัปดาห์ / 6 sprints (สมมติ 1 dev full-time — ทีมเล็ก/เดี่ยวให้เพิ่ม buffer ×1.5) |

### 1.1 สิ่งที่เปลี่ยนจาก v2.0 (changelog)
1. **Stack:** Supabase→Firebase · Prisma→ตัด · NextAuth+SupabaseAuth→Firebase Auth · Claude→OpenAI · Vercel KV→Firestore/Upstash
2. **เพิ่ม §4 Horoscope Engine** เป็น workstream แยก (เดิมเป็น task ย่อย 1 บรรทัด)
3. **เพิ่ม §5 Account & PDPA** (เดิมไม่มี account model)
4. **เพิ่ม §6 Email Infrastructure** (เดิมประเมิน "integrate Resend" ต่ำไป)
5. **จัดลำดับ sprint ใหม่:** ดวงเนื้อคู่ (ไวรัล) ขยับมา S2 จากเดิม S3
6. **ตัด MVP:** เหลือ Omise/PromptPay (ตัด Stripe), GA4 (ตัด Meta Pixel/Vercel Analytics ช่วงแรก), Recharts (ตัด D3), Firebase Auth (ตัด NextAuth)
7. **Re-rate risk:** Content accuracy MEDIUM→**HIGH**
8. **Clarify โหงวเฮ้ง:** face-api ให้ landmark เท่านั้น → ต้องมี layer แปลผล (ดู §7)

---

## 2. Tech Stack (revised — Firebase/OpenAI)

| Layer | Technology | หมายเหตุ |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + TypeScript | SSR/SSG/ISR + API routes, SEO ดีเยี่ยม |
| Styling | Tailwind CSS + shadcn/ui | คง theme จักรวาล/ม่วง-ทอง ของแม่หมอ |
| **Hosting** | **Vercel** (frontend/SSR) | ดู §3 การตัดสินใจ host |
| **Database** | **Firebase Firestore** | ของเดิมใช้ Firestore (`stats/global`) อยู่แล้ว |
| **Auth** | **Firebase Auth** (Anonymous → Google/LINE link) | ตัวเดียว ไม่ใช้ NextAuth |
| Backend logic | **Firebase Cloud Functions v2** (asia-southeast1) | คง askFortune/getCount + เพิ่ม endpoints |
| AI | **OpenAI** — GPT-4o-mini (fortune), GPT-4o (chat ปลายเปิด) | คงของเดิม |
| Email | **Resend** + React Email + **Cloud Scheduler** | ดู §6 |
| Charts | **Recharts** | การเงิน/กราฟชีวิต (D3 เฉพาะถ้าจำเป็นภายหลัง) |
| OG Image | **@vercel/og (Satori)** | ทำงานเต็มที่บน Vercel |
| Payments | **Omise / PromptPay** (Stripe เฟสหลัง) | ตลาด TH ก่อน |
| Rate limit / cache | **Firestore counter** หรือ **Upstash Redis** | แทน Vercel KV |
| Face detection | **face-api.js** (client-side) | ให้ landmark; แปลผลดู §7 |
| Analytics | **GA4** | ตัวเดียวช่วงแรก |
| Error tracking | Sentry | คงเดิม |

---

## 3. Hosting Decision — Next.js × Firebase

Next.js SSR ต้องมี Node host จึงต้องเลือก:

| ทางเลือก | ข้อดี | ข้อเสีย |
|---|---|---|
| **A. Vercel + Firebase backend** ✅ แนะนำ | `@vercel/og`/SSR/preview deploy เต็มสูบ, Firebase ทำ Auth/Firestore/Functions/AI | cross-cloud (จัดการ 2 คอนโซล) |
| B. Firebase App Hosting | อยู่ใน Firebase ทั้งหมด ใกล้ Functions | ใหม่กว่า, ต้องเทส `@vercel/og` ว่ารันได้ |

**คำแนะนำ:** เริ่มด้วย **A** — Next.js บน Vercel เรียก Firebase (Auth/Firestore) ตรงจาก client SDK และเรียก Cloud Functions เป็น API สำหรับงานที่ต้องซ่อน key (OpenAI). `@vercel/og` เป็น Edge function บน Vercel
*(ยังเปิดให้เปลี่ยนเป็น B ได้ — เป็น Open Decision §15)*

---

## 4. Horoscope Engine (NEW — แก่นของสินค้า)

> นี่คือ workstream ที่สำคัญและยากที่สุด ทุกฟีเจอร์แขวนอยู่บนมัน Risk = HIGH

### 4.1 หลักการ — "compute สิ่งที่คำนวณได้ ฝั่ง code, ใช้ LLM เฉพาะการเล่าเรื่อง"
LLM ไม่แม่นเรื่อง วันในสัปดาห์/เลขคณิต → **คำนวณ deterministic ฝั่ง server แล้วป้อนให้ LLM** (pattern เดียวกับที่ทำใน `functions/prompt.js` แล้ว)

### 4.2 Deterministic layer (`packages/astrology/` — pure TS, มี unit test)
ยกของเดิมมาเป็น shared module:
- `getZodiac(date)` — 12 ราศี + ธาตุ (ไฟ/ดิน/ลม/น้ำ) + ดาวเจ้าเรือน
- `getChineseZodiac(year)` — 12 นักษัตร
- `getThaiDay(date)` — วันเกิดในสัปดาห์ + สีมงคล + ความหมายสี + เทวดาประจำวัน + พื้นดวง
- `getLifePathNumber(date)` — เลขชะตา (digit-sum) + เลขมงคล 3 หลัก + ความหมาย
- `getDailyColor(date)` / `getMonthlyTheme(month)` — สีเสื้อมงคล + theme รายเดือน
- **(ใหม่) `getCompatibility(d1,d2)`** — score 3 ด้าน (รัก/เงิน/นิสัย) จากราศี+ธาตุ+นักษัตร
- **(ใหม่) `getLifeTimeline(date, 20..70)`** — peak/low ตามจังหวะดาว (rule-based)
> ทั้งหมดมี **unit test + snapshot** → ป้องกัน regression และเป็น "ความแม่น" ที่ตรวจสอบได้

### 4.3 Narrative layer (LLM)
- System prompt ต่อยอดจาก `prompt.js` — แตก persona variants ต่อฟีเจอร์ (เนื้อคู่/การงาน/การเงิน/สุขภาพ)
- รับ deterministic data ทั้งหมดเป็น input (สี+ความหมาย, เลขชะตา, วันเกิด, ธาตุ)
- **กฎ caching:** cache ผลตาม `hash(birthDate + type + period)` ใน Firestore/Upstash → ลดค่า LLM + ผลคงที่เมื่อแชร์

### 4.4 Accuracy / content QA (เดิมไม่มีใน roadmap)
- จ้าง/ปรึกษา **astrologer consultant** review prompt + rule tables (งบ + อยู่ใน S1-S2)
- eval harness (มีต้นแบบที่ `functions/eval.js`) ขยายเป็น matrix: ราศี×วัน×ประเภท + auto-check (ไทยล้วน, ปิด💡, อ้างข้อมูลจริง, ไม่มี markdown, ความยาว)

---

## 5. Account, Identity & PDPA (NEW)

### 5.1 Funnel: anonymous → registered → premium
| ระดับ | ทำอะไรได้ | Auth |
|---|---|---|
| **Anonymous** | ดูดวงทุกหน้า (ใส่วันเกิด), แชร์ result | Firebase Anonymous Auth (เดิมมี) |
| **Registered** | บันทึกวันเกิด, รับ email digest, ประวัติดวง, health alert | link Google/LINE เข้า anonymous uid |
| **Premium** | กราฟชีวิต, AI chat ไม่จำกัด, ไม่มีโฆษณา | Registered + subscription active |

> Anonymous→Registered ใช้ Firebase `linkWithCredential` → ไม่เสีย state/ประวัติ

### 5.2 PDPA (พ.ร.บ.คุ้มครองข้อมูลฯ 2562)
- **วันเกิด = ข้อมูลส่วนบุคคล** → เก็บเฉพาะเมื่อ user สมัคร + กด consent; anonymous เก็บใน localStorage ฝั่ง client เท่านั้น
- **รูปโหงวเฮ้ง** → ประมวลผล client-side, **ไม่ส่ง server, ไม่เก็บ** (ดู §7)
- Cookie consent banner + Privacy Policy + สิทธิ์ลบข้อมูล (right to erasure) → ปุ่ม "ลบบัญชี+ข้อมูล"
- Email: double opt-in + one-click unsubscribe

### 5.3 Firestore data model (ขยายจาก v2.0)
```
users/{uid}                  # profile, birthDate(encrypted), consentFlags, tier
horoscopeCache/{hash}        # cached LLM result (birthDate+type+period)
compatibility/{hash}         # shared compatibility result (public-read)
partnerResults/{hash}        # shared ดวงเนื้อคู่ result (public-read, สำหรับ OG)
emailSubs/{uid}              # {daily:bool, health:bool, verifiedAt, unsubToken}
subscriptions/{uid}          # Omise customer, plan, status, renewAt
orders/{orderId}             # shop orders
referrals/{code}             # referral program
stats/global                 # case counter (เดิม)
```

---

## 6. Email Infrastructure (NEW — เดิมประเมินต่ำไป)

"ส่งดวง 8:00 น." ไม่ใช่แค่ integrate Resend — เป็น **scheduled fan-out**:

```
Cloud Scheduler (cron 8:00 ICT)
  → Cloud Function: queryEmailSubs(daily=true, verified)
  → แบ่ง batch (เลี่ยง rate limit Resend) → Pub/Sub หรือ Cloud Tasks
  → worker: สร้างดวงรายวัน (จาก engine+cache) → ส่งผ่าน Resend
  → log open/click (webhook) → Firestore
```
- **Deliverability (HIGH risk):** custom domain + **SPF/DKIM/DMARC** + warm-up ค่อยๆ เพิ่ม volume
- **Double opt-in:** สมัคร → ส่ง verify link → ยืนยัน → `verifiedAt`
- **Unsubscribe:** one-click token link (CAN-SPAM/GDPR/PDPA)
- **Health alert:** opt-in แยก, schedule ส่งก่อนช่วงเสี่ยง 1 เดือน (cron รายวันเช็ค timeline)
- เริ่มเล็ก: digest รายวันก่อน, health alert เฟสหลัง

---

## 7. Feature Priorities (P1-P3)

### P1 — MVP
| Feature | Acceptance (สำคัญ) | Effort |
|---|---|---|
| **ดวงเนื้อคู่** 🔥 ไวรัลหลัก | 5 attributes, ผล <2s, OG image `/api/og`, shareable URL ทุก result | M |
| **ดวงรายวัน + Email digest** | `/today` + สี/เลขมงคล, double opt-in, Resend, unsubscribe 1-click | M (เพิ่มจาก S เพราะ email infra) |
| **ดวงการงาน** | timeline 12 เดือน, responsive, tooltip | S |
| **ดวงการเงิน** | Recharts bar/line, highlight เดือนดี/ระวัง, ไม่แนะนำพนัน | S |

### P2 — Growth
| Feature | หมายเหตุ | Effort |
|---|---|---|
| **เช็คความเข้ากัน** | `/compatibility/[hash]`, radar chart, OG, แชร์ LINE/FB | M |
| **ดวงสุขภาพ** | health timeline 12 เดือน, email alert opt-in แยก | S |
| **กราฟชีวิต** (Premium) | interactive Recharts zoom/pan, อายุ 20-70, export PNG | M |
| **โหงวเฮ้ง** ⚠️ | ดู clarification ล่าง | L |

> **⚠️ โหงวเฮ้ง — แก้ข้อขัดแย้ง v2.0:** face-api.js ให้แค่ landmark ไม่ใช่คำทำนาย
> - **ทางเลือกที่คง privacy:** detect landmark client-side → ส่งเฉพาะ *ตัวเลข feature* (ไม่ใช่รูป) ไป Function → map เป็นคำทำนายด้วย rule table หรือ LLM → **รูปไม่เคยออกจากเครื่อง** ✅
> - ตั้งชื่อให้ตรง: เป็น "โหงวเฮ้งจาก facial geometry" ไม่ใช่ "AI วิเคราะห์รูป"

### P3 — Monetization
| Feature | หมายเหตุ | Effort |
|---|---|---|
| **AI หมอดู Chat** (Premium) | OpenAI GPT-4o + **SSE streaming**, multi-turn ใน session, rate limit Free 3/วัน, markdown render | L |
| **เสริมดวง / Shop** | recommend ตามดวง (เบอร์/สี/วัตถุมงคล), Omise/PromptPay checkout, order email | M |

---

## 8. Sprint Roadmap (จัดใหม่ — front-load ไวรัล)

| Sprint | สัปดาห์ | Tasks | Deliverable |
|---|---|---|---|
| **S1** Foundation + Engine | 1-2 | Next.js+TS+Tailwind/shadcn · Firebase (Auth/Firestore) wired · CI/CD→Vercel preview · **`packages/astrology` + unit tests** · เริ่ม astrologer review | Foundation + engine ผ่านเทส |
| **S2** ไวรัล hero | 3-5 | **ดวงเนื้อคู่** · `@vercel/og` · shareable URL · **SEO meta/sitemap/JSON-LD ตั้งแต่ตอนนี้** · GA4 | พิสูจน์ share-loop ได้เร็ว |
| **S3** Retention | 6-7 | `/today` ดวงรายวัน · **Email digest infra** (Scheduler+Resend+double opt-in+unsub) | retention loop live |
| **S4** เนื้อหาเพิ่ม | 8-10 | ดวงการงาน · ดวงการเงิน (Recharts) · ดวงสุขภาพ + health alert · Core Web Vitals audit (LCP<2.5s) | P1 ครบ + สุขภาพ |
| **S5** Growth + Premium | 11-14 | เช็คความเข้ากัน + radar + shared · กราฟชีวิต · **Firebase Auth account flow** · **Omise subscription + premium gate** | Premium tier live |
| **S6** Monetize | 15-18 | AI chat (GPT-4o SSE) · Shop + Omise checkout · โหงวเฮ้ง · Sentry · load test · launch checklist | Full product |

> เปลี่ยนหลักจาก v2.0: เนื้อคู่ขยับ S3→S2 · SEO meta จาก S3→S2 · account flow ระบุชัดใน S5 · engine เป็น deliverable แยกใน S1

---

## 9. URL / Page Map (คงจาก v2.0)
`/` SSG · `/today` ISR(1h) · `/partner` CSR + `/partner/[hash]` SSR(OG) · `/career` · `/finance` · `/health` · `/compatibility` + `/[hash]` SSR · `/life-graph` (Premium) · `/face-reading` · `/chat` (Premium) · `/shop` ISR
API: `/api/og` (Edge) · Cloud Functions: `askFortune`, `chat` (SSE), `horoscope/[type]` (cached), email workers

---

## 10. Pricing & Monetization (NEW — เดิมไม่มี price point)
- **Free:** ดวงทุกหน้า, AI chat 3 คำถาม/วัน, มีโฆษณาเบาๆ
- **Premium (เสนอ ฿59-99/เดือน — ต้อง validate):** กราฟชีวิต, chat ไม่จำกัด, ไม่มีโฆษณา, email alert
- **Shop:** เบอร์/สี/วัตถุมงคล — revenue share กับ partner
- **Referral:** ชวนเพื่อน → unlock premium 1 เดือน
> ราคา/ฟีเจอร์ที่ gate ยังเป็น **Open Decision** — ต้องทำ price testing

---

## 11. Success Metrics (คง + ปรับ)
WAU +20% MoM · Bounce <45→40% · Session >3→4min · Email open >30→35% · **Share rate >20→30%** (ตัวชี้ไวรัล สำคัญสุด) · Premium conv >5→8% · LCP <2.5→2.0s · Uptime >99.5→99.9%

---

## 12. Risks (re-rated)
| Risk | ระดับ | Mitigation |
|---|---|---|
| **Content accuracy** | 🔴 **HIGH** (เดิม MEDIUM) | engine deterministic + astrologer review + eval harness |
| Email deliverability | 🔴 HIGH | custom domain + DKIM/SPF/DMARC + warm-up |
| SEO competition | 🔴 HIGH | long-tail + interactive tools คู่แข่งไม่มี |
| โหงวเฮ้ง privacy/ความเข้าใจผิด | 🟡 MEDIUM | client-side, ส่งแค่ feature number, ตั้งชื่อให้ตรง |
| LLM cost | 🟡 MEDIUM | cache ตาม hash + rate limit |
| ไม่มี push | 🟡 MEDIUM | email digest หลัก + Web Push (ถ้า browser รองรับ) |
| Cross-cloud (Vercel↔Firebase) | 🟢 LOW | latency ต่ำใน asia-southeast1, เอกสาร wiring ชัด |

---

## 13. Open Decisions (ต้องเคาะก่อน/ระหว่าง S1)
1. **Host:** Vercel+Firebase (แนะนำ) vs Firebase App Hosting
2. **ราคา Premium** + ฟีเจอร์ที่ gate
3. **Rate-limit/cache:** Firestore counter vs Upstash Redis
4. **โหงวเฮ้ง interpretation:** rule table vs LLM (จาก feature number)
5. **งบ astrologer consultant** สำหรับ content QA
6. **แบรนด์:** ยืนยันคงแม่หมอบาร่า persona ทุกหน้า (รวม chat)

---

## 14. Future Backlog (post-launch)
PWA + Web Push · offline mode · ดูดวงลายมือ (palmistry camera) · LINE OA integration · B2B embed widget · multi-language (EN/ZH) · **เบอร์มงคล e-commerce** (milestone 100k เคส จาก roadmap เดิม)

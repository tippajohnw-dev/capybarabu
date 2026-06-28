# แม่หมอบาร่า V2 — Task Backlog & ลำดับการแก้ไข
### อ้างอิงดีไซน์: `capybarabu_app_prototype.html` + `capybarabu_auth_first_login_mockup.html`
### ธีม **production ปัจจุบัน:** Cute Mystic Premium · `design-tokens.css`
### ธีม **ทิศทางใหม่ที่อนุมัติแล้ว (Sprint R):** **CAPY POP** · `design-tokens-v2.css` (สร้าง `app-v2.html` parallel, รอ product owner ก่อน replace)
> เอกสารคู่กัน: [ROADMAP-v2.md](ROADMAP-v2.md) (strategy/KPI/Phase 2) · [SPEC.md](SPEC.md) (spec) · [NEXT-SESSION.md](NEXT-SESSION.md) (handoff + prompt)

> รวม **24 feature tasks** (7 sprint) + **Sprint R** redesign (6) · สถานะ: ✅ เสร็จ · 🟡 บางส่วน · ⬜ ยังไม่เริ่ม

## สรุปจำนวน
| หมวด | จำนวน | ✅ | 🟡 | ⬜ |
|---|---|---|---|---|
| Foundation (ดีไซน์/shell) | 3 | 3 | 0 | 0 |
| Auth journey (Unblocker A) | 8 | 8 | 0 | 0 |
| Core features (Phase 1) | 7 | 5 | 0 | 2 |
| Commerce | 3 | 0 | 0 | 3 |
| Retention/KPI | 2 | 0 | 0 | 2 |
| Landing (P1.9) | 1 | 0 | 0 | 1 |
| **รวม (feature)** | **24** | **16** | **0** | **8** |
| Sprint R (redesign) | 6 | 1 (R0) | 0 | 5 |

> ✅ **Sprint 0+1+2+3 เสร็จ** (Auth e2e + Core loop + Viral) · commit/push: `083daf1`
> **ถัดไป (user เลือก) = Sprint R (Redesign CAPY POP)** · ทางเลือก feature track = Sprint 4 (Retention: C6 Journal/Streak + C7 LINE push)

---

## ตาราง Task (เรียงลำดับการแก้)

| # | Task | mockup screen | ขึ้นกับ | สถานะ | sprint |
|---|---|---|---|---|---|
| **F1** | **Design tokens** (สี/รัศมี/เงา/ฟอนต์) จาก mockup | ทั้ง 2 ไฟล์ | — | ✅ | 0 |
| **F2** | **Component library** — ปุ่ม/การ์ด/chip/bottom-nav/segmented/option-grid/streak/hero | ทั้ง 2 ไฟล์ | F1 | ✅ `app.html` `<style>` | 0 |
| **F3** | **App shell + bottom-nav router** (Unblocker C) — 5 แท็บ, hash-route, static no-build | app: `.nav` | F1,F2 | ✅ `app.html` | 0 |
| **A1** | **Welcome** (guest-first) — CTA "เริ่มเช็กดวงเลย" เด่นกว่า Login | auth: welcome | F2 | ✅ `auth.html` | 1 |
| **A2** | **Guest setup** — intention + วันเกิด (3 dropdown LINE-safe) | auth: guest | A1 | ✅ `auth.html` | 1 |
| **A3** | **Login trigger bottom-sheet** — LINE(primary)/Google/Apple | auth: login | A1, A7 | ✅ `auth.html` (เพิ่ม Apple + sheet) | 1 |
| **A4** | **PDPA Consent + consent-version logging** | auth: consent | A3 | ✅ `auth.html` (เขียน `consent{version,acceptedAt,scopes}`) | 1 |
| **A5** | **Profile setup** — ชื่อ + interest หลาย + tone | auth: profile | A4 | ✅ `auth.html` | 1 |
| **A6** | **Success + rewards** — opt-in LINE + **grant Capy Points (server)** | auth: success | A5 | ✅ `claimReward` function **deployed** + `auth.html` เรียกจริง (idempotent) | 1 |
| **A7** | **Backend providers** — `lineLogin`+`claimReward` deployed · LINE+Guest **e2e ใช้งานจริง** (IAM token-creator ทำแล้ว, channel `2010529290`, LIFF `2010529290-KVVcb2tN`) | — | — | ✅ (Google optional: เปิด provider เมื่อต้องการ; Apple optional) | 1 |
| **A8** | **Firestore rules + consent storage** — merge เข้า autopost + deploy · แก้ security bug recursive wildcard · verify ครบ | — | A7 | ✅ deployed + verify (profile✓/capyPoints บล็อก✓/journal sub✓) | 1 |
| **C1** | **Daily Luck Home** — energy hero (พลัง%) + trio chips (สี/เลข/เวลา) + fold + action grid + share | app: home | F3 | ✅ `app.html` personalize จาก `users/{uid}` + birthdate sheet | 2 |
| **C2** | **Share-card engine** — restyle palette/ฟอนต์ใหม่ → `share-card.js` (reusable global `ShareCard`) | app: share preview | F1 | ✅ `share-card.js` + `poc-share.html` restyle | 2 |
| **C3** | **Fortune Engine** — `fortune-engine.js` (global `Fortune`) · 5 หมวด เปิดด้วยรัก+เงิน · fold round1 (ราศี/นักษัตร/เลขชะตา/สีมงคล) · deterministic | app: home/result | F3 | ✅ engine+UI ใน `app.html` | 2 |
| **C4** | **Pick a Card** — ไพ่ 1/3 (สำรับ 12 ใบ ผลบวกเสมอ) + flip/dim + reshuffle + share · `Fortune.cards/pickResult` | app: pick | C2,C3 | ✅ view `#pick` ใน `app.html` | 3 |
| **C5** | **Lucky Charm Quiz** — mood + intention (2 ข้อ <1 นาที) → `Fortune.recommendCharm` (6 charm) + share | app: quiz | C2 | ✅ view `#quiz` ใน `app.html` | 3 |
| **C6** | **Mood Journal + Streak** — mood รายวัน + streak 7 วัน + ปุ่ม "ตรงไหม?" (flywheel) | app: journal | F3,A7 | ⬜ | 4 |
| **C7** | **LINE push** — ดวงรายวัน 1 ครั้ง (opt-in จาก A6) | — | A7,C1 | ⬜ | 4 |
| **D1** | **Charm Shop (lean)** — tab ตาม intention + digital charm <฿99 + grid | app: shop | F3 | ⬜ | 5 |
| **D2** | **Product Detail** — story สั้น + sticky buy + โบนัส Digital Charm ใน LINE | app: detail | D1 | ⬜ | 5 |
| **D3** | **Payment + orders/** — PromptPay/Omise (provider โฮสต์) + `orders/` | — | D1,A7 | ⬜ | 5 |
| **E1** | **Profile & Collection** — points + badge/collection ชุดเริ่มต้น | app: profile | F3,A7 | ⬜ | 6 |
| **E2** | **KPI instrumentation** — event D7/Share/CTA/Quiz/ATC/LINE | — | ทุก feature | ⬜ | 6 |
| **L1** | **Landing Page (P1.9)** — public hero CTA เดียว "เริ่มเช็กดวงเลย" + social proof (ตอนนี้ root `/` ยังเป็นแอปเดิม · welcome อยู่ใน A1) | app: landing | F3 | ⬜ | 6 |

---

## ลำดับ Sprint (เส้นทางการแก้)
```
Sprint 0 · Foundation   F1✅ → F2 component → F3 app shell+nav   ← ทุกหน้าจอ render ผ่านนี้
Sprint 1 · Auth journey A1→A2→A3→A4→A5→A6 (UI) + A7/A8 (backend)  ← gate ทุกอย่างที่จำ user
Sprint 2 · Core loop    C1 Home + C3 Fortune Engine + C2 restyle share-card  ← retention+growth
Sprint 3 · Viral        C4 Pick a Card + C5 Quiz
Sprint 4 · Retention    C6 Journal/Streak + C7 LINE push
Sprint 5 · Commerce     D1 Shop + D2 Detail + D3 Payment
Sprint 6 · Scale        E1 Profile/Collection + E2 KPI instrumentation
Sprint R · Redesign     R1→R6 "CAPY POP" (track แยก · รอ product owner)
```

---

## 🎨 Sprint R — Redesign "CAPY POP" (ใหม่ · จาก design review + research 2026-06-28)
> ทิศทาง **research-backed** (Boundev: muted=น่าลืม · Duolingo: มาสคอตมีบุคลิก · Muketing: สายมูไทย mu-nimalistic) + **ล็อกกับ user แล้ว**
> **ล็อก:** โทน **ส้มมะม่วง `#ff6a2b`** · เสียงแม่หมอ **กวนเต็มแม็กซ์** · สไตล์ **เล่นสนุก POP** (neo-brutalist toy: ขอบ 2px + เงาแข็ง) · **มาสคอตเป็นพระเอก** · ฟอนต์ Anuphan + IBM Plex Mono
> ⚠️ **track แยกจาก feature sprints · รอ product owner sign-off ก่อน replace "Cute Mystic Premium" ที่ live อยู่**
> assets พร้อม: [design-tokens-v2.css](design-tokens-v2.css) · [redesign-capypop.html](redesign-capypop.html) (concept ที่จูนแล้ว) · [redesign-minimal.html](redesign-minimal.html) (ALMANAC — reference) · `mascots/m1–m10.png` (ตัดพื้นหลังขาว→โปร่งใส + ย่อ 600px แล้ว)

| # | Task | ใช้ asset | สถานะ |
|---|---|---|---|
| **R0** | Design review + research Gen Z + concept 3 ทิศทาง + lock ทิศทาง + ตัดพื้นหลังมาสคอต 10 ท่า | — | ✅ 2026-06-28 |
| **R1** | Optimize มาสคอต → webp (ตอนนี้ PNG 600px ~0.66MB/ไฟล์) ให้เบาพอ LINE WebView | mascots/ | ⬜ |
| **R2** | แปลง `app.html` shell → CAPY POP (mango · Anuphan · pop shadow · dark nav) | design-tokens-v2.css | ⬜ |
| **R3** | Home (C1) ธีมใหม่ + hero ท่า m3 + เสียงแม่หมอกวน + trio chips pop | m3 · m1(avatar) | ⬜ |
| **R4** | Fortune/Pick-a-card/Quiz ธีมใหม่ + **สลับท่ามาสคอตตามฟีเจอร์** | m4(ไพ่) m5(เงิน) m6(quiz) m9 m8 | ⬜ |
| **R5** | Share-card canvas ใหม่ — ใส่มาสคอต + palette CAPY POP (growth lever) | share-card.js · mascots | ⬜ |
| **R6** | Product owner sign-off → replace theme เดิม / หรือ A/B test | — | ⬜ |

**Pose → feature map:** m1 ทักทาย/avatar · m3 พลังวันนี้(hero) · m4 เปิดไพ่ · m5 การเงิน · m6 charm quiz · m7 charm shop · m8 กันลบ/จี้ · m9 บันทึก · m10 โปรไฟล์

---

## 🔭 Phase 2 — หลังผ่าน KPI (strategy-level · ยังไม่แตก task · ดู [ROADMAP-v2.md §3](ROADMAP-v2.md))
ทำเมื่อ Phase 1 ผ่านเป้า KPI แล้วเท่านั้น — ยังไม่กำหนด task IDs/sprint:
- Profile & Collection เต็ม (40 ชิ้น · level · progress)
- **Premium (Gold) tier** — subscription gating → `subscriptions/` (ต้องมี Auth ก่อน ✅)
- หมวดดวงเชิงลึก (เนื้อคู่/การงาน/สุขภาพ — ต่อยอด reuse รอบ 1)
- ขยายเครื่องรางของจริง · **LINE automation** (Cloud Scheduler + Messaging API push) · คอลแลบครีเอเตอร์

## สิ่งที่ "ต้องแก้" ในของที่ทำไปแล้ว (เพราะดีไซน์ใหม่)
1. **`poc-share.html`** → เปลี่ยนจากธีมเข้ม/ทอง เป็น palette ใหม่ (violet/pink/mint/gold + ฟอนต์ Inter+Noto Sans Thai) [C2]
2. **`poc-auth.html`** → ขยายจาก 3 ปุ่มเดียว เป็น journey เต็ม (welcome→guest→result→login sheet→consent→profile→success) + เพิ่ม **Apple** + **PDPA consent** [A1–A6]
3. **`functions/auth.js`** → เพิ่มเก็บ consent version + notif pref ตอน upsert `users/{uid}` [A8]

## ✅ Sprint 1 — ปิดงาน: เหลือ "ปุ่มที่ต้องกดใน Console" (ผมทำแทนไม่ได้)
สถานะ: โค้ดเสร็จ · `lineLogin`+`claimReward` deployed (channel `2010529290` ตั้งใน `functions/.env`) · smoke-test ผ่าน

- [x] ~~สร้าง LIFF app~~ → `LIFF_ID = 2010529290-KVVcb2tN` · `liff.init` verify ผ่าน
- [x] ~~Deploy hosting~~ → live (200) · เพิ่ม HTML `no-cache` header (กัน user ได้หน้าเก่า 1 ชม.)
- [x] ~~Deploy functions~~ → `lineLogin`+`claimReward` live · ใช้ **run.app URL ตรง** (เลี่ยง CORS ของ cloudfunctions.net)
- [x] ~~เปิด Anonymous provider~~ → verify ผ่าน (`signInAnonymously` สำเร็จ)
- [x] ~~Deploy rules~~ → merge เข้า autopost + deploy แล้ว · **เจอ+แก้ security bug** (recursive `{sub=**}` match parent → ทำ anti-cheat capyPoints พัง; เอาออก + ใช้ match subcollection เฉพาะเจาะจง) · verify: profile เขียนได้/capyPoints ถูกบล็อก/journal sub เขียนได้

- [x] ~~IAM token-creator~~ → ทำแล้ว · **LINE login e2e ใช้งานจริง** ✅
- [x] ~~Onboarding resume state machine~~ → `onboardingStep` + resume จนจบ ✅

**✅ Sprint 1 เสร็จสมบูรณ์** · optional ที่ค่อยทำเมื่อต้องการ: เปิด Google provider, ตั้ง Apple provider

## หมายเหตุดีไซน์ที่ mockup เพิ่มเข้ามา (ไม่มีใน roadmap เดิม)
- **PDPA Consent** เป็นหน้าจอแยก + เก็บ consent version (กฎหมาย)
- **Apple login** (เดิมวางแค่ LINE/Google)
- **Profile setup**: ชื่อเรียก + interest + tone ดวง → ป้อน personalization
- **Reward system**: Capy Points + Daily Luck Card ตั้งแต่ login แรก
- **2 บริบทสี**: onboarding = จอเข้ม glass · แอปหลัก = surface cream สว่าง

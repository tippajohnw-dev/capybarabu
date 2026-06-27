# แม่หมอบาร่า V2 — Task Backlog & ลำดับการแก้ไข
### อ้างอิงดีไซน์: `capybarabu_app_prototype.html` + `capybarabu_auth_first_login_mockup.html`
### ธีม: **Cute Mystic Premium** · tokens: [design-tokens.css](design-tokens.css)

> รวม **23 tasks** · จัดเป็น 7 sprint ตาม dependency (Foundation → Auth → Core → Commerce → Retention)
> สถานะ: ✅ เสร็จ · 🟡 มีบางส่วน/ต้องแก้ให้ตรงดีไซน์ · ⬜ ยังไม่เริ่ม

## สรุปจำนวน
| หมวด | จำนวน | ✅ | 🟡 | ⬜ |
|---|---|---|---|---|
| Foundation (ดีไซน์/shell) | 3 | 3 | 0 | 0 |
| Auth journey (Unblocker A) | 8 | 8 | 0 | 0 |
| Core features (Phase 1) | 7 | 0 | 2 | 5 |
| Commerce | 3 | 0 | 0 | 3 |
| Retention/KPI | 2 | 0 | 0 | 2 |
| **รวม** | **23** | **11** | **2** | **10** |

> ✅ **Sprint 0 + Sprint 1 เสร็จสมบูรณ์ (e2e)** — LINE/Guest login ทำงานจริง, onboarding journey + resume state machine, functions/rules/hosting live. **ถัดไป = Sprint 2 (Core loop)**

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
| **C1** | **Daily Luck Home** — energy hero (พลัง%) + trio chips (สี/เลข/เวลา) + action grid + ดันความรัก | app: home | F3 | ⬜ | 2 |
| **C2** | **Share-card engine** — restyle ให้ตรง palette/ฟอนต์ใหม่ (ตอนนี้ธีมเข้มเก่า) | app: share preview | F1 | 🟡 `poc-share.html` เสร็จ → restyle | 2 |
| **C3** | **Fortune Engine** — template หลายหมวด เปิดด้วยรัก+เงิน · fold ของ round1 | app: home/result | F3 | 🟡 logic round1 มี → ทำ engine+UI | 2 |
| **C4** | **Pick a Card** — ไพ่ 1/3 + ผลเชิงบวก + reshuffle + ปุ่มแชร์หลัก | app: pick | C2,C3 | ⬜ | 3 |
| **C5** | **Lucky Charm Quiz** — mood + intention → แนะนำ charm (<1 นาที) + แชร์ | app: quiz | C2 | ⬜ | 3 |
| **C6** | **Mood Journal + Streak** — mood รายวัน + streak 7 วัน + ปุ่ม "ตรงไหม?" (flywheel) | app: journal | F3,A7 | ⬜ | 4 |
| **C7** | **LINE push** — ดวงรายวัน 1 ครั้ง (opt-in จาก A6) | — | A7,C1 | ⬜ | 4 |
| **D1** | **Charm Shop (lean)** — tab ตาม intention + digital charm <฿99 + grid | app: shop | F3 | ⬜ | 5 |
| **D2** | **Product Detail** — story สั้น + sticky buy + โบนัส Digital Charm ใน LINE | app: detail | D1 | ⬜ | 5 |
| **D3** | **Payment + orders/** — PromptPay/Omise (provider โฮสต์) + `orders/` | — | D1,A7 | ⬜ | 5 |
| **E1** | **Profile & Collection** — points + badge/collection ชุดเริ่มต้น | app: profile | F3,A7 | ⬜ | 6 |
| **E2** | **KPI instrumentation** — event D7/Share/CTA/Quiz/ATC/LINE | — | ทุก feature | ⬜ | 6 |

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
```

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

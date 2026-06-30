# แม่หมอบาร่า V2 — Handoff สำหรับ session ถัดไป
### อัปเดต 2026-06-30 · **Sprint 6 (Scale) เสร็จ + deployed → ครบ 24/24 feature** 🎉
> **เสร็จวันนี้ (Sprint 6):**
> - **E1 Profile & Collection** (`app.html` view `#profile`): chips จริง = แต้มสะสม(`capyPoints`)/streak/#เครื่องราง · grid คอลเลกชัน 10 ช่อง (unlock จาก paid `orders`+`collection`) · 5 ตราสะสม(badges) · ปลดล็อกทันทีหลังจ่ายใน `pollOrder`
> - **E2 KPI instrumentation**: `logEvent(name,params)`→`users/{uid}/events` (Firestore log, fire-and-forget) · events: `open`(D7,วันละครั้ง)/`share`/`cta_fortune`/`shop_view`/`atc`/`quiz_start`/`quiz_complete`/`purchase` + `login{provider}`@`auth.html` · เพิ่ม rule `users/{uid}/events` (owner append-only) + deployed
> - **L1 `landing.html`**: public hero CTA เดียว "เริ่มเช็กดวงเลย"→`auth.html` · trust chips · 4.9★ · 4 benefits · social proof (รีวิว = **placeholder** ให้ PO แทนด้วยจริง) · CAPY POP · มาสคอต m3
> - **Asset fix**: มาสคอต m1/m2/m7/m9/m10 มี checkerboard baked ค้างจาก Sprint R (ตัด bg ไม่หมด) → flood-fill ตัดออกจาก PNG ต้นฉบับ re-export webp + bump `?v=2` ทุกที่ (app/auth/landing)
> - verify local (preview 3457) ผ่านครบ · deploy rules(autopost)+hosting(mae-mor) แล้ว · live ✓
>
> **+ Sprint 6.5 (LINE share = การ์ดสวย) เสร็จ + deployed:**
> - **Daily LINE push → personalized Flex card** (`functions/notify.js`): คำนวณดวงรายคน (Fortune engine, `functions/fortune-engine.js` = COPY ของ root) → Flex bubble CAPY POP (hero มะม่วง+power%+มาสคอต `mascots/line-hero.png`+คำทักแม่หมอ+สี/เลข/เวลา+ปุ่มเปิดแอป) · push ทีละคน batch 5 (เลิก multicast text) · seed=uid ดวงไม่ซ้ำ · เวลาไทย `bangkokNow()`
> - **Share-card → infographic** (`share-card.js`): power ring (gauge) รอบ % + กราฟแท่ง 5 ด้าน (รัก/เงิน/งาน/กันลบ/สุขภาพ) · canvas สูง dynamic · `app.html` แนบ `data.bars` (bump `?v=s6`)
> - **ทดสอบ Flex**: วาง `scratchpad/flex-daily-sample.json` ใน LINE Flex Simulator · หรือ POST `senddailyfortunenow-ssgkv4kwca-as.a.run.app` header `x-admin-key` (= NOTIFY_ADMIN_KEY) — ถึงเฉพาะคน opt-in+เพิ่มเพื่อน OA+มี lineUserId
>
> **ค้าง = งาน go-live ฝั่ง user เท่านั้น (ไม่บล็อกโค้ด):** (a) publish LINE channel `2010529290` (b) Omise live (skey_live+webhook) (c) ชี้ Hosting root `/` → `landing.html` ตอนเปิดจริง (ตอนนี้ root ยังเป็นแอปเดิม `index.html`) (d) แทนรีวิว placeholder ใน landing
>
> ---
> #### อัปเดตก่อนหน้า · 2026-06-28 · หลังจบ Sprint 0+1+2+3 + ออกแบบ Sprint R (CAPY POP) · commit/push `083daf1`

---

## 🗺️ แผนทั้งโปรเจกต์ (มุมเดียว) · ละเอียด → [TASKS.md](TASKS.md) · [ROADMAP-v2.md](ROADMAP-v2.md) · [SPEC.md](SPEC.md)
| Sprint | งาน | สถานะ |
|---|---|---|
| 0 Foundation | F1 tokens · F2 components · F3 app shell | ✅ |
| 1 Auth | A1–A8 (journey + LINE login e2e + rules) | ✅ |
| 2 Core loop | C1 Home · C2 share-card · C3 Fortune Engine | ✅ |
| 3 Viral | C4 Pick a Card · C5 Charm Quiz | ✅ |
| **4 Retention** | C6 Journal/Streak ✅ · C7 LINE push + webhook ✅ deployed+activated (OA `@291wnbhf`, ch `2010545788`) | ✅ |
| **5 Commerce** | D1 Shop ✅ · D2 Detail ✅ · D3 checkout UI ✅ deployed · D3 payment backend (code ✅ Omise, activate ⬜) | 🟡 |
| **6 Scale** | E1 Profile/Collection ✅ · E2 KPI instrumentation ✅ · L1 Landing (`landing.html`) ✅ — **deployed** | ✅ |
| **R Redesign** ⭐ | R0–R6 CAPY POP **replace production แล้ว** (app/share-card/auth = CAPY POP, theme เดิม backup) | ✅ (R0–R6) |
| Phase 2 | Premium · Collection เต็ม · LINE automation … (strategy, หลัง KPI) | 🔭 |

**ถัดไป: Sprint 5 (Commerce)** D1 Shop · D2 Product Detail · D3 Payment — หรือ activate C7 (LINE Messaging API channel + secrets + deploy, ดู `C7-SETUP.md`). **KPI Phase 1:** D7≥25% · Share≥25% · CTA≥15% · Quiz≥60% · ATC≥10% · LINE≥70%
> ✅ Sprint 4: **C6 Journal/Streak deployed** · **C7 code เสร็จ** (`functions/notify.js`) รอ activate

---

## 📋 Prompt สำหรับ paste ใน session ถัดไป

```
ทำงานต่อ Mae Mor Bara V2 (แม่หมอบาร่า) — branch feat/mae-mor-bara-source

อ่าน context จาก: mae-mor-bara/NEXT-SESSION.md, TASKS.md, SPEC.md, ROADMAP-v2.md,
C7-SETUP.md, D3-SETUP.md · และ memory: mae-mor-bara-v2-roadmap.md

สถานะ: Sprint 0–5 + Sprint R เสร็จหมด (21/24 features) · ทุกอย่าง deploy + push แล้ว (origin/feat/mae-mor-bara-source)
ธีมปัจจุบัน = CAPY POP (ส้มมะม่วง #ff6a2b, neo-brutalist toy ขอบ2px+เงาแข็ง, มาสคอตพระเอก, Anuphan+IBM Plex Mono)
- ไฟล์หลัก: app.html (ทุก view) · auth.html (onboarding 7 จอ) · share-card.js · shop-catalog.js
  · fortune-engine.js (window.Fortune) · มาสคอต mascots/m1–m10.webp (<100KB)
- theme เดิม Cute Mystic backup: *-legacy-cutemystic.* + share-card-legacy.js (rollback)
- functions (codebase default): lineLogin, claimReward, askFortune…, sendDailyFortune(sched 08:00),
  sendDailyFortuneNow, lineWebhook, createCharge, omiseWebhook — deployed ครบ

เสร็จวันนี้:
- Sprint R: CAPY POP replace production (app/share-card/auth)
- C6 Journal/Streak/check-in/accuracy/history · C7 LINE push + toggle opt-in + lineWebhook (OA @291wnbhf, ch 2010545788, provider 2005291693) — activated
- D1 Shop (10 เครื่องราง ≤฿99) · D2 Detail · D3 Omise PromptPay (createCharge/omiseWebhook) — verified e2e (Test mode)

ถัดไป = Sprint 6 (Scale) บน app.html:
- E1 Profile & Collection — points + badge + เครื่องรางที่ซื้อแล้ว (อ่าน users/{uid}/orders ที่ paid + users/{uid}/collection)
- E2 KPI instrumentation — event D7/Share/CTA/Quiz/ATC/LINE (เป้า KPI ดู ROADMAP-v2)
- L1 Landing Page — public hero CTA เดียว "เริ่มเช็กดวงเลย" + social proof

ค้างฝั่ง user (ไม่บล็อกโค้ด): (a) Publish LINE Login channel 2010529290 (Developing→Published ไม่งั้นเพื่อนนอก tester ล็อกอินไม่ได้)
(b) Omise go-live: ลงทะเบียน webhook URL + สลับ skey_test→skey_live + เปิด PromptPay live

Gotchas สำคัญ:
- ยึด static no-build + Firebase (SPEC §1-4) · capybarabu-mae-mhor แชร์ Firestore+Hosting+functions กับ autopost
- firestore.rules canonical = ~/Documents/capybarabu-autopost/firestore.rules (deploy จากที่นั่นเท่านั้น)
- firebase ทุกคำสั่งใส่ --project capybarabu-mae-mhor (default CLI อาจเป็น capybarabu-dec37 = แอปหารกันเอง)
- function ที่เรียกจาก browser ใช้ run.app (-ssgkv4kwca-as.a.run.app) เลี่ยง CORS · server-to-server ใช้ cloudfunctions.net ได้
- JS cache: bump ?v=sN ที่ script src · พรีวิว serve clean-url ตัด query → เปิด /app?demo=1 (ไม่ใส่ .html, ไม่เขียน Firestore)
- LINE userId ผูกกับ provider ไม่ใช่ channel · pkey=public skey=secret · secret/token ห้ามวางในแชต
```

---

## ✅ เสร็จแล้ว (Sprint 3 — Viral)

- **`fortune-engine.js` เพิ่ม**: `cards(profile,salt)` (สำรับ 12 ใบ, สุ่ม 3 ใบไม่ซ้ำ deterministic, salt=สับใหม่) · `pickResult(card,profile,salt)` (ผลบวกเสมอ power 72-99) · `recommendCharm({mood,intention},profile)` (6 charm ตาม intention, mood แต่งประโยค) · `shareData` รองรับ `result.kind` แล้ว
- **`app.html` C4 Pick a Card** (`#pick`) — 3 ไพ่คว่ำ (🔮) → แตะ → flip ทอง + dim ใบอื่น → result card (headline/meaning/advice/chips) + ปุ่มแชร์ + สับไพ่ใหม่
- **`app.html` C5 Charm Quiz** (`#quiz`) — 2 คำถาม (mood→intention) progress bar → recommend charm + badge + story + chips + share + "ดูเครื่องรางทั้งหมด" + ทำใหม่
- **router**: เพิ่ม `SUBVIEWS = {pick:'fortune', quiz:'charm'}` (sub-view ไฮไลต์ tab แม่) · action-card หน้าหลัก + charm tab มี entry
- **verify (local 3457):** ✅ deck/reveal/reshuffle ✅ quiz flow→charm (real clicks) ✅ share canvas เรนเดอร์ทั้ง pick/charm ✅ ไม่มี console error

---

## ✅ เสร็จแล้ว (Sprint R — Redesign "CAPY POP") · 2026-06-29
- **ทำไม:** research Gen Z (Boundev: muted=น่าลืม · Duolingo: มาสคอตมีบุคลิก · สายมูไทย mu-nimalistic) → theme เดิม "Cute Mystic" (ม่วง gradient) เสี่ยงดู AI-slop
- **ล็อกกับ user:** ส้มมะม่วง `#ff6a2b` · เสียงแม่หมอกวนเต็มแม็กซ์ · เล่นสนุก POP (neo-brutalist toy: ขอบ 2px + เงาแข็ง) · มาสคอตเป็นพระเอก · Anuphan+IBM Plex Mono
- **R1 ✅** มาสคอต `mascots/m1–m10.webp` (PIL: ย่อ 480px + quality tune → **ทุกไฟล์ <100KB**, จาก PNG ~0.66MB). PNG เดิมยังอยู่ (ตัด bg โปร่งใสแล้ว)
- **R2/R3/R4 ✅** `app-v2.html` (**parallel ไม่ทับ `app.html` production**) — re-skin CAPY POP เต็มทุก view, **reuse logic เดิม 100%** (hash router · Firebase · `window.Fortune` · birthdate sheet · quiz/pick/fortune). hero m3 + speech bubble กวน + trio chips pop + action tiles flat + dark nav mango-active. สลับมาสคอตตามฟีเจอร์ (m1 avatar · m3 hero · m4 ไพ่ · m5 เงิน · m6 quiz · m7 shop · m10 โปรไฟล์)
- **R5 ✅** `share-card-v2.js` (global `ShareCard`, drop-in แทน `share-card.js` เฉพาะหน้า v2) — canvas 1080×1350 palette CAPY POP (cream/mango/ink) + เงาแข็ง popBlock + มาสคอต (ส่ง `data.mascot` ตามผล) + ฟอนต์ Anuphan
- **verify (local 3457, `/app-v2?demo=1`):** ✅ home (78% + m3) · fortune เงิน (m5) · pick (deck flip/dim + m4) · quiz→charm (m6) · share canvas เรนเดอร์ mango/tile ไม่ taint · ไม่มี console error · แก้ overlap มาสคอต-คะแนนใน result header
- **R6 ✅ Replace เต็ม (PO เลือก) 2026-06-29:** `app.html` + `share-card.js` + `auth.html` = **CAPY POP production** (ลบ `app-v2.html`/`share-card-v2.js` เหลือ canonical เดียว). re-skin `auth.html` ครบ 7 หน้าจอ (welcome m1 · guest · result m5 · consent · profile · success m10) reuse logic LIFF/Firebase/onboarding 100%. verify local ผ่านทุกหน้า ไม่มี console error.
  - **theme เดิม backup (rollback):** `app-legacy-cutemystic.html` (ชี้ `share-card-legacy.js`) · `auth-legacy-cutemystic.html` · `share-card-legacy.js` · `design-tokens.css` ยังอยู่
  - **⚠️ เหลือ deploy:** `cd mae-mor-bara && firebase deploy --only hosting --project capybarabu-mae-mhor`
- **assets อ้างอิง:** `design-tokens-v2.css` · `redesign-capypop.html` (concept) · `redesign-minimal.html` (ALMANAC reference)

---

## ✅ เสร็จแล้ว (Sprint 2 — Core loop)

- **`fortune-engine.js`** — global `Fortune` (DOM-free, deterministic). `beToISO()` แปลง `{d,m,beYear}` พ.ศ.→CE ISO · `daily(profile)` (energy/สี/เลข/เวลา/headline/bubble/fold) · `category(key,profile)` 5 หมวด (love+money featured) · `shareData()` · port compute ราศี/นักษัตร/เลขชะตา/สีมงคล จาก index.html. seed = FNV-1a(uid|birth + date[+cat]) → ผลเดิมทั้งวัน เปลี่ยนรายวัน
- **`share-card.js`** — global `ShareCard.render/share/download/toBlob` · canvas 1080×1350 palette ใหม่ (violet→pink, กรอบทอง, Noto Sans Thai) · `poc-share.html` restyle ใช้ engine นี้
- **`app.html` C1 Home** — Firebase + `onAuthStateChanged` → โหลด `users/{uid}` → personalize hero/chips/fold/greeting · ปุ่ม "แชร์การ์ดวันนี้" · birthdate sheet (เขียน `birthDate` กลับ Firestore เมื่อยังไม่มี)
- **`app.html` C3 Fortune** — category grid (สร้างจาก `Fortune.CATEGORIES`) → result card (text/advice/fold/chips) → ปุ่มแชร์ · action-card หน้าหลัก `openFortune('love'/'money')` กระโดดมารันเลย
- **verify (local 3457):** ✅ poc-share เรนเดอร์, ✅ home personalize (ราศีสิงห์/ปีฉลู/เลขชะตา5), ✅ fortune result + share canvas, ไม่มี console error

---

## ✅ เสร็จแล้ว (Sprint 0 + 1)

**Sprint 0 — Foundation**
- `design-tokens.css` — palette "Cute Mystic Premium" (gold/mint/pink/violet/LINE-green) จาก mockup 2 ไฟล์
- `app.html` — app shell + component library + bottom-nav 5 แท็บ (หน้าหลัก/ดูดวง/เครื่องราง/บันทึก/โปรไฟล์) + hash router

**Sprint 1 — Auth journey (e2e ใช้งานจริง)**
- `auth.html` — 7 หน้าจอ: welcome → guest setup → result → login sheet (LINE/Google/Apple) → PDPA consent → profile → success
- **Onboarding resume state machine**: `onboardingStep` ใน Firestore → เปิดแอปใหม่เด้งไปขั้นที่ค้างจนจบ
- `functions/auth.js`: `lineLogin` (LINE→custom token), `claimReward` (capyPoints server-side)
- Firestore rules: owner-only + anti-cheat (capyPoints/streak เขียนได้เฉพาะ admin)

## ⏭️ ถัดไป (Sprint 4-6) — ดู TASKS.md
- **Sprint 4 (Retention)**: C6 Journal/Streak (เขียน `users/{uid}/journal/`) · C7 LINE push (Function + scheduler)
- Sprint 5: Shop · Product Detail · Payment
- Sprint 6: Profile/Collection · KPI instrumentation

## 🔑 ข้อมูลสำคัญ (live)
| | ค่า |
|---|---|
| Firebase project | `capybarabu-mae-mhor` |
| Hosting | `https://capybarabu-mae-mhor.web.app` (`/auth.html`, `/app.html`; root `/` = แอปเดิม) |
| LINE channel ID | `2010529290` |
| LIFF ID | `2010529290-KVVcb2tN` (endpoint = `/auth.html`) |
| Function URLs | `linelogin-ssgkv4kwca-as.a.run.app`, `claimreward-…`, `askfortune-…` (ใช้ run.app ตรง!) |
| `users/{uid}` fields | displayName, photoURL, birthDate, intention, interests, tone, consent, notifPref, onboardingStep, capyPoints*, signupRewardGranted* (*=admin only) |

## ⚠️ Gotchas (สำคัญมาก)
1. **Shared project** — Firestore+Hosting ใช้ร่วมกับ autopost. rules canonical = `~/Documents/capybarabu-autopost/firestore.rules` (มี block users/ ของ mae-mor merge อยู่). **อย่า** deploy `mae-mor-bara/firestore.rules` ทับ. functions แยก codebase (`default` vs `autopost`).
2. **Function URL ใช้ `*.run.app` ตรง** ไม่ใช่ `cloudfunctions.net` (gen2 alias ทำ CORS preflight ใน browser พัง)
3. **rules v2 recursive wildcard `{sub=**}` match parent doc เอง** → อย่าใช้ครอบ user doc (ทำ anti-cheat พัง) ใช้ match subcollection เฉพาะเจาะจง
4. **HTML = no-cache** (ตั้งใน firebase.json) แต่ **preview browser cache เหนียวมาก** — เวลา verify ให้ curl production หรือโหลด `localhost:3457` (local server) แทน
5. **gcloud ยังไม่ได้ auth** บนเครื่องนี้ — งาน IAM ต้องผ่าน Console
6. Deploy: `firebase deploy --only functions:<name>,hosting --project capybarabu-mae-mhor` · rules deploy จาก autopost dir เท่านั้น

## ⚠️ Gotchas (Sprint 2 — ใหม่)
7. **birthDate = object `{d, m, beYear}` (พ.ศ.!)** ไม่ใช่ ISO string — ต้องผ่าน `Fortune.beToISO()` ก่อนคำนวณ (ลบ 543 → ค.ศ.)
8. **seed ใช้ unsigned shift `>>>`** เท่านั้น (signed `>>` ทำ uint32 > 2³¹ ติดลบ → `arr[negative]=undefined`)
9. **`npx serve` clean-url ตัด query string** เวลา redirect `/app.html?x` → `/app` — เวลาพรีวิวให้เปิด **`/app?demo=1`** (ไม่ใส่ `.html`) ไม่งั้น `?demo=1` หาย
10. **`?demo=1`** = โหมดรีวิวดีไซน์ (mock profile ตอง/เกิด 7 ส.ค. 2540, ไม่เขียน Firestore) · ปกติ `app.html` ถ้าไม่มี auth user จะ redirect ไป `auth.html`
11. **ฟอนต์ canvas** ต้องโหลด Google Fonts (`<link>` Inter+Noto Sans Thai) ในหน้าก่อน — `share-card.js` รอ `document.fonts.load()` เอง
12. rules whitelist `users/{uid}` มี `birthDate` อยู่แล้ว → anon/guest เขียนวันเกิดของตัวเองได้ (owner-only)
13. **JS ไม่มี no-cache header** (มีแค่ HTML) → ใช้ `?v=sN` ที่ script src กัน cache. **ตอนนี้ `?v=s3`** — เปลี่ยน `fortune-engine.js`/`share-card.js` ครั้งหน้าต้องบั๊มเป็น `?v=s4` ทั้ง `app.html`+`poc-share.html`
14. ตอน verify ด้วย preview: **เปลี่ยนแค่ hash เดิม (`#/x`→`#/x`) ไม่ fire `hashchange`** → view ไม่รีเฟรช (artifact การเทสต์ ไม่ใช่บั๊ก) · cb param (`&cb=Date.now()`) บังคับโหลด document ใหม่จริง

## Deploy commands
```
# functions (mae-mor codebase default)
cd mae-mor-bara && firebase deploy --only functions:lineLogin,hosting --project capybarabu-mae-mhor
# rules (จาก autopost — canonical ของ shared project)
cd ~/Documents/capybarabu-autopost && firebase deploy --only firestore:rules --project capybarabu-mae-mhor
```

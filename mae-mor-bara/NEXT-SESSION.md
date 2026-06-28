# แม่หมอบาร่า V2 — Handoff สำหรับ session ถัดไป
### อัปเดต 2026-06-28 · หลังจบ Sprint 0+1+2 + **3 (Viral)**

---

## 📋 Prompt สำหรับ paste ใน session ถัดไป

```
ทำงานต่อ Mae Mor Bara V2 (แม่หมอบาร่า) — branch feat/mae-mor-bara-source

อ่าน context จาก: mae-mor-bara/NEXT-SESSION.md, TASKS.md, SPEC.md, ROADMAP-v2.md
และ memory: mae-mor-bara-v2-roadmap.md

สถานะ: Sprint 0+1+2+3 เสร็จ (16/23) + ดีไซน์ใหม่ "CAPY POP" ออกแบบ+ล็อกแล้ว (Sprint R)
- production live (theme เดิม Cute Mystic): C1 Home · C3 Fortune · C4 Pick a Card · C5 Quiz
- engine reuse: window.Fortune + window.ShareCard · พรีวิว /app?demo=1 (ไม่เขียน Firestore)

ขอเริ่ม Sprint R — Redesign "CAPY POP" (ดู TASKS.md ส่วน Sprint R):
- ทิศทาง LOCK แล้ว: ส้มมะม่วง #ff6a2b + เสียงแม่หมอกวนเต็มแม็กซ์ + เล่นสนุก POP + มาสคอตเป็นพระเอก
- assets พร้อม: design-tokens-v2.css · redesign-capypop.html (concept จูนแล้ว) · mascots/m1-m10.png (โปร่งใส+ย่อ 600px)
- งาน: R1 optimize→webp · R2 แปลง app shell · R3 Home(hero m3) · R4 Fortune/Pick/Quiz+สลับท่ามาสคอต · R5 share-card
- pose map: m1 avatar · m3 hero · m4 ไพ่ · m5 เงิน · m6 quiz · m9 บันทึก · m10 โปรไฟล์
- ⚠️ track แยก · รอ product owner ก่อน replace production

(ทางเลือก feature track: Sprint 4 Retention = C6 Journal/Streak + C7 LINE push)
ยึด static no-build + Firebase (SPEC §1-4) · capybarabu-mae-mhor แชร์ Firestore+Hosting กับ autopost
```

---

## ✅ เสร็จแล้ว (Sprint 3 — Viral)

- **`fortune-engine.js` เพิ่ม**: `cards(profile,salt)` (สำรับ 12 ใบ, สุ่ม 3 ใบไม่ซ้ำ deterministic, salt=สับใหม่) · `pickResult(card,profile,salt)` (ผลบวกเสมอ power 72-99) · `recommendCharm({mood,intention},profile)` (6 charm ตาม intention, mood แต่งประโยค) · `shareData` รองรับ `result.kind` แล้ว
- **`app.html` C4 Pick a Card** (`#pick`) — 3 ไพ่คว่ำ (🔮) → แตะ → flip ทอง + dim ใบอื่น → result card (headline/meaning/advice/chips) + ปุ่มแชร์ + สับไพ่ใหม่
- **`app.html` C5 Charm Quiz** (`#quiz`) — 2 คำถาม (mood→intention) progress bar → recommend charm + badge + story + chips + share + "ดูเครื่องรางทั้งหมด" + ทำใหม่
- **router**: เพิ่ม `SUBVIEWS = {pick:'fortune', quiz:'charm'}` (sub-view ไฮไลต์ tab แม่) · action-card หน้าหลัก + charm tab มี entry
- **verify (local 3457):** ✅ deck/reveal/reshuffle ✅ quiz flow→charm (real clicks) ✅ share canvas เรนเดอร์ทั้ง pick/charm ✅ ไม่มี console error

---

## 🎨 พร้อมทำ (Sprint R — Redesign "CAPY POP") · ออกแบบ+ล็อกแล้ว 2026-06-28
- **ทำไม:** research Gen Z (Boundev: muted=น่าลืม · Duolingo: มาสคอตมีบุคลิก · สายมูไทย mu-nimalistic) → theme เดิม "Cute Mystic" (ม่วง gradient) เสี่ยงดู AI-slop
- **ล็อกกับ user:** ส้มมะม่วง `#ff6a2b` · เสียงแม่หมอกวนเต็มแม็กซ์ · เล่นสนุก POP (neo-brutalist toy) · มาสคอตเป็นพระเอก · Anuphan+IBM Plex Mono
- **assets:** `design-tokens-v2.css` · `redesign-capypop.html` (concept จูนแล้ว — ม่วง×ส้ม complementary, hero ใช้ท่า m3) · `redesign-minimal.html` (ALMANAC editorial = reference) · `mascots/m1–m10.png` (**ตัดพื้นหลังขาว→โปร่งใส flood-fill + ย่อ 600px แล้ว**, เดิม PNG ไม่มี alpha)
- **งานเหลือ:** R1 optimize→webp · R2 app shell · R3 Home · R4 Fortune/Pick/Quiz+สลับท่ามาสคอต · R5 share-card · R6 product-owner sign-off (ดู TASKS.md)
- **pose map:** m1 avatar · m3 hero(พลังวันนี้) · m4 เปิดไพ่ · m5 การเงิน · m6 quiz · m7 shop · m8 กันลบ · m9 บันทึก · m10 โปรไฟล์
- **TODO ก่อน production:** ย่อรูป→webp · รอ product owner (ยังไม่ replace theme เดิม)

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

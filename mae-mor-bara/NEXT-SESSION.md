# แม่หมอบาร่า V2 — Handoff สำหรับ session ถัดไป
### อัปเดต 2026-06-27 · หลังจบ Sprint 0 + Sprint 1

---

## 📋 Prompt สำหรับ paste ใน session ถัดไป

```
ทำงานต่อ Mae Mor Bara V2 (แม่หมอบาร่า) — branch feat/mae-mor-bara-source

อ่าน context จาก: mae-mor-bara/NEXT-SESSION.md, TASKS.md, SPEC.md, ROADMAP-v2.md
และ memory: mae-mor-bara-v2-roadmap.md

สถานะ: Sprint 0 (design system + app shell) + Sprint 1 (Auth journey e2e) เสร็จแล้ว
11/23 tasks done. LINE/Guest login ใช้งานจริงแล้วบน https://capybarabu-mae-mhor.web.app/auth.html

ขอเริ่ม Sprint 2 — Core loop:
- C1 Daily Luck Home (มีโครงใน app.html แล้ว) — ต่อ energy/chips/personalize จาก users/{uid}
- C3 Fortune Engine (template หลายหมวด เปิดด้วยรัก+เงิน, fold logic round 1: ราศี/นักษัตร/เลขชะตา/สีมงคล)
- C2 restyle poc-share.html → palette ใหม่ (design-tokens.css)

อิงดีไซน์ design-tokens.css ("Cute Mystic Premium") + mockup เดิม
ยึดสถาปัตยกรรม static no-build + Firebase (ตาม SPEC §1-4)
ระวัง: capybarabu-mae-mhor ใช้ Firestore+Hosting ร่วมกับ autopost (ดู SPEC §5 ข้อควรระวัง)
```

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

## ⏭️ ถัดไป (Sprint 2-6) — ดู TASKS.md
- **Sprint 2 (Core)**: C1 Daily Home · C3 Fortune Engine · C2 restyle share-card
- Sprint 3: Pick a Card · Charm Quiz
- Sprint 4: Journal/Streak · LINE push
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

## Deploy commands
```
# functions (mae-mor codebase default)
cd mae-mor-bara && firebase deploy --only functions:lineLogin,hosting --project capybarabu-mae-mhor
# rules (จาก autopost — canonical ของ shared project)
cd ~/Documents/capybarabu-autopost && firebase deploy --only firestore:rules --project capybarabu-mae-mhor
```

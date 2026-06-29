# C7 — LINE Push ดวงรายวัน · ขั้นตอน activate (console + deploy)

> โค้ดเสร็จแล้ว: `functions/notify.js` (`sendDailyFortune` scheduled 08:00 ICT + `sendDailyFortuneNow` manual) wired ใน `functions/index.js`
> เหลือ **งาน console + secret + deploy** (ทำแทนใน automation ไม่ได้) — ทำตามนี้

## ทำไมต้อง setup เพิ่ม
- **LINE Login channel** (`2010529290`) ใช้ "เข้าสู่ระบบ" ได้ แต่ **push ข้อความไม่ได้**
- ต้องมี **Messaging API channel** แยก (Official Account) ถึงจะ push ได้
- userId (`sub`) จะ **ตรงกัน** ก็ต่อเมื่อ Messaging channel อยู่ใน **provider เดียวกับ** Login channel
- ผู้ใช้ต้อง **เพิ่มเพื่อน OA** ก่อน ถึงจะรับ push (LINE policy) → ควรเพิ่มปุ่ม "เพิ่มเพื่อน LINE OA" ตอน opt-in (success screen)

## ขั้นตอน

### 1) สร้าง Messaging API channel (LINE Developers Console)
- เข้า provider เดียวกับ Login channel `2010529290` → Create new channel → **Messaging API**
- ตั้งชื่อ OA = "แม่หมอบาร่า" (หรือใช้ OA เดิมถ้ามี)
- เมนู **Messaging API** → ออก **Channel access token (long-lived)** → คัดลอกไว้
- ปิด auto-reply/greeting ตามต้องการ

### 2) ตั้ง secret (Firebase CLI)
```bash
cd mae-mor-bara
firebase functions:secrets:set LINE_MESSAGING_TOKEN   # วาง channel access token
firebase functions:secrets:set NOTIFY_ADMIN_KEY       # ตั้งรหัสลับสุ่ม ๆ (กันคนเรียก trigger มั่ว)
```

### 3) deploy เฉพาะ 2 ฟังก์ชันนี้ (อย่า bare deploy — กันทับ askFortune ฯลฯ)
```bash
firebase deploy --only functions:sendDailyFortune,functions:sendDailyFortuneNow --project capybarabu-mae-mhor
```
- `sendDailyFortune` จะสร้าง Cloud Scheduler job อัตโนมัติ (ทุกวัน 08:00 Asia/Bangkok)

### 4) ทดสอบส่งเอง (ไม่ต้องรอ 08:00)
```bash
curl -X POST https://senddailyfortunenow-ssgkv4kwca-as.a.run.app \
  -H "x-admin-key: <NOTIFY_ADMIN_KEY ที่ตั้งไว้>"
# ตอบ { ok:true, sent, failed, recipients }
```
> หมายเหตุ hash URL (`ssgkv4kwca`) อาจต่างกัน — ดู URL จริงจาก output ตอน deploy หรือ Console

## พฤติกรรม
- ส่งให้เฉพาะ `users/{uid}.notifPref.daily === true` **และ** มี `lineUserId` (ตั้งจาก A6 success screen + `lineLogin`)
- ใช้ **multicast** (ข้อความเดียวกันทุกคน batch 500/ครั้ง ประหยัด quota) — สุ่มข้อความกวน 1 ใน 5 แบบตามวันที่
- ลิงก์กลับแอป: `https://capybarabu-mae-mhor.web.app/app.html`
- log แต่ละรอบที่ Firestore `notifyRuns/` (KPI: LINE push reach · เป้า ≥70% ของ opt-in)

## TODO ฝั่งแอป (แนะนำทำคู่กัน เพื่อให้ push ถึงจริง)
- [ ] เพิ่มปุ่ม **"เพิ่มเพื่อน LINE OA"** ที่ success screen (`auth.html`) ตอนผู้ใช้กด "รับดวงรายวัน" → เปิด `https://line.me/R/ti/p/@<OA_ID>` (ไม่งั้น opt-in แต่ push ไม่ถึง)
- [ ] (option) ปรับข้อความ push เป็น **Flex message** + ปุ่ม CTA เพื่อเพิ่ม CTR
- [ ] (option) ทำให้ push **personalize** (พลัง%/สีมงคล) — ต้อง port `Fortune.daily` ไป Node (ตอนนี้ generic เพื่อความเรียบง่าย + multicast)

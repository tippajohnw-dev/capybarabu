# C7 — LINE Push ดวงรายวัน · สถานะ ✅ ACTIVATED (2026-06-29)

> โค้ด: `functions/notify.js` (`sendDailyFortune` scheduled 08:00 ICT + `sendDailyFortuneNow` manual) wired ใน `functions/index.js`
> **deployed แล้ว** ที่ capybarabu-mae-mhor · secrets ตั้งแล้ว · toggle opt-in + ปุ่มเพิ่มเพื่อนอยู่ในหน้า Profile (`app.html`)

## ค่าจริง (live)
| | ค่า |
|---|---|
| Messaging API channel | **`2010545788`** ("แม่หมอบาร่า") |
| OA Bot basic ID | **`@291wnbhf`** → friend link `https://line.me/R/ti/p/@291wnbhf` (⚠️ `@tiger_romeo` = LINE ID ส่วนตัวเจ้าของ ไม่ใช่ OA) |
| Provider (ต้องตรงกับ Login!) | **`2005291693`** "Capybarabu Mae Mhor" (มีทั้ง Login `2010529290` + Messaging `2010545788`) |
| Login channel | `2010529290` |
| secrets | `LINE_MESSAGING_TOKEN`, `NOTIFY_ADMIN_KEY` (ตั้งแล้ว) |
| test URL | `https://senddailyfortunenow-ssgkv4kwca-as.a.run.app` (POST + header `x-admin-key`) |

> ⚠️ **บทเรียน (gotcha สำคัญ):** LINE userId ผูกกับ **provider** ไม่ใช่ channel. ครั้งแรกสร้าง Messaging channel ผิดไปอยู่ provider "Capybarabu" (channel `2010545304` — เลิกใช้/ลบได้) ทำให้ userId ไม่ตรงกับที่ Login channel เก็บ → push ไม่ถึง. ต้องสร้าง Messaging channel ใน **provider เดียวกับ Login channel** (`2005291693`) เท่านั้น. flow ใหม่ของ LINE: สร้าง OA → OA Manager เปิด Messaging API → **เลือก provider ที่มี Login channel** (อย่ากด "สร้างโพรไวเดอร์ใหม่").

---
## (อ้างอิง) ขั้นตอนเดิม — งาน console + secret + deploy

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

## C7+ — Webhook เช็คสถานะเพื่อน (ซ่อนปุ่มเพิ่มเพื่อนเมื่อเป็นเพื่อนแล้ว)
โค้ดเสร็จ: `functions/webhook.js` (`lineWebhook`) + `app.html` อ่าน `users/{uid}.oaFriend` แล้ว · **เหลือ activate**:

1. **(แนะนำ) reissue channel secret ก่อน** — ตัวเดิม (`272f98…`) ถูกโชว์ในแชต = exposed
   - LINE Developers → channel `2010545788` → Basic settings → Channel secret → **Issue/Reissue**
   - (reissue ไม่กระทบ long-lived access token ที่ใช้ push)
2. ตั้ง secret + deploy:
   ```bash
   firebase functions:secrets:set LINE_MESSAGING_CHANNEL_SECRET --project capybarabu-mae-mhor   # วาง channel secret
   firebase deploy --only functions:lineWebhook --project capybarabu-mae-mhor
   ```
3. ตั้ง **Webhook URL** ใน LINE Developers → channel `2010545788` → แท็บ **Messaging API**:
   - Webhook URL = `https://linewebhook-ssgkv4kwca-as.a.run.app` (ดู URL จริงจาก output ตอน deploy)
   - กด **Verify** (ควรขึ้น Success) → เปิด **"Use webhook"**
4. OA Manager → ตั้งค่าการตอบกลับ → ปิด auto-reply (ใช้ webhook อย่างเดียว)

**พฤติกรรม:** `follow` → `oaFriend=true` · `unfollow` → `false` · จับเฉพาะคนที่กดเพิ่มเพื่อน**หลัง**เปิด webhook (เพื่อนเก่าไม่มี event ย้อนหลัง — แต่ push ยังถึงปกติ เพราะ `oaFriend` แค่คุมการโชว์ปุ่ม ไม่เกี่ยวกับการ push). อยากเทสกับบัญชีตัวเอง: บล็อก OA แล้ว unblock/เพิ่มเพื่อนใหม่ → จะยิง `follow`.

## TODO ฝั่งแอป (แนะนำทำคู่กัน เพื่อให้ push ถึงจริง)
- [ ] เพิ่มปุ่ม **"เพิ่มเพื่อน LINE OA"** ที่ success screen (`auth.html`) ตอนผู้ใช้กด "รับดวงรายวัน" → เปิด `https://line.me/R/ti/p/@<OA_ID>` (ไม่งั้น opt-in แต่ push ไม่ถึง)
- [ ] (option) ปรับข้อความ push เป็น **Flex message** + ปุ่ม CTA เพื่อเพิ่ม CTR
- [ ] (option) ทำให้ push **personalize** (พลัง%/สีมงคล) — ต้อง port `Fortune.daily` ไป Node (ตอนนี้ generic เพื่อความเรียบง่าย + multicast)

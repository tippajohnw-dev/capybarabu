# D3 — Charm Shop Payment (Omise PromptPay) · ✅ DEPLOYED (2026-06-29)

> **deployed แล้ว**: `createCharge` + `omiseWebhook` (secret OMISE_SECRET_KEY ตั้งแล้ว · CHARGE_URL set · rules แก้แล้ว)
> **ค่าจริง (live)**:
> - createCharge (browser): `https://createcharge-ssgkv4kwca-as.a.run.app` (run.app เลี่ยง CORS) — ตั้งใน `app.html` `CHARGE_URL`
> - omiseWebhook (Omise→server): `https://omisewebhook-ssgkv4kwca-as.a.run.app`
> - **เหลือ**: (1) ตั้ง webhook URL ใน Omise Dashboard → Webhooks (2) test ใน Test mode (3) สลับ live key ตอนเปิดจริง
> รายละเอียดขั้นตอนเดิมด้านล่าง ⬇️

## ทำไม Omise / PromptPay
- กก. กำหนด: provider โฮสต์เท่านั้น (Omise/PromptPay) · Function สร้าง charge · **ห้ามแตะบัตรที่ client**
- PromptPay = สร้าง charge ฝั่ง server → ได้ QR → user สแกนจ่าย → Omise ยิง webhook ยืนยัน (ไม่มีข้อมูลบัตรผ่านเครื่องเราเลย)

## ขั้นตอน
### 1) สมัคร Omise + เอา Secret key
- สมัคร https://dashboard.omise.co (ธุรกิจไทย, เปิด PromptPay)
- Dashboard → Keys → คัดลอก **Secret key** (`skey_test_...` ตอนเทส / `skey_...` ตอน live)

### 2) ตั้ง secret + deploy 2 ฟังก์ชัน
```bash
cd "/Users/wathanyootippajohn/Documents/Project Capybarabu/mae-mor-bara"
firebase functions:secrets:set OMISE_SECRET_KEY --project capybarabu-mae-mhor   # วาง secret key
firebase deploy --only functions:createCharge,functions:omiseWebhook --project capybarabu-mae-mhor
```
> ⚠️ ใส่ `--project capybarabu-mae-mhor` เสมอ · อย่า bare deploy

### 3) ตั้ง `CHARGE_URL` ใน `app.html`
- เอา URL ของ `createCharge` (จาก output ตอน deploy เช่น `https://createcharge-ssgkv4kwca-as.a.run.app`)
- แก้ใน `app.html`: `const CHARGE_URL = '<URL>';` → deploy hosting → ปุ่มจ่ายจะเรียก charge จริง (ขึ้น QR)

### 4) ตั้ง Webhook ใน Omise
- Omise Dashboard → Webhooks → เพิ่ม endpoint = URL ของ `omiseWebhook` (จาก output ตอน deploy)
- Omise จะยิง event `charge.complete` มา → ฟังก์ชัน re-fetch charge ยืนยัน → `orders/{id}.status='paid'` → แอป (poll) เด้งหน้าขอบคุณ

### 5) 🔒 แก้ firestore.rules (สำคัญ — กันโกง) — merge เข้า autopost แล้ว deploy จากที่นั่น
ปัจจุบัน `match /users/{uid}/orders/{id} { allow read, write: if isOwner(uid); }` → **client เขียน status='paid' เองได้ = ได้ของฟรี!**
เปลี่ยนเป็น:
```
match /users/{uid}/orders/{id} {
  allow read:   if isOwner(uid);
  allow create: if isOwner(uid) && request.resource.data.status == 'pending';  // fallback เท่านั้น
  allow update, delete: if false;   // status=paid เขียนโดย server (admin) เท่านั้น
}
```
> canonical rules อยู่ `~/Documents/capybarabu-autopost/firestore.rules` — แก้ที่นั่นแล้ว `firebase deploy --only firestore:rules` จาก autopost dir (ดู Gotcha #1)

## สถานะสินค้า (orders/)
`pending` (สร้าง charge แล้ว รอจ่าย) → `paid` (webhook ยืนยัน). แคตตาล็อก/ราคาฝั่ง server = `CATALOG` ใน `payment.js` (sync กับ `shop-catalog.js`).

## TODO ต่อยอด (หลังเปิดจ่ายได้)
- [ ] Delivery: หลัง `paid` → ส่ง digital charm จริง (push LINE / ปลดล็อกใน collection) — ตอนนี้แค่ mark paid
- [ ] E1 Collection: โชว์เครื่องรางที่ซื้อแล้วในหน้าโปรไฟล์
- [ ] เปลี่ยนจาก test key → live key ตอนเปิดขายจริง

# POC — LINE Login → Firebase Auth (Unblocker A)

พิสูจน์เส้นทางวิกฤตของ ROADMAP-v2: ทำให้ผู้ใช้ที่ล็อกอิน LINE กลายเป็น **Firebase user จริง**
(มี `uid` คงที่) เพื่อปลดล็อก journal / streak / collection / shop / premium

```
[LIFF] liff.getIDToken()  ──►  [Function lineLogin]  ──►  [LINE verify]  ──►  sub = LINE userId
                                       │
                          admin.auth().createCustomToken(`line:${sub}`)
                                       │
[client] signInWithCustomToken(token) ◄─┘   →  Firebase user (uid = line:Uxxxx)
```

**ไฟล์ในชุด POC:**
- `functions/auth.js` — Cloud Function `lineLogin` (verify + mint token + upsert `users/{uid}`)
- `functions/index.js` — เพิ่ม `exports.lineLogin`
- `poc-auth.html` — หน้าทดสอบ 4 สเต็ป (Firebase config เติมให้แล้ว)

---

## ทำไมต้อง mint custom token เอง
Firebase Auth **ไม่มี LINE เป็น provider ในตัว** (มีแต่ Google/Apple/Facebook…) — ทางมาตรฐานคือ
ยืนยัน LINE ID token ฝั่ง server แล้วออก **Firebase custom token** เอง นี่คือจุดที่ต้องพิสูจน์ว่าทำงานได้จริง

---

## Setup (ทำครั้งเดียว)

### 1) LINE Developers Console
1. ใช้/สร้าง **LINE Login channel** (provider ของแม่หมอบาร่า)
2. ในแท็บ **LIFF** → Add LIFF app
   - Endpoint URL: `https://capybarabu-mae-mhor.web.app/poc-auth.html` (หรือ URL ที่จะ host หน้าทดสอบ)
   - Size: `Full` · Scope: ติ๊ก **`openid`** + `profile` (ต้องมี `openid` ไม่งั้นไม่ได้ ID token)
3. จด **LIFF ID** (เช่น `2001234567-abcdEFGh`) และ **Channel ID** ของ LINE Login channel

### 2) Firebase Console — เปิด Authentication + providers
- Console → **Authentication → Get started**
- **Sign-in method** → เปิด provider ตามที่ทดสอบ:
  - **Anonymous** (Guest-first) → Enable
  - **Google** → Enable (เลือก support email)
  - LINE → ไม่มีในลิสต์ (ใช้ custom token แทน — ไม่ต้องเปิดอะไร)
- **Settings → Authorized domains** → ให้มี `capybarabu-mae-mhor.web.app` และ `localhost`

### 3) IAM — สิทธิ์เซ็น custom token  ⚠️ จุดพลาดบ่อยสุด
`createCustomToken` ต้องเซ็นด้วย service account → SA ของ Function ต้องมี role
**Service Account Token Creator** บนตัวเอง มิฉะนั้นจะ error `IAM signBlob`:

```bash
PROJECT=capybarabu-mae-mhor
PNUM=814731135939
# gen2 functions รันด้วย compute SA นี้ (ตรวจจริงใน Cloud Console → function → ▸ Details)
SA="${PNUM}-compute@developer.gserviceaccount.com"
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --member="serviceAccount:${SA}" \
  --role="roles/iam.serviceAccountTokenCreator" --project "$PROJECT"
```

### 4) ตั้งค่า Channel ID ให้ Function
สร้างไฟล์ `functions/.env` (อย่า commit — ใส่ใน .gitignore แล้ว):
```
LINE_LOGIN_CHANNEL_ID=2001234567
```

### 5) Deploy
```bash
cd mae-mor-bara
firebase deploy --only functions:lineLogin --project capybarabu-mae-mhor
```
จด **Function URL** ที่ CLI พิมพ์ออกมา (รูปแบบ `https://asia-southeast1-...cloudfunctions.net/lineLogin`
หรือ Cloud Run `https://linelogin-xxxx-as.a.run.app`)

### 6) เติมค่าใน `poc-auth.html`
แก้บล็อก `CONFIG` ด้านบนของไฟล์:
- `LIFF_ID` ← จากข้อ 1
- `FUNCTION_URL` ← จากข้อ 5 (ดีฟอลต์ cloudfunctions.net ใช้ได้เลยถ้าไม่ใช่ Cloud Run URL)

### 7) Deploy หน้าทดสอบ + รัน
```bash
firebase deploy --only hosting --project capybarabu-mae-mhor
```
เปิด `https://capybarabu-mae-mhor.web.app/poc-auth.html` **ในแอป LINE** (หรือ LIFF browser) → กด "เริ่มทดสอบ"

---

## ✅ เกณฑ์ผ่าน POC
- สเต็ป 1–4 ขึ้น ✓ ครบ
- บรรทัดสุดท้าย: `🎉 สำเร็จทั้งสาย! Firebase uid = line:Uxxxxxxxx`
- Firebase Console → Authentication → Users มี user `line:Uxxxx` โผล่
- Firestore → `users/line:Uxxxx` มี displayName/photoURL

## ❌ ถ้าพัง — ดูตรงไหน
| อาการ | สาเหตุน่าจะเป็น |
|---|---|
| สเต็ป 2 ไม่ได้ ID token | LIFF scope ไม่มี `openid` |
| สเต็ป 3 `Invalid LINE token` | `LINE_LOGIN_CHANNEL_ID` ผิด / ไม่ตรง channel ของ LIFF |
| สเต็ป 3 `audience mismatch` | LIFF สังกัดคนละ Login channel กับที่ตั้งไว้ |
| สเต็ป 4 / Function 500 `IAM signBlob` | ข้าม IAM ข้อ 3 — SA ไม่มีสิทธิ์เซ็น |
| `auth/configuration-not-found` | ยังไม่เปิด Authentication (ข้อ 2) |

---

## 3 providers ในหน้าเดียว (poc-auth.html)
หน้าทดสอบรองรับครบ 3 ทาง — ลงเอยที่ Firebase user เดียวกัน:
| ปุ่ม | วิธี | ต้องตั้งค่า |
|---|---|---|
| 🐾 Guest | `signInAnonymously` | เปิด Anonymous provider |
| 💚 LINE | custom token (ข้างบน) | LIFF + Function + IAM |
| 🔵 Google | `signInWithRedirect` (webview-safe) | เปิด Google provider |

- **Guest + Google ทดสอบได้เลย** โดยไม่ต้องมี LINE credential (ปุ่ม LINE จะปิดถ้ายังไม่กรอก `LIFF_ID`)
- **Account linking:** Guest→Google ใช้ `linkWithRedirect` (คง uid เดิม) · Guest→LINE custom-token ผูกผ่าน credential ไม่ได้ → uid เปลี่ยน → production ต้อง **merge ข้อมูล Guest ฝั่ง backend** ( migrate `users/{anonUid}` → `users/line:xxx`)

## หลัง POC ผ่าน → ต่อยอด
1. ย้าย `LINE_LOGIN_CHANNEL_ID` เป็น param ถาวร + เขียน Firestore **security rules** `users/{uid}` (เจ้าของเท่านั้น)
2. ทำ flow Guest→LINE merge ฝั่ง backend ใน `lineLogin` (รับ anonUid → ย้ายข้อมูล)
3. ถอด `poc-auth.html` ออกก่อน launch (เป็น artifact ทดสอบ)
4. เดินหน้า Unblocker B (share-card) + C (app shell) ตาม ROADMAP-v2 §6

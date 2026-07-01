# แม่หมอบาร่า — Milestone Plan (post-Phase-1)
### สร้าง 2026-07-01 · หลัง Phase 1 ครบ 24/24 + Phase 2 Sprint 7 (ดวงเชิงลึก) + share fix
> เอกสารคู่กัน: [ROADMAP-v2.md](ROADMAP-v2.md) (strategy/KPI) · [TASKS.md](TASKS.md) (feature backlog) · [NEXT-SESSION.md](NEXT-SESSION.md) (handoff)
> อ้างอิงงานวิจัยสถาปัตยกรรม/ต้นทุน (deep-research 2026-07-01): **"< 10k DAU อย่า over-optimize"** → ต้นทุน AI ยังไม่ใช่คอขวด, ผู้ใช้จริงต่างหากที่ยังขาด

---

## 🧭 หลักคิดของลำดับ milestone
```
M0 Go-Live ──▶ M1 วัด KPI ──▶ (gate) ──▶ M2 Phase 2 features (เลือกตาม KPI)
   (ปลดล็อก user)   (2-4 สัปดาห์)              └─▶ M3 Cost optimize (trigger เมื่อ scale)
```
- **ทุกอย่างบล็อกอยู่ที่ M0** — ไม่มีผู้ใช้จริง = วัด KPI ไม่ได้ = ตัดสินใจ Phase 2 ไม่ได้
- **M2 gated by KPI** — เลือก feature ตามตัวเลขที่ขาด (ไม่เดา)
- **M3 gated by scale** — ทำเมื่อ DAU/ค่าใช้จ่ายข้าม threshold เท่านั้น (งานวิจัยยืนยันว่าตอนนี้ยังไม่คุ้มทำ)

---

## M0 · Go-Live — ปลดล็อกผู้ใช้จริง 🔴 (blocker ของทุกอย่าง)
**เป้า:** ผู้ใช้ทั่วไป (ไม่ใช่แค่ tester) เข้าใช้ได้ครบ + จ่ายเงินจริง + แชร์การ์ด Flex ได้
**ส่วนใหญ่เป็นงาน "กดใน Console" ฝั่งเจ้าของ — โค้ดพร้อมหมดแล้ว**

| งาน | ใคร | สถานะ | ปลดล็อกอะไร |
|---|---|---|---|
| Publish LINE Login channel `2010529290` (Developing→Published) | เจ้าของ (Console) | ⬜ | login ทั่วไป + **แชร์การ์ด Flex ใน external browser** (ตอนนี้ได้เฉพาะ tester) |
| Omise go-live: `skey_test`→`skey_live` + ลงทะเบียน webhook live + เปิด PromptPay live | เจ้าของ (Omise+Console) | ⬜ | รับเงินจริง (ตอนนี้ Test mode) |
| ชี้ Hosting root `/` → `landing.html` (firebase.json) | โค้ด (ผมทำได้) | ⬜ | คนเข้า capybarabu-mae-mhor.web.app เจอ landing แทนแอปเดิม |
| แทนรีวิว placeholder ใน `landing.html` ด้วยรีวิวจริง | เจ้าของ (ให้ข้อความ) | ⬜ | social proof จริง |

**Done เมื่อ:** login publish แล้ว · จ่ายเงินจริงผ่าน · root=landing · รีวิวจริง
**หมายเหตุ:** ข้อ 3 ผมทำได้เลยเมื่อยืนยัน (แก้ 1 บรรทัดใน firebase.json + deploy) — อีก 3 ข้อรอเจ้าของกด Console

---

## M1 · KPI Baseline — วัดผล 2-4 สัปดาห์ 📊 (gate สำคัญ)
**เป้า:** มีตัวเลข KPI จริงจากผู้ใช้จริง เพื่อ "เลือก" Phase 2 ให้ถูก (ไม่เดา)
**เครื่องมือมีแล้ว:** `logEvent()` เขียน `users/{uid}/events` ครบทุก event (Sprint 6 E2)

| งาน | ใคร | effort |
|---|---|---|
| ปล่อยให้ผู้ใช้จริงเข้ามา (หลัง M0) + โปรโมตผ่าน LINE OA | เจ้าของ | — |
| ทำ query/สรุป KPI จาก `events` collection (D7, Share, CTA, Quiz, ATC, LINE login) | โค้ด (ผมทำได้) | 0.5-1 วัน |
| (option) หน้า admin/สรุปตัวเลข หรือ export ไป sheet | โค้ด | 1 วัน |

**เป้า KPI (จาก ROADMAP):** D7 ≥ 25% · Share ≥ 25% · CTA ≥ 15% · Quiz ≥ 60% · ATC ≥ 10% · LINE login ≥ 70%
**Gate → ตัดสินใจ M2:**
- ผ่านเป้าส่วนใหญ่ → เดินหน้า **monetize** (Premium/Collection)
- Share/CTA ต่ำ → ปรับ core loop/share ก่อน (ยังไม่ใส่ feature ใหม่)
- D7 ต่ำ → ทำ **LINE automation (re-engagement)** ก่อน

---

## M2 · Phase 2 Features — เลือกตาม KPI 🎯 (gated by M1)
**เป้า:** ต่อยอดตาม "ช่องว่างที่ตัวเลขบอก" — ทำทีละอันตาม KPI ที่ขาด
> เงื่อนไข กก. #5: core loop ต้องฟรี/คุ้มใจก่อน — Shop/Premium ห้ามเด่นจน pay-to-win

| feature | เลือกทำเมื่อ KPI บอกว่า... | effort | reuse |
|---|---|---|---|
| ✅ ~~ดวงเชิงลึก (เนื้อคู่+กราฟชีวิต)~~ | **เสร็จแล้ว** (Sprint 7) | — | — |
| **LINE automation ตามธาตุ/segment** | D7 ต่ำ (ต้อง re-engage) | 1-2 วัน | ขยาย notify.js |
| **Collection เต็ม 40 ชิ้น + level + progress** | retention ดีแต่อยากดันต่อ | 2-3 วัน | ขยาย E1 + shop-catalog |
| **Premium (Gold) tier** — subscription gating | retention ดี + อยากได้รายได้ประจำ | 3-5 วัน | ต้อง Omise recurring + `subscriptions/` + เช็คสิทธิ์ |
| **คอลแลบครีเอเตอร์/อาจารย์** | อยากเพิ่ม credibility/reach | ต่อรอง+เนื้อหา | — |

**Done เมื่อ:** ทำ feature ที่เลือก + deploy + วัดว่าตัวเลขที่ตั้งใจแก้ขึ้นจริง

---

## M3 · Cost Optimization — TRIGGERED by scale 💰 (อย่าทำก่อน trigger)
**เป้า:** ลดค่า AI/infra เมื่อ scale — **ไม่ใช่ตอนนี้**
**Trigger (ทำเมื่อข้อใดข้อหนึ่งจริง):** DAU > ~10,000 **หรือ** ค่า OpenAI/เดือน > ~5,000 บาท **หรือ** จำนวน AI call/วัน > ~10,000

| งาน | ผลที่คาด | effort | หมายเหตุ |
|---|---|---|---|
| 0. วัด token จริงจาก log OpenAI 1 สัปดาห์ | รู้ต้นทุนจริงต่อ call | 0.5 วัน | ทำก่อน optimize เสมอ |
| 1. **Batch API สำหรับ daily push** (notify.js — งานไม่ realtime) | −50% output ของก้อนใหญ่สุด | 1 วัน | คุ้มสุด ไม่กระทบ UX |
| 2. ทดสอบ+สลับ **GPT-4.1-nano** ($0.10/$0.40) แทน 4o-mini ($0.15/$0.60) | −33% ต่อ call | 1 วัน (ต้อง eval คุณภาพไทยก่อน) | โทนแม่หมอต้องไม่เพี้ยน |
| 3. Prompt caching (system prompt คงที่) | ช่วยที่ volume สูง | 0.5 วัน | ผลชัดเมื่อ >50k DAU |

**สิ่งที่ทำถูกอยู่แล้ว (คงไว้ ห้ามรื้อ):** compute เลข deterministic ฝั่ง client · cache AI ต่อ uid ต่อวัน · progressive render (deterministic ก่อน→AI ทับ) · fallback engine ถ้า AI ล่ม
**⚠️ ห้ามทำ M3 ก่อน trigger** — ที่ scale ปัจจุบัน (pre-launch) ค่า AI ~หลักร้อยบาท/เดือน การ optimize = เสียเวลา + เพิ่มความเสี่ยง โดยประหยัดได้ไม่กี่บาท (งานวิจัยยืนยัน)

---

## 📌 สรุป "ทำอะไรต่อตอนนี้"
1. **M0 ข้อ 3** (root→landing) — ผมทำได้เลยเมื่อคุณโอเค
2. **M0 ข้อ 1-2-4** — คุณกด Console (publish LINE + Omise live + รีวิว) → ผมช่วยเตรียม checklist ทีละสเต็ปได้
3. หลัง M0 → **M1** (ผมทำ query KPI ให้) → รอ 2-4 สัปดาห์ → ค่อยเลือก M2
4. **M3 = พักไว้** จนกว่าจะ scale (ตั้ง trigger ไว้เตือน)

> Cost optimization ที่วิจัยมา = "ของดีที่ยังไม่ถึงเวลา" — บันทึกไว้ใน M3 พร้อมทำทันทีเมื่อ DAU โต

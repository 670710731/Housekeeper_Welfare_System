# Welfare Care - ระบบจัดการสวัสดิการและสิทธิประโยชน์แม่บ้านหอพัก
> **Information Systems Project (IS Presentation Ready)**  
> พัฒนาด้วย React (Vite) + Tailwind CSS + Lucide React | พร้อม Deploy ขึ้น Vercel ทันที

---

## 1. จุดประสงค์ของระบบ (System Purpose)
ระบบ **"Welfare Care"** ออกแบบขึ้นเพื่อแก้ปัญหาการจัดการสวัสดิการและสิทธิประโยชน์ของพนักงานแม่บ้านในหอพัก ได้แก่:
1. **ลดความผิดพลาดในการติดตามสิทธิ:** มีตาราง In-Memory Relational Database ติดตามโควตาคงเหลือแบบ Real-time (วันลาป่วย, ลาพักร้อน, ยูนิฟอร์ม, อุปกรณ์เซฟตี้, เงินช่วยเหลือ)
2. **ความโปร่งใส:** แม่บ้านสามารถตรวจสอบสิทธิคงเหลือและประวัติการได้รับของย้อนหลังได้ตลอดเวลาผ่านโทรศัพท์มือถือ (Mobile-First)
3. **การทำงานที่รวดเร็วของหัวหน้างาน:** มี Dashboard รวมศูนย์เพื่อพิจารณาอนุมัติ/ไม่อนุมัติคำขอ พร้อมระบบตัดสิทธิคงเหลืออัตโนมัติ (Automated ACID-like Entitlement Deduction)

---

## 2. Design System: "Welfare Care"
ออกแบบตามหลักสรีรศาสตร์และจิตวิทยาผู้ใช้งาน (Human-Centered Design):
- **Concept:** เรียบง่าย • อ่านง่าย • เป็นมิตร • เน้นข้อมูลสิทธิ
- **ชุดสีหลัก (Primary):**
  - Primary-500: `#2563EB` (ปุ่มหลัก, สัญลักษณ์สำคัญ)
  - Primary-600: `#1D4ED8` (Hover state)
  - Primary-100: `#DBEAFE` (Badge พื้นหลัง, Selection highlight)
- **ชุดสีรอง (Secondary):**
  - Teal-500: `#0D9488`
  - Teal-100: `#CCFBF1`
- **ชุดสีสถานะ (Status Colors):**
  - Success: `#16A34A` (อนุมัติแล้ว, มีสิทธิคงเหลือ)
  - Warning: `#D97706` (รอดำเนินการ, โควตาใกล้หมด)
  - Error: `#DC2626` (ไม่อนุมัติ, ขอเกินสิทธิ)
  - Info: `#2563EB`
- **ชุดสีกลาง (Neutrals):**
  - Background: `#F8FAFC`, Surface: `#FFFFFF`, Border: `#E2E8F0`, Text: `#0F172A`, Text Muted: `#64748B`

---

## 3. สถาปัตยกรรมฐานข้อมูลจำลอง (Relational In-Memory Schema)
ไฟล์ `src/data/mockData.js` จำลองตารางเสมือนดึงมาจาก SQLite / PostgreSQL:

```
[users] (1) ----------------< (N) [employee_entitlements] >---------------- (1) [welfare_policies]
   |                                                                                |
   | (1)                                                                            | (1)
   |                                                                                |
   v (N)                                                                            v (N)
[welfare_requests] -----------------------------------------------------------------+
   |
   | (1)
   v (N)
[distribution_logs]
```

### คำอธิบายความสัมพันธ์และ Foreign Keys:
1. `users`: เก็บข้อมูลผู้ใช้ (ผู้จัดการ `MGR01`, แม่บ้าน `HK01`, `HK02`, `HK03`)
2. `welfare_policies`: นโยบายสวัสดิการ (ลาป่วย `WF01`, ลาพักร้อน `WF02`, ยูนิฟอร์ม `WF03`, อุปกรณ์ `WF04`, กองทุนรักษาพยาบาล `WF05`)
3. `employee_entitlements`: ตารางสิทธิคงเหลือ เชื่อมโยง `userId` และ `welfareId`
   - กฎทางธุรกิจ: `remaining = totalQuota - used`
4. `welfare_requests`: คำขอสวัสดิการ เชื่อมโยง `userId`, `welfareId`, `handledBy` สถานะ: `Pending` | `Approved` | `Rejected`
5. `distribution_logs`: บันทึกประวัติการแจกจ่ายหรือตัดสิทธิ เชื่อมโยง `userId`, `welfareId`, `handledBy`

---

## 4. แผนผัง Use Cases และตำแหน่งโค้ดสำหรับนำเสนออาจารย์
ทุกฟังก์ชันในโค้ดมีการกำกับคอมเมนต์ภาษาไทยและรหัส Use Case อย่างละเอียด:

| รหัส Use Case | ชื่อฟังก์ชัน / คุณสมบัติ | ไฟล์ที่ทำงานหลัก |
| :--- | :--- | :--- |
| **UC-01** | เข้าสู่ระบบ และ Quick Demo Auto-fill | `src/components/auth/LoginScreen.jsx` |
| **UC-02, 03** | แสดงภาพรวมสิทธิและโควตาคงเหลือของแม่บ้าน | `src/components/housekeeper/EntitlementsView.jsx` |
| **UC-04** | ยื่นคำขอสวัสดิการพร้อมระบบ Validation ไม่ให้ขอเกินสิทธิ | `src/components/housekeeper/RequestFormModal.jsx` |
| **UC-05, 06** | ติดตามสถานะคำขอ (Pending/Approved/Rejected) และประวัติ | `src/components/housekeeper/RequestHistoryView.jsx` |
| **UC-07** | หัวหน้างานอนุมัติคำขอ พร้อมตัดสิทธิคงเหลือใน Entitlements อัตโนมัติ | `src/components/manager/ApprovalView.jsx` |
| **UC-08** | หัวหน้างานไม่อนุมัติคำขอ พร้อมระบุเหตุผล (Reject Reason) | `src/components/manager/RejectModal.jsx` |
| **UC-09, 10** | จัดการและแก้ไขโควตาสิทธิประจำปีของแม่บ้านแต่ละคน | `src/components/manager/EntitlementsManageView.jsx` |
| **UC-11** | แดชบอร์ดสรุปสถิติภาพรวม คำขอรอพิจารณา และการใช้วันลา | `src/components/manager/ManagerOverview.jsx` |
| **UC-12** | บันทึกการแจกจ่ายสวัสดิการหน้างาน และตัดยอดทันที | `src/components/manager/DirectDistributionView.jsx` |

---

## 5. วิธีรันและทดสอบระบบในเครื่อง

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. รันโหมด Development สำหรับทดสอบ
npm run dev

# 3. รัน Build เพื่อทดสอบ Production Build
npm run build
```
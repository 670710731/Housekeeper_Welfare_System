/**
 * ==============================================================================
 * โครงสร้างข้อมูลจำลอง (In-Memory Mock Database Schema)
 * ==============================================================================
 * ออกแบบตามหลักการ Relational Database เพื่อจำลองตารางเสมือนดึงมาจาก SQLite / PostgreSQL
 * เหมาะสำหรับนำเสนออาจารย์ในวิชา Information Systems (IS / Database Design)
 * 
 * ความสัมพันธ์ของตาราง (Entity Relationships):
 * 1. users (1) ------------< (N) employee_entitlements (UserID เป็น Foreign Key)
 * 2. welfare_policies (1) --< (N) employee_entitlements (WelfareID เป็น Foreign Key)
 * 3. users (1) ------------< (N) welfare_requests (UserID เป็น Foreign Key)
 * 4. welfare_policies (1) --< (N) welfare_requests (WelfareID เป็น Foreign Key)
 * 5. users (1) ------------< (N) distribution_logs (UserID เป็น Foreign Key)
 * 6. welfare_policies (1) --< (N) distribution_logs (WelfareID เป็น Foreign Key)
 * ==============================================================================
 */

/**
 * [TABLE 1: users]
 * ตารางเก็บข้อมูลผู้ใช้งานระบบ ทั้งหัวหน้างาน (Manager) และแม่บ้านหอพัก (Housekeeper)
 * Primary Key: id
 */
export const initialUsers = [
  {
    id: 'MGR01',
    staffId: 'ADMIN01',
    name: 'หัวหน้าพรทิพย์ ใจดี',
    role: 'manager', // 'manager' | 'housekeeper'
    phone: '081-234-5678',
    department: 'ฝ่ายบริหารอาคารและบริการหอพัก',
    position: 'ผู้จัดการแผนกแม่บ้านและสุขอนามัย',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    demoPassword: 'password123'
  },
  {
    id: 'HK01',
    staffId: '1001',
    name: 'สมศรี มีสุข',
    role: 'housekeeper',
    phone: '089-111-2233',
    department: 'แผนกแม่บ้านหอพัก',
    position: 'พนักงานแม่บ้านประจำ อาคาร A (หญิง)',
    shift: 'กะเช้า (07:00 - 16:00 น.)',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    demoPassword: 'password123'
  },
  {
    id: 'HK02',
    staffId: '1002',
    name: 'สมพร ขยันยิ่ง',
    role: 'housekeeper',
    phone: '089-222-3344',
    department: 'แผนกแม่บ้านหอพัก',
    position: 'พนักงานแม่บ้านประจำ อาคาร B (ชาย)',
    shift: 'กะเช้า (07:00 - 16:00 น.)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    demoPassword: 'password123'
  },
  {
    id: 'HK03',
    staffId: '1003',
    name: 'บัวลอย สดใส',
    role: 'housekeeper',
    phone: '089-333-4455',
    department: 'แผนกแม่บ้านหอพัก',
    position: 'พนักงานแม่บ้านประจำ อาคาร C (ส่วนกลาง)',
    shift: 'กะบ่าย (12:00 - 21:00 น.)',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    demoPassword: 'password123'
  }
];

/**
 * [TABLE 2: welfare_policies]
 * ตารางนโยบายสวัสดิการและสิทธิประโยชน์ของหอพัก
 * Primary Key: id
 */
export const initialWelfarePolicies = [
  {
    id: 'WF01',
    name: 'ลาป่วย (Sick Leave)',
    category: 'leave', // 'leave' | 'item' | 'fund'
    unit: 'วัน',
    defaultQuota: 30,
    requiresAttachment: true, // ลาป่วยเกินเกณฑ์ต้องมีใบรับรองแพทย์
    description: 'มีสิทธิได้รับค่าจ้างตามกฎหมายแรงงาน สำหรับรักษาตัวเมื่อเจ็บป่วย',
    iconName: 'HeartPulse'
  },
  {
    id: 'WF02',
    name: 'ลาพักร้อนประจำปี (Annual Leave)',
    category: 'leave',
    unit: 'วัน',
    defaultQuota: 6,
    requiresAttachment: false,
    description: 'สิทธิพักผ่อนประจำปีสำหรับพนักงานหอพัก ยื่นล่วงหน้าอย่างน้อย 3 วัน',
    iconName: 'Calendar'
  },
  {
    id: 'WF03',
    name: 'ชุดยูนิฟอร์มแม่บ้าน (Uniform Set)',
    category: 'item',
    unit: 'ชุด',
    defaultQuota: 3,
    requiresAttachment: false,
    description: 'เบิกชุดปฏิบัติงานใหม่ประจำปี ประกอบด้วยเสื้อและกางเกงมาตรฐานหอพัก',
    iconName: 'Shirt'
  },
  {
    id: 'WF04',
    name: 'ชุดอุปกรณ์เซฟตี้และของใช้ส่วนตัว (Safety Kit)',
    category: 'item',
    unit: 'เซ็ต',
    defaultQuota: 4,
    requiresAttachment: false,
    description: 'ถุงมือยางหนา หน้ากากอนามัย รองเท้าบูทยางกันลื่น และแว่นตานิรภัย',
    iconName: 'Sparkles'
  },
  {
    id: 'WF05',
    name: 'เงินช่วยเหลือรักษาพยาบาลเบื้องต้น (Medical Fund)',
    category: 'fund',
    unit: 'บาท',
    defaultQuota: 2000,
    requiresAttachment: true,
    description: 'เบิกจ่ายตามจริงสำหรับค่ายาและตรวจสุขภาพเบื้องต้นที่คลินิกหรือ รพ.',
    iconName: 'CircleDollarSign'
  }
];

/**
 * [TABLE 3: employee_entitlements]
 * ตารางโควตาสิทธิคงเหลือรายคน
 * Primary Key: id
 * Foreign Keys:
 *  - userId -> users.id
 *  - welfareId -> welfare_policies.id
 * กฎทางธุรกิจ: remaining = totalQuota - used
 */
export const initialEntitlements = [
  // สิทธิของ สมศรี มีสุข (HK01)
  { id: 'ENT-01', userId: 'HK01', welfareId: 'WF01', totalQuota: 30, used: 2, remaining: 28, year: 2026 },
  { id: 'ENT-02', userId: 'HK01', welfareId: 'WF02', totalQuota: 6, used: 1, remaining: 5, year: 2026 },
  { id: 'ENT-03', userId: 'HK01', welfareId: 'WF03', totalQuota: 3, used: 2, remaining: 1, year: 2026 },
  { id: 'ENT-04', userId: 'HK01', welfareId: 'WF04', totalQuota: 4, used: 1, remaining: 3, year: 2026 },
  { id: 'ENT-05', userId: 'HK01', welfareId: 'WF05', totalQuota: 2000, used: 500, remaining: 1500, year: 2026 },

  // สิทธิของ สมพร ขยันยิ่ง (HK02)
  { id: 'ENT-06', userId: 'HK02', welfareId: 'WF01', totalQuota: 30, used: 0, remaining: 30, year: 2026 },
  { id: 'ENT-07', userId: 'HK02', welfareId: 'WF02', totalQuota: 6, used: 3, remaining: 3, year: 2026 },
  { id: 'ENT-08', userId: 'HK02', welfareId: 'WF03', totalQuota: 3, used: 1, remaining: 2, year: 2026 },
  { id: 'ENT-09', userId: 'HK02', welfareId: 'WF04', totalQuota: 4, used: 2, remaining: 2, year: 2026 },
  { id: 'ENT-10', userId: 'HK02', welfareId: 'WF05', totalQuota: 2000, used: 0, remaining: 2000, year: 2026 },

  // สิทธิของ บัวลอย สดใส (HK03)
  { id: 'ENT-11', userId: 'HK03', welfareId: 'WF01', totalQuota: 30, used: 5, remaining: 25, year: 2026 },
  { id: 'ENT-12', userId: 'HK03', welfareId: 'WF02', totalQuota: 6, used: 0, remaining: 6, year: 2026 },
  { id: 'ENT-13', userId: 'HK03', welfareId: 'WF03', totalQuota: 3, used: 3, remaining: 0, year: 2026 },
  { id: 'ENT-14', userId: 'HK03', welfareId: 'WF04', totalQuota: 4, used: 0, remaining: 4, year: 2026 },
  { id: 'ENT-15', userId: 'HK03', welfareId: 'WF05', totalQuota: 2000, used: 1200, remaining: 800, year: 2026 }
];

/**
 * [TABLE 4: welfare_requests]
 * ตารางคำขอรับสวัสดิการของแม่บ้าน
 * Primary Key: id
 * Foreign Keys:
 *  - userId -> users.id (ผู้ยื่นคำขอ)
 *  - welfareId -> welfare_policies.id (สวัสดิการที่ขอ)
 *  - handledBy -> users.id (ผู้ดำเนินการอนุมัติ/ไม่อนุมัติ)
 * สถานะ (status):
 *  - 'Pending'   : รอดำเนินการ
 *  - 'Approved'  : อนุมัติแล้ว
 *  - 'Rejected'  : ไม่อนุมัติ
 */
export const initialRequests = [
  {
    id: 'REQ-2026-001',
    userId: 'HK01',
    welfareId: 'WF01', // ลาป่วย
    amount: 2,
    reason: 'มีไข้สูง ปวดเมื่อยตัว พบแพทย์ที่คลินิกแถวมหาวิทยาลัย',
    attachmentName: 'medical_cert_somsri_feb.pdf',
    status: 'Approved',
    rejectReason: '',
    createdAt: '2026-02-10 08:30:00',
    handledBy: 'MGR01',
    handledAt: '2026-02-10 09:15:00'
  },
  {
    id: 'REQ-2026-002',
    userId: 'HK02',
    welfareId: 'WF02', // ลาพักร้อน
    amount: 3,
    reason: 'ขอกลับต่างจังหวัดไปช่วยงานบวชหลานชาย',
    attachmentName: '',
    status: 'Approved',
    rejectReason: '',
    createdAt: '2026-02-14 10:00:00',
    handledBy: 'MGR01',
    handledAt: '2026-02-14 11:30:00'
  },
  {
    id: 'REQ-2026-003',
    userId: 'HK01',
    welfareId: 'WF03', // ชุดยูนิฟอร์ม
    amount: 1,
    reason: 'ชุดเดิมซิปชำรุดและเปื้อนคราบน้ำยาซักผ้าขาว ซักไม่ออก',
    attachmentName: '',
    status: 'Pending', // รอดำเนินการ (สำหรับทดสอบ Demo อนุมัติ/ไม่อนุมัติ)
    rejectReason: '',
    createdAt: '2026-03-01 09:20:00',
    handledBy: null,
    handledAt: null
  },
  {
    id: 'REQ-2026-004',
    userId: 'HK03',
    welfareId: 'WF05', // เบิกค่ารักษาพยาบาล
    amount: 1200,
    reason: 'ตรวจพบความดันโลหิตสูงและรับยาต่อเนื่องจากโรงพยาบาลศูนย์',
    attachmentName: 'hospital_receipt_bualoy.jpg',
    status: 'Approved',
    rejectReason: '',
    createdAt: '2026-02-20 14:00:00',
    handledBy: 'MGR01',
    handledAt: '2026-02-21 09:00:00'
  },
  {
    id: 'REQ-2026-005',
    userId: 'HK02',
    welfareId: 'WF04', // อุปกรณ์เซฟตี้
    amount: 1,
    reason: 'ถุงมือยางฉีกขาดจากการทำความสะอาดร่องยาแนวห้องน้ำรวม',
    attachmentName: '',
    status: 'Pending', // รอดำเนินการอีก 1 รายการ
    createdAt: '2026-03-02 11:10:00',
    handledBy: null,
    handledAt: null
  },
  {
    id: 'REQ-2026-006',
    userId: 'HK03',
    welfareId: 'WF03', // ชุดยูนิฟอร์ม (โควตาหมดแล้ว เคยขอเกิน)
    amount: 1,
    reason: 'อยากได้ชุดสำรองเพิ่มอีกชุด',
    attachmentName: '',
    status: 'Rejected',
    rejectReason: 'คุณบัวลอยได้เบิกครบโควตา 3 ชุดของปี 2569 ไปเรียบร้อยแล้ว หากชำรุดฉุกเฉินให้นำชุดเก่ามาแลกเปลี่ยนที่ห้องผู้จัดการ',
    createdAt: '2026-02-25 13:45:00',
    handledBy: 'MGR01',
    handledAt: '2026-02-26 10:15:00'
  }
];

/**
 * [TABLE 5: distribution_logs]
 * ตารางบันทึกประวัติการแจกจ่ายสิ่งของหรือการตัดสิทธิสวัสดิการ
 * Primary Key: id
 * Foreign Keys:
 *  - userId -> users.id (แม่บ้านที่ได้รับ)
 *  - welfareId -> welfare_policies.id (สวัสดิการ)
 *  - handledBy -> users.id (ผู้แจก/ผู้บันทึก)
 */
export const initialDistributionLogs = [
  {
    id: 'LOG-001',
    userId: 'HK01',
    welfareId: 'WF03',
    amount: 2,
    handledBy: 'MGR01',
    note: 'แจกชุดยูนิฟอร์มประจำปีรอบแรก 2 ชุด ไซส์ L',
    date: '2026-01-10 10:00:00',
    source: 'Direct Distribution'
  },
  {
    id: 'LOG-002',
    userId: 'HK01',
    welfareId: 'WF04',
    amount: 1,
    handledBy: 'MGR01',
    note: 'แจกชุดเซฟตี้ต้นปี (ถุงมือ รองเท้าบูท แว่นตา)',
    date: '2026-01-12 11:30:00',
    source: 'Direct Distribution'
  },
  {
    id: 'LOG-003',
    userId: 'HK01',
    welfareId: 'WF01',
    amount: 2,
    handledBy: 'MGR01',
    note: 'ตัดสิทธิลาป่วยตามคำขอ REQ-2026-001 (มีใบรับรองแพทย์)',
    date: '2026-02-10 09:15:00',
    source: 'Request Approval'
  },
  {
    id: 'LOG-004',
    userId: 'HK02',
    welfareId: 'WF03',
    amount: 1,
    handledBy: 'MGR01',
    note: 'แจกชุดยูนิฟอร์มประจำปี 1 ชุด ไซส์ XL',
    date: '2026-01-15 14:00:00',
    source: 'Direct Distribution'
  },
  {
    id: 'LOG-005',
    userId: 'HK02',
    welfareId: 'WF02',
    amount: 3,
    handledBy: 'MGR01',
    note: 'ตัดสิทธิลาพักร้อนตามคำขอ REQ-2026-002',
    date: '2026-02-14 11:30:00',
    source: 'Request Approval'
  },
  {
    id: 'LOG-006',
    userId: 'HK03',
    welfareId: 'WF03',
    amount: 3,
    handledBy: 'MGR01',
    note: 'แจกชุดยูนิฟอร์มครบโควตาประจำปี 3 ชุด ไซส์ M',
    date: '2026-01-08 09:00:00',
    source: 'Direct Distribution'
  },
  {
    id: 'LOG-007',
    userId: 'HK03',
    welfareId: 'WF05',
    amount: 1200,
    handledBy: 'MGR01',
    note: 'เบิกจ่ายเงินค่ารักษาพยาบาลตามใบเสร็จ REQ-2026-004',
    date: '2026-02-21 09:00:00',
    source: 'Request Approval'
  }
];

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialUsers,
  initialWelfarePolicies,
  initialEntitlements,
  initialRequests,
  initialDistributionLogs
} from '../data/mockData';

// สร้าง Context สำหรับแชร์ State และฟังก์ชันทางธุรกิจให้ทุก Component
const WelfareContext = createContext();

/**
 * ==============================================================================
 * WelfareProvider: จัดการ State ส่วนกลางและ Business Logic ทั้งหมด
 * ==============================================================================
 * ออกแบบเพื่อการนำเสนอในวิชา Information Systems:
 * - ใช้ React Hooks มาตรฐาน (useState, useEffect)
 * - เลียนแบบพฤติกรรมของฐานข้อมูลแบบ Relational Database
 * - มี In-Memory State ที่อัปเดตแบบเรียลไทม์เมื่อมีการทำธุรกรรม (Transactions)
 * ==============================================================================
 */
export const WelfareProvider = ({ children }) => {
  // 1. [STATE] ผู้ใช้ปัจจุบันที่ล็อกอินอยู่ในระบบ (null ถ้ายังไม่ล็อกอิน)
  const [currentUser, setCurrentUser] = useState(null);

  // 2. [STATE] ตารางข้อมูลจำลอง (เสมือนดึงมาจากตารางใน Database)
  const [users, setUsers] = useState(initialUsers);
  const [welfarePolicies, setWelfarePolicies] = useState(initialWelfarePolicies);
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [requests, setRequests] = useState(initialRequests);
  const [distributionLogs, setDistributionLogs] = useState(initialDistributionLogs);

  // 3. [STATE] การแจ้งเตือนแบบ Toast Message เพื่อ UX ที่ดี
  const [toast, setToast] = useState(null);

  // ฟังก์ชันแสดง Toast แจ้งเตือน และซ่อนอัตโนมัติใน 3.5 วินาที
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  /**
   * ==============================================================================
   * [AUTH] ฟังก์ชันจัดการการเข้าสู่ระบบและออกจากระบบ
   * ==============================================================================
   */

  // [UC-01] เข้าสู่ระบบตาม User ID หรือ Staff ID
  const login = (identifier) => {
    if (!identifier) {
      showToast('กรุณากรอกรหัสพนักงานหรือรหัสผู้ใช้งาน', 'error');
      return false;
    }
    const cleanId = String(identifier).trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.id.toLowerCase() === cleanId ||
        (u.staffId && u.staffId.toLowerCase() === cleanId)
    );
    if (user) {
      setCurrentUser(user);
      showToast(`ยินดีต้อนรับคุณ ${user.name} เข้าสู่ระบบ`, 'info');
      return true;
    }
    showToast('ไม่พบข้อมูลรหัสพนักงานนี้ในระบบ กรุณาตรวจสอบอีกครั้ง', 'error');
    return false;
  };

  // ออกจากระบบ
  const logout = () => {
    setCurrentUser(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  /**
   * ==============================================================================
   * [UC-04] ฟังก์ชันส่งคำขอสวัสดิการ (ยื่นเรื่องโดยแม่บ้าน)
   * ==============================================================================
   * หลักการทำงาน:
   * 1. ตรวจสอบสิทธิคงเหลือ (Validation) ว่าเกินโควตาที่มีหรือไม่
   * 2. หากสิทธิคงเหลือเพียงพอ สร้างข้อมูลคำขอใหม่ (สถานะ 'Pending')
   * 3. บันทึกลง State คำขอ `requests`
   */
  const submitWelfareRequest = ({ welfareId, amount, reason, attachmentName }) => {
    if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' };

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('กรุณาระบุจำนวนที่ถูกต้องมากกว่า 0', 'error');
      return { success: false, message: 'จำนวนไม่ถูกต้อง' };
    }

    // ค้นหาสิทธิคงเหลือของแม่บ้านคนนี้ในสวัสดิการที่เลือก
    const currentEntitlement = entitlements.find(
      (e) => e.userId === currentUser.id && e.welfareId === welfareId
    );

    const policy = welfarePolicies.find((p) => p.id === welfareId);
    const policyName = policy ? policy.name : 'สวัสดิการ';
    const unit = policy ? policy.unit : '';

    if (!currentEntitlement) {
      showToast('ไม่พบข้อมูลสิทธิของท่านสำหรับสวัสดิการนี้', 'error');
      return { success: false, message: 'ไม่พบสิทธิ' };
    }

    // ตรวจสอบเงื่อนไข: สิทธิคงเหลือต้องมากกว่าหรือเท่ากับจำนวนที่ขอ
    if (parsedAmount > currentEntitlement.remaining) {
      showToast(
        `ไม่สามารถยื่นคำขอได้: สิทธิคงเหลือ ${currentEntitlement.remaining} ${unit} (ขอเบิก ${parsedAmount} ${unit})`,
        'error'
      );
      return { success: false, message: 'สิทธิคงเหลือไม่เพียงพอ' };
    }

    // สร้างคำขอใหม่ (New Request Entity)
    const newRequest = {
      id: `REQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(3, '0')}`,
      userId: currentUser.id,
      welfareId: welfareId,
      amount: parsedAmount,
      reason: reason.trim(),
      attachmentName: attachmentName || '',
      status: 'Pending', // เริ่มต้นที่สถานะ 'รอดำเนินการ'
      rejectReason: '',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      handledBy: null,
      handledAt: null
    };

    setRequests([newRequest, ...requests]);
    showToast(`ส่งคำขอ "${policyName}" จำนวน ${parsedAmount} ${unit} เรียบร้อยแล้ว`, 'success');
    return { success: true, message: 'ส่งคำขอสำเร็จ' };
  };

  /**
   * ==============================================================================
   * [UC-07] ฟังก์ชันอนุมัติคำขอสวัสดิการ (ดำเนินการโดยหัวหน้างาน)
   * ==============================================================================
   * หลักการทำงาน (Transaction แบบครบวงจร):
   * 1. เปลี่ยนสถานะคำขอใน `requests` เป็น 'Approved'
   * 2. ตัดสิทธิคงเหลือใน `employee_entitlements` (used เพิ่มขึ้น, remaining ลดลง)
   * 3. บันทึกประวัติการตัดสิทธิลงใน `distribution_logs`
   */
  const approveRequest = (requestId) => {
    const targetRequest = requests.find((r) => r.id === requestId);
    if (!targetRequest) return;

    if (targetRequest.status !== 'Pending') {
      showToast('คำขอนี้ได้รับการดำเนินการไปแล้ว', 'warning');
      return;
    }

    const policy = welfarePolicies.find((p) => p.id === targetRequest.welfareId);
    const applicant = users.find((u) => u.id === targetRequest.userId);

    // 1. ตรวจสอบสิทธิคงเหลืออีกครั้งเพื่อป้องกัน Race Condition
    const targetEntitlement = entitlements.find(
      (e) => e.userId === targetRequest.userId && e.welfareId === targetRequest.welfareId
    );

    if (targetEntitlement && targetRequest.amount > targetEntitlement.remaining) {
      showToast(`ไม่สามารถอนุมัติได้: สิทธิคงเหลือไม่เพียงพอแล้ว`, 'error');
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 2. อัปเดตสถานะคำขอเป็น 'Approved'
    setRequests((prevRequests) =>
      prevRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Approved',
              handledBy: currentUser ? currentUser.id : 'MGR01',
              handledAt: now
            }
          : r
      )
    );

    // 3. ตัดสิทธิใน employee_entitlements
    setEntitlements((prevEntitlements) =>
      prevEntitlements.map((e) => {
        if (e.userId === targetRequest.userId && e.welfareId === targetRequest.welfareId) {
          const newUsed = e.used + targetRequest.amount;
          const newRemaining = Math.max(0, e.totalQuota - newUsed);
          return {
            ...e,
            used: newUsed,
            remaining: newRemaining
          };
        }
        return e;
      })
    );

    // 4. บันทึกลงตาราง distribution_logs
    const newLog = {
      id: `LOG-${String(distributionLogs.length + 1).padStart(3, '0')}`,
      userId: targetRequest.userId,
      welfareId: targetRequest.welfareId,
      amount: targetRequest.amount,
      handledBy: currentUser ? currentUser.id : 'MGR01',
      note: `อนุมัติคำขอ ${targetRequest.id} (${targetRequest.reason})`,
      date: now,
      source: 'Request Approval'
    };
    setDistributionLogs([newLog, ...distributionLogs]);

    showToast(
      `อนุมัติคำขอของ ${applicant ? applicant.name : 'แม่บ้าน'} สำเร็จ ระบบได้ตัดสิทธิเรียบร้อยแล้ว`,
      'success'
    );
  };

  /**
   * ==============================================================================
   * [UC-08] ฟังก์ชันปฏิเสธ/ไม่อนุมัติคำขอ (ดำเนินการโดยหัวหน้างาน)
   * ==============================================================================
   * หลักการทำงาน:
   * 1. เปลี่ยนสถานะคำขอเป็น 'Rejected'
   * 2. บันทึกเหตุผลการปฏิเสธ (Reject Reason) เพื่อให้แม่บ้านอ่านทราบ
   * 3. ไม่มีการตัดสิทธิใน employee_entitlements
   */
  const rejectRequest = (requestId, rejectReason) => {
    if (!rejectReason || rejectReason.trim() === '') {
      showToast('กรุณาระบุเหตุผลการไม่อนุมัติ', 'warning');
      return false;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setRequests((prevRequests) =>
      prevRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Rejected',
              rejectReason: rejectReason.trim(),
              handledBy: currentUser ? currentUser.id : 'MGR01',
              handledAt: now
            }
          : r
      )
    );

    showToast('ปฏิเสธคำขอและบันทึกเหตุผลเรียบร้อยแล้ว', 'info');
    return true;
  };

  /**
   * ==============================================================================
   * [UC-12] บันทึกการแจกจ่ายสวัสดิการหน้างานโดยตรง (Direct On-Site Distribution)
   * ==============================================================================
   * หลักการทำงาน:
   * สำหรับกรณีแจกของที่ห้องพักหรือเคาน์เตอร์โดยตรง (ไม่ต้องผ่านการยื่นคำขอ)
   * 1. ตัดสิทธิคงเหลือของแม่บ้านคนนั้นทันที
   * 2. บันทึกข้อมูลลงใน distribution_logs
   */
  const recordDirectDistribution = ({ userId, welfareId, amount, note }) => {
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('กรุณาระบุจำนวนที่ถูกต้อง', 'error');
      return false;
    }

    const targetEntitlement = entitlements.find(
      (e) => e.userId === userId && e.welfareId === welfareId
    );
    const policy = welfarePolicies.find((p) => p.id === welfareId);
    const targetUser = users.find((u) => u.id === userId);

    if (!targetEntitlement) {
      showToast('ไม่พบข้อมูลสิทธิของพนักงานคนนี้', 'error');
      return false;
    }

    // ตรวจสอบว่าแจกเกินสิทธิคงเหลือหรือไม่
    if (parsedAmount > targetEntitlement.remaining) {
      showToast(
        `ไม่สามารถจ่ายเกินสิทธิได้: คงเหลือ ${targetEntitlement.remaining} ${policy ? policy.unit : ''}`,
        'error'
      );
      return false;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. ตัดสิทธิคงเหลือ
    setEntitlements((prevEntitlements) =>
      prevEntitlements.map((e) => {
        if (e.userId === userId && e.welfareId === welfareId) {
          const newUsed = e.used + parsedAmount;
          return {
            ...e,
            used: newUsed,
            remaining: Math.max(0, e.totalQuota - newUsed)
          };
        }
        return e;
      })
    );

    // 2. บันทึกลง Log
    const newLog = {
      id: `LOG-${String(distributionLogs.length + 1).padStart(3, '0')}`,
      userId: userId,
      welfareId: welfareId,
      amount: parsedAmount,
      handledBy: currentUser ? currentUser.id : 'MGR01',
      note: note || `แจกจ่ายโดยตรง ณ เคาน์เตอร์ผู้จัดการ`,
      date: now,
      source: 'Direct Distribution'
    };
    setDistributionLogs([newLog, ...distributionLogs]);

    showToast(
      `บันทึกการแจกจ่าย ${policy ? policy.name : ''} ให้ ${targetUser ? targetUser.name : ''} สำเร็จ`,
      'success'
    );
    return true;
  };

  /**
   * ==============================================================================
   * [UC-09, UC-10] ปรับปรุงโควตาสิทธิประจำปีของแม่บ้าน (Manage Entitlements)
   * ==============================================================================
   */
  const updateEntitlementQuota = (entitlementId, newTotalQuota) => {
    const parsedQuota = Number(newTotalQuota);
    if (isNaN(parsedQuota) || parsedQuota < 0) {
      showToast('กรุณาระบุโควตาเป็นตัวเลขที่ถูกต้อง', 'error');
      return false;
    }

    setEntitlements((prevEntitlements) =>
      prevEntitlements.map((e) => {
        if (e.id === entitlementId) {
          const newRemaining = Math.max(0, parsedQuota - e.used);
          return {
            ...e,
            totalQuota: parsedQuota,
            remaining: newRemaining
          };
        }
        return e;
      })
    );

    showToast('อัปเดตโควตาสิทธิประจำปีเรียบร้อยแล้ว', 'success');
    return true;
  };

  /**
   * ==============================================================================
   * [HELPER / SELECTOR FUNCTIONS] ดึงข้อมูลที่ Join ความสัมพันธ์แล้ว
   * ==============================================================================
   */

  // ดึงสิทธิทั้งหมดของพนักงานคนหนึ่ง พร้อมรายละเอียดสวัสดิการ
  const getUserEntitlements = (userId) => {
    return entitlements
      .filter((e) => e.userId === userId)
      .map((ent) => {
        const policy = welfarePolicies.find((p) => p.id === ent.welfareId) || {};
        return {
          ...ent,
          policyName: policy.name || 'ไม่ระบุ',
          category: policy.category || 'other',
          unit: policy.unit || '',
          description: policy.description || '',
          requiresAttachment: policy.requiresAttachment || false,
          iconName: policy.iconName || 'HelpCircle'
        };
      });
  };

  // ดึงคำขอทั้งหมดของพนักงานคนหนึ่ง
  const getUserRequests = (userId) => {
    return requests
      .filter((r) => r.userId === userId)
      .map((req) => {
        const policy = welfarePolicies.find((p) => p.id === req.welfareId) || {};
        return {
          ...req,
          policyName: policy.name || 'สวัสดิการ',
          unit: policy.unit || ''
        };
      });
  };

  // ดึงประวัติการแจกจ่ายของพนักงานคนหนึ่ง
  const getUserLogs = (userId) => {
    return distributionLogs
      .filter((l) => l.userId === userId)
      .map((log) => {
        const policy = welfarePolicies.find((p) => p.id === log.welfareId) || {};
        const handler = users.find((u) => u.id === log.handledBy) || {};
        return {
          ...log,
          policyName: policy.name || 'สวัสดิการ',
          unit: policy.unit || '',
          handlerName: handler.name || 'เจ้าหน้าที่'
        };
      });
  };

  // ดึงคำขอทั้งหมดสำหรับหัวหน้างาน พร้อม Join ชื่อแม่บ้านและสวัสดิการ
  const getAllRequestsEnriched = () => {
    return requests.map((req) => {
      const applicant = users.find((u) => u.id === req.userId) || {};
      const policy = welfarePolicies.find((p) => p.id === req.welfareId) || {};
      const handler = users.find((u) => u.id === req.handledBy) || {};
      return {
        ...req,
        applicantName: applicant.name || 'ไม่ระบุชื่อ',
        applicantStaffId: applicant.staffId || '-',
        applicantShift: applicant.shift || '-',
        applicantAvatar: applicant.avatar || '',
        policyName: policy.name || 'สวัสดิการ',
        policyCategory: policy.category || 'other',
        unit: policy.unit || '',
        handlerName: handler.name || '-'
      };
    });
  };

  // สรุปสถิติสำหรับ Dashboard หัวหน้างาน (UC-11)
  const getSystemStats = () => {
    const pendingCount = requests.filter((r) => r.status === 'Pending').length;
    const approvedCount = requests.filter((r) => r.status === 'Approved').length;
    const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;
    const housekeepersCount = users.filter((u) => u.role === 'housekeeper').length;
    const totalDistributions = distributionLogs.length;

    // คำนวณวันลาป่วยและลาพักร้อนรวมที่ถูกใช้ไปแล้วของทุกคน
    const totalSickLeaveUsed = entitlements
      .filter((e) => e.welfareId === 'WF01')
      .reduce((sum, item) => sum + item.used, 0);

    const totalAnnualLeaveUsed = entitlements
      .filter((e) => e.welfareId === 'WF02')
      .reduce((sum, item) => sum + item.used, 0);

    const totalUniformUsed = entitlements
      .filter((e) => e.welfareId === 'WF03')
      .reduce((sum, item) => sum + item.used, 0);

    return {
      pendingCount,
      approvedCount,
      rejectedCount,
      housekeepersCount,
      totalDistributions,
      totalSickLeaveUsed,
      totalAnnualLeaveUsed,
      totalUniformUsed
    };
  };

  // รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นสำหรับการนำเสนอซ้ำ
  const resetToInitialData = () => {
    setUsers(initialUsers);
    setWelfarePolicies(initialWelfarePolicies);
    setEntitlements(initialEntitlements);
    setRequests(initialRequests);
    setDistributionLogs(initialDistributionLogs);
    showToast('รีเซ็ตข้อมูลสู่ค่าเริ่มต้นสำหรับการเดโมเรียบร้อย', 'info');
  };

  const value = {
    currentUser,
    users,
    welfarePolicies,
    entitlements,
    requests,
    distributionLogs,
    toast,
    showToast,
    login,
    logout,
    submitWelfareRequest,
    approveRequest,
    rejectRequest,
    recordDirectDistribution,
    updateEntitlementQuota,
    getUserEntitlements,
    getUserRequests,
    getUserLogs,
    getAllRequestsEnriched,
    getSystemStats,
    resetToInitialData
  };

  return <WelfareContext.Provider value={value}>{children}</WelfareContext.Provider>;
};

// Custom Hook ให้ Component เรียกใช้ง่ายๆ
export const useWelfare = () => {
  const context = useContext(WelfareContext);
  if (!context) {
    throw new Error('useWelfare must be used within a WelfareProvider');
  }
  return context;
};

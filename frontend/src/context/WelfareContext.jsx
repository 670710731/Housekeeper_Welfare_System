import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

const WelfareContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = async (path, options = {}) => {
  const token = localStorage.getItem('welfare_token');
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'ไม่สามารถเชื่อมต่อระบบได้');
  return data;
};

const toStatus = (status = '') => status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

const mapEmployee = (employee) => ({
  id: String(employee.employee_id),
  staffId: String(employee.employee_id),
  name: employee.employee_name,
  role: employee.role?.toLowerCase() === 'hr' ? 'manager' : 'housekeeper',
  phone: employee.phone,
  department: 'แผนกแม่บ้านหอพัก',
  position: employee.position || 'พนักงาน',
  shift: '-',
  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
});

const policyPresentation = (welfareType) => {
  const name = welfareType.welfare_name || 'สวัสดิการ';
  const lowerName = name.toLowerCase();
  const isLeave = name.includes('ลา');
  const isFund = /เงิน|ประกัน|รักษาพยาบาล|กองทุน/.test(name);
  return {
    id: String(welfareType.welfare_type_id),
    name,
    category: isLeave ? 'leave' : isFund ? 'fund' : 'item',
    unit: isLeave ? 'วัน' : isFund ? 'บาท' : /เสื้อ|ชุด/.test(name) ? 'ชุด' : 'รายการ',
    defaultQuota: 0,
    requiresAttachment: [1, 3].includes(Number(welfareType.welfare_type_id)),
    description: welfareType.welfare_description || '',
    iconName: /ป่วย|สุขภาพ/.test(name) ? 'HeartPulse' : /ลา/.test(name) ? 'Calendar' : /เสื้อ|ชุด/.test(name) ? 'Shirt' : isFund ? 'CircleDollarSign' : 'Sparkles'
  };
};

const mapEntitlement = (remain) => ({
  id: String(remain.benefit_id || remain.benefit?.benefit_id || remain.remain_id),
  userId: String(remain.benefit?.employee_id || ''),
  welfareId: String(remain.benefit?.welfare_type_id || ''),
  policyId: String(remain.benefit?.policy_id || ''),
  totalQuota: Number(remain.total_benefit || 0),
  used: Number(remain.total_used || 0),
  remaining: Number(remain.remaining_amount || 0),
  year: Number(remain.year || new Date().getFullYear())
});

const mapHistory = (entry, users, welfarePolicies) => {
  const quantity = Number(entry.description?.match(/จำนวน\s*(\d+)/)?.[1] || 0);
  return {
    id: String(entry.welfare_history_id),
    userId: String(entry.employee_id),
    welfareId: String(entry.welfare_type_id),
    amount: quantity,
    handledBy: '',
    note: entry.description || '',
    date: entry.action_date,
    source: entry.action_type,
    policyName: welfarePolicies.find((policy) => policy.id === String(entry.welfare_type_id))?.name || 'สวัสดิการ',
    unit: welfarePolicies.find((policy) => policy.id === String(entry.welfare_type_id))?.unit || '',
    userName: users.find((user) => user.id === String(entry.employee_id))?.name || 'ไม่ระบุชื่อ'
  };
};

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
  const [users, setUsers] = useState([]);
  const [welfarePolicies, setWelfarePolicies] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [requests, setRequests] = useState([]);
  const [distributionLogs, setDistributionLogs] = useState([]);

  // 3. [STATE] การแจ้งเตือนแบบ Toast Message เพื่อ UX ที่ดี
  const [toast, setToast] = useState(null);

  // ฟังก์ชันแสดง Toast แจ้งเตือน และซ่อนอัตโนมัติใน 3.5 วินาที
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async (user) => {
    const [types, rawPolicies] = await Promise.all([
      apiRequest('/api/welfare-types'),
      apiRequest('/api/policies')
    ]);
    const policyRows = Array.isArray(rawPolicies) ? rawPolicies : [];
    const typesWithPolicies = (Array.isArray(types) ? types : []).map((type) => {
      const policy = policyRows.find((row) => row.welfare_type_id === type.welfare_type_id);
      const mapped = policyPresentation(type);
      if (policy) {
        mapped.defaultQuota = Number(policy.benefit_quantity || 0);
        mapped.description = [mapped.description, policy.condition].filter(Boolean).join(' ');
      }
      return mapped;
    });
    const activeUser = user;
    let nextUsers = [activeUser];
    let rawBenefits;
    let rawRequests;
    let rawHistory;

    if (activeUser.role === 'manager') {
      const [employees, hrRequests, benefits, history] = await Promise.all([
        apiRequest('/api/hr/employees'),
        apiRequest('/api/hr/requests'),
        apiRequest('/api/hr/benefits'),
        apiRequest('/api/hr/history')
      ]);
      nextUsers = (employees || []).map(mapEmployee);
      rawRequests = hrRequests || [];
      rawBenefits = benefits || [];
      rawHistory = history || [];
    } else {
      const [benefits, employeeRequests, history] = await Promise.all([
        apiRequest('/api/my-benefits'),
        apiRequest('/api/my-requests'),
        apiRequest('/api/my-history')
      ]);
      rawBenefits = benefits || [];
      rawRequests = employeeRequests || [];
      rawHistory = history || [];
    }

    const mappedRequests = rawRequests.map((request) => {
      const mappedType = String(request.welfare_type_id);
      const rejectedApproval = (request.approvals || []).find((approval) => approval.approval_status === 'rejected');
      return {
        id: String(request.welfare_request_id),
        userId: String(request.employee_id),
        welfareId: mappedType,
        amount: Number(request.quantity || 0),
        reason: request.reason || '',
        attachmentName: request.attachments?.[0]?.file_name || '',
        status: toStatus(request.status),
        rejectReason: rejectedApproval?.notes || '',
        createdAt: request.request_date ? request.request_date.replace('T', ' ').slice(0, 19) : '',
        handledBy: '',
        handledAt: ''
      };
    });

    const mappedEntitlements = rawBenefits.map(mapEntitlement);
    const mappedHistory = rawHistory.map((entry) => mapHistory(entry, nextUsers, typesWithPolicies));
    setUsers(nextUsers);
    setWelfarePolicies(typesWithPolicies);
    setEntitlements(mappedEntitlements);
    setRequests(mappedRequests);
    setDistributionLogs(mappedHistory.filter((entry) => ['approved', 'direct_distribution', 'assign_benefit'].includes(entry.source)));
  };

  useEffect(() => {
    const token = sessionStorage.getItem('welfare_token');
    const savedUser = sessionStorage.getItem('welfare_user');
    if (!token || !savedUser) return;
    try {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      loadData(user).catch((error) => showToast(error.message, 'error'));
    } catch {
      sessionStorage.removeItem('welfare_token');
      sessionStorage.removeItem('welfare_user');
    }
  }, []);

  /**
   * ==============================================================================
   * [AUTH] ฟังก์ชันจัดการการเข้าสู่ระบบและออกจากระบบ
   * ==============================================================================
   */

  // [UC-01] เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่านจากฐานข้อมูล
  const login = async (phone, password) => {
    try {
      const result = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), password })
      });
      const user = {
        id: String(result.employee_id),
        staffId: String(result.employee_id),
        name: result.name,
        role: result.role?.toLowerCase() === 'hr' ? 'manager' : 'housekeeper',
        phone: phone.trim(),
        department: 'แผนกแม่บ้านหอพัก',
        position: result.role?.toLowerCase() === 'hr' ? 'เจ้าหน้าที่ HR' : 'พนักงานแม่บ้าน',
        shift: '-',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
      };
      sessionStorage.setItem('welfare_token', result.token);
      sessionStorage.setItem('welfare_user', JSON.stringify(user));
      setCurrentUser(user);
      await loadData(user);
      showToast(`ยินดีต้อนรับคุณ ${user.name}`, 'info');
      return true;
    } catch (error) {
      showToast(error.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
      return false;
    }
  };

  // ออกจากระบบ
  const logout = () => {
    sessionStorage.removeItem('welfare_token');
    sessionStorage.removeItem('welfare_user');
    setCurrentUser(null);
    setUsers([]);
    setWelfarePolicies([]);
    setEntitlements([]);
    setRequests([]);
    setDistributionLogs([]);
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
  const submitWelfareRequest = async ({ welfareId, amount, reason, attachment }) => {
    if (!currentUser) return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' };
    const formData = new FormData();
    formData.set('welfare_type_id', welfareId);
    formData.set('quantity', String(amount));
    formData.set('reason', reason.trim());
    if (attachment) formData.set('attachment', attachment);

    try {
      const result = await apiRequest('/api/requests', { method: 'POST', body: formData });
      await loadData(currentUser);
      showToast(result.message || 'ส่งคำขอสำเร็จ', 'success');
      return { success: true, message: result.message };
    } catch (error) {
      showToast(error.message, 'error');
      return { success: false, message: error.message };
    }
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
  const approveRequest = async (requestId) => {
    try {
      const result = await apiRequest(`/api/hr/requests/${requestId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status: 'approved' })
      });
      await loadData(currentUser);
      showToast(result.message || 'อนุมัติคำขอสำเร็จ', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
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
  const rejectRequest = async (requestId, rejectReason) => {
    if (!rejectReason || rejectReason.trim() === '') {
      showToast('กรุณาระบุเหตุผลการไม่อนุมัติ', 'warning');
      return false;
    }

    try {
      const result = await apiRequest(`/api/hr/requests/${requestId}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status: 'rejected', notes: rejectReason.trim() })
      });
      await loadData(currentUser);
      showToast(result.message || 'ปฏิเสธคำขอสำเร็จ', 'info');
      return true;
    } catch (error) {
      showToast(error.message, 'error');
      return false;
    }
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
  const recordDirectDistribution = async ({ userId, welfareId, amount, note }) => {
    try {
      const result = await apiRequest('/api/hr/distributions', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: Number(userId),
          welfare_type_id: Number(welfareId),
          quantity: Number(amount),
          note
        })
      });
      await loadData(currentUser);
      showToast(result.message || 'บันทึกการแจกจ่ายสำเร็จ', 'success');
      return true;
    } catch (error) {
      showToast(error.message, 'error');
      return false;
    }
  };

  /**
   * ==============================================================================
   * [UC-09, UC-10] ปรับปรุงโควตาสิทธิประจำปีของแม่บ้าน (Manage Entitlements)
   * ==============================================================================
   */
  const updateEntitlementQuota = async (entitlementId, newTotalQuota) => {
    const parsedQuota = Number(newTotalQuota);
    if (isNaN(parsedQuota) || parsedQuota < 0) {
      showToast('กรุณาระบุโควตาเป็นตัวเลขที่ถูกต้อง', 'error');
      return false;
    }

    try {
      const result = await apiRequest(`/api/hr/benefits/${entitlementId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: parsedQuota })
      });
      await loadData(currentUser);
      showToast(result.message || 'อัปเดตโควตาสำเร็จ', 'success');
      return true;
    } catch (error) {
      showToast(error.message, 'error');
      return false;
    }
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
      .filter((e) => welfarePolicies.find((policy) => policy.id === e.welfareId)?.name.includes('ป่วย'))
      .reduce((sum, item) => sum + item.used, 0);

    const totalAnnualLeaveUsed = entitlements
      .filter((e) => welfarePolicies.find((policy) => policy.id === e.welfareId)?.name.includes('พักร้อน'))
      .reduce((sum, item) => sum + item.used, 0);

    const totalUniformUsed = entitlements
      .filter((e) => welfarePolicies.find((policy) => policy.id === e.welfareId)?.name.includes('เสื้อ'))
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
    showToast('การรีเซ็ตข้อมูลต้องดำเนินการจากฐานข้อมูลโดยผู้ดูแลระบบ', 'warning');
  };
};

export const WelfareProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('welfare_user') || 'null'));
  const [users, setUsers] = useState([]); const [welfarePolicies, setWelfarePolicies] = useState([]); const [entitlements, setEntitlements] = useState([]); const [requests, setRequests] = useState([]); const [distributionLogs, setDistributionLogs] = useState([]); const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 3500); };

  const loadData = async (user = currentUser) => {
    if (!user) return;
    try {
      const [types, policies, ownRequests, benefits] = await Promise.all([api('/welfare-types'), api('/policies'), api('/my-requests'), api('/my-benefits')]);
      const policyByType = Object.fromEntries(policies.map((p) => [p.welfare_type_id, p]));
      setWelfarePolicies(types.map((type) => mapPolicy(type, policyByType[type.welfare_type_id])));
      setEntitlements(benefits.map((item) => ({ id: `ENT-${item.remain_id}`, userId: String(user.id), welfareId: welfareId(item.benefit?.welfare_type_id), totalQuota: item.total_benefit, used: item.total_used, remaining: item.remaining_amount, year: item.year })));
      const mapRequest = (r) => ({ id: String(r.welfare_request_id), userId: String(r.employee_id), welfareId: welfareId(r.welfare_type_id), amount: r.quantity, reason: r.reason || '', status: toStatus(r.status), attachmentName: r.attachments?.[0]?.file_name || '', rejectReason: '', createdAt: r.request_date });
      setRequests(ownRequests.map(mapRequest));
      if (user.role === 'manager') { const [employeeList, allRequests] = await Promise.all([api('/hr/employees'), api('/hr/requests')]); setUsers(employeeList.map(mapUser)); setRequests(allRequests.map(mapRequest)); }
    } catch (error) { showToast(error.message, 'error'); }
  };
  useEffect(() => { if (currentUser) loadData(currentUser); }, [currentUser]);

  const login = async (identifier, password) => { try { const data = await api('/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }); const user = { id: String(data.employee_id), staffId: String(data.employee_id), name: data.name, role: data.role === 'HR' ? 'manager' : 'housekeeper' }; localStorage.setItem('welfare_token', data.token); localStorage.setItem('welfare_user', JSON.stringify(user)); setCurrentUser(user); showToast(`ยินดีต้อนรับคุณ ${user.name}`, 'info'); return true; } catch (error) { showToast(error.message, 'error'); return false; } };
  const logout = () => { localStorage.removeItem('welfare_token'); localStorage.removeItem('welfare_user'); setCurrentUser(null); setUsers([]); setRequests([]); showToast('ออกจากระบบเรียบร้อยแล้ว', 'info'); };
  const submitWelfareRequest = async ({ welfareId: id, amount, reason, attachmentName }) => { const form = new FormData(); form.append('welfare_type_id', String(Number(id.replace('WF', '')))); form.append('quantity', amount); form.append('reason', reason); if (attachmentName) form.append('attachment', new File(['ไฟล์ตัวอย่างจากหน้าเดโม'], attachmentName)); try { await api('/requests', { method: 'POST', body: form }); showToast('ส่งคำขอสำเร็จเรียบร้อยแล้ว', 'success'); await loadData(); return { success: true }; } catch (error) { showToast(error.message, 'error'); return { success: false, message: error.message }; } };
  const decide = async (requestId, status, notes = '') => { try { await api(`/hr/requests/${requestId}/decide`, { method: 'POST', body: JSON.stringify({ status, notes }) }); showToast(status === 'approved' ? 'อนุมัติคำขอสำเร็จ' : 'ปฏิเสธคำขอเรียบร้อยแล้ว', 'success'); await loadData(); } catch (error) { showToast(error.message, 'error'); } };
  const approveRequest = (id) => decide(id, 'approved');
  const rejectRequest = (id, reason) => { if (!reason?.trim()) { showToast('กรุณาระบุเหตุผลการไม่อนุมัติ', 'warning'); return false; } decide(id, 'rejected', reason); return true; };

  const getUserEntitlements = (userId) => entitlements.filter((e) => e.userId === String(userId)).map((e) => { const p = welfarePolicies.find((x) => x.id === e.welfareId) || {}; return { ...e, policyName: p.name || 'ไม่ระบุ', category: p.category, unit: p.unit, description: p.description, requiresAttachment: p.requiresAttachment, iconName: p.iconName }; });
  const getUserRequests = (userId) => requests.filter((r) => r.userId === String(userId)).map((r) => { const p = welfarePolicies.find((x) => x.id === r.welfareId) || {}; return { ...r, policyName: p.name || 'สวัสดิการ', unit: p.unit || '' }; });
  const getUserLogs = () => [];
  const getAllRequestsEnriched = () => requests.map((r) => { const u = users.find((x) => x.id === r.userId) || {}; const p = welfarePolicies.find((x) => x.id === r.welfareId) || {}; return { ...r, applicantName: u.name || r.userId, applicantStaffId: u.staffId || '-', applicantShift: '-', applicantAvatar: '', policyName: p.name || 'สวัสดิการ', policyCategory: p.category, unit: p.unit, handlerName: '-' }; });
  const getSystemStats = () => ({ pendingCount: requests.filter((r) => r.status === 'Pending').length, approvedCount: requests.filter((r) => r.status === 'Approved').length, rejectedCount: requests.filter((r) => r.status === 'Rejected').length, housekeepersCount: users.filter((u) => u.role === 'housekeeper').length, totalDistributions: requests.filter((r) => r.status === 'Approved').length, totalSickLeaveUsed: 0, totalAnnualLeaveUsed: 0, totalUniformUsed: 0 });
  const unsupported = () => { showToast('ฟังก์ชันนี้ยังไม่มี endpoint ใน backend', 'warning'); return false; };
  const value = useMemo(() => ({ currentUser, users, welfarePolicies, entitlements, requests, distributionLogs, toast, showToast, login, logout, submitWelfareRequest, approveRequest, rejectRequest, recordDirectDistribution: unsupported, updateEntitlementQuota: unsupported, getUserEntitlements, getUserRequests, getUserLogs, getAllRequestsEnriched, getSystemStats, resetToInitialData: () => loadData() }), [currentUser, users, welfarePolicies, entitlements, requests, distributionLogs, toast]);
  return <WelfareContext.Provider value={value}>{children}</WelfareContext.Provider>;
};
export const useWelfare = () => { const context = useContext(WelfareContext); if (!context) throw new Error('useWelfare must be used within a WelfareProvider'); return context; };

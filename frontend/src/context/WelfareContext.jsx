import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

const welfareId = (id) => `WF${String(id).padStart(2, '0')}`;
const toStatus = (status) => ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }[status] || status);
const mapUser = (user) => ({ id: String(user.employee_id), staffId: String(user.employee_id), name: user.employee_name, role: user.role === 'HR' ? 'manager' : 'housekeeper', phone: user.phone, position: user.position || '', department: user.employee_type || '' });
const mapPolicy = (type, policy) => {
  const name = `${type.welfare_name} ${policy?.policy_name || ''}`;
  const isFund = name.includes('ประกัน');
  const isUniform = name.includes('เสื้อ') || name.includes('ยูนิฟอร์ม');
  const isCleaningKit = name.includes('อุปกรณ์ทำความสะอาด');
  return {
    id: welfareId(type.welfare_type_id),
    name: policy?.policy_name || type.welfare_name,
    category: isFund ? 'fund' : isUniform || isCleaningKit ? 'item' : 'leave',
    unit: isFund ? 'บาท' : isCleaningKit ? 'เซ็ต' : isUniform ? 'ชุด' : 'วัน',
    defaultQuota: policy?.benefit_quantity || 0,
    requiresAttachment: [1, 3].includes(type.welfare_type_id),
    description: policy?.condition || type.welfare_description || '',
    iconName: 'HeartPulse'
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

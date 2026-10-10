import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import {
  PackageCheck,
  UserCheck,
  Send,
  AlertTriangle,
  History,
  CheckCircle2,
  Search,
  Sparkles
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: DirectDistributionView
 * ==============================================================================
 * [UC-12] บันทึกการแจกจ่ายสวัสดิการหน้างานโดยตรง (On-Site Direct Distribution)
 * 
 * คุณสมบัติ:
 * 1. ฟอร์มแจกของจริงหน้างาน:
 *    - เลือกชื่อแม่บ้านที่มารับของ
 *    - เลือกประเภทสวัสดิการ/สิ่งของ (ชุดยูนิฟอร์ม, ชุดอุปกรณ์เซฟตี้, ฯลฯ)
 *    - ระบบแสดงสิทธิคงเหลือของแม่บ้านคนนั้นแบบ Real-time
 *    - ระบุจำนวนและหมายเหตุ
 * 2. เมื่อกดบันทึก:
 *    - หักลดยอดคงเหลือในตาราง employee_entitlements อัตโนมัติ
 *    - บันทึกประวัติการแจกลงในตาราง distribution_logs
 * 3. มีตารางแสดงประวัติบันทึกการแจกจ่ายทั้งหมดให้ตรวจสอบย้อนหลัง
 * ==============================================================================
 */
export const DirectDistributionView = () => {
  const {
    users,
    welfarePolicies,
    entitlements,
    distributionLogs,
    recordDirectDistribution
  } = useWelfare();

  // กรองเฉพาะแม่บ้านหอพัก
  const housekeepers = users.filter((u) => u.role === 'housekeeper');

  // State ฟอร์มแจกจ่าย
  const [selectedUserId, setSelectedUserId] = useState(housekeepers[0]?.id || 'HK01');
  const [selectedWelfareId, setSelectedWelfareId] = useState('WF03'); // ค่าเริ่มต้น: ชุดยูนิฟอร์ม
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [searchLogQuery, setSearchLogQuery] = useState('');

  // ค้นหาสิทธิคงเหลือของแม่บ้านคนนี้สำหรับรายการที่เลือก
  const currentEntitlement = entitlements.find(
    (e) => e.userId === selectedUserId && e.welfareId === selectedWelfareId
  );
  const selectedPolicy = welfarePolicies.find((p) => p.id === selectedWelfareId);
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const remainingQuota = currentEntitlement ? currentEntitlement.remaining : 0;
  const unit = selectedPolicy ? selectedPolicy.unit : 'หน่วย';

  // ตรวจสอบเงื่อนไข
  const isExceeding = Number(amount) > remainingQuota;
  const isInvalid = Number(amount) <= 0 || isNaN(Number(amount));
  const canSubmit = !isExceeding && !isInvalid && remainingQuota > 0;

  // ส่งฟอร์มบันทึกการแจกจ่าย
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const success = recordDirectDistribution({
      userId: selectedUserId,
      welfareId: selectedWelfareId,
      amount: Number(amount),
      note: note.trim() || `แจกจ่ายตรง ณ เคาน์เตอร์ประจำวัน`
    });

    if (success) {
      setNote('');
      setAmount(1);
    }
  };

  // รวมข้อมูลสำหรับตาราง Log
  const enrichedLogs = distributionLogs.map((log) => {
    const user = users.find((u) => u.id === log.userId) || {};
    const policy = welfarePolicies.find((p) => p.id === log.welfareId) || {};
    const handler = users.find((u) => u.id === log.handledBy) || {};
    return {
      ...log,
      userName: user.name || 'ไม่ระบุ',
      userStaffId: user.staffId || '-',
      policyName: policy.name || 'สวัสดิการ',
      unit: policy.unit || '',
      handlerName: handler.name || '-'
    };
  });

  const filteredLogs = enrichedLogs.filter((log) => {
    return (
      log.userName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.policyName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchLogQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* ส่วนหัว */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">บันทึกการแจกจ่ายสวัสดิการหน้างาน</h2>
        <p className="text-xs text-[#64748B]">
          บันทึกการมอบสิ่งของหรือตัดสิทธิสวัสดิการโดยตรง ณ ห้องธุรการหอพัก
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ===================================================================== */}
        {/* คอลัมน์ซ้าย: ฟอร์มบันทึกแจกจ่าย (Direct Distribution Form) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PackageCheck className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-bold text-sm text-[#0F172A]">ฟอร์มส่งมอบและตัดสิทธิ</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. เลือกแม่บ้าน */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                1. เลือกแม่บ้านผู้รับของ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none font-medium"
              >
                {housekeepers.map((hk) => (
                  <option key={hk.id} value={hk.id}>
                    {hk.name} (รหัส: {hk.staffId}) - {hk.shift?.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. เลือกสวัสดิการ/สิ่งของ */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                2. เลือกประเภทสวัสดิการ / สิ่งของ <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedWelfareId}
                onChange={(e) => setSelectedWelfareId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none font-medium"
              >
                {welfarePolicies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* การ์ดสรุปสิทธิคงเหลือแบบ Real-time ของคนนั้น */}
            <div className="p-3 bg-[#F0FDFA] border border-[#0D9488]/30 rounded-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#0D9488] font-medium">สิทธิคงเหลือปัจจุบัน:</span>
                <span className="font-extrabold text-[#0D9488] text-base">
                  {remainingQuota.toLocaleString()} {unit}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                พนักงาน: {selectedUser?.name} • ใช้ไปแล้ว {currentEntitlement?.used || 0} {unit}
              </div>
            </div>

            {/* 3. จำนวนที่แจกจ่าย */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#0F172A]">
                  3. จำนวนที่ส่งมอบ ({unit}) <span className="text-red-500">*</span>
                </label>
                {isExceeding && (
                  <span className="text-[11px] text-red-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> เกินสิทธิคงเหลือ
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                max={remainingQuota}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl outline-none font-semibold ${
                  isExceeding ? 'border-red-500 text-red-600' : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#0D9488]'
                }`}
                required
              />
            </div>

            {/* 4. หมายเหตุ / บันทึกการส่งมอบ */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                4. หมายเหตุการส่งมอบ
              </label>
              <textarea
                rows="2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น แจกชุดยูนิฟอร์มไซส์ L, เปลี่ยนถุงมือคู่ใหม่..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#0D9488] outline-none"
              />
            </div>

            {/* ปุ่มบันทึก */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all ${
                canSubmit
                  ? 'bg-[#0D9488] hover:bg-[#0F766E] shadow-md shadow-teal-600/20 active:scale-[0.98]'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>บันทึกส่งมอบ & ตัดสิทธิอัตโนมัติ</span>
            </button>
          </form>
        </div>

        {/* ===================================================================== */}
        {/* คอลัมน์ขวา: ตารางบันทึกประวัติการแจกจ่าย (Distribution Logs History) */}
        {/* ===================================================================== */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-sm text-[#0F172A]">
                  ประวัติบันทึกการแจกจ่ายและการตัดสิทธิ ({filteredLogs.length})
                </h3>
              </div>

              {/* ค้นหาใน Log */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchLogQuery}
                  onChange={(e) => setSearchLogQuery(e.target.value)}
                  placeholder="ค้นหาชื่อแม่บ้าน, รายการ..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>
            </div>

            {/* ตารางแสดง Logs */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] sticky top-0 border-b border-[#E2E8F0] text-[#64748B]">
                  <tr>
                    <th className="py-2.5 px-3">วันที่ / รหัส</th>
                    <th className="py-2.5 px-3">แม่บ้านผู้รับ</th>
                    <th className="py-2.5 px-3">รายการ</th>
                    <th className="py-2.5 px-3">จำนวน</th>
                    <th className="py-2.5 px-3">หมายเหตุ</th>
                    <th className="py-2.5 px-3">ที่มา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[#64748B] block text-[11px]">{log.id}</span>
                        <span className="text-[10px] text-[#64748B]">{log.date}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#0F172A] whitespace-nowrap">
                        {log.userName}
                      </td>
                      <td className="py-3 px-3 text-[#2563EB] font-medium whitespace-nowrap">
                        {log.policyName}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-[#0D9488] whitespace-nowrap">
                        {log.amount} {log.unit}
                      </td>
                      <td className="py-3 px-3 text-[#64748B] max-w-xs truncate" title={log.note}>
                        {log.note}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            log.source === 'Direct Distribution'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {log.source === 'Direct Distribution' ? 'แจกหน้างาน' : 'อนุมัติคำขอ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B]">
            * ทุกรายการที่ส่งมอบจะถูกตัดลดยอดคงเหลือออกจากสิทธิประจำปีของพนักงานโดยอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import {
  Sliders,
  Edit3,
  Check,
  X,
  Users,
  ShieldCheck,
  Search,
  Sparkles
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: EntitlementsManageView
 * ==============================================================================
 * [UC-09, UC-10] จัดการสิทธิและโควตาประจำปีของแม่บ้านแต่ละคน (Quota Management)
 * 
 * คุณสมบัติ:
 * 1. แสดงรายการสิทธิของแม่บ้านทุกคน พร้อมสัดส่วน โควตาทั้งหมด / ใช้ไปแล้ว / คงเหลือ
 * 2. ค้นหาตามชื่อแม่บ้าน หรือกรองตามสวัสดิการ
 * 3. มีฟังก์ชันแก้ไขโควตาประจำปี (Edit Total Quota):
 *    - หัวหน้างานสามารถปรับเพิ่มหรือลดโควตาได้
 *    - ระบบคำนวณสิทธิคงเหลือใหม่โดยอัตโนมัติ: remaining = newTotal - used
 * ==============================================================================
 */
export const EntitlementsManageView = () => {
  const { users, welfarePolicies, entitlements, updateEntitlementQuota } = useWelfare();

  // กรองเฉพาะแม่บ้าน
  const housekeepers = users.filter((u) => u.role === 'housekeeper');

  // State เลือกแม่บ้านเพื่อดูสิทธิ (หรือดูทุกคน)
  const [selectedHousekeeperId, setSelectedHousekeeperId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // State สำหรับการแก้ไขโควตาแบบ Inline
  const [editingEntitlementId, setEditingEntitlementId] = useState(null);
  const [newQuotaValue, setNewQuotaValue] = useState('');

  // เริ่มต้นแก้ไข
  const handleStartEdit = (ent) => {
    setEditingEntitlementId(ent.id);
    setNewQuotaValue(ent.totalQuota);
  };

  // บันทึกการแก้ไข (UC-10)
  const handleSaveEdit = (entId) => {
    const success = updateEntitlementQuota(entId, newQuotaValue);
    if (success) {
      setEditingEntitlementId(null);
    }
  };

  // ยกเลิกการแก้ไข
  const handleCancelEdit = () => {
    setEditingEntitlementId(null);
    setNewQuotaValue('');
  };

  // รวมข้อมูลสำหรับเรนเดอร์ตาราง
  const enrichedEntitlements = entitlements.map((ent) => {
    const user = users.find((u) => u.id === ent.userId) || {};
    const policy = welfarePolicies.find((p) => p.id === ent.welfareId) || {};
    return {
      ...ent,
      userName: user.name || '-',
      userStaffId: user.staffId || '-',
      userAvatar: user.avatar || '',
      policyName: policy.name || '-',
      unit: policy.unit || '',
      category: policy.category || 'other'
    };
  });

  // คัดกรอง
  const filteredList = enrichedEntitlements.filter((item) => {
    const matchesUser =
      selectedHousekeeperId === 'all' || item.userId === selectedHousekeeperId;
    const matchesSearch =
      item.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.policyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUser && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* ส่วนหัว */}
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">จัดการสิทธิและโควตาประจำปีของแม่บ้าน</h2>
        <p className="text-xs text-[#64748B]">
          ปรับปรุงโควตาสิทธิและตรวจสอบยอดคงเหลือรายบุคคลสำหรับปีงบประมาณ 2569
        </p>
      </div>

      {/* แถบควบคุมและค้นหา */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* เลือกแม่บ้าน */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Users className="w-4 h-4 text-[#64748B] flex-shrink-0" />
          <select
            value={selectedHousekeeperId}
            onChange={(e) => setSelectedHousekeeperId(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-semibold outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="all">แสดงแม่บ้านทุกคน ({housekeepers.length} คน)</option>
            {housekeepers.map((hk) => (
              <option key={hk.id} value={hk.id}>
                {hk.name} (รหัส {hk.staffId})
              </option>
            ))}
          </select>
        </div>

        {/* ช่องค้นหา */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแม่บ้าน หรือสวัสดิการ..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none"
          />
        </div>
      </div>

      {/* ตารางแสดงและแก้ไขสิทธิ */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">แม่บ้าน</th>
                <th className="py-3.5 px-4">รายการสวัสดิการ</th>
                <th className="py-3.5 px-4 text-center">โควตารวม (Total)</th>
                <th className="py-3.5 px-4 text-center">ใช้ไปแล้ว (Used)</th>
                <th className="py-3.5 px-4 text-center">คงเหลือ (Remaining)</th>
                <th className="py-3.5 px-4 text-center">แก้ไขโควตา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredList.map((item) => {
                const isEditing = editingEntitlementId === item.id;
                const percentUsed =
                  item.totalQuota > 0 ? (item.used / item.totalQuota) * 100 : 0;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ข้อมูลแม่บ้าน */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.userAvatar}
                          alt={item.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-bold text-[#0F172A] block">{item.userName}</span>
                          <span className="text-[10px] text-[#64748B]">รหัส: {item.userStaffId}</span>
                        </div>
                      </div>
                    </td>

                    {/* รายการสวัสดิการ */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#0F172A]">{item.policyName}</span>
                    </td>

                    {/* โควตารวม (สามารถแก้ไขได้) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={item.used}
                            value={newQuotaValue}
                            onChange={(e) => setNewQuotaValue(e.target.value)}
                            className="w-20 px-2 py-1 text-xs border-2 border-[#2563EB] rounded-lg text-center font-bold outline-none"
                            autoFocus
                          />
                          <span className="text-[10px] text-[#64748B]">{item.unit}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-[#0F172A] text-sm">
                          {item.totalQuota.toLocaleString()} {item.unit}
                        </span>
                      )}
                    </td>

                    {/* ใช้ไปแล้ว */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap text-[#64748B]">
                      <span className="font-semibold text-slate-700">
                        {item.used.toLocaleString()}
                      </span>{' '}
                      {item.unit} ({Math.round(percentUsed)}%)
                    </td>

                    {/* สิทธิคงเหลือ */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-extrabold text-sm px-2.5 py-1 rounded-full ${
                          item.remaining === 0
                            ? 'bg-red-100 text-red-700'
                            : item.remaining <= item.totalQuota * 0.25
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.remaining.toLocaleString()} {item.unit}
                      </span>
                    </td>

                    {/* ปุ่มแก้ไข / บันทึก */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 bg-[#16A34A] text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            title="บันทึกโควตาใหม่"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                            title="ยกเลิก"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#2563EB] bg-[#DBEAFE] hover:bg-blue-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>ปรับโควตา</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

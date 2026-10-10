import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import { RejectModal } from './RejectModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  User,
  AlertCircle,
  Eye
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: ApprovalView
 * ==============================================================================
 * [UC-07, UC-08] ตรวจสอบและอนุมัติ/ไม่อนุมัติคำขอสวัสดิการของแม่บ้านทุกคน
 * 
 * คุณสมบัติ:
 * 1. ตารางแสดงคำขอแบบรวมศูนย์ (Centralized Requests Table)
 * 2. ตัวกรองสถานะ (ทั้งหมด, รอดำเนินการ, อนุมัติแล้ว, ไม่อนุมัติ) และช่องค้นหา
 * 3. ปุ่ม "อนุมัติ" (UC-07):
 *    - อัปเดตสถานะเป็น Approved
 *    - ตัดสิทธิคงเหลือใน employee_entitlements อัตโนมัติทันที
 *    - บันทึกเข้า distribution_logs
 * 4. ปุ่ม "ไม่อนุมัติ" (UC-08):
 *    - เปิด RejectModal เพื่อระบุเหตุผลในการปฏิเสธ
 *    - อัปเดตสถานะเป็น Rejected พร้อมเก็บเหตุผลไว้ให้แม่บ้านเปิดอ่าน
 * ==============================================================================
 */
export const ApprovalView = () => {
  const { getAllRequestsEnriched, approveRequest, rejectRequest } = useWelfare();

  // State ตัวกรองสถานะและค้นหา
  const [statusFilter, setStatusFilter] = useState('Pending'); // ค่าเริ่มต้นเน้นที่ 'Pending' ที่ต้องพิจารณา
  const [searchQuery, setSearchQuery] = useState('');

  // State ควบคุม RejectModal
  const [rejectingRequest, setRejectingRequest] = useState(null);

  // ดึงข้อมูลคำขอที่ Join กับชื่อแม่บ้านและสวัสดิการเรียบร้อยแล้ว
  const requests = getAllRequestsEnriched();

  // คัดกรองข้อมูลตามฟิลเตอร์และการค้นหา
  const filteredRequests = requests.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesSearch =
      req.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.policyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // ฟังก์ชันกดอนุมัติ (UC-07)
  const handleApprove = (requestId) => {
    if (window.confirm('ยืนยันการอนุมัติคำขอนี้? ระบบจะทำการตัดยอดสิทธิคงเหลือของพนักงานทันที')) {
      approveRequest(requestId);
    }
  };

  // ฟังก์ชันเมื่อกดยืนยันใน Reject Modal (UC-08)
  const handleConfirmReject = async (requestId, reason) => {
    return rejectRequest(requestId, reason);
  };

  return (
    <div className="space-y-6">
      
      {/* ส่วนหัวของหน้าจอ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">ตรวจสอบและอนุมัติคำขอสวัสดิการ</h2>
          <p className="text-xs text-[#64748B]">
            พิจารณาคำขอลา เบิกอุปกรณ์ และเงินช่วยเหลือของพนักงานแม่บ้าน
          </p>
        </div>
      </div>

      {/* แถบเครื่องมือ: ค้นหาและกรองสถานะ */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* ช่องค้นหา */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อแม่บ้าน, รหัสคำขอ, หรือสวัสดิการ..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none"
          />
        </div>

        {/* ปุ่มตัวกรองสถานะ */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-[#64748B] hidden sm:block mr-1" />
          {[
            { id: 'Pending', label: 'รอดำเนินการ', badgeColor: 'bg-amber-500' },
            { id: 'all', label: 'คำขอทั้งหมด' },
            { id: 'Approved', label: 'อนุมัติแล้ว' },
            { id: 'Rejected', label: 'ไม่อนุมัติ' }
          ].map((tab) => {
            const count = requests.filter((r) => tab.id === 'all' || r.status === tab.id).length;
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-slate-200 border border-[#E2E8F0]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-[#0F172A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ตารางคำขอสวัสดิการ (Desktop Table & Responsive Cards) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-[#64748B]">
            <Clock className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">ไม่พบรายการคำขอในสถานะที่เลือก</p>
            <p className="text-xs mt-1">ลองเปลี่ยนตัวกรองเป็น "คำขอทั้งหมด" หรือพิมพ์ค้นหาคำใหม่อีกครั้ง</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">รหัส / วันที่ยื่น</th>
                  <th className="py-3.5 px-4">แม่บ้านผู้ยื่นคำขอ</th>
                  <th className="py-3.5 px-4">รายการสวัสดิการ</th>
                  <th className="py-3.5 px-4">จำนวนที่ขอ</th>
                  <th className="py-3.5 px-4">เหตุผล & เอกสารแนบ</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'Pending';
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* รหัสและวันที่ */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#2563EB] block">{req.id}</span>
                        <span className="text-[11px] text-[#64748B]">{req.createdAt}</span>
                      </td>

                      {/* ข้อมูลแม่บ้าน */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={req.applicantAvatar}
                            alt={req.applicantName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <span className="font-bold text-[#0F172A] block">{req.applicantName}</span>
                            <span className="text-[11px] text-[#64748B]">
                              รหัส: {req.applicantStaffId} • {req.applicantShift?.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* รายการสวัสดิการ */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#0F172A] block">{req.policyName}</span>
                        <span className="text-[10px] text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded font-medium">
                          {req.policyCategory === 'leave'
                            ? 'สิทธิการลา'
                            : req.policyCategory === 'fund'
                            ? 'เงินช่วยเหลือ'
                            : 'พัสดุสิ่งของ'}
                        </span>
                      </td>

                      {/* จำนวน */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-sm text-[#0F172A]">
                          {req.amount}
                        </span>{' '}
                        <span className="text-[#64748B]">{req.unit}</span>
                      </td>

                      {/* เหตุผลและเอกสารแนบ */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-[#0F172A] truncate" title={req.reason}>
                          {req.reason}
                        </p>
                        {req.attachmentName ? (
                          <div className="flex items-center gap-1 text-[11px] text-[#2563EB] mt-1 bg-blue-50 px-2 py-0.5 rounded max-w-fit">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[140px]">{req.attachmentName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#64748B]">- ไม่มีเอกสารแนบ -</span>
                        )}
                        {req.status === 'Rejected' && req.rejectReason && (
                          <p className="text-[11px] text-red-600 mt-1 italic">
                            เหตุผลปฏิเสธ: {req.rejectReason}
                          </p>
                        )}
                      </td>

                      {/* สถานะ */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {req.status === 'Approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-[#16A34A]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติแล้ว</span>
                          </span>
                        ) : req.status === 'Rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-[#DC2626]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>ไม่อนุมัติ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-[#D97706]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอดำเนินการ</span>
                          </span>
                        )}
                      </td>

                      {/* ปุ่ม Action การอนุมัติ / ปฏิเสธ (UC-07, UC-08) */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 rounded-lg font-bold bg-[#16A34A] hover:bg-emerald-700 text-white flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                              title="อนุมัติคำขอและตัดสิทธิคงเหลือทันที"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>อนุมัติ</span>
                            </button>
                            <button
                              onClick={() => setRejectingRequest(req)}
                              className="px-2.5 py-1.5 rounded-lg font-bold bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-200 flex items-center gap-1 active:scale-95 transition-all"
                              title="ไม่อนุมัติและระบุเหตุผล"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ไม่อนุมัติ</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">
                            ดำเนินการแล้วโดย {req.handlerName}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={Boolean(rejectingRequest)}
        onClose={() => setRejectingRequest(null)}
        request={rejectingRequest}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
};

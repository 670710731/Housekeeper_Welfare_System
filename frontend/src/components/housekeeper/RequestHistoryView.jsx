import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  AlertCircle,
  PackageCheck,
  History,
  FileCheck
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: RequestHistoryView
 * ==============================================================================
 * [UC-05, UC-06] ติดตามสถานะคำขอและดูประวัติการรับสวัสดิการของแม่บ้าน
 * 
 * คุณสมบัติ:
 * 1. แท็บที่ 1: สถานะคำขอสวัสดิการ (ติดตามผล Pending, Approved, Rejected)
 *    - แสดงเหตุผลที่ปฏิเสธ (Reject Reason) อย่างชัดเจนหากถูกไม่อนุมัติ
 *    - แสดงสีสถานะตาม Design System:
 *      * เขียว (#16A34A): อนุมัติแล้ว
 *      * ส้ม (#D97706): รอดำเนินการ
 *      * แดง (#DC2626): ไม่อนุมัติ
 * 2. แท็บที่ 2: ประวัติการรับมอบสวัสดิการย้อนหลัง (Distribution History Logs)
 *    - แสดงวันที่, รายการของที่ได้รับ, จำนวน, และหมายเหตุจากหัวหน้างาน
 * ==============================================================================
 */
export const RequestHistoryView = () => {
  const { currentUser, getUserRequests, getUserLogs } = useWelfare();

  // State แท็บ: 'requests' (คำขอ) หรือ 'logs' (ประวัติการรับของ)
  const [activeTab, setActiveTab] = useState('requests');

  // State ตัวกรองสถานะคำขอ ('all' | 'Pending' | 'Approved' | 'Rejected')
  const [statusFilter, setStatusFilter] = useState('all');

  if (!currentUser) return null;

  // ดึงข้อมูลของแม่บ้านคนปัจจุบัน
  const requests = getUserRequests(currentUser.id);
  const logs = getUserLogs(currentUser.id);

  // กรองคำขอตามสถานะ
  const filteredRequests = requests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  // ฟังก์ชันเรนเดอร์ Badge สถานะคำขอ
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#16A34A]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>อนุมัติแล้ว</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-[#DC2626]">
            <XCircle className="w-3.5 h-3.5" />
            <span>ไม่อนุมัติ</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-[#D97706]">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>รอดำเนินการ</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ส่วนหัวของหน้า */}
      <div>
        <h3 className="text-lg font-bold text-[#0F172A]">ติดตามสถานะและประวัติการรับสวัสดิการ</h3>
        <p className="text-xs text-[#64748B]">
          ตรวจสอบสถานะคำขอล่าสุด และประวัติการรับสวัสดิการย้อนหลัง
        </p>
      </div>

      {/* สลับแท็บระหว่าง "สถานะคำขอ" กับ "ประวัติการรับของ" */}
      <div className="flex bg-[#F1F5F9] p-1.5 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-white text-[#2563EB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>คำขอที่ยื่นไว้ ({requests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-white text-[#2563EB] shadow-sm'
              : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติการรับของ ({logs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* [TAB 1] รายการคำขอที่ยื่นไว้ (Requests) */}
      {/* ========================================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          
          {/* ปุ่มตัวกรองสถานะคำขอ */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'Pending', label: 'รอดำเนินการ' },
              { id: 'Approved', label: 'อนุมัติแล้ว' },
              { id: 'Rejected', label: 'ไม่อนุมัติ' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === f.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* รายการการ์ดคำขอ */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F0] text-[#64748B]">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">ไม่พบรายการคำขอในสถานะนี้</p>
              <p className="text-xs mt-1">ยื่นคำขอใหม่ได้ที่เมนู "ยื่นขอสวัสดิการ"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#0F172A]">{req.policyName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] font-mono">
                        {req.id}
                      </span>
                    </div>
                    <div>{renderStatusBadge(req.status)}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#64748B]">จำนวนที่ขอ:</span>{' '}
                      <span className="font-bold text-[#0F172A]">{req.amount} {req.unit}</span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">วันที่ยื่น:</span>{' '}
                      <span className="text-[#0F172A] font-medium">{req.createdAt}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-[#64748B]">เหตุผลความจำเป็น:</span>
                    <p className="text-xs text-[#0F172A] mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {req.reason}
                    </p>
                  </div>

                  {/* แสดงเอกสารแนบ (ถ้ามี) */}
                  {req.attachmentName && (
                    <div className="flex items-center gap-1.5 text-xs text-[#2563EB] bg-[#DBEAFE]/40 px-3 py-1.5 rounded-lg">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>เอกสารแนบ: {req.attachmentName}</span>
                    </div>
                  )}

                  {/* แสดงเหตุผลการปฏิเสธ (กรณี Rejected) */}
                  {req.status === 'Rejected' && req.rejectReason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#DC2626]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>เหตุผลที่ไม่อนุมัติ:</span>
                      </div>
                      <p className="text-red-800 leading-relaxed pl-5">
                        {req.rejectReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* [TAB 2] ประวัติการรับมอบสวัสดิการย้อนหลัง (Distribution Logs) */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#E2E8F0] text-[#64748B]">
              <PackageCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">ยังไม่มีประวัติการรับมอบสวัสดิการ</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0F172A]">{log.policyName}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {log.id}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-1">{log.note}</p>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748B] mt-1.5">
                      <span>ผู้ดำเนินการ: {log.handlerName}</span>
                      <span>•</span>
                      <span>{log.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-100 sm:pl-4">
                  <div className="text-sm font-extrabold text-[#0D9488]">
                    ได้รับ {log.amount} {log.unit}
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                    {log.source === 'Request Approval' ? 'จากการอนุมัติคำขอ' : 'แจกจ่ายหน้างาน'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

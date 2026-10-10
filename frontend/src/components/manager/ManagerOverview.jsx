import React from 'react';
import { useWelfare } from '../../context/WelfareContext';
import {
  Clock,
  CheckCircle2,
  Users,
  PackageCheck,
  HeartPulse,
  Calendar,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Shirt
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: ManagerOverview
 * ==============================================================================
 * [UC-11] หน้าจอรายงานและสถิติภาพรวมสำหรับผู้จัดการหอพัก (Manager Dashboard)
 * 
 * คุณสมบัติ:
 * 1. Stat Cards สรุปตัวเลขสำคัญ (คำขอรออนุมัติ, อนุมัติแล้ว, จำนวนแม่บ้าน, รายการแจกจ่าย)
 * 2. แถบสรุปการใช้สิทธิสำคัญ เช่น วันลาป่วยสะสม, ลาพักร้อนสะสม, ยูนิฟอร์มที่แจกแล้ว
 * 3. รายการคำขอล่าสุดที่ค้างสถานะ 'Pending' เพื่อให้กดข้ามไปอนุมัติได้ทันที
 * ==============================================================================
 */
export const ManagerOverview = ({ onNavigateToApproval }) => {
  const { currentUser, getSystemStats, getAllRequestsEnriched } = useWelfare();

  const stats = getSystemStats();
  const allRequests = getAllRequestsEnriched();

  // คำขอที่รออนุมัติ 3 รายการล่าสุด
  const pendingRequests = allRequests
    .filter((r) => r.status === 'Pending')
    .slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Banner ทักทายผู้จัดการ */}
      <div className="bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#0D9488] rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold mb-2">
              แดชบอร์ดฝ่ายบริหารหอพัก
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">
              ยินดีต้อนรับ {currentUser?.name} 👋
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {currentUser?.position} • ดูแลจัดการสวัสดิการของแม่บ้านหอพักทุกอาคาร
            </p>
          </div>

          {/* ป้ายเตือนงานค้าง */}
          {stats.pendingCount > 0 ? (
            <button
              onClick={() => onNavigateToApproval()}
              className="bg-amber-400 text-amber-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow hover:bg-amber-300 transition-all active:scale-95"
            >
              <Clock className="w-4 h-4 animate-spin text-amber-900" />
              <span>มีคำขอรอการอนุมัติ {stats.pendingCount} รายการ</span>
            </button>
          ) : (
            <div className="bg-white/20 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>ไม่มีคำขอค้างการพิจารณา</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 Stat Cards สรุปตัวชี้วัดหลัก (KPIs) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: คำขอรออนุมัติ (Warning) */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">คำขอรอพิจารณา</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">รายการที่ต้องดำเนินการ</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Card 2: อนุมัติสำเร็จ (Success) */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">อนุมัติสำเร็จแล้ว</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {stats.approvedCount}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">คำขอที่ตัดสิทธิแล้ว</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Card 3: จำนวนแม่บ้านในระบบ */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800">แม่บ้านในความดูแล</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] mt-2">
            {stats.housekeepersCount}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">อาคาร A, B และ C</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2563EB]" />
        </div>

        {/* Card 4: บันทึกการแจกจ่ายสะสม */}
        <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">รายการแจกจ่ายสะสม</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0D9488] mt-2">
            {stats.totalDistributions}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">บันทึกทั้งระบบปี 2569</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0D9488]" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2 คอลัมน์: สรุปการใช้สิทธิสำคัญ & คำขอค้างพิจารณาล่าสุด */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* คอลัมน์ซ้าย: สรุปภาพรวมการใช้สิทธิของพนักงานทั้งหอพัก */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2563EB]" />
              <h3 className="font-bold text-sm text-[#0F172A]">สรุปการใช้วันลาและสิทธิรวมทั้งองค์กร</h3>
            </div>
            <span className="text-[11px] text-[#64748B]">ปีงบประมาณ 2569</span>
          </div>

          {/* สถิติ 1: วันลาป่วยสะสม */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>วันลาป่วยสะสม (Sick Leave)</span>
              </span>
              <span className="font-extrabold text-[#0F172A]">
                {stats.totalSickLeaveUsed} วัน (จากโควตารวม {stats.housekeepersCount * 30} วัน)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width: `${(stats.totalSickLeaveUsed / (stats.housekeepersCount * 30)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* สถิติ 2: วันลาพักร้อนสะสม */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>วันลาพักร้อนสะสม (Annual Leave)</span>
              </span>
              <span className="font-extrabold text-[#0F172A]">
                {stats.totalAnnualLeaveUsed} วัน (จากโควตารวม {stats.housekeepersCount * 6} วัน)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full"
                style={{
                  width: `${(stats.totalAnnualLeaveUsed / (stats.housekeepersCount * 6)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* สถิติ 3: ยูนิฟอร์มที่แจกไปแล้ว */}
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-teal-600" />
                <span>ชุดยูนิฟอร์มที่แจกจ่ายแล้ว</span>
              </span>
              <span className="font-extrabold text-[#0F172A]">
                {stats.totalUniformUsed} ชุด (จากโควตารวม {stats.housekeepersCount * 3} ชุด)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0D9488] rounded-full"
                style={{
                  width: `${(stats.totalUniformUsed / (stats.housekeepersCount * 3)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: คำขอล่าสุดที่รอดำเนินการ */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-[#0F172A]">คำขอใหม่ที่รอการพิจารณา</h3>
              </div>
              <button
                onClick={() => onNavigateToApproval()}
                className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>ดูทั้งหมด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-[#64748B]">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-semibold">ไม่มีคำขอค้างการพิจารณาในขณะนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={req.applicantAvatar}
                        alt={req.applicantName}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-[#0F172A] truncate">
                          {req.applicantName}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate">
                          ขอ: <span className="text-[#2563EB] font-bold">{req.policyName}</span> ({req.amount} {req.unit})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigateToApproval()}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-bold whitespace-nowrap shadow-sm"
                    >
                      พิจารณา
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span>ระบบบันทึกและประมวลผลข้อมูลสวัสดิการแบบเรียลไทม์</span>
          </div>
        </div>
      </div>
    </div>
  );
};

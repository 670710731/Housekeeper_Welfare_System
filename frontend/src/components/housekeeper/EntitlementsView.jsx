import React from 'react';
import { useWelfare } from '../../context/WelfareContext';
import { PolicyIcon } from '../common/PolicyIcon';
import { PlusCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

/**
 * ==============================================================================
 * Component: EntitlementsView
 * ==============================================================================
 * [UC-02, UC-03] แสดงภาพรวมสิทธิและโควตาสวัสดิการคงเหลือของแม่บ้าน
 * ออกแบบเน้น Mobile-First: ตัวหนังสือใหญ่ อ่านง่าย สบายตา สีชัดเจน
 * 
 * คุณสมบัติ:
 * 1. แสดงการ์ดสิทธิแต่ละรายการ (ลาป่วย, ลาพักร้อน, ยูนิฟอร์ม, อุปกรณ์, เงินรักษาพยาบาล)
 * 2. มี Progress Bar แสดงสัดส่วน ใช้ไปแล้ว / โควตาทั้งหมด
 * 3. แจ้งเตือนสถานะโควตาด้วยสีตาม Welfare Care Design System:
 *    - สีเขียว: มีสิทธิคงเหลือพร้อมใช้
 *    - สีส้ม: สิทธิใกล้หมด (เหลือน้อยกว่า 30%)
 *    - สีเทา/แดง: สิทธิหมดแล้ว
 * 4. มีปุ่มลัด "ยื่นเบิก/ขอใช้สิทธิ" เข้าสู่ฟอร์ม UC-04 ได้ทันที
 * ==============================================================================
 */
export const EntitlementsView = ({ onOpenRequestForm }) => {
  const { currentUser, getUserEntitlements } = useWelfare();

  if (!currentUser) return null;

  // ดึงสิทธิทั้งหมดของแม่บ้านคนปัจจุบัน
  const entitlements = getUserEntitlements(currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* Banner ทักทายและแจ้งข้อมูลประจำวัน */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium mb-1">
              ปีงบประมาณ 2026
            </span>
            <h2 className="text-xl sm:text-2xl font-bold">สวัสดีพี่{currentUser.name} 👋</h2>
            <p className="text-blue-100 text-sm mt-1">
              {currentUser.position} • {currentUser.shift}
            </p>
          </div>
          <button
            onClick={() => onOpenRequestForm()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#2563EB] font-bold text-sm shadow hover:bg-blue-50 active:scale-95 transition-all"
          >
            <PlusCircle className="w-5 h-5 text-[#2563EB]" />
            <span>ยื่นขอสวัสดิการใหม่</span>
          </button>
        </div>
      </div>

      {/* หัวข้อแสดงสิทธิคงเหลือ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">สิทธิและโควตาสวัสดิการคงเหลือของคุณ</h3>
          <p className="text-xs text-[#64748B]">ตรวจสอบจำนวนคงเหลือประจำปีก่อนส่งคำขอ</p>
        </div>
      </div>

      {/* Grid การ์ดสวัสดิการ (Mobile: 1 คอลัมน์, Desktop: 2-3 คอลัมน์) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entitlements.map((item) => {
          // คำนวณเปอร์เซ็นต์ที่ใช้ไป
          const percentUsed = item.totalQuota > 0 ? (item.used / item.totalQuota) * 100 : 0;
          const isExhausted = item.remaining === 0;
          const isLow = item.remaining > 0 && item.remaining <= item.totalQuota * 0.25;

          // กำหนดสีและป้ายกำกับสถานะ
          let statusBadgeClass = 'bg-emerald-100 text-emerald-800';
          let statusLabel = 'มีสิทธิพร้อมใช้';
          let borderClass = 'border-[#E2E8F0]';
          let barColor = 'bg-[#16A34A]';

          if (isExhausted) {
            statusBadgeClass = 'bg-slate-100 text-slate-600';
            statusLabel = 'ใช้ครบโควตาแล้ว';
            borderClass = 'border-slate-300';
            barColor = 'bg-slate-400';
          } else if (isLow) {
            statusBadgeClass = 'bg-amber-100 text-amber-800';
            statusLabel = 'โควตาใกล้หมด';
            borderClass = 'border-amber-200';
            barColor = 'bg-[#D97706]';
          }

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border ${borderClass} shadow-sm hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
                {/* แถบด้านบน: ไอคอนและป้ายสถานะ */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shadow-sm">
                    <PolicyIcon name={item.iconName} className="w-6 h-6" />
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* ชื่อและคำอธิบายสวัสดิการ */}
                <h4 className="text-base font-bold text-[#0F172A] leading-snug">{item.policyName}</h4>
                <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{item.description}</p>

                {/* ตัวเลขไฮไลท์คงเหลือ (ใหญ่ ชัดเจน เหมาะกับแม่บ้าน) */}
                <div className="my-4 p-3 bg-[#F8FAFC] rounded-xl border border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[#64748B] font-medium">คงเหลือสิทธิ:</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-extrabold ${isExhausted ? 'text-slate-400' : 'text-[#2563EB]'}`}>
                        {item.remaining.toLocaleString()}
                      </span>
                      <span className="text-xs font-medium text-[#64748B]">/ {item.totalQuota.toLocaleString()} {item.unit}</span>
                    </div>
                  </div>

                  {/* Progress Bar แสดงการใช้งาน */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-[#64748B] mt-1.5 font-medium">
                    <span>ใช้ไปแล้ว: {item.used.toLocaleString()} {item.unit}</span>
                    <span>{Math.round(percentUsed)}%</span>
                  </div>
                </div>
              </div>

              {/* ปุ่มยื่นคำขอสำหรับสวัสดิการนี้ */}
              <button
                type="button"
                disabled={isExhausted}
                onClick={() => onOpenRequestForm(item.welfareId)}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isExhausted
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] shadow-sm'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isExhausted ? 'โควตาสิ้นสุด' : 'ยื่นเบิก / ขอสิทธิรายการนี้'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* คำแนะนำและข้อมูลสิทธิ์พื้นฐาน */}
      <div className="bg-[#CCFBF1]/40 border border-[#0D9488]/30 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#0D9488] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700">
          <p className="font-bold text-[#0D9488]">คำแนะนำสำหรับพี่ๆ แม่บ้าน:</p>
          <p className="mt-0.5 leading-relaxed">
            สิทธิสวัสดิการได้รับการคำนวณตามปีงบประมาณ 2569 หากมีข้อสงสัยเกี่ยวกับสิทธิคงเหลือ หรือต้องการอุปกรณ์ฉุกเฉินนอกรอบ สามารถติดต่อหัวหน้างานได้โดยตรงที่ห้องธุรการหอพัก
          </p>
        </div>
      </div>
    </div>
  );
};

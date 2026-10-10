import React from 'react';
import { ShieldCheck, LogOut, RotateCcw, User, Sparkles } from 'lucide-react';
import { useWelfare } from '../../context/WelfareContext';

/**
 * ==============================================================================
 * Component: Navbar
 * ==============================================================================
 * แถบเมนูด้านบนของระบบ:
 * - แสดงโลโก้และชื่อระบบตามแนวคิด Welfare Care
 * - แสดงข้อมูลโปรไฟล์ผู้ใช้งานปัจจุบัน
 * - มีปุ่มรีเซ็ตข้อมูลจำลอง (Reset Demo Data) เพื่อความสะดวกในการสาธิตให้อาจารย์ดูซ้ำๆ
 * - มีปุ่มออกจากระบบ (Logout)
 * ==============================================================================
 */
export const Navbar = () => {
  const { currentUser, logout, resetToInitialData } = useWelfare();

  if (!currentUser) return null;

  const isManager = currentUser.role === 'manager';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* ส่วนโลโก้และชื่อระบบ */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#0D9488] flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#0F172A] tracking-tight">Welfare Care</span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#2563EB]">
                ระบบสวัสดิการหอพัก
              </span>
            </div>
            <p className="text-xs text-[#64748B] hidden sm:block">
              Welfare & Benefits Management System
            </p>
          </div>
        </div>

        {/* ส่วนข้อมูลผู้ใช้งานและปุ่มเครื่องมือ */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* ปุ่มรีเซ็ตข้อมูล Mock Data (เหมาะอย่างยิ่งสำหรับ Demo ให้อาจารย์ดู) */}
          <button
            onClick={resetToInitialData}
            title="รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้นเพื่อสาธิตใหม่"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 rounded-lg transition-all border border-[#E2E8F0]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="hidden md:inline">คืนค่าข้อมูลระบบ</span>
          </button>

          {/* ป้ายแสดงผู้ใช้ปัจจุบัน */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-[#E2E8F0]">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#DBEAFE]"
            />
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-[#0F172A] leading-tight flex items-center gap-1.5">
                {currentUser.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[11px] font-medium px-2 py-0.2 rounded-full ${
                    isManager
                      ? 'bg-purple-100 text-purple-700 font-semibold'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isManager ? 'หัวหน้างาน (Manager)' : 'แม่บ้านหอพัก (Staff)'}
                </span>
                <span className="text-[11px] text-[#64748B]">ID: {currentUser.staffId}</span>
              </div>
            </div>
          </div>

          {/* ปุ่มออกจากระบบ */}
          <button
            onClick={logout}
            title="ออกจากระบบ"
            className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

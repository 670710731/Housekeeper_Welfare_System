import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import { ManagerOverview } from './ManagerOverview';
import { ApprovalView } from './ApprovalView';
import { DirectDistributionView } from './DirectDistributionView';
import { EntitlementsManageView } from './EntitlementsManageView';
import {
  LayoutDashboard,
  CheckSquare,
  PackageCheck,
  Sliders,
  ShieldCheck
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: ManagerLayout
 * ==============================================================================
 * [C] Layout หลักสำหรับฝั่งหัวหน้างาน (Desktop Dashboard First)
 * 
 * หน้าที่และเมนูหลัก:
 * 1. ภาพรวมและสถิติ (UC-11): สรุปภาพรวมและตัวชี้วัดสำคัญ
 * 2. ตรวจสอบและอนุมัติคำขอ (UC-07, UC-08): ตารางคำขอพร้อมปุ่มอนุมัติ/ไม่อนุมัติ
 * 3. บันทึกการแจกจ่ายหน้างาน (UC-12): ฟอร์มแจกของจริงและตัดยอดคงเหลือ
 * 4. จัดการสิทธิแม่บ้าน (UC-09, UC-10): แก้ไขและปรับปรุงโควตาสิทธิประจำปี
 * ==============================================================================
 */
export const ManagerLayout = () => {
  const { requests } = useWelfare();

  // State แท็บเมนูที่เลือก ('overview' | 'approval' | 'distribution' | 'entitlements')
  const [activeTab, setActiveTab] = useState('overview');

  // คำนวณจำนวนคำขอที่ค้างอนุมัติเพื่อแสดง Badge แจ้งเตือน
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="pb-16 space-y-6">
      
      {/* ส่วนหัวของ Manager Portal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              ระบบบริหารจัดการสวัสดิการหอพัก
            </h1>
            <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              สำหรับหัวหน้างาน
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            เครื่องมือสำหรับหัวหน้างาน: อนุมัติคำขอ, บันทึกแจกพัสดุ, และปรับปรุงสิทธิพนักงาน
          </p>
        </div>

        {/* แถบเมนูนำทาง (Tab Pills) */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-[#E2E8F0] overflow-x-auto">
          
          {/* เมนู 1: ภาพรวม */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ภาพรวมและสถิติ</span>
          </button>

          {/* เมนู 2: ตรวจสอบและอนุมัติ */}
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap relative ${
              activeTab === 'approval'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>อนุมัติคำขอ</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          {/* เมนู 3: บันทึกแจกจ่ายหน้างาน */}
          <button
            onClick={() => setActiveTab('distribution')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'distribution'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>แจกจ่ายหน้างาน</span>
          </button>

          {/* เมนู 4: จัดการสิทธิและโควตา */}
          <button
            onClick={() => setActiveTab('entitlements')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'entitlements'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>จัดการโควตาสิทธิ</span>
          </button>
        </div>
      </div>

      {/* เรนเดอร์หน้าจอตามเมนูที่เลือก */}
      <main>
        {activeTab === 'overview' && (
          <ManagerOverview onNavigateToApproval={() => setActiveTab('approval')} />
        )}
        {activeTab === 'approval' && <ApprovalView />}
        {activeTab === 'distribution' && <DirectDistributionView />}
        {activeTab === 'entitlements' && <EntitlementsManageView />}
      </main>
    </div>
  );
};

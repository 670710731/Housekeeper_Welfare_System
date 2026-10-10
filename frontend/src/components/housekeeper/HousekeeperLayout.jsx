import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import { EntitlementsView } from './EntitlementsView';
import { RequestFormModal } from './RequestFormModal';
import { RequestHistoryView } from './RequestHistoryView';
import {
  Layers,
  PlusCircle,
  Clock,
  Heart,
  Home,
  FileCheck
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: HousekeeperLayout
 * ==============================================================================
 * Layout หลักสำหรับฝั่งแม่บ้าน (Mobile-First Architecture)
 * 
 * คุณสมบัติ:
 * 1. รองรับการแสดงผลทั้งบนโทรศัพท์มือถือ แท็บเล็ต และคอมพิวเตอร์
 * 2. มี Navigation ทั้งแบบ Desktop Pills และ Mobile Bottom Bar
 * 3. มี Modal ยื่นคำขอสวัสดิการ (UC-04) ที่เปิดได้จากทุกหน้าจอ
 * ==============================================================================
 */
export const HousekeeperLayout = () => {
  const { currentUser, requests } = useWelfare();

  // State แท็บหลักที่เปิดอยู่ ('entitlements' | 'history')
  const [currentTab, setCurrentTab] = useState('entitlements');

  // State ควบคุมการเปิด/ปิด Modal ยื่นคำขอ (UC-04)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [targetWelfareId, setTargetWelfareId] = useState(null);

  // คำนวณจำนวนคำขอที่ยังค้างสถานะ Pending ของแม่บ้านคนนี้
  const pendingCount = requests.filter(
    (r) => r.userId === currentUser?.id && r.status === 'Pending'
  ).length;

  const handleOpenRequestForm = (welfareId = null) => {
    setTargetWelfareId(welfareId);
    setIsRequestModalOpen(true);
  };

  return (
    <div className="pb-24 sm:pb-12">
      
      {/* ส่วนหัวและเมนูนำทางหลักบนหน้าจอ Desktop/Tablet */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            ระบบสวัสดิการสำหรับพนักงานแม่บ้าน
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            ตรวจสอบสิทธิคงเหลือ ยื่นคำขอ และติดตามผลการอนุมัติ
          </p>
        </div>

        {/* แถบสลับหน้าจอ (Desktop Tabs) */}
        <div className="hidden sm:flex items-center bg-slate-100 p-1.5 rounded-xl border border-[#E2E8F0]">
          <button
            onClick={() => setCurrentTab('entitlements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentTab === 'entitlements'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>สิทธิและโควตาคงเหลือ</span>
          </button>

          <button
            onClick={() => setCurrentTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
              currentTab === 'history'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>ติดตามสถานะและประวัติ</span>
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* เนื้อหาตามแท็บที่เลือก */}
      <main>
        {currentTab === 'entitlements' ? (
          <EntitlementsView onOpenRequestForm={handleOpenRequestForm} />
        ) : (
          <RequestHistoryView />
        )}
      </main>

      {/* ========================================================================= */}
      {/* Mobile Bottom Navigation Bar (สำหรับหน้าจอมือถือโดยเฉพาะ) */}
      {/* ========================================================================= */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] shadow-lg px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('entitlements')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-all ${
            currentTab === 'entitlements' ? 'text-[#2563EB]' : 'text-[#64748B]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">หน้าแรก / สิทธิ</span>
        </button>

        {/* ปุ่มเด่นตรงกลาง: ยื่นขอสวัสดิการ (UC-04) */}
        <button
          onClick={() => handleOpenRequestForm()}
          className="flex flex-col items-center -mt-6 bg-[#2563EB] text-white p-3 rounded-full shadow-lg hover:bg-[#1D4ED8] active:scale-90 transition-all ring-4 ring-white"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-all relative ${
            currentTab === 'history' ? 'text-[#2563EB]' : 'text-[#64748B]'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px]">สถานะ / ประวัติ</span>
          {pendingCount > 0 && (
            <span className="absolute top-0 right-3 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>
      </nav>

      {/* Modal ยื่นคำขอสวัสดิการ (UC-04) */}
      <RequestFormModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setTargetWelfareId(null);
        }}
        initialWelfareId={targetWelfareId}
      />
    </div>
  );
};

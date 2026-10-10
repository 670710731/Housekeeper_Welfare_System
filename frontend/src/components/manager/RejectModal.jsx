import React, { useState } from 'react';
import { AlertCircle, X, Send } from 'lucide-react';

/**
 * ==============================================================================
 * Component: RejectModal
 * ==============================================================================
 * [UC-08] หน้าต่างระบุเหตุผลการไม่อนุมัติคำขอสวัสดิการ
 * 
 * คุณสมบัติ:
 * 1. รับ requestId และข้อมูลคำขอเพื่อแสดงสรุปให้หัวหน้างานทราบ
 * 2. มีช่องกรอกเหตุผลการปฏิเสธ (Reject Reason) พร้อมข้อความตัวอย่างที่พบบ่อย
 * 3. บันทึกเหตุผลลงใน State เพื่อให้ฝั่งแม่บ้านมองเห็นสาเหตุชัดเจน
 * ==============================================================================
 */
export const RejectModal = ({ isOpen, onClose, request, onConfirmReject }) => {
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    const success = await onConfirmReject(request.id, rejectReason.trim());
    if (success) {
      setRejectReason('');
      onClose();
    }
  };

  // ตัวอย่างเหตุผลสำเร็จรูปเพื่อความสะดวกรวดเร็วในการ Demo
  const quickReasons = [
    'โควตาสิทธิประจำปีครบแล้วตามระเบียบ',
    'เอกสารแนบหรือใบรับรองแพทย์ไม่ชัดเจน/ไม่ครบถ้วน',
    'ช่วงเวลาที่ขอตรงกับภารกิจบิ๊กคลีนนิ่งหอพัก กรุณาเลื่อนวัน',
    'พัสดุในคลังสินค้าชั่วคราวหมด อยู่ระหว่างจัดซื้อรอบใหม่'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-fadeIn">
        
        {/* Header Modal */}
        <div className="bg-red-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm">ระบุเหตุผลการไม่อนุมัติคำขอ</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* ข้อมูลคำขอที่กำลังจะปฏิเสธ */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">รหัสคำขอ:</span>
              <span className="font-mono font-bold text-[#0F172A]">{request.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">ผู้ยื่นคำขอ:</span>
              <span className="font-bold text-[#0F172A]">{request.applicantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">รายการที่ขอ:</span>
              <span className="font-bold text-[#2563EB]">
                {request.policyName} ({request.amount} {request.unit})
              </span>
            </div>
          </div>

          {/* ช่องกรอกเหตุผล */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              เหตุผลการไม่อนุมัติ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผลเพื่อให้แม่บ้านทราบและดำเนินการแก้ไข..."
              className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
              required
            />
          </div>

          {/* ปุ่มข้อความสำเร็จรูปสำหรับ Demo */}
          <div>
            <span className="text-[11px] text-[#64748B] font-medium block mb-1">
              เหตุผลมาตรฐานที่พบบ่อย (คลิกเพื่อเลือก):
            </span>
            <div className="space-y-1">
              {quickReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
                  className="w-full text-left text-[11px] p-1.5 bg-slate-50 hover:bg-red-50 hover:text-red-700 rounded text-slate-600 transition-colors border border-slate-100"
                >
                  • {reason}
                </button>
              ))}
            </div>
          </div>

          {/* ปุ่มกดยืนยัน */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 border border-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!rejectReason.trim()}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ยืนยันปฏิเสธ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

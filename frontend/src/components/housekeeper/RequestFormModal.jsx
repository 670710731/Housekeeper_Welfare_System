import React, { useState, useEffect } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import { PolicyIcon } from '../common/PolicyIcon';
import {
  X,
  Send,
  Paperclip,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  Info
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: RequestFormModal
 * ==============================================================================
 * [UC-04] ฟังก์ชันและหน้าจอยื่นคำขอสวัสดิการ (Welfare Request Form)
 * 
 * คุณสมบัติ:
 * 1. เลือกประเภทสวัสดิการ (ลาป่วย, ลาพักร้อน, ยูนิฟอร์ม, อุปกรณ์, เงินรักษาพยาบาล)
 * 2. แสดงสิทธิคงเหลือแบบ Real-time ตามประเภทที่เลือก
 * 3. กรอกจำนวนที่ต้องการ พร้อมระบบ Validation ป้องกันการขอเกินสิทธิคงเหลือ
 * 4. ระบุเหตุผลความจำเป็น
 * 5. จำลองการแนบเอกสารหลักฐาน (เช่น ใบรับรองแพทย์, ใบเสร็จรับเงิน)
 * 6. ส่งคำขอเข้าสู่ State กลาง สถานะ 'Pending' เพื่อรอหัวหน้างานอนุมัติ
 * ==============================================================================
 */
export const RequestFormModal = ({ isOpen, onClose, initialWelfareId = null }) => {
  const { currentUser, welfarePolicies, getUserEntitlements, submitWelfareRequest } = useWelfare();

  // State ฟอร์ม
  const [selectedWelfareId, setSelectedWelfareId] = useState('WF01');
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // เมื่อเปิด Modal ให้ตั้งค่า Welfare ID เริ่มต้น (ถ้ามีส่งมา)
  useEffect(() => {
    if (initialWelfareId) {
      setSelectedWelfareId(initialWelfareId);
    } else {
      setSelectedWelfareId('WF01');
    }
    setAmount(1);
    setReason('');
    setAttachmentName('');
  }, [initialWelfareId, isOpen]);

  if (!isOpen || !currentUser) return null;

  // ดึงสิทธิทั้งหมดของแม่บ้านคนนี้ เพื่อนำมาคำนวณและตรวจสอบ
  const userEntitlements = getUserEntitlements(currentUser.id);

  // สิทธิคงเหลือของสวัสดิการที่เลือกอยู่ในขณะนี้
  const currentEntitlement = userEntitlements.find((e) => e.welfareId === selectedWelfareId);
  const selectedPolicy = welfarePolicies.find((p) => p.id === selectedWelfareId);

  const remainingQuota = currentEntitlement ? currentEntitlement.remaining : 0;
  const unit = selectedPolicy ? selectedPolicy.unit : 'หน่วย';

  // ตรวจสอบเงื่อนไขว่าขอเกินสิทธิหรือไม่ (Business Rule Validation)
  const isExceedingQuota = Number(amount) > remainingQuota;
  const isInvalidAmount = Number(amount) <= 0 || isNaN(Number(amount));
  const isFormValid =
    !isExceedingQuota &&
    !isInvalidAmount &&
    reason.trim().length > 0 &&
    (!selectedPolicy?.requiresAttachment || attachmentName.trim().length > 0);

  // ส่งฟอร์ม
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    const result = submitWelfareRequest({
      welfareId: selectedWelfareId,
      amount: Number(amount),
      reason,
      attachmentName
    });

    setIsSubmitting(false);
    if (result.success) {
      onClose();
    }
  };

  // ตัวอย่างไฟล์จำลองสำหรับคลิกแนบเอกสารง่ายๆ ในการเดโม
  const sampleAttachments = [
    'ใบรับรองแพทย์_รพ.ศิริราช_2569.pdf',
    'ใบเสร็จรับเงิน_คลินิกเวชกรรม.jpg',
    'รูปถ่ายชุดปฏิบัติงานชำรุด.png',
    'รูปถ่ายอุปกรณ์ทำความสะอาดชำรุด.jpg'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-fadeIn">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">ยื่นคำขอสวัสดิการใหม่</h3>
              <p className="text-xs text-blue-100">แบบฟอร์มขอใช้สิทธิและเบิกพัสดุ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* 1. เลือกประเภทสวัสดิการ */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              1. เลือกประเภทสวัสดิการที่ต้องการขอ <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {welfarePolicies.map((policy) => {
                const ent = userEntitlements.find((e) => e.welfareId === policy.id);
                const isSelected = selectedWelfareId === policy.id;
                const rem = ent ? ent.remaining : 0;
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => {
                      setSelectedWelfareId(policy.id);
                      if (policy.category === 'fund') {
                        setAmount(500);
                      } else {
                        setAmount(1);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#DBEAFE]/40 ring-1 ring-[#2563EB]'
                        : 'border-[#E2E8F0] hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#2563EB] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <PolicyIcon name={policy.iconName} className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-[#0F172A] truncate">{policy.name.split('(')[0]}</p>
                      <p className="text-[10px] text-[#64748B]">คงเหลือ: {rem} {policy.unit}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* กล่องสรุปสิทธิคงเหลือปัจจุบัน */}
          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#64748B]">สิทธิคงเหลือของคุณ:</span>
              <div className="text-sm font-bold text-[#0F172A]">
                {selectedPolicy?.name}
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-extrabold ${remainingQuota === 0 ? 'text-red-600' : 'text-[#2563EB]'}`}>
                {remainingQuota.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-[#64748B] ml-1">{unit}</span>
            </div>
          </div>

          {/* 2. จำนวนที่ต้องการขอ */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                2. ระบุจำนวนที่ขอ ({unit}) <span className="text-red-500">*</span>
              </label>
              {isExceedingQuota && (
                <span className="text-xs text-[#DC2626] font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> ขอเกินสิทธิคงเหลือ ({remainingQuota} {unit})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={remainingQuota > 0 ? remainingQuota : 1}
                step={selectedPolicy?.category === 'fund' ? '100' : '1'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`flex-1 px-3.5 py-2.5 text-sm bg-white border rounded-xl outline-none transition-all font-semibold ${
                  isExceedingQuota
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-600'
                    : 'border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB]'
                }`}
                placeholder={`ระบุจำนวน (${unit})`}
                required
              />
              <span className="text-xs font-medium text-[#64748B] px-3 py-2 bg-slate-100 rounded-xl">
                {unit}
              </span>
            </div>
          </div>

          {/* 3. เหตุผลความจำเป็น */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              3. เหตุผลความจำเป็นในการขอ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น มีไข้สูงไปพบแพทย์, ขอลาพักผ่อน, ชุดชำรุดเสียหาย..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] outline-none transition-all"
              required
            />
          </div>

          {/* 4. จำลองการแนบเอกสาร (สำหรับ ลาป่วย / ค่ารักษาพยาบาล) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>4. แนบเอกสารหลักฐาน</span>
                {selectedPolicy?.requiresAttachment && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                    จำเป็นสำหรับสวัสดิการนี้
                  </span>
                )}
              </label>
            </div>

            {/* แสดงชื่อไฟล์ที่เลือก */}
            {attachmentName ? (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-blue-900 font-medium truncate">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{attachmentName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachmentName('')}
                  className="text-xs text-red-600 hover:underline ml-2"
                >
                  ลบ
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[11px] text-[#64748B]">
                  เลือกเอกสารหลักฐานแนบ:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sampleAttachments.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAttachmentName(file)}
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                    >
                      + {file}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ข้อความแจ้งเตือนกรณีโควตาไม่พอ */}
          {remainingQuota === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>ท่านใช้สิทธิสำหรับรายการนี้ครบโควตาแล้ว ไม่สามารถส่งคำขอเพิ่มได้</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors border border-slate-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md shadow-blue-500/20 active:scale-[0.98]'
                  : 'bg-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>ยืนยันส่งคำขอสวัสดิการ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

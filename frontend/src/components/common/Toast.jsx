import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useWelfare } from '../../context/WelfareContext';

/**
 * ==============================================================================
 * Component: Toast Notification
 * ==============================================================================
 * หน้าที่: แสดงข้อความแจ้งเตือนผลลัพธ์การกระทำ เช่น "อนุมัติสำเร็จ", "สิทธิคงเหลือไม่พอ"
 * ใช้ชุดสีตาม Design System: Welfare Care
 * ==============================================================================
 */
export const Toast = () => {
  const { toast } = useWelfare();

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-500 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-500 text-red-900',
          icon: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-500 text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-500 text-blue-900',
          icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        };
    }
  };

  const style = getStyle();

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-bounce-once shadow-xl rounded-xl">
      <div
        className={`flex items-center gap-3 px-4 py-3 border-l-4 rounded-xl shadow-lg ${style.bg}`}
      >
        {style.icon}
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useWelfare } from '../../context/WelfareContext';
import {
  ShieldCheck,
  User,
  Key,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  Heart,
  Lock
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: LoginScreen
 * ==============================================================================
 * [UC-01] หน้าจอเข้าสู่ระบบมาตรฐาน (Standard Enterprise Authentication)
 * ออกแบบตาม Design System: Welfare Care
 * 
 * คุณสมบัติ:
 * 1. ฟอร์มเข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่าน
 * 2. แถบสลับบทบาท:
 *    - "สำหรับแม่บ้าน (Housekeeper)"
 *    - "สำหรับหัวหน้างาน (Manager)"
 * 3. ช่องกรอกข้อมูลมาตรฐาน:
 *    - เบอร์โทรศัพท์
 *    - รหัสผ่าน (Password) พร้อมปุ่ม Toggle แสดง/ซ่อนรหัสผ่าน
 *    - ปุ่มเข้าสู่ระบบ (Primary-500)
 * 4. ส่งข้อมูลเข้าสู่ระบบ Backend และรับ JWT สำหรับเรียก API ที่ต้องยืนยันตัวตน
 * 5. ข้อความแนะนำการเข้าสู่ระบบด้านล่างฟอร์ม
 * ==============================================================================
 */
export const LoginScreen = () => {
  const { login } = useWelfare();

  // State แท็บประเภทผู้ใช้งาน ('housekeeper' | 'manager')
  const [activeTab, setActiveTab] = useState('housekeeper');

  // State ค่าที่กรอกในฟอร์ม (เริ่มต้นเป็นค่าว่างเพื่อให้ดูเป็นระบบมาตรฐาน)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // State แสดง/ซ่อนรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);

  // State สถานะกำลังเข้าสู่ระบบ
  const [isLoading, setIsLoading] = useState(false);

  /**
   * เมื่อสลับแท็บบทบาท (แม่บ้าน vs หัวหน้างาน)
   * ปรับเปลี่ยน placeholder และเคลียร์หรือเตรียมค่าสำหรับบทบาทนั้น
   */
  const handleTabChange = (role) => {
    setActiveTab(role);
    setPhone('');
    setPassword('');
  };

  /**
   * [UC-01] ฟังก์ชัน Submit ฟอร์มเข้าสู่ระบบ
   * ส่งรหัสพนักงาน/รหัสผู้ใช้งานเข้าตรวจสอบที่ WelfareContext
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await login(phone, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* การ์ดฟอร์มเข้าสู่ระบบหลัก (Centered Card) */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] overflow-hidden">
        
        {/* ส่วนหัวของฟอร์ม (Header สไตล์ Welfare Care) */}
        <div className="bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md mb-2.5 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Welfare Care</h1>
          <p className="text-xs text-blue-100 mt-0.5">
            ระบบจัดการสวัสดิการและสิทธิประโยชน์แม่บ้านหอพัก
          </p>
        </div>

        <div className="p-6 sm:p-8">
          
          {/* [2] แถบสลับบทบาทผู้ใช้งาน */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-6 border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => handleTabChange('housekeeper')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'housekeeper'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>สำหรับแม่บ้าน</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('manager')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'manager'
                  ? 'bg-white text-[#2563EB] shadow-sm'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>สำหรับหัวหน้างาน</span>
            </button>
          </div>

          {/* [3] ฟอร์มเข้าสู่ระบบมาตรฐาน */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ช่องที่ 1: รหัสผู้ใช้งาน / รหัสพนักงาน */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={
                    activeTab === 'housekeeper'
                      ? 'กรอกเบอร์โทรศัพท์ที่ลงทะเบียน'
                      : 'กรอกเบอร์โทรศัพท์ HR'
                  }
                  className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all font-medium text-[#0F172A]"
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* ช่องที่ 2: รหัสผ่าน */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                รหัสผ่าน (Password) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-[#F8FAFC] focus:bg-white border border-[#E2E8F0] rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all font-medium text-[#0F172A]"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#0F172A]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ปุ่มกดเข้าสู่ระบบ (Primary-500) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-xs sm:text-sm disabled:opacity-70"
            >
              <span>{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* [5] ข้อความคำแนะนำสั้น ๆ ด้านล่างฟอร์ม (Text Muted) */}
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] text-center">
            <p className="text-[11px] text-[#64748B] flex items-center justify-center gap-1.5">
              <span>ใช้เบอร์โทรศัพท์และรหัสผ่านที่ลงทะเบียนไว้ในระบบ</span>
            </p>
          </div>
        </div>
      </div>

      {/* ลิขสิทธิ์และสังกัดอย่างเป็นทางการ */}
      <div className="mt-5 text-center text-xs text-[#64748B]">
        <p>© 2026 มหาวิทยาลัยศิลปากร • งานสวัสดิการและบริการหอพัก</p>
      </div>
    </div>
  );
};

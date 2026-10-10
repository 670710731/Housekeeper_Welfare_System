/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // [DESIGN SYSTEM: Welfare Care]
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE', // Badge พื้นหลัง, Selection highlight
          500: '#2563EB', // ปุ่มหลัก, สัญลักษณ์สำคัญ
          600: '#1D4ED8', // Hover state
          700: '#1E40AF',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1', // Secondary highlight
          500: '#0D9488', // Secondary accent
          600: '#0F766E',
        },
        status: {
          success: '#16A34A', // อนุมัติแล้ว, มีสิทธิคงเหลือ
          warning: '#D97706', // รอดำเนินการ, โควตาใกล้หมด
          error: '#DC2626',   // ไม่อนุมัติ, เกินสิทธิ
          info: '#2563EB',    // ข้อมูลทั่วไป
        },
        neutral: {
          bg: '#F8FAFC',      // Background
          surface: '#FFFFFF', // Card & Surface
          border: '#E2E8F0',  // Border line
          text: '#0F172A',    // Main text
          muted: '#64748B',   // Text muted
          disabled: '#94A3B8' // Disabled state
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

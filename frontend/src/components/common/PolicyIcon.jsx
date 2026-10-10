import React from 'react';
import {
  HeartPulse,
  Calendar,
  Shirt,
  Sparkles,
  CircleDollarSign,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

/**
 * ==============================================================================
 * Component: PolicyIcon
 * ==============================================================================
 * หน้าที่: เรนเดอร์ Icon ของสวัสดิการแต่ละประเภทอย่างยืดหยุ่นตามชื่อไอคอน
 * เพื่อให้ UI สวยงาม เข้าใจง่าย เหมาะกับการนำเสนอ
 * ==============================================================================
 */
export const PolicyIcon = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Calendar':
      return <Calendar className={className} />;
    case 'Shirt':
      return <Shirt className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'CircleDollarSign':
      return <CircleDollarSign className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Clock':
      return <Clock className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'XCircle':
      return <XCircle className={className} />;
    case 'User':
      return <User className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'PackageCheck':
      return <PackageCheck className={className} />;
    default:
      return <HelpCircle className={className} />;
  }
};

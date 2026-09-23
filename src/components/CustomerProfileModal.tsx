import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ArrowRight, 
  User, 
  CreditCard, 
  Phone, 
  FileText, 
  Calendar, 
  ShieldAlert, 
  Layers, 
  BadgeCheck,
  Clock,
  DollarSign,
  Package,
  MessageSquare,
  Upload,
  Eye,
  Download,
  Trash2,
  FileCheck2,
  FileSpreadsheet,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { 
  PortfolioRecord, 
  CustomerAttachment, 
  DEFAULT_ATTACHMENT_SLOTS, 
  AttachmentSlotConfig 
} from '../types';
import { 
  getCustomerKey, 
  loadCustomerAttachments, 
  saveCustomerAttachment, 
  deleteCustomerAttachment, 
  formatFileSize, 
  fileToDataUrl 
} from '../utils/customerAttachmentsStorage';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';
import { normalizeArabicNumerals, formatSaudiMobileInternational } from '../utils/whatsappHelper';

interface CustomerProfileModalProps {
  customerAccount: string | null;
  allRecords: PortfolioRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customerAccount,
  allRecords,
  isOpen,
  onClose
}) => {
  // Attachment Slots State
  const [attachments, setAttachments] = useState<Record<number, CustomerAttachment>>({});
  const [isLoadingAttachments, setIsLoadingAttachments] = useState<boolean>(false);
  const [previewAttachment, setPreviewAttachment] = useState<CustomerAttachment | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden File Inputs for 4 Slots
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Find all requests belonging to this customer account number (or name if account is empty)
  const normalizedAccount = (customerAccount || '').trim();
  const customerRequests = normalizedAccount
    ? allRecords.filter(
        (r) => 
          (r.accountNumber && r.accountNumber.trim() === normalizedAccount) || 
          (r.customerName && r.customerName.trim() === normalizedAccount) ||
          (r.nationalId && r.nationalId.trim() === normalizedAccount)
      )
    : [];

  const primaryRecord = customerRequests[0] || {} as PortfolioRecord;
  const customerKey = getCustomerKey(primaryRecord.accountNumber, primaryRecord.customerName, primaryRecord.nationalId);

  // Load attachments whenever modal opens or customerKey changes
  useEffect(() => {
    let isMounted = true;
    if (isOpen && customerKey) {
      setIsLoadingAttachments(true);
      setUploadError(null);
      loadCustomerAttachments(customerKey)
        .then((loaded) => {
          if (isMounted) {
            setAttachments(loaded);
          }
        })
        .catch((err) => {
          console.error('Failed to load attachments:', err);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingAttachments(false);
          }
        });
    } else if (!isOpen) {
      setAttachments({});
      setUploadError(null);
      setCopiedPhone(false);
      setCopiedMessage(false);
      setPreviewAttachment(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, customerKey]);

  if (!isOpen || !customerAccount) return null;

  // Clean and format WhatsApp phone number (Saudi Arabia priority)
  const getWhatsAppDetails = (rawPhone?: string) => {
    if (!rawPhone || !rawPhone.trim()) {
      return { isValid: false, formattedPhone: '', waUrl: '', displayPhone: 'غير متوفر' };
    }

    const cleanedDigits = rawPhone.replace(/[^0-9]/g, '');
    if (cleanedDigits.length < 7) {
      return { isValid: false, formattedPhone: rawPhone, waUrl: '', displayPhone: rawPhone };
    }

    let internationalNumber = cleanedDigits;

    // Saudi Arabia format transformations
    if (cleanedDigits.startsWith('00966')) {
      internationalNumber = cleanedDigits.substring(2);
    } else if (cleanedDigits.startsWith('05') && cleanedDigits.length === 10) {
      internationalNumber = `9665${cleanedDigits.substring(2)}`;
    } else if (cleanedDigits.startsWith('5') && cleanedDigits.length === 9) {
      internationalNumber = `966${cleanedDigits}`;
    } else if (!cleanedDigits.startsWith('966') && cleanedDigits.length === 9) {
      internationalNumber = `966${cleanedDigits}`;
    }

    // Prepare default greeting message
    const customerGreetingName = primaryRecord.customerName ? `الأستاذ/ة ${primaryRecord.customerName}` : 'عزيزي العميل';
    const accNumberText = primaryRecord.accountNumber ? `رقم الحساب: ${primaryRecord.accountNumber}` : '';
    const reqTypeText = primaryRecord.requestType ? `بخصوص طلب: ${primaryRecord.requestType}` : '';
    const reqNumText = primaryRecord.requestNumber ? `رقم الطلب: ${primaryRecord.requestNumber}` : '';
    
    const messageLines = [
      `السلام عليكم ورحمة الله وبركاته،`,
      customerGreetingName,
      accNumberText,
      reqTypeText,
      reqNumText,
      `نود التواصل معكم بخصوص معاملتكم المسجلة لدينا. شاكرين لكم تعاونكم.`
    ].filter(Boolean).join('\n');

    const waUrl = `https://wa.me/${internationalNumber}?text=${encodeURIComponent(messageLines)}`;

    return {
      isValid: true,
      formattedPhone: internationalNumber,
      displayPhone: rawPhone,
      waUrl,
      defaultMessage: messageLines
    };
  };

  const whatsappInfo = getWhatsAppDetails(primaryRecord.mobileNumber);

  // Handle File Upload for a specific slot (0 to 3)
  const handleSlotFileUpload = async (slotIndex: number, file: File) => {
    if (!file) return;

    // Validate size (up to 15MB)
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(`حجم الملف كبير جداً (${formatFileSize(file.size)}). الحد الأقصى المسموح به هو 15 ميجابايت.`);
      return;
    }

    setUploadError(null);

    try {
      const dataUrl = await fileToDataUrl(file);
      const slotConfig = DEFAULT_ATTACHMENT_SLOTS[slotIndex] || { title: `مستند ${slotIndex + 1}` };
      
      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat('ar-SA', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(now);

      const newAttachment: CustomerAttachment = {
        id: `${customerKey}_slot_${slotIndex}`,
        customerKey,
        slotIndex,
        slotTitle: slotConfig.title,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        uploadedAt: now.toISOString(),
        formattedDate,
        dataUrl
      };

      await saveCustomerAttachment(newAttachment);

      setAttachments((prev) => ({
        ...prev,
        [slotIndex]: newAttachment
      }));
    } catch (err) {
      console.error('Error processing attachment file:', err);
      setUploadError('حدث خطأ أثناء رفع وحفظ الملف. يرجى المحاولة مرة أخرى.');
    }
  };

  // Handle Slot Deletion
  const handleSlotDelete = async (slotIndex: number) => {
    const slot = attachments[slotIndex];
    if (!slot) return;

    if (window.confirm(`هل أنت متأكد من رغبتك في حذف مستند «${slot.fileName}»؟`)) {
      await deleteCustomerAttachment(customerKey, slotIndex);
      setAttachments((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').trim();
    if (s.includes('مكتمل') || s.includes('منتهي') || s.includes('تم') || s.includes('موافق') || s.includes('closed')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('مرفوض') || s.includes('ملغي') || s.includes('rejected')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('تحت') || s.includes('معلق') || s.includes('انتظار') || s.includes('جاري') || s.includes('pending')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Get file icon based on mime type or extension
  const getFileIcon = (fileType: string, fileName: string) => {
    if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(fileName)) {
      return <ImageIcon className="w-5 h-5 text-teal-600" />;
    }
    if (fileType === 'application/pdf' || /\.pdf$/i.test(fileName)) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (fileType.includes('sheet') || /\.xlsx?$/i.test(fileName)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    return <Paperclip className="w-5 h-5 text-blue-600" />;
  };

  const totalUploadedCount = Object.keys(attachments).length;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        dir="rtl"
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden text-slate-800 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="p-3.5 sm:p-6 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-xl font-black text-white truncate">
                    ملف العميل والمستندات
                  </h2>
                  <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    حساب: {primaryRecord.accountNumber || '—'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                  تفاصيل العميل، التواصل المباشر، ورفع وإدارة المستندات
                </p>
              </div>
            </div>

            <button
              id="back-to-portfolio-header-btn"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer shrink-0"
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">العودة</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-slate-50/50">
            {/* Top Section: Basic Customer Info & Quick WhatsApp Action */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 gap-2.5 sm:gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">اسم العميل</span>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900">
                    {primaryRecord.customerName || 'اسم العميل غير متوفر'}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {primaryRecord.freezeDate && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[10px] sm:text-xs font-bold">
                      <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>تجميد: {primaryRecord.freezeDate}</span>
                    </div>
                  )}

                  {/* 🟢 WhatsApp Contact Button */}
                  {whatsappInfo.isValid ? (
                    <a
                      id="customer-whatsapp-btn"
                      href={whatsappInfo.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>واتساب</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] sm:text-xs font-bold border border-slate-200 cursor-not-allowed"
                      title="رقم الجوال غير مسجل أو غير صالح"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>واتساب (غير متوفر)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Core Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3.5 text-[10px] sm:text-xs">
                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 sm:space-y-1">
                  <span className="text-slate-500 flex items-center gap-1 text-[10px] sm:text-xs">
                    <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    رقم الحساب
                  </span>
                  <p className="font-bold text-slate-900 font-mono text-xs sm:text-sm tracking-wide truncate">
                    {primaryRecord.accountNumber || '—'}
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-0.5 sm:space-y-1">
                  <span className="text-emerald-800 font-medium flex items-center gap-1 text-[10px] sm:text-xs">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                    المديونية
                  </span>
                  <p className="font-bold text-emerald-700 font-mono text-xs sm:text-sm truncate">
                    {primaryRecord.debtAmount || '—'}
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 sm:space-y-1">
                  <span className="text-slate-500 flex items-center gap-1 text-[10px] sm:text-xs">
                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    المنتج
                  </span>
                  <p className="font-bold text-slate-800 truncate text-xs sm:text-sm" title={primaryRecord.productType}>
                    {primaryRecord.productType || '—'}
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 sm:space-y-1">
                  <span className="text-slate-500 flex items-center gap-1 text-[10px] sm:text-xs">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                    الهوية
                  </span>
                  <p className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate">
                    {primaryRecord.nationalId || '—'}
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5 sm:space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                      الجوال
                    </span>
                    {primaryRecord.mobileNumber && (
                      <button
                        onClick={() => {
                          const formatted = formatSaudiMobileInternational(primaryRecord.mobileNumber);
                          navigator.clipboard.writeText(formatted || primaryRecord.mobileNumber || '');
                          setCopiedPhone(true);
                          setTimeout(() => setCopiedPhone(false), 2000);
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                        title="نسخ رقم الجوال"
                      >
                        {copiedPhone ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate" dir="ltr">
                    {primaryRecord.mobileNumber ? normalizeArabicNumerals(formatSaudiMobileInternational(primaryRecord.mobileNumber)) : '—'}
                  </p>
                </div>

                <div className="p-2.5 sm:p-3 bg-teal-50/60 rounded-xl border border-teal-100 space-y-0.5 sm:space-y-1">
                  <span className="text-teal-800 font-medium flex items-center gap-1 text-[10px] sm:text-xs">
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600" />
                    الطلبات
                  </span>
                  <p className="font-bold text-teal-700 text-xs sm:text-sm font-mono">
                    {customerRequests.length} {customerRequests.length === 1 ? 'طلب' : 'طلبات'}
                  </p>
                </div>
              </div>
            </div>

            {/* 📁 Section 2: 4 Attachment Slots (4 حقول لرفع المستندات والملفات) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 sm:pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <span>مستندات ومرفقات العميل</span>
                      <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold font-mono">
                        {totalUploadedCount} / 4
                      </span>
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                      ارفع واحفظ ملفات PDF أو الصور المرتبطة بحساب العميل
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Error Banner if any */}
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[10px] sm:text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* 4 Attachment Slots Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                {DEFAULT_ATTACHMENT_SLOTS.map((slotConfig, slotIdx) => {
                  const uploadedFile = attachments[slotIdx];

                  return (
                    <div 
                      key={slotConfig.index}
                      className={`rounded-2xl border transition overflow-hidden ${
                        uploadedFile 
                          ? 'border-emerald-200 bg-emerald-50/20 shadow-xs' 
                          : 'border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={(el) => (fileInputRefs.current[slotIdx] = el)}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleSlotFileUpload(slotIdx, file);
                          }
                          e.target.value = ''; // Reset input
                        }}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt"
                        className="hidden"
                      />

                      {uploadedFile ? (
                        /* Slot State: File is Uploaded */
                        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                          {/* Slot Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                              <span>{slotConfig.title}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                              مرفوع
                            </span>
                          </div>

                          {/* File Details Card */}
                          <div className="flex items-center gap-2.5 p-2 sm:p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              {getFileIcon(uploadedFile.fileType, uploadedFile.fileName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate" title={uploadedFile.fileName}>
                                {uploadedFile.fileName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                                <span>{formatFileSize(uploadedFile.fileSize)}</span>
                                <span>•</span>
                                <span>{uploadedFile.formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(uploadedFile)}
                              className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                              <span>معاينة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = uploadedFile.dataUrl;
                                a.download = uploadedFile.fileName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }}
                              className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>تحميل</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[slotIdx]?.click()}
                              className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition cursor-pointer"
                              title="استبدال الملف"
                            >
                              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSlotDelete(slotIdx)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                              title="حذف المستند"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Slot State: Empty Slot (Ready for Upload) */
                        <div 
                          className="p-3.5 sm:p-5 flex flex-col items-center justify-center text-center space-y-1.5 sm:space-y-2 cursor-pointer group"
                          onClick={() => fileInputRefs.current[slotIdx]?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file) {
                              handleSlotFileUpload(slotIdx, file);
                            }
                          }}
                        >
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-600 border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center transition shadow-2xs">
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[11px] sm:text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition block">
                              {slotConfig.title}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-500 block">
                              {slotConfig.subtitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400 pt-0.5">
                            {slotConfig.suggestedTypes.map((t) => (
                              <span key={t} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Customer Requests Details */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>طلبات ومعاملات العميل</span>
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold font-mono">
                    {customerRequests.length}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                  حساب: {primaryRecord.accountNumber}
                </span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {customerRequests.map((req, idx) => (
                  <div 
                    key={req.id || idx}
                    className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-slate-300 hover:bg-slate-50 transition space-y-2 sm:space-y-3"
                  >
                    {/* Request Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-900 text-white text-[10px] sm:text-xs font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-[10px] sm:text-xs text-slate-400 block">نوع الطلب</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {req.requestType || 'نوع الطلب غير محدد'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.requestStatus && (
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-bold border ${getStatusBadge(req.requestStatus)}`}>
                            {req.requestStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-[11px] sm:text-xs">
                      <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block mb-0.5 text-[10px] sm:text-xs">رقم الطلب / المعاملة:</span>
                        <span className="font-bold font-mono text-slate-900 text-xs sm:text-sm">
                          {req.requestNumber || '—'}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block mb-0.5 text-[10px] sm:text-xs">تاريخ فتح الطلب:</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 font-mono text-xs sm:text-sm">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {req.requestOpenDate || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Request Description / Notes */}
                    {req.description && (
                      <div className="bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/80 text-[11px] sm:text-xs space-y-1">
                        <span className="font-bold text-slate-700 block text-[10px] sm:text-xs">الوصف وملاحظات الطلب:</span>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {req.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            <span className="text-[10px] sm:text-xs text-slate-500 text-center sm:text-right">
              🔒 حفظ المستندات محلياً بأمان ومطابقة لبيانات الحساب
            </span>
            <button
              id="return-to-portfolio-btn"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى المحفظة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Preview Modal (For PDF / Images) */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        isOpen={Boolean(previewAttachment)}
        onClose={() => setPreviewAttachment(null)}
      />
    </>
  );
};

export interface PortfolioRecord {
  id: string; // Unique internal row identifier
  accountNumber: string; // 1. رقم الحساب
  debtAmount: string; // 2. مبلغ المديونية
  customerName: string; // 3. اسم العميل
  productType: string; // 4. نوع المنتج
  nationalId: string; // 5. رقم الهوية
  freezeDate: string; // 6. تاريخ التجميد
  mobileNumber: string; // 7. رقم الجوال
  requestType: string; // 8. نوع الطلب
  requestNumber: string; // 9. رقم الطلب
  requestStatus: string; // 10. حالة الطلب
  requestOpenDate: string; // 11. تاريخ فتح الطلب (YYYY-MM-DD or formatted date)
  description: string; // 12. الوصف
  rawParsedDate?: Date | null; // For accurate date sorting/filtering
}

export type RequiredColumnKey = 
  | 'accountNumber'
  | 'debtAmount'
  | 'customerName'
  | 'productType'
  | 'nationalId'
  | 'freezeDate'
  | 'mobileNumber'
  | 'requestType'
  | 'requestNumber'
  | 'requestStatus'
  | 'requestOpenDate'
  | 'description';

export interface ColumnDefinition {
  key: RequiredColumnKey;
  label: string; // Strict Arabic Header
  aliases: string[]; // Known aliases & synonyms
  order: number;
}

export const PORTFOLIO_COLUMNS: ColumnDefinition[] = [
  {
    key: 'accountNumber',
    label: 'رقم الحساب',
    order: 1,
    aliases: [
      'رقم الحساب',
      'الحساب',
      'ACCOUNT_NUMBER',
      'ACCOUNT NUMBER',
      'ACCOUNT_NO',
      'ACCOUNT NO',
      'ACCOUNT',
      'ACC_NO',
      'ACC NO',
      'رقم الحساب البنكي',
      'رقم حساب'
    ]
  },
  {
    key: 'debtAmount',
    label: 'مبلغ المديونية',
    order: 2,
    aliases: [
      'مبلغ المديونية',
      'المبلغ',
      'المديونية',
      'LOAN_BALANCE',
      'LOAN BALANCE',
      'BALANCE',
      'إجمالي المديونية',
      'مبلغ الدين',
      'الرصيد المدين',
      'قيمة المديونية',
      'المبلغ المستحق',
      'رصيد المديونية',
      'OUTSTANDING_BALANCE',
      'DUE_AMOUNT',
      'DEBT_AMOUNT',
      'DEBT'
    ]
  },
  {
    key: 'customerName',
    label: 'اسم العميل',
    order: 3,
    aliases: [
      'اسم العميل',
      'العميل',
      'CUST_NAME',
      'CUST NAME',
      'CUSTOMER_NAME',
      'CUSTOMER NAME',
      'CLIENT_NAME',
      'CLIENT NAME',
      'الاسم',
      'اسم العميل الكامل',
      'اسم صاحب الحساب',
      'NAME',
      'FULL_NAME',
      'CUSTOMER',
      'CLIENT'
    ]
  },
  {
    key: 'productType',
    label: 'نوع المنتج',
    order: 4,
    aliases: [
      'نوع المنتج',
      'المنتج',
      'PRODUCT_CATEGORY',
      'PRODUCT CATEGORY',
      'PRODUCT',
      'PRODUCT_TYPE',
      'PRODUCT TYPE',
      'اسم المنتج',
      'نوع التمويل',
      'نوع الحساب',
      'FACILITY_TYPE'
    ]
  },
  {
    key: 'nationalId',
    label: 'رقم الهوية',
    order: 5,
    aliases: [
      'رقم الهوية',
      'الهوية',
      'ID',
      'CUS_ID_NO',
      'CUS ID NO',
      'NATIONAL_ID',
      'NATIONAL ID',
      'ID_NUMBER',
      'ID NUMBER',
      'السجل المدني',
      'رقم السجل المدني',
      'رقم الإقامة',
      'رقم بطاقة الأحوال',
      'الهوية الوطنية',
      'هوية العميل',
      'IQAMA',
      'CIVIL_ID'
    ]
  },
  {
    key: 'freezeDate',
    label: 'تاريخ التجميد',
    order: 6,
    aliases: [
      'تاريخ التجميد',
      'التجميد',
      'FREEZE_DATE',
      'FREEZE DATE',
      'BLOCK_DATE',
      'BLOCK DATE',
      'FROZEN_DATE',
      'تاريخ الحظر',
      'تاريخ الإيقاف',
      'تاريخ تجميد الحساب',
      'SUSPENSION_DATE'
    ]
  },
  {
    key: 'mobileNumber',
    label: 'رقم الجوال',
    order: 7,
    aliases: [
      'رقم الجوال',
      'الجوال',
      'الهاتف',
      'رقم الهاتف',
      'MOBILE_NUMBER',
      'MOBILE NUMBER',
      'MOBILE',
      'PHONE',
      'PHONE_NUMBER',
      'PHONE NUMBER',
      'رقم المحمول',
      'جوال العميل',
      'هاتف العميل',
      'MOBILE_NO',
      'CONTACT_NUMBER'
    ]
  },
  {
    key: 'requestType',
    label: 'نوع الطلب',
    order: 8,
    aliases: [
      'نوع الطلب',
      'التصنيف الفرعي',
      'نوع طلب الخدمة',
      'REQUEST_TYPE',
      'REQUEST TYPE',
      'SUB_CATEGORY',
      'SERVICE_REQUEST_TYPE',
      'الطلب',
      'نوع المعاملة',
      'نوع التذكرة',
      'تصنيف الطلب',
      'TICKET_TYPE',
      'SERVICE_TYPE',
      'ORDER_TYPE'
    ]
  },
  {
    key: 'requestNumber',
    label: 'رقم الطلب',
    order: 9,
    aliases: [
      'رقم الطلب',
      'رقم طلب سيبل',
      'رقم طلب الخدمة',
      'رقم طلب siebel',
      'رقم طلب سيبيل',
      'REQUEST_NUMBER',
      'REQUEST NUMBER',
      'SR_NUMBER',
      'SR NUMBER',
      'SIEBEL_REQUEST_NUMBER',
      'SIEBEL REQUEST NUMBER',
      'REQUEST_ID',
      'REQUEST ID',
      'SERVICE_REQUEST_NUMBER',
      'رقم المعاملة',
      'رقم التذكرة',
      'معرف الطلب',
      'TICKET_ID',
      'SR_NO'
    ]
  },
  {
    key: 'requestStatus',
    label: 'حالة الطلب',
    order: 10,
    aliases: [
      'حالة الطلب',
      'الحالة',
      'وضع الطلب',
      'REQUEST_STATUS',
      'REQUEST STATUS',
      'STATUS',
      'TICKET_STATUS',
      'موقف الطلب',
      'STATE'
    ]
  },
  {
    key: 'requestOpenDate',
    label: 'تاريخ فتح الطلب',
    order: 11,
    aliases: [
      'تاريخ فتح الطلب',
      'تاريخ الطلب',
      'تاريخ الإنشاء',
      'تاريخ فتح',
      'OPEN_DATE',
      'OPEN DATE',
      'REQUEST_DATE',
      'REQUEST DATE',
      'REQUEST_OPEN_DATE',
      'REQUEST OPEN DATE',
      'CREATION_DATE',
      'CREATION DATE',
      'CREATED_AT',
      'CREATED_DATE',
      'تاريخ إنشاء الطلب',
      'تاريخ الفتح',
      'تاريخ التسجيل',
      'تاريخ البداية'
    ]
  },
  {
    key: 'description',
    label: 'الوصف',
    order: 12,
    aliases: [
      'الوصف',
      'ملاحظات على الطلب',
      'الملاحظات',
      'تفاصيل الطلب',
      'وصف الطلب',
      'ملاحظات',
      'شرح الطلب',
      'DESCRIPTION',
      'NOTES',
      'REMARKS',
      'COMMENTS',
      'DETAILS',
      'REQUEST_DESCRIPTION'
    ]
  }
];

export interface ImportSummary {
  fileName: string;
  fileSize: number;
  totalRows: number;
  extractedWithRequests: number;
  excludedNoRequests: number;
  uniqueCustomers: number;
  totalRequests: number;
  matchedColumns: { key: RequiredColumnKey; targetLabel: string; sourceHeader: string }[];
  missingColumns: { key: RequiredColumnKey; targetLabel: string }[];
  ignoredColumns: string[];
  importedAt: string;
}

export interface MasterSaveLog {
  id: string;
  timestamp: string; // ISO string
  formattedDate: string; // e.g. "2026-09-02 12:45:00"
  fileName: string;
  importedRows: number; // عدد السجلات المستوردة
  newAccountsCount: number; // عدد الحسابات الجديدة
  updatedAccountsCount: number; // عدد الحسابات التي تم تحديثها
  duplicateRowsCount: number; // عدد السجلات المكررة
  totalMasterAfter: number; // إجمالي حسابات المحفظة الرئيسية بعد الحفظ
}

export interface MasterSaveResult {
  newAccountsCount: number;
  updatedAccountsCount: number;
  duplicateRowsCount: number;
  totalBefore: number;
  totalAfter: number;
  log: MasterSaveLog;
}

/**
 * WhatsApp Master Portfolio Record
 * Exactly 8 functional fields requested:
 * 1. رقم الحساب
 * 2. مبلغ المديونية
 * 3. اسم العميل
 * 4. رقم الهوية
 * 5. نوع المنتج
 * 6. نوع الطلب
 * 7. رقم الجوال
 * 8. رابط واتساب
 */
export interface WhatsAppRecord {
  id: string; // Unique row ID
  accountNumber: string; // 1. رقم الحساب
  debtAmount: string; // 2. مبلغ المديونية
  customerName: string; // 3. اسم العميل
  nationalId: string; // 4. رقم الهوية
  productType: string; // 5. نوع المنتج
  requestType: string; // 6. نوع الطلب
  mobileNumber: string; // 7. رقم الجوال
  whatsappUrl: string; // 8. رابط واتساب (https://wa.me/9665XXXXXXXX)
  createdAt?: string;
  updatedAt?: string;
}

export const WHATSAPP_COLUMNS = [
  { key: 'accountNumber', label: 'رقم الحساب', order: 1 },
  { key: 'debtAmount', label: 'مبلغ المديونية', order: 2 },
  { key: 'customerName', label: 'اسم العميل', order: 3 },
  { key: 'nationalId', label: 'رقم الهوية', order: 4 },
  { key: 'productType', label: 'نوع المنتج', order: 5 },
  { key: 'requestType', label: 'نوع الطلب', order: 6 },
  { key: 'mobileNumber', label: 'رقم الجوال', order: 7 },
  { key: 'whatsappUrl', label: 'رابط واتساب', order: 8 }
] as const;

export interface WhatsAppMergeResult {
  addedCount: number;
  updatedCount: number;
  duplicateCount: number;
  totalBefore: number;
  totalAfter: number;
}

export type ActiveViewTab = 'imported' | 'master' | 'whatsapp';

export type DateSortOption = 'newest' | 'oldest' | 'custom';

export interface FilterState {
  searchQuery: string;
  dateSort: DateSortOption;
  dateFrom: string;
  dateTo: string;
  requestType: string;
  requestStatus: string;
  productType: string;
}

export interface CustomerAttachment {
  id: string;
  customerKey: string; // e.g. "ACC_123456"
  slotIndex: number; // 0, 1, 2, 3
  slotTitle: string;
  fileName: string;
  fileType: string; // e.g. "application/pdf", "image/png"
  fileSize: number; // in bytes
  uploadedAt: string; // ISO date string
  formattedDate: string; // Formatted Arabic date
  dataUrl: string; // Base64 data URL
}

export interface AttachmentSlotConfig {
  index: number;
  title: string;
  subtitle: string;
  suggestedTypes: string[];
}

export const DEFAULT_ATTACHMENT_SLOTS: AttachmentSlotConfig[] = [
  {
    index: 0,
    title: 'مستند الهوية الوطنية / الإقامة',
    subtitle: 'صورة الهوية أو الإقامة بصيغة PDF أو صورة',
    suggestedTypes: ['PDF', 'صورة', 'مستند']
  },
  {
    index: 1,
    title: 'كشف الحساب / مستند المديونية',
    subtitle: 'كشف الحساب البنكي أو خطاب إثبات المديونية',
    suggestedTypes: ['PDF', 'Excel', 'مستند']
  },
  {
    index: 2,
    title: 'نموذج الطلب / إقرار العميل',
    subtitle: 'استمارة تقديم الطلب الموقعة أو الإقرار',
    suggestedTypes: ['PDF', 'صورة', 'Word']
  },
  {
    index: 3,
    title: 'مرفقات إضافية / مستندات أخرى',
    subtitle: 'أي مستندات أو خطابات داعمة إضافية',
    suggestedTypes: ['أي ملف', 'PDF', 'صورة']
  }
];


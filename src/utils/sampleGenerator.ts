import * as XLSX from 'xlsx';

/**
 * Generates a realistic test Excel file buffer containing:
 * - Varied column order and header synonyms (e.g. "ACCOUNT_NUMBER", "LOAN_BALANCE", "CUST_NAME", "PRODUCT_CATEGORY", "CUS_ID_NO", "التصنيف الفرعي", "رقم طلب سيبل", "ملاحظات على الطلب")
 * - Varied row counts and customer request variations
 */
export function generateTestExcelFile(rowCount: number = 500, variant: 'mixed' | 'arabic' = 'mixed'): Uint8Array {
  // Column Headers matching user prompt example
  const headers = variant === 'mixed' ? [
    'ACCOUNT_NUMBER',       // 0 -> رقم الحساب
    'LOAN_BALANCE',        // 1 -> مبلغ المديونية
    'CUST_NAME',           // 2 -> اسم العميل
    'PRODUCT_CATEGORY',    // 3 -> نوع المنتج
    'CUS_ID_NO',           // 4 -> رقم الهوية
    'تاريخ التجميد',        // 5 -> تاريخ التجميد
    'رقم الجوال',           // 6 -> رقم الجوال
    'حقل_تدقيق_غير_مطلوب', // 7 -> Ignored
    'التصنيف الفرعي',       // 8 -> نوع الطلب
    'رقم طلب سيبل',         // 9 -> رقم الطلب
    'حالة الطلب',           // 10 -> حالة الطلب
    'تاريخ فتح الطلب',       // 11 -> تاريخ فتح الطلب
    'ملاحظات على الطلب',     // 12 -> الوصف
    'BRANCH_CODE'          // 13 -> Ignored
  ] : [
    'رقم الحساب',           // 0
    'اسم العميل',           // 1
    'المديونية',            // 2 (Synonym for مبلغ المديونية)
    'رقم الهوية',           // 3
    'نوع المنتج',           // 4
    'رقم الجوال',           // 5
    'تاريخ التجميد',        // 6
    'عمود إضافي',          // 7
    'نوع الطلب',            // 8
    'رقم طلب الخدمة',       // 9 (Synonym for رقم الطلب)
    'حالة الطلب',           // 10
    'تاريخ فتح الطلب',       // 11
    'الوصف',               // 12
    'رمز الفرع'             // 13
  ];

  const firstNames = ['محمد', 'عبدالله', 'سعود', 'فهد', 'خالد', 'سلطان', 'فيصل', 'سارة', 'نورة', 'ريم', 'منيرة', 'هند', 'أحمد', 'عمر', 'ماجد', 'ياسر', 'تركي', 'مشعل', 'لطيفة', 'لمى'];
  const familyNames = ['العتيبي', 'القحطاني', 'الشمري', 'الدوسري', 'الحربي', 'المطيري', 'الغامدي', 'الزهراني', 'الشهري', 'العنزي', 'السبيعي', 'الخالدي', 'الرويلي', 'الرشيدي'];
  const products = ['RF', 'PF', 'AL', 'CC'];
  const requestTypes = ['إعادة جدولة المديونية', 'طلب تسوية وسداد مبكر', 'رفع تجميد الحساب', 'اعتراض على رسوم', 'تحديث بيانات الحساب', 'طلب إخلاء طرف', 'إعادة هيكلة الأقساط'];
  const requestStatuses = ['تحت الإجراء', 'معلق لدى الإدارة', 'مكتمل بنجاح', 'مرفوض', 'في انتظار المستندات', 'محال للمتابعة'];

  const rows: (string | number)[][] = [headers];

  const baseAccounts = Array.from({ length: Math.ceil(rowCount / 2) }, (_, i) => {
    const accNum = `0${100000000 + i}`;
    const custName = `${firstNames[i % firstNames.length]} ${firstNames[(i * 3) % firstNames.length]} ${familyNames[i % familyNames.length]}`;
    const natId = `10${String(10000000 + i).padStart(8, '0')}`;
    const mobile = `05${String(10000000 + (i * 7) % 89999999).padStart(8, '0')}`;
    const debt = (Math.floor(Math.random() * 250000) + 1500).toFixed(2);
    const prod = products[i % products.length];
    const freezeD = i % 3 === 0 ? `2024-0${(i % 9) + 1}-15 09:30:00` : '';
    return { accNum, custName, natId, mobile, debt, prod, freezeD };
  });

  for (let i = 0; i < rowCount; i++) {
    const cust = baseAccounts[i % baseAccounts.length];
    const roll = Math.random();

    let reqType = '';
    let reqNum = '';
    let reqStatus = '';
    let reqDate = '';
    let reqDesc = '';

    if (roll < 0.25) {
      // 25% Excluded rows (No request at all)
      reqType = '';
      reqNum = '';
      reqStatus = '';
      reqDate = '';
      reqDesc = '';
    } else if (roll < 0.50) {
      // Has only request type
      reqType = requestTypes[i % requestTypes.length];
      reqNum = '';
      reqStatus = requestStatuses[i % requestStatuses.length];
      reqDate = `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} 11:20:00`;
      reqDesc = `طلب ${reqType} للعميل بناءً على المكالمة الهاتفية`;
    } else if (roll < 0.70) {
      // Has only request number
      reqType = '';
      reqNum = `SR-2024-${String(10000 + i)}`;
      reqStatus = requestStatuses[i % requestStatuses.length];
      reqDate = `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`;
      reqDesc = 'رقم المعاملة محال من النظام الآلي الموحد';
    } else {
      // Has both request type & request number
      reqType = requestTypes[i % requestTypes.length];
      reqNum = `SR-2024-${String(20000 + i)}`;
      reqStatus = requestStatuses[i % requestStatuses.length];
      reqDate = `2024-0${((i + 2) % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} 14:45:10`;
      reqDesc = `العميل يطلب ${reqType} مع تفاصيل إضافية مسجلة بالنظام`;
    }

    const row = [
      cust.accNum,                     // رقم الحساب
      cust.custName,                   // اسم العميل
      cust.debt,                       // المديونية
      cust.natId,                      // رقم الهوية
      cust.prod,                       // نوع المنتج
      cust.mobile,                     // رقم الجوال
      cust.freezeD,                    // تاريخ التجميد
      `بيانات تدقيق ${i + 1}`,         // عمود إضافي
      reqType,                         // نوع الطلب
      reqNum,                          // رقم طلب سيبل
      reqStatus,                       // حالة الطلب
      reqDate,                         // تاريخ فتح الطلب
      reqDesc,                         // ملاحظات على الطلب
      `FR-0${(i % 5) + 1}`             // رمز الفرع
    ];

    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!views'] = [{ RTL: true }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'محفظة_العملاء_الأصلية');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

/**
 * Downloads a generated test file directly in browser
 */
export function downloadSampleExcel(rowCount: number = 500): void {
  const bytes = generateTestExcelFile(rowCount);
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ملف_محفظة_تجريبي_${rowCount}_سجل.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import * as XLSX from 'xlsx';
import { 
  PortfolioRecord, 
  PORTFOLIO_COLUMNS, 
  RequiredColumnKey, 
  ImportSummary,
  WhatsAppRecord
} from '../types';
import { parseMobileAndGenerateWhatsAppUrl, formatSaudiMobileInternational } from './whatsappHelper';
import { normalizeProductType } from './productHelper';

/**
 * Normalizes text for robust header matching (removes diacritics, extra spaces, standardizes Arabic characters)
 */
export function normalizeHeader(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    // Remove Arabic diacritics (Tashkeel)
    .replace(/[\u064B-\u0652]/g, '')
    // Standardize Alef variations
    .replace(/[إأآا]/g, 'ا')
    // Standardize Teh Marbuta and Heh
    .replace(/ة/g, 'ه')
    // Standardize Yeh and Alef Maksura
    .replace(/ى/g, 'ي')
    // Standardize spaces and underscores/dashes
    .replace(/[_\-\s]+/g, ' ')
    .trim();
}

/**
 * Normalizes sensitive strings to retain leading zeros and avoid scientific notation
 */
export function formatSensitiveString(val: unknown): string {
  if (val === null || val === undefined) return '';
  
  if (typeof val === 'number') {
    // If it's a large integer, prevent scientific notation like 1.23e+10
    if (Number.isInteger(val)) {
      return BigInt(Math.floor(val)).toString();
    }
    return val.toString();
  }
  
  const str = String(val).trim();
  // If string happens to be in scientific notation like "1.05E+09"
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num) && Number.isInteger(num)) {
      return BigInt(Math.floor(num)).toString();
    }
  }
  return str;
}

/**
 * Safely parses any date representation (Excel serial number, ISO, Slash format, DateTime)
 * into a clean YYYY-MM-DD date string and a Date object.
 */
export function parseExcelDate(val: unknown): { dateStr: string; dateObj: Date | null } {
  if (val === null || val === undefined || val === '') {
    return { dateStr: '', dateObj: null };
  }

  // 1. If it is already a JS Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, dateObj: val };
  }

  // 2. If it's an Excel numeric serial date (e.g. 44927 for 2023-01-01)
  if (typeof val === 'number' && val > 20000 && val < 90000) {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        const jsDate = new Date(y, parsed.m - 1, parsed.d);
        return { dateStr: `${y}-${m}-${d}`, dateObj: jsDate };
      }
    } catch {
      // Fallback
    }
  }

  const rawStr = String(val).trim();
  if (!rawStr) return { dateStr: '', dateObj: null };

  // 3. If string starts with numeric Excel serial (e.g. "45123")
  if (/^\d{5}$/.test(rawStr)) {
    const num = parseInt(rawStr, 10);
    if (num > 20000 && num < 90000) {
      try {
        const parsed = XLSX.SSF.parse_date_code(num);
        if (parsed && parsed.y && parsed.m && parsed.d) {
          const y = parsed.y;
          const m = String(parsed.m).padStart(2, '0');
          const d = String(parsed.d).padStart(2, '0');
          const jsDate = new Date(y, parsed.m - 1, parsed.d);
          return { dateStr: `${y}-${m}-${d}`, dateObj: jsDate };
        }
      } catch {
        // Fallback
      }
    }
  }

  // 4. If string has date + time (e.g. "2023-11-20 14:30:00" or "2023/11/20T10:00:00")
  // Extract date part
  const matchIso = rawStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (matchIso) {
    const y = parseInt(matchIso[1], 10);
    const m = parseInt(matchIso[2], 10);
    const d = parseInt(matchIso[3], 10);
    const jsDate = new Date(y, m - 1, d);
    if (!isNaN(jsDate.getTime())) {
      const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { dateStr: formatted, dateObj: jsDate };
    }
  }

  // 5. If DD/MM/YYYY or DD-MM-YYYY format
  const matchDmY = rawStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (matchDmY) {
    const d = parseInt(matchDmY[1], 10);
    const m = parseInt(matchDmY[2], 10);
    const y = parseInt(matchDmY[3], 10);
    const jsDate = new Date(y, m - 1, d);
    if (!isNaN(jsDate.getTime())) {
      const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { dateStr: formatted, dateObj: jsDate };
    }
  }

  // Try standard Date.parse
  const parsedTime = Date.parse(rawStr);
  if (!isNaN(parsedTime)) {
    const jsDate = new Date(parsedTime);
    const y = jsDate.getFullYear();
    const m = String(jsDate.getMonth() + 1).padStart(2, '0');
    const d = String(jsDate.getDate()).padStart(2, '0');
    return { dateStr: `${y}-${m}-${d}`, dateObj: jsDate };
  }

  // If unparseable, return sanitized raw text
  return { dateStr: rawStr.split(' ')[0] || rawStr, dateObj: null };
}

/**
 * Format debt amount consistently as standard English numerals without any currency symbol.
 */
export function formatDebtAmount(val: unknown): string {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Convert Eastern Arabic/Persian digits (٠-٩ / ۰-۹) to standard Western digits (0-9)
  let str = String(val)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');

  // Strip any currency words like 'ر.س', 'رس', 'SAR', 'ريال', commas and extra spaces
  str = str.replace(/ر\.?\s*س/g, '').replace(/ريال/g, '').replace(/SAR/gi, '').replace(/,/g, '').trim();

  const num = parseFloat(str);
  if (!isNaN(num)) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return str;
}

/**
 * Builds a column index map from raw header row adhering strictly to prioritized synonym lists
 * and exact normalized matching without loose substring guessing.
 */
export function mapHeadersToColumns(headers: unknown[]): {
  keyMap: Record<RequiredColumnKey, number>; // Column Key -> Header Array Index
  matched: { key: RequiredColumnKey; targetLabel: string; sourceHeader: string }[];
  missing: { key: RequiredColumnKey; targetLabel: string }[];
  ignored: string[];
} {
  const keyMap = {} as Record<RequiredColumnKey, number>;
  const matched: { key: RequiredColumnKey; targetLabel: string; sourceHeader: string }[] = [];
  const missing: { key: RequiredColumnKey; targetLabel: string }[] = [];
  const claimedIndices = new Set<number>();

  const normalizedHeaders = headers.map((h) => ({
    raw: String(h ?? '').trim(),
    normalized: normalizeHeader(String(h ?? ''))
  }));

  for (const col of PORTFOLIO_COLUMNS) {
    let foundIndex = -1;

    // Ordered list of candidate aliases: primary label first, then synonyms in strict order of priority
    const candidateAliases: string[] = [col.label, ...col.aliases];
    const seenCandidates = new Set<string>();

    for (const candidate of candidateAliases) {
      const normCandidate = normalizeHeader(candidate);
      if (!normCandidate || seenCandidates.has(normCandidate)) continue;
      seenCandidates.add(normCandidate);

      // Search for exact match with an unclaimed column header in the Excel file
      for (let i = 0; i < normalizedHeaders.length; i++) {
        if (claimedIndices.has(i)) continue;
        if (normalizedHeaders[i].normalized === normCandidate) {
          foundIndex = i;
          break;
        }
      }

      // If a higher priority candidate is found, stop searching remaining aliases
      if (foundIndex !== -1) {
        break;
      }
    }

    if (foundIndex !== -1) {
      keyMap[col.key] = foundIndex;
      claimedIndices.add(foundIndex);
      matched.push({
        key: col.key,
        targetLabel: col.label,
        sourceHeader: normalizedHeaders[foundIndex].raw || `عمود ${foundIndex + 1}`
      });
    } else {
      missing.push({
        key: col.key,
        targetLabel: col.label
      });
    }
  }

  const ignored: string[] = [];
  for (let i = 0; i < normalizedHeaders.length; i++) {
    if (!claimedIndices.has(i) && normalizedHeaders[i].raw) {
      ignored.push(normalizedHeaders[i].raw);
    }
  }

  return { keyMap, matched, missing, ignored };
}

/**
 * Check if cell value is non-empty
 */
function isNonEmpty(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s !== '' && s !== '-' && s !== 'null' && s !== 'undefined';
}

/**
 * Processes an Excel file ArrayBuffer completely client-side.
 */
export async function processExcelFile(
  buffer: ArrayBuffer, 
  fileName: string
): Promise<{
  extractedRecords: PortfolioRecord[];
  summary: ImportSummary;
  whatsAppRecords: WhatsAppRecord[];
}> {
  // Read workbook
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: true,
    raw: false // read text representations to avoid floating precision bugs
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('الملف لا يحتوي على أي صفحات بيانات (Sheets).');
  }

  // Use the first sheet with data
  let firstValidSheetName = workbook.SheetNames[0];
  let sheet = workbook.Sheets[firstValidSheetName];

  // If first sheet is empty, look for a sheet with content
  for (const sName of workbook.SheetNames) {
    const candidate = workbook.Sheets[sName];
    if (candidate && candidate['!ref']) {
      sheet = candidate;
      firstValidSheetName = sName;
      break;
    }
  }

  if (!sheet || !sheet['!ref']) {
    throw new Error('الصفحة المحددة فارغة تماماً ولا تحتوي على صفوف.');
  }

  // Convert sheet to 2D array (header: 1)
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
    raw: false
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('لم يتم العثور على أي صفوف داخل ملف Excel.');
  }

  // Find header row (usually row 0, but sometimes files have 1-2 empty or title rows)
  let headerRowIndex = 0;
  let maxMatched = -1;
  let bestMapping = mapHeadersToColumns(rawRows[0] || []);

  // Search first 5 rows for the best matching header row
  for (let r = 0; r < Math.min(5, rawRows.length); r++) {
    const candidateRow = rawRows[r] || [];
    const testMap = mapHeadersToColumns(candidateRow);
    if (testMap.matched.length > maxMatched) {
      maxMatched = testMap.matched.length;
      headerRowIndex = r;
      bestMapping = testMap;
    }
  }

  const { keyMap, matched, missing, ignored } = bestMapping;
  const dataRows = rawRows.slice(headerRowIndex + 1);

  const totalRows = dataRows.length;
  let excludedNoRequests = 0;
  const extractedRecords: PortfolioRecord[] = [];
  const seenCompositeKeys = new Set<string>();
  const uniqueCustomerAccounts = new Set<string>();

  // WhatsApp records extracted in parallel for all rows with a valid mobile number
  const whatsAppRecords: WhatsAppRecord[] = [];
  const seenWhatsAppMap = new Map<string, WhatsAppRecord>();

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
    const row = dataRows[rowIndex];
    if (!row || !Array.isArray(row) || row.every((c) => !isNonEmpty(c))) {
      // Empty row
      continue;
    }

    // Extract Request Type and Request Number
    const rawReqType = keyMap.requestType !== undefined ? row[keyMap.requestType] : '';
    const rawReqNumber = keyMap.requestNumber !== undefined ? row[keyMap.requestNumber] : '';

    const reqTypeStr = String(rawReqType ?? '').trim();
    const reqNumberStr = formatSensitiveString(rawReqNumber);

    const hasRequestType = isNonEmpty(reqTypeStr);
    const hasRequestNumber = isNonEmpty(reqNumberStr);

    // CRITICAL CONDITION FOR CURRENT PORTFOLIO:
    // Row is INCLUDED if (requestType != empty OR requestNumber != empty)
    // Row is EXCLUDED if (requestType == empty AND requestNumber == empty)
    const hasRequest = hasRequestType || hasRequestNumber;

    // Extract fields using standardized normalizers
    const accountNumber = keyMap.accountNumber !== undefined 
      ? formatSensitiveString(row[keyMap.accountNumber]) 
      : '';
    const debtAmount = keyMap.debtAmount !== undefined 
      ? formatDebtAmount(row[keyMap.debtAmount]) 
      : '';
    const customerName = keyMap.customerName !== undefined 
      ? String(row[keyMap.customerName] ?? '').trim() 
      : '';
    const productType = keyMap.productType !== undefined 
      ? normalizeProductType(row[keyMap.productType]) 
      : '';
    const nationalId = keyMap.nationalId !== undefined 
      ? formatSensitiveString(row[keyMap.nationalId]) 
      : '';
    const freezeDate = keyMap.freezeDate !== undefined 
      ? parseExcelDate(row[keyMap.freezeDate]).dateStr 
      : '';
    const rawMobile = keyMap.mobileNumber !== undefined 
      ? formatSensitiveString(row[keyMap.mobileNumber]) 
      : '';
    const mobileNumber = formatSaudiMobileInternational(rawMobile);
    const requestStatus = keyMap.requestStatus !== undefined 
      ? String(row[keyMap.requestStatus] ?? '').trim() 
      : '';
    
    const parsedOpenDate = keyMap.requestOpenDate !== undefined 
      ? parseExcelDate(row[keyMap.requestOpenDate]) 
      : { dateStr: '', dateObj: null };
    const requestOpenDate = parsedOpenDate.dateStr;

    const description = keyMap.description !== undefined 
      ? String(row[keyMap.description] ?? '').trim() 
      : '';

    // ========================================================
    // Track 1: Existing Current Portfolio (Only Customers with Requests)
    // ========================================================
    if (hasRequest) {
      let compositeKey = '';
      if (hasRequestNumber) {
        compositeKey = `${accountNumber}___REQNUM___${reqNumberStr}`;
      } else {
        compositeKey = `${accountNumber}___REQTYPE___${reqTypeStr}___${requestOpenDate}___${description}`;
      }

      // Prevent duplicate records within the imported file
      if (!seenCompositeKeys.has(compositeKey)) {
        seenCompositeKeys.add(compositeKey);

        if (accountNumber) {
          uniqueCustomerAccounts.add(accountNumber);
        } else if (customerName) {
          uniqueCustomerAccounts.add(customerName);
        }

        const record: PortfolioRecord = {
          id: `rec-${rowIndex + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          accountNumber,
          debtAmount,
          customerName,
          productType,
          nationalId,
          freezeDate,
          mobileNumber,
          requestType: reqTypeStr,
          requestNumber: reqNumberStr,
          requestStatus,
          requestOpenDate,
          description,
          rawParsedDate: parsedOpenDate.dateObj
        };

        extractedRecords.push(record);
      }
    } else {
      excludedNoRequests++;
    }

    // ========================================================
    // Track 2: Parallel WhatsApp Portfolio (Criterion: Valid Mobile Number)
    // Regardless of whether customer has a request or not!
    // ========================================================
    const parsedPhone = parseMobileAndGenerateWhatsAppUrl(mobileNumber);
    if (parsedPhone.isValid) {
      // Key priority within this file batch: Account > National ID > Mobile
      const batchKey = accountNumber 
        ? `ACC_${accountNumber.toUpperCase()}` 
        : (nationalId ? `ID_${nationalId.toUpperCase()}` : `MOB_${parsedPhone.internationalPhone}`);

      const existingInBatch = seenWhatsAppMap.get(batchKey);
      if (!existingInBatch) {
        const waRec: WhatsAppRecord = {
          id: `wa-${rowIndex + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          accountNumber,
          debtAmount,
          customerName,
          nationalId,
          productType,
          requestType: reqTypeStr, // Can be empty or populated!
          mobileNumber: formatSaudiMobileInternational(parsedPhone.cleanMobile || mobileNumber),
          whatsappUrl: parsedPhone.whatsappUrl
        };
        seenWhatsAppMap.set(batchKey, waRec);
        whatsAppRecords.push(waRec);
      } else {
        // Safe batch merge: if subsequent row has non-empty field, fill it
        if (!existingInBatch.debtAmount && debtAmount) existingInBatch.debtAmount = debtAmount;
        if (!existingInBatch.customerName && customerName) existingInBatch.customerName = customerName;
        if (!existingInBatch.productType && productType) existingInBatch.productType = productType;
        if (!existingInBatch.requestType && reqTypeStr) existingInBatch.requestType = reqTypeStr;
        if (!existingInBatch.nationalId && nationalId) existingInBatch.nationalId = nationalId;
      }
    }
  }

  // Sort both portfolios descending by debt amount (أعلى مبلغ مديونية في الأعلى، ثم الأقل فالأقل)
  extractedRecords.sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  whatsAppRecords.sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  const summary: ImportSummary = {
    fileName,
    fileSize: buffer.byteLength,
    totalRows,
    extractedWithRequests: extractedRecords.length,
    excludedNoRequests,
    uniqueCustomers: uniqueCustomerAccounts.size,
    totalRequests: extractedRecords.length,
    matchedColumns: matched,
    missingColumns: missing,
    ignoredColumns: ignored,
    importedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
  };

  return { extractedRecords, summary, whatsAppRecords };
}

/**
 * Merges new records into existing portfolio applying deduplication rules
 */
export function mergePortfolioRecords(
  existing: PortfolioRecord[], 
  incoming: PortfolioRecord[]
): {
  merged: PortfolioRecord[];
  addedCount: number;
  duplicateCount: number;
} {
  const existingKeys = new Set<string>();

  for (const rec of existing) {
    let key = '';
    if (rec.requestNumber) {
      key = `${rec.accountNumber}___REQNUM___${rec.requestNumber}`;
    } else {
      key = `${rec.accountNumber}___REQTYPE___${rec.requestType}___${rec.requestOpenDate}___${rec.description}`;
    }
    existingKeys.add(key);
  }

  const newlyAdded: PortfolioRecord[] = [];
  let duplicateCount = 0;

  for (const inc of incoming) {
    let key = '';
    if (inc.requestNumber) {
      key = `${inc.accountNumber}___REQNUM___${inc.requestNumber}`;
    } else {
      key = `${inc.accountNumber}___REQTYPE___${inc.requestType}___${inc.requestOpenDate}___${inc.description}`;
    }

    if (existingKeys.has(key)) {
      duplicateCount++;
    } else {
      existingKeys.add(key);
      newlyAdded.push(inc);
    }
  }

  const merged = [...existing, ...newlyAdded].sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  return {
    merged,
    addedCount: newlyAdded.length,
    duplicateCount
  };
}

/**
 * Exports records to a genuine .xlsx file in the exact 12-column layout.
 */
export function exportPortfolioToExcel(
  records: PortfolioRecord[], 
  filename: string = 'محفظتي_العملاء_اصحاب_الطلبات.xlsx'
): void {
  // Ensure exported records are sorted descending by debt amount (أعلى مديونية أولاً)
  const sortedRecords = [...records].sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  // Headers strictly in order
  const headers = PORTFOLIO_COLUMNS.map((col) => col.label);

  // Rows strictly in order
  const rows = sortedRecords.map((rec) => [
    rec.accountNumber, // 1. رقم الحساب
    rec.debtAmount,    // 2. مبلغ المديونية
    rec.customerName,  // 3. اسم العميل
    rec.productType,   // 4. نوع المنتج
    rec.nationalId,    // 5. رقم الهوية
    rec.freezeDate,    // 6. تاريخ التجميد
    rec.mobileNumber,  // 7. رقم الجوال
    rec.requestType,   // 8. نوع الطلب
    rec.requestNumber, // 9. رقم الطلب
    rec.requestStatus, // 10. حالة الطلب
    rec.requestOpenDate,// 11. تاريخ فتح الطلب
    rec.description    // 12. الوصف
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = [
    { wch: 18 }, // رقم الحساب
    { wch: 16 }, // مبلغ المديونية
    { wch: 25 }, // اسم العميل
    { wch: 16 }, // نوع المنتج
    { wch: 16 }, // رقم الهوية
    { wch: 14 }, // تاريخ التجميد
    { wch: 16 }, // رقم الجوال
    { wch: 18 }, // نوع الطلب
    { wch: 16 }, // رقم الطلب
    { wch: 14 }, // حالة الطلب
    { wch: 16 }, // تاريخ فتح الطلب
    { wch: 35 }  // الوصف
  ];
  worksheet['!cols'] = colWidths;

  // Set RTL property
  worksheet['!views'] = [{ RTL: true }];

  // Make sure sensitive numeric columns are explicitly typed as string 's'
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
  for (let R = 1; R <= range.e.r; ++R) {
    // Columns: A (0)=Account, E (4)=NationalID, G (6)=Mobile, I (8)=RequestNumber
    const textColIndices = [0, 4, 6, 8];
    for (const C of textColIndices) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v !== undefined && cell.v !== null) {
        cell.t = 's'; // string type
        cell.v = String(cell.v);
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'محفظتي');

  // Trigger download in browser
  XLSX.writeFile(workbook, filename);
}

import * as XLSX from 'xlsx';
import { WhatsAppRecord, WhatsAppMergeResult, WHATSAPP_COLUMNS } from '../types';
import { parseMobileAndGenerateWhatsAppUrl, formatSaudiMobileInternational } from './whatsappHelper';
import { normalizeProductType } from './productHelper';
import { formatDebtAmount } from './excelParser';

const WHATSAPP_MASTER_PORTFOLIO_KEY = 'MAHFADATY_WHATSAPP_MASTER_PORTFOLIO_V1';

/**
 * Loads the permanent WhatsApp Master Portfolio from browser LocalStorage.
 */
export function loadWhatsAppMasterPortfolio(): WhatsAppRecord[] {
  try {
    const raw = localStorage.getItem(WHATSAPP_MASTER_PORTFOLIO_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const normalizedRecords = parsed.map((item: WhatsAppRecord) => ({
      ...item,
      debtAmount: formatDebtAmount(item.debtAmount),
      mobileNumber: formatSaudiMobileInternational(item.mobileNumber),
      productType: normalizeProductType(item.productType)
    }));

    // Sort descending by debt amount (أعلى مبلغ مديونية في الأعلى، ثم الأقل فالأقل)
    return normalizedRecords.sort((a, b) => {
      const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
      const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
      return valB - valA;
    });
  } catch (error) {
    console.error('Failed to load WhatsApp Master Portfolio from localStorage:', error);
    return [];
  }
}

/**
 * Saves the WhatsApp Master Portfolio to browser LocalStorage.
 */
export function saveWhatsAppMasterPortfolio(records: WhatsAppRecord[]): boolean {
  try {
    localStorage.setItem(WHATSAPP_MASTER_PORTFOLIO_KEY, JSON.stringify(records));
    return true;
  } catch (error) {
    console.error('Failed to save WhatsApp Master Portfolio to localStorage:', error);
    return false;
  }
}

/**
 * Clears the permanent WhatsApp Master Portfolio.
 */
export function clearWhatsAppMasterPortfolio(): void {
  try {
    localStorage.removeItem(WHATSAPP_MASTER_PORTFOLIO_KEY);
  } catch (error) {
    console.error('Failed to clear WhatsApp Master Portfolio:', error);
  }
}

/**
 * Returns the primary identification key for a WhatsApp record following prioritized criteria:
 * 1. Account Number
 * 2. National ID
 * 3. Mobile Number
 */
export function getWhatsAppRecordKey(rec: {
  accountNumber?: string;
  nationalId?: string;
  mobileNumber?: string;
}): string {
  if (rec.accountNumber && rec.accountNumber.trim()) {
    return `ACC_${rec.accountNumber.trim().toUpperCase()}`;
  }
  if (rec.nationalId && rec.nationalId.trim()) {
    return `ID_${rec.nationalId.trim().toUpperCase()}`;
  }
  if (rec.mobileNumber && rec.mobileNumber.trim()) {
    const parsed = parseMobileAndGenerateWhatsAppUrl(rec.mobileNumber);
    const numKey = parsed.internationalPhone || rec.mobileNumber.trim();
    return `MOB_${numKey}`;
  }
  return '';
}

/**
 * Merges incoming WhatsApp records into the permanent WhatsApp Master Portfolio.
 * 
 * Rules:
 * 1. No duplicate accounts: If an account exists, update its fields safely.
 * 2. SAFE UPDATE: Never overwrite an existing non-empty value with an empty string or null.
 * 3. Priority lookup: 1. Account Number, 2. National ID, 3. Mobile Number.
 * 4. Generates/updates WhatsApp link when a new valid mobile number arrives.
 */
export function mergeIntoWhatsAppMaster(
  currentMaster: WhatsAppRecord[],
  incomingRecords: WhatsAppRecord[]
): {
  updatedMaster: WhatsAppRecord[];
  result: WhatsAppMergeResult;
} {
  const totalBefore = currentMaster.length;
  let addedCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;

  // Clone current master to avoid direct state mutation
  const updatedMaster: WhatsAppRecord[] = currentMaster.map((r) => ({ ...r }));

  // Index existing records by all known keys (Account Number, National ID, Mobile Number)
  const keyMap = new Map<string, { record: WhatsAppRecord; index: number }>();

  updatedMaster.forEach((rec, idx) => {
    if (rec.accountNumber && rec.accountNumber.trim()) {
      keyMap.set(`ACC_${rec.accountNumber.trim().toUpperCase()}`, { record: rec, index: idx });
    }
    if (rec.nationalId && rec.nationalId.trim()) {
      keyMap.set(`ID_${rec.nationalId.trim().toUpperCase()}`, { record: rec, index: idx });
    }
    if (rec.mobileNumber && rec.mobileNumber.trim()) {
      const parsed = parseMobileAndGenerateWhatsAppUrl(rec.mobileNumber);
      const numKey = parsed.internationalPhone || rec.mobileNumber.trim();
      keyMap.set(`MOB_${numKey}`, { record: rec, index: idx });
    }
  });

  const modifiedIndices = new Set<number>();
  const newlyAddedKeys = new Set<string>();

  for (const incoming of incomingRecords) {
    // Determine if existing record matches by Account, National ID, or Mobile
    let existingEntry: { record: WhatsAppRecord; index: number } | undefined;

    if (incoming.accountNumber && incoming.accountNumber.trim()) {
      existingEntry = keyMap.get(`ACC_${incoming.accountNumber.trim().toUpperCase()}`);
    }
    if (!existingEntry && incoming.nationalId && incoming.nationalId.trim()) {
      existingEntry = keyMap.get(`ID_${incoming.nationalId.trim().toUpperCase()}`);
    }
    if (!existingEntry && incoming.mobileNumber && incoming.mobileNumber.trim()) {
      const parsed = parseMobileAndGenerateWhatsAppUrl(incoming.mobileNumber);
      const numKey = parsed.internationalPhone || incoming.mobileNumber.trim();
      existingEntry = keyMap.get(`MOB_${numKey}`);
    }

    if (!existingEntry) {
      // 1. New Record
      const newId = incoming.id || `wa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newRec: WhatsAppRecord = {
        ...incoming,
        id: newId,
        mobileNumber: formatSaudiMobileInternational(incoming.mobileNumber),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const newIndex = updatedMaster.length;
      updatedMaster.push(newRec);

      // Register keys in index
      if (newRec.accountNumber && newRec.accountNumber.trim()) {
        const k = `ACC_${newRec.accountNumber.trim().toUpperCase()}`;
        keyMap.set(k, { record: newRec, index: newIndex });
        newlyAddedKeys.add(k);
      }
      if (newRec.nationalId && newRec.nationalId.trim()) {
        const k = `ID_${newRec.nationalId.trim().toUpperCase()}`;
        keyMap.set(k, { record: newRec, index: newIndex });
        newlyAddedKeys.add(k);
      }
      if (newRec.mobileNumber && newRec.mobileNumber.trim()) {
        const parsed = parseMobileAndGenerateWhatsAppUrl(newRec.mobileNumber);
        const numKey = parsed.internationalPhone || newRec.mobileNumber.trim();
        const k = `MOB_${numKey}`;
        keyMap.set(k, { record: newRec, index: newIndex });
        newlyAddedKeys.add(k);
      }

      addedCount++;
    } else {
      // 2. Existing Record -> Safe update
      const existing = existingEntry.record;
      let hasChanges = false;

      const fieldsToCheck: (keyof Omit<WhatsAppRecord, 'id' | 'createdAt' | 'updatedAt'>)[] = [
        'accountNumber',
        'debtAmount',
        'customerName',
        'nationalId',
        'productType',
        'requestType',
        'mobileNumber',
        'whatsappUrl'
      ];

      for (const field of fieldsToCheck) {
        const incomingVal = incoming[field];
        const existingVal = existing[field];

        const existingStr = typeof existingVal === 'string' ? existingVal.trim() : '';

        // Safe Update Rule: Only update if incoming has a non-empty string and differs from existing
        if (
          typeof incomingVal === 'string' &&
          incomingVal.trim() !== '' &&
          incomingVal.trim() !== existingStr
        ) {
          const finalVal = field === 'mobileNumber' 
            ? formatSaudiMobileInternational(incomingVal) 
            : incomingVal.trim();
          (existing as any)[field] = finalVal;
          hasChanges = true;
        }
      }

      // If mobile number changed, ensure whatsappUrl is kept in sync
      if (incoming.mobileNumber && incoming.mobileNumber.trim()) {
        const parsed = parseMobileAndGenerateWhatsAppUrl(incoming.mobileNumber);
        if (parsed.isValid && parsed.whatsappUrl) {
          if (existing.whatsappUrl !== parsed.whatsappUrl) {
            existing.whatsappUrl = parsed.whatsappUrl;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        existing.updatedAt = new Date().toISOString();
        if (!modifiedIndices.has(existingEntry.index)) {
          modifiedIndices.add(existingEntry.index);
          updatedCount++;
        }
      } else {
        duplicateCount++;
      }
    }
  }

  // Ensure WhatsApp Master Portfolio is stored sorted descending by debt amount (أعلى مديونية أولاً)
  updatedMaster.sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  // Persist updated records
  saveWhatsAppMasterPortfolio(updatedMaster);

  return {
    updatedMaster,
    result: {
      addedCount,
      updatedCount,
      duplicateCount,
      totalBefore,
      totalAfter: updatedMaster.length
    }
  };
}

/**
 * Exports WhatsApp Master Portfolio to an Excel .xlsx file with the exact 8 fields.
 */
export function exportWhatsAppPortfolioToExcel(
  records: WhatsAppRecord[],
  filename: string = 'محفظة_واتساب_الدائمة.xlsx'
): void {
  // Ensure exported records are sorted descending by debt amount (أعلى مديونية أولاً)
  const sortedRecords = [...records].sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  // Exact 8 headers
  const headers = WHATSAPP_COLUMNS.map((col) => col.label);

  // Rows strictly adhering to the 8 fields
  const rows = sortedRecords.map((rec) => [
    rec.accountNumber, // 1. رقم الحساب
    rec.debtAmount,    // 2. مبلغ المديونية
    rec.customerName,  // 3. اسم العميل
    rec.nationalId,    // 4. رقم الهوية
    rec.productType,   // 5. نوع المنتج
    rec.requestType,   // 6. نوع الطلب
    rec.mobileNumber,  // 7. رقم الجوال
    rec.whatsappUrl    // 8. رابط واتساب
  ]);

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // رقم الحساب
    { wch: 16 }, // مبلغ المديونية
    { wch: 25 }, // اسم العميل
    { wch: 16 }, // رقم الهوية
    { wch: 18 }, // نوع المنتج
    { wch: 18 }, // نوع الطلب
    { wch: 16 }, // رقم الجوال
    { wch: 35 }  // رابط واتساب
  ];

  // Set RTL property
  worksheet['!views'] = [{ RTL: true }];

  // Force string format on Account, National ID, Mobile to prevent scientific notation & retain leading zeros
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:H1');
  for (let R = 1; R <= range.e.r; ++R) {
    const textColIndices = [0, 3, 6]; // Account, National ID, Mobile
    for (const C of textColIndices) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v !== undefined && cell.v !== null) {
        cell.t = 's';
        cell.v = String(cell.v);
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'محفظة واتساب');

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

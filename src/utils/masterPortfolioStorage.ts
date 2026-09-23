import { PortfolioRecord, MasterSaveLog, MasterSaveResult } from '../types';
import { formatDebtAmount } from './excelParser';
import { formatSaudiMobileInternational } from './whatsappHelper';

const MASTER_PORTFOLIO_STORAGE_KEY = 'MAHFADATY_MASTER_PORTFOLIO_DATA_V1';
const MASTER_LOGS_STORAGE_KEY = 'MAHFADATY_MASTER_SAVE_LOGS_V1';

/**
 * Loads the permanent Master Portfolio from browser LocalStorage.
 */
export function loadMasterPortfolio(): PortfolioRecord[] {
  try {
    const raw = localStorage.getItem(MASTER_PORTFOLIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Re-hydrate rawParsedDate for sorting
    const hydrated = parsed.map((item: PortfolioRecord) => {
      let rawDate: Date | null = null;
      if (item.requestOpenDate) {
        const d = new Date(item.requestOpenDate);
        if (!isNaN(d.getTime())) {
          rawDate = d;
        }
      }
      return {
        ...item,
        debtAmount: formatDebtAmount(item.debtAmount),
        mobileNumber: formatSaudiMobileInternational(item.mobileNumber),
        rawParsedDate: rawDate
      };
    });

    // Sort descending by debt amount (highest to lowest)
    return hydrated.sort((a: PortfolioRecord, b: PortfolioRecord) => {
      const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
      const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
      return valB - valA;
    });
  } catch (error) {
    console.error('Failed to load Master Portfolio from localStorage:', error);
    return [];
  }
}

/**
 * Saves the Master Portfolio to browser LocalStorage.
 */
export function saveMasterPortfolio(records: PortfolioRecord[]): boolean {
  try {
    // Strip rawParsedDate before serializing
    const serialized = records.map((r) => ({
      ...r,
      rawParsedDate: undefined
    }));
    localStorage.setItem(MASTER_PORTFOLIO_STORAGE_KEY, JSON.stringify(serialized));
    return true;
  } catch (error) {
    console.error('Failed to save Master Portfolio to localStorage:', error);
    return false;
  }
}

/**
 * Loads the log of historical Master Portfolio save operations.
 */
export function loadMasterLogs(): MasterSaveLog[] {
  try {
    const raw = localStorage.getItem(MASTER_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Failed to load Master Logs from localStorage:', error);
    return [];
  }
}

/**
 * Saves the log of historical Master Portfolio save operations.
 */
export function saveMasterLogs(logs: MasterSaveLog[]): boolean {
  try {
    localStorage.setItem(MASTER_LOGS_STORAGE_KEY, JSON.stringify(logs));
    return true;
  } catch (error) {
    console.error('Failed to save Master Logs to localStorage:', error);
    return false;
  }
}

/**
 * Clears the Master Portfolio and optionally its logs.
 */
export function clearMasterPortfolioStorage(clearLogs: boolean = false): void {
  try {
    localStorage.removeItem(MASTER_PORTFOLIO_STORAGE_KEY);
    if (clearLogs) {
      localStorage.removeItem(MASTER_LOGS_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Failed to clear Master Portfolio storage:', error);
  }
}

/**
 * Merges newly imported records into the Master Portfolio adhering to the strict rules:
 * 1. ACCOUNT_NUMBER is the primary key. If empty, falls back to National ID or Customer Name.
 * 2. If record is not found in master: Added as a new account.
 * 3. If record is found in master: No duplicate is created; existing record is updated.
 * 4. Fields with new values in the imported record update the existing record.
 * 5. Fields without a new value in the imported record retain their previous value.
 * 6. FORBIDDEN to overwrite an existing non-empty value with an empty string or null.
 * 7. Tracks new accounts, updated accounts, and exact duplicate rows.
 * 8. Records a permanent save log.
 */
export function mergeIntoMasterPortfolio(
  currentMaster: PortfolioRecord[],
  incomingRecords: PortfolioRecord[],
  fileName: string
): { updatedMaster: PortfolioRecord[]; result: MasterSaveResult } {
  const totalBefore = currentMaster.length;
  let newAccountsCount = 0;
  let updatedAccountsCount = 0;
  let duplicateRowsCount = 0;

  // Build account lookup map based on ACCOUNT_NUMBER (or fallback key)
  const masterMap = new Map<string, { record: PortfolioRecord; index: number }>();

  // Deep clone current master records so we don't mutate state unexpectedly
  const updatedMaster: PortfolioRecord[] = currentMaster.map((r) => ({ ...r }));

  updatedMaster.forEach((rec, idx) => {
    const key = getRecordPrimaryKey(rec);
    if (key) {
      masterMap.set(key, { record: rec, index: idx });
    }
  });

  // Track accounts updated in this batch so an account updated multiple times in the same file is counted once
  const updatedAccountKeys = new Set<string>();
  const newAccountKeys = new Set<string>();

  for (const incoming of incomingRecords) {
    const key = getRecordPrimaryKey(incoming);
    if (!key) continue;

    if (!masterMap.has(key)) {
      // 1. Brand new account: Add to master
      const newId = incoming.id || `master_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newRec: PortfolioRecord = {
        ...incoming,
        id: newId,
        mobileNumber: formatSaudiMobileInternational(incoming.mobileNumber)
      };
      const newIndex = updatedMaster.length;
      updatedMaster.push(newRec);
      masterMap.set(key, { record: newRec, index: newIndex });
      newAccountKeys.add(key);
      newAccountsCount++;
    } else {
      // 2. Existing account: Merge new non-empty fields into existing record
      const existingEntry = masterMap.get(key)!;
      const existing = existingEntry.record;
      let hasChanges = false;

      // Fields to merge:
      const mergeableKeys: (keyof PortfolioRecord)[] = [
        'accountNumber',
        'debtAmount',
        'customerName',
        'productType',
        'nationalId',
        'freezeDate',
        'mobileNumber',
        'requestType',
        'requestNumber',
        'requestStatus',
        'requestOpenDate',
        'description'
      ];

      for (const field of mergeableKeys) {
        const incomingVal = incoming[field];
        const existingVal = existing[field];

        const existingStr = typeof existingVal === 'string' ? existingVal.trim() : '';

        // Rule: Only update if incoming has a non-empty string and it differs from existing
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

      // Handle raw parsed date
      if (incoming.rawParsedDate && !isNaN(incoming.rawParsedDate.getTime())) {
        existing.rawParsedDate = incoming.rawParsedDate;
      }

      if (hasChanges) {
        if (!newAccountKeys.has(key) && !updatedAccountKeys.has(key)) {
          updatedAccountKeys.add(key);
          updatedAccountsCount++;
        }
      } else {
        duplicateRowsCount++;
      }
    }
  }

  const totalAfter = updatedMaster.length;

  // Format Arabic Date/Time
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('ar-SA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(now);

  const saveLog: MasterSaveLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate,
    fileName: fileName || 'ملف_بدون_اسم.xlsx',
    importedRows: incomingRecords.length,
    newAccountsCount,
    updatedAccountsCount,
    duplicateRowsCount,
    totalMasterAfter: totalAfter
  };

  // Ensure master portfolio is stored sorted descending by debt amount (highest to lowest)
  updatedMaster.sort((a, b) => {
    const valA = parseFloat(String(a.debtAmount || '').replace(/,/g, '')) || 0;
    const valB = parseFloat(String(b.debtAmount || '').replace(/,/g, '')) || 0;
    return valB - valA;
  });

  // Persist to Storage
  saveMasterPortfolio(updatedMaster);
  const existingLogs = loadMasterLogs();
  const newLogs = [saveLog, ...existingLogs];
  saveMasterLogs(newLogs);

  return {
    updatedMaster,
    result: {
      newAccountsCount,
      updatedAccountsCount,
      duplicateRowsCount,
      totalBefore,
      totalAfter,
      log: saveLog
    }
  };
}

/**
 * Returns the normalized primary key for a record (account number prioritized).
 */
function getRecordPrimaryKey(rec: PortfolioRecord): string {
  if (rec.accountNumber && rec.accountNumber.trim()) {
    return `ACC_${rec.accountNumber.trim().toUpperCase()}`;
  }
  if (rec.nationalId && rec.nationalId.trim()) {
    return `ID_${rec.nationalId.trim().toUpperCase()}`;
  }
  if (rec.customerName && rec.customerName.trim()) {
    return `NAME_${rec.customerName.trim().toUpperCase()}`;
  }
  return '';
}

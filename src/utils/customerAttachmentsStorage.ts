import { CustomerAttachment } from '../types';

const DB_NAME = 'MahfadatyCustomerFilesDB_V1';
const STORE_NAME = 'customer_attachments';
const DB_VERSION = 1;
const LOCALSTORAGE_FALLBACK_KEY = 'MAHFADATY_CUSTOMER_ATTACHMENTS_FALLBACK_V1';

/**
 * Open or initialize IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('customerKey', 'customerKey', { unique: false });
        store.createIndex('customer_slot', ['customerKey', 'slotIndex'], { unique: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Normalizes customer account / identifier key
 */
export function getCustomerKey(accountNumber?: string, customerName?: string, nationalId?: string): string {
  if (accountNumber && accountNumber.trim()) {
    return `ACC_${accountNumber.trim().toUpperCase()}`;
  }
  if (nationalId && nationalId.trim()) {
    return `ID_${nationalId.trim().toUpperCase()}`;
  }
  if (customerName && customerName.trim()) {
    return `NAME_${customerName.trim().toUpperCase()}`;
  }
  return 'UNKNOWN_CUSTOMER';
}

/**
 * Loads all 4 attachment slots for a given customer
 */
export async function loadCustomerAttachments(
  customerKey: string
): Promise<Record<number, CustomerAttachment>> {
  if (!customerKey) return {};

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('customerKey');
      const request = index.getAll(customerKey);

      request.onsuccess = () => {
        const items: CustomerAttachment[] = request.result || [];
        const result: Record<number, CustomerAttachment> = {};
        for (const item of items) {
          result[item.slotIndex] = item;
        }
        resolve(result);
      };

      request.onerror = () => {
        console.warn('IndexedDB read failed, trying localStorage fallback');
        resolve(loadFromLocalStorageFallback(customerKey));
      };
    });
  } catch (err) {
    console.warn('IndexedDB open failed, using localStorage fallback', err);
    return loadFromLocalStorageFallback(customerKey);
  }
}

/**
 * Saves a customer attachment into IndexedDB (or fallback)
 */
export async function saveCustomerAttachment(
  attachment: CustomerAttachment
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Primary key is composite id e.g. `${customerKey}_slot_${slotIndex}`
      const itemToSave = {
        ...attachment,
        id: `${attachment.customerKey}_slot_${attachment.slotIndex}`
      };

      const request = store.put(itemToSave);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to save in IndexedDB:', request.error);
        saveToLocalStorageFallback(attachment);
        resolve(true);
      };
    });
  } catch (err) {
    console.warn('IndexedDB save failed, using fallback', err);
    saveToLocalStorageFallback(attachment);
    return true;
  }
}

/**
 * Deletes an attachment from a specific slot
 */
export async function deleteCustomerAttachment(
  customerKey: string,
  slotIndex: number
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const id = `${customerKey}_slot_${slotIndex}`;
      const request = store.delete(id);

      request.onsuccess = () => {
        deleteFromLocalStorageFallback(customerKey, slotIndex);
        resolve(true);
      };

      request.onerror = () => {
        deleteFromLocalStorageFallback(customerKey, slotIndex);
        resolve(true);
      };
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, using fallback', err);
    deleteFromLocalStorageFallback(customerKey, slotIndex);
    return true;
  }
}

/**
 * Format bytes to readable Arabic string (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Converts browser File object to base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ----------------- LocalStorage Fallback Helpers -----------------

function loadFromLocalStorageFallback(customerKey: string): Record<number, CustomerAttachment> {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_FALLBACK_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, Record<number, CustomerAttachment>>;
    return all[customerKey] || {};
  } catch {
    return {};
  }
}

function saveToLocalStorageFallback(attachment: CustomerAttachment) {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_FALLBACK_KEY);
    const all = raw ? JSON.parse(raw) : {};
    if (!all[attachment.customerKey]) {
      all[attachment.customerKey] = {};
    }
    all[attachment.customerKey][attachment.slotIndex] = attachment;
    localStorage.setItem(LOCALSTORAGE_FALLBACK_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('LocalStorage fallback quota exceeded', e);
  }
}

function deleteFromLocalStorageFallback(customerKey: string, slotIndex: number) {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_FALLBACK_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    if (all[customerKey]) {
      delete all[customerKey][slotIndex];
      localStorage.setItem(LOCALSTORAGE_FALLBACK_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.warn('Failed to delete from localStorage fallback', e);
  }
}

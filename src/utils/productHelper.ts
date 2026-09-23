/**
 * Normalizes product type according to standardized banking abbreviations:
 * - RF: Real Estate Finance (التمويل العقاري)
 * - PF: Personal Finance (التمويل الشخصي)
 * - AL: Auto Lease (التمويل التأجيري)
 * - CC: Credit Card (البطاقة الائتمانية)
 */
export type StandardProductCode = 'RF' | 'PF' | 'AL' | 'CC';

export interface ProductMappingInfo {
  code: StandardProductCode;
  label: string;
  badgeColor: string;
}

export const PRODUCT_MAPPINGS: Record<StandardProductCode, { label: string; badgeColor: string }> = {
  RF: {
    label: 'التمويل العقاري',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  PF: {
    label: 'التمويل الشخصي',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  AL: {
    label: 'التمويل التأجيري',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  CC: {
    label: 'البطاقة الائتمانية',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
  }
};

/**
 * Maps any raw product string from Excel or input to the 4 standard codes:
 * RF: التمويل العقاري
 * PF: التمويل الشخصي
 * AL: التمويل التأجيري
 * CC: البطاقة الإئتمانية
 */
export function normalizeProductType(val: unknown): string {
  if (val === null || val === undefined) return '';
  const trimmed = String(val).trim();
  if (!trimmed || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') return '';

  const clean = trimmed
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toUpperCase();

  // 1. Exact or direct code matches
  if (clean === 'RF') return 'RF';
  if (clean === 'PF') return 'PF';
  if (clean === 'AL') return 'AL';
  if (clean === 'CC') return 'CC';

  // 2. Real Estate Finance -> RF
  if (
    clean.includes('عقاري') || 
    clean.includes('عقار') || 
    clean.includes('REAL ESTATE') || 
    clean.includes('MORTGAGE')
  ) {
    return 'RF';
  }

  // 3. Personal Finance -> PF
  if (
    clean.includes('شخصي') || 
    clean.includes('PERSONAL')
  ) {
    return 'PF';
  }

  // 4. Auto Lease / Financing -> AL
  if (
    clean.includes('تاجير') || 
    clean.includes('تاجيري') || 
    clean.includes('سيار') || 
    clean.includes('AUTO') || 
    clean.includes('LEASE')
  ) {
    return 'AL';
  }

  // 5. Credit Card -> CC
  if (
    clean.includes('بطاق') || 
    clean.includes('ائتمان') || 
    clean.includes('CARD') || 
    clean.includes('CREDIT')
  ) {
    return 'CC';
  }

  // Fallback to original trimmed value if it is already another code or custom value
  return trimmed;
}

/**
 * Returns display label for a product code (e.g., "RF - التمويل العقاري")
 */
export function getProductDisplay(code: string): { code: string; label: string; fullTitle: string } {
  const norm = normalizeProductType(code);
  if (norm === 'RF') {
    return { code: 'RF', label: 'التمويل العقاري', fullTitle: 'RF - التمويل العقاري' };
  }
  if (norm === 'PF') {
    return { code: 'PF', label: 'التمويل الشخصي', fullTitle: 'PF - التمويل الشخصي' };
  }
  if (norm === 'AL') {
    return { code: 'AL', label: 'التمويل التأجيري', fullTitle: 'AL - التمويل التأجيري' };
  }
  if (norm === 'CC') {
    return { code: 'CC', label: 'البطاقة الائتمانية', fullTitle: 'CC - البطاقة الائتمانية' };
  }
  return { code: norm || '-', label: norm || '-', fullTitle: norm || '-' };
}

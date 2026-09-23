/**
 * Utilities for cleaning mobile phone numbers and generating direct WhatsApp (wa.me) links.
 */

/**
 * Converts Eastern Arabic numerals (٠-٩) and Persian numerals (۰-۹) to standard Western numerals (0-9).
 */
export function normalizeArabicNumerals(input: string): string {
  if (!input) return '';
  return input
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
}

export interface ParsedMobileResult {
  isValid: boolean;
  cleanMobile: string; // Friendly display format (e.g. "0501234567")
  internationalDisplay: string; // Unified Saudi international format with '+' (e.g. "+966501234567")
  internationalPhone: string; // International clean digits without '+' (e.g. "966501234567")
  whatsappUrl: string; // e.g. "https://wa.me/966501234567"
}

/**
 * Standardizes a mobile number to Saudi International format: +9665XXXXXXXX
 * - If begins with 05 -> strip 0 and prepend +966 (e.g. 0551234567 -> +966551234567)
 * - If begins with 5 (9 digits) -> prepend +966 (e.g. 551234567 -> +966551234567)
 * - If begins with 966 -> prepend '+' (e.g. 966551234567 -> +966551234567)
 * - If already starts with +966 -> keep as is (cleaned from spaces/dashes)
 * - Removes any spaces, dashes, brackets, or punctuation.
 * - Converts Eastern Arabic / Persian numerals to Western digits (0-9).
 * - Leaves invalid or non-matching inputs as is without corrupting them.
 */
export function formatSaudiMobileInternational(val: unknown): string {
  if (val === null || val === undefined) return '';
  const rawStr = normalizeArabicNumerals(String(val)).trim();
  if (!rawStr) return '';

  // Handle scientific notation e.g. "5.01E+08" or "9.665E+11"
  let cleanInput = rawStr;
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(cleanInput)) {
    const num = Number(cleanInput);
    if (!isNaN(num) && Number.isInteger(num)) {
      cleanInput = BigInt(Math.floor(num)).toString();
    }
  }

  // Extract only digits
  const digits = cleanInput.replace(/\D/g, '');
  if (!digits) return rawStr;

  // Case 1: Already has 009665XXXXXXXX (14 digits)
  if (digits.startsWith('009665') && digits.length === 14) {
    return `+${digits.slice(2)}`;
  }

  // Case 2: 9665XXXXXXXX (12 digits)
  if (digits.startsWith('9665') && digits.length === 12) {
    return `+${digits}`;
  }

  // Case 3: 05XXXXXXXX (10 digits)
  if (digits.startsWith('05') && digits.length === 10) {
    return `+966${digits.slice(1)}`;
  }

  // Case 4: 5XXXXXXXX (9 digits)
  if (digits.startsWith('5') && digits.length === 9) {
    return `+966${digits}`;
  }

  // Generic valid international number starting with 00 (e.g. 00971...)
  if (digits.startsWith('00') && digits.length >= 11 && digits.length <= 15) {
    return `+${digits.slice(2)}`;
  }

  // If already starts with + and matches international digits
  if (rawStr.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  // If not matching valid Saudi pattern, return cleaned digits or original without corrupting
  return rawStr;
}

/**
 * Cleans and validates a mobile phone number and generates a WhatsApp wa.me link.
 * Handles Saudi numbers (05XXXXXXXX, 9665XXXXXXXX, 5XXXXXXXX) and international formats.
 */
export function parseMobileAndGenerateWhatsAppUrl(val: unknown): ParsedMobileResult {
  const invalidResult: ParsedMobileResult = {
    isValid: false,
    cleanMobile: '',
    internationalDisplay: '',
    internationalPhone: '',
    whatsappUrl: ''
  };

  if (val === null || val === undefined || val === '') {
    return invalidResult;
  }

  // Convert to string and normalize Arabic/Eastern digits
  let str = normalizeArabicNumerals(String(val)).trim();
  if (!str) return invalidResult;

  // Handle scientific notation e.g. "5.01E+08" or "9.665E+11"
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(str)) {
    const num = Number(str);
    if (!isNaN(num) && Number.isInteger(num)) {
      str = BigInt(Math.floor(num)).toString();
    }
  }

  // Extract only digits
  const digits = str.replace(/\D/g, '');

  // Must have at least 9 digits and not be all identical digits (e.g. "0000000000")
  if (digits.length < 9 || digits.length > 15) {
    return invalidResult;
  }
  if (/^(\d)\1+$/.test(digits)) {
    return invalidResult;
  }

  let internationalPhone = '';
  let cleanMobile = '';

  // 1. Saudi format with leading "009665" (14 digits)
  if (digits.startsWith('009665') && digits.length === 14) {
    internationalPhone = digits.slice(2);
    cleanMobile = '0' + internationalPhone.slice(3);
  }
  // 2. Saudi format with leading "9665" (12 digits)
  else if (digits.startsWith('9665') && digits.length === 12) {
    internationalPhone = digits;
    cleanMobile = '0' + digits.slice(3);
  }
  // 3. Saudi local format starting with "05" (10 digits)
  else if (digits.startsWith('05') && digits.length === 10) {
    internationalPhone = '966' + digits.slice(1);
    cleanMobile = digits;
  }
  // 4. Saudi format starting with "5" (9 digits)
  else if (digits.startsWith('5') && digits.length === 9) {
    internationalPhone = '966' + digits;
    cleanMobile = '0' + digits;
  }
  // 5. Generic international numbers starting with "00"
  else if (digits.startsWith('00') && digits.length >= 11 && digits.length <= 15) {
    internationalPhone = digits.slice(2);
    cleanMobile = '+' + internationalPhone;
  }
  // 6. Generic international number (already with country code, 10-15 digits, not starting with 0)
  else if (!digits.startsWith('0') && digits.length >= 10 && digits.length <= 15) {
    internationalPhone = digits;
    cleanMobile = '+' + digits;
  }
  else {
    return invalidResult;
  }

  return {
    isValid: true,
    cleanMobile,
    internationalDisplay: `+${internationalPhone}`,
    internationalPhone,
    whatsappUrl: `https://wa.me/${internationalPhone}`
  };
}

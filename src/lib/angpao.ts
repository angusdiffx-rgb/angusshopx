/**
 * Client & Shared utilities for TrueMoney Wallet Angpao (Gift Voucher)
 */

export const ANGPAO_RECIPIENT_PHONE = '0829848852';
export const ANGPAO_RECIPIENT_NAME = 'นาย กฤติน สุโขพล';

/**
 * Extracts voucher hash from a raw string or URL
 * Examples:
 * - https://gift.truemoney.com/campaign/?v=018d45f3404c7f0b904c6e93e2b1c45e
 * - ?v=018d45f3404c7f0b904c6e93e2b1c45e
 * - 018d45f3404c7f0b904c6e93e2b1c45e
 */
export function extractVoucherCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Try parsing as URL
  try {
    if (trimmed.includes('gift.truemoney.com') || trimmed.includes('?v=')) {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9]+$/.test(v.trim())) {
        return v.trim();
      }
    }
  } catch {
    // Fallback to regex
  }

  // Regex for ?v=xxx
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // Direct alphanumeric hash
  const codeMatch = trimmed.match(/^[a-zA-Z0-9]{10,64}$/);
  if (codeMatch) {
    return codeMatch[0];
  }

  return null;
}

/**
 * Format Thai phone number for display (e.g. 082-984-8852)
 */
export function formatPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`;
  }
  return phone;
}

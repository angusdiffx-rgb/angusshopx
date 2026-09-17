/**
 * TrueMoney Wallet Angpao (Gift Voucher) Redemption Service
 * Handles voucher extraction, redemption via gateway and direct fallback,
 * and error code translation for Thai users.
 */

export interface RedeemAngpaoResult {
  success: boolean;
  code?: string | number;
  amount?: number;
  senderName?: string;
  recipientPhone?: string;
  voucherCode: string;
  message: string;
  raw?: any;
}

const DEFAULT_RECIPIENT_PHONE = '0829848852';

// Friendly Thai translations for TrueMoney voucher error codes
const ERROR_MESSAGES: Record<string, string> = {
  '100': 'ซองของขวัญนี้ถูกรับไปหมดแล้ว (VOUCHER_OUT_OF_STOCK)',
  '101': 'ลิงก์ซองของขวัญไม่ถูกต้อง หรือไม่พบข้อมูลซองในระบบ (VOUCHER_NOT_FOUND)',
  '102': 'ซองของขวัญนี้หมดอายุแล้ว (VOUCHER_EXPIRED)',
  '103': 'ไม่สามารถรับซองของขวัญของตนเองได้ (CANNOT_GET_OWN_VOUCHER)',
  '104': 'ไม่พบบัญชี TrueMoney Wallet ปลายทาง (TARGET_USER_NOT_FOUND)',
  'VOUCHER_OUT_OF_STOCK': 'ซองของขวัญนี้ถูกรับไปหมดแล้ว กรุณาสร้างซองใหม่',
  'VOUCHER_NOT_FOUND': 'ไม่พบข้อมูลซองของขวัญ กรุณาตรวจสอบลิงก์อีกครั้ง',
  'VOUCHER_EXPIRED': 'ซองของขวัญนี้หมดอายุแล้ว (อายุซองของขวัญ 72 ชั่วโมง)',
  'CANNOT_GET_OWN_VOUCHER': 'ไม่สามารถรับซองของขวัญของตนเองได้ (เบอร์ผู้สร้างซองตรงกับเบอร์รับเงิน)',
  'TARGET_USER_NOT_FOUND': 'ไม่พบหมายเลขโทรศัพท์ปลายทางในระบบ TrueMoney Wallet',
  'INVALID_MOBILE': 'หมายเลขโทรศัพท์ปลายทางไม่ถูกต้อง',
  'INTERNAL_ERROR': 'เกิดข้อผิดพลาดในการตรวจสอบซองของขวัญ กรุณาลองใหม่อีกครั้ง'
};

/**
 * Extracts clean voucher hash from user input
 * Supports:
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
    // URL parse failed, proceed to regex
  }

  // Regex for ?v=xxx or &v=xxx
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // Direct alphanumeric code (typically 32 to 45 chars, e.g. 35 chars)
  const codeMatch = trimmed.match(/^[a-zA-Z0-9]{10,64}$/);
  if (codeMatch) {
    return codeMatch[0];
  }

  return null;
}

/**
 * Redeem TrueMoney Angpao Voucher into recipient phone number
 * @param voucherInput Link or voucher hash
 * @param phone Recipient phone (defaults to 0829848852)
 */
export async function redeemAngpaoVoucher(
  voucherInput: string,
  phone: string = DEFAULT_RECIPIENT_PHONE
): Promise<RedeemAngpaoResult> {
  const cleanPhone = phone.replace(/\D/g, '') || DEFAULT_RECIPIENT_PHONE;
  const voucherCode = extractVoucherCode(voucherInput);

  if (!voucherCode) {
    return {
      success: false,
      voucherCode: voucherInput,
      message: 'รูปแบบลิงก์หรือรหัสซองของขวัญไม่ถูกต้อง กรุณาวางลิงก์ที่ได้จากแอป TrueMoney เช่น https://gift.truemoney.com/campaign/?v=...'
    };
  }

  if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
    return {
      success: false,
      voucherCode,
      message: 'หมายเลขโทรศัพท์ปลายทางไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 10 หลัก'
    };
  }

  // Attempt 1: Gateway Autozy API (specialized TrueMoney voucher gateway with CF bypass)
  try {
    const gatewayUrl = `https://gateway.autozy.app/api/giftvoucher/${voucherCode}/${cleanPhone}/`;
    const gatewayRes = await fetch(gatewayUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AngusShop-AngpaoService/1.0'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (gatewayRes.ok) {
      const data = await gatewayRes.json();
      if (data.status === 'success' && (data.code === 200 || data.code === '200') && data.data) {
        const amount = typeof data.data.amount === 'number' 
          ? data.data.amount 
          : parseFloat(data.data.amount);

        if (!isNaN(amount) && amount > 0) {
          return {
            success: true,
            code: 'SUCCESS',
            amount,
            senderName: data.data.name || undefined,
            recipientPhone: cleanPhone,
            voucherCode,
            message: `รับเงินจากซองของขวัญ ฿${amount.toLocaleString()} สำเร็จ`,
            raw: data
          };
        }
      }

      // If gateway returned an error response, format friendly message
      if (data.status === 'error' || data.code) {
        const errKey = String(data.code);
        const thaiMsg = ERROR_MESSAGES[errKey] || data.message || ERROR_MESSAGES[data.message_en] || data.message_en || 'ไม่สามารถรับซองของขวัญได้';
        return {
          success: false,
          code: data.code,
          voucherCode,
          message: thaiMsg,
          raw: data
        };
      }
    }
  } catch (err: any) {
    console.warn('Gateway Autozy call failed, trying direct TrueMoney fallback:', err.message);
  }

  // Attempt 2: Direct TrueMoney API fallback
  try {
    const directUrl = `https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`;
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://gift.truemoney.com',
        'Referer': `https://gift.truemoney.com/campaign/?v=${voucherCode}`,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
      },
      body: JSON.stringify({
        mobile: cleanPhone,
        voucher_hash: voucherCode
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (directRes.ok) {
      const data = await directRes.json();
      if (data?.status?.code === 'SUCCESS' && data?.data) {
        const amountStr = data.data.my_ticket?.amount_baht || 
                          data.data.voucher?.redeemed_amount_baht || 
                          data.data.voucher?.amount_baht;
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount > 0) {
          return {
            success: true,
            code: 'SUCCESS',
            amount,
            senderName: data.data.owner_profile?.full_name || undefined,
            recipientPhone: cleanPhone,
            voucherCode,
            message: `รับเงินจากซองของขวัญ ฿${amount.toLocaleString()} สำเร็จ`,
            raw: data
          };
        }
      }

      if (data?.status?.code) {
        const errCode = data.status.code;
        const thaiMsg = ERROR_MESSAGES[errCode] || data.status.message || 'ไม่สามารถรับซองของขวัญได้';
        return {
          success: false,
          code: errCode,
          voucherCode,
          message: thaiMsg,
          raw: data
        };
      }
    }
  } catch (err: any) {
    console.error('Direct TrueMoney redeem call failed:', err.message);
  }

  // If both failed or unavailable
  return {
    success: false,
    voucherCode,
    message: 'ไม่สามารถเชื่อมต่อระบบรับซองของขวัญ TrueMoney ได้ในขณะนี้ กรุณาตรวจสอบลิงก์ซองของขวัญหรือลองใหม่อีกครั้ง'
  };
}

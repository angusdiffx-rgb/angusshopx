import QRCode from 'qrcode';

// CRC16-CCITT calculation for EMVCo
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
}

function formatTag(id: string, value: string): string {
  const len = ('00' + value.length).slice(-2);
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(mobileNumber: string, amount?: number): string {
  // Normalize mobile number (remove dashes, spaces)
  const cleaned = mobileNumber.replace(/[^0-9]/g, '');
  let formattedMobile = cleaned;
  if (cleaned.startsWith('0')) {
    formattedMobile = '0066' + cleaned.substring(1);
  }

  // Tag 29 sub-tags:
  // 00: AID A000000677010111
  // 01: Mobile number (0066XXXXXXXXX)
  const aid = formatTag('00', 'A000000677010111');
  const mobileTag = formatTag('01', formattedMobile);
  const merchantAccount = formatTag('29', aid + mobileTag);

  // Core payload
  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount && amount > 0 ? '12' : '11'); // Point of Initiation: 12 dynamic, 11 static
  payload += merchantAccount;
  payload += formatTag('53', '764'); // Transaction Currency (764 = THB)

  if (amount && amount > 0) {
    payload += formatTag('54', amount.toFixed(2));
  }

  payload += formatTag('58', 'TH'); // Country Code

  // Checksum calculation (Tag 63 length 04)
  const rawWithCrcTag = payload + '6304';
  const crc = crc16(rawWithCrcTag);

  return rawWithCrcTag + crc;
}

export async function generatePromptPayQR(mobileNumber: string, amount?: number): Promise<string> {
  const payload = generatePromptPayPayload(mobileNumber, amount);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 380,
    color: {
      dark: '#0B0F19',
      light: '#FFFFFF'
    }
  });
}

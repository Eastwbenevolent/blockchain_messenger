// utils/qr.js
import QRCode from 'qrcode';

/**
 * JWT나 기타 텍스트를 받아 QR 코드 Data URL을 생성
 * @param {string|object} data - 인코딩할 데이터 (객체도 가능)
 * @returns {Promise<string>} - data:image/png;base64,... 형식의 Data URL
 */
export async function generateQR(data) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return QRCode.toDataURL(str, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
  });
}

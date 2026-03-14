// QR Code generation utility
import QRCode from 'qrcode';

export async function generateQRCode(url: string, size = 256): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { width: 300, margin: 2 });
}

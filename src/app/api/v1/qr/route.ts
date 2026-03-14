// QR Code API
import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode } from '@/lib/qrcode';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const size = parseInt(request.nextUrl.searchParams.get('size') || '256');
  
  if (!url) {
    return NextResponse.json({ success: false, message: 'Missing url parameter' }, { status: 400 });
  }
  
  try {
    const dataUrl = await generateQRCode(url, size);
    return NextResponse.json({ success: true, data: { qr: dataUrl, url } });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to generate QR code' }, { status: 500 });
  }
}

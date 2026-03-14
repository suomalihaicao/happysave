import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '快乐省省 HappySave - 全球优惠券平台',
  description: '发现全球品牌独家优惠码和折扣信息。Global Coupons & Deals Platform.',
  keywords: '优惠券, coupons, deals, 折扣, 全球购物, global shopping',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

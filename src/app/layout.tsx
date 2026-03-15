import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '快乐省省 HappySave - 全球优惠券平台',
    template: '%s | 快乐省省 HappySave',
  },
  description: '发现全球品牌独家优惠码和折扣信息。Temu、SHEIN、Nike、Apple 等 47+ 知名品牌优惠一手掌握。Global Coupons & Deals Platform.',
  keywords: '优惠券, coupons, deals, 折扣, 全球购物, global shopping, promo code, coupon code, Temu, SHEIN, Nike, Apple',
  metadataBase: new URL('https://happysave.com'),
  openGraph: {
    type: 'website',
    siteName: '快乐省省 HappySave',
    title: '快乐省省 HappySave - 全球优惠券平台',
    description: '发现全球品牌独家优惠码和折扣信息',
  },
  twitter: {
    card: 'summary_large_image',
    title: '快乐省省 HappySave',
    description: '发现全球品牌独家优惠码和折扣信息',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* Google AdSense (审核通过后取消注释) */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX" crossOrigin="anonymous" /> */}
        
        {/* Google Analytics (填入ID后取消注释) */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}} /> */}

        {/* 网站结构化数据 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: '快乐省省 HappySave',
            description: '全球优惠券聚合平台',
            url: 'https://happysave.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://happysave.com/?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

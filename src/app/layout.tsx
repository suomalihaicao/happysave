import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SEO_CONFIG, getWebsiteJsonLd } from '@/lib/seo';
import { PWARegister } from '@/components/PWARegister';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.baseUrl),
  title: {
    default: SEO_CONFIG.defaultTitle,
    template: '%s - 快乐省省 | 全球优惠券',
  },
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.keywords,
  authors: [{ name: '快乐省省' }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SEO_CONFIG.baseUrl,
    languages: {
      'zh-CN': SEO_CONFIG.baseUrl,
      'en': `${SEO_CONFIG.baseUrl}/en`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: ['en_US'],
    siteName: SEO_CONFIG.siteName,
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    url: SEO_CONFIG.baseUrl,
    images: [{ url: `${SEO_CONFIG.baseUrl}/og-image`, width: 1200, height: 630, alt: '快乐省省' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    images: [`${SEO_CONFIG.baseUrl}/og-image`],
    site: SEO_CONFIG.twitterHandle,
  },
  verification: {
    google: SEO_CONFIG.googleVerify,
    other: { 'baidu-site-verification': SEO_CONFIG.baiduVerify },
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ff6b35" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="快乐省省" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getWebsiteJsonLd()) }}
        />
        {/* Baidu 验证 */}
        <meta name="baidu-site-verification" content="codeva-placeholder" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PLACEHOLDER" />
        <script dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-PLACEHOLDER');`
        }} />
        {/* Google AdSense */}
        <meta name="google-adsense-account" content="ca-pub-3022741090651583" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3022741090651583" crossOrigin="anonymous" />
        {/* 百度统计 */}
        <script dangerouslySetInnerHTML={{
          __html: `var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?PLACEHOLDER";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();`
        }} />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
        <PWARegister />
      </body>
    </html>
  );
}

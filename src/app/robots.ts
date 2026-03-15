// robots.txt - 搜索引擎配置
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'Sogou web spider',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: '360Spider',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: 'https://happysave.cn/sitemap.xml',
    host: 'https://happysave.cn',
  };
}

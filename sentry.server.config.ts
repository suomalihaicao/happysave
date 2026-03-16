// Sentry Server Config - 后端错误捕获
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  
  enabled: process.env.NODE_ENV === 'production',
  
  tracesSampleRate: 0.1,
  
  // 过滤掉不重要的错误
  ignoreErrors: [
    'ECONNREFUSED',
    'ECONNRESET',
    'ENOTFOUND',
    'EPIPE',
    'ETIMEOUT',
  ],
});

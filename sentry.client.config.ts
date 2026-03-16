// Sentry Client Config - 前端错误捕获
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  
  // 生产环境才启用
  enabled: process.env.NODE_ENV === 'production',
  
  // 性能监控采样率
  tracesSampleRate: 0.1,
  
  // Session Replay (可选，记录用户操作)
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  
  // 过滤掉不重要的错误
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Non-Error promise rejection captured',
  ],
});

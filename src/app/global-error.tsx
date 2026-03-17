'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui',
        background: '#f5f5f5', padding: 20, textAlign: 'center',
      }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>😵</div>
        <h1 style={{ fontSize: 32, marginBottom: 8, color: '#ff4d4f' }}>出错了</h1>
        <p style={{ color: '#666', marginBottom: 24, maxWidth: 400 }}>
          页面加载时遇到问题，请稍后重试。
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={reset} style={{
            padding: '10px 24px', background: '#ff6b35', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
          }}>🔄 重试</button>
          <a href="/" style={{
            padding: '10px 24px', background: '#fff', color: '#333',
            border: '1px solid #d9d9d9', borderRadius: 8, fontSize: 14,
            textDecoration: 'none',
          }}>🏠 回到首页</a>
        </div>
      </body>
    </html>
  );
}

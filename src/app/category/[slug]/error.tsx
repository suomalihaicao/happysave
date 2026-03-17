'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error('[Category Error]', error); }, [error]);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📂</div>
      <h2 style={{ fontSize: 24, marginBottom: 8, color: '#333' }}>分类加载失败</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>请稍后重试</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} style={{
          padding: '10px 24px', background: '#ff6b35', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
        }}>🔄 重试</button>
        <Link href="/" style={{
          padding: '10px 24px', background: '#f5f5f5', color: '#333',
          border: 'none', borderRadius: 8, fontSize: 14, textDecoration: 'none',
        }}>🏠 回到首页</Link>
      </div>
    </div>
  );
}

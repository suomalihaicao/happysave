// 404 页面
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
      textAlign: 'center',
      padding: 20,
    }}>
      <div style={{ fontSize: 120, marginBottom: 16 }}>🔍</div>
      <h1 style={{ fontSize: 48, marginBottom: 8, color: '#333' }}>404</h1>
      <p style={{ fontSize: 20, color: '#666', marginBottom: 32 }}>
        页面不存在或优惠已过期
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <Link href="/" style={{
          padding: '12px 32px',
          background: '#ff6b35',
          color: 'white',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 'bold',
        }}>
          🏠 回到首页
        </Link>
        <Link href="/admin" style={{
          padding: '12px 32px',
          background: '#f5f5f5',
          color: '#333',
          borderRadius: 8,
          textDecoration: 'none',
        }}>
          管理后台
        </Link>
      </div>
    </div>
  );
}

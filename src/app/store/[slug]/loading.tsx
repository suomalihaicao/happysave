export default function StoreLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* 骨架屏 - 商家头部 */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24,
          display: 'flex', gap: 20, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#f0f0f0',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              height: 28, width: '40%', background: '#f0f0f0', borderRadius: 6,
              marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              height: 14, width: '60%', background: '#f0f0f0', borderRadius: 4,
              marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              height: 20, width: '30%', background: '#f0f0f0', borderRadius: 4,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* 骨架屏 - 优惠券 */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16,
            borderLeft: '4px solid #f0f0f0',
          }}>
            <div style={{
              height: 20, width: '20%', background: '#f0f0f0', borderRadius: 4,
              marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              height: 16, width: '50%', background: '#f0f0f0', borderRadius: 4,
              marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div style={{
              height: 14, width: '70%', background: '#f0f0f0', borderRadius: 4,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

// OG Image Generator
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 80, fontWeight: 'bold', color: 'white', marginBottom: 20 }}>
          🎉 快乐省省
        </div>
        <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.9)', marginBottom: 40 }}>
          HappySave - 全球优惠券聚合平台
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 24, color: 'white' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 24px', borderRadius: 8 }}>
            🏷️ 50+ 商家
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 24px', borderRadius: 8 }}>
            💰 海量优惠码
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 24px', borderRadius: 8 }}>
            🤖 AI 每日更新
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

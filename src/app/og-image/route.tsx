// OG Image Generator - 支持动态商家图
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const storeName = request.nextUrl.searchParams.get('store') || '';
  const discount = request.nextUrl.searchParams.get('discount') || '';

  // 商家专属 OG 图
  if (storeName) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{
            fontSize: 28, color: 'rgba(255,255,255,0.7)',
            marginBottom: 16, fontWeight: 500,
          }}>
            🏷️ 快乐省省 · HappySave
          </div>
          <div style={{
            fontSize: 72, fontWeight: 'bold', color: 'white',
            marginBottom: 24, textAlign: 'center',
          }}>
            {storeName}
          </div>
          {discount && (
            <div style={{
              fontSize: 36, color: 'rgba(255,255,255,0.9)',
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 36px', borderRadius: 12,
            }}>
              最高 {discount} 折扣
            </div>
          )}
          <div style={{
            fontSize: 24, color: 'rgba(255,255,255,0.6)', marginTop: 40,
          }}>
            happysave.cn/store/{storeName.toLowerCase()}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // 默认首页 OG 图
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
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

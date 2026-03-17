'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const QRCodeComp = dynamic(() => import('antd').then(m => m.QRCode), {
  ssr: false,
  loading: () => <div style={{ width: 200, height: 200, background: '#f5f5f5' }}>加载中...</div>,
});

import type { Store, Coupon } from '@/types';

interface Props {
  store: Store;
  coupon?: Coupon;
}

export default function StoreDetailInteractive({ store, coupon }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const url = coupon?.affiliateUrl || store.affiliateUrl;
  const code = coupon?.code;

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const trackClick = useCallback(() => {
    fetch('/api/v1/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: store.id, couponId: coupon?.id }),
    }).catch(() => {});
  }, [store.id, coupon?.id]);

  return (
    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        onClick={() => { trackClick(); window.open(url, '_blank'); }}
        style={{
          flex: 1, background: '#ff6b35', color: '#fff', border: 'none',
          borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 'bold',
          cursor: 'pointer', minWidth: 120,
        }}
      >
        🎯 立即使用
      </button>

      {code && (
        <button
          onClick={() => { copyText(code); trackClick(); }}
          style={{
            background: copied ? '#52c41a' : '#fff', color: copied ? '#fff' : '#52c41a',
            border: '2px solid #52c41a', borderRadius: 8, padding: '12px 20px',
            fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
          }}
        >
          {copied ? '✅ 已复制' : '📋 复制优惠码'}
        </button>
      )}

      <button
        onClick={() => setQrVisible(!qrVisible)}
        style={{
          background: '#fff', color: '#666', border: '1px solid #d9d9d9',
          borderRadius: 8, padding: '12px 16px', fontSize: 14, cursor: 'pointer',
        }}
      >
        📱 二维码
      </button>

      <button
        onClick={() => {
          const text = `🔥 ${store.name} ${coupon?.discount || ''} 优惠！${code ? `\n优惠码：${code}` : ''}\n👉 https://www.happysave.cn/store/${store.slug}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }}
        style={{
          background: '#25d366', color: '#fff', border: 'none',
          borderRadius: 8, padding: '12px 16px', fontSize: 14, cursor: 'pointer',
        }}
      >
        📤 分享
      </button>

      {/* 复制链接 */}
      <button
        onClick={() => copyText(url)}
        style={{
          background: '#f5f5f5', color: '#666', border: 'none',
          borderRadius: 8, padding: '12px 16px', fontSize: 14, cursor: 'pointer',
        }}
      >
        🔗 链接
      </button>

      {/* QR 码弹窗 */}
      {qrVisible && (
        <div
          onClick={() => setQrVisible(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, padding: 24, width: 300, textAlign: 'center' }}
          >
            <h3 style={{ margin: '0 0 16px' }}>{store.name} - 扫码访问</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeComp value={url} size={200} />
            </div>
            {code && (
              <div style={{
                marginTop: 16, background: '#f6ffed', border: '2px dashed #52c41a',
                borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 18,
                fontWeight: 'bold', color: '#52c41a',
              }}>
                {code}
              </div>
            )}
            <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>扫描二维码访问</p>
            <button
              onClick={() => setQrVisible(false)}
              style={{
                marginTop: 12, background: '#f5f5f5', border: 'none', borderRadius: 8,
                padding: '8px 24px', cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

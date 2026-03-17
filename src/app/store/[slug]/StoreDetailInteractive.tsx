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

// 打赏二维码图片（替换为你的收款码）
const TIP_QR_IMAGE = '/tip-qr.png'; // 在 public/ 放置收款码图片

export default function StoreDetailInteractive({ store, coupon }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const url = coupon?.affiliateUrl || store.affiliateUrl;
  const code = coupon?.code;

  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const submitReport = useCallback((type: string) => {
    fetch('/api/v1/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'report',
        storeId: store.id,
        couponId: coupon?.id,
        reportType: type,
      }),
    }).then(() => {
      setReportSubmitted(true);
      setTimeout(() => { setReportVisible(false); setReportSubmitted(false); }, 2000);
    }).catch(() => {
      setReportSubmitted(true);
    });
  }, [store.id, coupon?.id]);

  const btnBase = {
    borderRadius: 8, padding: '10px 16px', fontSize: 13,
    cursor: 'pointer' as const, display: 'flex', alignItems: 'center', gap: 4,
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* 主操作按钮行 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => { trackClick(); window.open(url, '_blank'); }}
          style={{
            flex: 1, ...btnBase,
            background: '#ff6b35', color: '#fff', border: 'none',
            padding: '12px 24px', fontSize: 16, fontWeight: 'bold', minWidth: 120,
          }}
        >
          🎯 立即使用
        </button>

        {/* 有优惠码 → 复制优惠码；促销 → 复制链接 */}
        {code ? (
          <button
            onClick={() => { copyText(code); trackClick(); }}
            style={{
              ...btnBase,
              background: copied ? '#52c41a' : '#fff',
              color: copied ? '#fff' : '#52c41a',
              border: '2px solid #52c41a', fontWeight: 'bold',
            }}
          >
            {copied ? '✅ 已复制' : '📋 复制优惠码'}
          </button>
        ) : (
          <button
            onClick={() => { copyText(url); trackClick(); }}
            style={{
              ...btnBase,
              background: copied ? '#ff6b35' : '#fff',
              color: copied ? '#fff' : '#ff6b35',
              border: '2px solid #ff6b35', fontWeight: 'bold',
            }}
          >
            {copied ? '✅ 已复制' : '🔗 复制链接'}
          </button>
        )}

        <button
          onClick={() => setQrVisible(true)}
          style={{ ...btnBase, background: '#fff', color: '#666', border: '1px solid #d9d9d9' }}
        >
          📱
        </button>

        <button
          onClick={() => {
            const text = `🔥 ${store.name} ${coupon?.discount || ''} 优惠！${code ? `\n优惠码：${code}` : ''}\n👉 https://www.happysave.cn/store/${store.slug}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
          }}
          style={{ ...btnBase, background: '#25d366', color: '#fff', border: 'none' }}
        >
          📤
        </button>
      </div>

      {/* 辅助操作行 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#999' }}>
        <button
          onClick={() => setReportVisible(true)}
          style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          🚩 报告问题
        </button>
        <span>|</span>
        <button
          onClick={() => setTipVisible(true)}
          style={{ background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          ☕ 打赏支持
        </button>
      </div>

      {/* 二维码弹窗 */}
      {qrVisible && (
        <div onClick={() => setQrVisible(false)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <h3 style={{ margin: '0 0 16px' }}>{store.name} - 扫码访问</h3>
            <QRCodeComp value={url} size={200} />
            {code && (
              <div style={codeBoxStyle}>{code}</div>
            )}
            <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>扫描二维码访问</p>
            <button onClick={() => setQrVisible(false)} style={closeBtnStyle}>关闭</button>
          </div>
        </div>
      )}

      {/* 报告问题弹窗 */}
      {reportVisible && (
        <div onClick={() => setReportVisible(false)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <h3 style={{ margin: '0 0 16px' }}>🚩 报告问题</h3>
            {reportSubmitted ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <p style={{ color: '#52c41a' }}>感谢反馈！我们会尽快处理</p>
              </div>
            ) : (
              <>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
                  请选择问题类型：
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '❌', label: '优惠码无效/已过期', type: 'expired' },
                    { icon: '💰', label: '折扣金额不正确', type: 'wrong_discount' },
                    { icon: '🔗', label: '链接无法打开', type: 'broken_link' },
                    { icon: '📝', label: '信息有误', type: 'wrong_info' },
                    { icon: '🤔', label: '其他问题', type: 'other' },
                  ].map(item => (
                    <button
                      key={item.type}
                      onClick={() => submitReport(item.type)}
                      style={{
                        padding: '12px 16px', background: '#f5f5f5', border: '1px solid #eee',
                        borderRadius: 8, cursor: 'pointer', textAlign: 'left', fontSize: 14,
                      }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setReportVisible(false)} style={{ ...closeBtnStyle, marginTop: 12 }}>取消</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 打赏弹窗 */}
      {tipVisible && (
        <div onClick={() => setTipVisible(false)} style={overlayStyle}>
          <div onClick={e => e.stopPropagation()} style={modalStyle}>
            <h3 style={{ margin: '0 0 8px' }}>☕ 打赏支持</h3>
            <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
              如果这个优惠帮到了你，请作者喝杯咖啡吧！
            </p>
            <div style={{
              background: '#f5f5f5', borderRadius: 12, padding: 16,
              display: 'flex', justifyContent: 'center',
            }}>
              <img
                src={TIP_QR_IMAGE}
                alt="打赏二维码"
                style={{ width: 200, height: 200, borderRadius: 8 }}
                onError={(e) => {
                  // 图片不存在时显示占位
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>支持支付宝 / 微信支付</p>
            <button onClick={() => setTipVisible(false)} style={closeBtnStyle}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 共享样式
const overlayStyle = {
  position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex',
  alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1000,
};

const modalStyle = {
  background: '#fff', borderRadius: 12, padding: 24, width: 320, maxWidth: '90vw', textAlign: 'center' as const,
};

const codeBoxStyle = {
  marginTop: 16, background: '#f6ffed', border: '2px dashed #52c41a',
  borderRadius: 8, padding: 8, fontFamily: 'monospace', fontSize: 18,
  fontWeight: 'bold' as const, color: '#52c41a',
};

const closeBtnStyle = {
  marginTop: 12, background: '#f5f5f5', border: 'none', borderRadius: 8,
  padding: '8px 24px', cursor: 'pointer' as const,
};

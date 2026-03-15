// 广告位组件 - AdSense/联盟广告占位
'use client';

import React from 'react';

interface AdSlotProps {
  type: 'banner' | 'sidebar' | 'in-article' | 'sticky';
  label?: string;
}

export function AdSlot({ type, label = '广告位' }: AdSlotProps) {
  // 未配置广告时显示占位提示，配置后替换为真实广告代码
  const hasAds = process.env.NEXT_PUBLIC_ADSENSE_ID;

  const styles: Record<string, React.CSSProperties> = {
    banner: { width: '100%', height: 90, background: '#f5f5f5', borderRadius: 8 },
    sidebar: { width: 300, height: 250, background: '#f5f5f5', borderRadius: 8 },
    'in-article': { width: '100%', height: 280, background: '#f5f5f5', borderRadius: 8 },
    sticky: { width: '100%', height: 60, background: '#f5f5f5', borderRadius: 8 },
  };

  if (!hasAds) {
    // 开发模式：显示占位
    return (
      <div style={{
        ...styles[type],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#bbb',
        fontSize: 12,
        border: '1px dashed #ddd',
      }}>
        📢 {label} — 配置 NEXT_PUBLIC_ADSENSE_ID 后显示
      </div>
    );
  }

  // 生产模式：显示真实广告
  return (
    <div className={`ad-slot ad-${type}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
        data-ad-slot={type}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// 赞助商家标签
export function SponsoredBadge() {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #ff6b35, #ff8555)',
      color: '#fff',
      fontSize: 11,
      padding: '2px 8px',
      borderRadius: 4,
      fontWeight: 600,
    }}>
      ⭐ 推荐
    </span>
  );
}

// 广告配置 - AdSense 预留位
// Google AdSense 申请通过后，替换 ca-pub-XXXXXXXXXXXXXXXX

export const AD_CONFIG = {
  // Google AdSense Publisher ID (申请后填入)
  publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
  
  // 广告位
  slots: {
    // 首页顶部横幅
    homeBanner: { slot: '1234567890', format: 'horizontal', responsive: true },
    // 首页中间
    homeMiddle: { slot: '2345678901', format: 'rectangle', responsive: true },
    // 商家详情页顶部
    storeBanner: { slot: '3456789012', format: 'horizontal', responsive: true },
    // 商家详情页侧边
    storeSidebar: { slot: '4567890123', format: 'vertical', responsive: true },
    // 优惠码页面
    couponInline: { slot: '5678901234', format: 'rectangle', responsive: true },
    // 文章页
    articleBanner: { slot: '6789012345', format: 'horizontal', responsive: true },
    // 移动端底部
    mobileFooter: { slot: '7890123456', format: 'horizontal', responsive: true },
  },
  
  // 是否启用广告 (AdSense 审核通过后设为 true)
  enabled: false,
};

// Google Analytics 配置
export const ANALYTICS_CONFIG = {
  // GA4 Measurement ID (填入你的 ID)
  measurementId: 'G-XXXXXXXXXX',
  enabled: false,
};

// 广告组件
export function AdSlot({ slot, className = '' }: { slot: keyof typeof AD_CONFIG.slots; className?: string }) {
  if (!AD_CONFIG.enabled) return null;
  
  const config = AD_CONFIG.slots[slot];
  
  return `
    <ins class="adsbygoogle ${className}"
         style="display:block"
         data-ad-client="${AD_CONFIG.publisherId}"
         data-ad-slot="${config.slot}"
         data-ad-format="${config.format}"
         data-full-width-responsive="${config.responsive}">
    </ins>
  `;
}

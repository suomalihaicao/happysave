// 隐私政策
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 - 快乐省省',
  description: '快乐省省隐私政策 - 我们如何收集、使用和保护您的个人信息。',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui', lineHeight: 1.8 }}>
      <h1>隐私政策 Privacy Policy</h1>
      <p style={{ color: '#666' }}>最后更新：2026年3月15日</p>
      
      <h2>1. 信息收集</h2>
      <p>我们收集以下信息：</p>
      <ul>
        <li>访问日志（IP地址、浏览器类型、访问时间）</li>
        <li>点击追踪数据（用于统计和改进服务）</li>
        <li>Cookie信息（用于个性化体验）</li>
      </ul>

      <h2>2. 信息使用</h2>
      <p>我们使用收集的信息来：</p>
      <ul>
        <li>提供和改进我们的服务</li>
        <li>分析网站使用情况</li>
        <li>展示相关优惠信息</li>
        <li>与广告合作伙伴共享匿名统计数据</li>
      </ul>

      <h2>3. Cookie</h2>
      <p>我们使用Cookie来改善用户体验。您可以通过浏览器设置禁用Cookie。</p>

      <h2>4. 第三方服务</h2>
      <p>我们可能使用以下第三方服务：</p>
      <ul>
        <li>Google Analytics（网站分析）</li>
        <li>Google AdSense（广告展示）</li>
        <li>联盟营销平台（优惠码追踪）</li>
      </ul>

      <h2>5. 联系我们</h2>
      <p>如有隐私相关问题，请联系：privacy@happysave.cn</p>
      
      <p><a href="/">← 返回首页</a></p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layout, Input, Space, Row, Col, Button, message, Badge, FloatButton } from 'antd';
import {
  SearchOutlined, ShopOutlined, TagOutlined,
  GlobalOutlined, GiftOutlined, SafetyOutlined, ThunderboltOutlined,
  MailOutlined, RightOutlined, FireOutlined, DollarOutlined,
} from '@ant-design/icons';
import { AdSlot } from '@/components/AdSlot';
import type { Store, Coupon, Category } from '@/types';

const { Content: _Content, Footer: _Footer } = Layout; // eslint-disable-line @typescript-eslint/no-unused-vars

interface HomePageContentProps {
  initialStores: Store[];
  initialCoupons: Coupon[];
  initialCategories: Category[];
}

export default function HomePageContent({ initialStores, initialCoupons, initialCategories }: HomePageContentProps) {
  const [stores] = useState(initialStores);
  const [coupons] = useState(initialCoupons);
  const [categories] = useState(initialCategories);
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchText, setSearchText] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  // Pre-compute coupon counts per store (O(n) instead of O(n*m))
  const couponCountByStore = useState(() => {
    const map = new Map<string, number>();
    for (const c of initialCoupons) {
      map.set(c.storeId, (map.get(c.storeId) || 0) + 1);
    }
    return map;
  })[0];

  const filtered = stores.filter(s => {
    if (selectedCat !== 'all' && s.category !== selectedCat) return false;
    if (searchText && !s.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  }).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <Layout className="min-h-screen">
      {/* HEADER */}
      <header className="hs-header">
        <Link href="/" className="hs-logo">
          <div className="hs-logo-icon"><GiftOutlined /></div>
          <span>{t('快乐省省', 'HappySave')}</span>
        </Link>
        <Space className="desktop-only" size="middle">
          <Input placeholder={t('搜索商家或优惠码...', 'Search stores...')} prefix={<SearchOutlined />} style={{ width: 280, borderRadius: 20 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear />
          <Button icon={<GlobalOutlined />} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>{lang === 'zh' ? 'EN' : '中'}</Button>
        </Space>
        <div className="mobile-only" style={{ display: 'flex', gap: 8 }}>
          <Button size="small" icon={<GlobalOutlined />} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} />
        </div>
      </header>

      {/* MOBILE SEARCH */}
      <div className="hs-mobile-search">
        <Input placeholder={t('搜索商家或优惠码...', 'Search stores...')} prefix={<SearchOutlined />} style={{ borderRadius: 20 }} value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="large" />
      </div>

      {/* HERO */}
      <section className="hs-hero">
        <h1 className="hero-title">{t('发现全球好价', 'Discover Global Deals')}</h1>
        <p className="hero-subtitle">{t('汇聚 50+ 全球品牌优惠码，每日更新，让每一笔消费都物超所值', 'Exclusive coupons from 50+ global brands, updated daily')}</p>
        <div className="hs-stats">
          <div><div className="hs-stat-value">{stores.length}+</div><div className="hs-stat-label">{t('品牌商家', 'Brands')}</div></div>
          <div><div className="hs-stat-value">{coupons.length}+</div><div className="hs-stat-label">{t('优惠码', 'Coupons')}</div></div>
          <div><div className="hs-stat-value">98%</div><div className="hs-stat-label">{t('验证有效', 'Verified')}</div></div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-around', borderBottom: '1px solid #F3F4F6' }}>
        <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}><SafetyOutlined style={{ color: '#059669' }} />{t('安全验证', 'Verified')}</span>
        <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}><ThunderboltOutlined style={{ color: '#FF6B35' }} />{t('实时更新', 'Real-time')}</span>
        <span style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}><DollarOutlined style={{ color: '#7C3AED' }} />{t('完全免费', 'Free')}</span>
      </div>

      {/* CATEGORY BAR */}
      <div className="hs-cat-bar" id="stores">
        <button className={`hs-cat-chip ${selectedCat === 'all' ? 'active' : ''}`} onClick={() => setSelectedCat('all')}>
          <FireOutlined /> {t('全部', 'All')}
        </button>
        {categories.map((cat) => (
          <button key={cat.id} className={`hs-cat-chip ${selectedCat === cat.name ? 'active' : ''}`} onClick={() => setSelectedCat(cat.name)}>
            {cat.icon} {lang === 'zh' ? cat.nameZh : cat.name}
          </button>
        ))}
      </div>

      {/* STORES */}
      <section className="hs-section">
        <h2 className="hs-section-title"><ShopOutlined style={{ color: '#FF6B35' }} /> {t('品牌商家', 'Featured Stores')}</h2>
        <Row gutter={[10, 10]}>
          {filtered.map((store) => (
            <Col xs={8} sm={6} md={4} lg={3} key={store.id}>
              <Link href={`/store/${store.slug}`}>
                <div className="hs-store-card">
                  {store.featured && <div className="hs-store-badge"><FireOutlined /> {t('推荐', 'Hot')}</div>}
                  <div className="hs-store-icon">{store.name.charAt(0)}</div>
                  <div className="hs-store-name">{store.name}</div>
                  <div className="hs-store-cat">{lang === 'zh' ? store.categoryZh : store.category}</div>
                  <div style={{ marginTop: 6 }}>
                    <Badge count={couponCountByStore.get(store.id) || 0} showZero style={{ backgroundColor: '#FF6B35', fontSize: 10 }} size="small" />
                  </div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </section>

      {/* AD */}
      <div style={{ padding: '0 16px' }}><AdSlot type="banner" /></div>

      {/* SUBSCRIBE */}
      <section className="hs-section">
        <div className="hs-subscribe">
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}><MailOutlined style={{ color: '#FF6B35' }} /> {t('订阅优惠推送', 'Get Deal Alerts')}</h2>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>{t('每周精选最热优惠码，第一时间送达您的收件箱', 'Weekly top deals delivered to your inbox')}</p>
          <Space.Compact style={{ maxWidth: 420, margin: '0 auto', display: 'flex' }}>
            <Input placeholder={t('输入您的邮箱地址', 'Your email address')} type="email" id="subEmail" size="large" />
            <Button type="primary" size="large" style={{ background: '#FF6B35', border: 'none', fontWeight: 600, padding: '0 28px' }} onClick={() => {
              const el = document.getElementById('subEmail') as HTMLInputElement;
              if (el?.value) { fetch('/api/v1/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: el.value, action: 'subscribe' }) }).then(r => r.json()).then(d => { if (d.success) message.success(t('订阅成功！🎉', 'Subscribed!')); }); }
            }}>{t('立即订阅', 'Subscribe')}</Button>
          </Space.Compact>
        </div>
      </section>

      {/* FAQ */}
      <section className="hs-section">
        <h2 className="hs-section-title">{t('常见问题', 'Frequently Asked Questions')}</h2>
        <div className="hs-faq-grid">
          {[
            { q: t('如何使用优惠码？', 'How to use coupons?'), a: t('找到心仪优惠码，点击复制按钮，前往商家官网结账页面粘贴使用即可。', 'Find a coupon, copy it, paste at checkout.') },
            { q: t('优惠码是免费的吗？', 'Are coupons free?'), a: t('是的，所有优惠码完全免费使用，无需注册或付费。', 'Yes, all coupons are completely free.') },
            { q: t('优惠码过期了怎么办？', 'What if a coupon expires?'), a: t('我们每日更新优惠码，如遇失效请查看该商家页面获取最新优惠。', 'We update daily. Check the store page for latest deals.') },
            { q: t('如何成为合作商家？', 'How to partner?'), a: t('访问商务合作页面或发送邮件至 partner@happysave.cn 联系我们。', 'Visit our advertise page or email us.') },
          ].map((item, i) => (
            <div className="hs-faq-item" key={i}>
              <div className="hs-faq-q">{item.q}</div>
              <div className="hs-faq-a">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="hs-section">
        <div className="hs-cta">
          <div>
            <h2 className="hs-cta-title"><TagOutlined /> {t('商务合作', 'Partnership')}</h2>
            <p className="hs-cta-desc">{t('面向全球海淘用户，支持首页推荐位、Banner广告、邮件推送等多种合作形式', 'Reach global shoppers with featured placements, banners, and campaigns')}</p>
          </div>
          <Link href="/advertise"><button className="hs-cta-btn">{t('查看合作方案', 'View Plans')} <RightOutlined /></button></Link>
        </div>
      </section>

      {/* TAGS */}
      <section className="hs-section">
        <h2 className="hs-section-title" style={{ fontSize: 15, color: '#6B7280' }}>{t('热门搜索', 'Popular Searches')}</h2>
        <div className="hs-tag-cloud">
          {stores.slice(0, 16).map(s => (
            <Link key={s.id} href={`/store/${s.slug}`}><span className="hs-tag">{s.name} {t('优惠码', 'coupons')}</span></Link>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hs-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={8}>
              <div className="hs-logo" style={{ marginBottom: 12 }}>
                <div className="hs-logo-icon"><GiftOutlined /></div>
                <span>{t('快乐省省', 'HappySave')}</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>{t('值得信赖的全球优惠券聚合平台。帮助消费者发现最好的优惠，让每一次购物都物超所值。', 'Your trusted global coupon platform.')}</p>
            </Col>
            <Col xs={12} md={4}>
              <h4>{t('快速链接', 'Links')}</h4>
              <Link href="/" className="hs-footer-link">{t('首页', 'Home')}</Link>
              <Link href="/advertise" className="hs-footer-link">{t('商务合作', 'Advertise')}</Link>
              <Link href="/privacy" className="hs-footer-link">{t('隐私政策', 'Privacy')}</Link>
              <Link href="/terms" className="hs-footer-link">{t('使用条款', 'Terms')}</Link>
            </Col>
            <Col xs={12} md={4}>
              <h4>{t('热门分类', 'Categories')}</h4>
              {categories.slice(0, 5).map((cat) => (
                <Link key={cat.id} href={`/?cat=${cat.name}`} className="hs-footer-link">{lang === 'zh' ? cat.nameZh : cat.name}</Link>
              ))}
            </Col>
            <Col xs={24} md={8}>
              <h4>{t('联系我们', 'Contact')}</h4>
              <p style={{ fontSize: 13 }}>📧 partner@happysave.cn</p>
              <p style={{ fontSize: 13 }}>{t('工作时间：周一至周五 9:00-18:00', 'Mon-Fri 9:00-18:00 UTC+8')}</p>
            </Col>
          </Row>
          <div className="hs-footer-bottom">© 2026 {t('快乐省省', 'HappySave')}. {t('保留所有权利', 'All rights reserved')}.</div>
        </div>
      </footer>

      {/* BOTTOM NAV */}
      <nav className="hs-bottom-nav">
        <Link href="/" className="hs-nav-item active"><span className="hs-nav-icon"><ShopOutlined /></span>{t('首页', 'Home')}</Link>
        <Link href="/#stores" className="hs-nav-item"><span className="hs-nav-icon"><TagOutlined /></span>{t('商家', 'Stores')}</Link>
        <Link href="/advertise" className="hs-nav-item"><span className="hs-nav-icon"><ThunderboltOutlined /></span>{t('合作', 'Partner')}</Link>
        {/* 管理入口已隐藏 */}
      </nav>

      <FloatButton.BackTop />
    </Layout>
  );
}

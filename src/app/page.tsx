'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Layout, Input, Tag, Space, Row, Col, Button, Avatar, Badge, message, FloatButton, Card } from 'antd';
import { SearchOutlined, ShopOutlined, CopyOutlined, GlobalOutlined } from '@ant-design/icons';
import { AdSlot, SponsoredBadge } from '@/components/AdSlot';
import { getFAQJsonLd, getBreadcrumbJsonLd } from '@/lib/seo';

const { Content, Footer } = Layout;

function useData() {
  const [stores, setStores] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({ stores: 0, coupons: 0, saved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/stores').then(r => r.json()).catch(() => ({ data: [], total: 0 })),
      fetch('/api/v1/coupons').then(r => r.json()).catch(() => ({ data: [], total: 0 })),
      fetch('/api/v1/categories').then(r => r.json()).catch(() => ({ data: [], total: 0 })),
    ]).then(([s, c, cat]) => {
      setStores(s.data || []);
      setCoupons(c.data || []);
      setCategories(cat.data || []);
      setStats({ stores: s.total || s.data?.length || 0, coupons: c.total || c.data?.length || 0, saved: 15000 });
      setLoading(false);
    });
  }, []);

  return { stores, coupons, categories, stats, loading };
}

export default function HomePage() {
  const { stores, coupons, categories, stats, loading } = useData();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchText, setSearchText] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  const filtered = stores.filter(s => {
    if (selectedCat !== 'all' && s.category !== selectedCat) return false;
    if (searchText && !s.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  }).sort((a, b) => ((b as any).featured ? 1 : 0) - ((a as any).featured ? 1 : 0));

  const faqJsonLd = getFAQJsonLd();

  return (
    <Layout className="min-h-screen">
      {/* SEO: FAQ JSON-LD */}
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ===== HEADER ===== */}
      <header className="site-header">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#ff6b35', lineHeight: 1.2 }}>
              {t('快乐省省', 'HappySave')}
            </div>
            <div className="desktop-only" style={{ fontSize: 11, color: '#999' }}>
              {t('全球优惠券平台', 'Global Coupons')}
            </div>
          </div>
        </Link>

        <Space className="desktop-only" size="middle">
          <Input
            placeholder={t('搜索商家或优惠码...', 'Search...')}
            prefix={<SearchOutlined />}
            style={{ width: 280, borderRadius: 20 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Button icon={<GlobalOutlined />} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {lang === 'zh' ? 'EN' : '中文'}
          </Button>
          <Link href="/admin"><Button type="primary">{t('管理', 'Admin')}</Button></Link>
        </Space>

        {/* Mobile: Language + Admin */}
        <div className="mobile-only" style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            {lang === 'zh' ? 'EN' : '中'}
          </Button>
          <Link href="/admin"><Button size="small" type="primary">{t('管理', 'Admin')}</Button></Link>
        </div>
      </header>

      {/* ===== MOBILE SEARCH ===== */}
      <div className="mobile-search">
        <Input
          placeholder={t('搜索商家或优惠码...', 'Search stores...')}
          prefix={<SearchOutlined />}
          style={{ borderRadius: 20 }}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          size="large"
        />
      </div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <h1>{t('全球省钱，快乐购物', 'Save Big, Shop Global')}</h1>
        <p>{t('发现50+全球品牌独家优惠码，每日更新，帮你省钱购物。', 'Discover exclusive coupons from 50+ global brands. Updated daily.')}</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.stores}+</div>
            <div className="hero-stat-label">{t('商家', 'Stores')}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">{stats.coupons}+</div>
            <div className="hero-stat-label">{t('优惠码', 'Coupons')}</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">¥{Math.floor(stats.saved / 1000)}K+</div>
            <div className="hero-stat-label">{t('已省金额', 'Saved')}</div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORY BAR ===== */}
      <div className="category-bar" id="stores">
        <button className={`cat-chip ${selectedCat === 'all' ? 'active' : ''}`} onClick={() => setSelectedCat('all')}>
          🔥 {t('全部', 'All')}
        </button>
        {categories.map((cat: any) => (
          <button key={cat.id} className={`cat-chip ${selectedCat === cat.name ? 'active' : ''}`} onClick={() => setSelectedCat(cat.name)}>
            {cat.icon} {lang === 'zh' ? cat.nameZh : cat.name}
          </button>
        ))}
      </div>

      {/* ===== STORE GRID ===== */}
      <section className="store-grid main-content">
        <h2 style={{ margin: '0 4px 12px', fontSize: 17 }}>
          <ShopOutlined style={{ color: '#ff6b35' }} /> {t('热门商家', 'Popular Stores')}
        </h2>
        <Row gutter={[8, 8]}>
          {filtered.map((store: any) => (
            <Col xs={8} sm={6} md={4} lg={3} key={store.id}>
              <Link href={`/store/${store.slug}`} style={{ textDecoration: 'none' }}>
                <div className="store-card">
                  {store.featured && <div className="store-badge">⭐ {t('推荐', 'Featured')}</div>}
                  <div className="store-avatar">
                    {store.name.charAt(0)}
                  </div>
                  <div className="store-name">{store.name}</div>
                  <div className="store-cat">{lang === 'zh' ? store.categoryZh : store.category}</div>
                  <Badge count={coupons.filter((c: any) => c.storeId === store.id).length} showZero
                    style={{ marginTop: 6, backgroundColor: '#ff6b35', fontSize: 11 }}
                  >
                    <Tag style={{ fontSize: 10, height: 20, lineHeight: '18px', padding: '0 6px' }}>{t('优惠', 'deals')}</Tag>
                  </Badge>
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      </section>

      {/* ===== AD ===== */}
      <div className="ad-section">
        <AdSlot type="banner" />
      </div>

      {/* ===== SUBSCRIBE ===== */}
      <section style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px' }}>
        <div className="subscribe-section">
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>📬 {t('订阅优惠推送', 'Get Deal Alerts')}</h2>
          <p style={{ marginBottom: 16 }}>{t('每周精选最热优惠码，不错过任何省钱机会。', 'Weekly top deals delivered straight to your inbox.')}</p>
          <Space.Compact style={{ maxWidth: 400, margin: '0 auto', display: 'flex' }}>
            <Input placeholder={t('输入邮箱...', 'Your email...')} type="email" id="subEmail" size="large" />
            <Button type="primary" size="large" style={{ background: '#ff6b35', border: 'none' }} onClick={() => {
              const el = document.getElementById('subEmail') as HTMLInputElement;
              if (el?.value) {
                fetch('/api/v1/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: el.value, action: 'subscribe' }) })
                  .then(r => r.json()).then(d => { if (d.success) message.success(t('订阅成功！🎉', 'Subscribed! 🎉')); });
              }
            }}>
              {t('订阅', 'Subscribe')}
            </Button>
          </Space.Compact>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 24px' }}>
        <h2 style={{ marginBottom: 16 }}>❓ {t('常见问题', 'FAQ')}</h2>
        <div className="faq-grid">
          {[
            { q: t('如何使用优惠码？', 'How to use coupons?'), a: t('找到优惠码→点击复制→前往商家官网→结账时粘贴即可。', 'Find a coupon → Copy → Visit store → Paste at checkout.') },
            { q: t('优惠码免费吗？', 'Are coupons free?'), a: t('全部免费！快乐省省所有优惠码无需注册即可使用。', 'Yes! All coupons are completely free, no registration needed.') },
            { q: t('优惠码过期怎么办？', 'Expired coupon?'), a: t('我们会每日更新优惠码，查看该商家页面获取最新优惠。', 'We update daily. Check the store page for the latest deals.') },
            { q: t('怎么成为合作商家？', 'Partner with us?'), a: t('访问 /advertise 页面，查看合作方案并联系我们。', 'Visit /advertise to see partnership options and contact us.') },
          ].map((faq, i) => (
            <div className="faq-item" key={i}>
              <div className="faq-q">{faq.q}</div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA Banner ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 32px' }}>
        <div className="cta-banner">
          <h2 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>📢 {t('商务合作 / 广告投放', 'Advertise With Us')}</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
            {t('面向全球海淘用户，支持首页推荐位、商家列表置顶、优惠码Banner等多种合作形式。', 'Reach global shoppers with featured placements, banners, and more.')}
          </p>
          <Button type="primary" size="large" href="/advertise"
            style={{ background: '#fff', color: '#764ba2', border: 'none', fontWeight: 600 }}>
            {t('查看合作方案', 'View Plans')} →
          </Button>
        </div>
      </section>

      {/* ===== SEO: Internal Links ===== */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px 48px' }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>🏷️ {t('热门搜索', 'Popular Searches')}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {stores.slice(0, 20).map(s => (
            <Link key={s.id} href={`/store/${s.slug}`}>
              <Tag style={{ padding: '4px 12px', fontSize: 13, cursor: 'pointer', marginBottom: 4 }}>
                {s.name} {t('优惠码', 'coupons')}
              </Tag>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <h3 style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>🎉 {t('快乐省省', 'HappySave')}</h3>
              <p>{t('你值得信赖的全球优惠券平台。', 'Your trusted global coupon platform.')}</p>
            </Col>
            <Col xs={24} md={8}>
              <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{t('快速链接', 'Links')}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Link href="/advertise" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('商务合作', 'Advertise')}</Link>
                <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('隐私政策', 'Privacy')}</Link>
                <Link href="/terms" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('使用条款', 'Terms')}</Link>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <h4 style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>{t('联系我们', 'Contact')}</h4>
              <p>📧 partner@happysave.vercel.app</p>
            </Col>
          </Row>
          <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 12 }}>
            © 2026 {t('快乐省省', 'HappySave')}. {t('保留所有权利', 'All rights reserved')}.
          </div>
        </div>
      </footer>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
          <span className="nav-icon">🏠</span>{t('首页', 'Home')}
        </Link>
        <Link href="/#stores" className="nav-item">
          <span className="nav-icon">🏪</span>{t('商家', 'Stores')}
        </Link>
        <Link href="/advertise" className="nav-item">
          <span className="nav-icon">📢</span>{t('合作', 'Partner')}
        </Link>
        <Link href="/admin" className="nav-item">
          <span className="nav-icon">⚙️</span>{t('管理', 'Admin')}
        </Link>
      </nav>

      <FloatButton.BackTop />
    </Layout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layout,
  Menu,
  Input,
  Card,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Divider,
  Badge,
  Avatar,
  Statistic,
  ConfigProvider,
  FloatButton,
} from 'antd';
import {
  SearchOutlined,
  FireOutlined,
  ShopOutlined,
  TagOutlined,
  QrcodeOutlined,
  CopyOutlined,
  GlobalOutlined,
  RightOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { AntdProvider } from '@/providers/AntdProvider';
import { AdSlot, SponsoredBadge } from '@/components/AdSlot';
import type { Store, Coupon, Category } from '@/types';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

// Fetch data hook
function useData() {
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/stores').then(r => r.json()),
      fetch('/api/v1/coupons').then(r => r.json()),
    ]).then(([storeRes, couponRes]) => {
      setStores(storeRes.data || []);
      setCoupons(couponRes.data || []);
      
      // Build categories
      const catMap = new Map<string, Category>();
      (storeRes.data || []).forEach((s: Store) => {
        const existing = catMap.get(s.category);
        if (existing) {
          existing.count++;
        } else {
          catMap.set(s.category, {
            name: s.category,
            nameZh: s.categoryZh,
            icon: getCategoryIcon(s.category),
            count: 1,
          });
        }
      });
      setCategories(Array.from(catMap.values()));
      setLoading(false);
    });
  }, []);

  return { stores, coupons, categories, loading };
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    shopping: '🛍️',
    fashion: '👗',
    electronics: '📱',
    ai: '🤖',
    hosting: '🌐',
  };
  return icons[category] || '🏪';
}

function getCategoryLabel(cat: Category, lang: string): string {
  return lang === 'zh' ? cat.nameZh : cat.name;
}

// Main Homepage Component
function HomePageContent() {
  const { stores, coupons, categories, loading } = useData();
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  const filteredStores = selectedCategory === 'all'
    ? stores
    : stores.filter(s => s.category === selectedCategory);

  const featuredCoupons = coupons.filter(c => c.featured);

  return (
    <Layout className="min-h-screen">
      {/* Enterprise Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#ff6b35', lineHeight: 1.2 }}>
              {t('快乐省省', 'HappySave')}
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {t('全球优惠券平台', 'Global Coupons & Deals')}
            </div>
          </div>
        </Link>

        <Space size="middle">
          <Input
            placeholder={t('搜索商家或优惠码...', 'Search stores or coupons...')}
            prefix={<SearchOutlined />}
            style={{ width: 280, borderRadius: 20 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button
            icon={<GlobalOutlined />}
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          >
            {lang === 'zh' ? 'EN' : '中文'}
          </Button>
          <Link href="/admin">
            <Button type="primary">{t('管理后台', 'Admin')}</Button>
          </Link>
        </Space>
      </Header>

      <Content>
        {/* Hero Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #ff6b35 0%, #ff8555 50%, #ff6b6b 100%)',
            padding: '80px 24px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <Title level={1} style={{ color: '#fff', marginBottom: 16, fontSize: 48 }}>
            {t('全球省钱，快乐购物', 'Save Big, Shop Global')}
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, maxWidth: 600, margin: '0 auto 32px' }}>
            {t(
              '发现全球品牌独家优惠码和折扣信息，每日更新，帮你省钱购物。',
              'Discover exclusive coupons from top global brands. Updated daily.'
            )}
          </Paragraph>
          
          {/* Stats Row */}
          <Row gutter={32} justify="center">
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>{t('商家', 'Stores')}</span>}
                value={stores.length}
                suffix="+"
                valueStyle={{ color: '#fff', fontSize: 32 }}
              />
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>{t('优惠码', 'Coupons')}</span>}
                value={coupons.length}
                suffix="+"
                valueStyle={{ color: '#fff', fontSize: 32 }}
              />
            </Col>
            <Col>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>{t('分类', 'Categories')}</span>}
                value={categories.length}
                valueStyle={{ color: '#fff', fontSize: 32 }}
              />
            </Col>
          </Row>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
          {/* Featured Coupons */}
          <Title level={3} style={{ marginBottom: 24 }}>
            <FireOutlined style={{ color: '#ff6b35', marginRight: 8 }} />
            {t('热门优惠', 'Featured Deals')}
          </Title>
          
          <Row gutter={[16, 16]}>
            {featuredCoupons.map(coupon => {
              const store = stores.find(s => s.id === coupon.storeId);
              return (
                <Col xs={24} md={12} lg={8} key={coupon.id}>
                  <Card
                    className="coupon-card"
                    hoverable
                    actions={[
                      <Link href={`/store/${store?.slug}?coupon=${coupon.id}`} key="get">
                        <Button type="primary" icon={<GiftOutlined />}>
                          {t('获取优惠', 'Get Deal')}
                        </Button>
                      </Link>,
                    ]}
                  >
                    <Meta
                      avatar={
                        <Avatar size={48} style={{ backgroundColor: '#fff2e8', color: '#ff6b35' }}>
                          {store?.name.charAt(0) || 'S'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Text strong>{store?.name}</Text>
                          <Tag color="orange">{coupon.discount}</Tag>
                        </Space>
                      }
                      description={lang === 'zh' ? coupon.titleZh : coupon.title}
                    />
                    
                    {coupon.code && (
                      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                        <Input
                          value={coupon.code}
                          readOnly
                          style={{ fontFamily: 'monospace', fontWeight: 'bold', textAlign: 'center' }}
                        />
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => navigator.clipboard.writeText(coupon.code!)}
                        />
                      </div>
                    )}
                    
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                      <span>👆 {coupon.clickCount.toLocaleString()} {t('次使用', 'used')}</span>
                      <Tag color={coupon.verified ? 'green' : 'default'}>
                        {coupon.verified ? t('已验证', 'Verified') : t('未验证', 'Unverified')}
                      </Tag>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Divider />

          {/* Categories */}
          <Title level={3} style={{ marginBottom: 24 }}>
            <TagOutlined style={{ color: '#ff6b35', marginRight: 8 }} />
            {t('按分类浏览', 'Browse by Category')}
          </Title>
          
          <Space wrap size="middle" style={{ marginBottom: 32 }}>
            <Button
              type={selectedCategory === 'all' ? 'primary' : 'default'}
              size="large"
              onClick={() => setSelectedCategory('all')}
            >
              {t('全部', 'All')} ({stores.length})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.name}
                type={selectedCategory === cat.name ? 'primary' : 'default'}
                size="large"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.icon} {getCategoryLabel(cat, lang)} ({cat.count})
              </Button>
            ))}
          </Space>

          {/* Store Grid */}
          <Title level={3} style={{ marginBottom: 24 }}>
            <ShopOutlined style={{ color: '#ff6b35', marginRight: 8 }} />
            {t('所有商家', 'All Stores')}
          </Title>
          
          <Row gutter={[16, 16]}>
            {filteredStores.map(store => (
              <Col xs={12} sm={8} md={6} lg={4} key={store.id}>
                <Link href={`/store/${store.slug}`}>
                  <Card
                    hoverable
                    style={{ textAlign: 'center', position: 'relative' }}
                    bodyStyle={{ padding: '20px 12px' }}
                  >
                    {(store as any).featured && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <SponsoredBadge />
                      </div>
                    )}
                    <Avatar size={64} style={{ backgroundColor: '#fff2e8', color: '#ff6b35', fontSize: 28, marginBottom: 12 }}>
                      {store.name.charAt(0)}
                    </Avatar>
                    <div style={{ fontWeight: 600 }}>{store.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {lang === 'zh' ? store.categoryZh : store.category}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Badge
                        count={coupons.filter(c => c.storeId === store.id).length}
                        style={{ backgroundColor: '#ff6b35' }}
                        showZero
                      >
                        <Tag>{t('优惠', 'deals')}</Tag>
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* 广告位 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <AdSlot type="banner" label="横幅广告" />
      </div>

      {/* SEO FAQ Section */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          ❓ {t('常见问题', 'Frequently Asked Questions')}
        </Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card>
              <Title level={5}>🤔 {t('如何使用优惠码？', 'How to use coupon codes?')}</Title>
              <Paragraph type="secondary">
                {t('找到想要的优惠码，点击复制后前往商家官网，在结账页面粘贴优惠码即可享受折扣。', 'Find a coupon, copy it, paste at checkout on the merchant\'s website.')}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Title level={5}>💰 {t('优惠码是免费的吗？', 'Are coupons free?')}</Title>
              <Paragraph type="secondary">
                {t('是的！快乐省省所有优惠码完全免费使用，无需注册。', 'Yes! All coupons on HappySave are completely free, no registration required.')}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Title level={5}>⏰ {t('优惠码过期了怎么办？', 'What if a coupon expires?')}</Title>
              <Paragraph type="secondary">
                {t('我们会每日更新优惠码。如果某个优惠码失效，请查看该商家页面获取最新优惠。', 'We update coupons daily. Check the store page for the latest deals.')}
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card>
              <Title level={5}>🌍 {t('支持哪些商家？', 'Which merchants are supported?')}</Title>
              <Paragraph type="secondary">
                {t('我们覆盖50+全球品牌，包括Temu、SHEIN、Nike、Amazon、Adidas等热门商家。', 'We cover 50+ global brands including Temu, SHEIN, Nike, Amazon, Adidas and more.')}
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>

      {/* SEO 内链 */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
        <Title level={4}>{t('热门商家优惠码', 'Popular Store Coupons')}</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {stores.slice(0, 20).map(store => (
            <Link key={store.id} href={`/store/${store.slug}`}>
              <Tag style={{ padding: '4px 12px', fontSize: 14, cursor: 'pointer' }}>
                {store.name} {t('优惠码', 'coupons')}
              </Tag>
            </Link>
          ))}
        </div>
      </div>

      <Footer
        style={{
          background: '#001529',
          color: 'rgba(255,255,255,0.65)',
          padding: '48px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Title level={4} style={{ color: '#fff' }}>
                🎉 {t('快乐省省', 'HappySave')}
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                {t(
                  '你值得信赖的全球优惠券平台。每一次购物都能省钱。',
                  'Your trusted global coupon platform. Save on every purchase.'
                )}
              </Paragraph>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} style={{ color: '#fff' }}>{t('快速链接', 'Quick Links')}</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('首页', 'Home')}</Link>
                <Link href="/admin" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('管理后台', 'Admin')}</Link>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Title level={5} style={{ color: '#fff' }}>{t('联系我们', 'Contact')}</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.65)' }}>
                {t('商务合作', 'Partnership')}: partner@happysave.cn
              </Paragraph>
            </Col>
          </Row>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)' }}>
            © 2026 {t('快乐省省', 'HappySave')}. {t('保留所有权利', 'All rights reserved')}.
          </div>
        </div>
      </Footer>

      {/* Back to top */}
      <FloatButton.BackTop />
    </Layout>
  );
}

export default function HomePage() {
  return (
    <AntdProvider>
      <HomePageContent />
    </AntdProvider>
  );
}

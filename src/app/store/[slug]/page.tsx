'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layout,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Avatar,
  Divider,
  QRCode,
  Row,
  Col,
  Badge,
  Tooltip,
  message,
  FloatButton,
  Breadcrumb,
} from 'antd';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  QrcodeOutlined,
  WhatsAppOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { AntdProvider } from '@/providers/AntdProvider';
import type { Store, Coupon } from '@/types';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

function StoreDetailContent({ slug }: { slug: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrVisible, setQrVisible] = useState<{ url: string; title: string; code?: string } | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/stores').then(r => r.json()),
      fetch('/api/v1/coupons').then(r => r.json()),
    ]).then(([storeRes, couponRes]) => {
      const found = (storeRes.data || []).find((s: Store) => s.slug === slug);
      if (found) {
        setStore(found);
        setCoupons((couponRes.data || []).filter((c: Coupon) => c.storeId === found.id));
      }
      setLoading(false);
    });
  }, [slug]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('已复制');
  };

  const shareWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>加载中...</div>;
  if (!store) return <div style={{ padding: 48, textAlign: 'center' }}>商家未找到</div>;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {contextHolder}
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <Breadcrumb
            style={{ marginBottom: 16 }}
            items={[
              { title: <Link href="/">首页</Link> },
              { title: store.name },
            ]}
          />

          {/* Store Header */}
          <Card style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <Avatar
                size={80}
                style={{ backgroundColor: '#fff2e8', color: '#ff6b35', fontSize: 36 }}
              >
                {store.name.charAt(0)}
              </Avatar>
              
              <div style={{ flex: 1, minWidth: 200 }}>
                <Title level={2} style={{ margin: 0 }}>{store.name}</Title>
                <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                  {store.descriptionZh}
                </Paragraph>
                <Space wrap>
                  {store.tags.map(tag => (
                    <Tag key={tag}>#{tag}</Tag>
                  ))}
                  <Tag color="orange">{store.categoryZh}</Tag>
                </Space>
              </div>

              <Space direction="vertical" style={{ minWidth: 160 }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ThunderboltOutlined />}
                  block
                  onClick={() => {
                    setQrVisible({
                      url: store.affiliateUrl,
                      title: `${store.name} - 扫码访问`,
                    });
                  }}
                >
                  📱 扫码访问
                </Button>
                <Button
                  size="large"
                  icon={<LinkOutlined />}
                  block
                  onClick={() => copyText(store.affiliateUrl)}
                >
                  🔗 复制推广链接
                </Button>
              </Space>
            </div>
          </Card>

          {/* Coupons */}
          <Title level={4}>
            <TagOutlined style={{ marginRight: 8, color: '#ff6b35' }} />
            可用优惠 ({coupons.length})
          </Title>

          <Row gutter={[16, 16]}>
            {coupons.map(coupon => (
              <Col xs={24} sm={24} md={12} key={coupon.id}>
                <Card
                  className="coupon-card"
                  hoverable
                  style={{
                    borderLeft: '4px solid #ff6b35',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <Space style={{ marginBottom: 8 }}>
                        <Badge status={coupon.verified ? 'success' : 'warning'} />
                        <Tag color="orange" style={{ fontSize: 16, fontWeight: 'bold', padding: '2px 12px' }}>
                          {coupon.discount}
                        </Tag>
                        <Tag color={
                          coupon.type === 'code' ? 'blue' :
                          coupon.type === 'deal' ? 'green' :
                          coupon.type === 'cashback' ? 'purple' : 'orange'
                        }>
                          {coupon.type === 'code' ? '优惠码' :
                           coupon.type === 'deal' ? '促销' :
                           coupon.type === 'cashback' ? '返现' : '免费'}
                        </Tag>
                      </Space>

                      <Title level={5} style={{ margin: '8px 0' }}>
                        {coupon.titleZh}
                      </Title>
                      <Text type="secondary">{coupon.descriptionZh}</Text>

                      <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {coupon.endDate
                          ? `有效期至 ${new Date(coupon.endDate).toLocaleDateString('zh-CN')}`
                          : '长期有效'
                        }
                        <span style={{ marginLeft: 16 }}>
                          👆 {coupon.clickCount.toLocaleString()} 次点击 · 
                          ✅ {coupon.useCount.toLocaleString()} 次使用
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  {coupon.code && (
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          background: '#f6ffed',
                          border: '2px dashed #52c41a',
                          borderRadius: 8,
                          padding: '12px 16px',
                          fontFamily: 'monospace',
                          fontSize: 18,
                          fontWeight: 'bold',
                          textAlign: 'center',
                          letterSpacing: 2,
                          color: '#52c41a',
                        }}
                      >
                        {coupon.code}
                      </div>
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        onClick={() => copyText(coupon.code!)}
                      >
                        复制
                      </Button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Button
                      type="primary"
                      size="large"
                      style={{ flex: 1 }}
                      onClick={() => window.open(coupon.affiliateUrl, '_blank')}
                    >
                      🎯 立即使用
                    </Button>
                    <Button
                      size="large"
                      icon={<QrcodeOutlined />}
                      onClick={() => setQrVisible({
                        url: coupon.affiliateUrl,
                        title: `${store.name} - ${coupon.discount}`,
                        code: coupon.code || undefined,
                      })}
                    >
                      二维码
                    </Button>
                    <Button
                      size="large"
                      icon={<WhatsAppOutlined />}
                      onClick={() => shareWhatsApp(
                        `🔥 ${store.name} ${coupon.discount} 优惠！${coupon.code ? `\n优惠码：${coupon.code}` : ''}\n👉 https://happysave.com/store/${store.slug}`
                      )}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {coupons.length === 0 && (
            <Card style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <Text type="secondary">暂无可用优惠，请稍后再来查看</Text>
            </Card>
          )}
        </div>
      </Content>

      {/* QR Code Modal */}
      {qrVisible && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setQrVisible(null)}
        >
          <Card title={qrVisible.title} style={{ width: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <QRCode value={qrVisible.url} size={200} />
              
              {qrVisible.code && (
                <div style={{
                  marginTop: 16,
                  background: '#f6ffed',
                  border: '2px dashed #52c41a',
                  borderRadius: 8,
                  padding: 8,
                  fontFamily: 'monospace',
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#52c41a',
                }}>
                  {qrVisible.code}
                </div>
              )}
              
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12 }}>
                扫描二维码访问
              </Text>
              
              <Space style={{ marginTop: 12 }}>
                <Button icon={<CopyOutlined />} onClick={() => copyText(qrVisible.url)}>
                  复制链接
                </Button>
                <Button onClick={() => setQrVisible(null)}>关闭</Button>
              </Space>
            </div>
          </Card>
        </div>
      )}

      <FloatButton.BackTop />
    </Layout>
  );
}

export default function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>('');
  
  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);
  
  return (
    <AntdProvider>
      {slug && <StoreDetailContent slug={slug} />}
    </AntdProvider>
  );
}

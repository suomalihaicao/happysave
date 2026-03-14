'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Avatar,
  Statistic,
  Row,
  Col,
  Badge,
  Tooltip,
  Popconfirm,
  QRCode,
  message,
  Divider,
} from 'antd';
import {
  QrcodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
  TagOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { AntdProvider } from '@/providers/AntdProvider';
import type { Store, Coupon, ShortLink, DashboardStats } from '@/types';

const { Title, Text } = Typography;

// Mock dashboard data
function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/stores').then(r => r.json()),
      fetch('/api/v1/coupons').then(r => r.json()),
      fetch('/api/v1/links').then(r => r.json()),
    ]).then(([storeRes, couponRes, linkRes]) => {
      const s = storeRes.data || [];
      const c = couponRes.data || [];
      const l = linkRes.data || [];
      setStores(s);
      setCoupons(c);
      setShortLinks(l);
      
      setStats({
        totalStores: s.length,
        totalCoupons: c.length,
        totalClicks: s.reduce((sum: number, st: Store) => sum + st.clickCount, 0),
        totalConversions: c.reduce((sum: number, cp: Coupon) => sum + cp.useCount, 0),
        totalRevenue: c.reduce((sum: number, cp: Coupon) => sum + cp.useCount * 25, 0),
        totalShortLinks: l.length,
        todayClicks: 1247,
        todayConversions: 63,
        topStores: s.slice(0, 5).map((st: Store) => ({
          name: st.name,
          clicks: st.clickCount,
          conversions: Math.floor(st.clickCount * st.conversionRate / 100),
        })),
        recentClicks: [],
      });
      setLoading(false);
    });
  }, []);

  return { stats, stores, coupons, shortLinks, loading };
}

// Admin Dashboard Component
function AdminDashboardContent() {
  const { stats, stores, coupons, shortLinks, loading } = useDashboard();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stores' | 'coupons' | 'links'>('dashboard');
  const [qrVisible, setQrVisible] = useState<{ url: string; title: string } | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('已复制到剪贴板');
  };

  // Store table columns
  const storeColumns = [
    {
      title: '商家',
      key: 'store',
      render: (_: unknown, record: Store) => (
        <Space>
          <Avatar style={{ backgroundColor: '#fff2e8', color: '#ff6b35' }}>
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.nameZh}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryZh',
      key: 'category',
      filters: [
        { text: '综合购物', value: '综合购物' },
        { text: '时尚服饰', value: '时尚服饰' },
        { text: '电子产品', value: '电子产品' },
        { text: 'AI工具', value: 'AI工具' },
        { text: '主机服务', value: '主机服务' },
      ],
      onFilter: (value: any, record: Store) => record.categoryZh === value,
    },
    {
      title: '点击量',
      dataIndex: 'clickCount',
      key: 'clickCount',
      sorter: (a: Store, b: Store) => a.clickCount - b.clickCount,
      render: (val: number) => <Text strong>{val.toLocaleString()}</Text>,
    },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      sorter: (a: Store, b: Store) => a.conversionRate - b.conversionRate,
      render: (val: number) => (
        <Tag color={val >= 5 ? 'green' : val >= 3 ? 'orange' : 'default'}>
          {val.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: Store) => (
        <Badge status={record.active ? 'success' : 'default'} text={record.active ? '活跃' : '禁用'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Store) => (
        <Space>
          <Tooltip title="查看详情">
            <Link href={`/store/${record.slug}`}>
              <Button type="link" size="small">查看</Button>
            </Link>
          </Tooltip>
          <Tooltip title="生成二维码">
            <Button
              icon={<QrcodeOutlined />}
              size="small"
              onClick={() => setQrVisible({
                url: `https://happysave.com/store/${record.slug}`,
                title: record.name,
              })}
            />
          </Tooltip>
          <Tooltip title="复制短链接">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => copyText(`https://happysave.com/store/${record.slug}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Coupon table columns
  const couponColumns = [
    {
      title: '商家',
      dataIndex: 'storeName',
      key: 'storeName',
      filters: stores.map(s => ({ text: s.name, value: s.name })),
      onFilter: (value: any, record: Coupon) => record.storeName === value,
    },
    {
      title: '优惠',
      key: 'title',
      render: (_: unknown, record: Coupon) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.titleZh}</div>
          {record.code && (
            <Tag color="blue" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              {record.code}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '折扣',
      dataIndex: 'discount',
      key: 'discount',
      render: (val: string) => <Tag color="orange">{val}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (val: string) => {
        const colors: Record<string, string> = { code: 'blue', deal: 'green', cashback: 'purple', freebie: 'orange' };
        return <Tag color={colors[val] || 'default'}>{val}</Tag>;
      },
    },
    {
      title: '点击',
      dataIndex: 'clickCount',
      key: 'clickCount',
      sorter: (a: Coupon, b: Coupon) => a.clickCount - b.clickCount,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '使用',
      dataIndex: 'useCount',
      key: 'useCount',
      sorter: (a: Coupon, b: Coupon) => a.useCount - b.useCount,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '验证',
      dataIndex: 'verified',
      key: 'verified',
      render: (val: boolean) => (
        <Badge status={val ? 'success' : 'warning'} text={val ? '已验证' : '待验证'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Coupon) => (
        <Space>
          {record.code && (
            <Tooltip title="复制优惠码">
              <Button icon={<CopyOutlined />} size="small" onClick={() => copyText(record.code!)} />
            </Tooltip>
          )}
          <Tooltip title="生成二维码">
            <Button
              icon={<QrcodeOutlined />}
              size="small"
              onClick={() => setQrVisible({
                url: record.affiliateUrl,
                title: `${record.storeName} - ${record.discount}`,
              })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Short link table columns
  const linkColumns = [
    {
      title: '短链接',
      dataIndex: 'code',
      key: 'code',
      render: (val: string) => (
        <Space>
          <Text code>happysave.com/s/{val}</Text>
          <Button icon={<CopyOutlined />} size="small" type="link" onClick={() => copyText(`https://happysave.com/s/${val}`)} />
        </Space>
      ),
    },
    {
      title: '商家',
      dataIndex: 'storeName',
      key: 'storeName',
    },
    {
      title: '点击',
      dataIndex: 'clicks',
      key: 'clicks',
      sorter: (a: ShortLink, b: ShortLink) => a.clicks - b.clicks,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      
      {/* Navigation */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size="large">
          <Link href="/">
            <Button>← 返回首页</Button>
          </Link>
          <Title level={3} style={{ margin: 0 }}>📊 快乐省省 管理后台</Title>
        </Space>
        <Space>
          <Button type="primary" icon={<TagOutlined />}>+ 添加商家</Button>
          <Button type="primary" icon={<FireOutlined />}>+ 添加优惠码</Button>
        </Space>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
        {[
          { key: 'dashboard', label: '📊 数据概览' },
          { key: 'stores', label: '🏪 商家管理' },
          { key: 'coupons', label: '🎫 优惠码管理' },
          { key: 'links', label: '🔗 短链接管理' },
        ].map(tab => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div>
          {/* Stats Cards */}
          <Row gutter={[16, 16]}>
            {[
              { icon: '🏪', label: '商家总数', value: stats.totalStores, color: '#ff6b35' },
              { icon: '🎫', label: '优惠码总数', value: stats.totalCoupons, color: '#1890ff' },
              { icon: '👆', label: '总点击数', value: stats.totalClicks, color: '#52c41a' },
              { icon: '💰', label: '预估收入', value: `$${stats.totalRevenue.toLocaleString()}`, color: '#722ed1' },
              { icon: '📈', label: '今日点击', value: stats.todayClicks, color: '#fa8c16' },
              { icon: '🎯', label: '今日转化', value: stats.todayConversions, color: '#13c2c2' },
              { icon: '🔗', label: '短链接数', value: stats.totalShortLinks, color: '#eb2f96' },
              { icon: '📊', label: '总转化', value: stats.totalConversions, color: '#2f54eb' },
            ].map((item, i) => (
              <Col xs={12} sm={8} md={6} key={i}>
                <Card hoverable bodyStyle={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </div>
                    </div>
                    <span style={{ fontSize: 32, opacity: 0.8 }}>{item.icon}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          {/* Top Stores */}
          <Row gutter={24}>
            <Col span={12}>
              <Card title={<Space><FireOutlined /> 商家排行榜 (按点击量)</Space>} hoverable>
                <Table
                  size="small"
                  dataSource={stats.topStores}
                  pagination={false}
                  rowKey="name"
                  columns={[
                    { title: '排名', key: 'rank', render: (_, __, index) => <Tag color={index < 3 ? 'orange' : 'default'}>{index + 1}</Tag> },
                    { title: '商家', dataIndex: 'name' },
                    { title: '点击', dataIndex: 'clicks', render: (val: number) => val.toLocaleString() },
                    { title: '转化', dataIndex: 'conversions', render: (val: number) => <Tag color="green">{val}</Tag> },
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<Space><ThunderboltOutlined /> 营销工具</Space>} hoverable>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 16, background: '#f6ffed', borderRadius: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>📱 二维码生成</Title>
                    <Text type="secondary">每个商家/优惠自动生成可扫描二维码，支持微信、支付宝扫码</Text>
                    <div><code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>GET /api/v1/qr?url=xxx</code></div>
                  </div>
                  <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>🔗 短链接 + 追踪</Title>
                    <Text type="secondary">带 UTM 追踪参数的短链接，自动记录点击来源、设备、地区</Text>
                    <div><code style={{ fontSize: 12, background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>POST /api/v1/links</code></div>
                  </div>
                  <div style={{ padding: 16, background: '#f9f0ff', borderRadius: 8 }}>
                    <Title level={5} style={{ margin: 0 }}>📊 数据分析</Title>
                    <Text type="secondary">实时追踪点击、转化、收入，按商家/渠道/时间维度分析</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* Stores Tab */}
      {activeTab === 'stores' && (
        <Card title="商家列表" extra={<Button type="primary" icon={<TagOutlined />}>+ 添加商家</Button>}>
          <Table
            dataSource={stores}
            rowKey="id"
            columns={storeColumns}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个商家` }}
          />
        </Card>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <Card title="优惠码列表" extra={<Button type="primary" icon={<FireOutlined />}>+ 添加优惠码</Button>}>
          <Table
            dataSource={coupons}
            rowKey="id"
            columns={couponColumns}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个优惠码` }}
          />
        </Card>
      )}

      {/* Short Links Tab */}
      {activeTab === 'links' && (
        <Card title="短链接管理">
          <Table
            dataSource={shortLinks}
            rowKey="id"
            columns={linkColumns}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无短链接，通过商家详情页创建' }}
          />
        </Card>
      )}

      {/* QR Code Modal */}
      {qrVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setQrVisible(null)}
        >
          <Card
            title={qrVisible.title}
            style={{ width: 320 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              <QRCode value={qrVisible.url} size={200} />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{qrVisible.url}</Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  onClick={() => copyText(qrVisible.url)}
                >
                  复制链接
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AntdProvider>
      <AdminDashboardContent />
    </AntdProvider>
  );
}

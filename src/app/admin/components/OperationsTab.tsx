'use client';
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Space } from 'antd';

interface OpsStats {
  totalStores: number;
  totalCoupons: number;
  totalClicks: number;
  totalLinks: number;
  totalSeoPages: number;
  totalCategories: number;
  finance: { totalRevenue: number; confirmedRevenue: number };
  share: { totalShares: number; completedReferrals: number };
}

interface TodoItem {
  text: string;
  status: string;
  priority: string;
}

export default function OperationsTab() {
  const [stats, setStats] = useState<OpsStats>({
    totalStores: 0, totalCoupons: 0, totalClicks: 0, totalLinks: 0, totalSeoPages: 0, totalCategories: 0,
    finance: { totalRevenue: 0, confirmedRevenue: 0 },
    share: { totalShares: 0, completedReferrals: 0 },
  });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/stats').then(r => r.json()),
      fetch('/api/v1/finance?action=dashboard').then(r => r.json()),
      fetch('/api/v1/share?action=stats').then(r => r.json()),
    ]).then(([s, f, sh]) => {
      setStats({ ...(s.data || {}), finance: f.data || {}, share: sh.data || {} });
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  const stat = (key: keyof OpsStats, def: number = 0) => (stats[key] as number) ?? def;

  const todos: TodoItem[] = [
    { text: '每日社媒发布 (Twitter/微博/小红书)', status: 'pending', priority: 'high' },
    { text: '检查即将过期的优惠码', status: 'pending', priority: 'medium' },
    { text: '审核用户报告的问题', status: 'pending', priority: 'medium' },
    { text: '更新SEO文章', status: 'pending', priority: 'low' },
    { text: '检查佣金到账情况', status: 'pending', priority: 'high' },
  ];

  return (
    <div>
      <Card title="📊 核心运营指标" loading={loading} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={12} md={4}><Statistic title="商家" value={stat('totalStores')} suffix="家" /></Col>
          <Col xs={12} md={4}><Statistic title="优惠码" value={stat('totalCoupons')} suffix="个" /></Col>
          <Col xs={12} md={4}><Statistic title="总点击" value={stat('totalClicks')} /></Col>
          <Col xs={12} md={4}><Statistic title="短链接" value={stat('totalLinks')} /></Col>
          <Col xs={12} md={4}><Statistic title="SEO页面" value={stat('totalSeoPages')} /></Col>
          <Col xs={12} md={4}><Statistic title="分类" value={stat('totalCategories')} /></Col>
        </Row>
      </Card>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="💰 今日收入">
            <Row gutter={16}>
              <Col span={12}><Statistic title="总收入" value={stats.finance?.totalRevenue || 0} prefix="$" precision={2} /></Col>
              <Col span={12}><Statistic title="已确认" value={stats.finance?.confirmedRevenue || 0} prefix="$" precision={2} valueStyle={{ color: '#52c41a' }} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🔗 分享数据">
            <Row gutter={16}>
              <Col span={12}><Statistic title="分享链接" value={stats.share?.totalShares || 0} /></Col>
              <Col span={12}><Statistic title="邀请成功" value={stats.share?.completedReferrals || 0} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>
      <Card title="⚡ 运营待办">
        <List
          dataSource={todos}
          renderItem={(item: TodoItem) => (
            <List.Item>
              <Space>
                <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'default'}>
                  {item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢'}
                </Tag>
                {item.text}
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

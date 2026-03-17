'use client';
import { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Statistic, Tag, Typography } from 'antd';
import { LinkOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ShareStats {
  totalShares: number;
  totalShareClicks: number;
  totalReferrals: number;
  completedReferrals: number;
  topSharers: Sharer[];
}

interface Sharer {
  email: string;
  nickname: string;
  totalshares: number;
  invitecode: string;
}

export default function ShareTab() {
  const [stats, setStats] = useState<ShareStats>({
    totalShares: 0, totalShareClicks: 0, totalReferrals: 0, completedReferrals: 0, topSharers: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/share?action=stats').then(r => r.json()).then(d => {
      if (d.data) setStats(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Statistic title="分享链接数" value={stats.totalShares} prefix={<LinkOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="分享点击" value={stats.totalShareClicks} prefix={<EyeOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="邀请总数" value={stats.totalReferrals} prefix={<UserOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="邀请成功" value={stats.completedReferrals} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Card title="🏆 分享排行榜 TOP10">
        <Table dataSource={stats.topSharers} rowKey="email" loading={loading} pagination={false} size="small"
          columns={[
            { title: '#', key: 'rank', render: (_: unknown, __: unknown, i: number) => <Tag color={i < 3 ? 'gold' : 'default'}>{i + 1}</Tag> },
            { title: '用户', dataIndex: 'email', key: 'email' },
            { title: '昵称', dataIndex: 'nickname', key: 'nick', render: (v: string) => v || '-' },
            { title: '分享次数', dataIndex: 'totalshares', key: 'shares', render: (v: number) => <Text strong>{v || 0}</Text>, sorter: (a: Sharer, b: Sharer) => (a.totalshares || 0) - (b.totalshares || 0) },
            { title: '邀请码', dataIndex: 'invitecode', key: 'code', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
          ]} />
      </Card>
    </div>
  );
}

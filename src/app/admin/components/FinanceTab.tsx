'use client';
import { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Statistic, Tag, Typography } from 'antd';

const { Text } = Typography;

interface FinanceDashboard {
  totalRevenue: number;
  confirmedRevenue: number;
  pendingRevenue: number;
  totalTransactions: number;
  byStore: { storename: string; total: string; count: number }[];
}

interface Transaction {
  id: string;
  createdat: string;
  storename: string;
  amount: string;
  status: string;
  orderid: string;
}

export default function FinanceTab() {
  const [dashboard, setDashboard] = useState<FinanceDashboard>({
    totalRevenue: 0, confirmedRevenue: 0, pendingRevenue: 0, totalTransactions: 0, byStore: [],
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/v1/finance?action=dashboard').then(r => r.json()),
      fetch('/api/v1/finance?action=transactions').then(r => r.json()),
    ]).then(([d, t]) => {
      setDashboard(d.data || dashboard);
      setTransactions(t.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetchData, []);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Statistic title="总收入" value={dashboard.totalRevenue} prefix="$" precision={2} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="已确认" value={dashboard.confirmedRevenue} prefix="$" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="待确认" value={dashboard.pendingRevenue} prefix="$" precision={2} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="交易笔数" value={dashboard.totalTransactions} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="💰 商家佣金排行">
            <Table dataSource={dashboard.byStore} rowKey="storename" pagination={false} size="small"
              columns={[
                { title: '商家', dataIndex: 'storename' },
                { title: '佣金', dataIndex: 'total', render: (v: string) => <Text strong>${v}</Text> },
                { title: '笔数', dataIndex: 'count' },
              ]} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="📊 提现">
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p>可提现: <Text strong style={{ color: '#52c41a', fontSize: 24 }}>${dashboard.confirmedRevenue || 0}</Text></p>
              <p style={{ fontSize: 12, color: '#999' }}>最低 $100</p>
            </div>
          </Card>
        </Col>
      </Row>
      <Card title="📋 交易记录">
        <Table dataSource={transactions} rowKey="id" loading={loading} pagination={{ pageSize: 10 }}
          columns={[
            { title: '时间', dataIndex: 'createdat', render: (v: string) => v?.slice(0, 16) },
            { title: '商家', dataIndex: 'storename', render: (v: string) => <Text strong>{v}</Text> },
            { title: '金额', dataIndex: 'amount', render: (v: string) => <Text strong style={{ color: '#52c41a' }}>${v}</Text> },
            { title: '状态', dataIndex: 'status', render: (v: string) => v === 'confirmed' ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag> },
            { title: '订单号', dataIndex: 'orderid' },
          ]} />
      </Card>
    </div>
  );
}

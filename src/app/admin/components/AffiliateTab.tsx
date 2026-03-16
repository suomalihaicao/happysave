'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Alert, List, Typography, message } from 'antd';

const { Title, Text } = Typography;

interface NetworkInfo {
  name: string;
  description: string;
  enabled: boolean;
}

interface SetupGuideItem {
  env: string[];
  register: string;
}

interface SyncNetworkResult {
  merchants: number;
  coupons?: number;
}

interface SyncResult {
  merchants: number;
  coupons: number;
  imported: number;
  networks?: Record<string, SyncNetworkResult>;
}

interface AffiliateStatus {
  networks: Record<string, NetworkInfo>;
  setupGuide: Record<string, SetupGuideItem>;
  enabledCount: number;
  totalNetworks: number;
}

interface GuideItem {
  name: string;
  url: string;
  desc: string;
  commission: string;
}

export default function AffiliateTab() {
  const [status, setStatus] = useState<AffiliateStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  const fetchStatus = () => {
    fetch('/api/v1/affiliate').then(r => r.json()).then(d => {
      if (d.success) setStatus(d.data);
    });
  };
  useEffect(fetchStatus, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/v1/affiliate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync' }) });
      const d = await res.json();
      if (d.success) setSyncResult(d.data);
      message.success('联盟数据同步完成');
    } catch (e) {
      message.error('同步失败，请检查配置');
    }
    setSyncing(false);
  };

  if (!status) return <Card loading />;

  const networks = status.networks || {};
  const guide = status.setupGuide || {};

  const guideList: GuideItem[] = [
    { name: 'ShareASale', url: 'https://www.shareasale.com/shareasale.cfm?merchantType=affiliate', desc: '适合时尚/美妆/家居海淘', commission: '5-15%' },
    { name: 'CJ Affiliate', url: 'https://www.cj.com/', desc: '大型品牌/零售商', commission: '3-10%' },
    { name: 'Impact', url: 'https://impact.com/', desc: '科技/SaaS/订阅', commission: '10-40%' },
    { name: 'Awin', url: 'https://www.awin.com/', desc: '全球网络/欧美为主', commission: '5-12%' },
  ];

  return (
    <div>
      <Alert
        message="联盟对接说明"
        description="注册联盟账号后，在 Vercel 环境变量中配置 API 密钥，然后点击同步即可自动拉取商家和优惠码数据。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {Object.entries(networks).map(([key, net]: [string, NetworkInfo]) => (
          <Col xs={24} md={12} key={key}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={5} style={{ margin: 0 }}>{net.name}</Title>
                  <Text type="secondary">{net.description}</Text>
                </div>
                <Tag color={net.enabled ? 'green' : 'default'}>
                  {net.enabled ? '✅ 已配置' : '未配置'}
                </Tag>
              </div>
              {!net.enabled && guide[key] && (
                <div style={{ marginTop: 12, fontSize: 13 }}>
                  <Text type="secondary">环境变量: </Text>
                  {guide[key].env.map((e: string) => <Tag key={e} style={{ fontSize: 12 }}>{e}</Tag>)}
                  <br />
                  <a href={guide[key].register} target="_blank" style={{ fontSize: 12 }}>
                    → 注册 {net.name} 联盟账号
                  </a>
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>联盟数据同步</Title>
            <Text type="secondary">
              已配置 {status.enabledCount}/{status.totalNetworks} 个联盟网络
            </Text>
          </div>
          <Button type="primary" size="large" loading={syncing} onClick={handleSync}
            disabled={status.enabledCount === 0}>
            🔄 立即同步
          </Button>
        </div>

        {syncResult && (
          <div style={{ marginTop: 16 }}>
            <Alert
              message="同步结果"
              description={
                <div>
                  <p>发现商家: {syncResult.merchants} | 优惠码: {syncResult.coupons} | 新导入: {syncResult.imported || 0}</p>
                  {syncResult.networks && Object.entries(syncResult.networks).map(([k, v]: [string, SyncNetworkResult]) => (
                    <Tag key={k} style={{ marginBottom: 4 }}>
                      {k}: {v.merchants}商家 {v.coupons ? `/${v.coupons}优惠码` : ''}
                    </Tag>
                  ))}
                </div>
              }
              type="success"
            />
          </div>
        )}
      </Card>

      <Card title="📋 联盟注册指南" style={{ marginTop: 16 }}>
        <List
          dataSource={guideList}
          renderItem={(item: GuideItem) => (
            <List.Item>
              <List.Item.Meta
                title={<a href={item.url} target="_blank">{item.name}</a>}
                description={`${item.desc} | 平均佣金: ${item.commission}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

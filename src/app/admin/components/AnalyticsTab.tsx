'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Select, Statistic, List, Progress, Typography, message } from 'antd';
import { RiseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DeviceStat {
  device: string;
  cnt: number;
}

interface UTMStat {
  source: string;
  cnt: number;
}

interface StoreStat {
  name: string;
  cnt: number;
}

interface RefererStat {
  source: string;
  cnt: number;
}

interface DayStat {
  day: string;
  cnt: number;
}

interface AnalyticsData {
  totalClicks: number;
  period: string;
  byDevice?: DeviceStat[];
  byUTMSource?: UTMStat[];
  byStore?: StoreStat[];
  byReferer?: RefererStat[];
  byDay?: DayStat[];
}

const utmPlatforms = ['zhihu', 'weibo', 'xiaohongshu', 'douban', 'wechat', 'douyin'] as const;
const platformLabels: Record<string, string> = {
  zhihu: '知乎', weibo: '微博', xiaohongshu: '小红书',
  douban: '豆瓣', wechat: '微信', douyin: '抖音',
};

const deviceEmoji: Record<string, string> = { mobile: '📱', tablet: '📋' };
const defaultDeviceEmoji = '🖥️';

export default function AnalyticsTab() {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    fetch(`/api/v1/track?days=${days}`).then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, [days]);

  if (!stats) return <Card loading />;

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总点击" value={stats.totalClicks} prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="移动端" value={(stats.byDevice?.find((d: DeviceStat) => d.device === 'mobile')?.cnt) || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="桌面端" value={(stats.byDevice?.find((d: DeviceStat) => d.device === 'desktop')?.cnt) || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="统计周期" value={stats.period} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Select value={days} onChange={setDays} style={{ width: 150 }}>
            <Select.Option value={7}>最近 7 天</Select.Option>
            <Select.Option value={14}>最近 14 天</Select.Option>
            <Select.Option value={30}>最近 30 天</Select.Option>
            <Select.Option value={90}>最近 90 天</Select.Option>
          </Select>
          <Button onClick={fetchStats} loading={loading} style={{ marginLeft: 8 }}>刷新</Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="📊 设备分布">
            <List
              dataSource={stats.byDevice || []}
              renderItem={(item: DeviceStat) => (
                <List.Item>
                  <span>{deviceEmoji[item.device] || defaultDeviceEmoji} {item.device}</span>
                  <Tag color="blue">{item.cnt} 次</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🔗 渠道来源 (UTM)">
            <List
              dataSource={stats.byUTMSource || []}
              locale={{ emptyText: '暂无UTM数据 - 添加 ?utm_source=平台名 到推广链接' }}
              renderItem={(item: UTMStat) => (
                <List.Item>
                  <span>{item.source}</span>
                  <Tag color="green">{item.cnt} 次</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="🏪 热门商家">
            <List
              dataSource={stats.byStore || []}
              renderItem={(item: StoreStat) => (
                <List.Item>
                  <span>{item.name || String(item.cnt)}</span>
                  <Tag color="orange">{item.cnt} 次</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="🌐 来源网站">
            <List
              dataSource={stats.byReferer?.slice(0, 10) || []}
              locale={{ emptyText: '暂无来源数据' }}
              renderItem={(item: RefererStat) => (
                <List.Item>
                  <Text ellipsis style={{ maxWidth: 200 }}>{item.source}</Text>
                  <Tag>{item.cnt} 次</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="📅 每日趋势" style={{ marginTop: 16 }}>
        <List
          dataSource={stats.byDay || []}
          renderItem={(item: DayStat) => (
            <List.Item>
              <span>{item.day}</span>
              <Progress percent={stats.totalClicks ? Math.round(item.cnt / stats.totalClicks * 100) : 0} format={() => `${item.cnt} 次`} style={{ width: 300 }} />
            </List.Item>
          )}
        />
      </Card>

      <Card title="🚀 推广链接生成器" style={{ marginTop: 16 }}>
        <Text type="secondary">选择平台，自动生成带追踪参数的链接：</Text>
        <Row gutter={[8, 8]} style={{ marginTop: 12 }}>
          {utmPlatforms.map(platform => (
            <Col key={platform}>
              <Button size="small" onClick={() => {
                const url = `https://www.happysave.cn/?utm_source=${platform}&utm_medium=forum&utm_campaign=2026spring`;
                navigator.clipboard.writeText(url);
                message.success(`已复制 ${platform} 链接！`);
              }}>
                {platformLabels[platform]}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Input, Space, message } from 'antd';
import { FireOutlined, CopyOutlined } from '@ant-design/icons';

interface Platform {
  value: string;
  label: string;
}

interface HotTopic {
  topic: string;
  urgency: string;
}

interface Inspiration {
  hotTopics?: HotTopic[];
  bestTime?: Record<string, string>;
}

const platforms: Platform[] = [
  { value: 'xiaohongshu', label: '📕 小红书' },
  { value: 'zhihu', label: '📝 知乎' },
  { value: 'weibo', label: '🔥 微博' },
  { value: 'douyin', label: '🎬 抖音' },
  { value: 'wechat', label: '💬 朋友圈' },
  { value: 'bilibili', label: '📺 B站' },
];

export default function MarketingTab() {
  const [platform, setPlatform] = useState('xiaohongshu');
  const [store, setStore] = useState('');
  const [content, setContent] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', platform, store }),
      });
      const data = await res.json();
      if (data.success) {
        setContent(data.data.content);
        setTips(data.data.tips || []);
      }
    } catch (e) { message.error('生成失败'); }
    setLoading(false);
  };

  const loadInspiration = async () => {
    const res = await fetch('/api/v1/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'inspiration' }) });
    const data = await res.json();
    if (data.success) setInspiration(data.data);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(() => { loadInspiration(); }, []);

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card title="种草内容生成器" extra={<Tag color="green">AI驱动</Tag>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>选择平台</div>
                <Space wrap>
                  {platforms.map(p => (
                    <Button key={p.value} type={platform === p.value ? 'primary' : 'default'} onClick={() => setPlatform(p.value)} style={platform === p.value ? { background: '#FF6B35', borderColor: '#FF6B35' } : {}}>{p.label}</Button>
                  ))}
                </Space>
              </div>
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>商家（可选）</div>
                <Input placeholder="留空则自动选择热门商家" value={store} onChange={e => setStore(e.target.value)} />
              </div>
              <Button type="primary" size="large" onClick={generate} loading={loading} icon={<FireOutlined />} style={{ background: '#FF6B35', borderColor: '#FF6B35', width: '100%' }}>生成种草内容</Button>
              {content && (
                <Card size="small" title="生成内容" extra={<Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard.writeText(content); message.success('已复制'); }}>复制</Button>}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8 }}>{content}</pre>
                </Card>
              )}
              {tips.length > 0 && (
                <Card size="small" title="发布技巧">
                  {tips.map((tip, i) => <div key={i} style={{ padding: '4px 0', fontSize: 13 }}>💡 {tip}</div>)}
                </Card>
              )}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="种草灵感" size="small">
            {inspiration && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>🔥 热门话题</div>
                {inspiration.hotTopics?.map((t: HotTopic, i: number) => (
                  <Tag key={i} color={t.urgency === '高' ? 'red' : 'blue'} style={{ marginBottom: 8 }}>{t.topic}</Tag>
                ))}
                <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>⏰ 最佳发布时间</div>
                {Object.entries(inspiration.bestTime || {}).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 13, padding: '2px 0' }}>{platforms.find(p => p.value === k)?.label || k}: {v}</div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

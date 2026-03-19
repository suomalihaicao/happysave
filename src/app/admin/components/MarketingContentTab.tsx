'use client';

import { useState, useEffect } from 'react';
import {
  Button, Tag, Card, Table, Space, message, Typography
} from 'antd';

const { Text } = Typography;

interface MarketingContent {
  id: string;
  title: string;
  content: string;
  platform: string;
  storename: string;
  status: string;
  createdat: string;
}

export default function MarketingContentTab() {
  const [data, setData] = useState<MarketingContent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/marketing-content').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  const deleteItem = async (id: string) => {
    await fetch(`/api/v1/marketing-content?id=${id}`, { method: 'DELETE' });
    message.success('已删除');
    fetchData();
  };

  const copyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('文案已复制！');
  };

  const platformIcon: Record<string, string> = {
    twitter: '🐦 Twitter',
    weibo: '🔥 微博',
    xiaohongshu: '📕 小红书',
    douyin: '🎬 抖音',
    wechat: '💬 微信',
  };

  return (
    <div>
      <Card title="📝 营销内容库" extra={<Tag color="blue">{data.length} 条</Tag>}>
        <Table
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: MarketingContent) => (
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 13 }}>
                {record.content}
              </pre>
            ),
          }}
          columns={[
            { title: '标题', dataIndex: 'title', key: 'title', render: (v: string) => <Text strong>{v}</Text> },
            { title: '平台', dataIndex: 'platform', key: 'platform', render: (v: string) => <Tag>{platformIcon[v] || v}</Tag> },
            { title: '商家', dataIndex: 'storename', key: 'store', render: (v: string) => v || '-' },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => v === 'published' ? <Tag color="green">已发布</Tag> : <Tag>草稿</Tag> },
            { title: '时间', dataIndex: 'createdat', key: 'time', render: (v: string) => v?.slice(0, 16) },
            { title: '操作', key: 'action', render: (_: unknown, r: MarketingContent) => (
              <Space>
                <Button size="small" onClick={() => copyContent(r.content)}>📋 复制</Button>
                <Button size="small" danger onClick={() => deleteItem(r.id)}>删除</Button>
              </Space>
            )},
          ]}
        />
      </Card>
    </div>
  );
}

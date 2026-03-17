'use client';

import { useState, useEffect } from 'react';
import {
  Button, Input, Tag, Space,
  Card, Row, Col, message, Table
} from 'antd';

interface Strategy {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  status: string;
  targetkpi?: string;
  createdat?: string;
}

const categoryMap: Record<string, { label: string; color: string }> = {
  growth: { label: '📈 增长', color: 'green' },
  retention: { label: '🔄 留存', color: 'blue' },
  acquisition: { label: '🎯 获客', color: 'orange' },
  monetization: { label: '💰 变现', color: 'gold' },
  brand: { label: '🏷️ 品牌', color: 'purple' },
  content: { label: '📝 内容', color: 'cyan' },
};

const priorityMap: Record<string, { label: string; color: string }> = {
  high: { label: '🔴 高', color: 'red' },
  medium: { label: '🟡 中', color: 'orange' },
  low: { label: '🟢 低', color: 'green' },
};

export default function StrategiesTab() {
  const [data, setData] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('growth');
  const [newPriority, setNewPriority] = useState('medium');

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/strategies').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  const addStrategy = async () => {
    if (!newTitle || !newContent) return message.warning('请填写标题和内容');
    await fetch('/api/v1/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory, priority: newPriority }),
    });
    message.success('策略已添加');
    setNewTitle(''); setNewContent('');
    fetchData();
  };

  const updateStatus = async (item: Strategy, status: string) => {
    await fetch('/api/v1/strategies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, status }),
    });
    message.success(`已${status === 'active' ? '启用' : '归档'}`);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/v1/strategies?id=${id}`, { method: 'DELETE' });
    message.success('已删除');
    fetchData();
  };

  return (
    <div>
      <Card title="➕ 新增策略" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Input placeholder="策略标题" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </Col>
            <Col xs={12} md={6}>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}>
                {Object.entries(categoryMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Col>
            <Col xs={12} md={6}>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1px solid #d9d9d9' }}>
                {Object.entries(priorityMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Col>
          </Row>
          <Input.TextArea rows={4} placeholder="策略内容（目标、执行步骤、预期效果）" value={newContent} onChange={e => setNewContent(e.target.value)} />
          <Button type="primary" onClick={addStrategy}>添加策略</Button>
        </Space>
      </Card>

      <Card title="📋 策略库" extra={<Tag>{data.length} 条</Tag>}>
        <Table
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: Strategy) => (
              <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <p style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{record.content}</p>
                {record.targetkpi && <Tag color="blue">目标KPI: {record.targetkpi}</Tag>}
              </div>
            ),
          }}
          columns={[
            { title: '标题', dataIndex: 'title', key: 'title', render: (v: string) => <strong>{v}</strong> },
            { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Tag color={categoryMap[v]?.color}>{categoryMap[v]?.label || v}</Tag> },
            { title: '优先级', dataIndex: 'priority', key: 'priority', render: (v: string) => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.label || v}</Tag> },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => v === 'active' ? <Tag color="green">执行中</Tag> : v === 'archived' ? <Tag>已归档</Tag> : <Tag color="blue">草稿</Tag> },
            { title: '创建时间', dataIndex: 'createdat', key: 'time', render: (v: string) => v?.slice(0, 10) },
            { title: '操作', key: 'action', render: (_: unknown, r: Strategy) => (
              <Space>
                {r.status !== 'active' && <Button size="small" type="primary" onClick={() => updateStatus(r, 'active')}>▶ 执行</Button>}
                {r.status === 'active' && <Button size="small" onClick={() => updateStatus(r, 'archived')}>📁 归档</Button>}
                <Button size="small" danger onClick={() => deleteItem(r.id)}>删除</Button>
              </Space>
            )},
          ]}
        />
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Input, Tag, Button, Card, Row, Col, Space, message, List
} from 'antd';
import { User } from '@/types';

export default function SettingsTab() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [newEmail, setNewEmail] = useState('');

  const fetchConfig = () => {
    fetch('/api/v1/config').then(r => r.json()).then(d => { if (d.success) setConfig(d.data || {}); });
  };
  const fetchUsers = () => {
    fetch('/api/v1/users').then(r => r.json()).then(d => { if (d.success) setUsers(d.data || []); });
  };

  useEffect(() => { fetchConfig(); fetchUsers(); }, []);

  const saveConfig = async (key: string, value: string) => {
    setLoading(true);
    await fetch('/api/v1/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
    message.success('配置已保存');
    fetchConfig();
    setLoading(false);
  };

  const addUser = async () => {
    if (!newEmail) return;
    await fetch('/api/v1/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: newEmail }) });
    message.success('用户已添加');
    setNewEmail('');
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await fetch(`/api/v1/users?id=${id}`, { method: 'DELETE' });
    message.success('用户已删除');
    fetchUsers();
  };

  const configFields = [
    { key: 'site_name', label: '网站名称', placeholder: '快乐省省' },
    { key: 'site_logo', label: 'Logo URL', placeholder: '/logo.png' },
    { key: 'tip_qr_image', label: '打赏二维码', placeholder: '/tip-qr.png' },
    { key: 'analytics_id', label: 'Google Analytics ID', placeholder: 'G-XXXXX' },
    { key: 'baidu_id', label: '百度统计 ID', placeholder: 'hm.js?xxx' },
    { key: 'admin_password', label: '管理密码', placeholder: '******' },
    { key: 'seo_title', label: 'SEO 标题', placeholder: '快乐省省 - 全球优惠券' },
    { key: 'seo_description', label: 'SEO 描述', placeholder: '发现全球品牌优惠码...' },
  ];

  return (
    <Row gutter={16}>
      <Col xs={24} md={14}>
        <Card title="⚙️ 站点配置" extra={<Tag color="blue">实时生效</Tag>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {configFields.map(f => (
              <div key={f.key}>
                <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 13 }}>{f.label}</div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder={f.placeholder}
                    value={config[f.key] || ''}
                    onChange={e => setConfig({ ...config, [f.key]: e.target.value })}
                  />
                  <Button type="primary" loading={loading} onClick={() => saveConfig(f.key, config[f.key] || '')}>
                    保存
                  </Button>
                </Space.Compact>
              </div>
            ))}
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={10}>
        <Card title="👥 用户管理" extra={<Tag>{users.length} 人</Tag>}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="用户邮箱" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <Button type="primary" onClick={addUser}>添加</Button>
            </Space.Compact>
            <List
              size="small"
              dataSource={users}
              renderItem={(u: User) => (
                <List.Item actions={[
                  <Button key="del" size="small" danger onClick={() => deleteUser(u.id)}>删除</Button>
                ]}>
                  <List.Item.Meta title={u.email} description={`${u.name || '未命名'} · ${u.role} · ${u.createdAt?.slice(0, 10)}`} />
                </List.Item>
              )}
            />
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Table, Button, Input, Tag, Space,
  Card, Row, Col, Statistic, Tabs, message, List,
  Typography, Alert, Descriptions, Popconfirm
} from 'antd';
import {
  ShopOutlined, TagOutlined, BarChartOutlined, RobotOutlined,
  LinkOutlined, EyeOutlined, PlusOutlined, ThunderboltOutlined,
  LockOutlined, UserOutlined, FileTextOutlined,
  ExportOutlined, LineChartOutlined, FireOutlined, DollarOutlined
} from '@ant-design/icons';
import AnalyticsTab from './components/AnalyticsTab';
import AffiliateTab from './components/AffiliateTab';
import MarketingTab from './components/MarketingTab';
import StrategiesTab from './components/StrategiesTab';
import FinanceTab from './components/FinanceTab';
import ShareTab from './components/ShareTab';
import OperationsTab from './components/OperationsTab';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Store {
  id: string;
  name: string;
  slug: string;
  category: string;
  clickCount: number;
  featured: boolean;
  active: boolean;
}

interface Coupon {
  id: string;
  title: string;
  storeName: string;
  code: string;
  discount: string;
  clickCount: number;
  useCount: number;
  active: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  url?: string;
  action: string;
  autoAfter: string;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardStats {
  totalStores: number;
  totalCoupons: number;
  totalClicks: number;
  totalLinks: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: number;
  createdAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  level: string;
  points: number;
  totalclicks: number;
  invitecode: string;
  role: string;
  createdat: string;
}

// ============================================================
// Login Component
// ============================================================
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (data.success) {
        message.success('登录成功');
        onLogin();
      } else {
        message.error('密码错误');
      }
    } catch {
      message.error('登录失败');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <RobotOutlined style={{ fontSize: 48, color: '#764ba2', marginBottom: 16 }} />
        <Title level={3}>快乐省省 Admin</Title>
        <Paragraph type="secondary">输入管理密码登录</Paragraph>
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="管理密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onPressEnter={handleLogin}
          size="large"
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" block size="large" loading={loading} onClick={handleLogin}>
          登录
        </Button>
        <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
        </Paragraph>
      </Card>
    </div>
  );
}

// ============================================================
// Main Admin Component
// ============================================================
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/auth').then(r => r.json()).then(d => {
      setLoggedIn(d.loggedIn);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>🏪 快乐省省 管理后台</Title>
        <Button onClick={async () => {
          await fetch('/api/v1/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
          setLoggedIn(false);
        }}>退出登录</Button>
      </div>

      <Tabs
        items={[
          { key: 'dashboard', label: <span><BarChartOutlined /> 数据概览</span>, children: <DashboardTab /> },
          { key: 'analytics', label: <span><LineChartOutlined /> 运营统计</span>, children: <AnalyticsTab /> },
          { key: 'stores', label: <span><ShopOutlined /> 商家管理</span>, children: <StoresTab /> },
          { key: 'coupons', label: <span><TagOutlined /> 优惠码管理</span>, children: <CouponsTab /> },
          { key: 'users', label: <span><UserOutlined /> 用户/订阅</span>, children: <UsersTab /> },
          { key: 'tasks', label: <span><FileTextOutlined /> 待办事项</span>, children: <TasksTab /> },
          { key: 'ai', label: <span><RobotOutlined /> AI 运营</span>, children: <AITab /> },
          { key: 'affiliate', label: <span><LinkOutlined /> 联盟对接</span>, children: <AffiliateTab /> },
          { key: 'marketing', label: <span><FireOutlined /> 种草助手</span>, children: <MarketingTab /> },
          { key: 'marketing-content', label: <span><ExportOutlined /> 营销内容库</span>, children: <MarketingContentTab /> },
          { key: 'strategies', label: <span><LineChartOutlined /> 策略库</span>, children: <StrategiesTab /> },
          { key: 'finance', label: <span><DollarOutlined /> 财务中心</span>, children: <FinanceTab /> },
          { key: 'share', label: <span><LinkOutlined /> 分享裂变</span>, children: <ShareTab /> },
          { key: 'operations', label: <span><ThunderboltOutlined /> 运营大盘</span>, children: <OperationsTab /> },
          { key: 'settings', label: <span><LockOutlined /> 系统配置</span>, children: <SettingsTab /> },
        ]}
      />
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================
function DashboardTab() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  useEffect(() => { fetch('/api/v1/stats').then(r => r.json()).then(d => setStats(d.data)); }, []);
  if (!stats) return <div>加载中...</div>;

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="商家数" value={stats.totalStores} prefix={<ShopOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="优惠码" value={stats.totalCoupons} prefix={<TagOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="总点击" value={stats.totalClicks} prefix={<EyeOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="短链接" value={stats.totalLinks} prefix={<LinkOutlined />} /></Card></Col>
      </Row>
    </div>
  );
}

// ============================================================
// Stores Tab
// ============================================================
function StoresTab() {
  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/stores?limit=100').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    });
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  const toggleFeatured = async (store: Store) => {
    await fetch('/api/v1/stores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: store.id, featured: !store.featured }) });
    message.success(`${store.name} 已${store.featured ? '取消推荐' : '设为推荐'}`);
    fetchData();
  };

  const toggleActive = async (store: Store) => {
    await fetch('/api/v1/stores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: store.id, active: !store.active }) });
    message.success(`${store.name} 已${store.active ? '停用' : '启用'}`);
    fetchData();
  };

  const deleteStore = async (store: Store) => {
    await fetch(`/api/v1/stores?id=${store.id}`, { method: 'DELETE' });
    message.success(`${store.name} 已删除`);
    fetchData();
  };

  const columns = [
    { title: '商家', dataIndex: 'name', key: 'name', render: (v: string, r: Store) => <a href={`/store/${r.slug}`} target="_blank">{v}</a> },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Tag>{v}</Tag> },
    { title: '点击', dataIndex: 'clickCount', key: 'clicks', sorter: (a: Store, b: Store) => a.clickCount - b.clickCount },
    { title: '推荐', dataIndex: 'featured', key: 'featured', render: (v: boolean) => v ? <Tag color="gold">⭐ 推荐</Tag> : '-' },
    { title: '状态', dataIndex: 'active', key: 'active', render: (v: boolean) => v ? <Tag color="green">活跃</Tag> : <Tag color="red">停用</Tag> },
    { title: '操作', key: 'action', render: (_: unknown, record: Store) => (
      <Space size="small">
        <Button size="small" type={record.featured ? 'default' : 'dashed'} onClick={() => toggleFeatured(record)}>
          {record.featured ? '取消推荐' : '⭐ 设为推荐'}
        </Button>
        <Button size="small" type={record.active ? 'default' : 'primary'} onClick={() => toggleActive(record)}>
          {record.active ? '停用' : '启用'}
        </Button>
        <Popconfirm title="确定删除？" onConfirm={() => deleteStore(record)}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
            await fetch('/api/v1/scraper', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'seed' }) });
            message.success('种子数据已导入');
            fetchData();
          }}>导入种子数据</Button>
          <Button icon={<ThunderboltOutlined />} onClick={async () => {
            await fetch('/api/v1/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stores', count: 5 }) });
            message.success('发现新商家');
            fetchData();
          }}>自动发现新商家</Button>
        </Space>
        <Text type="secondary">共 {data.length} 个商家</Text>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </div>
  );
}

// ============================================================
// Coupons Tab
// ============================================================
function CouponsTab() {
  const [data, setData] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/coupons?limit=100').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    });
  };
  useEffect(fetchData, []);

  const toggleActive = async (coupon: Coupon) => {
    await fetch('/api/v1/coupons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: coupon.id, active: !coupon.active }) });
    message.success(`优惠码已${coupon.active ? '停用' : '启用'}`);
    fetchData();
  };

  const deleteCoupon = async (coupon: Coupon) => {
    await fetch(`/api/v1/coupons?id=${coupon.id}`, { method: 'DELETE' });
    message.success('优惠码已删除');
    fetchData();
  };

  const columns = [
    { title: '优惠码', dataIndex: 'title', key: 'title' },
    { title: '商家', dataIndex: 'storeName', key: 'storeName' },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <Tag>免码</Tag> },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (v: string) => <Text strong style={{ color: '#f5222d' }}>{v}</Text> },
    { title: '点击', dataIndex: 'clickCount', key: 'clicks', sorter: (a: Coupon, b: Coupon) => a.clickCount - b.clickCount },
    { title: '使用', dataIndex: 'useCount', key: 'use', sorter: (a: Coupon, b: Coupon) => (a.useCount || 0) - (b.useCount || 0) },
    { title: '状态', dataIndex: 'active', key: 'active', render: (v: boolean) => v ? <Tag color="green">活跃</Tag> : <Tag color="red">停用</Tag> },
    { title: '操作', key: 'action', render: (_: unknown, record: Coupon) => (
      <Space size="small">
        <Button size="small" onClick={() => {
          const shareText = `🔥 ${record.storeName} ${record.discount} 优惠！${record.code ? `\n优惠码：${record.code}` : ''}\n👉 https://www.happysave.cn/store/${record.storeName?.toLowerCase().replace(/\s+/g, '-')}`;
          navigator.clipboard.writeText(shareText);
          message.success('分享文案已复制！');
        }}>📋 分享</Button>
        <Button size="small" type={record.active ? 'default' : 'primary'} onClick={() => toggleActive(record)}>
          {record.active ? '停用' : '启用'}
        </Button>
        <Popconfirm title="确定删除？" onConfirm={() => deleteCoupon(record)}>
          <Button size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
          await fetch('/api/v1/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'coupons', count: 10 }) });
          message.success('生成新优惠码');
          fetchData();
        }}>自动生成优惠码</Button>
        <Button icon={<ExportOutlined />} onClick={() => {
          const top = data.filter(c => c.active).slice(0, 5);
          const text = top.map(c => `🔥 ${c.storeName} ${c.discount}优惠${c.code ? ` 码:${c.code}` : ''}`).join('\n');
          navigator.clipboard.writeText(text + '\n👉 www.happysave.cn');
          message.success('热门优惠文案已复制，可直接粘贴到社交媒体！');
        }}>📤 一键分享热门</Button>
        </Space>
        <Text type="secondary">共 {data.length} 个优惠码</Text>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    </div>
  );
}

// ============================================================
// Users Tab
// ============================================================
function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/v1/user-profiles?action=list').then(r => r.json()).then(d => {
      setUsers(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(fetchUsers, []);

  const levelTag = (level: string) => {
    const map: Record<string, { label: string; color: string }> = {
      svip: { label: '👑 SVIP', color: 'gold' },
      vip: { label: '⭐ VIP', color: 'blue' },
      normal: { label: '👤 普通', color: 'default' },
    };
    const l = map[level] || map.normal;
    return <Tag color={l.color}>{l.label}</Tag>;
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Statistic title="总用户" value={users.length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="VIP用户" value={users.filter(u => u.level === 'vip' || u.level === 'svip').length} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="总积分" value={users.reduce((sum, u) => sum + (u.points || 0), 0)} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="总点击" value={users.reduce((sum, u) => sum + (u.totalclicks || 0), 0)} /></Card></Col>
      </Row>
      <Card title="👥 用户列表" extra={<Tag>{users.length} 人</Tag>}>
        <Table
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          columns={[
            { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string) => <Text strong>{v}</Text> },
            { title: '昵称', dataIndex: 'nickname', key: 'nick', render: (v: string) => v || '-' },
            { title: '等级', dataIndex: 'level', key: 'level', render: (v: string) => levelTag(v || 'normal') },
            { title: '积分', dataIndex: 'points', key: 'points', render: (v: number) => <Tag color="blue">{v || 0}</Tag>, sorter: (a: UserProfile, b: UserProfile) => (a.points || 0) - (b.points || 0) },
            { title: '点击', dataIndex: 'totalclicks', key: 'clicks', render: (v: number) => v || 0, sorter: (a: UserProfile, b: UserProfile) => (a.totalclicks || 0) - (b.totalclicks || 0) },
            { title: '邀请码', dataIndex: 'invitecode', key: 'code', render: (v: string) => v ? <Tag>{v}</Tag> : '-' },
            { title: '角色', dataIndex: 'role', key: 'role', render: (v: string) => <Tag color={v === 'admin' ? 'red' : 'default'}>{v}</Tag> },
            { title: '注册时间', dataIndex: 'createdat', key: 'time', render: (v: string) => v?.slice(0, 10) },
          ]}
        />
      </Card>
    </div>
  );
}

// ============================================================
// Tasks Tab - 人工待办事项
// ============================================================
function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/tasks').then(r => r.json()).then(d => {
      setTasks(d.data || []);
      setLoading(false);
    });
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data fetching pattern
  useEffect(fetchData, []);

  const priorityColors: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' };
  const priorityLabels: Record<string, string> = { high: '🔴 高', medium: '🟡 中', low: '🔵 低' };

  return (
    <div>
      <Alert
        message="📋 人工待办事项清单"
        description="以下事项需要你手动处理。完成后系统会自动接管对应功能。"
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <List
        loading={loading}
        dataSource={tasks}
        renderItem={(task: Task, index: number) => (
          <Card
            key={task.id}
            style={{ marginBottom: 12 }}
            extra={<Tag color={priorityColors[task.priority]}>{priorityLabels[task.priority]}</Tag>}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <Title level={5} style={{ marginBottom: 4 }}>
                  {index + 1}. {task.title}
                </Title>
                <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                  {task.description}
                </Paragraph>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="🔗 链接">
                    {task.url ? <a href={task.url} target="_blank">{task.url}</a> : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="📝 操作步骤">
                    {task.action}
                  </Descriptions.Item>
                  <Descriptions.Item label="🤖 完成后">
                    {task.autoAfter}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  );
}

// ============================================================
// AI Tab
// ============================================================
function AITab() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const runAI = async (action: string, params: Record<string, unknown> = {}) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });
      const data = await res.json();
      setResult(data.data?.content || data.data?.report || data.message || JSON.stringify(data));
    } catch (e) {
      setResult('AI 功能需要配置 OPENAI_API_KEY');
    }
    setLoading(false);
  };

  return (
    <div>
      <Alert
        message="AI 自动运营"
        description="使用 OpenRouter API 自动生成内容。需要在 Vercel 环境变量中配置 OPENAI_API_KEY。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Button block loading={loading} onClick={() => runAI('seo_article')}>📝 生成 SEO 文章</Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Button block loading={loading} onClick={() => runAI('translate_all')}>🌐 翻译所有内容</Button>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Button block loading={loading} onClick={() => runAI('social_post')}>📱 生成社交文案</Button>
          </Card>
        </Col>
      </Row>
      {result && (
        <Card title="AI 输出" style={{ marginTop: 16 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Settings Tab - 系统配置
// ============================================================
function SettingsTab() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
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

// ============================================================
// Marketing Content Tab - 营销内容库
// ============================================================
function MarketingContentTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/marketing-content').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
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
            expandedRowRender: (record: any) => (
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
            { title: '操作', key: 'action', render: (_: any, r: any) => (
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



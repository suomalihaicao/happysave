'use client';

import { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Switch, Tag, Space,
  Card, Row, Col, Statistic, Tabs, message, Badge, List, Checkbox,
  Typography, Alert, Progress, Descriptions, Divider, Popconfirm
} from 'antd';
import {
  ShopOutlined, TagOutlined, BarChartOutlined, RobotOutlined,
  LinkOutlined, EyeOutlined, DeleteOutlined, EditOutlined,
  PlusOutlined, ThunderboltOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined, LockOutlined,
  UserOutlined, MailOutlined, SafetyOutlined, FileTextOutlined,
  ExportOutlined, LineChartOutlined, RiseOutlined, FireOutlined, CopyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

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
          { key: 'affiliate', label: <span><LinkOutlined /> 联盟对接</span>, children: <AffiliateTab />
        },
        { key: 'marketing', label: <span><FireOutlined /> 种草助手</span>, children: <MarketingTab /> },
        ]}
      />
    </div>
  );
}

// ============================================================
// Dashboard Tab
// ============================================================
function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/stores?limit=100').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    });
  };
  useEffect(fetchData, []);

  const toggleFeatured = async (store: any) => {
    await fetch('/api/v1/stores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: store.id, featured: !store.featured }) });
    message.success(`${store.name} 已${store.featured ? '取消推荐' : '设为推荐'}`);
    fetchData();
  };

  const toggleActive = async (store: any) => {
    await fetch('/api/v1/stores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: store.id, active: !store.active }) });
    message.success(`${store.name} 已${store.active ? '停用' : '启用'}`);
    fetchData();
  };

  const deleteStore = async (store: any) => {
    await fetch(`/api/v1/stores?id=${store.id}`, { method: 'DELETE' });
    message.success(`${store.name} 已删除`);
    fetchData();
  };

  const columns = [
    { title: '商家', dataIndex: 'name', key: 'name', render: (v: string, r: any) => <a href={`/store/${r.slug}`} target="_blank">{v}</a> },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Tag>{v}</Tag> },
    { title: '点击', dataIndex: 'clickCount', key: 'clicks', sorter: (a: any, b: any) => a.clickCount - b.clickCount },
    { title: '推荐', dataIndex: 'featured', key: 'featured', render: (v: boolean) => v ? <Tag color="gold">⭐ 推荐</Tag> : '-' },
    { title: '状态', dataIndex: 'active', key: 'active', render: (v: boolean) => v ? <Tag color="green">活跃</Tag> : <Tag color="red">停用</Tag> },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
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
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/coupons?limit=100').then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    });
  };
  useEffect(fetchData, []);

  const toggleActive = async (coupon: any) => {
    await fetch('/api/v1/coupons', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: coupon.id, active: !coupon.active }) });
    message.success(`优惠码已${coupon.active ? '停用' : '启用'}`);
    fetchData();
  };

  const deleteCoupon = async (coupon: any) => {
    await fetch(`/api/v1/coupons?id=${coupon.id}`, { method: 'DELETE' });
    message.success('优惠码已删除');
    fetchData();
  };

  const columns = [
    { title: '优惠码', dataIndex: 'title', key: 'title' },
    { title: '商家', dataIndex: 'storeName', key: 'storeName' },
    { title: 'Code', dataIndex: 'code', key: 'code', render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <Tag>免码</Tag> },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (v: string) => <Text strong style={{ color: '#f5222d' }}>{v}</Text> },
    { title: '点击', dataIndex: 'clickCount', key: 'clicks', sorter: (a: any, b: any) => a.clickCount - b.clickCount },
    { title: '使用', dataIndex: 'useCount', key: 'use', sorter: (a: any, b: any) => (a.useCount || 0) - (b.useCount || 0) },
    { title: '状态', dataIndex: 'active', key: 'active', render: (v: boolean) => v ? <Tag color="green">活跃</Tag> : <Tag color="red">停用</Tag> },
    { title: '操作', key: 'action', render: (_: any, record: any) => (
      <Space size="small">
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
        <Button type="primary" icon={<PlusOutlined />} onClick={async () => {
          await fetch('/api/v1/discover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'coupons', count: 10 }) });
          message.success('生成新优惠码');
          fetchData();
        }}>自动生成优惠码</Button>
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
  return (
    <div>
      <Alert
        message="邮件订阅系统"
        description="用户在网站上输入邮箱订阅后，会出现在这里。你可以导出邮件列表进行批量推广。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Card title="邮件营销工具" extra={<Button icon={<ExportOutlined />}>导出邮件列表</Button>}>
        <List
          dataSource={[
            { title: '📧 Mailchimp', desc: '最流行的邮件营销工具，免费版支持 500 订阅者', url: 'https://mailchimp.com' },
            { title: '📧 Brevo (Sendinblue)', desc: '免费版每天 300 封邮件，适合初期', url: 'https://www.brevo.com' },
            { title: '📧 Resend', desc: '开发者友好，API 驱动，免费 100 封/天', url: 'https://resend.com' },
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<a href={item.url} target="_blank">{item.title}</a>}
                description={item.desc}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}

// ============================================================
// Analytics Tab - 运营统计面板
// ============================================================
function AnalyticsTab() {
  const [stats, setStats] = useState<any>(null);
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
            <Statistic title="移动端" value={(stats.byDevice?.find((d: any) => d.device === 'mobile')?.cnt) || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="桌面端" value={(stats.byDevice?.find((d: any) => d.device === 'desktop')?.cnt) || 0} />
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
              renderItem={(item: any) => (
                <List.Item>
                  <span>{item.device === 'mobile' ? '📱' : item.device === 'tablet' ? '📋' : '🖥️'} {item.device}</span>
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
              renderItem={(item: any) => (
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
              renderItem={(item: any) => (
                <List.Item>
                  <span>{item.name || item.cnt}</span>
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
              renderItem={(item: any) => (
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
          renderItem={(item: any) => (
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
          {['zhihu', 'weibo', 'xiaohongshu', 'douban', 'wechat', 'douyin'].map(platform => (
            <Col key={platform}>
              <Button size="small" onClick={() => {
                const url = `https://happysave.vercel.app/?utm_source=${platform}&utm_medium=forum&utm_campaign=2026spring`;
                navigator.clipboard.writeText(url);
                message.success(`已复制 ${platform} 链接！`);
              }}>
                {platform === 'zhihu' ? '知乎' : platform === 'weibo' ? '微博' : platform === 'xiaohongshu' ? '小红书' : platform === 'douban' ? '豆瓣' : platform === 'wechat' ? '微信' : '抖音'}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}

// ============================================================
// Tasks Tab - 人工待办事项
// ============================================================
function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/v1/tasks').then(r => r.json()).then(d => {
      setTasks(d.data || []);
      setLoading(false);
    });
  };
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
        renderItem={(task, index) => (
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

  const runAI = async (action: string, params: any = {}) => {
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
// Affiliate Tab - 联盟对接管理
// ============================================================
function AffiliateTab() {
  const [status, setStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

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
        {Object.entries(networks).map(([key, net]: [string, any]) => (
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
                  {syncResult.networks && Object.entries(syncResult.networks).map(([k, v]: [string, any]) => (
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
          dataSource={[
            { name: 'ShareASale', url: 'https://www.shareasale.com/shareasale.cfm?merchantType=affiliate', desc: '适合时尚/美妆/家居海淘', commission: '5-15%' },
            { name: 'CJ Affiliate', url: 'https://www.cj.com/', desc: '大型品牌/零售商', commission: '3-10%' },
            { name: 'Impact', url: 'https://impact.com/', desc: '科技/SaaS/订阅', commission: '10-40%' },
            { name: 'Awin', url: 'https://www.awin.com/', desc: '全球网络/欧美为主', commission: '5-12%' },
          ]}
          renderItem={(item: any) => (
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


function MarketingTab() {
  const [platform, setPlatform] = useState('xiaohongshu');
  const [store, setStore] = useState('');
  const [content, setContent] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspiration, setInspiration] = useState<any>(null);

  const platforms = [
    { value: 'xiaohongshu', label: '📕 小红书' },
    { value: 'zhihu', label: '📝 知乎' },
    { value: 'weibo', label: '🔥 微博' },
    { value: 'douyin', label: '🎬 抖音' },
    { value: 'wechat', label: '💬 朋友圈' },
    { value: 'bilibili', label: '📺 B站' },
  ];

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
                {inspiration.hotTopics?.map((t: any, i: number) => (
                  <Tag key={i} color={t.urgency === '高' ? 'red' : 'blue'} style={{ marginBottom: 8 }}>{t.topic}</Tag>
                ))}
                <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>⏰ 最佳发布时间</div>
                {Object.entries(inspiration.bestTime || {}).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 13, padding: '2px 0' }}>{platforms.find(p => p.value === k)?.label || k}: {v as string}</div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

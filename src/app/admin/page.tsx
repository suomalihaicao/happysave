'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card, Button, Table, Tag, Space, Typography, Avatar, Row, Col,
  Badge, Tooltip, QRCode, message, Divider, Modal, Form, Input,
  Select, Switch, InputNumber, Tabs, Statistic, Popconfirm,
} from 'antd';
import {
  QrcodeOutlined, CopyOutlined, DeleteOutlined, EditOutlined,
  ShoppingCartOutlined, TagOutlined, ThunderboltOutlined,
  FireOutlined, PlusOutlined, LineChartOutlined,
} from '@ant-design/icons';
import { AntdProvider } from '@/providers/AntdProvider';

import AIPanel from './ai-panel';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function AdminContent() {
  const [stats, setStats] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [shortLinks, setShortLinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  // Modal states
  const [storeModal, setStoreModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [couponModal, setCouponModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [qrVisible, setQrVisible] = useState<{ url: string; title: string } | null>(null);

  const [storeForm] = Form.useForm();
  const [couponForm] = Form.useForm();

  const loadAll = () => {
    Promise.all([
      fetch('/api/v1/stats').then(r => r.json()),
      fetch('/api/v1/stores').then(r => r.json()),
      fetch('/api/v1/coupons').then(r => r.json()),
      fetch('/api/v1/links').then(r => r.json()),
      fetch('/api/v1/categories').then(r => r.json()),
    ]).then(([statsRes, storesRes, couponsRes, linksRes, catsRes]) => {
      setStats(statsRes.data);
      setStores(storesRes.data || []);
      setCoupons(couponsRes.data || []);
      setShortLinks(linksRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadAll(); }, []);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('已复制');
  };

  // ===== Store CRUD =====
  const saveStore = async () => {
    try {
      const values = await storeForm.validateFields();
      const isEdit = storeModal.edit;
      const res = await fetch('/api/v1/stores', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: storeModal.edit.id, ...values } : values),
      });
      if (res.ok) {
        messageApi.success(isEdit ? '商家已更新' : '商家已创建');
        setStoreModal({ open: false });
        storeForm.resetFields();
        loadAll();
      }
    } catch (e) { /* form validation error */ }
  };

  const deleteStore = async (id: string) => {
    await fetch(`/api/v1/stores?id=${id}`, { method: 'DELETE' });
    messageApi.success('商家已删除');
    loadAll();
  };

  // ===== Coupon CRUD =====
  const saveCoupon = async () => {
    try {
      const values = await couponForm.validateFields();
      const isEdit = couponModal.edit;
      const res = await fetch('/api/v1/coupons', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: couponModal.edit.id, ...values } : values),
      });
      if (res.ok) {
        messageApi.success(isEdit ? '优惠码已更新' : '优惠码已创建');
        setCouponModal({ open: false });
        couponForm.resetFields();
        loadAll();
      }
    } catch (e) { /* form validation error */ }
  };

  const deleteCoupon = async (id: string) => {
    await fetch(`/api/v1/coupons?id=${id}`, { method: 'DELETE' });
    messageApi.success('优惠码已删除');
    loadAll();
  };

  // ===== Table Columns =====
  const storeColumns = [
    {
      title: '商家',
      key: 'store',
      render: (_: any, r: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#fff2e8', color: '#ff6b35' }}>{r.name.charAt(0)}</Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.nameZh}</Text>
          </div>
        </Space>
      ),
    },
    { title: '分类', dataIndex: 'categoryZh', key: 'category' },
    { title: '点击量', dataIndex: 'clickCount', key: 'clickCount', sorter: (a: any, b: any) => a.clickCount - b.clickCount, render: (v: number) => <Text strong>{v?.toLocaleString()}</Text> },
    { title: '转化率', dataIndex: 'conversionRate', key: 'conversionRate', render: (v: number) => <Tag color={v >= 5 ? 'green' : v >= 3 ? 'orange' : 'default'}>{v?.toFixed(1)}%</Tag> },
    { title: '状态', key: 'status', render: (_: any, r: any) => <Badge status={r.active ? 'success' : 'default'} text={r.active ? '活跃' : '禁用'} /> },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          <Tooltip title="查看"><Link href={`/store/${r.slug}`}><Button type="link" size="small">查看</Button></Link></Tooltip>
          <Tooltip title="二维码"><Button icon={<QrcodeOutlined />} size="small" onClick={() => setQrVisible({ url: r.affiliateUrl || `https://happysave.com/store/${r.slug}`, title: r.name })} /></Tooltip>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} size="small" onClick={() => { storeForm.setFieldsValue(r); setStoreModal({ open: true, edit: r }); }} /></Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => deleteStore(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
        </Space>
      ),
    },
  ];

  const couponColumns = [
    { title: '商家', dataIndex: 'storeName', key: 'storeName' },
    {
      title: '优惠', key: 'title',
      render: (_: any, r: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.titleZh || r.title}</div>
          {r.code && <Tag color="blue" style={{ fontFamily: 'monospace', marginTop: 4 }}>{r.code}</Tag>}
        </div>
      ),
    },
    { title: '折扣', dataIndex: 'discount', key: 'discount', render: (v: string) => <Tag color="orange">{v}</Tag> },
    { title: '点击', dataIndex: 'clickCount', key: 'clickCount', sorter: (a: any, b: any) => a.clickCount - b.clickCount, render: (v: number) => v?.toLocaleString() },
    { title: '使用', dataIndex: 'useCount', key: 'useCount', render: (v: number) => v?.toLocaleString() },
    { title: '验证', dataIndex: 'verified', key: 'verified', render: (v: boolean) => <Badge status={v ? 'success' : 'warning'} text={v ? '已验证' : '待验证'} /> },
    {
      title: '操作', key: 'actions',
      render: (_: any, r: any) => (
        <Space>
          {r.code && <Tooltip title="复制"><Button icon={<CopyOutlined />} size="small" onClick={() => copyText(r.code)} /></Tooltip>}
          <Tooltip title="编辑"><Button icon={<EditOutlined />} size="small" onClick={() => { couponForm.setFieldsValue(r); setCouponModal({ open: true, edit: r }); }} /></Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => deleteCoupon(r.id)}><Button icon={<DeleteOutlined />} size="small" danger /></Popconfirm>
        </Space>
      ),
    },
  ];

  const linkColumns = [
    { title: '短链接', dataIndex: 'code', key: 'code', render: (v: string) => <Space><Text code>happysave.com/s/{v}</Text><Button icon={<CopyOutlined />} size="small" type="link" onClick={() => copyText(`https://happysave.com/s/${v}`)} /></Space> },
    { title: '商家', dataIndex: 'storeName', key: 'storeName' },
    { title: '点击', dataIndex: 'clicks', key: 'clicks', sorter: (a: any, b: any) => a.clicks - b.clicks },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => v ? new Date(v).toLocaleString('zh-CN') : '-' },
  ];

  const items = [
    {
      key: 'dashboard',
      label: '📊 数据概览',
      children: stats && (
        <div>
          <Row gutter={[16, 16]}>
            {[
              { icon: '🏪', label: '商家总数', value: stats.totalStores, color: '#ff6b35' },
              { icon: '🎫', label: '优惠码总数', value: stats.totalCoupons, color: '#1890ff' },
              { icon: '👆', label: '总点击数', value: stats.totalClicks, color: '#52c41a' },
              { icon: '🔗', label: '短链接数', value: stats.totalLinks, color: '#eb2f96' },
              { icon: '📄', label: 'SEO 页面', value: stats.totalSeoPages || 0, color: '#722ed1' },
            ].map((item, i) => (
              <Col xs={12} sm={8} md={6} lg={4} key={i}>
                <Card hoverable bodyStyle={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.label}</Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: item.color }}>
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </div>
                    </div>
                    <span style={{ fontSize: 32, opacity: 0.8 }}>{item.icon}</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <Divider />
          <Row gutter={24}>
            <Col span={12}>
              <Card title={<Space><FireOutlined /> 商家排行</Space>}>
                <Table size="small" dataSource={stats.topStores} pagination={false} rowKey="name" columns={[
                  { title: '排名', key: 'rank', render: (_: any, __: any, i: number) => <Tag color={i < 3 ? 'orange' : 'default'}>{i + 1}</Tag> },
                  { title: '商家', dataIndex: 'name' },
                  { title: '点击', dataIndex: 'clicks', render: (v: number) => v?.toLocaleString() },
                ]} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<Space><ThunderboltOutlined /> 快捷操作</Space>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" icon={<PlusOutlined />} block onClick={() => setStoreModal({ open: true })}>添加商家</Button>
                  <Button type="primary" icon={<PlusOutlined />} block onClick={() => setCouponModal({ open: true })}>添加优惠码</Button>
                  <Link href="/"><Button block>查看前台 →</Button></Link>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'stores',
      label: '🏪 商家管理',
      children: (
        <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setStoreModal({ open: true })}>添加商家</Button>}>
          <Table dataSource={stores} rowKey="id" columns={storeColumns} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个商家` }} loading={loading} />
        </Card>
      ),
    },
    {
      key: 'coupons',
      label: '🎫 优惠码管理',
      children: (
        <Card extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCouponModal({ open: true })}>添加优惠码</Button>}>
          <Table dataSource={coupons} rowKey="id" columns={couponColumns} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个优惠码` }} loading={loading} />
        </Card>
      ),
    },
    {
      key: 'links',
      label: '🔗 短链接管理',
      children: (
        <Card>
          <Table dataSource={shortLinks} rowKey="id" columns={linkColumns} pagination={{ pageSize: 10 }} locale={{ emptyText: '暂无短链接' }} loading={loading} />
        </Card>
      ),
    },
    {
      key: 'ai',
      label: '🤖 AI 运营',
      children: <AIPanel />,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {contextHolder}
      
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size="large">
          <Link href="/"><Button>← 返回首页</Button></Link>
          <Title level={3} style={{ margin: 0 }}>📊 快乐省省 管理后台</Title>
        </Space>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setStoreModal({ open: true })}>添加商家</Button>
          <Button type="primary" icon={<FireOutlined />} onClick={() => setCouponModal({ open: true })}>添加优惠码</Button>
        </Space>
      </div>

      <Tabs items={items} />

      {/* ===== Store Modal ===== */}
      <Modal
        title={storeModal.edit ? '编辑商家' : '添加商家'}
        open={storeModal.open}
        onOk={saveStore}
        onCancel={() => { setStoreModal({ open: false }); storeForm.resetFields(); }}
        width={600}
      >
        <Form form={storeForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="商家名称" rules={[{ required: true }]}><Input placeholder="Temu" /></Form.Item></Col>
            <Col span={12}><Form.Item name="nameZh" label="中文名称"><Input placeholder="Temu" /></Form.Item></Col>
          </Row>
          <Form.Item name="slug" label="URL Slug" rules={[{ required: true }]}><Input placeholder="temu" /></Form.Item>
          <Form.Item name="description" label="英文描述"><TextArea rows={2} /></Form.Item>
          <Form.Item name="descriptionZh" label="中文描述"><TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="website" label="官网"><Input placeholder="https://www.temu.com" /></Form.Item></Col>
            <Col span={12}><Form.Item name="affiliateUrl" label="推广链接"><Input placeholder="https://www.temu.com?aff=xxx" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="选择分类">
                  {categories.map((c: any) => <Option key={c.id} value={c.id}>{c.icon} {c.nameZh}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="categoryZh" label="分类中文名"><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="featured" label="推荐" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="active" label="启用" valuePropName="checked" initialValue><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="sortOrder" label="排序"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* ===== Coupon Modal ===== */}
      <Modal
        title={couponModal.edit ? '编辑优惠码' : '添加优惠码'}
        open={couponModal.open}
        onOk={saveCoupon}
        onCancel={() => { setCouponModal({ open: false }); couponForm.resetFields(); }}
        width={600}
      >
        <Form form={couponForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="storeId" label="商家" rules={[{ required: true }]}>
            <Select placeholder="选择商家">
              {stores.map((s: any) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="title" label="英文标题" rules={[{ required: true }]}><Input placeholder="20% Off" /></Form.Item></Col>
            <Col span={12}><Form.Item name="titleZh" label="中文标题"><Input placeholder="全场8折" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="code" label="优惠码"><Input placeholder="SAVE20" /></Form.Item></Col>
            <Col span={8}><Form.Item name="discount" label="折扣"><Input placeholder="20%" /></Form.Item></Col>
            <Col span={8}>
              <Form.Item name="type" label="类型">
                <Select defaultValue="code">
                  <Option value="code">优惠码</Option>
                  <Option value="deal">促销</Option>
                  <Option value="cashback">返现</Option>
                  <Option value="freebie">免费</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="discountType" label="折扣类型">
                <Select defaultValue="percentage">
                  <Option value="percentage">百分比</Option>
                  <Option value="fixed">固定金额</Option>
                  <Option value="free_shipping">免运费</Option>
                  <Option value="trial">试用</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="startDate" label="开始日期"><Input type="date" /></Form.Item></Col>
            <Col span={8}><Form.Item name="endDate" label="结束日期"><Input type="date" /></Form.Item></Col>
          </Row>
          <Form.Item name="affiliateUrl" label="推广链接"><Input placeholder="https://..." /></Form.Item>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="featured" label="推荐" valuePropName="checked"><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="active" label="启用" valuePropName="checked" initialValue><Switch /></Form.Item></Col>
            <Col span={8}><Form.Item name="verified" label="已验证" valuePropName="checked"><Switch /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>

      {/* QR Modal */}
      {qrVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setQrVisible(null)}>
          <Card title={qrVisible.title} style={{ width: 320 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <QRCode value={qrVisible.url} size={200} />
              <div style={{ marginTop: 12 }}>
                <Button icon={<CopyOutlined />} onClick={() => copyText(qrVisible.url)}>复制链接</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AntdProvider>
      <AdminContent />
    </AntdProvider>
  );
}

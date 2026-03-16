// /advertise page - 商务合作
'use client';

import Link from 'next/link';
import { Card, Button, Row, Col, Typography, Divider, Statistic } from 'antd';

const { Title, Paragraph } = Typography;

const plans = [
  {
    name: '基础推荐',
    price: '¥299/月',
    features: ['商家列表推荐位', '首页分类展示', '月度数据报告'],
    color: '#52c41a',
  },
  {
    name: '标准推广',
    price: '¥799/月',
    features: ['首页Banner广告位', '商家列表置顶', '邮件推送中提及', '周度数据报告'],
    color: '#1890ff',
    popular: true,
  },
  {
    name: '旗舰合作',
    price: '¥1,999/月',
    features: ['首页独家推荐', '全站Banner展示', '专属优惠码页面', '社交媒体联合推广', '实时数据面板'],
    color: '#722ed1',
  },
];

export default function AdvertisePage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1}>📢 商务合作 / 广告投放</Title>
        <Paragraph style={{ fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
          面向全球海淘消费者，精准触达高购买力用户群体。
        </Paragraph>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 48 }}>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="月均UV" value="10,000+" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="注册用户" value="1,200+" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic title="合作商家" value="50+" />
          </Card>
        </Col>
      </Row>

      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>合作方案</Title>
      <Row gutter={[24, 24]}>
        {plans.map((plan, i) => (
          <Col xs={24} md={8} key={i}>
            <Card
              style={{ textAlign: 'center', borderColor: plan.popular ? plan.color : undefined, borderWidth: plan.popular ? 2 : 1 }}
              title={<span style={{ color: plan.color }}>{plan.popular ? '⭐ ' : ''}{plan.name}</span>}
            >
              <div style={{ fontSize: 32, fontWeight: 'bold', color: plan.color, marginBottom: 16 }}>{plan.price}</div>
              {plan.features.map((f, j) => (
                <div key={j} style={{ padding: '8px 0', borderBottom: j < plan.features.length - 1 ? '1px solid #f0f0f0' : undefined, textAlign: 'center' }}>
                  ✅ {f}
                </div>
              ))}
              <Button type="primary" size="large" style={{ marginTop: 24, background: plan.color, borderColor: plan.color }}
                href="mailto:partner@happysave.cn">
                立即咨询
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Title level={3}>联系我们</Title>
        <Paragraph>
          📧 partner@happysave.cn<br />
          📱 微信: happysave2026
        </Paragraph>
        <Link href="/"><Button size="large">← 返回首页</Button></Link>
      </div>
    </div>
  );
}

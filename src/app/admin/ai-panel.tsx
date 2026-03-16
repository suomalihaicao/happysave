'use client';

import { useState } from 'react';
import {
  Card, Button, Space, Typography, message, Divider, Alert,
  Select, Row, Col, Tag, List,
} from 'antd';
import {
  RobotOutlined, FileTextOutlined, TranslationOutlined,
  ShareAltOutlined, ThunderboltOutlined, BulbOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AIResults = Record<string, any>;

interface CouponSuggestion {
  storeName: string;
  discount: string;
  couponCode?: string;
  reason: string;
}

interface SocialPost {
  store: string;
  weibo?: string;
  wechat?: string;
}

export default function AIPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<AIResults>({});
  const [messageApi, contextHolder] = message.useMessage();

  const runAI = async (action: string, body: Record<string, unknown> = {}) => {
    setLoading(action);
    try {
      const res = await fetch('/api/v1/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [action]: data.data }));
        messageApi.success('AI 执行成功');
      } else {
        messageApi.error(data.message || 'AI 执行失败');
      }
    } catch (e: unknown) {
      messageApi.error(e instanceof Error ? e.message : '执行失败');
    }
    setLoading(null);
  };

  const runCron = async (task: string) => {
    setLoading(`cron_${task}`);
    try {
      const res = await fetch(`/api/v1/cron?task=${task}`, {
        credentials: 'same-origin', // 携带 admin cookie
      });
      const data = await res.json();
      if (data.success) {
        setResults((prev) => ({ ...prev, [`cron_${task}`]: data.results }));
        messageApi.success('定时任务执行成功');
      } else {
        messageApi.error(data.error || '任务失败');
      }
    } catch (e: unknown) {
      messageApi.error(e instanceof Error ? e.message : '任务失败');
    }
    setLoading(null);
  };

  return (
    <div>
      {contextHolder}

      <Alert
        message="AI 自动运营中心"
        description="配置 OPENAI_API_KEY 后，以下功能将自动运行。所有 AI 生成内容都可人工审核后发布。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {/* SEO 内容生成 */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><FileTextOutlined /> SEO 文章生成</Space>}
            extra={<Tag color="green">自动</Tag>}
          >
            <Paragraph type="secondary">
              AI 为每个商家自动生成 SEO 友好的攻略文章，提升搜索引擎排名。
            </Paragraph>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                loading={loading === 'generate_all_seo'}
                onClick={() => runAI('generate_all_seo')}
                block
              >
                🤖 为所有商家生成 SEO 文章
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                loading={loading === 'cron_seo'}
                onClick={() => runCron('seo')}
                block
              >
                ⚡ 运行 SEO 定时任务
              </Button>
            </Space>
            {results.generate_all_seo && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">已生成 {results.generate_all_seo.generated} 篇文章</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* 智能推荐 */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><BulbOutlined /> 智能推荐</Space>}
            extra={<Tag color="blue">建议</Tag>}
          >
            <Paragraph type="secondary">
              AI 分析市场趋势，推荐值得添加的新商家和优惠码。
            </Paragraph>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={loading === 'suggest_coupons'}
              onClick={() => runAI('suggest_coupons')}
              block
            >
              🤖 AI 推荐新优惠码
            </Button>
            {results.suggest_coupons?.suggestions && (
              <List
                size="small"
                style={{ marginTop: 16 }}
                dataSource={results.suggest_coupons.suggestions}
                renderItem={(item: unknown) => {
                  const s = item as CouponSuggestion;
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text strong>{s.storeName}</Text>}
                        description={
                          <div>
                            <Tag color="orange">{s.discount}</Tag>
                            {s.couponCode && <Tag>{s.couponCode}</Tag>}
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>{s.reason}</Text>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        {/* 多语言翻译 */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><TranslationOutlined /> 优惠码翻译</Space>}
            extra={<Tag color="purple">批量</Tag>}
          >
            <Paragraph type="secondary">
              自动将英文优惠信息翻译成中文，支持批量处理。
            </Paragraph>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={loading === 'cron_translate'}
              onClick={async () => {
                setLoading('cron_translate');
                // Fetch all coupons without Chinese translations
                const res = await fetch('/api/v1/coupons?active=true&limit=50');
                const data = await res.json();
                let translated = 0;
                for (const coupon of data.data || []) {
                  if (!coupon.titleZh || coupon.titleZh === coupon.title) {
                    await fetch('/api/v1/ai', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'translate_coupon', couponId: coupon.id }),
                    });
                    translated++;
                    await new Promise(r => setTimeout(r, 500));
                  }
                }
                messageApi.success(`已翻译 ${translated} 个优惠码`);
                setLoading(null);
              }}
              block
            >
              🤖 批量翻译优惠码
            </Button>
          </Card>
        </Col>

        {/* 社交媒体文案 */}
        <Col xs={24} md={12}>
          <Card
            title={<Space><ShareAltOutlined /> 社交媒体文案</Space>}
            extra={<Tag color="cyan">一键生成</Tag>}
          >
            <Paragraph type="secondary">
              AI 自动生成微博、微信、Twitter 推广文案。
            </Paragraph>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              loading={loading === 'cron_social'}
              onClick={() => runCron('social')}
              block
            >
              🤖 生成推广文案
            </Button>
            {results.cron_social && (
              <List
                size="small"
                style={{ marginTop: 16 }}
                dataSource={results.cron_social}
                renderItem={(item: unknown) => {
                  const post = item as SocialPost;
                  return (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{post.store}</Text>}
                      description={
                        <div>
                          <div><Text type="secondary">微博：</Text>{post.weibo?.substring(0, 60)}...</div>
                          <div><Text type="secondary">微信：</Text>{post.wechat?.substring(0, 60)}...</div>
                        </div>
                      }
                    />
                  </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        {/* 每日报告 */}
        <Col xs={24}>
          <Card
            title={<Space><ThunderboltOutlined /> AI 每日运营报告</Space>}
          >
            <Space>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                loading={loading === 'daily_report'}
                onClick={() => runAI('daily_report')}
              >
                📊 生成今日报告
              </Button>
              <Button
                icon={<ThunderboltOutlined />}
                loading={loading === 'cron_report'}
                onClick={() => runCron('report')}
              >
                运行报告定时任务
              </Button>
            </Space>
            {(results.daily_report?.report || results.cron_report?.report) && (
              <Card size="small" style={{ marginTop: 16, background: '#f6ffed' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {results.daily_report?.report || results.cron_report?.report}
                </Paragraph>
              </Card>
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Vercel Cron 配置说明 */}
      <Card size="small" title="⏰ 定时任务配置（Vercel）">
        <Paragraph>
          在 <Text code>vercel.json</Text> 中添加 cron 配置，实现完全自动化：
        </Paragraph>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto' }}>
{`{
  "crons": [
    { "path": "/api/v1/cron?task=seo&secret=YOUR_SECRET", "schedule": "0 3 * * 1" },
    { "path": "/api/v1/cron?task=social&secret=YOUR_SECRET", "schedule": "0 9 * * *" },
    { "path": "/api/v1/cron?task=report&secret=YOUR_SECRET", "schedule": "0 23 * * *" }
  ]
}`}
        </pre>
        <Text type="secondary">
          SEO 文章：每周一 3:00 · 推广文案：每天 9:00 · 运营报告：每天 23:00
        </Text>
      </Card>
    </div>
  );
}

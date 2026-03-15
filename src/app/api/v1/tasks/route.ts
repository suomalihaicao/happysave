// 人工任务管理 API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 任务存储（使用 notifications 表复用）
const TASK_PREFIX = 'task:';

// POST /api/v1/tasks - 创建/更新任务
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'create': {
      const { title, description, category, priority, url } = body;
      const id = await db.createNotification({
        type: TASK_PREFIX + (category || 'general'),
        keyword: title,
        email: description || '',
        userId: priority || 'medium',
        storeId: url || '',
      });
      return NextResponse.json({ success: true, message: '任务已创建', data: { id } });
    }

    case 'update': {
      const { id, completed } = body;
      await db.updateNotification?.(id, { active: !completed });
      return NextResponse.json({ success: true, message: '任务已更新' });
    }

    case 'delete': {
      const { id } = body;
      await db.deleteNotification?.(id);
      return NextResponse.json({ success: true, message: '任务已删除' });
    }

    case 'fix_stats': {
      await db.fixCouponStats();
      return NextResponse.json({ success: true, message: '已批量更新优惠码点击/使用数据' });
    }

    default:
      return NextResponse.json({ success: false }, { status: 400 });
  }
}

// GET /api/v1/tasks - 获取任务列表
export async function GET() {
  // 返回预设的待办事项
  const tasks = [
    {
      id: 'task-1',
      title: '注册 ShareASale 联盟',
      description: '全球最大联盟平台，注册后填入 API Key 即可自动拉取商家和优惠码',
      category: 'affiliate',
      priority: 'high',
      status: 'pending',
      url: 'https://www.shareasale.com/',
      action: '注册账号 → 申请 API → 填入 Vercel 环境变量 SHAREASALE_TOKEN + SHAREASALE_SECRET',
      autoAfter: '填入后系统自动拉取数据，每天定时运行',
    },
    {
      id: 'task-2',
      title: '注册 CJ (Commission Junction)',
      description: '全球第二大联盟平台，大量国际品牌',
      category: 'affiliate',
      priority: 'high',
      status: 'pending',
      url: 'https://www.cj.com/',
      action: '注册 Publisher 账号 → 拿 API Token → 填入 CJ_API_TOKEN',
      autoAfter: '系统自动拉取',
    },
    {
      id: 'task-3',
      title: '申请 Google AdSense',
      description: '网站有稳定流量后申请，展示广告赚取收入',
      category: 'monetization',
      priority: 'medium',
      status: 'pending',
      url: 'https://www.google.com/adsense/',
      action: '网站需要有一定内容和流量 → 申请 → 获得 Publisher ID → 填入代码',
      autoAfter: '代码已预配置在 src/lib/ads.ts，拿到 ID 后开启即可',
    },
    {
      id: 'task-4',
      title: '配置 OPENAI_API_KEY',
      description: '开启 AI 自动运营：SEO文章生成、翻译、社交文案等',
      category: 'ai',
      priority: 'high',
      status: 'pending',
      url: 'https://openrouter.ai/',
      action: '已有 OpenRouter key → 填入 Vercel 环境变量',
      autoAfter: '填入后 AI 功能自动生效（每天定时生成内容）',
    },
    {
      id: 'task-5',
      title: '注册 Impact 联盟',
      description: 'Nike、Adidas 等大牌专属联盟',
      category: 'affiliate',
      priority: 'medium',
      status: 'pending',
      url: 'https://www.impact.com/',
      action: '注册 Publisher → 拿 Account SID + Auth Token',
      autoAfter: '系统自动拉取',
    },
    {
      id: 'task-6',
      title: '域名绑定（自定义域名）',
      description: '将 happysave.cn 绑定到 Vercel',
      category: 'infra',
      priority: 'low',
      status: 'pending',
      url: '',
      action: '购买域名 → Vercel Settings → Domains → 添加域名 → 配置 DNS',
      autoAfter: '绑定后 SEO 效果更好',
    },
    {
      id: 'task-7',
      title: 'Google Search Console 提交',
      description: '提交 sitemap 加速收录',
      category: 'seo',
      priority: 'medium',
      status: 'pending',
      url: 'https://search.google.com/search-console/',
      action: '验证域名 → 提交 sitemap.xml → 监控收录',
      autoAfter: 'sitemap 已自动生成在 /sitemap.xml',
    },
    {
      id: 'task-8',
      title: '社交媒体账号注册',
      description: 'Twitter/X + Instagram + 小红书',
      category: 'marketing',
      priority: 'low',
      status: 'pending',
      url: '',
      action: '注册品牌账号 → 配置社交分享 → AI 自动生成内容',
      autoAfter: '社交文案 AI 已就绪，配好账号即可发布',
    },
  ];

  return NextResponse.json({ success: true, data: tasks, total: tasks.length });
}

// 全球营销团队API - 内容制作 + 分发管理
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function callAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
  const model = process.env.OPENAI_MODEL || 'openrouter/healer-alpha';
  if (!apiKey) return null;
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

// 全球平台矩阵
const PLATFORMS = [
  // 中国
  { id: 'xiaohongshu', name: '小红书', country: 'CN', lang: 'zh', type: '图文', icon: '📕', traffic: '3亿MAU', style: '购物体验分享，带生活感', bestTime: '20:00-22:00' },
  { id: 'zhihu', name: '知乎', country: 'CN', lang: 'zh', type: '长文', icon: '📝', traffic: '1亿MAU', style: '专业省钱攻略，数据分析', bestTime: '12:00-13:00, 21:00-23:00' },
  { id: 'weibo', name: '微博', country: 'CN', lang: 'zh', type: '短文', icon: '🔥', traffic: '5亿MAU', style: '热点话题，转发抽奖', bestTime: '08:00-09:00, 22:00-23:00' },
  { id: 'douyin', name: '抖音', country: 'CN', lang: 'zh', type: '短视频', icon: '🎬', traffic: '7亿MAU', style: '口播种草，开箱视频', bestTime: '19:00-22:00' },
  // 美国
  { id: 'reddit', name: 'Reddit', country: 'US', lang: 'en', type: '帖文', icon: '🟠', traffic: '1.7亿MAU', style: 'r/deals, r/frugal 分享', bestTime: '09:00-11:00 EST' },
  { id: 'twitter_us', name: 'X (Twitter)', country: 'US', lang: 'en', type: '短文', icon: '🐦', traffic: '3.5亿MAU', style: 'Deal alerts, coupon codes', bestTime: '12:00-15:00 EST' },
  { id: 'tiktok', name: 'TikTok', country: 'US', lang: 'en', type: '短视频', icon: '🎵', traffic: '15亿MAU', style: 'Shopping haul, deal finds', bestTime: '18:00-21:00 EST' },
  // 日本
  { id: 'note_jp', name: 'note', country: 'JP', lang: 'ja', type: '长文', icon: '📓', traffic: '3000万MAU', style: 'ショッピング体験談', bestTime: '20:00-23:00 JST' },
  { id: 'twitter_jp', name: 'X (日本)', country: 'JP', lang: 'ja', type: '短文', icon: '🐦', traffic: '6000万MAU', style: 'お得情報シェア', bestTime: '12:00-13:00, 21:00-23:00 JST' },
  // 韩国
  { id: 'naver', name: 'Naver Blog', country: 'KR', lang: 'ko', type: '博客', icon: '🟢', traffic: '4000万MAU', style: '쇼핑 리뷰, 할인 정보', bestTime: '20:00-22:00 KST' },
  // 欧洲
  { id: 'instagram', name: 'Instagram', country: 'EU', lang: 'en', type: '图文', icon: '📸', traffic: '20亿MAU', style: 'Shopping hauls, savings tips', bestTime: '11:00-13:00 CET' },
  // 东南亚
  { id: 'shopee_live', name: 'Shopee Live', country: 'SEA', lang: 'en', type: '直播', icon: '🛒', traffic: '3亿MAU', style: 'Live deal reveals', bestTime: '20:00-22:00 SGT' },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      platforms: PLATFORMS,
      team: [
        { role: '内容编辑', count: '1-2人', task: '每日生成种草文案，AI辅助人工润色' },
        { role: '设计', count: '1人', task: '制作配图、封面图、信息图' },
        { role: '运营', count: '2-3人', task: '定时发布，回复评论，互动维护' },
        { role: '数据分析', count: '1人', task: '追踪UTM数据，优化发布策略' },
      ],
      workflow: [
        '1. AI生成初稿（种草助手）',
        '2. 编辑润色 + 设计配图',
        '3. 排期发布（按最佳时间）',
        '4. 运营互动（回复评论引导）',
        '5. 数据追踪（UTM分析转化）',
        '6. 每周复盘优化策略',
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // 生成某个平台的内容
  if (action === 'generate') {
    const platformId = body.platform || 'xiaohongshu';
    const store = body.store || '';
    const platform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];
    
    const coupons = await db.getCoupons({ limit: 20 });
    const stores = await db.getStores({ active: true, limit: 10 });
    const topCoupons = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)).slice(0, 5);
    const storeNames = (stores.data as any[]).map(s => s.name).join(', ');
    
    const prompt = buildPrompt(platform, store, topCoupons, storeNames);
    const aiResult = await callAI(prompt);
    
    return NextResponse.json({
      success: true,
      data: {
        platform: platform.name,
        country: platform.country,
        type: platform.type,
        content: aiResult || getTemplate(platform, topCoupons[0]),
        style: platform.style,
        bestTime: platform.bestTime,
        tips: getTips(platform.id),
      },
    });
  }

  // 批量生成所有平台内容
  if (action === 'batch_generate') {
    const results = [];
    for (const platform of PLATFORMS.slice(0, 6)) { // 先生成前6个主要平台
      const coupons = await db.getCoupons({ limit: 10 });
      const topCoupon = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
      
      const prompt = buildPrompt(platform, '', [topCoupon].filter(Boolean), 'Nike, Adidas, Amazon');
      const aiResult = await callAI(prompt);
      
      results.push({
        platform: platform.name,
        country: platform.country,
        content: aiResult || getTemplate(platform, topCoupon),
        bestTime: platform.bestTime,
      });
      
      await new Promise(r => setTimeout(r, 500)); // 避免API限流
    }
    
    return NextResponse.json({ success: true, data: results });
  }

  // 获取内容日历
  if (action === 'calendar') {
    const today = new Date();
    const calendar = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      calendar.push({
        date: date.toISOString().split('T')[0],
        weekday: ['日', '一', '二', '三', '四', '五', '六'][dayOfWeek],
        platforms: PLATFORMS.filter(p => {
          // 周末发抖音/Instagram/TikTok，工作日发知乎/Reddit
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            return ['douyin', 'tiktok', 'instagram', 'xiaohongshu'].includes(p.id);
          }
          return ['zhihu', 'reddit', 'weibo', 'twitter_us'].includes(p.id);
        }).map(p => ({ name: p.name, icon: p.icon, bestTime: p.bestTime })),
      });
    }
    
    return NextResponse.json({ success: true, data: calendar });
  }

  // 获取团队绩效看板
  if (action === 'dashboard') {
    const clickStats = await db.getClickStats?.() || [];
    const coupons = await db.getCoupons({ limit: 50 });
    
    return NextResponse.json({
      success: true,
      data: {
        totalPosts: 156, // 模拟数据
        totalClicks: (coupons.data as any[]).reduce((sum, c) => sum + (c.clickCount || 0), 0),
        totalConversions: (coupons.data as any[]).reduce((sum, c) => sum + (c.useCount || 0), 0),
        topPlatforms: [
          { name: '小红书', clicks: 2340, conversions: 187, rate: '8.0%' },
          { name: 'Reddit', clicks: 1890, conversions: 156, rate: '8.3%' },
          { name: '知乎', clicks: 1560, conversions: 98, rate: '6.3%' },
          { name: 'TikTok', clicks: 3200, conversions: 201, rate: '6.3%' },
        ],
        weeklyTrend: [
          { day: '周一', posts: 12, clicks: 890 },
          { day: '周二', posts: 15, clicks: 1200 },
          { day: '周三', posts: 10, clicks: 780 },
          { day: '周四', posts: 18, clicks: 1560 },
          { day: '周五', posts: 14, clicks: 1100 },
          { day: '周六', posts: 20, clicks: 2100 },
          { day: '周日', posts: 22, clicks: 2400 },
        ],
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

function buildPrompt(platform: any, store: string, coupons: any[], storeNames: string): string {
  const coupon = coupons[0] || {};
  const couponInfo = coupon ? `${coupon.title || ''} - ${coupon.discount || ''} ${coupon.code ? `(码:${coupon.code})` : ''}` : '';
  
  const prompts: Record<string, string> = {
    'zh': `你是一个真实的海淘用户，请用${platform.lang === 'zh' ? '中文' : platform.lang}写一篇${platform.name}种草内容。

要求：
- 像真的在分享自己的购物经历，不是广告
- 有具体商品和价格
- 自然提到找到了优惠码/折扣
- ${platform.style}
- 150-200字
- 可以自然提到在"快乐省省"找到优惠码

当前优惠：${couponInfo}
商家：${storeNames}`,

    'en': `You are a real shopper sharing your savings experience on ${platform.name}. Write an authentic post in English.

Requirements:
- Sound like a real person sharing, not an ad
- Include specific products and prices
- Mention finding a coupon code naturally
- ${platform.style}
- 100-150 words
- You can mention finding codes on "HappySave" coupon site

Current deals: ${couponInfo}
Stores: ${storeNames}`,

    'ja': `あなたは実際の買い物客です。${platform.name}で節約体験を日本語でシェアしてください。

要件：
- 本物の人のように書いてください（広告ではなく）
- 具体的な商品と価格を含めてください
- クーポンコードを自然に見つけたことを書いてください
- ${platform.style}
- 150-200文字
- "HappySave"でクーポンを見つけたことを自然に言及できます

現在の取引：${couponInfo}
ストア：${storeNames}`,

    'ko': `당신은 실제 쇼핑객입니다. ${platform.name}에서 절약 경험을 한국어로 공유해주세요.

요구사항:
- 광고가 아닌 진짜 사람처럼 작성
- 구체적인 상품과 가격 포함
- 쿠폰 코드를 자연스럽게 찾은 것을 언급
- ${platform.style}
- 150-200자
- "HappySave"에서 쿠폰을 찾았다고 자연스럽게 언급 가능

현재 deals: ${couponInfo}
Stores: ${storeNames}`,
  };

  return prompts[platform.lang] || prompts['en'];
}

function getTemplate(platform: any, coupon: any): string {
  const discount = coupon?.discount || '20% off';
  const store = coupon?.storeName || 'Nike';
  
  const templates: Record<string, string> = {
    'xiaohongshu': `最近在${store}买了几件好物，发现一个超棒的省钱方法💰\n\n在快乐省省找到了${store}的优惠码，${discount}！省下来的钱又能买一件了😂\n\n#海淘 #省钱攻略 #${store}`,
    'zhihu': `作为海淘老玩家，分享几个实用省钱技巧：\n\n1. 善用优惠码聚合网站\n2. 把握促销时间\n3. 注意汇率和运费\n\n现在${store}正在做${discount}活动。`,
    'reddit': `Found a great deal on ${store} - ${discount}! Been using HappySave to find verified coupon codes. Saved about $50 on my last order. Thought I'd share for anyone looking for deals.`,
    'tiktok': `POV: You just saved ${discount} on ${store} 🤯 Found this code on HappySave and it actually worked! Link in bio for the code 🔥`,
  };
  
  return templates[platform.id] || templates['reddit'];
}

function getTips(platformId: string): string[] {
  const tips: Record<string, string[]> = {
    'xiaohongshu': ['配图要生活化', '第一条评论放优惠码', '晚上8-10点发'],
    'zhihu': ['回答先亮观点', '多用数据对比', '文末自然带出'],
    'reddit': ['遵守subreddit规则', '不要过度推广', '用真实评论历史'],
    'tiktok': ['前3秒抓人', '口播有情绪', '评论区置顶信息'],
    'twitter_us': ['简洁有力', '带话题标签', '配图增加点击率'],
  };
  return tips[platformId] || ['内容真实自然', '互动回复很重要'];
}

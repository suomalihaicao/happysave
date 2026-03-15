// 营销助手API - 真实种草内容生成
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

export async function GET() {
  return NextResponse.json({
    success: true,
    types: [
      { id: 'xiaohongshu', name: '小红书种草', icon: '📕', desc: '真实体验分享，带购物截图感' },
      { id: 'zhihu', name: '知乎攻略', icon: '📝', desc: '深度省钱攻略，专业分析' },
      { id: 'weibo', name: '微博日常', icon: '🔥', desc: '日常分享，像在跟朋友聊天' },
      { id: 'douyin', name: '抖音脚本', icon: '🎬', desc: '短视频口播脚本' },
      { id: 'wechat', name: '朋友圈', icon: '💬', desc: '自然的生活分享' },
      { id: 'bilibili', name: 'B站专栏', icon: '📺', desc: '海淘经验长文' },
    ],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // 获取当前最热门的优惠码
  const coupons = await db.getCoupons({ limit: 50 });
  const stores = await db.getStores({ active: true, limit: 20 });
  
  const topCoupons = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)).slice(0, 8);
  const storeList = (stores.data as any[]).map(s => s.name).join(', ');

  // 生成种草内容
  if (action === 'generate') {
    const platform = body.platform || 'xiaohongshu';
    const storeName = body.store || topCoupons[0]?.storeName || 'Nike';
    const coupon = topCoupons.find(c => c.storeName === storeName) || topCoupons[0];
    
    const platformPrompts: Record<string, string> = {
      xiaohongshu: `你是一个热爱海淘省钱的真实用户。请写一篇小红书种草笔记，分享你在${storeName}购物省钱的真实体验。

要求：
- 像真的在分享自己的购物经历，不要像广告
- 有具体的商品名称和价格（编一个合理的）
- 提到发现了优惠码/折扣信息
- 口语化，带emoji，150-200字
- 可以提一下是在"快乐省省"这个网站找到的优惠码，但要自然带过
- 标签：#海淘 #省钱攻略 #${storeName}
- 不要用"亲测""强烈推荐"等广告词

优惠码信息：${coupon?.title || '新用户折扣'} - ${coupon?.discount || '8折'}
${coupon?.code ? `优惠码：${coupon.code}` : ''}`,

      zhihu: `你是一个海淘省钱达人。请写一篇知乎回答，回答"如何在海外购物时省钱？"

要求：
- 专业但不枯燥，像一个有经验的人在分享
- 有具体数据（汇率、运费对比、折扣力度）
- 分享2-3个真实可用的省钱技巧
- 提到使用优惠码聚合网站（如快乐省省）是一个好方法
- 800字左右
- 可以推荐几个海淘热门商家：${storeList}
- 不要像广告，要有干货

当前可用优惠码：${topCoupons.slice(0, 3).map(c => `${c.storeName || '商家'}: ${c.discount}`).join('、')}`,

      weibo: `你是一个喜欢分享省钱技巧的人。请写3条微博，像在跟朋友聊天一样分享海淘优惠。

要求：
- 每条140字以内
- 像日常分享，不像广告
- 可以用"刚发现""姐妹们""救命"这种口语
- 带话题标签
- 偶尔提到"快乐省省"这个网站找优惠码

当前热门优惠：${topCoupons.slice(0, 3).map(c => `${c.storeName}: ${c.discount}`).join('、')}`,

      douyin: `请写一个30秒抖音口播脚本，主题是"海淘省钱小技巧"。

要求：
- 开头要抓人（3秒内）
- 口语化，像在跟朋友说话
- 有一个具体的省钱案例
- 结尾引导关注
- 150字左右
- 可以提到找优惠码的网站`,

      wechat: `请写3条朋友圈文案，看起来像一个普通人在分享自己海淘省钱的日常。

要求：
- 每条50-80字
- 非常自然，像真的在发朋友圈
- 可以带一点小得意
- 不要任何广告感
- 偶尔提到一个省钱小工具/网站
- 可以配图描述（比如：新买的xx到了！）`,

      bilibili: `请写一篇B站专栏文章，标题是"2026海淘省钱全攻略"。

要求：
- 面向年轻用户，语气轻松
- 包含：海淘平台对比、运费计算、关税知识、优惠码获取渠道
- 2000字左右
- 可以推荐几个常用的优惠码聚合网站
- 有干货，不要全是广告`,
    };

    const prompt = platformPrompts[platform] || platformPrompts.xiaohongshu;
    
    const aiResult = await callAI(prompt);
    
    if (aiResult) {
      return NextResponse.json({
        success: true,
        data: {
          platform,
          content: aiResult,
          tips: getPostingTips(platform),
        },
      });
    }

    // 没有AI Key，用模板生成
    const templates = getTemplate(platform, storeName, coupon);
    return NextResponse.json({
      success: true,
      data: {
        platform,
        content: templates,
        tips: getPostingTips(platform),
        note: 'AI未配置，使用模板生成。配OPENAI_API_KEY后可生成更真实的内容',
      },
    });
  }

  // 获取种草灵感
  if (action === 'inspiration') {
    const hotStores = (stores.data as any[]).slice(0, 10);
    return NextResponse.json({
      success: true,
      data: {
        hotTopics: [
          { topic: '黑五提前购', urgency: '高', stores: ['Nike', 'Adidas', 'Apple'] },
          { topic: '学生返校季', urgency: '中', stores: ['Apple', 'Samsung', 'Lenovo'] },
          { topic: '海淘美妆囤货', urgency: '中', stores: ['Glossier', 'Sephora', 'MAC'] },
          { topic: '主机/VPN优惠', urgency: '低', stores: ['Bluehost', 'HostGator'] },
          { topic: 'AI工具省钱', urgency: '高', stores: ['ChatGPT Plus', 'Midjourney', 'Notion'] },
        ],
        bestTime: {
          xiaohongshu: '晚上8-10点',
          zhihu: '中午12-1点，晚上9-11点',
          weibo: '早上8-9点，晚上10-11点',
          douyin: '晚上7-10点',
        },
        stores: hotStores.map(s => ({ name: s.name, category: s.categoryZh })),
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

function getPostingTips(platform: string): string[] {
  const tips: Record<string, string[]> = {
    xiaohongshu: [
      '配图要像自己拍的，不要用官方图',
      '第一条评论放优惠码，方便复制',
      '发布时间：晚上8-10点流量最大',
      '回复评论要积极，提高笔记权重',
    ],
    zhihu: [
      '回答要先亮观点，再展开',
      '多用数据和对比，增加可信度',
      '可以在文末自然带出工具推荐',
      '回答热门问题获得更多曝光',
    ],
    weibo: [
      '短平快，像日常聊天',
      '带2-3个话题标签增加曝光',
      '可以@几个博主增加互动',
      '转发抽奖效果好',
    ],
    douyin: [
      '前3秒必须抓人',
      '口播要有情绪起伏',
      '字幕和背景音乐不能少',
      '评论区置顶优惠信息',
    ],
    wechat: [
      '配图要生活化',
      '不要每天都发，隔几天发一次',
      '评论区可以回复"私你"引导私聊',
    ],
    bilibili: [
      '标题要有数字（如"5个省钱技巧"）',
      '内容要有干货，B站用户不喜欢硬广',
      '可以做成图文或视频',
    ],
  };
  return tips[platform] || tips.xiaohongshu;
}

function getTemplate(platform: string, store: string, coupon: any): string {
  const discount = coupon?.discount || '8折';
  const code = coupon?.code || '';
  
  if (platform === 'xiaohongshu') {
    return `最近入手了${store}的几件好物，本来以为要花不少钱，结果发现一个超棒的省钱方法💰

在快乐省省上找到了${store}的优惠码，${discount}${code ? `，码是${code}` : ''}！

省下来的钱又能买一件了😂 真的太香了

姐妹们海淘前记得先查一下优惠码，能省不少～

#海淘 #省钱攻略 #${store}`;
  }
  
  if (platform === 'zhihu') {
    return `作为5年海淘老玩家，分享几个真正实用的省钱技巧：

1. 善用优惠码聚合网站
很多人不知道，海外商家的优惠码其实都有专门的聚合网站。我常用的是快乐省省，覆盖了${store}等主流商家，优惠码都是验证过的。

2. 把握促销时间
黑五、网一、返校季、圣诞是全年最低价。现在${store}正在做${discount}活动。

3. 注意汇率和运费
有时候商品折扣不大，但运费能省很多。`;

  }
  
  return `刚在${store}买了点东西，发现现在有${discount}的优惠${code ? `，码${code}` : ''}，分享给大家～`;
}

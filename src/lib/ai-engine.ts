// AI Engine - 自动运营核心
// 调用 OpenAI 兼容 API 做内容生成和优惠码推荐

const AI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
const AI_API_KEY = process.env.OPENAI_API_KEY || '';
const AI_MODEL = process.env.OPENAI_MODEL || 'openrouter/auto';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function callAI(messages: AIMessage[], temperature = 0.7): Promise<string> {
  if (!AI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not set, AI features disabled');
    return '';
  }

  try {
    const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      console.error('AI API error:', resp.status, await resp.text());
      return '';
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    console.error('AI call failed:', e);
    return '';
  }
}

// ============================================================
// AI 功能
// ============================================================

export const ai = {
  /**
   * 生成商家 SEO 文章
   */
  async generateStoreArticle(storeName: string, category: string, coupons: string[]): Promise<{
    title: string;
    content: string;
    metaDesc: string;
    keywords: string;
  }> {
    const prompt = `为优惠券导购网站写一篇关于 ${storeName} 的SEO文章。

商家分类：${category}
可用优惠：${coupons.join(', ')}

要求：
1. 标题包含品牌名+优惠/省钱关键词
2. 文章 800-1200 字
3. 包含品牌介绍、省钱技巧、优惠使用指南
4. 自然融入关键词
5. 适合手机阅读，分段清晰

输出 JSON 格式：
{"title": "标题", "content": "HTML正文", "metaDesc": "SEO描述(160字以内)", "keywords": "关键词1,关键词2"}`;

    const result = await callAI([
      { role: 'system', content: '你是 SEO 内容创作专家，擅长写优惠券导购文章。' },
      { role: 'user', content: prompt },
    ], 0.8);

    if (!result) return { title: '', content: '', metaDesc: '', keywords: '' };

    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { title: `${storeName} 优惠码 & 省钱攻略`, content: result, metaDesc: '', keywords: storeName };
    }
  },

  /**
   * AI 推荐新商家和优惠码
   */
  async suggestNewCoupons(existingStores: string[], category?: string): Promise<{
    suggestions: Array<{
      storeName: string;
      storeUrl: string;
      couponTitle: string;
      couponCode: string;
      discount: string;
      reason: string;
    }>;
  }> {
    const prompt = `你是优惠券平台运营专家。当前已有商家：${existingStores.join(', ')}
${category ? `重点关注分类：${category}` : ''}

推荐 5 个值得添加的热门商家和优惠码（全球知名品牌，有真实优惠活动的）。

输出 JSON：
{"suggestions": [{"storeName": "品牌名", "storeUrl": "官网URL", "couponTitle": "优惠标题", "couponCode": "优惠码", "discount": "折扣力度", "reason": "推荐理由"}]}`;

    const result = await callAI([
      { role: 'system', content: '你是全球优惠券市场分析师，了解各大品牌的促销策略。' },
      { role: 'user', content: prompt },
    ], 0.6);

    if (!result) return { suggestions: [] };

    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { suggestions: [] };
    }
  },

  /**
   * AI 分析优惠码有效性
   */
  async analyzeCoupon(couponCode: string, storeName: string): Promise<{
    isValid: boolean;
    confidence: number;
    notes: string;
  }> {
    const result = await callAI([
      { role: 'system', content: '你是一个优惠码验证专家。根据优惠码格式和品牌模式分析其有效性。' },
      { role: 'user', content: `分析 ${storeName} 的优惠码 "${couponCode}" 是否看起来有效。考虑：优惠码格式、品牌命名习惯、常见模式。输出 JSON：{"isValid": true/false, "confidence": 0.0-1.0, "notes": "分析说明"}` },
    ], 0.3);

    if (!result) return { isValid: true, confidence: 0.5, notes: '无法分析' };

    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { isValid: true, confidence: 0.5, notes: result };
    }
  },

  /**
   * AI 生成优惠码描述（多语言）
   */
  async translateCoupon(title: string, description: string): Promise<{
    titleZh: string;
    descriptionZh: string;
  }> {
    const result = await callAI([
      { role: 'system', content: '你是专业的翻译专家，擅长将英文优惠信息翻译成自然流畅的中文。' },
      { role: 'user', content: `翻译以下优惠信息为中文：\n标题：${title}\n描述：${description}\n\n输出 JSON：{"titleZh": "中文标题", "descriptionZh": "中文描述"}` },
    ], 0.5);

    if (!result) return { titleZh: title, descriptionZh: description };

    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { titleZh: title, descriptionZh: description };
    }
  },

  /**
   * AI 生成每日运营报告
   */
  async generateDailyReport(stats: {
    totalClicks: number;
    newCoupons: number;
    topStores: Array<{ name: string; clicks: number }>;
    conversions: number;
  }): Promise<string> {
    const prompt = `根据今日数据生成运营简报：

总点击：${stats.totalClicks}
新增优惠码：${stats.newCoupons}
转化数：${stats.conversions}
热门商家：${stats.topStores.map(s => `${s.name}(${s.clicks}次)`).join(', ')}

请生成一份简洁的运营洞察，包含：
1. 今日亮点（1-2句）
2. 需要关注的问题
3. 建议行动

用中文回复，简洁有力。`;

    return await callAI([
      { role: 'system', content: '你是数据分析师，擅长从运营数据中提取洞察。' },
      { role: 'user', content: prompt },
    ], 0.5);
  },

  /**
   * AI 生成社交媒体推广文案
   */
  async generateSocialPost(storeName: string, discount: string, couponCode?: string): Promise<{
    weibo: string;
    wechat: string;
    twitter: string;
  }> {
    const codeText = couponCode ? `优惠码：${couponCode}` : '直达链接';
    const result = await callAI([
      { role: 'system', content: '你是社交媒体营销专家，擅长写吸引人的推广文案。' },
      { role: 'user', content: `为 ${storeName} 的 ${discount} 优惠写推广文案。${codeText}\n\n输出 JSON：{"weibo": "微博文案(140字内)", "wechat": "微信文案", "twitter": "English Twitter post"}` },
    ], 0.8);

    if (!result) return { weibo: '', wechat: '', twitter: '' };

    try {
      return JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { weibo: result, wechat: result, twitter: '' };
    }
  },
};

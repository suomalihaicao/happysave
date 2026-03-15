// 智能模板引擎 - 按优惠券批量生成多语言多平台内容
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============ 模板库 ============
const TEMPLATES = {
  // 小红书模板
  xiaohongshu: {
    zh: [
      { name: '省钱分享', tpl: '刚在{store}买了{product}，原价{original_price}，用快乐省省找到的码{code}，直接省了{discount}💰 到手才{final_price}！太香了～ #{store} #海淘省钱' },
      { name: '开箱种草', tpl: '姐妹们！{store}现在有{discount}的优惠！用码{code}下单了{product}，比原价便宜了好多😍 这个价格真的很可以，冲！#海淘优惠码 #{store}' },
      { name: '省钱攻略', tpl: '分享一个{store}省钱小技巧💡 去快乐省省搜{store}，能找到最新的优惠码。这次用{code}省了{discount}，{product}到手{final_price}～ #省钱攻略' },
    ],
  },
  // 知乎模板
  zhihu: {
    zh: [
      { name: '攻略回答', tpl: '作为海淘老玩家，分享一下{store}的省钱方法：\n\n1. 当前{store}有{discount}优惠活动\n2. 使用优惠码{code}可额外折扣\n3. {product}原价{original_price}，实付{final_price}\n\n推荐通过优惠码聚合平台查找最新码，能省不少。' },
      { name: '经验分享', tpl: '{store}海淘攻略（{year}年更新）\n\n当前最优方案：\n- 优惠码：{code}\n- 折扣力度：{discount}\n- 推荐商品：{product}\n- 到手价：{final_price}（原价{original_price}）\n\n建议在黑五/网一期间叠加使用，折扣更大。' },
    ],
  },
  // 微博模板
  weibo: {
    zh: [
      { name: '日常分享', tpl: '救命！{store}现在有{discount}！码{code}，{product}直接省了{saved_amount}💰 姐妹们快冲！#海淘优惠码# #{store}折扣#' },
      { name: '快讯', tpl: '📢 {store}优惠更新：{discount}，码{code}，{product}到手{final_price}！限时活动，先到先得 #{store}海淘#' },
    ],
  },
  // 抖音脚本
  douyin: {
    zh: [
      { name: '口播脚本', tpl: '【开头】你知道{store}怎么买最便宜吗？\n【中间】我刚用{code}这个码，{product}原价{original_price}，现在只要{final_price}，省了{discount}！\n【结尾】关注我，每天分享海淘省钱技巧！' },
    ],
  },
  // English templates
  xiaohongshu_en: {
    en: [
      { name: 'Deal Share', tpl: 'Just scored {product} from {store} for {final_price}! 🎉 Used code {code} and saved {discount}. Original price was {original_price}. Check HappySave for more codes! #deal #{store} #shopping' },
      { name: 'Haul Post', tpl: 'Shopping haul from {store} 🛍️ Got {product} - {discount} off with code {code}! Paid {final_price} instead of {original_price}. Link in bio! #haul #deals' },
    ],
  },
  reddit: {
    en: [
      { name: 'Deal Post', tpl: '[Deal] {store} - {discount} with code {code}\n\n{product} now {final_price} (was {original_price})\n\nFound via HappySave coupon aggregator. Code verified working as of today.' },
      { name: 'Casual Share', tpl: 'PSA: {store} has {discount} right now. Code {code} worked for me on {product}. Saved {saved_amount}. Thought I\'d share for anyone looking for deals.' },
    ],
  },
  tiktok: {
    en: [
      { name: 'Short Video', tpl: 'POV: You just saved {discount} on {store} 🤯 {product} was {original_price}, paid {final_price}! Code {code} via HappySave 🔥 #fyp #deals #shopping' },
      { name: 'Haul Reveal', tpl: 'My {store} haul just arrived! 📦 {product} for {final_price} (was {original_price}) using code {code}. {discount} off! #shoppinghaul #dealalert' },
    ],
  },
  // 日本語テンプレート
  twitter_jp: {
    ja: [
      { name: 'お得情報', tpl: '{store}で{discount}オフ！コード{code}で{product}が{original_price}→{final_price}に😍 HappySaveで見つけました #セール #お得情報' },
    ],
  },
  note_jp: {
    ja: [
      { name: '体験談', tpl: '{store}でお得にお買い物しました🛍️\n\n商品：{product}\n元価格：{original_price}\nクーポンコード：{code}\n割引：{discount}\n実価格：{final_price}\n\nHappySaveというクーポンサイトでコードを見つけて、無事に適用できました！' },
    ],
  },
  // 한국어 템플릿
  naver_kr: {
    ko: [
      { name: '쇼핑리뷰', tpl: '{store}에서 {product} 구매 성공! 🎉\n\n코드: {code}\n할인: {discount}\n원가: {original_price}\n최종가: {final_price}\n\nHappySave에서 쿠폰 찾아서 적용했어요. 진짜 할인되네요!' },
    ],
  },
};

// 图片模板提示词（用于生成配图说明）
const IMAGE_TEMPLATES = {
  xiaohongshu: [
    '第1张：商品实拍图（自然光，生活场景）',
    '第2张：订单截图（显示原价和折扣价）',
    '第3张：优惠码使用界面截图',
    '第4张：商品细节/开箱图',
    '第5张：价格对比图（原价vs折后价）',
  ],
  tiktok: [
    '镜头1：手持商品开箱（3秒）',
    '镜头2：展示订单页面和优惠码（5秒）',
    '镜头3：商品使用/穿搭展示（10秒）',
    '镜头4：价格对比字幕（3秒）',
    '镜头5：结尾引导关注（2秒）',
  ],
  instagram: [
    '图1：商品精美摆拍',
    '图2：使用场景图',
    '图3：价格信息卡',
  ],
  default: ['商品图', '价格截图', '优惠码截图'],
};

export async function GET() {
  return NextResponse.json({
    success: true,
    platforms: Object.keys(TEMPLATES),
    imageTemplates: IMAGE_TEMPLATES,
    languages: ['zh', 'en', 'ja', 'ko'],
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // === 单个优惠券生成所有平台内容 ===
  if (action === 'generate_all') {
    const couponId = body.couponId;
    const coupons = await db.getCoupons({ limit: 100 });
    const coupon = couponId 
      ? (coupons.data as any[]).find(c => c.id === couponId)
      : (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
    
    if (!coupon) return NextResponse.json({ success: false, message: 'Coupon not found' }, { status: 404 });

    const vars = buildVars(coupon);
    const results: any[] = [];

    // 遍历所有平台模板
    for (const [platformKey, langs] of Object.entries(TEMPLATES)) {
      for (const [lang, templates] of Object.entries(langs)) {
        for (const tpl of templates) {
          const content = fillTemplate(tpl.tpl, vars);
          const platform = platformKey.replace(`_${lang}`, '');
          
          results.push({
            platform,
            platformKey,
            language: lang,
            templateName: tpl.name,
            content,
            imageGuide: IMAGE_TEMPLATES[platform as keyof typeof IMAGE_TEMPLATES] || IMAGE_TEMPLATES.default,
            vars,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        coupon: { id: coupon.id, title: coupon.title, store: coupon.storeName, discount: coupon.discount, code: coupon.code },
        totalGenerated: results.length,
        contents: results,
      },
    });
  }

  // === 批量：所有优惠券 × 所有模板 ===
  if (action === 'batch_all') {
    const coupons = await db.getCoupons({ limit: body.limit || 20 });
    const couponList = (coupons.data as any[])
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, body.limit || 10);
    
    const allResults: any[] = [];
    
    for (const coupon of couponList) {
      const vars = buildVars(coupon);
      
      for (const [platformKey, langs] of Object.entries(TEMPLATES)) {
        for (const [lang, templates] of Object.entries(langs)) {
          for (const tpl of templates) {
            const content = fillTemplate(tpl.tpl, vars);
            const platform = platformKey.replace(`_${lang}`, '');
            
            allResults.push({
              couponId: coupon.id,
              couponTitle: coupon.title,
              store: coupon.storeName,
              platform,
              language: lang,
              templateName: tpl.name,
              content,
            });
          }
        }
      }
    }

    // 按平台分组统计
    const summary: Record<string, number> = {};
    for (const r of allResults) {
      summary[r.platform] = (summary[r.platform] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        couponsProcessed: couponList.length,
        totalGenerated: allResults.length,
        byPlatform: summary,
        contents: allResults,
      },
    });
  }

  // === 按平台获取内容 ===
  if (action === 'by_platform') {
    const platform = body.platform || 'xiaohongshu';
    const lang = body.lang || 'zh';
    const limit = body.limit || 5;
    
    const coupons = await db.getCoupons({ limit });
    const couponList = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
    
    const platformKey = lang === 'zh' ? platform : `${platform}_${lang}`;
    const templates = (TEMPLATES as any)[platformKey]?.[lang] || (TEMPLATES as any)[platform]?.[lang] || [];
    
    const results: any[] = [];
    for (const coupon of couponList) {
      const vars = buildVars(coupon);
      for (const tpl of templates) {
        results.push({
          coupon: coupon.title,
          store: coupon.storeName,
          templateName: tpl.name,
          content: fillTemplate(tpl.tpl, vars),
          imageGuide: IMAGE_TEMPLATES[platform as keyof typeof IMAGE_TEMPLATES] || IMAGE_TEMPLATES.default,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { platform, language: lang, total: results.length, contents: results },
    });
  }

  // === 获取图片模板 ===
  if (action === 'image_templates') {
    return NextResponse.json({ success: true, data: IMAGE_TEMPLATES });
  }

  // === 自定义模板 ===
  if (action === 'custom_template') {
    const tpl = body.template; // e.g., "{store}有{discount}！码{code}"
    const couponId = body.couponId;
    
    const coupons = await db.getCoupons({ limit: 50 });
    const coupon = couponId 
      ? (coupons.data as any[]).find(c => c.id === couponId)
      : (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
    
    if (!coupon) return NextResponse.json({ success: false, message: 'No coupon found' }, { status: 404 });
    
    const vars = buildVars(coupon);
    const content = fillTemplate(tpl, vars);
    const usedVars = tpl.match(/\{(\w+)\}/g)?.map((v: string) => v.slice(1, -1)) || [];
    
    return NextResponse.json({
      success: true,
      data: {
        template: tpl,
        content,
        usedVariables: usedVars,
        availableVariables: Object.keys(vars),
        coupon: { title: coupon.title, store: coupon.storeName },
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

// 构建变量字典
function buildVars(coupon: any): Record<string, string> {
  const originalPrice = Math.floor(Math.random() * 200) + 50;
  const discountPercent = parseInt(coupon.discount) || 20;
  const finalPrice = Math.floor(originalPrice * (1 - discountPercent / 100));
  const savedAmount = originalPrice - finalPrice;
  
  return {
    store: coupon.storeName || 'Store',
    product: coupon.title || 'Product',
    original_price: `$${originalPrice}`,
    discount: coupon.discount || '20%',
    final_price: `$${finalPrice}`,
    saved_amount: `$${savedAmount}`,
    code: coupon.code || 'SAVE20',
    years: '5',
    year: '2026',
  };
}

// 填充模板
function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  // 检查是否有未替换的变量
  const unreplaced = result.match(/\{\w+\}/g);
  if (unreplaced) {
    console.log('Unreplaced variables:', unreplaced);
  }
  return result;
}

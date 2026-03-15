// 营销内容管理系统 - 模板/排期/复用
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

// 内存存储（生产环境应存TiDB）
let platformAccounts: any[] = [
  { id: 'xhs_main', platform: 'xiaohongshu', name: '小红书主号', url: 'https://www.xiaohongshu.com/user/profile/xxxxx', status: 'active', followers: 0, notes: '主账号' },
  { id: 'zhihu_main', platform: 'zhihu', name: '知乎主号', url: 'https://www.zhihu.com/people/xxxxx', status: 'active', followers: 0, notes: '海淘攻略' },
  { id: 'weibo_main', platform: 'weibo', name: '微博主号', url: 'https://weibo.com/u/xxxxx', status: 'active', followers: 0, notes: '优惠信息' },
  { id: 'reddit_main', platform: 'reddit', name: 'Reddit u/happysave', url: 'https://www.reddit.com/user/happysave', status: 'active', followers: 0, notes: 'r/deals, r/frugal' },
  { id: 'tiktok_main', platform: 'tiktok', name: 'TikTok @happysave', url: 'https://www.tiktok.com/@happysave', status: 'active', followers: 0, notes: 'Shopping hauls' },
];

let contentTemplates: any[] = [
  { id: 'tpl_1', platform: 'xiaohongshu', name: '海淘省钱分享', template: '刚在{store}入手了{product}，原价{original_price}，用快乐省省找到的优惠码省了{discount}💰 到手才{final_price}！#海淘 #{store} #省钱攻略', variables: ['store', 'product', 'original_price', 'discount', 'final_price'], status: 'active', useCount: 0 },
  { id: 'tpl_2', platform: 'zhihu', name: '海淘攻略回答', template: '作为{years}年海淘老玩家，分享几个真正实用的省钱技巧：\n\n1. 善用优惠码聚合网站（如快乐省省）\n2. 把握促销时间：黑五/网一/返校季\n3. 注意汇率和运费\n\n现在{store}正在做{discount}活动，可以去看看。', variables: ['years', 'store', 'discount'], status: 'active', useCount: 0 },
  { id: 'tpl_3', platform: 'reddit', name: 'Deal Share', template: 'Found a great deal on {store} - {discount}! Been using HappySave to find verified coupon codes. Saved ${saved_amount} on my last order. Thought I\'d share for anyone looking for deals. Code: {code}', variables: ['store', 'discount', 'saved_amount', 'code'], status: 'active', useCount: 0 },
  { id: 'tpl_4', platform: 'tiktok', name: 'Shopping Haul', template: 'POV: You just saved {discount} on {store} 🤯 Found this code on HappySave and it actually worked! {product} was ${original_price}, paid ${final_price} 🔥 #deal #shopping #coupon', variables: ['store', 'discount', 'product', 'original_price', 'final_price'], status: 'active', useCount: 0 },
  { id: 'tpl_5', platform: 'weibo', name: '日常分享', template: '救命！{store}现在有{discount}！在快乐省省找到的码{code}，{product}直接省了{saved_amount}💰 姐妹们冲！#海淘优惠码# #{store}折扣#', variables: ['store', 'discount', 'code', 'product', 'saved_amount'], status: 'active', useCount: 0 },
];

let publishSchedule: any[] = [
  { id: 'sch_1', templateId: 'tpl_1', platform: 'xiaohongshu', accountId: 'xhs_main', frequency: 'daily', time: '20:00', status: 'active', nextRun: '2026-03-16T20:00:00+08:00', lastRun: null },
  { id: 'sch_2', templateId: 'tpl_2', platform: 'zhihu', accountId: 'zhihu_main', frequency: 'daily', time: '12:00', status: 'active', nextRun: '2026-03-16T12:00:00+08:00', lastRun: null },
  { id: 'sch_3', templateId: 'tpl_3', platform: 'reddit', accountId: 'reddit_main', frequency: 'daily', time: '09:00', status: 'active', nextRun: '2026-03-16T09:00:00-05:00', lastRun: null },
  { id: 'sch_4', templateId: 'tpl_4', platform: 'tiktok', accountId: 'tiktok_main', frequency: 'every_2_days', time: '19:00', status: 'active', nextRun: '2026-03-16T19:00:00-05:00', lastRun: null },
  { id: 'sch_5', templateId: 'tpl_5', platform: 'weibo', accountId: 'weibo_main', frequency: 'daily', time: '08:00', status: 'active', nextRun: '2026-03-16T08:00:00+08:00', lastRun: null },
];

let contentLibrary: any[] = []; // 已生成的内容存档

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      accounts: platformAccounts,
      templates: contentTemplates,
      schedules: publishSchedule,
      library: contentLibrary.slice(-20), // 最近20条
      stats: {
        totalAccounts: platformAccounts.length,
        totalTemplates: contentTemplates.length,
        activeSchedules: publishSchedule.filter(s => s.status === 'active').length,
        totalGenerated: contentLibrary.length,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  // === 账号管理 ===
  if (action === 'add_account') {
    const account = {
      id: `acc_${Date.now()}`,
      platform: body.platform,
      name: body.name,
      url: body.url,
      status: 'active',
      followers: 0,
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
    };
    platformAccounts.push(account);
    return NextResponse.json({ success: true, data: account });
  }

  if (action === 'update_account') {
    const idx = platformAccounts.findIndex(a => a.id === body.id);
    if (idx >= 0) {
      platformAccounts[idx] = { ...platformAccounts[idx], ...body };
      return NextResponse.json({ success: true, data: platformAccounts[idx] });
    }
    return NextResponse.json({ success: false, message: 'Account not found' }, { status: 404 });
  }

  if (action === 'delete_account') {
    platformAccounts = platformAccounts.filter(a => a.id !== body.id);
    return NextResponse.json({ success: true });
  }

  // === 模板管理 ===
  if (action === 'add_template') {
    const tpl = {
      id: `tpl_${Date.now()}`,
      platform: body.platform,
      name: body.name,
      template: body.template,
      variables: body.template.match(/\{(\w+)\}/g)?.map((v: string) => v.slice(1, -1)) || [],
      status: 'active',
      useCount: 0,
      createdAt: new Date().toISOString(),
    };
    contentTemplates.push(tpl);
    return NextResponse.json({ success: true, data: tpl });
  }

  if (action === 'update_template') {
    const idx = contentTemplates.findIndex(t => t.id === body.id);
    if (idx >= 0) {
      contentTemplates[idx] = { ...contentTemplates[idx], ...body };
      return NextResponse.json({ success: true, data: contentTemplates[idx] });
    }
    return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 });
  }

  if (action === 'delete_template') {
    contentTemplates = contentTemplates.filter(t => t.id !== body.id);
    return NextResponse.json({ success: true });
  }

  // === 用模板生成内容 ===
  if (action === 'generate_from_template') {
    const tpl = contentTemplates.find(t => t.id === body.templateId);
    if (!tpl) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 });
    
    // 获取热门优惠码作为变量填充
    const coupons = await db.getCoupons({ limit: 10 });
    const topCoupon = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
    
    const vars: Record<string, string> = {
      store: topCoupon?.storeName || 'Nike',
      product: topCoupon?.title || 'Air Max 90',
      original_price: '$129',
      discount: topCoupon?.discount || '20%',
      final_price: '$99',
      saved_amount: '$30',
      code: topCoupon?.code || 'SAVE20',
      years: '5',
    };
    
    // 替换变量
    let content = tpl.template;
    for (const [key, value] of Object.entries(vars)) {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    
    // 如果有AI，可以润色
    const aiEnhanced = body.useAI ? await callAI(`请润色以下内容，让它更自然更像真人分享：\n\n${content}`) : null;
    
    const result = {
      id: `content_${Date.now()}`,
      templateId: tpl.id,
      platform: tpl.platform,
      content: aiEnhanced || content,
      variables: vars,
      aiEnhanced: !!aiEnhanced,
      createdAt: new Date().toISOString(),
    };
    
    contentLibrary.push(result);
    tpl.useCount++;
    
    return NextResponse.json({ success: true, data: result });
  }

  // === 批量生成所有模板 ===
  if (action === 'batch_generate') {
    const results = [];
    for (const tpl of contentTemplates.filter(t => t.status === 'active')) {
      const coupons = await db.getCoupons({ limit: 5 });
      const topCoupon = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
      
      const vars: Record<string, string> = {
        store: topCoupon?.storeName || 'Nike',
        product: topCoupon?.title || 'Air Max 90',
        original_price: '$129',
        discount: topCoupon?.discount || '20%',
        final_price: '$99',
        saved_amount: '$30',
        code: topCoupon?.code || 'SAVE20',
        years: '5',
      };
      
      let content = tpl.template;
      for (const [key, value] of Object.entries(vars)) {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      
      results.push({
        id: `content_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        templateId: tpl.id,
        templateName: tpl.name,
        platform: tpl.platform,
        content,
        variables: vars,
        createdAt: new Date().toISOString(),
      });
      
      tpl.useCount++;
    }
    
    contentLibrary.push(...results);
    
    return NextResponse.json({ success: true, data: results });
  }

  // === 排期管理 ===
  if (action === 'add_schedule') {
    const schedule = {
      id: `sch_${Date.now()}`,
      templateId: body.templateId,
      platform: body.platform,
      accountId: body.accountId,
      frequency: body.frequency || 'daily', // daily, every_2_days, weekly
      time: body.time || '09:00',
      status: 'active',
      nextRun: calculateNextRun(body.frequency || 'daily', body.time || '09:00'),
      lastRun: null,
      createdAt: new Date().toISOString(),
    };
    publishSchedule.push(schedule);
    return NextResponse.json({ success: true, data: schedule });
  }

  if (action === 'toggle_schedule') {
    const idx = publishSchedule.findIndex(s => s.id === body.id);
    if (idx >= 0) {
      publishSchedule[idx].status = publishSchedule[idx].status === 'active' ? 'paused' : 'active';
      return NextResponse.json({ success: true, data: publishSchedule[idx] });
    }
    return NextResponse.json({ success: false, message: 'Schedule not found' }, { status: 404 });
  }

  if (action === 'delete_schedule') {
    publishSchedule = publishSchedule.filter(s => s.id !== body.id);
    return NextResponse.json({ success: true });
  }

  // === 执行排期（cron调用）===
  if (action === 'run_schedules') {
    const now = new Date();
    const dueSchedules = publishSchedule.filter(s => 
      s.status === 'active' && s.nextRun && new Date(s.nextRun) <= now
    );
    
    const results = [];
    for (const schedule of dueSchedules) {
      // 生成内容
      const tpl = contentTemplates.find(t => t.id === schedule.templateId);
      if (!tpl) continue;
      
      const coupons = await db.getCoupons({ limit: 5 });
      const topCoupon = (coupons.data as any[]).sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))[0];
      
      const vars: Record<string, string> = {
        store: topCoupon?.storeName || 'Nike',
        product: topCoupon?.title || 'Deal',
        discount: topCoupon?.discount || '20%',
        code: topCoupon?.code || 'SAVE20',
        saved_amount: '$20',
        original_price: '$99',
        final_price: '$79',
        years: '5',
      };
      
      let content = tpl.template;
      for (const [key, value] of Object.entries(vars)) {
        content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
      
      const account = platformAccounts.find(a => a.id === schedule.accountId);
      
      results.push({
        scheduleId: schedule.id,
        platform: schedule.platform,
        account: account?.name || 'Unknown',
        content,
        nextRun: calculateNextRun(schedule.frequency, schedule.time),
      });
      
      schedule.lastRun = now.toISOString();
      schedule.nextRun = calculateNextRun(schedule.frequency, schedule.time);
      tpl.useCount++;
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        executed: results.length,
        results,
        nextCheck: new Date(now.getTime() + 3600000).toISOString(),
      },
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

function calculateNextRun(frequency: string, time: string): string {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  let next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  
  if (next <= now) {
    if (frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (frequency === 'every_2_days') next.setDate(next.getDate() + 2);
    else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  }
  
  return next.toISOString();
}

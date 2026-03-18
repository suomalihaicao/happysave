// 联盟合作自动邮件系统
// 自动向品牌方发送联盟合作邀请邮件

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ai } from '@/lib/ai-engine';

const CRON_SECRET = process.env.CRON_SECRET || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.AFFILIATE_FROM_EMAIL || 'partnerships@happysave.cn';
const COMPANY_NAME = process.env.COMPANY_NAME || 'HappySave';
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || 'https://www.happysave.cn';

// ============================================================
// 认证
// ============================================================
function isAuthorized(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') !== null;
  const secret = request.nextUrl.searchParams.get('secret');
  const auth = request.headers.get('authorization');
  const isValidSecret = CRON_SECRET && (secret === CRON_SECRET || auth === `Bearer ${CRON_SECRET}`);
  const adminCookie = request.cookies.get('hs_admin')?.value;
  return isVercelCron || !!isValidSecret || !!adminCookie;
}

// ============================================================
// 发送邮件（通过 Resend API）
// ============================================================
async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not set, email not sent');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await resp.json();
    if (resp.ok) {
      return { success: true, messageId: data.id };
    }
    return { success: false, error: data.message || 'Unknown error' };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ============================================================
// 生成合作邮件模板
// ============================================================
function generatePartnershipEmail(storeName: string, storeWebsite: string, category: string): { subject: string; html: string } {
  const subject = `Partnership Proposal - ${COMPANY_NAME} x ${storeName} Affiliate Collaboration`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

<div style="background: linear-gradient(135deg, #ff6b35 0%, #ff8f65 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
  <h1 style="color: white; margin: 0; font-size: 24px;">🤝 Partnership Proposal</h1>
  <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${COMPANY_NAME} x ${storeName}</p>
</div>

<p>Dear ${storeName} Partnership Team,</p>

<p>I hope this email finds you well. My name is Alex from <strong>${COMPANY_NAME}</strong> (<a href="${COMPANY_WEBSITE}">${COMPANY_WEBSITE.replace('https://', '')}</a>), a leading coupon and deals aggregation platform specializing in cross-border e-commerce and global shopping.</p>

<p>We currently feature <strong>${storeName}</strong> on our platform and have been driving quality traffic and conversions for your brand. We'd like to explore a deeper partnership to maximize our collaboration.</p>

<h3>📊 Our Platform Stats:</h3>
<ul>
  <li>Monthly unique visitors: Growing steadily in the ${category} vertical</li>
  <li>Active coupon listings: 500+ from top global brands</li>
  <li>Audience: Deal-seeking shoppers from China and Southeast Asia</li>
  <li>Content: SEO-optimized guides, reviews, and promotional content</li>
</ul>

<h3>🎯 Partnership Proposals:</h3>
<ol>
  <li><strong>Exclusive Coupon Codes</strong> - Unique codes for our audience to track performance</li>
  <li><strong>Higher Commission Rate</strong> - Preferred rates for premium placement</li>
  <li><strong>Featured Placement</strong> - Homepage banner + newsletter inclusion</li>
  <li><strong>Content Collaboration</strong> - Sponsored guides and brand stories</li>
</ol>

<h3>📧 What We Need:</h3>
<ul>
  <li>Affiliate program application link or direct partnership terms</li>
  <li>Exclusive discount codes (if available)</li>
  <li>Brand assets (logo, product images) for content creation</li>
</ul>

<p>We're flexible and open to discussing terms that work for both parties. Could we schedule a quick call to discuss?</p>

<p>Best regards,</p>

<div style="border-left: 3px solid #ff6b35; padding-left: 15px; margin-top: 20px;">
  <p style="margin: 0;"><strong>Alex Chen</strong></p>
  <p style="margin: 0; color: #666;">Partnership Manager</p>
  <p style="margin: 0; color: #666;">${COMPANY_NAME}</p>
  <p style="margin: 0;"><a href="${COMPANY_WEBSITE}">${COMPANY_WEBSITE.replace('https://', '')}</a></p>
  <p style="margin: 0; color: #666;">📧 ${FROM_EMAIL}</p>
</div>

<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
  <p>This email was sent by ${COMPANY_NAME}. If you're not the right person to contact about partnerships, please forward this to the appropriate team member.</p>
</div>

</body>
</html>`;

  return { subject, html };
}

// ============================================================
// 查找品牌联系方式（从已知数据中）
// ============================================================
interface ContactTarget {
  storeName: string;
  storeWebsite: string;
  category: string;
  affiliateUrl: string;
  priority: number;
  contactEmail?: string;
}

async function findContactTargets(): Promise<ContactTarget[]> {
  const stores = await db.getStores({ active: true, limit: 100 });

  // 优先级排序：有联盟链接但还没发过邮件的
  const targets: ContactTarget[] = stores.data
    .filter((s: any) => s.website) // 有官网的
    .map((s: any) => ({
      storeName: s.name,
      storeWebsite: s.website,
      category: s.category || 'General',
      affiliateUrl: s.affiliateUrl || '',
      priority: s.featured ? 10 : 5, // featured商家优先
    }))
    .sort((a: ContactTarget, b: ContactTarget) => b.priority - a.priority);

  return targets;
}

// ============================================================
// 推测品牌联系邮箱
// ============================================================
function guessContactEmails(domain: string): string[] {
  // 常见的联盟/合作联系邮箱格式
  return [
    `partnerships@${domain}`,
    `affiliates@${domain}`,
    `affiliate@${domain}`,
    `partner@${domain}`,
    `marketing@${domain}`,
    `business@${domain}`,
  ];
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

// ============================================================
// 自动发送合作邮件
// ============================================================
async function runAffiliateOutreach(limit: number = 3): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
  details: Array<{ store: string; email: string; status: string }>;
}> {
  const result = { sent: 0, skipped: 0, errors: [] as string[], details: [] as Array<{ store: string; email: string; status: string }> };

  const targets = await findContactTargets();

  // 读取已发送记录（避免重复发送）
  const sentKey = 'affiliate_sent_log';
  let sentLog: Record<string, string> = {};
  try {
    const configs = await db.getAllConfig();
    if (configs[sentKey]) {
      sentLog = JSON.parse(configs[sentKey]);
    }
  } catch { /* 首次运行 */ }

  let count = 0;
  for (const target of targets) {
    if (count >= limit) break;

    // 跳过已发送的
    if (sentLog[target.storeName]) {
      result.skipped++;
      continue;
    }

    const domain = extractDomain(target.storeWebsite);
    if (!domain) {
      result.skipped++;
      continue;
    }

    // 向第一个邮箱发送（partnerships@）
    const email = `partnerships@${domain}`;
    const { subject, html } = generatePartnershipEmail(target.storeName, target.storeWebsite, target.category);

    const sendResult = await sendEmail(email, subject, html);

    if (sendResult.success) {
      sentLog[target.storeName] = new Date().toISOString();
      result.sent++;
      result.details.push({ store: target.storeName, email, status: 'sent' });
    } else {
      result.errors.push(`${target.storeName}: ${sendResult.error}`);
      result.details.push({ store: target.storeName, email, status: `failed: ${sendResult.error}` });
    }

    count++;

    // 避免被标记为垃圾邮件，间隔发送
    await new Promise(r => setTimeout(r, 2000));
  }

  // 保存发送记录
  try {
    await db.setConfig(sentKey, JSON.stringify(sentLog));
  } catch { /* 忽略 */ }

  return result;
}

// ============================================================
// API 路由
// ============================================================
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get('action') || 'list';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '3');

  if (action === 'list') {
    // 列出可联系的品牌
    const targets = await findContactTargets();
    return NextResponse.json({
      success: true,
      targets: targets.slice(0, 20).map(t => ({
        ...t,
        suggestedEmails: guessContactEmails(extractDomain(t.storeWebsite)),
      })),
      total: targets.length,
    });
  }

  if (action === 'send') {
    // 发送合作邮件
    const result = await runAffiliateOutreach(limit);
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  if (action === 'preview') {
    // 预览邮件模板
    const targets = await findContactTargets();
    if (targets.length === 0) {
      return NextResponse.json({ success: false, message: 'No targets found' });
    }
    const preview = generatePartnershipEmail(targets[0].storeName, targets[0].storeWebsite, targets[0].category);
    return NextResponse.json({
      success: true,
      preview,
      target: targets[0],
    });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

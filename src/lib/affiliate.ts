// 联盟数据集成 - ShareASale / CJ / Impact / Awin
// 配置环境变量后自动拉取商家和优惠码数据

import { createHash } from 'crypto';

const AFFILIATE_CONFIG = {
  shareasale: {
    name: 'ShareASale',
    baseUrl: 'https://api.shareasale.com',
    // 需要: SHAREASALE_TOKEN (API Token), SHAREASALE_AFFILIATE_ID
    envToken: 'SHAREASALE_TOKEN',
    envAffId: 'SHAREASALE_AFFILIATE_ID',
    enabled: () => !!(process.env.SHAREASALE_TOKEN),
  },
  cj: {
    name: 'CJ Affiliate',
    baseUrl: 'https://commissions-api.cj.com',
    // 需要: CJ_API_KEY, CJ_PUBLISHER_ID
    envToken: 'CJ_API_KEY',
    envAffId: 'CJ_PUBLISHER_ID',
    enabled: () => !!(process.env.CJ_API_KEY),
  },
  impact: {
    name: 'Impact',
    baseUrl: 'https://api.impact.com',
    // 需要: IMPACT_ACCOUNT_SID, IMPACT_AUTH_TOKEN
    envToken: 'IMPACT_ACCOUNT_SID',
    envSecret: 'IMPACT_AUTH_TOKEN',
    enabled: () => !!(process.env.IMPACT_ACCOUNT_SID && process.env.IMPACT_AUTH_TOKEN),
  },
  awin: {
    name: 'Awin',
    baseUrl: 'https://api.awin.com',
    // 需要: AWIN_API_TOKEN, AWIN_PUBLISHER_ID
    envToken: 'AWIN_API_TOKEN',
    envAffId: 'AWIN_PUBLISHER_ID',
    enabled: () => !!(process.env.AWIN_API_TOKEN),
  },
};

// Affiliate network response types
// (保留供未来联盟API扩展使用)
interface _MerchantRecord {
  source: string;
  merchantId: string;
  name: string;
  website: string;
  category: string;
  commissionRate: string;
  cookieLength?: string;
  affiliateUrl: string;
}

export interface CouponRecord {
  source: string;
  merchantId: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  startDate: string;
  endDate: string;
  affiliateUrl: string;
}

// ===== ShareASale API =====
async function fetchShareASaleMerchants(limit = 50) {
  const token = process.env.SHAREASALE_TOKEN;
  const affId = process.env.SHAREASALE_AFFILIATE_ID;
  if (!token || !affId) return [];

  try {
    // ShareASale Merchant API
    const auth = generateShareASaleAuth(token);
    const res = await fetch(
      `https://api.shareasale.com/x.cfm?merchantstatus=joined&limit=${limit}`,
      {
        headers: {
          'x-ShareASale-Date': auth.date,
          'x-ShareASale-Authentication': auth.hash,
          'x-ShareASale-Version': '2.3',
        },
      }
    );
    if (!res.ok) {
      console.error('ShareASale API error:', res.status);
      return [];
    }
    const data = await res.json();
    return (data.merchants || []).map((m: Record<string, string>) => ({
      source: 'shareasale',
      merchantId: m.merchantId,
      name: m.merchantName,
      website: m.homepageUrl,
      category: mapCategory(m.category || ''),
      commissionRate: m.commissionRate,
      cookieLength: m.cookieLength,
      affiliateUrl: `https://www.shareasale.com/r.cfm?u=${affId}&b=${m.merchantId}&m=12345`,
    }));
  } catch (e) {
    console.error('ShareASale fetch error:', e);
    return [];
  }
}

async function fetchShareASaleCoupons(merchantId?: string) {
  const token = process.env.SHAREASALE_TOKEN;
  const affId = process.env.SHAREASALE_AFFILIATE_ID;
  if (!token || !affId) return [];

  try {
    const auth = generateShareASaleAuth(token);
    const url = merchantId
      ? `https://api.shareasale.com/x.cfm?merchantId=${merchantId}`
      : 'https://api.shareasale.com/x.cfm';
    const res = await fetch(url, {
      headers: {
        'x-ShareASale-Date': auth.date,
        'x-ShareASale-Authentication': auth.hash,
        'x-ShareASale-Version': '2.3',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.coupons || []).map((c: Record<string, string>) => ({
      source: 'shareasale',
      merchantId: c.merchantId,
      code: c.couponCode,
      title: c.couponTitle || c.description,
      description: c.description,
      discount: c.discountAmount || c.discountPercent,
      startDate: c.startDate,
      endDate: c.endDate,
      affiliateUrl: `https://www.shareasale.com/r.cfm?u=${affId}&b=${c.merchantId}&m=12345&afftrack=&urllink=${encodeURIComponent(c.url || '')}`,
    }));
  } catch (e) {
    console.error('ShareASale coupons error:', e);
    return [];
  }
}

// ===== CJ Affiliate API =====
async function fetchCJMerchants(limit = 50) {
  const apiKey = process.env.CJ_API_KEY;
  const pubId = process.env.CJ_PUBLISHER_ID;
  if (!apiKey || !pubId) return [];

  try {
    const res = await fetch(
      `https://commissions-api.cj.com/query?advertiser-ids=joined&records-per-page=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.advertisers || []).map((a: Record<string, string>) => ({
      source: 'cj',
      merchantId: a.advertiserId,
      name: a.advertiserName,
      website: a.url,
      category: mapCategory(a.category || ''),
      commissionRate: a.sevenDayEpc,
      affiliateUrl: `https://www.anrdoezrs.net/links/${pubId}/type/dlg/sid/happysave?url=${encodeURIComponent(a.url)}`,
    }));
  } catch (e) {
    console.error('CJ fetch error:', e);
    return [];
  }
}

// ===== Impact API =====
async function fetchImpactMerchants(limit = 50) {
  const sid = process.env.IMPACT_ACCOUNT_SID;
  const auth = process.env.IMPACT_AUTH_TOKEN;
  if (!sid || !auth) return [];

  try {
    const res = await fetch(
      `https://api.impact.com/Advertisers/${sid}?PageSize=${limit}&RelationshipStatus=joined`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${auth}`).toString('base64')}`,
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.Advertisers || []).map((a: Record<string, string>) => ({
      source: 'impact',
      merchantId: a.Id,
      name: a.Name,
      website: a.Url,
      category: mapCategory(a.Category || ''),
      commissionRate: a.CommissionRate,
      affiliateUrl: `https://impact.com/campaign-promo-click/${a.Id}`,
    }));
  } catch (e) {
    console.error('Impact fetch error:', e);
    return [];
  }
}

// ===== Awin API =====
async function fetchAwinMerchants(limit = 50) {
  const token = process.env.AWIN_API_TOKEN;
  const pubId = process.env.AWIN_PUBLISHER_ID;
  if (!token || !pubId) return [];

  try {
    const res = await fetch(
      `https://api.awin.com/publishers/${pubId}/programmes?relationship=joined&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((a: Record<string, string>) => ({
      source: 'awin',
      merchantId: a.id,
      name: a.name,
      website: a.url,
      category: mapCategory((a['sector'] as unknown as Record<string, string>)?.name || ''),
      commissionRate: a.commissionString,
      affiliateUrl: `https://www.awin1.com/cread.php?awinmid=${a.id}&awinaffid=${pubId}&clickref=happysave`,
    }));
  } catch (e) {
    console.error('Awin fetch error:', e);
    return [];
  }
}

// ===== 工具函数 =====

function generateShareASaleAuth(token: string) {
  const date = new Date().toUTCString();
  const hash = createHash('sha256').update(token + date).digest('hex');
  return { date, hash };
}

function mapCategory(rawCategory: string): string {
  const cat = rawCategory.toLowerCase();
  if (/fashion|cloth|apparel|wear/.test(cat)) return 'fashion';
  if (/beauty|cosmetic|skincare|makeup/.test(cat)) return 'beauty';
  if (/electron|tech|gadget|computer/.test(cat)) return 'electronics';
  if (/travel|hotel|flight|airline/.test(cat)) return 'travel';
  if (/home|furniture|kitchen/.test(cat)) return 'home';
  if (/sport|fitness|gym/.test(cat)) return 'sports';
  if (/food|grocery|meal/.test(cat)) return 'food';
  if (/ai|software|saas|app/.test(cat)) return 'ai';
  if (/host|domain|cloud|server/.test(cat)) return 'hosting';
  return 'shopping';
}

// ===== 主同步函数 =====

export async function syncAllAffiliateData() {
  const results = { merchants: 0, coupons: 0, errors: [] as string[] };

  // 1. 获取商家数据
  const [saMerchants, cjMerchants, impactMerchants, awinMerchants] = await Promise.all([
    fetchShareASaleMerchants(100),
    fetchCJMerchants(100),
    fetchImpactMerchants(100),
    fetchAwinMerchants(100),
  ]);

  const allMerchants = [...saMerchants, ...cjMerchants, ...impactMerchants, ...awinMerchants];
  results.merchants = allMerchants.length;

  // 2. 获取优惠码
  const [saCoupons] = await Promise.all([
    fetchShareASaleCoupons(),
  ]);
  results.coupons = saCoupons.length;

  return {
    success: true,
    data: {
      merchants: allMerchants,
      coupons: saCoupons,
      summary: results,
      networks: {
        shareasale: { enabled: AFFILIATE_CONFIG.shareasale.enabled(), merchants: saMerchants.length, coupons: saCoupons.length },
        cj: { enabled: AFFILIATE_CONFIG.cj.enabled(), merchants: cjMerchants.length },
        impact: { enabled: AFFILIATE_CONFIG.impact.enabled(), merchants: impactMerchants.length },
        awin: { enabled: AFFILIATE_CONFIG.awin.enabled(), merchants: awinMerchants.length },
      },
    },
  };
}

// 导出配置供管理后台使用
export function getAffiliateStatus() {
  return {
    shareasale: { enabled: AFFILIATE_CONFIG.shareasale.enabled(), name: 'ShareASale', description: '时尚/美妆/家居 — 适合海淘' },
    cj: { enabled: AFFILIATE_CONFIG.cj.enabled(), name: 'CJ Affiliate', description: '大型商家/品牌 — 高佣金' },
    impact: { enabled: AFFILIATE_CONFIG.impact.enabled(), name: 'Impact', description: '科技/SaaS — 高转化' },
    awin: { enabled: AFFILIATE_CONFIG.awin.enabled(), name: 'Awin', description: '全球网络 — 欧美为主' },
  };
}

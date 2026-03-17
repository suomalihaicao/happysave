// 联盟数据 API - /api/v1/affiliate
import { NextRequest, NextResponse } from 'next/server';
import { syncAllAffiliateData, getAffiliateStatus } from '@/lib/affiliate';
import { db } from '@/lib/db';

interface AffiliateNetworkStatus {
  enabled: boolean;
  name: string;
  description: string;
}

// GET - 查看联盟状态
export async function GET() {
  const status: Record<string, AffiliateNetworkStatus> = getAffiliateStatus();
  const enabledCount = Object.values(status).filter((s) => s.enabled).length;
  
  return NextResponse.json({
    success: true,
    data: {
      networks: status,
      enabledCount,
      totalNetworks: Object.keys(status).length,
      setupGuide: {
        shareasale: { env: ['SHAREASALE_TOKEN', 'SHAREASALE_AFFILIATE_ID'], register: 'https://www.shareasale.com/shareasale.cfm?merchantType=affiliate' },
        cj: { env: ['CJ_API_KEY', 'CJ_PUBLISHER_ID'], register: 'https://www.cj.com/' },
        impact: { env: ['IMPACT_ACCOUNT_SID', 'IMPACT_AUTH_TOKEN'], register: 'https://impact.com/' },
        awin: { env: ['AWIN_API_TOKEN', 'AWIN_PUBLISHER_ID'], register: 'https://www.awin.com/' },
      },
    },
  });
}

// POST - 同步联盟数据
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || 'sync';

  if (action === 'sync') {
    const result = await syncAllAffiliateData();
    
    // 如果有商家数据，导入到数据库
    if (result.data.merchants.length > 0) {
      let imported = 0;
      for (const m of result.data.merchants) {
        try {
          const existing = await db.getStoreBySlug(m.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
          if (!existing) {
            await db.createStore({
              name: m.name,
              nameZh: m.name,
              slug: m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: `${m.name} official deals and promo codes`,
              descriptionZh: `${m.name} 官方优惠码和折扣`,
              logo: `https://logo.clearbit.com/${m.website?.replace(/https?:\/\//, '')}`,
              website: m.website,
              affiliateUrl: m.affiliateUrl,
              category: m.category,
              categoryZh: m.category,
              tags: [m.category, m.source],
              featured: false,
            });
            imported++;
          }
        } catch { /* skip */ }
      }
      return NextResponse.json({ success: true, data: { ...result.data.summary, imported, networks: result.data.networks } });
    }
    
    return NextResponse.json({ success: true, data: result.data.summary, networks: result.data.networks });
  }

  return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
}

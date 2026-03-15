// 用户提交优惠码
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/v1/submit - 用户提交优惠码
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { storeName, storeUrl, couponCode, couponTitle, discount, description, submitterEmail } = body;

  if (!storeName || !couponTitle) {
    return NextResponse.json({ success: false, message: '商家名称和优惠标题必填' }, { status: 400 });
  }

  // 找到或创建商家
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let store = db.getStoreBySlug(slug);

  if (!store) {
    store = db.createStore({
      slug,
      name: storeName,
      nameZh: storeName,
      description: description || '',
      website: storeUrl || '',
      affiliateUrl: storeUrl || '',
      category: 'shopping',
      categoryZh: '综合购物',
      tags: ['user-submitted'],
      active: false, // 需要审核
    });
  }

  // 创建优惠码（待审核）
  const coupon = db.createCoupon({
    storeId: (store as any).id,
    storeName: (store as any).name,
    code: couponCode || null,
    title: couponTitle,
    titleZh: couponTitle,
    description: description || couponTitle,
    discount: discount || '',
    discountType: 'percentage',
    type: couponCode ? 'code' : 'deal',
    affiliateUrl: storeUrl || '',
    startDate: new Date().toISOString(),
    featured: false,
    active: false, // 需要审核
    verified: false,
  });

  // 记录提交通知
  db.createNotification({
    type: 'new_submission',
    storeId: (store as any).id,
    email: submitterEmail || '',
    keyword: `${storeName} - ${couponTitle}`,
  });

  return NextResponse.json({
    success: true,
    message: '提交成功！审核通过后会显示在网站上',
    data: { couponId: (coupon as any).id },
  });
}

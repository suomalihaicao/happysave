'use client';

import { AntdProvider } from '@/providers/AntdProvider';
import StoreDetailContent from './StoreDetailContent';
import type { Store, Coupon } from '@/types';

interface Props {
  store: Store;
  coupons: Coupon[];
}

export default function StoreDetailClient({ store, coupons }: Props) {
  return (
    <AntdProvider>
      <StoreDetailContent initialData={{ store, coupons }} />
    </AntdProvider>
  );
}

// Enterprise-grade type definitions
export interface Store {
  id: string;
  slug: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  logo: string;
  website: string;
  affiliateUrl: string;
  category: string;
  categoryZh: string;
  tags: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  clickCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  storeId: string;
  storeName?: string;
  code: string | null;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  discount: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping' | 'trial' | 'bogo';
  type: 'code' | 'deal' | 'cashback' | 'freebie';
  affiliateUrl: string;
  startDate: string;
  endDate: string | null;
  featured: boolean;
  active: boolean;
  verified: boolean;
  clickCount: number;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShortLink {
  id: string;
  code: string;
  originalUrl: string;
  shortUrl: string;
  storeId: string;
  storeName?: string;
  couponId: string | null;
  clicks: number;
  uniqueClicks: number;
  createdAt: string;
  lastClickedAt: string | null;
}

export interface ClickLog {
  id: string;
  shortCode: string;
  storeId: string;
  couponId: string | null;
  ip: string;
  userAgent: string;
  referer: string;
  country: string;
  device: string;
  timestamp: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar: string;
  lastLogin: string;
}

export interface DashboardStats {
  totalStores: number;
  totalCoupons: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalShortLinks: number;
  todayClicks: number;
  todayConversions: number;
  topStores: Array<{ name: string; clicks: number; conversions: number }>;
  recentClicks: ClickLog[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  name: string;
  nameZh: string;
  icon: string;
  count: number;
}

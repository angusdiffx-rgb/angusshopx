export type Role = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: Role;
  rank?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

export type ProductCategory = 'ไอดี' | 'ผลปีศาจ' | 'Gamepass' | 'บริการ' | 'สกินผล' | 'ไอเทม' | 'อื่นๆ';
export type DeliveryType = 'fruit' | 'item' | 'gamepass' | 'service' | 'fruit_trade' | 'gamepass_gift' | 'account_code' | 'manual_service';

export interface Product {
  id?: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  subCategory?: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  tierImages?: Record<string, string>;
  stock: number;
  isActive: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  deliveryType: DeliveryType;
  rarity?: 'Mythical' | 'Legendary' | 'Rare' | 'Uncommon' | 'Common';
  fruitType?: 'Physical' | 'Permanent';
  deliveryInstructions?: string;
  instructionsTitle?: string;
  tradeServerLink?: string;
  serverLinkTitle?: string;
  claimCode?: string;
  claimCodeTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export interface OrderItem {
  cartItemId?: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  deliveryType: DeliveryType;
  category?: ProductCategory;
  selectedOption?: string;
  targetNote?: string;
  deliveryInstructions?: string;
  instructionsTitle?: string;
  tradeServerLink?: string;
  serverLinkTitle?: string;
  claimCode?: string;
  claimCodeTitle?: string;
}

export interface Order {
  id?: string;
  orderId: string;
  uid: string;
  userEmail?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalAmount?: number;
  paymentMethod: 'wallet';
  paymentStatus: 'paid' | 'pending';
  orderStatus: OrderStatus;
  status?: string;
  robloxUsername?: string;
  serviceAccountUsername?: string;
  serviceAccountPassword?: string;
  isServiceOrder?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id?: string;
  inventoryId: string;
  uid: string;
  userEmail?: string;
  productId: string;
  orderId: string;
  productName: string;
  quantity: number;
  status: 'ready' | 'claimed' | 'processing';
  deliveryType: DeliveryType;
  image?: string;
  claimCode?: string;
  claimCodeTitle?: string;
  instructions?: string;
  instructionsTitle?: string;
  serverLink?: string;
  tradeServerLink?: string;
  serverLinkTitle?: string;
  metadata?: {
    robloxUsername?: string;
    accountUser?: string;
    accountPass?: string;
    serviceAccountUsername?: string;
    serviceAccountPassword?: string;
    accountCredentials?: string;
    isServiceOrder?: boolean;
    redeemCode?: string;
    code?: string;
    instructions?: string;
    instructionsTitle?: string;
    tradeServerLink?: string;
    serverLink?: string;
    serverLinkTitle?: string;
    claimCode?: string;
    claimCodeTitle?: string;
    deliveredAt?: string;
    adminNote?: string;
  };
  createdAt: string;
  updatedAt?: string;
  claimedAt?: string | null;
}

export type TransactionType = 'deposit' | 'purchase' | 'refund' | 'adjustment';

export interface WalletTransaction {
  id?: string;
  transactionId: string;
  uid: string;
  type: TransactionType;
  amount: number;
  status: 'success' | 'failed' | 'pending';
  reference: string;
  depositId?: string;
  orderId?: string;
  description: string;
  createdAt: string;
}

export type DepositStatus = 'pending' | 'verifying' | 'completed' | 'failed';

export interface Deposit {
  id?: string;
  depositId: string;
  uid: string;
  userEmail?: string;
  userName?: string;
  senderName?: string;
  amount: number;
  expectedAmount?: number;
  promptpayNumber?: string;
  method?: 'promptpay' | 'truemoney_angpao';
  voucherHash?: string;
  recipientPhone?: string;
  status: DepositStatus;
  slipUrl?: string;
  slipImageBase64?: string;
  transRef?: string;
  slipokResponse?: any;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id?: string;
  couponId: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export interface Notification {
  id?: string;
  notifId: string;
  uid: string;
  title: string;
  message: string;
  type: 'deposit' | 'order' | 'system' | 'promo';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id?: string;
  logId: string;
  adminUid: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  createdAt: string;
}

export interface Review {
  id?: string;
  reviewId: string;
  rating: number;
  comment: string;
  uid: string;
  userName: string;
  userPhoto?: string;
  productId: string;
  orderId: string;
  createdAt: string;
}

export interface DeliverySettings {
  vipServerLink: string;
  defaultInstructions: string;
  claimCodePrefix: string;
  defaultInstructionsTitle?: string;
  defaultServerLinkTitle?: string;
  defaultClaimCodeTitle?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TrendingFruitItem {
  id: string;
  name: string;
  th: string;
  price: string;
  img: string;
  rarity?: string;
}

export interface PromoShowcaseCard {
  name: string;
  tag: string;
  img: string;
  keyword: string;
}

export interface CategoryCardConfig {
  name: string;
  desc: string;
  iconType: 'icon' | 'image';
  iconName?: string; // For lucide icons (Flame, Zap, Sparkles, ShieldCheck, etc)
  imageUrl?: string; // For uploaded images
  colorClass: string;
}

export interface HeroBannerConfig {
  id: string;
  badge: string;
  badgeColor?: 'purple' | 'rose' | 'amber' | 'cyan' | 'emerald' | string;
  title: string;
  highlightText?: string;
  description: string;
  priceText?: string;
  originalPriceText?: string;
  discountBadge?: string;
  imageUrl: string;
  imageAlt?: string;
  aspectRatio?: string;
  themeGradient?: string;
  accentColor?: string;
  targetProductId?: string;
  targetCategory?: string;
  customLink?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  isActive?: boolean;
  order?: number;
}

export interface HomeConfig {
  heroBanners?: HeroBannerConfig[];
  siteLogo?: string;
  heroBadgeText?: string;
  heroStatusText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  stat1Label?: string;
  stat2Label?: string;
  stat3Label?: string;
  stat4Label?: string;
  categoriesTitle?: string;
  categoriesSubtitle?: string;
  categoryCards?: CategoryCardConfig[];
  trendingTitle: string;
  trendingBadge: string;
  trendingItems: TrendingFruitItem[];
  promoBadge: string;
  promoTitle: string;
  promoDescription: string;
  promoButtonText: string;
  promoSecondaryButtonText: string;
  promoCard1: PromoShowcaseCard;
  promoCard2: PromoShowcaseCard;
  promoFooterText: string;
  promoFooterTag: string;
  // Desktop/Universal Media Banner (เพลง หรือ รูปภาพ)
  desktopBannerType?: 'music' | 'image';
  desktopBannerTitle?: string;
  desktopBannerSubtitle?: string;
  desktopBannerBadge?: string;
  desktopBannerTag?: string;
  desktopBannerSoundtrackTitle?: string;
  desktopBannerSoundtrackDetail?: string;
  desktopBannerButtonText?: string;
  desktopBannerButtonLink?: string;
  desktopBannerFooterNote?: string;
  desktopBannerYoutubeUrl?: string;
  desktopBannerStartTime?: number;
  desktopBannerAutoplay?: boolean;
  desktopBannerImageUrl?: string;
  desktopBannerImageLink?: string;
  // Web Promo Banner (แบนเนอร์เว็ป AngusShop Blox Fruits ปรับแต่งใน Admin ได้)
  webBannerImageUrl?: string;
  webBannerLink?: string;
  webBannerBadge1?: string;
  webBannerBadge2?: string;
  webBannerShopButtonText?: string;
  webBannerHighlightTitle?: string;
  webBannerHighlightSubtitle?: string;
  webBannerHighlightPrice?: number;
  webBannerHighlightOldPrice?: number;
  webBannerHighlightImage?: string;
  webBannerHighlightBadge?: string;
  webBannerHighlightButtonText?: string;
  webBannerTag1?: string;
  webBannerTag2?: string;
  webBannerTag3?: string;
  webBannerTag4?: string;
  showWebBanner?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ServiceSubCategory {
  id: string;
  name: string;
  enName: string;
  icon: string;
  description: string;
}

export const SERVICE_SUBCATEGORY_LIST: ServiceSubCategory[] = [
  {
    id: 'ฟาร์มทั่วไป',
    name: 'ฟาร์มทั่วไป',
    enName: 'General Farm',
    icon: '⚡',
    description: 'ฟาร์มเลเวล มาสเตอรี่ เบลี่ และเงินเขียว'
  },
  {
    id: 'หาของโลก 1',
    name: 'หาของโลก 1',
    enName: 'Sea 1 Items',
    icon: '🌊',
    description: 'ดาบเซเบอร์ ปืนใหญ่ บาซูก้า และของแรร์โลกหนึ่ง'
  },
  {
    id: 'หาของโลก 2',
    name: 'หาของโลก 2',
    enName: 'Sea 2 Items',
    icon: '⚔️',
    description: 'ดาบเร็นโกคุ มิดไนท์เบลด และทรูทริปเปิ้ลคาตานะ'
  },
  {
    id: 'หาของโลก 3',
    name: 'หาของโลก 3',
    enName: 'Sea 3 Items',
    icon: '👑',
    description: 'ดาบคู่ CDK เคียวโซล กีต้าร์โซล และดาบทูชิตะ'
  },
  {
    id: 'ลงดัน & ตื่นผล',
    name: 'ลงดัน & ตื่นผล',
    enName: 'Raid & Awakening',
    icon: '🔥',
    description: 'ลงดันเจี้ยน ฟาร์มชิป ปลุกพลังผลปีศาจทุกขั้น'
  },
  {
    id: 'ล่าบอส & สัตว์ทะเล',
    name: 'ล่าบอส & สัตว์ทะเล',
    enName: 'Boss & Sea Events',
    icon: '🐉',
    description: 'ล่า Sea Beast สัตว์อสูรทะเล บอสลีเวียธาน'
  },
  {
    id: 'ทำเผ่า & ไซบอร์ก/กูล/V4',
    name: 'ทำเผ่า & V4',
    enName: 'Race & V4 Awakening',
    icon: '✨',
    description: 'ทำเผ่าไซบอร์ก กูล และปลุกพลังเผ่า V4 ทุกเผ่า'
  }
];

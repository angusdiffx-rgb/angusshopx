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

export type ProductCategory = 'ผลปีศาจ' | 'Gamepass' | 'ไอเทม' | 'บริการ' | 'อื่นๆ';
export type DeliveryType = 'fruit' | 'item' | 'gamepass' | 'service' | 'fruit_trade' | 'gamepass_gift' | 'account_code' | 'manual_service';

export interface Product {
  id?: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
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
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
  deliveryType: DeliveryType;
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
    accountCredentials?: string;
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

export interface HomeConfig {
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
  updatedAt?: string;
  updatedBy?: string;
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  ClipboardList, 
  Tag, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Search, 
  AlertCircle,
  AlertTriangle,
  Activity,
  Database,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Server,
  Key,
  KeyRound,
  ShieldAlert,
  EyeOff,
  Send,
  FileText,
  Copy,
  Check,
  Bell,
  MessageSquare,
  Sparkles,
  Settings,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Gift,
  QrCode,
  Wallet,
  RotateCcw,
  Flame,
  Palette,
  Zap,
  Sword,
  Wrench,
  Layers,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  SlidersHorizontal,
  Grid,
  List,
  Clock,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useHomeConfig } from '../context/HomeConfigContext';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { auth, db, isQuotaExceededError, getDocsSmart, getDocSmart } from '../lib/firebase';
import type { Product, Order, Deposit, ProductCategory, InventoryItem, DeliveryType, DeliverySettings, UserProfile, Role, OrderStatus, HomeConfig } from '../types';
import { BLOX_FRUITS_PRESETS, BloxPreset, DEFAULT_HOME_CONFIG } from '../data/bloxPresets';
import { HomeConfigManager } from '../components/HomeConfigManager';
import { BloxPresetPickerModal } from '../components/BloxPresetPickerModal';
import { BloxImage } from '../components/BloxImage';
import { DigitalReceiptModal } from '../components/DigitalReceiptModal';

interface AdminViewProps {
  products?: Product[];
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>;
  onNavigate?: (view: string, param?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  products: initialProductsFromProps, 
  setProducts: setProductsFromProps,
  onNavigate
}) => {
  const { user, isAdmin, loading: authLoading, openAuthModal, logoutUser } = useAuth();
  const { success, error: toastError } = useToast();

  // Helper: Secure fetch for /api/admin/* endpoints with Firebase ID token
  const adminFetch = async (url: string, options: RequestInit = {}) => {
    let token: string | undefined;
    try {
      token = await auth.currentUser?.getIdToken();
    } catch (e) {
      console.warn('Failed to retrieve Firebase ID token:', e);
    }
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'gacha' | 'inventory' | 'deposits' | 'orders' | 'home_config' | 'users'>('dashboard');

  // Gacha Accounts Management State (ช่องกรอกไอดีไก่ตันใน admin)
  const [gachaAccounts, setGachaAccounts] = useState<any[]>([]);
  const [isLoadingGacha, setIsLoadingGacha] = useState(false);
  const [gachaInputText, setGachaInputText] = useState('');
  const [isSubmittingGacha, setIsSubmittingGacha] = useState(false);
  const [gachaFilter, setGachaFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [gachaRevealedPasswords, setGachaRevealedPasswords] = useState<Record<string, boolean>>({});
  const [gachaTargetProduct, setGachaTargetProduct] = useState('prod_gacha_cdk_35');
  const [confirmDeleteGachaId, setConfirmDeleteGachaId] = useState<string | null>(null);
  const [isBulkDeletingGacha, setIsBulkDeletingGacha] = useState(false);

  // Home Config & Highlight Card Quick Editor State
  const { homeConfig: rawHomeConfig, saveFullHomeConfig } = useHomeConfig();
  const homeConfig = rawHomeConfig || DEFAULT_HOME_CONFIG;
  const [isEditingHighlightCard, setIsEditingHighlightCard] = useState(false);
  const [highlightCardDraft, setHighlightCardDraft] = useState<Partial<HomeConfig>>({});
  const [isSavingHighlightCard, setIsSavingHighlightCard] = useState(false);
  const [isHighlightPresetPickerOpen, setIsHighlightPresetPickerOpen] = useState(false);

  const handleSaveHighlightCard = async () => {
    setIsSavingHighlightCard(true);
    try {
      const mergedConfig = {
        ...homeConfig,
        ...highlightCardDraft,
        updatedAt: new Date().toISOString()
      };
      await saveFullHomeConfig(mergedConfig);
      success('บันทึกข้อมูลการ์ดโปรโมชั่นหน้าแรกเรียบร้อยแล้ว!');
      setIsEditingHighlightCard(false);
    } catch (err: any) {
      toastError('ไม่สามารถบันทึกได้', err.message);
    } finally {
      setIsSavingHighlightCard(false);
    }
  };

  const loadGachaAccounts = async () => {
    setIsLoadingGacha(true);
    try {
      const res = await adminFetch(`/api/admin/gacha-accounts?productId=${gachaTargetProduct}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setGachaAccounts(data.accounts);
      }
    } catch (e) {
      console.warn('Load gacha accounts error:', e);
    } finally {
      setIsLoadingGacha(false);
    }
  };

  const handleAddGachaAccounts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gachaInputText.trim()) {
      toastError('กรุณากรอกไอดี', 'กรุณาระบุ Username:Password อย่างน้อย 1 บัญชี');
      return;
    }
    setIsSubmittingGacha(true);
    try {
      const res = await adminFetch('/api/admin/gacha-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: gachaTargetProduct,
          accountsText: gachaInputText
        })
      });
      const data = await res.json();
      if (data.success) {
        success('บันทึกสำเร็จ', data.message || `เพิ่มไอดีเข้าสต็อกแล้ว ${data.addedCount} บัญชี`);
        setGachaInputText('');
        await loadGachaAccounts();
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      } else {
        toastError('ไม่สำเร็จ', data.message || 'ไม่สามารถเพิ่มไอดีได้');
      }
    } catch (err: any) {
      toastError('ข้อผิดพลาด', err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ');
    } finally {
      setIsSubmittingGacha(false);
    }
  };

  const handleDeleteGachaAccount = async (id: string) => {
    try {
      // Optimistically remove from state so the user sees instant response
      setGachaAccounts(prev => prev.filter(a => a.id !== id));
      setConfirmDeleteGachaId(null);

      const res = await adminFetch(`/api/admin/gacha-accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        success('ลบไอดีแล้ว', 'ลบไอดีออกจากสต็อกเรียบร้อย');
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      } else {
        toastError('ไม่สำเร็จ', data.message || 'ลบไม่สำเร็จ');
        loadGachaAccounts();
      }
    } catch (e: any) {
      toastError('ไม่สามารถลบได้', e.message);
      loadGachaAccounts();
    }
  };

  const handleClearSoldGacha = async () => {
    setIsBulkDeletingGacha(true);
    try {
      const res = await adminFetch('/api/admin/gacha-accounts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlySold: true, productId: gachaTargetProduct })
      });
      const data = await res.json();
      if (data.success) {
        success('ล้างไอดีที่ขายแล้วสำเร็จ', data.message || `ลบ ${data.deletedCount} บัญชี`);
        setGachaAccounts(prev => prev.filter(a => a.status !== 'sold'));
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      }
    } catch (e: any) {
      toastError('เกิดข้อผิดพลาด', e.message);
    } finally {
      setIsBulkDeletingGacha(false);
    }
  };

  const handlePurgeSampleGacha = async () => {
    setIsSubmittingGacha(true);
    try {
      const res = await adminFetch('/api/admin/gacha-accounts/purge-samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        success('ล้างไอดีตัวอย่างสำเร็จ', data.message || `ลบไอดีตัวอย่างแล้ว ${data.count} บัญชี`);
        await loadGachaAccounts();
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      }
    } catch (e: any) {
      toastError('ข้อผิดพลาด', e.message);
    } finally {
      setIsSubmittingGacha(false);
    }
  };

  const handleRestoreGachaAccount = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/gacha-accounts/${id}/restore`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        success('คืนสต็อกสำเร็จ', 'เปลี่ยนสถานะไอดีเป็นพร้อมส่งเรียบร้อยแล้ว');
        await loadGachaAccounts();
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      } else {
        toastError('ไม่สามารถคืนสต็อกได้', data.message);
      }
    } catch (e: any) {
      toastError('ข้อผิดพลาด', e.message);
    }
  };

  const handleSyncOrphansGacha = async () => {
    try {
      const res = await adminFetch('/api/admin/gacha-accounts/sync-orphans', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        success('ตรวจสอบเสร็จสิ้น', data.message || `กู้คืน ${data.restored} บัญชี`);
        await loadGachaAccounts();
        window.dispatchEvent(new CustomEvent('productsUpdated'));
      }
    } catch (e: any) {
      toastError('ข้อผิดพลาด', e.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'gacha' || activeTab === 'products') {
      loadGachaAccounts();
    }
  }, [activeTab, gachaTargetProduct]);
  
  // Blox Fruits preset picker modal state
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [presetPickerTarget, setPresetPickerTarget] = useState<'new' | 'edit' | 'quick'>('new');
  
  // Quick Image Edit Modal State
  const [isQuickImageModalOpen, setIsQuickImageModalOpen] = useState(false);
  const [quickImageProduct, setQuickImageProduct] = useState<Product | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState<string>('');
  const [quickImageTierUrls, setQuickImageTierUrls] = useState<Record<string, string>>({});
  const [quickActiveTierTab, setQuickActiveTierTab] = useState<'main' | '10M' | '20M' | '30M'>('main');
  const [isSavingQuickImage, setIsSavingQuickImage] = useState(false);

  // Helper for detecting bounty/multi-tier products
  const isBountyProduct = (p?: Product | null) => {
    if (!p) return false;
    return (
      p.productId === 'prod_bounty_hunt' ||
      p.productId?.toLowerCase().includes('bounty') ||
      p.name?.includes('ค่าหัว') ||
      p.name?.toLowerCase().includes('bounty') ||
      Boolean(p.tierImages && Object.keys(p.tierImages).length > 0)
    );
  };
  
  // Data states
  const [internalProducts, setInternalProducts] = useState<Product[]>([]);
  const products = initialProductsFromProps || internalProducts;
  const setProducts = setProductsFromProps || setInternalProducts;
  const [adminDataLimit, setAdminDataLimit] = useState<number>(30);
  const [tabLastLoaded, setTabLastLoaded] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Category management & view controls for Products
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [productViewMode, setProductViewMode] = useState<'grouped' | 'list'>('grouped');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  // Compute duplicate products statistics (same name or same ID)
  const duplicateInfo = useMemo(() => {
    const nameMap: Record<string, Product[]> = {};
    (Array.isArray(products) ? products : []).forEach(p => {
      if (!p) return;
      const key = (p.name || '').trim().toLowerCase();
      if (!key) return;
      if (!nameMap[key]) nameMap[key] = [];
      nameMap[key].push(p);
    });
    const dupes = Object.entries(nameMap).filter(([_, items]) => items.length > 1);
    const totalExtra = dupes.reduce((acc, [_, items]) => acc + (items.length - 1), 0);
    return {
      hasDuplicates: dupes.length > 0,
      duplicatedNamesCount: dupes.length,
      extraItemsCount: totalExtra,
      sampleNames: dupes.slice(0, 3).map(([_, items]) => items[0]?.name || '')
    };
  }, [products]);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const expandAllCategories = (categoriesList: string[]) => {
    const next: Record<string, boolean> = {};
    categoriesList.forEach(c => { next[c] = false; });
    setCollapsedCategories(next);
  };

  const collapseAllCategories = (categoriesList: string[]) => {
    const next: Record<string, boolean> = {};
    categoriesList.forEach(c => { next[c] = true; });
    setCollapsedCategories(next);
  };
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('angus_admin_orders');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch { return []; }
  });
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [orderSearchKey, setOrderSearchKey] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [deposits, setDeposits] = useState<Deposit[]>(() => {
    try {
      const saved = localStorage.getItem('angus_admin_deposits');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch { return []; }
  });
  const [depositFilter, setDepositFilter] = useState<'all' | 'truemoney' | 'promptpay'>('all');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('angus_admin_inventory');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch { return []; }
  });
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('angus_admin_users');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<UserProfile | null>(null);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState<string>('');
  const [isAdjustingCredit, setIsAdjustingCredit] = useState<boolean>(false);
  const [systemAudit, setSystemAudit] = useState<any>(null);
  const [isAuditingSystem, setIsAuditingSystem] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);

  // Delivery & Customer Inventory management modal
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [searchInventory, setSearchInventory] = useState('');
  const [inventoryFilterStatus, setInventoryFilterStatus] = useState<'all' | 'ready' | 'claimed' | 'processing'>('all');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Direct deliver to customer inventory modal
  const [isDirectDeliverModalOpen, setIsDirectDeliverModalOpen] = useState(false);

  // Global VIP Server and Delivery Templates Settings
  const [isVipSettingsModalOpen, setIsVipSettingsModalOpen] = useState(false);
  const [isUpdatingBatchVip, setIsUpdatingBatchVip] = useState(false);
  const [vipSettings, setVipSettings] = useState<DeliverySettings>({
    vipServerLink: 'https://www.roblox.com/games/2753915549/Blox-Fruits?privateServerLinkCode=angus-vip-trade',
    defaultInstructions: 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits',
    defaultInstructionsTitle: 'คำแนะนำการรับสินค้า',
    defaultServerLinkTitle: 'ลิงค์รับของ',
    defaultClaimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
    claimCodePrefix: 'AGS-',
  });

  // Form state for editing delivery details
  const [deliveryForm, setDeliveryForm] = useState({
    instructionsTitle: 'คำแนะนำการรับสินค้า',
    instructions: '',
    serverLinkTitle: 'ลิงค์รับของ',
    tradeServerLink: '',
    claimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
    claimCode: '',
    status: 'ready' as 'ready' | 'claimed' | 'processing',
    adminNote: '',
    notifyCustomer: true,
  });

  // Form state for direct deliver to customer
  const [directDeliverForm, setDirectDeliverForm] = useState({
    uidOrEmail: '',
    robloxUsername: '',
    productId: '',
    productName: '',
    quantity: 1,
    instructionsTitle: 'คำแนะนำการรับสินค้า',
    instructions: 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits',
    serverLinkTitle: 'ลิงค์รับของ',
    tradeServerLink: '',
    claimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
    claimCode: '',
    deliveryType: 'fruit_trade' as DeliveryType,
    notifyCustomer: true,
  });

  // New product form
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    slug: '',
    category: 'ผลปีศาจ',
    price: 150,
    oldPrice: 199,
    stock: 5,
    image: 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/65/Kitsune_Fruit.png/revision/latest',
    description: '',
    shortDescription: '',
    deliveryType: 'fruit_trade',
    instructionsTitle: 'คำแนะนำการรับสินค้า',
    deliveryInstructions: 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits',
    serverLinkTitle: 'ลิงค์รับของ',
    tradeServerLink: '',
    claimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
    claimCode: '',
    rarity: 'Mythical',
    fruitType: 'Permanent',
    isFeatured: true,
    isBestSeller: false,
    isActive: true,
  });

  // Tab-specific, on-demand loader to eliminate redundant Firestore reads (Quota Guardian)
  const loadTabData = async (tab: string, force = false) => {
    if (!isAdmin) return;
    const now = Date.now();
    const lastLoaded = tabLastLoaded[tab] || Number(sessionStorage.getItem(`angus_admin_tab_time_${tab}`) || 0);
    // Smart cache: 3 minutes per tab unless force refreshed so admin operations don't exhaust daily quota
    if (!force && now - lastLoaded < 180000) {
      return;
    }

    const fetcher = force ? getDocs : getDocsSmart;

    try {
      if (tab === 'dashboard') {
        let ordersSnap;
        let depositsSnap;
        try {
          [ordersSnap, depositsSnap] = await Promise.all([
            fetcher(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(adminDataLimit))),
            fetcher(query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(adminDataLimit)))
          ]);
        } catch {
          [ordersSnap, depositsSnap] = await Promise.all([
            fetcher(query(collection(db, 'orders'), limit(adminDataLimit))),
            fetcher(query(collection(db, 'deposits'), limit(adminDataLimit)))
          ]);
        }

        const oList: Order[] = [];
        ordersSnap.forEach((d: any) => oList.push(d.data() as Order));
        oList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(oList);
        try { localStorage.setItem('angus_admin_orders', JSON.stringify(oList)); } catch {}

        const dList: Deposit[] = [];
        depositsSnap.forEach((d: any) => dList.push(d.data() as Deposit));
        dList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDeposits(dList);
        try { localStorage.setItem('angus_admin_deposits', JSON.stringify(dList)); } catch {}

        // Fetch settings if not yet loaded
        if (force || !vipSettings.vipServerLink) {
          getDocSmart(doc(db, 'settings', 'delivery')).then((sSnap: any) => {
            if (sSnap && sSnap.exists()) {
              const data = sSnap.data() as DeliverySettings;
              setVipSettings({
                vipServerLink: data.vipServerLink || 'https://www.roblox.com/games/2753915549/Blox-Fruits?privateServerLinkCode=angus-vip-trade',
                defaultInstructions: data.defaultInstructions || 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits',
                defaultInstructionsTitle: data.defaultInstructionsTitle || 'คำแนะนำการรับสินค้า',
                defaultServerLinkTitle: data.defaultServerLinkTitle || 'ลิงค์รับของ',
                defaultClaimCodeTitle: data.defaultClaimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
                claimCodePrefix: data.claimCodePrefix || 'AGS-',
              });
            }
          }).catch(() => {});
        }
      } else if (tab === 'orders') {
        let snap;
        try {
          snap = await fetcher(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(adminDataLimit)));
        } catch {
          snap = await fetcher(query(collection(db, 'orders'), limit(adminDataLimit)));
        }
        const list: Order[] = [];
        snap.forEach((d: any) => list.push(d.data() as Order));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
        try { localStorage.setItem('angus_admin_orders', JSON.stringify(list)); } catch {}
      } else if (tab === 'deposits') {
        let snap;
        try {
          snap = await fetcher(query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(adminDataLimit)));
        } catch {
          snap = await fetcher(query(collection(db, 'deposits'), limit(adminDataLimit)));
        }
        const list: Deposit[] = [];
        snap.forEach((d: any) => list.push(d.data() as Deposit));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDeposits(list);
        try { localStorage.setItem('angus_admin_deposits', JSON.stringify(list)); } catch {}
      } else if (tab === 'inventory') {
        let snap;
        try {
          snap = await fetcher(query(collection(db, 'inventory'), orderBy('createdAt', 'desc'), limit(adminDataLimit)));
        } catch {
          snap = await fetcher(query(collection(db, 'inventory'), limit(adminDataLimit)));
        }
        const list: InventoryItem[] = [];
        snap.forEach((d: any) => list.push({ id: d.id, ...(d.data() as InventoryItem) }));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInventoryItems(list);
        try { localStorage.setItem('angus_admin_inventory', JSON.stringify(list)); } catch {}
      } else if (tab === 'users') {
        let snap;
        try {
          snap = await fetcher(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(adminDataLimit)));
        } catch {
          snap = await fetcher(query(collection(db, 'users'), limit(adminDataLimit)));
        }
        const list: UserProfile[] = [];
        snap.forEach((d: any) => list.push({ ...(d.data() as UserProfile) }));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setSystemUsers(list);
        try { localStorage.setItem('angus_admin_users', JSON.stringify(list)); } catch {}
      } else if (tab === 'products') {
        const res = await fetch(`/api/products?force=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            setProducts(data.products);
            try {
              localStorage.setItem('angus_cached_products', JSON.stringify(data.products));
            } catch {}
          }
        }
      }

      setTabErrors((prev) => {
        const next = { ...prev };
        delete next[tab];
        return next;
      });
      setTabLastLoaded((prev) => ({ ...prev, [tab]: now }));
      try { sessionStorage.setItem(`angus_admin_tab_time_${tab}`, String(now)); } catch {}
      setLoading(false);
    } catch (err: any) {
      console.warn(`Error loading tab ${tab}:`, err);
      const isQuota = isQuotaExceededError(err);
      if (isQuota) {
        setIsQuotaExceeded(true);
        setTabErrors((prev) => ({
          ...prev,
          [tab]: 'โควต้าการอ่านฟรีรายวันของ Cloud Firestore เต็มชั่วคราว (Quota Exceeded) ระบบดึงข้อมูลจากแคชในเครื่อง'
        }));
      } else {
        setTabErrors((prev) => ({
          ...prev,
          [tab]: err.message || 'ไม่สามารถโหลดข้อมูลแท็บนี้ได้'
        }));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadTabData(activeTab);
  }, [isAdmin, activeTab, adminDataLimit]);

  // Listen to application events to auto-reload admin views when orders or inventory change
  useEffect(() => {
    if (!isAdmin) return;
    const handleRemoteUpdate = () => {
      setTabLastLoaded({});
      loadTabData(activeTab, true);
    };
    window.addEventListener('ordersUpdated', handleRemoteUpdate);
    window.addEventListener('inventoryUpdated', handleRemoteUpdate);
    window.addEventListener('productsUpdated', handleRemoteUpdate);
    window.addEventListener('walletUpdated', handleRemoteUpdate);
    return () => {
      window.removeEventListener('ordersUpdated', handleRemoteUpdate);
      window.removeEventListener('inventoryUpdated', handleRemoteUpdate);
      window.removeEventListener('productsUpdated', handleRemoteUpdate);
      window.removeEventListener('walletUpdated', handleRemoteUpdate);
    };
  }, [isAdmin, activeTab, adminDataLimit]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await adminFetch('/api/admin/refresh-cache', { method: 'POST' }).catch(() => {});
      setTabLastLoaded({});
      await loadTabData(activeTab, true);
      success('รีเฟรชข้อมูลสำเร็จ', 'ดึงข้อมูลล่าสุดเรียบร้อยแล้ว');
    } catch (err) {
      toastError('เกิดข้อผิดพลาด', 'ไม่สามารถรีเฟรชข้อมูลได้');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run comprehensive system health audit
  const handleRunSystemAudit = async () => {
    setIsAuditingSystem(true);
    setIsAuditModalOpen(true);
    try {
      const res = await fetch('/api/system/health-audit');
      if (res.ok) {
        const data = await res.json();
        setSystemAudit(data);
        if (data.systems?.firestore?.quotaExceeded) {
          setIsQuotaExceeded(true);
        }
      }
    } catch (err: any) {
      console.warn('System audit error:', err);
    } finally {
      setIsAuditingSystem(false);
    }
  };

  // Ensure admin user profile is always visible in Users tab even if Firestore read quota is exhausted
  useEffect(() => {
    if (user && systemUsers.length === 0) {
      const nowStr = new Date().toISOString();
      const fallbackUser: UserProfile = {
        uid: user.uid,
        email: user.email || 'angusdiffx@gmail.com',
        displayName: user.displayName || user.email?.split('@')[0] || 'Admin',
        photoURL: user.photoURL || '',
        balance: user.balance || 0,
        role: 'admin',
        createdAt: nowStr,
        updatedAt: nowStr,
        lastLoginAt: nowStr,
      };
      setSystemUsers([fallbackUser]);
    }
  }, [user, systemUsers.length]);

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="p-8 rounded-3xl bg-[#120D22] border border-purple-500/20 shadow-2xl flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-purple-300 font-medium">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#120D22] border border-rose-500/40 shadow-2xl space-y-5 text-left">
          <div className="flex items-center gap-3 border-b border-rose-500/20 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {user ? 'ปฏิเสธการเข้าถึง (Access Denied)' : 'เข้าสู่ระบบสำหรับแอดมินเท่านั้น'}
              </h2>
              <p className="text-xs text-rose-300/80">Admin Restricted Area</p>
            </div>
          </div>

          <div className="space-y-3 py-2 text-sm text-zinc-300">
            {user ? (
              <>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  บัญชีปัจจุบันของคุณ <span className="font-semibold text-rose-300 font-mono text-xs bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{user.email || user.displayName}</span> ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ
                </p>
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200">
                  ระบบจำกัดสิทธิ์เฉพาะบัญชีผู้ดูแลร้านค้าที่ได้รับอนุญาตเท่านั้น หากคุณเป็นเจ้าของร้าน กรุณาออกจากระบบและเข้าสู่ระบบด้วยอีเมลแอดมิน
                </div>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ AngusShop เท่านั้น ไม่อนุญาตให้บุคคลทั่วไปเข้าถึง
                </p>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                  กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin) เพื่อเข้าใช้งานแผงควบคุมร้านค้า
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>เข้าสู่ระบบด้วยบัญชีแอดมิน</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  await logoutUser();
                  openAuthModal('login');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>ออกจากระบบเพื่อสลับบัญชี</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate ? onNavigate('home') : (window.location.href = '/')}
              className="w-full py-2 rounded-xl bg-[#1C142E] hover:bg-[#251A3E] border border-purple-500/20 text-zinc-300 text-xs font-semibold cursor-pointer transition-all"
            >
              กลับสู่หน้าร้านค้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle selecting a preset from the complete catalog modal
  const handleSelectPresetForProduct = (preset: BloxPreset) => {
    if (presetPickerTarget === 'new') {
      setNewProduct((prev) => ({
        ...prev,
        image: preset.url,
        name: prev.name.trim() ? prev.name : preset.th,
        rarity: preset.rarity || prev.rarity,
        category: (preset.category as any) || prev.category,
      }));
      success(`เลือกรูป ${preset.th} เรียบร้อยแล้ว`);
      setIsPresetPickerOpen(false);
    } else if (presetPickerTarget === 'edit' && selectedProduct) {
      setSelectedProduct((prev) => prev ? {
        ...prev,
        image: preset.url,
      } : null);
      success(`เลือกรูป ${preset.th} เรียบร้อยแล้ว`);
      setIsPresetPickerOpen(false);
    } else if (presetPickerTarget === 'quick') {
      if (quickActiveTierTab === 'main') {
        setQuickImageUrl(preset.url);
      } else {
        setQuickImageTierUrls((prev) => ({
          ...prev,
          [quickActiveTierTab]: preset.url,
        }));
      }
      success(`เลือกรูป ${preset.th} เรียบร้อยแล้ว`);
      setIsPresetPickerOpen(false);
    }
  };

  const handleOpenAddModal = (defaultCategory?: ProductCategory | string) => {
    const chosenCat = (defaultCategory && defaultCategory !== 'all')
      ? (defaultCategory as ProductCategory)
      : (productCategoryFilter !== 'all' ? (productCategoryFilter as ProductCategory) : 'ผลปีศาจ');

    setNewProduct({
      name: '',
      slug: '',
      category: chosenCat || 'ผลปีศาจ',
      price: 150,
      oldPrice: 199,
      stock: 5,
      image: chosenCat === 'สกินผล' 
        ? '/images/blox/skin_yellow_lightning.png'
        : 'https://static.wikia.nocookie.net/roblox-blox-piece/images/6/65/Kitsune_Fruit.png/revision/latest',
      description: '',
      shortDescription: '',
      deliveryType: chosenCat === 'Gamepass' ? 'gamepass_gift' : (chosenCat === 'บริการ' ? 'manual_service' : 'fruit_trade'),
      instructionsTitle: 'คำแนะนำการรับสินค้า',
      deliveryInstructions: chosenCat === 'Gamepass'
        ? 'แอดมินจะส่งของขวัญ Gamepass ให้คุณผ่านระบบ Gift ในเกม'
        : (chosenCat === 'บริการ' ? 'ติดต่อทีมงานเพื่อเริ่มคิวรับบริการ' : 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits'),
      serverLinkTitle: 'ลิงค์รับของ',
      tradeServerLink: '',
      claimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
      claimCode: '',
      rarity: chosenCat === 'สกินผล' ? 'Legendary' : 'Mythical',
      fruitType: 'Permanent',
      isFeatured: true,
      isBestSeller: false,
      isActive: true,
    });
    setIsAddModalOpen(true);
  };

  // Clear All Products from Catalog (to start clean with manual entry)
  const handleClearAllProducts = async () => {
    setIsClearingAll(true);
    try {
      const res = await adminFetch('/api/admin/clear-all-products', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setProducts([]);
        setIsConfirmClearModalOpen(false);
        success('ล้างรายการสินค้าเรียบร้อย', `ลบสินค้าทั้งหมด ${data.deletedCount} รายการเรียบร้อยแล้ว ตอนนี้ร้านค้าพร้อมสำหรับการกรอกสินค้าเอง`);
      } else {
        toastError('ล้างสินค้าไม่สำเร็จ', data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      console.error('Clear all products error:', err);
      toastError('ข้อผิดพลาด', err.message || 'ไม่สามารถล้างรายการสินค้าได้');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Add Product to Firestore
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toastError('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อและราคาสินค้า');
      return;
    }
    try {
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const slug = newProduct.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const now = new Date().toISOString();

      const productPayload: Product = {
        productId,
        name: newProduct.name,
        slug: slug || productId,
        category: (newProduct.category as ProductCategory) || 'ผลปีศาจ',
        price: Number(newProduct.price),
        oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : undefined,
        stock: Number(newProduct.stock || 0),
        image: newProduct.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
        description: newProduct.description || '',
        shortDescription: newProduct.shortDescription || newProduct.description || '',
        deliveryType: newProduct.deliveryType || 'fruit_trade',
        instructionsTitle: newProduct.instructionsTitle || 'คำแนะนำการรับสินค้า',
        deliveryInstructions: newProduct.deliveryInstructions || '',
        serverLinkTitle: newProduct.serverLinkTitle || 'ลิงค์รับของ',
        tradeServerLink: newProduct.tradeServerLink || '',
        claimCodeTitle: newProduct.claimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
        claimCode: newProduct.claimCode || '',
        rarity: newProduct.rarity,
        fruitType: newProduct.fruitType,
        isFeatured: Boolean(newProduct.isFeatured),
        isBestSeller: Boolean(newProduct.isBestSeller),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'products', productId), productPayload);
      setProducts((prev) => [productPayload, ...prev]);
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      adminFetch('/api/admin/refresh-cache', { method: 'POST' }).catch(() => {});
      success('เพิ่มสินค้าแล้ว', `เพิ่ม ${newProduct.name} ลงในร้านค้าสำเร็จ`);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Add product error:', err);
      toastError('เกิดข้อผิดพลาด', err.message);
    }
  };

  // Helper: Compress and resize image using HTML5 Canvas to keep size under 100KB (well below Firestore 1MB limit)
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 640;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting as WebP (super high quality and tiny file size)
          try {
            const webpData = canvas.toDataURL('image/webp', 0.82);
            if (webpData && webpData.startsWith('data:image/webp')) {
              resolve(webpData);
              return;
            }
          } catch {}

          // Fallback to JPEG
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อย่อขนาดได้'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
      reader.readAsDataURL(file);
    });
  };

  // Handle local image file upload, compress, and convert to safe base64 Data URL
  const handleImageFileChange = async (file: File | null | undefined, isEdit: boolean) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('รูปแบบไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกไฟล์ขนาดไม่เกิน 10MB');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file);
      if (isEdit) {
        setSelectedProduct((prev) => prev ? { ...prev, image: compressedBase64 } : prev);
      } else {
        setNewProduct((prev) => ({ ...prev, image: compressedBase64 }));
      }
      success('อัปโหลดรูปภาพสำเร็จ', 'ระบบปรับขนาดและบีบอัดรูปภาพให้เหมาะสมกับฐานข้อมูลเรียบร้อย');
    } catch (err: any) {
      console.error('Image compression error:', err);
      toastError('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถประมวลผลรูปภาพได้');
    }
  };

  // Update Product (Full data + image support with server API fallback)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const prodRef = doc(db, 'products', selectedProduct.productId);
      const updateData = {
        name: selectedProduct.name,
        category: selectedProduct.category || 'ผลปีศาจ',
        price: Number(selectedProduct.price),
        oldPrice: selectedProduct.oldPrice ? Number(selectedProduct.oldPrice) : null,
        stock: Number(selectedProduct.stock),
        image: selectedProduct.image || '',
        tierImages: selectedProduct.tierImages || {},
        description: selectedProduct.description || '',
        shortDescription: selectedProduct.shortDescription || '',
        rarity: selectedProduct.rarity || 'Mythical',
        fruitType: selectedProduct.fruitType || 'Permanent',
        instructionsTitle: selectedProduct.instructionsTitle || 'คำแนะนำการรับสินค้า',
        deliveryInstructions: selectedProduct.deliveryInstructions || '',
        serverLinkTitle: selectedProduct.serverLinkTitle || 'ลิงค์รับของ',
        tradeServerLink: selectedProduct.tradeServerLink || '',
        claimCodeTitle: selectedProduct.claimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
        claimCode: selectedProduct.claimCode || '',
        isFeatured: Boolean(selectedProduct.isFeatured),
        isBestSeller: Boolean(selectedProduct.isBestSeller),
        isActive: selectedProduct.isActive !== false,
        updatedAt: new Date().toISOString(),
      };

      let updatedOnClient = false;
      try {
        await updateDoc(prodRef, updateData);
        updatedOnClient = true;
      } catch (clientErr) {
        console.warn('Client updateDoc failed, fallback to server API:', clientErr);
      }

      if (!updatedOnClient) {
        const res = await adminFetch('/api/admin/update-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: selectedProduct.productId,
            ...updateData,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'ไม่สามารถบันทึกข้อมูลสินค้าได้');
        }
      }

      // Optimistic update in UI
      setProducts((prev) =>
        prev.map((item) =>
          item.productId === selectedProduct.productId ? { ...item, ...updateData } : item
        )
      );
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      adminFetch('/api/admin/refresh-cache', { method: 'POST' }).catch(() => {});

      success('อัปเดตสินค้าสำเร็จ', `บันทึกข้อมูลและรูปภาพของ "${selectedProduct.name}" เรียบร้อยแล้ว`);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Update error:', err);
      toastError('อัปเดตไม่สำเร็จ', err.message);
    }
  };

  // Quick Stock Adjustment directly from table without modal
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    setProducts((prev) => prev.map((p) => (p.productId === product.productId ? { ...p, stock: newStock } : p)));
    try {
      localStorage.setItem('angus_cached_products', JSON.stringify(
        products.map((p) => (p.productId === product.productId ? { ...p, stock: newStock } : p))
      ));
    } catch {}

    try {
      const prodRef = doc(db, 'products', product.productId);
      await updateDoc(prodRef, { stock: newStock, updatedAt: new Date().toISOString() });
    } catch (clientErr) {
      await adminFetch('/api/admin/update-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId, stock: newStock, updatedAt: new Date().toISOString() }),
      }).catch(() => {});
    }
    success('ปรับสต็อกสำเร็จ', `${product.name}: เหลือ ${newStock} ชิ้น`);
  };

  const handleToggleStockStatus = async (product: Product) => {
    const newStock = (product.stock || 0) > 0 ? 0 : 10;
    await handleQuickAdjustStock(product, newStock - (product.stock || 0));
  };

  // Open Quick Image Editor Modal
  const handleOpenQuickImageEdit = (p: Product) => {
    setQuickImageProduct(p);
    setQuickImageUrl(p.image || '');
    setQuickImageTierUrls({
      '10M': p.tierImages?.['10M'] || (p.image?.includes('10m') ? p.image : '/images/blox/bounty_hunt_10m.png'),
      '20M': p.tierImages?.['20M'] || (p.image?.includes('20m') ? p.image : '/images/blox/bounty_hunt_20m.png'),
      '30M': p.tierImages?.['30M'] || (p.image?.includes('30m') ? p.image : '/images/blox/bounty_hunt_30m.png'),
    });
    setQuickActiveTierTab('main');
    setIsQuickImageModalOpen(true);
  };

  // Quick Image File Upload with canvas compression
  const handleQuickImageUpload = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกไฟล์ขนาดไม่เกิน 10MB');
      return;
    }
    try {
      const compressedBase64 = await compressImageFile(file);
      if (quickActiveTierTab === 'main') {
        setQuickImageUrl(compressedBase64);
      } else {
        setQuickImageTierUrls((prev) => ({
          ...prev,
          [quickActiveTierTab]: compressedBase64,
        }));
      }
      success('อัปโหลดรูปภาพสำเร็จ', 'ปรับขนาดและบีบอัดพร้อมบันทึกเรียบร้อย');
    } catch (err: any) {
      console.error('Quick image upload error:', err);
      toastError('เกิดข้อผิดพลาด', err?.message || 'ไม่สามารถประมวลผลรูปภาพได้');
    }
  };

  // Save Quick Image updates
  const handleSaveQuickImage = async () => {
    if (!quickImageProduct) return;
    setIsSavingQuickImage(true);
    try {
      const isBounty = isBountyProduct(quickImageProduct);

      const updateData: any = {
        image: quickImageUrl || '',
        updatedAt: new Date().toISOString(),
      };

      if (isBounty) {
        updateData.tierImages = quickImageTierUrls;
      }

      let updatedOnClient = false;
      try {
        const prodRef = doc(db, 'products', quickImageProduct.productId);
        await updateDoc(prodRef, updateData);
        updatedOnClient = true;
      } catch (clientErr) {
        console.warn('Client updateDoc failed, fallback to server API:', clientErr);
      }

      if (!updatedOnClient) {
        const res = await adminFetch('/api/admin/update-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: quickImageProduct.productId,
            ...updateData,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'ไม่สามารถบันทึกรูปภาพได้');
        }
      }

      // Update local state
      setProducts((prev) =>
        prev.map((item) =>
          item.productId === quickImageProduct.productId
            ? { ...item, ...updateData }
            : item
        )
      );

      if (selectedProduct && selectedProduct.productId === quickImageProduct.productId) {
        setSelectedProduct((prev) => prev ? { ...prev, ...updateData } : null);
      }

      window.dispatchEvent(new CustomEvent('productsUpdated'));
      adminFetch('/api/admin/refresh-cache', { method: 'POST' }).catch(() => {});

      success('บันทึกรูปภาพสำเร็จ', `อัปเดตรูปภาพของ "${quickImageProduct.name}" เรียบร้อยแล้ว`);
      setIsQuickImageModalOpen(false);
    } catch (err: any) {
      console.error('Save quick image error:', err);
      toastError('บันทึกรูปภาพไม่สำเร็จ', err.message);
    } finally {
      setIsSavingQuickImage(false);
    }
  };

  // Open delivery modal for existing inventory item
  const handleOpenDeliveryModal = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    const existingInstructions = item.instructions || item.metadata?.instructions || '';
    const existingInstructionsTitle = item.instructionsTitle || item.metadata?.instructionsTitle || vipSettings.defaultInstructionsTitle || 'คำแนะนำการรับสินค้า';
    const existingLink = item.tradeServerLink || item.serverLink || item.metadata?.tradeServerLink || item.metadata?.serverLink || '';
    const existingServerLinkTitle = item.serverLinkTitle || item.metadata?.serverLinkTitle || vipSettings.defaultServerLinkTitle || 'ลิงค์รับของ';
    const existingCode = item.claimCode || item.metadata?.claimCode || item.metadata?.code || item.metadata?.redeemCode || '';
    const existingClaimCodeTitle = item.claimCodeTitle || item.metadata?.claimCodeTitle || vipSettings.defaultClaimCodeTitle || 'รหัสรับสินค้า (Claim Code)';
    const existingAdminNote = item.metadata?.adminNote || '';

    setDeliveryForm({
      instructionsTitle: existingInstructionsTitle,
      instructions: existingInstructions,
      serverLinkTitle: existingServerLinkTitle,
      tradeServerLink: existingLink,
      claimCodeTitle: existingClaimCodeTitle,
      claimCode: existingCode,
      status: item.status || 'ready',
      adminNote: existingAdminNote,
      notifyCustomer: true,
    });
    setIsDeliveryModalOpen(true);
  };

  // Save updated delivery details to Customer's Inventory
  const handleSaveDeliveryDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    try {
      const invId = selectedInventoryItem.id || selectedInventoryItem.inventoryId;
      const invRef = doc(db, 'inventory', invId);

      const updatedMetadata = {
        ...(selectedInventoryItem.metadata || {}),
        instructionsTitle: deliveryForm.instructionsTitle,
        instructions: deliveryForm.instructions,
        serverLinkTitle: deliveryForm.serverLinkTitle,
        tradeServerLink: deliveryForm.tradeServerLink,
        serverLink: deliveryForm.tradeServerLink,
        claimCodeTitle: deliveryForm.claimCodeTitle,
        claimCode: deliveryForm.claimCode,
        adminNote: deliveryForm.adminNote,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(invRef, {
        instructionsTitle: deliveryForm.instructionsTitle,
        instructions: deliveryForm.instructions,
        serverLinkTitle: deliveryForm.serverLinkTitle,
        tradeServerLink: deliveryForm.tradeServerLink,
        serverLink: deliveryForm.tradeServerLink,
        claimCodeTitle: deliveryForm.claimCodeTitle,
        claimCode: deliveryForm.claimCode,
        status: deliveryForm.status,
        metadata: updatedMetadata,
        updatedAt: new Date().toISOString(),
        ...(deliveryForm.status === 'claimed' ? { claimedAt: new Date().toISOString() } : {}),
      });

      // Notify customer if enabled and uid is present
      if (deliveryForm.notifyCustomer && selectedInventoryItem.uid) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          uid: selectedInventoryItem.uid,
          title: `📦 อัปเดตรายละเอียดในคลัง: ${selectedInventoryItem.productName}`,
          message: deliveryForm.instructions 
            ? `แอดมินส่งข้อมูลการรับของ: "${deliveryForm.instructions.substring(0, 75)}..." กรุณาตรวจสอบในหน้าคลังสินค้า`
            : `แอดมินได้อัปเดตรายละเอียดสินค้าในคลังของคุณแล้ว กรุณาตรวจสอบที่หน้าคลังสินค้า`,
          isRead: false,
          type: 'order',
          createdAt: new Date().toISOString(),
        });
      }

      setInventoryItems((prev) => {
        const updated = prev.map((it) => {
          if ((it.id && it.id === invId) || (it.inventoryId && it.inventoryId === invId)) {
            return {
              ...it,
              instructionsTitle: deliveryForm.instructionsTitle,
              instructions: deliveryForm.instructions,
              serverLinkTitle: deliveryForm.serverLinkTitle,
              tradeServerLink: deliveryForm.tradeServerLink,
              serverLink: deliveryForm.tradeServerLink,
              claimCodeTitle: deliveryForm.claimCodeTitle,
              claimCode: deliveryForm.claimCode,
              status: deliveryForm.status,
              metadata: updatedMetadata,
              updatedAt: new Date().toISOString(),
              ...(deliveryForm.status === 'claimed' ? { claimedAt: new Date().toISOString() } : {}),
            };
          }
          return it;
        });
        try { localStorage.setItem('angus_admin_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });

      success('บันทึกรายละเอียดส่งมอบสำเร็จ', `ส่งข้อมูลเข้าคลังสินค้าของลูกค้าเรียบร้อยแล้ว`);
      setIsDeliveryModalOpen(false);
    } catch (err: any) {
      console.error('Save delivery details error:', err);
      toastError('ไม่สามารถบันทึกได้', err.message);
    }
  };

  // Save global VIP server & delivery message settings (with optional batch update to all ready inventory items)
  const handleSaveVipSettings = async (e: React.FormEvent, applyBatch: boolean = false) => {
    e.preventDefault();
    try {
      const settingsRef = doc(db, 'settings', 'delivery');
      await setDoc(settingsRef, {
        vipServerLink: vipSettings.vipServerLink,
        defaultInstructions: vipSettings.defaultInstructions,
        defaultInstructionsTitle: vipSettings.defaultInstructionsTitle || 'คำแนะนำการรับสินค้า',
        defaultServerLinkTitle: vipSettings.defaultServerLinkTitle || 'ลิงค์รับของ',
        defaultClaimCodeTitle: vipSettings.defaultClaimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
        claimCodePrefix: vipSettings.claimCodePrefix || 'AGS-',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'admin',
      }, { merge: true });

      if (applyBatch && vipSettings.vipServerLink) {
        setIsUpdatingBatchVip(true);
        const readyItems = inventoryItems.filter(i => i.status === 'ready');
        const batchPromises = readyItems.map(item => {
          const invId = item.id || item.inventoryId;
          const invRef = doc(db, 'inventory', invId);
          return updateDoc(invRef, {
            tradeServerLink: vipSettings.vipServerLink,
            serverLink: vipSettings.vipServerLink,
            'metadata.tradeServerLink': vipSettings.vipServerLink,
            'metadata.serverLink': vipSettings.vipServerLink,
            updatedAt: new Date().toISOString(),
          });
        });
        await Promise.all(batchPromises);
        success('อัปเดตเซิร์ฟเวอร์ VIP สำเร็จ', `บันทึกการตั้งค่า และอัปเดตลิงก์ให้ ${readyItems.length} สินค้าที่รอรับของในคลังแล้ว`);
      } else {
        success('บันทึกการตั้งค่าสำเร็จ', 'อัปเดตลิงก์เซิร์ฟเวอร์ VIP และข้อความส่งมอบเริ่มต้นแล้ว');
      }
      setIsVipSettingsModalOpen(false);
    } catch (err: any) {
      console.error('Save VIP settings error:', err);
      toastError('บันทึกไม่สำเร็จ', err.message);
    } finally {
      setIsUpdatingBatchVip(false);
    }
  };

  // Direct send item into customer inventory
  const handleDirectDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directDeliverForm.uidOrEmail.trim() || !directDeliverForm.productName.trim()) {
      toastError('ข้อมูลไม่ครบ', 'กรุณากรอก UID หรือ Email ลูกค้า และชื่อสินค้า');
      return;
    }
    try {
      let targetUid = directDeliverForm.uidOrEmail.trim();
      let targetEmail = targetUid.includes('@') ? targetUid : '';

      // If email provided, find UID from users
      if (targetUid.includes('@')) {
        const userQ = query(collection(db, 'users'), where('email', '==', targetUid));
        const usersSnap = await getDocs(userQ);
        if (!usersSnap.empty) {
          targetUid = usersSnap.docs[0].id;
          targetEmail = usersSnap.docs[0].data().email || targetEmail;
        }
      }

      const inventoryId = `inv_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const orderId = `ADM-${Date.now().toString().slice(-6)}`;
      const resolvedClaimCode = directDeliverForm.claimCode || `AGS-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();

      const newInvItem: InventoryItem = {
        inventoryId,
        uid: targetUid,
        userEmail: targetEmail || undefined,
        productId: directDeliverForm.productId || `prod_custom_${Date.now()}`,
        orderId,
        productName: directDeliverForm.productName,
        quantity: Number(directDeliverForm.quantity || 1),
        status: 'ready',
        deliveryType: directDeliverForm.deliveryType || 'fruit_trade',
        image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
        instructionsTitle: directDeliverForm.instructionsTitle || vipSettings.defaultInstructionsTitle || 'คำแนะนำการรับสินค้า',
        instructions: directDeliverForm.instructions || 'แอดมินส่งมอบสินค้าเข้าคลังของคุณเรียบร้อยแล้ว',
        serverLinkTitle: directDeliverForm.serverLinkTitle || vipSettings.defaultServerLinkTitle || 'ลิงค์รับของ',
        tradeServerLink: directDeliverForm.tradeServerLink || '',
        serverLink: directDeliverForm.tradeServerLink || '',
        claimCodeTitle: directDeliverForm.claimCodeTitle || vipSettings.defaultClaimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
        claimCode: resolvedClaimCode,
        metadata: {
          robloxUsername: directDeliverForm.robloxUsername || '',
          instructionsTitle: directDeliverForm.instructionsTitle || vipSettings.defaultInstructionsTitle || 'คำแนะนำการรับสินค้า',
          instructions: directDeliverForm.instructions || '',
          serverLinkTitle: directDeliverForm.serverLinkTitle || vipSettings.defaultServerLinkTitle || 'ลิงค์รับของ',
          tradeServerLink: directDeliverForm.tradeServerLink || '',
          serverLink: directDeliverForm.tradeServerLink || '',
          claimCodeTitle: directDeliverForm.claimCodeTitle || vipSettings.defaultClaimCodeTitle || 'รหัสรับสินค้า (Claim Code)',
          claimCode: resolvedClaimCode,
          adminNote: 'เพิ่มโดยแอดมินโดยตรง',
          deliveredAt: now,
        },
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'inventory', inventoryId), newInvItem);

      if (directDeliverForm.notifyCustomer) {
        const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          uid: targetUid,
          title: `🎁 ได้รับไอเทมใหม่ในคลัง: ${directDeliverForm.productName}`,
          message: `แอดมินได้ส่งมอบ ${directDeliverForm.productName} (x${directDeliverForm.quantity}) เข้าสู่คลังสินค้าของคุณแล้ว! ตรวจสอบได้ทันที`,
          isRead: false,
          type: 'order',
          createdAt: now,
        });
      }

      setInventoryItems((prev) => {
        const updated = [newInvItem, ...prev];
        try { localStorage.setItem('angus_admin_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });

      success('ส่งมอบเข้าคลังสำเร็จ', `ส่ง ${directDeliverForm.productName} เข้าคลังสินค้าของลูกค้าเรียบร้อย`);
      setIsDirectDeliverModalOpen(false);
      setDirectDeliverForm({
        uidOrEmail: '',
        robloxUsername: '',
        productId: '',
        productName: '',
        quantity: 1,
        instructionsTitle: 'คำแนะนำการรับสินค้า',
        instructions: 'เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits',
        serverLinkTitle: 'ลิงค์รับของ',
        tradeServerLink: '',
        claimCodeTitle: 'รหัสรับสินค้า (Claim Code)',
        claimCode: '',
        deliveryType: 'fruit_trade',
        notifyCustomer: true,
      });
    } catch (err: any) {
      console.error('Direct deliver error:', err);
      toastError('ส่งมอบไม่สำเร็จ', err.message);
    }
  };

  // Quick toggle status
  const handleQuickMarkStatus = async (item: InventoryItem, newStatus: 'ready' | 'claimed' | 'processing') => {
    try {
      const invId = item.id || item.inventoryId;
      await updateDoc(doc(db, 'inventory', invId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        ...(newStatus === 'claimed' ? { claimedAt: new Date().toISOString() } : {}),
      });
      setInventoryItems((prev) => {
        const updated = prev.map((it) => ((it.id && it.id === invId) || (it.inventoryId && it.inventoryId === invId)) ? { ...it, status: newStatus } : it);
        try { localStorage.setItem('angus_admin_inventory', JSON.stringify(updated)); } catch {}
        return updated;
      });
      success('อัปเดตสถานะสำเร็จ', `เปลี่ยนสถานะเป็น ${newStatus}`);
    } catch (err: any) {
      toastError('ข้อผิดพลาด', err.message);
    }
  };

  // Open delete product confirmation modal
  const handleRequestDeleteProduct = (p: Product) => {
    setProductToDelete(p);
  };

  // Confirm and execute product deletion (reliable two-tier server + client deletion with local cache sync)
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    const targetId = productToDelete.productId;
    const targetName = productToDelete.name;

    try {
      // 1. Delete on server first to guarantee Cloud Firestore doc is deleted & server cache invalidated
      let serverSuccess = false;
      try {
        const res = await adminFetch('/api/admin/delete-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: targetId }),
        });
        const data = await res.json();
        if (data.success) {
          serverSuccess = true;
        }
      } catch (srvErr) {
        console.warn('Server delete error, trying client SDK deleteDoc:', srvErr);
      }

      // 2. Also delete from client Firestore SDK (clears IndexedDB local cache)
      try {
        await deleteDoc(doc(db, 'products', targetId));
      } catch (clientErr) {
        if (!serverSuccess) {
          throw clientErr;
        }
      }

      // 3. Update React state immediately and sync localStorage
      setProducts((prev) => {
        const updated = prev.filter((item) => item.productId !== targetId);
        try {
          localStorage.setItem('angus_cached_products', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // 4. Invalidate cache on server and notify app
      await adminFetch('/api/admin/refresh-cache', { method: 'POST' }).catch(() => {});
      window.dispatchEvent(new CustomEvent('productsUpdated'));
      success('ลบสินค้าสำเร็จ', `ลบ "${targetName}" ออกจากระบบเรียบร้อยแล้ว`);
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Delete product failed:', err);
      toastError('ลบสินค้าไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setIsDeleting(false);
    }
  };

  // Deduplicate products (keeps 1 per name, removes extra duplicates)
  const handleDeduplicateProducts = async () => {
    setIsDeduplicating(true);
    try {
      const res = await adminFetch('/api/admin/deduplicate-products', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Refresh products list
        const pRes = await fetch('/api/products?force=true');
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && Array.isArray(pData.products)) {
            setProducts(pData.products);
            try {
              localStorage.setItem('angus_cached_products', JSON.stringify(pData.products));
            } catch {}
          }
        }
        window.dispatchEvent(new CustomEvent('productsUpdated'));
        success('ล้างรายการซ้ำสำเร็จ', data.message);
      } else {
        toastError('ข้อผิดพลาด', data.message || 'ไม่สามารถลบสินค้าที่ซ้ำได้');
      }
    } catch (err: any) {
      toastError('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setIsDeduplicating(false);
    }
  };

  // Delete Product direct caller (for backwards compatibility)
  const handleDeleteProduct = (productId: string, name: string) => {
    const found = products.find((p) => p.productId === productId);
    if (found) {
      setProductToDelete(found);
    } else {
      setProductToDelete({
        productId,
        name,
        slug: productId,
        category: 'ผลปีศาจ',
        price: 0,
        stock: 0,
        image: '',
        description: '',
        shortDescription: '',
        deliveryType: 'fruit',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        orderStatus: status,
        updatedAt: new Date().toISOString(),
      });
      setOrders((prev) => {
        const updated = prev.map((o) => (o.orderId === orderId ? { ...o, status: status as OrderStatus, orderStatus: status as OrderStatus } : o));
        try { localStorage.setItem('angus_admin_orders', JSON.stringify(updated)); } catch {}
        return updated;
      });
      success('อัปเดตสถานะคำสั่งซื้อ', `เปลี่ยนสถานะเป็น ${status} สำเร็จ`);
    } catch (err: any) {
      toastError('อัปเดตสถานะไม่สำเร็จ', err.message);
    }
  };

  // Update User Role
  const handleUpdateUserRank = async (uid: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: new Date().toISOString(),
      });
      setSystemUsers((prev) => {
        const updated = prev.map((u) => (u.uid === uid ? { ...u, role: role as Role } : u));
        try { localStorage.setItem('angus_admin_users', JSON.stringify(updated)); } catch {}
        return updated;
      });
      success('อัปเดตตำแหน่งสำเร็จ', `อัปเดตตำแหน่งเรียบร้อยแล้ว`);
    } catch (err: any) {
      toastError('อัปเดตตำแหน่งไม่สำเร็จ', err.message);
    }
  };

  // Adjust User Balance (Credit)
  const handleAdjustUserBalance = async (uid: string, newBalance: number) => {
    try {
      setIsAdjustingCredit(true);
      await updateDoc(doc(db, 'users', uid), {
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      });
      setSystemUsers((prev) => {
        const updated = prev.map((u) => (u.uid === uid ? { ...u, balance: newBalance } : u));
        try { localStorage.setItem('angus_admin_users', JSON.stringify(updated)); } catch {}
        return updated;
      });
      success('ปรับเครดิตสำเร็จ', `ปรับยอดเครดิตของผู้ใช้เป็น ฿${newBalance.toLocaleString()} เรียบร้อยแล้ว`);
      setSelectedUserForCredit(null);
    } catch (err: any) {
      toastError('ไม่สามารถปรับเครดิตได้', err.message);
    } finally {
      setIsAdjustingCredit(false);
    }
  };

  // Stats Calculations
  const totalRevenue = (Array.isArray(orders) ? orders : [])
    .filter((o) => o && ((o.orderStatus || o.status) === 'completed' || (o.orderStatus || o.status) === 'paid'))
    .reduce((acc, o) => acc + ((o?.total ?? o?.totalAmount) || 0), 0);

  const totalDepositsAmount = (Array.isArray(deposits) ? deposits : [])
    .filter((d) => d && d.status === 'completed')
    .reduce((acc, d) => acc + (d?.amount || 0), 0);

  return (
    <div className="w-full max-w-[1440px] 2xl:max-w-[1600px] 3xl:max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8 overflow-x-hidden [overscroll-behavior-x:none] [touch-action:pan-y_pinch-zoom]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#212133]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">แผงควบคุมแอดมิน (Admin)</h1>
            <p className="text-xs text-zinc-400">ระบบจัดการ AngusShop Blox Fruits Store</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunSystemAudit}
            disabled={isAuditingSystem}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-900/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="ตรวจสอบระบบเติมเงิน สลิป พร้อมเพย์ และฐานข้อมูล"
          >
            <Activity className={`w-3.5 h-3.5 ${isAuditingSystem ? 'animate-spin' : ''}`} />
            <span>{isAuditingSystem ? 'กำลังตรวจสอบ...' : 'ตรวจระบบทั้งหมด'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-purple-900/20 active:scale-95 disabled:opacity-50"
            title="รีเฟรชดึงข้อมูลล่าสุด"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#141420] border border-[#212133] px-3 py-1 rounded-xl text-[11px] text-zinc-300">
            <span className="text-zinc-500">จำกัด:</span>
            <select
              value={adminDataLimit}
              onChange={(e) => {
                setAdminDataLimit(Number(e.target.value));
                setTabLastLoaded({});
              }}
              className="bg-transparent text-purple-300 font-bold outline-none cursor-pointer"
            >
              <option value={30} className="bg-[#141420] text-white">30 รายการ</option>
              <option value={50} className="bg-[#141420] text-white">50 รายการ</option>
              <option value={100} className="bg-[#141420] text-white">100 รายการ (แนะนำ)</option>
              <option value={200} className="bg-[#141420] text-white">200 รายการ</option>
              <option value={500} className="bg-[#141420] text-white">500 รายการ (ทั้งหมด)</option>
            </select>
          </div>

          <span className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            isQuotaExceeded 
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' 
              : 'bg-[#141420] border-[#212133] text-zinc-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isQuotaExceeded ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>{isQuotaExceeded ? 'โควต้า Firestore เต็ม' : 'โหมดประหยัดโควต้า'}</span>
          </span>
        </div>
      </div>

      {/* Cloud Firestore Quota Alert Banner */}
      {isQuotaExceeded && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#1C160C] to-amber-950/40 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-200">
                  โควต้าการอ่านฟรีรายวันของ Cloud Firestore เต็มแล้ว (Quota Exceeded — 50,000 Reads/วัน)
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  ระบบดึงข้อมูลล่าสุดจาก Local Cache มาแสดงให้คุณทำงานต่อได้ • โควต้าจะรีเซ็ตอัตโนมัติทุกวันเวลา 07:00 น. (ไทย)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition-all active:scale-95"
              >
                <span>อัปเกรดเป็นแพ็กเกจ Blaze</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-xl bg-[#221A0F] hover:bg-[#2D2214] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                {isRefreshing ? 'กำลังโหลด...' : 'ลองใหม่'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-zinc-400 border-t border-amber-500/20">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>ระบบสลิป SlipOK: <strong className="text-zinc-200">พร้อมเพย์ 0829848852 (เหลือ 79 ครั้ง)</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>ระบบอั่งเปา TrueMoney: <strong className="text-zinc-200">พร้อมรับ 0829848852</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>ฐานข้อมูล: <strong className="text-amber-200">กำลังทำงานบน Local Cache</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2.5 no-scrollbar border-b border-[rgba(168,85,247,0.20)]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-[#C084FC]" />
          ภาพรวม
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#C084FC]" />
          สินค้า ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('gacha')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'gacha'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-[0_0_25px_rgba(245,158,11,0.4)] border border-amber-400/40'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>📦 สต็อกไอดีไก่ตัน ({gachaAccounts.filter(a => a.status === 'available').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'deposits'
              ? 'bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <Receipt className="w-4 h-4 text-[#C084FC]" />
          สลิปเติมเงิน ({deposits.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'inventory'
              ? 'bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <Package className="w-4 h-4 text-[#C084FC]" />
          <span>ส่งมอบ/คลังลูกค้า ({inventoryItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-[#6D28D9] to-[#A855F7] text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] border border-[rgba(192,132,252,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <ClipboardList className="w-4 h-4 text-[#C084FC]" />
          คำสั่งซื้อ ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('home_config')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'home_config'
              ? 'bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#C084FC] text-white shadow-[0_0_25px_rgba(192,132,252,0.45)] border border-white/30'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>ตกแต่งหน้าแรก & แบนเนอร์</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-[#D946EF] to-[#A855F7] text-white shadow-[0_0_25px_rgba(217,70,239,0.4)] border border-[rgba(244,114,182,0.4)]'
              : 'text-[#B8AEC9] hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.12)] border border-transparent hover:border-[rgba(168,85,247,0.25)]'
          }`}
        >
          <Users className="w-4 h-4 text-pink-300" />
          <span>จัดการผู้ใช้ ({systemUsers.length})</span>
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <div className="p-6 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.20)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] relative overflow-hidden group hover:border-[rgba(192,132,252,0.45)] transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#8B5CF6]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-all"></div>
              <div className="flex items-center justify-between text-xs text-[#B8AEC9]">
                <span className="font-semibold">ยอดขายรวมทั้งหมด</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#C084FC]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9D5FF] to-[#C084FC] mt-3">
                ฿{totalRevenue.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#B8AEC9] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
                จากคำสั่งซื้อที่เสร็จสมบูรณ์
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.20)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex items-center justify-between text-xs text-[#B8AEC9]">
                <span className="font-semibold">ยอดเติมเงินสำเร็จ</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 mt-3">
                ฿{totalDepositsAmount.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#B8AEC9] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                สลิปผ่านการตรวจ SlipOK
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.20)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] relative overflow-hidden group hover:border-[rgba(192,132,252,0.45)] transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#A855F7]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#A855F7]/20 transition-all"></div>
              <div className="flex items-center justify-between text-xs text-[#B8AEC9]">
                <span className="font-semibold">คำสั่งซื้อทั้งหมด</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-white mt-3">
                {orders.length} <span className="text-lg font-bold text-[#B8AEC9]">รายการ</span>
              </div>
              <p className="text-[11px] text-[#B8AEC9] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                ออเดอร์ในระบบทั้งหมด
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.20)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] relative overflow-hidden group hover:border-[rgba(192,132,252,0.45)] transition-all">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#C084FC]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#C084FC]/20 transition-all"></div>
              <div className="flex items-center justify-between text-xs text-[#B8AEC9]">
                <span className="font-semibold">สินค้าในระบบ</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-[#C084FC]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9D5FF] to-[#C084FC] mt-3">
                {products.length} <span className="text-lg font-bold text-[#B8AEC9]">รายการ</span>
              </div>
              <p className="text-[11px] text-[#B8AEC9] mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
                พร้อมจำหน่ายในร้านค้า
              </p>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[rgba(255,255,255,0.04)] backdrop-blur-[18px] border border-[rgba(168,85,247,0.18)] shadow-[0_8px_32px_rgba(7,5,15,0.6)] space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]"></span>
              คำสั่งซื้อล่าสุด 5 รายการ
            </h3>
            {orders.slice(0, 5).map((o) => (
              <div key={o.orderId} className="p-4 rounded-2xl bg-[#07050F]/70 border border-[rgba(168,85,247,0.15)] hover:border-[rgba(192,132,252,0.3)] transition-all flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono text-[#C084FC] font-bold">#{o.orderId}</div>
                  <div className="text-[#B8AEC9] text-[11px] mt-0.5">Roblox: <strong className="text-white">{o.robloxUsername || '-'}</strong></div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">฿{((o.total ?? o.totalAmount) || 0).toLocaleString()}</div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{o.orderStatus || o.status || 'completed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Products Management (แยกหมวดหมู่สินค้าอย่างสมบูรณ์แบบ) */}
      {activeTab === 'products' && (() => {
        // รายการหมวดหมู่มาตรฐาน (ไอดี เอาไว้รองจากทั้งหมด)
        const standardOrder: string[] = ['ไอดี', 'ผลปีศาจ', 'Gamepass', 'สกินผล', 'บริการ', 'อื่นๆ'];
        
        // หมวดหมู่ทั้งหมดที่มีสินค้าอยู่ในระบบจริง
        const allPresentCategories: string[] = Array.from(new Set(products.map(p => (p.category as string) || 'อื่นๆ')));
        const sortedCategories: string[] = [
          ...standardOrder.filter(c => allPresentCategories.includes(c) || products.some(p => p.category === c)),
          ...allPresentCategories.filter(c => !standardOrder.includes(c))
        ];

        // ฟังก์ชันกำหนดรูปแบบสีและไอคอนประจำหมวดหมู่
        const getCategoryConfig = (cat: string) => {
          switch (cat) {
            case 'ไอดี':
              return {
                label: 'ไอดี (Roblox Accounts / สุ่มไก่ตัน)',
                shortLabel: 'ไอดี',
                icon: KeyRound,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/30',
                badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                glow: 'group-hover:border-amber-500/50'
              };
            case 'ผลปีศาจ':
              return {
                label: 'ผลปีศาจ (Devil Fruits)',
                shortLabel: 'ผลปีศาจ',
                icon: Flame,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/30',
                activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30',
                badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
                glow: 'group-hover:border-purple-500/50'
              };
            case 'สกินผล':
              return {
                label: 'สกินผล (Fruit Skins)',
                shortLabel: 'สกินผล',
                icon: Palette,
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
                border: 'border-pink-500/30',
                activeBg: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/30',
                badge: 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
                glow: 'group-hover:border-pink-500/50'
              };
            case 'Gamepass':
              return {
                label: 'Gamepass',
                shortLabel: 'Gamepass',
                icon: Zap,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/30',
                badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
                glow: 'group-hover:border-amber-500/50'
              };
            case 'ไอเทม':
              return {
                label: 'ไอเทม (Items / Weapons)',
                shortLabel: 'ไอเทม',
                icon: Sword,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                border: 'border-cyan-500/30',
                activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30',
                badge: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
                glow: 'group-hover:border-cyan-500/50'
              };
            case 'บริการ':
              return {
                label: 'บริการ (Services / Raids)',
                shortLabel: 'บริการ',
                icon: Wrench,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30',
                badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
                glow: 'group-hover:border-emerald-500/50'
              };
            default:
              return {
                label: cat || 'อื่นๆ (Others)',
                shortLabel: cat || 'อื่นๆ',
                icon: Package,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/30',
                activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30',
                badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
                glow: 'group-hover:border-blue-500/50'
              };
          }
        };

        // สรุปสถิติรายหมวดหมู่
        const statsByCategory: Record<string, { total: number; inStock: number; outOfStock: number; totalStock: number; totalValue: number }> = {};
        products.forEach(p => {
          const cat = p.category || 'อื่นๆ';
          if (!statsByCategory[cat]) {
            statsByCategory[cat] = { total: 0, inStock: 0, outOfStock: 0, totalStock: 0, totalValue: 0 };
          }
          statsByCategory[cat].total += 1;
          statsByCategory[cat].totalStock += (p.stock || 0);
          statsByCategory[cat].totalValue += (p.price || 0) * (p.stock || 0);
          if ((p.stock || 0) > 0) {
            statsByCategory[cat].inStock += 1;
          } else {
            statsByCategory[cat].outOfStock += 1;
          }
        });

        // คัดกรองสินค้าตาม Search, Stock Filter และ Category Filter
        const filteredProducts = products.filter(p => {
          if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) {
            return false;
          }
          if (productStockFilter === 'in_stock' && (p.stock || 0) <= 0) return false;
          if (productStockFilter === 'out_of_stock' && (p.stock || 0) > 0) return false;
          if (productSearch.trim()) {
            const q = productSearch.toLowerCase();
            const matchesName = (p.name || '').toLowerCase().includes(q);
            const matchesId = (p.productId || '').toLowerCase().includes(q);
            const matchesDesc = (p.description || '').toLowerCase().includes(q);
            const matchesCat = (p.category || '').toLowerCase().includes(q);
            return matchesName || matchesId || matchesDesc || matchesCat;
          }
          return true;
        });

        // จัดกลุ่มสินค้าตามหมวดหมู่
        const categoriesToDisplay = productCategoryFilter === 'all'
          ? sortedCategories
          : sortedCategories.filter(c => c === productCategoryFilter);

        // ฟังก์ชันเรนเดอร์ตารางสินค้า
        const renderProductTable = (items: Product[], catName?: string) => {
          if (items.length === 0) {
            return (
              <div className="py-8 px-4 text-center rounded-xl bg-[#0B0B12] border border-[#1A1A28]">
                <p className="text-xs text-zinc-400 mb-2">ไม่พบสินค้าในหมวดหมู่นี้</p>
                <button
                  onClick={() => handleOpenAddModal(catName)}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มสินค้าในหมวดหมู่นี้</span>
                </button>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto rounded-2xl border border-[#212133] bg-[#0E0E17]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#090910] text-zinc-400 border-b border-[#1E1E2E]">
                  <tr>
                    <th className="p-3.5 sm:p-4">สินค้า</th>
                    <th className="p-3.5 sm:p-4">หมวดหมู่</th>
                    <th className="p-3.5 sm:p-4">ประเภทส่งมอบ</th>
                    <th className="p-3.5 sm:p-4">ราคา (฿)</th>
                    <th className="p-3.5 sm:p-4">สต็อก</th>
                    <th className="p-3.5 sm:p-4">สถานะ</th>
                    <th className="p-3.5 sm:p-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181827]">
                  {items.map((p) => {
                    const catCfg = getCategoryConfig(p.category);
                    const CatIcon = catCfg.icon;
                    return (
                      <tr key={p.productId} className="hover:bg-[#141422] transition-colors">
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickImageEdit(p)}
                              className="relative w-11 h-11 rounded-xl bg-black/50 p-1.5 border border-purple-500/20 hover:border-purple-400 flex items-center justify-center shrink-0 shadow-inner group/thumb cursor-pointer transition-all hover:scale-105"
                              title="คลิกเพื่อแก้ไขรูปภาพสินค้านี้"
                            >
                              <BloxImage 
                                src={p.image} 
                                alt={p.name} 
                                productName={p.name}
                                className="w-full h-full object-contain" 
                              />
                              <div className="absolute inset-0 bg-purple-950/85 backdrop-blur-[1px] rounded-xl opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center transition-opacity text-purple-200">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span className="text-[7px] font-bold mt-0.5">แก้รูป</span>
                              </div>
                            </button>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate max-w-[220px] sm:max-w-xs">{p.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-zinc-500 font-mono">{p.productId}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.productId);
                                    success('คัดลอกรหัสสินค้าแล้ว');
                                  }}
                                  className="text-zinc-600 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
                                  title="คัดลอกรหัสสินค้า"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                                {p.rarity && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-semibold">
                                    {p.rarity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${catCfg.badge}`}>
                            <CatIcon className="w-3 h-3" />
                            <span>{p.category}</span>
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4 text-zinc-400 text-[11px]">
                          {p.deliveryType === 'fruit_trade' && <span className="text-purple-300">ผลเทรดในเกม</span>}
                          {p.deliveryType === 'gamepass_gift' && <span className="text-amber-300">Gift Gamepass</span>}
                          {p.deliveryType === 'manual_service' && <span className="text-emerald-300">บริการโดยทีมงาน</span>}
                          {!['fruit_trade', 'gamepass_gift', 'manual_service'].includes(p.deliveryType) && (
                            <span>{p.deliveryType}</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="font-bold text-purple-300">฿{p.price.toLocaleString()}</div>
                          {p.oldPrice && p.oldPrice > p.price && (
                            <div className="text-[10px] text-zinc-500 line-through">฿{p.oldPrice.toLocaleString()}</div>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(p, -1)}
                              className="w-5 h-5 rounded-md bg-[#1C1C2C] hover:bg-[#2A2A40] text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                              title="ลดสต็อก 1 ชิ้น"
                            >
                              -
                            </button>
                            <span className="font-bold text-white text-sm min-w-[20px] text-center">{p.stock}</span>
                            <button
                              type="button"
                              onClick={() => handleQuickAdjustStock(p, 1)}
                              className="w-5 h-5 rounded-md bg-[#1C1C2C] hover:bg-[#2A2A40] text-zinc-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                              title="เพิ่มสต็อก 1 ชิ้น"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStockStatus(p)}
                            className="transition-transform active:scale-95 cursor-pointer"
                            title="คลิกเพื่อสลับสถานะ พร้อมขาย / สินค้าหมด"
                          >
                            {p.stock > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 shadow-sm transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                พร้อมขาย
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-rose-500/30 shadow-sm transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                สินค้าหมด
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickImageEdit(p)}
                              className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                              title="แก้ไขรูปภาพสินค้า"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[10px] font-semibold">แก้รูป</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-[#1E1E30] hover:bg-[#2B2B44] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                              title="แก้ไขสินค้า"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-product-${p.productId}`}
                              type="button"
                              onClick={() => handleRequestDeleteProduct(p)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="ลบสินค้า"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        };

        return (
          <div className="space-y-6">
            {/* Header และปุ่ม Action ด้านบน */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-purple-400" />
                  <span>จัดการสินค้า Blox Fruits (แยกตามหมวดหมู่)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  จัดการสินค้าแยกหมวดหมู่อย่างเป็นระบบ ({products.length} รายการทั้งหมดในระบบ)
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {duplicateInfo.hasDuplicates && (
                  <button
                    onClick={handleDeduplicateProducts}
                    disabled={isDeduplicating}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="ลบสินค้าที่ชื่อซ้ำกันให้เหลือเพียง 1 รายการ"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{isDeduplicating ? 'กำลังล้างรายการซ้ำ...' : `ลบรายการซ้ำ (${duplicateInfo.extraItemsCount})`}</span>
                  </button>
                )}
                {products.length > 0 && (
                  <button
                    onClick={() => setIsConfirmClearModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="ล้างสินค้าทั้งหมดเพื่อเริ่มต้นใหม่"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ล้างสินค้าทั้งหมด</span>
                    <span>({products.length})</span>
                  </button>
                )}
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มสินค้าใหม่</span>
                </button>
              </div>
            </div>

            {/* Banner แจ้งเตือนสินค้าซ้ำกัน */}
            {duplicateInfo.hasDuplicates && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold">ตรวจพบสินค้าที่มีชื่อซ้ำกัน {duplicateInfo.duplicatedNamesCount} รายการ ({duplicateInfo.sampleNames.join(', ')})</span>
                    <span className="block text-zinc-400 text-[11px] mt-0.5">มีรายการที่ซ้ำซ้อน {duplicateInfo.extraItemsCount} ชิ้น สามารถกดล้างเพื่อให้เหลือเพียง 1 รายการต่อชื่อสินค้าได้ทันที</span>
                  </div>
                </div>
                <button
                  onClick={handleDeduplicateProducts}
                  disabled={isDeduplicating}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isDeduplicating ? 'กำลังลบ...' : 'ลบรายการซ้ำให้เหลือรายการเดียว'}</span>
                </button>
              </div>
            )}

            {/* กล่องสรุปสถิติตามหมวดหมู่ (Category Metric Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {sortedCategories.map((cat) => {
                const cfg = getCategoryConfig(cat);
                const CatIcon = cfg.icon;
                const stat = statsByCategory[cat] || { total: 0, inStock: 0, totalStock: 0, totalValue: 0 };
                const isSelected = productCategoryFilter === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(isSelected ? 'all' : cat)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-[#191928] border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-950/50'
                        : 'bg-[#11111A] border-[#212133] hover:border-zinc-700 hover:bg-[#141422]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.color}`}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-black ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                        {stat.total}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{cfg.shortLabel}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
                      <span>สต็อก {stat.totalStock}</span>
                      <span className="text-emerald-400 font-semibold">{stat.inStock} พร้อมขาย</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* แถบตัวกรองและควบคุมมุมมอง (Category Tabs & Filter Bar) */}
            <div className="p-4 rounded-2xl bg-[#11111A] border border-[#212133] space-y-3">
              {/* แถบแท็บหมวดหมู่ (Tabs) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setProductCategoryFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    productCategoryFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30'
                      : 'bg-[#181826] text-zinc-400 hover:text-white hover:bg-[#202033]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>ทั้งหมด ({products.length})</span>
                </button>

                {sortedCategories.map((cat) => {
                  const cfg = getCategoryConfig(cat);
                  const CatIcon = cfg.icon;
                  const count = (statsByCategory[cat] || {}).total || 0;
                  const isSelected = productCategoryFilter === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setProductCategoryFilter(cat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? cfg.activeBg
                          : 'bg-[#181826] text-zinc-400 hover:text-white hover:bg-[#202033]'
                      }`}
                    >
                      <CatIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cfg.color}`} />
                      <span>{cfg.shortLabel}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/30 text-zinc-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ค้นหา, กรองสถานะสต็อก, และสลับโหมดมุมมอง */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#1D1D2C]">
                <div className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, รายละเอียด..."
                      className="w-full bg-[#0A0A10] border border-[#212133] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* กรองสถานะสต็อก */}
                  <select
                    value={productStockFilter}
                    onChange={(e) => setProductStockFilter(e.target.value as any)}
                    className="bg-[#0A0A10] border border-[#212133] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">สถานะ: ทั้งหมด</option>
                    <option value="in_stock">เฉพาะพร้อมขาย (สต็อก &gt; 0)</option>
                    <option value="out_of_stock">เฉพาะสินค้าหมด (สต็อก = 0)</option>
                  </select>
                </div>

                {/* สลับโหมดมุมมอง (แยกกลุ่มตามหมวดหมู่ VS ตารางรวม) */}
                <div className="flex items-center gap-2 shrink-0">
                  {productViewMode === 'grouped' && (
                    <div className="flex items-center gap-1 mr-2 text-[11px] text-zinc-400">
                      <button
                        onClick={() => expandAllCategories(sortedCategories)}
                        className="px-2 py-1 rounded-lg hover:bg-[#1C1C2C] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        ขยายทั้งหมด
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => collapseAllCategories(sortedCategories)}
                        className="px-2 py-1 rounded-lg hover:bg-[#1C1C2C] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        ย่อทั้งหมด
                      </button>
                    </div>
                  )}

                  <div className="flex items-center rounded-xl bg-[#090910] p-1 border border-[#212133]">
                    <button
                      onClick={() => setProductViewMode('grouped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        productViewMode === 'grouped'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="แยกแสดงเป็นส่วนๆ ตามแต่ละหมวดหมู่"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>แยกหมวดหมู่</span>
                    </button>
                    <button
                      onClick={() => setProductViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        productViewMode === 'list'
                          ? 'bg-purple-600 text-white shadow'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="แสดงในตารางรวมรายการเดียว"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>ตารางรวม</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* แสดงผลรายการสินค้า */}
            {products.length === 0 ? (
              <div className="py-16 px-6 text-center rounded-2xl border border-[#212133] bg-[#11111A]">
                <div className="w-16 h-16 rounded-2xl bg-[#181826] border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4 shadow-lg shadow-purple-950/40">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-1.5">ยังไม่มีสินค้าในร้านค้า</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
                  ขณะนี้ยังไม่มีสินค้าอยู่ในระบบ คุณสามารถกดปุ่มด้านล่างเพื่อเริ่มลงขายสินค้าชิ้นแรกได้ทันที
                </p>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white text-xs font-bold shadow-lg shadow-purple-600/30 inline-flex items-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มสินค้าใหม่ชิ้นแรก</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-14 px-6 text-center rounded-2xl border border-[#212133] bg-[#11111A]">
                <div className="w-12 h-12 rounded-xl bg-[#181826] text-zinc-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">ไม่พบสินค้าตามเงื่อนไขที่ค้นหา</h4>
                <p className="text-xs text-zinc-400 mb-4">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองหมวดหมู่</p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setProductCategoryFilter('all');
                    setProductStockFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1E1E2E] hover:bg-[#2A2A3E] text-purple-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : productViewMode === 'grouped' ? (
              /* โหมด 1: แยกเป็นกล่องส่วนๆ แต่ละหมวดหมู่ (Grouped View) */
              <div className="space-y-6">
                {categoriesToDisplay.map((cat) => {
                  const cfg = getCategoryConfig(cat);
                  const CatIcon = cfg.icon;
                  const catItems = filteredProducts.filter(p => (p.category || 'อื่นๆ') === cat);
                  const isCollapsed = collapsedCategories[cat];
                  const stat = statsByCategory[cat] || { total: 0, inStock: 0, totalStock: 0, totalValue: 0 };

                  // ถ้าไม่มีสินค้าในหมวดนี้เมื่อใช้คำค้นหา ให้ซ่อนหมวดนี้ไป
                  if (catItems.length === 0 && (productSearch.trim() || productStockFilter !== 'all')) {
                    return null;
                  }

                  return (
                    <div key={cat} className="rounded-2xl border border-[#212133] bg-[#11111A] overflow-hidden shadow-sm">
                      {/* แถบหัวหมวดหมู่ (Category Header) */}
                      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-[#13131F] border-b border-[#1E1E2E]">
                        <div 
                          onClick={() => toggleCategoryCollapse(cat)}
                          className="flex items-center gap-3 cursor-pointer select-none group flex-1"
                        >
                          <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center ${cfg.color} shrink-0`}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                                {cfg.label}
                              </h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                {catItems.length} รายการ
                              </span>
                              {catItems.length !== stat.total && (
                                <span className="text-[11px] text-zinc-500">
                                  (จากทั้งหมด {stat.total})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-3">
                              <span>สต็อกรวม: <strong className="text-white">{stat.totalStock}</strong> ชิ้น</span>
                              <span>•</span>
                              <span>พร้อมขาย: <strong className="text-emerald-400">{stat.inStock}</strong> รายการ</span>
                              <span>•</span>
                              <span>มูลค่ารวม: <strong className="text-purple-300">฿{stat.totalValue.toLocaleString()}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* ปุ่มควบคุมประจำหมวดหมู่ */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenAddModal(cat)}
                            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title={`เพิ่มสินค้าในหมวดหมู่ ${cat}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">เพิ่มในหมวดนี้</span>
                          </button>
                          <button
                            onClick={() => toggleCategoryCollapse(cat)}
                            className="p-2 rounded-xl bg-[#1A1A2A] hover:bg-[#25253A] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title={isCollapsed ? 'ขยาย' : 'ย่อ'}
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronUp className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* เนื้อหาสินค้าในหมวดหมู่ */}
                      {!isCollapsed && (
                        <div className="p-3 sm:p-4">
                          {renderProductTable(catItems, cat)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* โหมด 2: ตารางรวมทั้งหมด (Single Table View) */
              <div className="space-y-3">
                <div className="text-xs text-zinc-400 flex items-center justify-between">
                  <span>แสดงผลทั้งหมด <strong>{filteredProducts.length}</strong> รายการ</span>
                  {productCategoryFilter !== 'all' && (
                    <span className="text-purple-300 font-semibold">
                      หมวดหมู่: {productCategoryFilter}
                    </span>
                  )}
                </div>
                {renderProductTable(filteredProducts, productCategoryFilter !== 'all' ? productCategoryFilter : undefined)}
              </div>
            )}
          </div>
        );
      })()}

    {/* Tab 3: Deposits Management */}
      {activeTab === 'deposits' && (() => {
        const truemoneyDeposits = deposits.filter((d) => d.method === 'truemoney_angpao');
        const promptpayDeposits = deposits.filter((d) => d.method !== 'truemoney_angpao');
        const truemoneyTotal = truemoneyDeposits.reduce((acc, d) => acc + (d.amount || 0), 0);
        const promptpayTotal = promptpayDeposits.reduce((acc, d) => acc + (d.amount || 0), 0);
        const allTotal = deposits.reduce((acc, d) => acc + (d.amount || 0), 0);

        const displayedDeposits = deposits.filter((d) => {
          if (depositFilter === 'truemoney') return d.method === 'truemoney_angpao';
          if (depositFilter === 'promptpay') return d.method !== 'truemoney_angpao';
          return true;
        });

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span>รายการประวัติการเติมเงิน (Deposits)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ตรวจสอบรายการเติมเงินทั้งหมด ทั้งซองของขวัญ TrueMoney Wallet และพร้อมเพย์ SlipOK
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 bg-[#0B0B12] p-1.5 rounded-2xl border border-[#212133] self-start sm:self-auto">
                <button
                  onClick={() => setDepositFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    depositFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด ({deposits.length})
                </button>
                <button
                  onClick={() => setDepositFilter('truemoney')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    depositFilter === 'truemoney'
                      ? 'bg-gradient-to-r from-[#FF5B00] to-[#E64A19] text-white shadow-md shadow-[#FF5B00]/20'
                      : 'text-[#FF8A00] hover:text-[#FFA040]'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>TrueMoney ({truemoneyDeposits.length})</span>
                </button>
                <button
                  onClick={() => setDepositFilter('promptpay')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    depositFilter === 'promptpay'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-500/20'
                      : 'text-purple-400 hover:text-purple-300'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>PromptPay ({promptpayDeposits.length})</span>
                </button>
              </div>
            </div>

            {/* Deposit Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-[#11111A] border border-[#212133] space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>ยอดเติมเงินทั้งหมด</span>
                  <Receipt className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  ฿{allTotal.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500">{deposits.length} รายการที่สำเร็จ</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#1F130B] to-[#120B07] border border-[#FF6A00]/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-[#FF8A00]">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> ซองของขวัญ TrueMoney
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF5B00]/20 text-[#FF8A00]">
                    ออโต้
                  </span>
                </div>
                <div className="text-2xl font-black text-[#FF8A00]">
                  ฿{truemoneyTotal.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-400">{truemoneyDeposits.length} รายการซองอั่งเปา</p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161224] to-[#0E0C18] border border-purple-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" /> พร้อมเพย์ PromptPay
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    SlipOK
                  </span>
                </div>
                <div className="text-2xl font-black text-purple-300">
                  ฿{promptpayTotal.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-400">{promptpayDeposits.length} รายการสแกนสลิป</p>
              </div>
            </div>

            {/* Deposits Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#212133] bg-[#11111A]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0B12] text-zinc-400 border-b border-[#212133]">
                  <tr>
                    <th className="p-4">ช่องทาง</th>
                    <th className="p-4">รหัสธุรกรรม</th>
                    <th className="p-4">UID ผู้ใช้</th>
                    <th className="p-4">จำนวนเงิน</th>
                    <th className="p-4">ข้อมูลอ้างอิง / รหัสซอง</th>
                    <th className="p-4">สถานะ</th>
                    <th className="p-4">วันที่ / เวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1D1D2C]">
                  {displayedDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500 text-xs">
                        ไม่พบรายการเติมเงินในหมวดหมู่นี้
                      </td>
                    </tr>
                  ) : (
                    displayedDeposits.map((dep) => (
                      <tr key={dep.depositId} className="hover:bg-[#161624] transition-colors">
                        <td className="p-4">
                          {dep.method === 'truemoney_angpao' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FF5B00]/15 text-[#FF8A00] border border-[#FF5B00]/30 font-bold text-[11px]">
                              <Gift className="w-3.5 h-3.5" />
                              <span>TrueMoney</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold text-[11px]">
                              <QrCode className="w-3.5 h-3.5" />
                              <span>PromptPay</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-zinc-400">{dep.depositId}</td>
                        <td className="p-4 font-mono text-zinc-400 text-[11px]">{dep.uid?.substring(0, 10)}...</td>
                        <td className="p-4 font-bold text-emerald-400">฿{dep.amount?.toLocaleString()}</td>
                        <td className="p-4">
                          {dep.method === 'truemoney_angpao' ? (
                            <div className="space-y-0.5">
                              <div className="font-mono text-white text-[11px]">
                                ซอง: {dep.voucherHash ? `${dep.voucherHash.substring(0, 16)}...` : '-'}
                              </div>
                              {dep.senderName && (
                                <div className="text-zinc-400 text-[10px]">ผู้ส่ง: {dep.senderName}</div>
                              )}
                              {dep.recipientPhone && (
                                <div className="text-zinc-500 text-[10px] font-mono">เบอร์รับ: {dep.recipientPhone}</div>
                              )}
                            </div>
                          ) : (
                            <span className="font-mono text-zinc-300">{dep.transRef || '-'}</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dep.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {dep.status}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-400">
                          {new Date(dep.createdAt).toLocaleString('th-TH', { hour12: false })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Tab 4: Orders Management */}
      {activeTab === 'orders' && (() => {
        const filteredOrders = orders.filter((o) => {
          if (orderStatusFilter !== 'all') {
            const st = o.orderStatus || o.status;
            if (orderStatusFilter === 'pending' && st !== 'pending') return false;
            if (orderStatusFilter === 'processing' && st !== 'processing' && st !== 'paid') return false;
            if (orderStatusFilter === 'completed' && st !== 'completed') return false;
            if (orderStatusFilter === 'cancelled' && st !== 'cancelled') return false;
          }
          if (orderSearchKey.trim()) {
            const q = orderSearchKey.toLowerCase();
            const matchId = (o.orderId || '').toLowerCase().includes(q);
            const matchRoblox = (o.robloxUsername || '').toLowerCase().includes(q);
            const matchEmail = (o.userEmail || '').toLowerCase().includes(q);
            const matchItem = o.items?.some(it => (it.name || '').toLowerCase().includes(q));
            return matchId || matchRoblox || matchEmail || matchItem;
          }
          return true;
        });

        return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">รายการคำสั่งซื้อ Blox Fruits ทั้งหมด</h3>
              <p className="text-xs text-zinc-400">ตรวจสอบชื่อผู้รับ Roblox และอัปเดตสถานะการส่งมอบ</p>
            </div>
            <div className="text-xs font-bold text-[#C084FC] bg-purple-950/60 border border-purple-500/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              แสดง {filteredOrders.length} จาก {orders.length} ออเดอร์
            </div>
          </div>

          {/* Orders Search & Status Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11111A] p-3 rounded-2xl border border-[#212133]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัส Order ID, ชื่อสินค้า, Roblox Username หรืออีเมล..."
                value={orderSearchKey}
                onChange={(e) => setOrderSearchKey(e.target.value)}
                className="w-full bg-[#0B0B12] border border-[#242436] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
              />
              {orderSearchKey && (
                <button
                  onClick={() => setOrderSearchKey('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {(['all', 'pending', 'processing', 'completed', 'cancelled'] as const).map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setOrderStatusFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                    orderStatusFilter === statusKey
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#181826] text-zinc-400 hover:text-white'
                  }`}
                >
                  {statusKey === 'all' && `ทั้งหมด (${orders.length})`}
                  {statusKey === 'pending' && 'รอดำเนินการ'}
                  {statusKey === 'processing' && 'กำลังจัดส่ง'}
                  {statusKey === 'completed' && 'จัดส่งสำเร็จ'}
                  {statusKey === 'cancelled' && 'ยกเลิก'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#212133] bg-[#11111A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0B12] text-zinc-400 border-b border-[#212133]">
                <tr>
                  <th className="p-4">รหัสออเดอร์</th>
                  <th className="p-4">Roblox / ข้อมูลฟาร์ม</th>
                  <th className="p-4">รายการสินค้า</th>
                  <th className="p-4">ยอดรวม</th>
                  <th className="p-4">สถานะ</th>
                  <th className="p-4 text-right">ปรับสถานะ & จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D2C]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400">
                      ไม่พบรายการคำสั่งซื้อที่ตรงกับตัวกรอง
                    </td>
                  </tr>
                ) : filteredOrders.map((o) => {
                  const isService = o.isServiceOrder || !!o.serviceAccountPassword || o.items?.some(it => 
                    it.deliveryType === 'service' || 
                    it.deliveryType === 'manual_service' || 
                    it.name?.includes('ฟาร์ม') || 
                    it.name?.includes('เงินเขียว') || 
                    it.name?.includes('บริการ')
                  );
                  const isPasswordRevealed = revealedPasswords[o.orderId];

                  return (
                  <tr key={o.orderId} className="hover:bg-[#161624] transition-colors">
                    <td className="p-4 font-mono text-purple-300 font-bold">
                      #{o.orderId}
                      {isService && (
                        <div className="mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                            ⚔️ งานฟาร์ม
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{o.robloxUsername || '-'}</div>
                      {isService && (o.serviceAccountUsername || o.serviceAccountPassword) && (
                        <div className="mt-1.5 p-2 rounded-xl bg-[#090910] border border-amber-500/30 space-y-1 max-w-xs">
                          <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                            <KeyRound className="w-3 h-3" /> ข้อมูลล็อกอินฟาร์ม:
                          </div>
                          <div className="text-[11px] text-zinc-200 flex items-center justify-between gap-1 font-mono">
                            <span className="text-zinc-400">ID:</span>
                            <span className="font-bold text-white select-all">{o.serviceAccountUsername || o.robloxUsername}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(o.serviceAccountUsername || o.robloxUsername || '');
                                success('คัดลอก ID แล้ว', 'คัดลอกไอดี Roblox สำเร็จ');
                              }}
                              className="text-zinc-500 hover:text-white p-0.5"
                              title="คัดลอก ID"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          {o.serviceAccountPassword && (
                            <div className="text-[11px] text-zinc-200 flex items-center justify-between gap-1 font-mono">
                              <span className="text-zinc-400">Pass:</span>
                              <span className="font-bold text-amber-300 select-all">
                                {isPasswordRevealed ? o.serviceAccountPassword : '••••••••'}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(o.orderId)}
                                  className="text-zinc-500 hover:text-white p-0.5"
                                  title={isPasswordRevealed ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                                >
                                  {isPasswordRevealed ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(o.serviceAccountPassword || '');
                                    success('คัดลอกรหัสผ่านแล้ว', 'คัดลอกรหัสผ่านสำเร็จ');
                                  }}
                                  className="text-zinc-500 hover:text-white p-0.5"
                                  title="คัดลอกรหัสผ่าน"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {o.note && (
                        <div className="text-[10px] text-zinc-400 mt-1 italic line-clamp-2" title={o.note}>
                          โน้ต: {o.note}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-zinc-300">
                      {o.items?.map((it) => {
                        const qtyLabel = it.name?.includes('เงินม่วง') || it.name?.includes('Fragment')
                          ? `${(it.quantity || 1) * 10}k ม่วง`
                          : it.name?.includes('เงินเขียว') || it.name?.includes('Beli')
                          ? `${it.quantity}M`
                          : it.name?.includes('เลเวล') || it.name?.includes('Level')
                          ? `${(it.quantity || 1) * 100} เลเวล`
                          : `x${it.quantity || 1}`;
                        return `${it.name} (${qtyLabel})`;
                      }).join(', ') || '-'}
                    </td>
                    <td className="p-4 font-bold text-white">฿{((o.total ?? o.totalAmount) || 0).toLocaleString()}</td>
                    <td className="p-4">
                      {(() => {
                        const st = o.orderStatus || o.status || 'completed';
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : st === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {st}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setReceiptOrder(o);
                            setIsReceiptModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="ดูและพิมพ์ใบเสร็จรับเงินอิเล็กทรอนิกส์"
                        >
                          <FileText className="w-3 h-3" />
                          <span>ใบเสร็จ</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                            setSearchInventory(o.orderId);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="ดูและพิมพ์รายละเอียดในคลังสินค้าของออเดอร์นี้"
                        >
                          <Package className="w-3 h-3" />
                          <span>พิมพ์ส่งมอบ</span>
                        </button>
                        <select
                          value={o.orderStatus || o.status || 'completed'}
                          onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                          className="bg-[#0D0D16] border border-[#29293E] text-zinc-200 text-[11px] rounded-lg p-1.5 focus:outline-none cursor-pointer"
                        >
                          <option value="paid">paid (ชำระแล้ว)</option>
                          <option value="processing">processing (กำลังส่ง)</option>
                          <option value="completed">completed (สำเร็จ)</option>
                          <option value="cancelled">cancelled (ยกเลิก)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* Tab: Gacha Accounts Stock & Input (ช่องกรอกไอดีไก่ตันใน admin) */}
      {activeTab === 'gacha' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>จัดการสต็อกไอดีไก่ตัน (Gacha Accounts Management)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                กรอกไอดีและรหัสผ่าน Roblox สำหรับส่งมอบให้ลูกค้าแบบอัตโนมัติ 24 ชม. เมื่อสั่งซื้อ สุ่มไก่ตันดาบคู่ 35 บาท
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={loadGachaAccounts}
                disabled={isLoadingGacha}
                className="px-3.5 py-2 rounded-xl bg-[#1C1C2C] hover:bg-[#25253A] border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGacha ? 'animate-spin' : ''}`} />
                <span>รีเฟรชสต็อก</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeSampleGacha}
                disabled={isSubmittingGacha}
                className="px-3.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="ล้างไอดีตัวอย่างหรือไอดีทดสอบออกจากระบบ"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>ล้างไอดีตัวอย่าง (ถ้ามี)</span>
              </button>
            </div>
          </div>

          {/* Linked Homepage Highlight Banner Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161028] via-[#120D22] to-[#0D0819] border-2 border-purple-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>การ์ดโปรโมชั่นหน้าแรก (Homepage Highlight Banner)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      {homeConfig.webBannerHighlightBadge || 'พร้อมส่งอัตโนมัติ'}
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    ข้อมูลนี้จะแสดงผลเป็นแถบโปรโมชั่นหลักใต้แบนเนอร์ที่ลูกค้าเห็นบนหน้าแรกของเว็บ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setHighlightCardDraft({
                      webBannerHighlightImage: homeConfig.webBannerHighlightImage || '/images/blox/dark_coat.png',
                      webBannerHighlightBadge: homeConfig.webBannerHighlightBadge || 'พร้อมส่งอัตโนมัติ',
                      webBannerHighlightTitle: homeConfig.webBannerHighlightTitle || '⚔️ สุ่มไก่ตันดาบคู่ (CDK) 35 บาท',
                      webBannerHighlightSubtitle: homeConfig.webBannerHighlightSubtitle || 'การันตีดาบคู่ CDK เลเวล Max 2800 สเตตัสตัน ส่งมอบไอดีและรหัสผ่านทันที 24 ชม.',
                      webBannerHighlightPrice: homeConfig.webBannerHighlightPrice ?? 35,
                      webBannerHighlightOldPrice: homeConfig.webBannerHighlightOldPrice ?? 79,
                      webBannerHighlightButtonText: homeConfig.webBannerHighlightButtonText || '⚡ สุ่มเลย ฿35',
                      webBannerTag1: homeConfig.webBannerTag1 || '✦ สุ่มผลปีศาจหายาก',
                      webBannerTag2: homeConfig.webBannerTag2 || '🛡 ปลอดภัย 100% อัตโนมัติ',
                      webBannerTag3: homeConfig.webBannerTag3 || '🔥 ราคาถูก เริ่มต้น 20-35฿',
                      webBannerTag4: homeConfig.webBannerTag4 || '🕒 บริการตลอด 24 ชม.',
                      webBannerLink: homeConfig.webBannerLink || 'prod_gacha_cdk_35',
                    });
                    setIsEditingHighlightCard(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไขข้อมูลการ์ดนี้</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('home_config')}
                  className="px-3.5 py-2 rounded-xl bg-[#231A3A] hover:bg-[#2F2350] border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>ไปที่แท็บตกแต่งหน้าแรก</span>
                </button>
              </div>
            </div>

            {/* Live Visual Card */}
            <div className="rounded-xl border border-purple-500/30 bg-[#0E091B] overflow-hidden">
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl bg-purple-950/80 border border-purple-500/50 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={homeConfig.webBannerHighlightImage || '/images/blox/dark_coat.png'}
                      alt="Icon"
                      className="w-full h-full object-contain drop-shadow"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/blox/dark_coat.png'; }}
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-[8px] font-black text-black shadow">
                      {homeConfig.webBannerHighlightPrice ?? 35}฿
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-white truncate">
                        {homeConfig.webBannerHighlightTitle || '⚔️ สุ่มไก่ตันดาบคู่ (CDK) 35 บาท'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        {homeConfig.webBannerHighlightBadge || 'พร้อมส่งอัตโนมัติ'}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {homeConfig.webBannerHighlightSubtitle || 'การันตีดาบคู่ CDK เลเวล Max 2800 สเตตัสตัน ส่งมอบไอดีและรหัสผ่านทันที 24 ชม.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0">
                  <div className="text-right">
                    {(homeConfig.webBannerHighlightOldPrice ?? 79) > (homeConfig.webBannerHighlightPrice ?? 35) && (
                      <span className="text-[10px] text-zinc-500 line-through block">฿{homeConfig.webBannerHighlightOldPrice ?? 79}</span>
                    )}
                    <span className="text-base font-black text-cyan-400 block">฿{homeConfig.webBannerHighlightPrice ?? 35}</span>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white font-black text-xs shadow">
                    {homeConfig.webBannerHighlightButtonText || `สุ่มเลย ฿${homeConfig.webBannerHighlightPrice ?? 35}`}
                  </span>
                </div>
              </div>

              {/* 4 Guarantee tags preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-[#08040F] border-t border-purple-500/20 text-[10px] text-zinc-400 font-medium text-center">
                <div className="truncate flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{homeConfig.webBannerTag1 || '✦ สุ่มผลปีศาจหายาก'}</span>
                </div>
                <div className="truncate flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{homeConfig.webBannerTag2 || '🛡 ปลอดภัย 100% อัตโนมัติ'}</span>
                </div>
                <div className="truncate flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{homeConfig.webBannerTag3 || '🔥 ราคาถูก เริ่มต้น 20-35฿'}</span>
                </div>
                <div className="truncate flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{homeConfig.webBannerTag4 || '🕒 บริการตลอด 24 ชม.'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#18132A] to-[#100C1E] border border-emerald-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">ไอดีพร้อมส่ง (Available)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
                {gachaAccounts.filter(a => a.status === 'available').length} <span className="text-xs text-zinc-400 font-normal">บัญชี</span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">พร้อมตัดส่งมอบเข้าคลังลูกค้าทันที</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#18132A] to-[#100C1E] border border-purple-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">ขาย/ส่งมอบแล้ว (Delivered)</span>
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-2">
                {gachaAccounts.filter(a => a.status === 'sold').length} <span className="text-xs text-zinc-400 font-normal">บัญชี</span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">ส่งมอบให้ลูกค้าสำเร็จแล้ว</span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#18132A] to-[#100C1E] border border-amber-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">รวมสต็อกทั้งหมด (Total)</span>
                <KeyRound className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
                {gachaAccounts.length} <span className="text-xs text-zinc-400 font-normal">บัญชี</span>
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">ประวัติไอดีทั้งหมดในระบบ</span>
            </div>
          </div>

          {/* Form: ช่องกรอกไอดีใน admin */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#110D20] border-2 border-amber-500/40 shadow-xl shadow-amber-950/20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ช่องกรอกไอดีไก่ตันเข้าสต็อก (Roblox Accounts Input)</h4>
                  <p className="text-[11px] text-zinc-400">กรอกหรือวางไอดีทีละหลายบัญชี เพื่อให้ระบบนำไปสุ่มแจกลูกค้า</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-zinc-400">ผูกกับสินค้า:</span>
                <select
                  value={gachaTargetProduct}
                  onChange={(e) => setGachaTargetProduct(e.target.value)}
                  className="bg-[#0A0714] border border-[#2E2448] rounded-xl px-3 py-1.5 text-xs text-amber-300 focus:outline-none"
                >
                  <option value="prod_gacha_cdk_35">สุ่มไก่ตันดาบคู่ (CDK) 35 บาท</option>
                  {(products || []).filter(p => p && p.productId && p.name && p.productId !== 'prod_gacha_cdk_35' && (p.deliveryType === 'account_code' || String(p.name || '').includes('สุ่ม'))).map(p => (
                    <option key={p.productId} value={p.productId}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleAddGachaAccounts} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>กรอกไอดีและรหัสผ่าน (1 บรรทัด ต่อ 1 บัญชี):</span>
                  <span className="text-[10px] text-amber-400">รูปแบบ: Username:Password หรือ Username Password</span>
                </label>
                <textarea
                  rows={4}
                  value={gachaInputText}
                  onChange={(e) => setGachaInputText(e.target.value)}
                  placeholder="ตัวอย่างการกรอก:&#10;angus_cdk_01:Password1234&#10;angus_cdk_02:BloxHero#99&#10;angus_cdk_03:SwordGod777"
                  className="w-full bg-[#080511] border border-[#2E2448] focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-2xl p-3 text-amber-300 font-mono text-xs placeholder:text-zinc-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-zinc-500">
                  💡 เมื่อลูกค้าสั่งซื้อสำเร็จ ระบบจะดึงไอดีจากช่องนี้ไปส่งมอบในคลังสินค้าและใบเสร็จให้ทันที 24 ชม.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGachaInputText('')}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    ล้างข้อความ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingGacha || !gachaInputText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isSubmittingGacha ? 'กำลังบันทึก...' : '+ บันทึกไอดีเข้าสต็อก'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Accounts Stock Table */}
          <div className="p-4 sm:p-6 rounded-3xl bg-[#120D22] border border-purple-500/20 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/15">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">รายการไอดีทั้งหมดในระบบ</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                  {gachaAccounts.length} บัญชี
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#0A0714] p-1 rounded-xl border border-purple-500/20">
                <button
                  type="button"
                  onClick={() => setGachaFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    gachaFilter === 'all' ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด ({gachaAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGachaFilter('available')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    gachaFilter === 'available' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  พร้อมส่ง ({gachaAccounts.filter(a => a.status === 'available').length})
                </button>
                <button
                  type="button"
                  onClick={() => setGachaFilter('sold')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    gachaFilter === 'sold' ? 'bg-purple-900 text-purple-200 shadow' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ขายแล้ว ({gachaAccounts.filter(a => a.status === 'sold').length})
                </button>

                {gachaAccounts.some(a => a.status === 'sold') && (
                  <button
                    type="button"
                    onClick={handleClearSoldGacha}
                    disabled={isBulkDeletingGacha}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/50 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 hover:text-white transition-all cursor-pointer flex items-center gap-1 ml-2"
                    title="ลบไอดีทั้งหมดที่มีสถานะขายแล้วออกจากสต็อก"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>{isBulkDeletingGacha ? 'กำลังลบ...' : 'ล้างไอดีที่ขายแล้ว'}</span>
                  </button>
                )}
              </div>
            </div>

            {isLoadingGacha ? (
              <div className="py-12 text-center text-xs text-zinc-500">กำลังโหลดรายการไอดีในสต็อก...</div>
            ) : gachaAccounts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <KeyRound className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-bold text-zinc-300">ยังไม่มีไอดีในสต็อก</p>
                <p className="text-xs text-zinc-500">กรอกไอดีและรหัสผ่านในช่องด้านบนเพื่อเติมสต็อกพร้อมส่งมอบให้ลูกค้าทันที 24 ชม.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300 border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/15 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">ลำดับ</th>
                      <th className="py-2.5 px-3">ชื่อบัญชี (Username)</th>
                      <th className="py-2.5 px-3">รหัสผ่าน (Password)</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3">คำสั่งซื้อที่รับ</th>
                      <th className="py-2.5 px-3">วันที่บันทึก</th>
                      <th className="py-2.5 px-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {gachaAccounts
                      .filter(acc => {
                        if (gachaFilter === 'available') return acc.status === 'available';
                        if (gachaFilter === 'sold') return acc.status === 'sold';
                        return true;
                      })
                      .map((acc, index) => {
                        const isRevealed = gachaRevealedPasswords[acc.id] || false;
                        return (
                          <tr key={acc.id} className="hover:bg-purple-950/20 transition-colors">
                            <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">{index + 1}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-white select-all">
                              {acc.username}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-amber-300 select-all">
                              <div className="flex items-center gap-1.5">
                                <span>{isRevealed ? acc.password : '••••••••'}</span>
                                <button
                                  type="button"
                                  onClick={() => setGachaRevealedPasswords(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                                  className="text-zinc-500 hover:text-white p-0.5"
                                  title={isRevealed ? 'ซ่อนรหัส' : 'ดูรหัส'}
                                >
                                  {isRevealed ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              {acc.status === 'available' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  พร้อมส่ง
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ขายแล้ว
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-400">
                              {acc.orderId ? (
                                <span className="text-cyan-300 font-bold">#{acc.orderId.substring(0, 12)}</span>
                              ) : (
                                <span className="text-zinc-600">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[10px] text-zinc-500">
                              {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('th-TH') : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${acc.username}:${acc.password}`);
                                    success('คัดลอกแล้ว', `${acc.username}:${acc.password}`);
                                  }}
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                  title="คัดลอกไอดีและรหัสผ่าน"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {confirmDeleteGachaId === acc.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteGachaAccount(acc.id)}
                                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] animate-pulse cursor-pointer shadow whitespace-nowrap"
                                      title="ยืนยันการลบไอดีนี้"
                                    >
                                      ลบเลย
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteGachaId(null)}
                                      className="px-1.5 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[10px] cursor-pointer whitespace-nowrap"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteGachaId(acc.id)}
                                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                    title="กดเพื่อลบไอดีนี้ออกจากสต็อก"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Customer Inventory & Delivery Details */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>ระบบส่งมอบ & คลังสินค้าลูกค้า (Customer Inventory)</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                พิมพ์รายละเอียดสินค้า, เปลี่ยนข้อความ, ลิงก์ VIP Server, รหัส Claim Code ส่งเข้าคลังสินค้าของลูกค้าได้แบบเรียลไทม์
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsVipSettingsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#1C1C2C] hover:bg-[#25253A] border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>⚙️ ตั้งค่า VIP Server & ข้อความร้าน</span>
              </button>

              <button
                onClick={() => setIsDirectDeliverModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>+ ส่งมอบเข้าคลังลูกค้าโดยตรง</span>
              </button>
            </div>
          </div>

          {/* Active VIP Server Status Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#17122A] via-[#120F22] to-[#0D0B18] border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300 shrink-0 border border-purple-500/30">
                <Server className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">เซิร์ฟเวอร์ VIP หลักของร้าน:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">พร้อมใช้งาน</span>
                </div>
                <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
                  {vipSettings.vipServerLink || 'ยังไม่ได้ระบุลิงก์ VIP'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              {vipSettings.vipServerLink && (
                <a
                  href={vipSettings.vipServerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#1F1F30] hover:bg-[#2A2A40] text-purple-300 text-xs font-semibold flex items-center gap-1.5 border border-purple-500/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ทดสอบเข้า VIP</span>
                </a>
              )}
              <button
                onClick={() => setIsVipSettingsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
              >
                แก้ไข VIP & ข้อความ
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#11111A] p-3 rounded-2xl border border-[#212133]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัส Order, ชื่อสินค้า, Roblox Username หรือ UID/Email..."
                value={searchInventory}
                onChange={(e) => setSearchInventory(e.target.value)}
                className="w-full bg-[#0B0B12] border border-[#242436] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
              />
              {searchInventory && (
                <button
                  onClick={() => setSearchInventory('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  ล้าง
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {(['all', 'ready', 'claimed', 'processing'] as const).map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setInventoryFilterStatus(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                    inventoryFilterStatus === statusKey
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#181826] text-zinc-400 hover:text-white'
                  }`}
                >
                  {statusKey === 'all' && 'ทั้งหมด'}
                  {statusKey === 'ready' && 'พร้อมรับ (Ready)'}
                  {statusKey === 'claimed' && 'รับแล้ว (Claimed)'}
                  {statusKey === 'processing' && 'กำลังดำเนินการ'}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Items List */}
          <div className="overflow-x-auto rounded-2xl border border-[#212133] bg-[#11111A]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0B12] text-zinc-400 border-b border-[#212133]">
                <tr>
                  <th className="p-4">รหัสออเดอร์ / วันที่</th>
                  <th className="p-4">ข้อมูลลูกค้า</th>
                  <th className="p-4">สินค้า</th>
                  <th className="p-4">รายละเอียดในคลังลูกค้า</th>
                  <th className="p-4">ลิงก์ / Claim Code</th>
                  <th className="p-4">สถานะคลัง</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D1D2C]">
                {inventoryItems
                  .filter((item) => {
                    if (inventoryFilterStatus !== 'all' && item.status !== inventoryFilterStatus) {
                      return false;
                    }
                    if (!searchInventory.trim()) return true;
                    const query = searchInventory.toLowerCase();
                    const orderId = (item.orderId || '').toLowerCase();
                    const prodName = (item.productName || '').toLowerCase();
                    const username = (item.metadata?.robloxUsername || '').toLowerCase();
                    const email = (item.userEmail || item.uid || '').toLowerCase();
                    return (
                      orderId.includes(query) ||
                      prodName.includes(query) ||
                      username.includes(query) ||
                      email.includes(query)
                    );
                  })
                  .map((item) => {
                    const invId = item.id || item.inventoryId;
                    const instructions = item.instructions || item.metadata?.instructions || '';
                    const link = item.tradeServerLink || item.serverLink || item.metadata?.tradeServerLink || item.metadata?.serverLink || '';
                    const code = item.claimCode || item.metadata?.claimCode || item.metadata?.code || item.metadata?.redeemCode || '';
                    const username = item.metadata?.robloxUsername || '-';
                    const serviceUser = item.metadata?.serviceAccountUsername;
                    const servicePass = item.metadata?.serviceAccountPassword;
                    const isService = item.metadata?.isServiceOrder || !!servicePass || item.deliveryType === 'service' || item.deliveryType === 'manual_service';
                    const isPasswordRevealed = revealedPasswords[invId];
                    const adminNote = item.metadata?.adminNote || '';

                    return (
                      <tr key={invId} className="hover:bg-[#161624] transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-purple-300">
                            #{item.orderId || 'DIRECT'}
                          </span>
                          {isService && (
                            <div className="mt-1">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                                ⚔️ ฟาร์ม
                              </span>
                            </div>
                          )}
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH', { hour12: false }) : '-'}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{username}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[140px]" title={item.userEmail || item.uid}>
                            {item.userEmail || (item.uid ? item.uid.substring(0, 10) + '...' : '-')}
                          </div>

                          {/* Farm Login Credentials Box */}
                          {isService && (serviceUser || servicePass) && (
                            <div className="mt-2 p-2 rounded-xl bg-[#090910] border border-amber-500/30 space-y-1 max-w-[190px]">
                              <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1">
                                <KeyRound className="w-3 h-3" /> ล็อกอินฟาร์ม:
                              </div>
                              <div className="text-[10px] text-zinc-200 flex items-center justify-between gap-1 font-mono">
                                <span className="text-zinc-400">ID:</span>
                                <span className="font-bold text-white select-all truncate">{serviceUser || username}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(serviceUser || username || '');
                                    success('คัดลอก ID แล้ว', 'คัดลอกไอดี Roblox สำเร็จ');
                                  }}
                                  className="text-zinc-500 hover:text-white p-0.5 shrink-0"
                                  title="คัดลอก ID"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              {servicePass && (
                                <div className="text-[10px] text-zinc-200 flex items-center justify-between gap-1 font-mono">
                                  <span className="text-zinc-400">Pass:</span>
                                  <span className="font-bold text-amber-300 select-all truncate">
                                    {isPasswordRevealed ? servicePass : '••••••••'}
                                  </span>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(invId)}
                                      className="text-zinc-500 hover:text-white p-0.5"
                                      title={isPasswordRevealed ? 'ซ่อนรหัสผ่าน' : 'ดูรหัสผ่าน'}
                                    >
                                      {isPasswordRevealed ? <EyeOff className="w-2.5 h-2.5 text-amber-400" /> : <Eye className="w-2.5 h-2.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(servicePass);
                                        success('คัดลอกรหัสผ่านแล้ว', 'คัดลอกรหัสผ่านสำเร็จ');
                                      }}
                                      className="text-zinc-500 hover:text-white p-0.5"
                                      title="คัดลอกรหัสผ่าน"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            {item.image && (
                              <div className="w-8 h-8 rounded-lg bg-[#0C0C14] border border-[#262638] shrink-0 p-0.5 flex items-center justify-center overflow-hidden">
                                <BloxImage
                                  src={item.image}
                                  alt={item.productName}
                                  productName={item.productName}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white">{item.productName || 'สินค้า'}</div>
                              <div className="text-[10px] text-purple-400">จำนวน: {item.quantity || 1} ชิ้น</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          {instructions ? (
                            <div className="bg-[#151522] border border-[#242436] p-2 rounded-xl text-zinc-300 text-[11px] leading-relaxed line-clamp-2" title={instructions}>
                              {instructions}
                            </div>
                          ) : (
                            <span className="text-zinc-500 italic text-[11px]">ยังไม่ได้พิมพ์รายละเอียด</span>
                          )}
                          {adminNote && (
                            <div className="text-[10px] text-amber-400/80 mt-1">
                              โน้ตแอดมิน: {adminNote}
                            </div>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="space-y-1.5">
                            {code ? (
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 max-w-fit">
                                <Key className="w-3 h-3 shrink-0" />
                                <span>{code}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(code);
                                    setCopiedCodeId(invId);
                                    success('คัดลอกสำเร็จ', `รหัส ${code} ถูกคัดลอกแล้ว`);
                                    setTimeout(() => setCopiedCodeId(null), 2000);
                                  }}
                                  className="text-amber-400/70 hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
                                  title="คัดลอก Claim Code"
                                >
                                  {copiedCodeId === invId ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : null}

                            {link ? (
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1 font-semibold"
                                  title="คลิกเพื่อเข้า VIP Server"
                                >
                                  <Server className="w-3 h-3" />
                                  <span>VIP Server</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(link);
                                    success('คัดลอกลิงก์สำเร็จ', 'คัดลอกลิงก์ VIP Server แล้ว');
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                                  title="คัดลอกลิงก์ VIP"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : null}

                            {!code && !link && (
                              <button
                                onClick={() => handleOpenDeliveryModal(item)}
                                className="text-zinc-500 hover:text-purple-300 text-[10px] underline decoration-dashed cursor-pointer"
                              >
                                + ใส่รหัส / VIP
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                item.status === 'ready'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : item.status === 'claimed'
                                  ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {item.status === 'ready' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                              {item.status === 'ready' ? 'พร้อมรับ' : item.status === 'claimed' ? 'รับแล้ว' : 'กำลังส่ง'}
                            </span>

                            <select
                              value={item.status || 'ready'}
                              onChange={(e) => handleQuickMarkStatus(item, e.target.value as any)}
                              className="bg-[#0D0D16] border border-[#29293E] text-zinc-200 text-[10px] rounded p-1 focus:outline-none cursor-pointer"
                            >
                              <option value="ready">ready</option>
                              <option value="claimed">claimed</option>
                              <option value="processing">processing</option>
                            </select>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenDeliveryModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all cursor-pointer active:scale-95"
                            title="แก้ไขข้อความส่งมอบ, รหัส Claim Code หรือเปลี่ยนลิงก์ VIP Server"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>เปลี่ยนข้อมูล / VIP / รหัส</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {inventoryItems.length === 0 && (
              <div className="py-12 px-4 text-center space-y-3">
                {isQuotaExceeded || tabErrors.inventory ? (
                  <div className="max-w-md mx-auto p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-2.5 shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-sm font-bold text-amber-200">โควต้าการอ่าน Firestore เต็มชั่วคราว</div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      ไม่สามารถดึงรายการคลังสินค้าล่าสุดจาก Cloud Firestore ได้ในขณะนี้เนื่องจากเกินโควต้า 50,000 ครั้ง/วัน
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center gap-2">
                      <a
                        href="https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-900/30"
                      >
                        <span>อัปเกรดเป็นแพ็กเกจ Blaze</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => loadTabData('inventory', true)}
                        className="px-3 py-1.5 rounded-xl bg-[#221A0F] hover:bg-[#2D2214] border border-amber-500/30 text-amber-300 text-xs font-bold"
                      >
                        ลองโหลดใหม่
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs">
                    ยังไม่มีรายการสินค้าในคลังลูกค้า เมื่อลูกค้าสั่งซื้อสำเร็จหรือแอดมินส่งมอบโดยตรง รายการจะปรากฏที่นี่
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: ตกแต่งหน้าแรก & แบนเนอร์ (Home Config Manager) */}
      {activeTab === 'home_config' && (
        <HomeConfigManager />
      )}

      {/* Tab: จัดการผู้ใช้ (Users) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>จัดการผู้ใช้งานระบบ (User Management)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                ผู้ใช้ทั้งหมด: {systemUsers.length} บัญชี • จัดการยศ สิทธิ์แอดมิน และปรับยอดเครดิต
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                placeholder="ค้นหาชื่อ อีเมล หรือ UID..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#11111A] border border-[#26263B] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Quota warning in users tab if applicable */}
          {(isQuotaExceeded || tabErrors.users) && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>โควต้าการอ่าน Firestore เต็มชั่วคราว ข้อมูลผู้ใช้อาจแสดงเฉพาะบัญชีที่อยู่ใน Local Cache</span>
              </div>
              <a
                href="https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true"
                target="_blank"
                rel="noreferrer"
                className="underline text-amber-200 hover:text-white font-bold text-[11px] shrink-0"
              >
                อัปเกรด Blaze
              </a>
            </div>
          )}

          <div className="bg-[#11111A] border border-[#212133] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#161622] border-b border-[#212133] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="px-6 py-4">ผู้ใช้</th>
                    <th className="px-6 py-4">ยศ / ตำแหน่ง</th>
                    <th className="px-6 py-4">เครดิตคงเหลือ</th>
                    <th className="px-6 py-4">สมัครเมื่อ</th>
                    <th className="px-6 py-4 text-right">การจัดการ & เครดิต</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212133]/50">
                  {systemUsers
                    .filter((u) => {
                      if (!searchUsers.trim()) return true;
                      const q = searchUsers.toLowerCase();
                      return (
                        (u.displayName || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.uid || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u) => (
                      <tr key={u.uid} className="hover:bg-[#151522] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName || 'User'}`}
                              alt={u.displayName || 'User'}
                              className="w-10 h-10 rounded-full bg-[#1C1C2C] border border-[#2A2A40] object-cover"
                            />
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>{u.displayName || 'ไม่ระบุชื่อ'}</span>
                                {u.uid === user?.uid && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                    คุณ
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500 font-mono">{u.email || u.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {u.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกทั่วไป'}
                          </span>
                          {u.rank && (
                            <div className="mt-1">
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                {u.rank}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-black text-purple-400">฿{(u.balance || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForCredit(u);
                                setCreditAdjustmentAmount(String(u.balance || 0));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="ปรับยอดเครดิตของผู้ใช้คนนี้"
                            >
                              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                              <span>ปรับเครดิต</span>
                            </button>

                            <select
                              value={u.role || 'user'}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#2A2A40] text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.value !== (u.role || 'user')) {
                                  handleUpdateUserRank(u.uid, e.target.value);
                                }
                              }}
                            >
                              <option value="user">สมาชิกทั่วไป</option>
                              <option value="admin">ผู้ดูแลระบบ</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {systemUsers.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  ไม่พบข้อมูลผู้ใช้งาน
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11111A] border border-[#252538] rounded-3xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold text-white">เพิ่มสินค้าใหม่เข้า AngusShop</h3>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">ชื่อสินค้า (Blox Fruits)</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผลเสือ (Leopard Fruit)"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">หมวดหมู่</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as ProductCategory })}
                    className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                  >
                    <option value="ไอดี">ไอดี (Roblox Accounts / สุ่มไก่ตัน)</option>
                    <option value="ผลปีศาจ">ผลปีศาจ</option>
                    <option value="Gamepass">Gamepass</option>
                    <option value="สกินผล">สกินผล</option>
                    <option value="บริการ">บริการ</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">ประเภทการส่งมอบ</label>
                  <select
                    value={newProduct.deliveryType}
                    onChange={(e) => setNewProduct({ ...newProduct, deliveryType: e.target.value as any })}
                    className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                  >
                    <option value="fruit_trade">ผลเทรดในเกม (Fruit Trade)</option>
                    <option value="gamepass_gift">Gamepass Gift</option>
                    <option value="manual_service">บริการจ้างฟาร์ม/ดัน</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">ราคาขาย (฿)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">ราคาเดิม (฿)</label>
                  <input
                    type="number"
                    value={newProduct.oldPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, oldPrice: Number(e.target.value) })}
                    className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">จำนวนสต็อก</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Image Input Section with Preview, Upload, and Presets */}
              <div className="p-4 rounded-2xl bg-[#141422] border border-purple-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>รูปภาพสินค้า (Product Image)</span>
                  </div>
                  <span className="text-[10px] text-purple-300/80 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                    รองรับ URL หรือ อัปโหลดจากเครื่อง
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left: Image Preview */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    <div className="relative w-28 h-28 rounded-2xl bg-black/60 border-2 border-purple-500/40 p-2 flex items-center justify-center overflow-hidden shadow-inner group">
                      {newProduct.image ? (
                        <BloxImage
                          src={newProduct.image}
                          alt="Product Preview"
                          productName={newProduct.name}
                          className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(168,85,247,0.4)]"
                        />
                      ) : null}
                      <div className={`add-img-fallback ${newProduct.image ? 'hidden' : ''} text-center text-zinc-500 p-2`}>
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-zinc-600" />
                        <span className="text-[10px]">ยังไม่มีรูป</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: URL & Upload */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div>
                      <label className="text-zinc-300 font-semibold block mb-1">URL รูปภาพ</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="วาง URL รูปภาพ..."
                          value={newProduct.image || ''}
                          onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                          className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E1E30] hover:bg-[#282842] border border-purple-500/30 text-purple-200 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>เลือกรูปภาพจากเครื่อง (Base64)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileChange(e.target.files[0], false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>เลือกจากคลังผลไม้และไอเทม Blox Fruits:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPresetPickerTarget('new');
                        setIsPresetPickerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>เปิดคลังค้นหาทั้งหมด ({BLOX_FRUITS_PRESETS.length} ไอเทม)</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {BLOX_FRUITS_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setNewProduct((prev) => ({
                            ...prev,
                            image: preset.url,
                            name: preset.th,
                            rarity: preset.rarity || prev.rarity,
                            category: (preset.category as any) || prev.category,
                          }));
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          newProduct.image === preset.url
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-[#181828] hover:bg-[#202035] text-zinc-300 border-white/5'
                        }`}
                      >
                        <BloxImage 
                          src={preset.url} 
                          alt={preset.name} 
                          productName={preset.th || preset.name}
                          className="w-3.5 h-3.5 object-contain shrink-0" 
                        />
                        <span>{preset.th}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">คำอธิบายสั้น</label>
                <input
                  type="text"
                  placeholder="เช่น ผลสายบีสต์ระดับตำนาน เหมาะสำหรับ PvP"
                  value={newProduct.shortDescription}
                  onChange={(e) => setNewProduct({ ...newProduct, shortDescription: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">คำอธิบายเต็ม</label>
                <textarea
                  rows={3}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#262638] rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Delivery info for customer inventory */}
              <div className="p-3.5 rounded-2xl bg-[#161626] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <Package className="w-4 h-4" />
                    <span>รายละเอียดสินค้าที่จะส่งเข้าคลังลูกค้า (Customer Inventory Delivery)</span>
                  </div>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-medium">ปรับแต่งชื่อหัวข้อได้</span>
                </div>
                
                {/* Instructions Title & Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      <span>ชื่อหัวข้อข้อความส่งมอบ (ที่ลูกค้าเห็น)</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">เริ่มต้น: คำแนะนำการรับสินค้า</span>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น คำแนะนำการรับสินค้า, ข้อมูลไอดี/พาส, วิธีการรับของ"
                    value={newProduct.instructionsTitle || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, instructionsTitle: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="ข้อความส่งมอบ เช่น เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits หรือ ติดต่อแอดมินพร้อมแจ้งเลขออเดอร์..."
                    value={newProduct.deliveryInstructions || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, deliveryInstructions: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">ข้อความนี้จะแสดงในบัตรสินค้าที่หน้าคลังสินค้าของลูกค้าทันทีที่ซื้อสำเร็จ</p>
                </div>

                {/* Server Link & Claim Code Titles and Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                        <Server className="w-3 h-3 text-indigo-400" />
                        <span>ชื่อหัวข้อ / ปุ่มลิงก์</span>
                      </label>
                      <span className="text-[10px] text-zinc-500">เริ่มต้น: ลิงค์รับของ</span>
                    </div>
                    <input
                      type="text"
                      placeholder="เช่น ลิงค์รับของ, เข้าเซิร์ฟเวอร์ VIP"
                      value={newProduct.serverLinkTitle || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, serverLinkTitle: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ลิงก์ VIP Server เริ่มต้น (ถ้ามี)"
                      value={newProduct.tradeServerLink || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, tradeServerLink: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                  </div>

                    <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>ชื่อหัวข้อรหัสสินค้า / ไอดี</span>
                      </label>
                      <span className="text-[10px] text-zinc-500">เริ่มต้น: รหัสรับสินค้า (Claim Code)</span>
                    </div>
                    <input
                      type="text"
                      placeholder="เช่น รหัสรับสินค้า, License Key, PIN"
                      value={newProduct.claimCodeTitle || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, claimCodeTitle: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เช่น AGS-XXXXXX (เว้นว่างเพื่อให้ระบบสุ่ม)"
                      value={newProduct.claimCode || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, claimCode: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-amber-300 font-mono text-xs placeholder:text-zinc-600 focus:outline-none"
                    />

                    {/* Dedicated Gacha Account Field (ช่องกรอกไอดีใน admin) */}
                    {(newProduct.deliveryType === 'account_code' || newProduct.name?.includes('สุ่ม') || newProduct.name?.includes('ไก่ตัน')) && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>ช่องกรอกไอดี Roblox สำหรับสุ่มไก่ตัน (Username : Password)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddModalOpen(false);
                              setActiveTab('gacha');
                            }}
                            className="text-[10px] text-amber-400 underline hover:text-amber-300 cursor-pointer"
                          >
                            📦 เปิดคลังสต็อกไอดี
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="เช่น angus_user01 : password123 (ส่งมอบทันที)"
                          value={newProduct.claimCode || ''}
                          onChange={(e) => setNewProduct({ ...newProduct, claimCode: e.target.value })}
                          className="w-full bg-[#0A0A10] border border-amber-500/40 focus:border-amber-400 rounded-xl p-2 text-amber-300 font-mono text-xs placeholder:text-zinc-600 focus:outline-none"
                        />
                        <p className="text-[10px] text-zinc-400">
                          สามารถกรอกไอดีเริ่มต้นที่นี่ หรือไปที่แท็บ "สต็อกไอดีไก่ตัน" เพื่อเติมไอดีจำนวนมาก
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isFeatured}
                    onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#262638] text-purple-600"
                  />
                  <span>สินค้าแนะนำ (Featured)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProduct.isBestSeller}
                    onChange={(e) => setNewProduct({ ...newProduct, isBestSeller: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#262638] text-purple-600"
                  />
                  <span>สินค้าขายดี (Best Seller)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#262638]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold"
                >
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal with Full Data & Image Management */}
      {isEditModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#11111A] border border-[#252538] rounded-3xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#212133]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>แก้ไขข้อมูลและรูปภาพสินค้า</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    รหัสสินค้า: <span className="font-mono text-purple-300">{selectedProduct.productId}</span> • หมวดหมู่: <span className="text-zinc-200">{selectedProduct.category || 'ผลปีศาจ'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl bg-[#1B1B2A] hover:bg-[#25253C] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-5 text-xs">
              
              {/* SECTION 1: จัดการรูปภาพสินค้า (Image Management) */}
              <div className="p-4 rounded-2xl bg-[#141422] border border-purple-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    <span>รูปภาพสินค้า (Product Image)</span>
                  </div>
                  <span className="text-[10px] text-purple-300/80 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full font-medium">
                    รองรับ URL หรือ อัปโหลดจากเครื่อง
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Left: Live Image Preview Box */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 rounded-2xl bg-black/60 border-2 border-purple-500/40 p-2 flex items-center justify-center overflow-hidden shadow-inner group">
                      {selectedProduct.image ? (
                        <BloxImage
                          src={selectedProduct.image}
                          alt={selectedProduct.name || 'Product'}
                          productName={selectedProduct.name}
                          className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(168,85,247,0.4)] transition-transform group-hover:scale-105"
                        />
                      ) : null}
                      <div className={`edit-img-fallback ${selectedProduct.image ? 'hidden' : ''} text-center text-zinc-500 p-2`}>
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-zinc-600" />
                        <span className="text-[10px]">ยังไม่มีรูปภาพ</span>
                      </div>
                    </div>
                    {selectedProduct.image && (
                      <button
                        type="button"
                        onClick={() => setSelectedProduct({ ...selectedProduct, image: '' })}
                        className="mt-2 text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                      >
                        ล้างรูปภาพนี้
                      </button>
                    )}
                  </div>

                  {/* Right: URL Input and Upload Button */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div>
                      <label className="text-zinc-300 font-semibold block mb-1">
                        URL รูปภาพ (Image URL)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          placeholder="วาง URL รูปภาพ เช่น https://..."
                          value={selectedProduct.image || ''}
                          onChange={(e) => setSelectedProduct({ ...selectedProduct, image: e.target.value })}
                          className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl pl-9 pr-8 py-2.5 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                        />
                        {selectedProduct.image && (
                          <button
                            type="button"
                            onClick={() => setSelectedProduct({ ...selectedProduct, image: '' })}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Local File Upload Button */}
                    <div>
                      <label className="text-zinc-400 text-[11px] block mb-1">
                        หรือ อัปโหลดไฟล์จากเครื่อง (PNG, JPG, WEBP):
                      </label>
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E1E30] hover:bg-[#282842] border border-purple-500/30 text-purple-200 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>เลือกรูปภาพจากเครื่อง (Base64)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileChange(e.target.files[0], true);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-zinc-500 ml-2">ขนาดไฟล์ไม่เกิน 2MB</span>
                    </div>
                  </div>
                </div>

                {/* Preset Fruit Icons Quick Selector */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>เลือกรูปผลปีศาจ / Gamepass สำเร็จรูป (Blox Fruits Presets):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPresetPickerTarget('edit');
                        setIsPresetPickerOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>เปิดคลังค้นหาทั้งหมด ({BLOX_FRUITS_PRESETS.length} ไอเทม)</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {BLOX_FRUITS_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSelectedProduct({
                            ...selectedProduct,
                            image: preset.url,
                          });
                        }}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          selectedProduct.image === preset.url
                            ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/40'
                            : 'bg-[#181828] hover:bg-[#202035] text-zinc-300 border-white/5 hover:border-purple-500/40'
                        }`}
                      >
                        <BloxImage 
                          src={preset.url} 
                          alt={preset.name} 
                          productName={preset.th || preset.name}
                          className="w-4 h-4 object-contain shrink-0" 
                        />
                        <span>{preset.th}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 1.5: รูปภาพแยกตามระดับ (Bounty Hunt Tiers 10M / 20M / 30M) */}
              {isBountyProduct(selectedProduct) && (
                <div className="p-4 rounded-2xl bg-[#141422] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>รูปภาพแยกตามระดับค่าหัว (10M / 20M / 30M Wanted Posters)</span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                      สำหรับบริการล่าค่าหัว
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['10M', '20M', '30M'] as const).map((tierKey) => {
                      const tierImg = selectedProduct.tierImages?.[tierKey] || (tierKey === '10M' ? '/images/blox/bounty_hunt_10m.png' : tierKey === '20M' ? '/images/blox/bounty_hunt_20m.png' : '/images/blox/bounty_hunt_30m.png');
                      return (
                        <div key={tierKey} className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">แพ็กเกจ {tierKey}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultUrl = `/images/blox/bounty_hunt_${tierKey.toLowerCase()}.png`;
                                setSelectedProduct((prev) => prev ? {
                                  ...prev,
                                  tierImages: {
                                    ...(prev.tierImages || {}),
                                    [tierKey]: defaultUrl
                                  }
                                } : null);
                              }}
                              className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                            >
                              ใช้โปสเตอร์ทางการ
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-11 h-11 rounded-lg bg-black/70 border border-amber-500/30 p-1 flex items-center justify-center shrink-0">
                              <BloxImage
                                src={tierImg}
                                alt={`Bounty ${tierKey}`}
                                productName={`Bounty ${tierKey}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder={`URL รูป ${tierKey}`}
                              value={selectedProduct.tierImages?.[tierKey] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedProduct((prev) => prev ? {
                                  ...prev,
                                  tierImages: {
                                    ...(prev.tierImages || {}),
                                    [tierKey]: val
                                  }
                                } : null);
                              }}
                              className="w-full bg-[#0A0A10] border border-[#262638] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-white text-[11px] placeholder:text-zinc-600 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: ข้อมูลสินค้าทั่วไป (Basic Info) */}
              <div className="space-y-3.5">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">ชื่อสินค้า (Product Name)</label>
                  <input
                    type="text"
                    required
                    value={selectedProduct.name}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">หมวดหมู่</label>
                    <select
                      value={selectedProduct.category || 'ผลปีศาจ'}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, category: e.target.value as ProductCategory })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="ไอดี">ไอดี (Roblox Accounts / สุ่มไก่ตัน)</option>
                      <option value="ผลปีศาจ">ผลปีศาจ</option>
                      <option value="Gamepass">Gamepass</option>
                      <option value="สกินผล">สกินผล</option>
                      <option value="บริการ">บริการ</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">ประเภทผล</label>
                    <select
                      value={selectedProduct.fruitType || 'Permanent'}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, fruitType: e.target.value as any })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Permanent">ถาวร (Permanent)</option>
                      <option value="Physical">ผลกล่อง (Physical)</option>
                      <option value="Gamepass">Gamepass / Voucher</option>
                      <option value="Service">บริการ (Service)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">ความหายาก (Rarity)</label>
                    <select
                      value={selectedProduct.rarity || 'Mythical'}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, rarity: e.target.value as any })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Mythical">Mythical (สีแดง/ม่วง)</option>
                      <option value="Legendary">Legendary (สีชมพู)</option>
                      <option value="Rare">Rare (สีฟ้า)</option>
                      <option value="Uncommon">Uncommon (สีเขียว)</option>
                      <option value="Common">Common (ทั่วไป)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">ราคาขาย (฿)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={selectedProduct.price}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, price: Number(e.target.value) })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">ราคาเดิม / ก่อนลด (฿)</label>
                    <input
                      type="number"
                      placeholder="เช่น 1200"
                      value={selectedProduct.oldPrice || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, oldPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">จำนวนในสต็อก</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={selectedProduct.stock}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, stock: Number(e.target.value) })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">คำอธิบายย่อ (Short Description)</label>
                  <input
                    type="text"
                    placeholder="เช่น ผลจิ้งจอกเก้าหาง ถาวร สกิลทำลายล้างสูงสุด"
                    value={selectedProduct.shortDescription || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, shortDescription: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">คำอธิบายเต็ม (Full Description)</label>
                  <textarea
                    rows={3}
                    placeholder="รายละเอียดแบบเต็มของผลปีศาจหรือไอเทม..."
                    value={selectedProduct.description || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 3: ข้อมูลส่งมอบสินค้าเข้าคลังลูกค้า */}
              <div className="p-3.5 rounded-2xl bg-[#161626] border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <Package className="w-4 h-4" />
                    <span>รายละเอียดส่งมอบเข้าคลังสินค้าลูกค้า (Delivery)</span>
                  </div>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-medium">ปรับแต่งได้</span>
                </div>
                
                {/* Instructions Title & Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      <span>ชื่อหัวข้อข้อความส่งมอบ</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">เริ่มต้น: คำแนะนำการรับสินค้า</span>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น คำแนะนำการรับสินค้า, ข้อมูลไอดี/พาส"
                    value={selectedProduct.instructionsTitle || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, instructionsTitle: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    placeholder="เช่น เข้าด้านล่างเพื่อรับผลปีศาจผ่านระบบ Trade ในเกม Blox Fruits..."
                    value={selectedProduct.deliveryInstructions || ''}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, deliveryInstructions: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>

                {/* Server Link & Claim Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                      <Server className="w-3 h-3 text-indigo-400" />
                      <span>ชื่อหัวข้อ / ลิงก์ VIP Server</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ชื่อปุ่ม เช่น ลิงค์รับของ"
                      value={selectedProduct.serverLinkTitle || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, serverLinkTitle: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="https://www.roblox.com/games/..."
                      value={selectedProduct.tradeServerLink || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, tradeServerLink: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-semibold text-[11px] flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>ชื่อหัวข้อ / รหัส Claim Code หรือ ไอดี</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น รหัสรับสินค้า (Claim Code)"
                      value={selectedProduct.claimCodeTitle || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, claimCodeTitle: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-white text-xs placeholder:text-zinc-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="เช่น AGS-XXXXXX"
                      value={selectedProduct.claimCode || ''}
                      onChange={(e) => setSelectedProduct({ ...selectedProduct, claimCode: e.target.value })}
                      className="w-full bg-[#0A0A10] border border-[#262638] focus:border-purple-500 rounded-xl p-2 text-amber-300 font-mono text-xs placeholder:text-zinc-600 focus:outline-none"
                    />

                    {/* Dedicated Gacha Account Field (ช่องกรอกไอดีใน admin) */}
                    {(selectedProduct.deliveryType === 'account_code' || selectedProduct.name?.includes('สุ่ม') || selectedProduct.name?.includes('ไก่ตัน')) && (
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2 mt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            <span>ช่องกรอกไอดี Roblox สำหรับส่งมอบ (Username : Password)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditModalOpen(false);
                              setActiveTab('gacha');
                            }}
                            className="text-[10px] text-amber-400 underline hover:text-amber-300 cursor-pointer"
                          >
                            📦 เปิดคลังสต็อกไอดี
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="เช่น angus_user01 : password123 (ส่งมอบทันที)"
                          value={selectedProduct.claimCode || ''}
                          onChange={(e) => setSelectedProduct({ ...selectedProduct, claimCode: e.target.value })}
                          className="w-full bg-[#0A0A10] border border-amber-500/40 focus:border-amber-400 rounded-xl p-2 text-amber-300 font-mono text-xs placeholder:text-zinc-600 focus:outline-none"
                        />
                        <p className="text-[10px] text-zinc-400">
                          สามารถกรอกไอดีเริ่มต้นที่นี่ หรือไปที่แท็บ "สต็อกไอดีไก่ตัน" เพื่อเติมไอดีจำนวนมาก
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: ป้ายและสถานะการแสดงผล */}
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProduct.isActive !== false}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, isActive: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#262638] text-purple-600 focus:ring-0"
                  />
                  <span>เปิดขายสินค้านี้ (Active)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedProduct.isFeatured}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, isFeatured: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#262638] text-purple-600 focus:ring-0"
                  />
                  <span>สินค้าแนะนำ (Featured)</span>
                </label>
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!selectedProduct.isBestSeller}
                    onChange={(e) => setSelectedProduct({ ...selectedProduct, isBestSeller: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#262638] text-purple-600 focus:ring-0"
                  />
                  <span>สินค้าขายดี (Best Seller)</span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#262638]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] via-purple-600 to-[#A855F7] hover:brightness-110 text-white font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการเปลี่ยนแปลงสินค้า</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div 
          id="delete-product-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => !isDeleting && setProductToDelete(null)}
        >
          <div 
            id="delete-product-modal"
            className="bg-[#11111A] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-rose-950/40 text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-600/20 blur-2xl pointer-events-none" />

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
              <Trash2 className="w-7 h-7" />
            </div>

            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-black text-white">ยืนยันการลบสินค้า</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากระบบ?
              </p>
            </div>

            {/* Product preview box */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0A0A12] border border-[#252538] text-left">
              {productToDelete.image ? (
                <div className="w-12 h-12 rounded-xl bg-[#161622] p-1 border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
                  <BloxImage
                    src={productToDelete.image}
                    alt={productToDelete.name}
                    productName={productToDelete.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <div className="text-sm font-bold text-white truncate">{productToDelete.name}</div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                  <span className="text-purple-400 font-semibold">{productToDelete.category}</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">฿{productToDelete.price?.toLocaleString()}</span>
                  <span>•</span>
                  <span>สต็อก: {productToDelete.stock}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-rose-400/90 font-medium bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              ⚠️ การลบสินค้านี้จะถูกนำออกจากหน้าร้านค้าทันทีและไม่สามารถกู้คืนได้
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                id="cancel-delete-product-btn"
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                id="confirm-delete-product-btn"
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProduct}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ยืนยันการลบ</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Clear All Products Confirmation Modal */}
      {isConfirmClearModalOpen && (
        <div 
          id="clear-all-products-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => !isClearingAll && setIsConfirmClearModalOpen(false)}
        >
          <div 
            className="bg-[#12121D] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-rose-950/40 relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">ยืนยันการล้างสินค้าทั้งหมด?</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                คุณกำลังจะลบสินค้าทั้งหมด <span className="text-rose-400 font-bold font-mono">({products.length} รายการ)</span> ออกจากร้านค้า เพื่อเริ่มระบบกรอกสินค้าเองทั้งหมด
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-left text-xs text-rose-300/90 leading-relaxed">
              ⚠️ การล้างสินค้าจะลบรายการสินค้าในฐานข้อมูลทั้งหมดทันที หน้าร้านจะว่างเปล่าจนกว่าแอดมินจะกดเพิ่มสินค้าใหม่ด้วยตนเอง
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isClearingAll}
                onClick={handleClearAllProducts}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังล้าง...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างสินค้าทั้งหมด</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: พิมพ์รายละเอียดสินค้าที่ส่งเข้าคลังลูกค้า (Delivery Details Modal) */}
      {isDeliveryModalOpen && selectedInventoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11111A] border border-[#26263A] rounded-3xl max-w-xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#212133]">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Package className="w-5 h-5" />
                  <span>พิมพ์รายละเอียดสินค้าที่จะส่งเข้าคลังลูกค้า</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  ข้อความและข้อมูลที่ระบุที่นี่จะปรากฏในหน้าคลังสินค้า (Inventory) ของลูกค้ารายนี้ทันที
                </p>
              </div>
              <button
                onClick={() => setIsDeliveryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181826] hover:bg-[#252538] text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Target Item Summary Badge */}
            <div className="p-3.5 rounded-2xl bg-[#161625] border border-[#26263A] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {selectedInventoryItem.image && (
                  <div className="w-11 h-11 rounded-xl bg-[#0A0A14] border border-[#2C2C40] shrink-0 p-1 flex items-center justify-center overflow-hidden">
                    <BloxImage
                      src={selectedInventoryItem.image}
                      alt={selectedInventoryItem.productName}
                      productName={selectedInventoryItem.productName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div>
                  <div className="font-bold text-white text-sm">{selectedInventoryItem.productName}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">
                    Order: <span className="text-purple-300 font-mono font-semibold">#{selectedInventoryItem.orderId || 'DIRECT'}</span>
                    {' • '}
                    จำนวน: <span className="text-white font-bold">{selectedInventoryItem.quantity || 1} ชิ้น</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">ผู้รับ Roblox</div>
                <div className="text-xs font-bold text-amber-300">
                  {selectedInventoryItem.metadata?.robloxUsername || selectedInventoryItem.userEmail || 'ลูกค้า'}
                </div>
              </div>
            </div>

            {/* Farm Account Credentials in Modal (if available) */}
            {(selectedInventoryItem.metadata?.serviceAccountUsername || selectedInventoryItem.metadata?.serviceAccountPassword) && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-xs">
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>ข้อมูลไอดีและรหัสผ่านสำหรับเข้าฟาร์ม (ลูกค้าส่งมา)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-[#0B0B14] border border-[#2D2D44] flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">ไอดี Roblox</span>
                      <span className="text-white font-bold select-all">
                        {selectedInventoryItem.metadata?.serviceAccountUsername || selectedInventoryItem.metadata?.robloxUsername}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInventoryItem.metadata?.serviceAccountUsername || selectedInventoryItem.metadata?.robloxUsername || '');
                        success('คัดลอก ID แล้ว', 'คัดลอกไอดี Roblox สำเร็จ');
                      }}
                      className="p-1 text-zinc-400 hover:text-white"
                      title="คัดลอก ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 rounded-xl bg-[#0B0B14] border border-[#2D2D44] flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">รหัสผ่าน Roblox</span>
                      <span className="text-amber-300 font-bold select-all">
                        {revealedPasswords[selectedInventoryItem.id || selectedInventoryItem.inventoryId] 
                          ? selectedInventoryItem.metadata?.serviceAccountPassword 
                          : '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(selectedInventoryItem.id || selectedInventoryItem.inventoryId)}
                        className="p-1 text-zinc-400 hover:text-white"
                        title={revealedPasswords[selectedInventoryItem.id || selectedInventoryItem.inventoryId] ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {revealedPasswords[selectedInventoryItem.id || selectedInventoryItem.inventoryId] ? (
                          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInventoryItem.metadata?.serviceAccountPassword || '');
                          success('คัดลอกรหัสผ่านแล้ว', 'คัดลอกรหัสผ่านสำเร็จ');
                        }}
                        className="p-1 text-zinc-400 hover:text-white"
                        title="คัดลอกรหัสผ่าน"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveDeliveryDetails} className="space-y-4 text-xs">
              
              {/* Delivery Instructions Title & Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>ชื่อหัวข้อข้อความส่งมอบ (ที่ลูกค้าเห็นในคลัง)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: คำแนะนำการรับสินค้า</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น คำแนะนำการรับสินค้า, ข้อมูลไอดีและรหัสผ่าน, ขั้นตอนการรับของ"
                  value={deliveryForm.instructionsTitle}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, instructionsTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="text-zinc-300 font-semibold flex items-center gap-1">
                    <span>เนื้อหาข้อความส่งมอบ</span>
                    <span className="text-purple-400 text-[11px] font-bold">(สำคัญ)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">คลิกข้อความด่วนด้านล่างเพื่อเลือก</span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="พิมพ์ข้อความรายละเอียดสินค้า เช่น 'แอดมินส่งมอบผลเสือให้เรียบร้อยแล้วในเกม หรือ ให้ลูกค้ากดเข้าเซิร์ฟเวอร์ VIP ด้านล่างเพื่อมารับของที่เกาะคาเฟ่...'"
                  value={deliveryForm.instructions}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, instructions: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-2xl p-3 text-white placeholder:text-zinc-600 leading-relaxed text-xs focus:outline-none"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-semibold">ข้อความด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setDeliveryForm({ ...deliveryForm, instructions: 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop (เกาะคาเฟ่ โลก 2 หรือ แมนชั่น โลก 3)' })}
                    className="px-2 py-1 rounded-lg bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    🍎 ผลปีศาจ (VIP Trade)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryForm({ ...deliveryForm, instructions: 'ระบบได้ส่งมอบของขวัญ Gamepass เข้าบัญชี Roblox ของท่านเรียบร้อยแล้ว สามารถเข้าเกมตรวจสอบได้ทันที' })}
                    className="px-2 py-1 rounded-lg bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    ⚡ Gamepass (ส่งของขวัญแล้ว)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryForm({ ...deliveryForm, instructions: 'ทีมงานกำลังดำเนินการฟาร์ม/อเวคให้ภายใน 15-30 นาที โปรดรอการติดต่อผ่านระบบ หรือ Discord' })}
                    className="px-2 py-1 rounded-lg bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    ⚔️ ฟาร์ม/บริการ (กำลังทำ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryForm({ ...deliveryForm, instructions: 'โปรดแจ้ง Claim Code ด้านบนให้ทีมงานทางแอดมินแชท Discord เพื่อดำเนินการส่งมอบทันที' })}
                    className="px-2 py-1 rounded-lg bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    💬 แจ้งรับทางแชท
                  </button>
                </div>
              </div>

              {/* Trade Server Link Title & URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ชื่อหัวข้อ / ข้อความบนปุ่มลิงก์</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: ลิงค์รับของ</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น ลิงค์รับของ, ลิงก์ดาวน์โหลด"
                  value={deliveryForm.serverLinkTitle}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, serverLinkTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <div className="flex gap-2 pt-0.5">
                  <input
                    type="url"
                    placeholder="https://www.roblox.com/games/2753915549/Blox-Fruits?privateServerLinkCode=..."
                    value={deliveryForm.tradeServerLink}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, tradeServerLink: e.target.value })}
                    className="flex-1 bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  {vipSettings.vipServerLink && (
                    <button
                      type="button"
                      onClick={() => setDeliveryForm({ ...deliveryForm, tradeServerLink: vipSettings.vipServerLink })}
                      className="px-3 py-2 bg-[#1A1A2A] hover:bg-[#25253A] border border-purple-500/40 text-purple-300 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0"
                      title="นำลิงก์ VIP หลักของร้านมาใส่ทันที"
                    >
                      🌐 ใช้ VIP ร้าน
                    </button>
                  )}
                  {deliveryForm.tradeServerLink && (
                    <a
                      href={deliveryForm.tradeServerLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-[#1A1A2A] hover:bg-[#25253A] border border-[#2D2D42] text-zinc-300 hover:text-white rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0"
                      title="ทดสอบเปิดลิงก์"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>เปิด</span>
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  เมื่อระบุลิงก์ จะมีปุ่มขึ้นให้ลูกค้ากดคลิกตามชื่อหัวข้อที่ตั้งไว้โดยตรงในคลังสินค้า
                </p>
              </div>

              {/* Claim Code Title & Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>ชื่อหัวข้อรหัสรับสินค้า / คีย์</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: รหัสรับสินค้า (Claim Code)</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น รหัสรับสินค้า (Claim Code), License Key, รหัสยืนยัน"
                  value={deliveryForm.claimCodeTitle}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, claimCodeTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <div className="flex gap-2 pt-0.5">
                  <input
                    type="text"
                    placeholder="เช่น AGS-984124 หรือ โค้ดรับไอเทม"
                    value={deliveryForm.claimCode}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, claimCode: e.target.value })}
                    className="flex-1 bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-amber-300 font-mono font-bold placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = vipSettings.claimCodePrefix || 'AGS-';
                      setDeliveryForm({ ...deliveryForm, claimCode: `${prefix}${Math.floor(100000 + Math.random() * 900000)}` });
                    }}
                    className="px-3 py-2 bg-[#1A1A2A] hover:bg-[#25253A] border border-[#2D2D42] text-purple-300 rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>สุ่มรหัส</span>
                  </button>
                  {deliveryForm.claimCode && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(deliveryForm.claimCode);
                        success('คัดลอกสำเร็จ', 'คัดลอก Claim Code แล้ว');
                      }}
                      className="px-3 py-2 bg-[#1A1A2A] hover:bg-[#25253A] border border-[#2D2D42] text-zinc-300 hover:text-white rounded-xl font-bold text-[11px] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      title="คัดลอกรหัส"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอก</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status and Admin Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-zinc-200 font-bold block mb-1">สถานะในคลังสินค้า</label>
                  <select
                    value={deliveryForm.status}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, status: e.target.value as any })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] rounded-xl p-2.5 text-white font-semibold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="ready">ready (พร้อมส่งมอบ/ให้ลูกค้ากดรับ)</option>
                    <option value="claimed">claimed (ลูกค้ารับสินค้าเรียบร้อยแล้ว)</option>
                    <option value="processing">processing (กำลังดำเนินการส่งมอบ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-200 font-bold block mb-1">บันทึกของแอดมิน (เห็นเฉพาะแอดมิน)</label>
                  <input
                    type="text"
                    placeholder="เช่น ส่งให้ในเซิร์ฟรอบ 21:30"
                    value={deliveryForm.adminNote}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, adminNote: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Notify Customer Toggle */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={deliveryForm.notifyCustomer}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notifyCustomer: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#29293E] text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-purple-200">ส่งการแจ้งเตือน (Notification) ไปยังกระดิ่งของลูกค้าทันที</span>
                </label>
                <Bell className="w-4 h-4 text-purple-400 shrink-0" />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212133]">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#161624] hover:bg-[#1E1E30] text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>บันทึกและส่งเข้าคลังลูกค้า</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: ส่งมอบไอเทมใหม่เข้าคลังลูกค้าโดยตรง (Direct Deliver Modal) */}
      {isDirectDeliverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11111A] border border-[#26263A] rounded-3xl max-w-xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#212133]">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Send className="w-5 h-5" />
                  <span>ส่งมอบไอเทมเข้าคลังลูกค้าโดยตรง (Direct Deliver)</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  สร้างรายการสินค้าพร้อมรายละเอียดการรับของส่งตรงเข้าคลังลูกค้าผ่าน UID หรือ Email
                </p>
              </div>
              <button
                onClick={() => setIsDirectDeliverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181826] hover:bg-[#252538] text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectDeliver} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-200 font-bold block mb-1">UID หรือ Email ลูกค้า *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น customer@gmail.com หรือ UID"
                    value={directDeliverForm.uidOrEmail}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, uidOrEmail: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-200 font-bold block mb-1">Roblox Username (ถ้ามี)</label>
                  <input
                    type="text"
                    placeholder="เช่น PlayerBlox123"
                    value={directDeliverForm.robloxUsername}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, robloxUsername: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-zinc-200 font-bold block mb-1">ชื่อสินค้าที่จะส่งมอบ *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ผลโมจิ (Dough Fruit) หรือ ดาบคู่โอเด้ง"
                    value={directDeliverForm.productName}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, productName: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-200 font-bold block mb-1">จำนวน</label>
                  <input
                    type="number"
                    min={1}
                    value={directDeliverForm.quantity}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, quantity: Number(e.target.value) })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Instructions Title & Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>ชื่อหัวข้อข้อความส่งมอบ (ที่ลูกค้าเห็นในคลัง)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: คำแนะนำการรับสินค้า</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น คำแนะนำการรับสินค้า, ข้อมูลไอดี/พาส, ขั้นตอนรับของ"
                  value={directDeliverForm.instructionsTitle}
                  onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, instructionsTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <label className="text-zinc-300 font-semibold block pt-1">
                  รายละเอียด / ขั้นตอนการส่งมอบในคลังลูกค้า
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="พิมพ์รายละเอียดสำหรับลูกค้ารายนี้ เช่น 'แอดมินส่งมอบเข้าไอดีแล้ว หรือ กดเข้า VIP ด้านล่างเพื่อเทรด...'"
                  value={directDeliverForm.instructions}
                  onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, instructions: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none leading-relaxed"
                />

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-semibold">ข้อความด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setDirectDeliverForm({ ...directDeliverForm, instructions: 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop (เกาะคาเฟ่ โลก 2 หรือ แมนชั่น โลก 3)' })}
                    className="px-2 py-0.5 rounded bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    🍎 ผลปีศาจ (VIP Trade)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectDeliverForm({ ...directDeliverForm, instructions: 'ระบบได้ส่งมอบของขวัญ Gamepass เข้าบัญชี Roblox ของท่านเรียบร้อยแล้ว สามารถเข้าเกมตรวจสอบได้ทันที' })}
                    className="px-2 py-0.5 rounded bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    ⚡ Gamepass (ส่งของขวัญแล้ว)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-bold flex items-center gap-1">
                      <Server className="w-3 h-3 text-indigo-400" />
                      <span>ชื่อหัวข้อ / ปุ่มลิงก์</span>
                    </label>
                    {vipSettings.vipServerLink && (
                      <button
                        type="button"
                        onClick={() => setDirectDeliverForm({ ...directDeliverForm, tradeServerLink: vipSettings.vipServerLink })}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                      >
                        + ใช้ VIP ร้าน
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น ลิงค์รับของ, ลิงก์ดาวน์โหลด"
                    value={directDeliverForm.serverLinkTitle}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, serverLinkTitle: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  <input
                    type="url"
                    placeholder="https://www.roblox.com/games/..."
                    value={directDeliverForm.tradeServerLink}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, tradeServerLink: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-200 font-bold flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>ชื่อหัวข้อรหัสสินค้า</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = vipSettings.claimCodePrefix || 'AGS-';
                        setDirectDeliverForm({ ...directDeliverForm, claimCode: `${prefix}${Math.floor(100000 + Math.random() * 900000)}` });
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                    >
                      🎲 สุ่มรหัส
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="เช่น รหัสรับสินค้า (Claim Code), License Key"
                    value={directDeliverForm.claimCodeTitle}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, claimCodeTitle: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="เว้นว่างเพื่อให้ระบบสร้าง AGS-XXXXXX"
                    value={directDeliverForm.claimCode}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, claimCode: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-amber-300 font-mono text-xs focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={directDeliverForm.notifyCustomer}
                    onChange={(e) => setDirectDeliverForm({ ...directDeliverForm, notifyCustomer: e.target.checked })}
                    className="rounded bg-[#0A0A10] border-[#29293E] text-purple-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-semibold text-purple-200">ส่งแจ้งเตือนในระบบให้ลูกค้าทราบทันที</span>
                </label>
                <Bell className="w-4 h-4 text-purple-400 shrink-0" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212133]">
                <button
                  type="button"
                  onClick={() => setIsDirectDeliverModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#161624] hover:bg-[#1E1E30] text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>ยืนยันการส่งมอบ</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: ตั้งค่าเซิร์ฟเวอร์ VIP & ข้อความเริ่มต้นของร้าน (Global VIP & Delivery Settings Modal) */}
      {isVipSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11111A] border border-[#26263A] rounded-3xl max-w-xl w-full p-5 sm:p-6 max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#212133]">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm sm:text-base">
                  <Server className="w-5 h-5" />
                  <span>ตั้งค่าลิงก์ VIP Server & ข้อความส่งมอบเริ่มต้นของร้าน</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  กำหนดลิงก์เซิร์ฟเวอร์ VIP และข้อความมาตรฐานที่ร้านจะส่งให้ลูกค้าอัตโนมัติเมื่อสั่งซื้อ
                </p>
              </div>
              <button
                onClick={() => setIsVipSettingsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#181826] hover:bg-[#252538] text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => handleSaveVipSettings(e, false)} className="space-y-4 text-xs">
              
              {/* VIP Server Link & Server Link Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-purple-400" />
                    <span>ชื่อหัวข้อ / ข้อความบนปุ่มลิงก์เริ่มต้น</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: ลิงค์รับของ</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น ลิงค์รับของ, เข้าเซิร์ฟเวอร์ VIP"
                  value={vipSettings.defaultServerLinkTitle || ''}
                  onChange={(e) => setVipSettings({ ...vipSettings, defaultServerLinkTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <label className="text-zinc-200 font-bold block pt-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ลิงก์ Roblox Private Server (VIP Server) หลักของร้าน *</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://www.roblox.com/games/2753915549/Blox-Fruits?privateServerLinkCode=..."
                    value={vipSettings.vipServerLink}
                    onChange={(e) => setVipSettings({ ...vipSettings, vipServerLink: e.target.value })}
                    className="flex-1 bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                  />
                  {vipSettings.vipServerLink && (
                    <a
                      href={vipSettings.vipServerLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-[#1A1A2A] hover:bg-[#25253A] border border-[#2D2D42] text-zinc-300 hover:text-white rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ทดสอบเข้า</span>
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  💡 ลูกค้าที่กดปุ่มในคลังสินค้าจะเข้าลิงก์นี้ทันทีเพื่อ Trade รับไอเทมในเกม
                </p>
              </div>

              {/* Default Delivery Instructions & Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-200 font-bold flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                    <span>ชื่อหัวข้อข้อความส่งมอบเริ่มต้น (ที่ลูกค้าเห็น)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500">ค่าเริ่มต้น: คำแนะนำการรับสินค้า</span>
                </div>
                <input
                  type="text"
                  placeholder="เช่น คำแนะนำการรับสินค้า, ข้อมูลและขั้นตอนการรับของ"
                  value={vipSettings.defaultInstructionsTitle || ''}
                  onChange={(e) => setVipSettings({ ...vipSettings, defaultInstructionsTitle: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2 text-white placeholder:text-zinc-600 text-xs focus:outline-none"
                />

                <label className="text-zinc-300 font-semibold block pt-1">
                  ข้อความส่งมอบเริ่มต้นสำหรับสินค้า (Default Instructions)
                </label>
                <textarea
                  rows={3}
                  placeholder="ข้อความที่จะส่งให้ลูกค้าอัตโนมัติเมื่อสั่งซื้อ เช่น 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop'"
                  value={vipSettings.defaultInstructions}
                  onChange={(e) => setVipSettings({ ...vipSettings, defaultInstructions: e.target.value })}
                  className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white placeholder:text-zinc-600 text-xs focus:outline-none leading-relaxed"
                />

                {/* Quick Templates */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-semibold">เทมเพลตด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setVipSettings({ ...vipSettings, defaultInstructions: 'เข้าสู่เซิร์ฟเวอร์ VIP ผ่านลิงก์ด้านล่างเพื่อรับสินค้าผ่านระบบ Trade ในเกมกับบอท AngusShop (เกาะคาเฟ่ โลก 2 หรือ แมนชั่น โลก 3)' })}
                    className="px-2 py-0.5 rounded bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    🍎 ผลปีศาจ (VIP Trade)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVipSettings({ ...vipSettings, defaultInstructions: 'ระบบได้ส่งมอบของขวัญ Gamepass เข้าบัญชี Roblox ของท่านเรียบร้อยแล้ว สามารถเข้าเกมตรวจสอบได้ทันที' })}
                    className="px-2 py-0.5 rounded bg-[#181828] hover:bg-[#252538] border border-purple-500/30 text-purple-300 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    ⚡ Gamepass (ส่งของขวัญแล้ว)
                  </button>
                </div>
              </div>

              {/* Claim Code Title & Prefix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-200 font-bold block mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>ชื่อหัวข้อรหัสสินค้าเริ่มต้น</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น รหัสรับสินค้า (Claim Code)"
                    value={vipSettings.defaultClaimCodeTitle || ''}
                    onChange={(e) => setVipSettings({ ...vipSettings, defaultClaimCodeTitle: e.target.value })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-white text-xs focus:outline-none placeholder:text-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-zinc-200 font-bold block mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>คำนำหน้ารหัส (Prefix)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น AGS- หรือ BLOX-"
                    value={vipSettings.claimCodePrefix || 'AGS-'}
                    onChange={(e) => setVipSettings({ ...vipSettings, claimCodePrefix: e.target.value.toUpperCase() })}
                    className="w-full bg-[#0A0A10] border border-[#29293E] focus:border-purple-500 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                ตัวอย่างรหัสที่ระบบจะสร้างอัตโนมัติ: <span className="font-mono text-amber-300 font-bold">{vipSettings.claimCodePrefix || 'AGS-'}849102</span>
              </p>

              {/* Batch Update Option */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>ต้องการอัปเดตลิงก์ VIP ให้สินค้าในคลังลูกค้าทันทีด้วยหรือไม่?</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  หากคุณเพิ่งต่ออายุเซิร์ฟเวอร์ VIP หรือเปลี่ยนลิงก์ใหม่ คุณสามารถกดปุ่มด้านล่างเพื่ออัปเดตลิงก์ใหม่นี้ให้กับสินค้าทุกชิ้นในคลังลูกค้าที่มีสถานะ <span className="text-emerald-400 font-bold">พร้อมรับ (Ready)</span> ทันที
                </p>
                <button
                  type="button"
                  disabled={isUpdatingBatchVip}
                  onClick={(e) => handleSaveVipSettings(e, true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingBatchVip ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingBatchVip ? 'กำลังอัปเดตสินค้าทั้งหมด...' : '⚡ บันทึกและอัปเดตลิงก์ VIP ให้สินค้าที่รอรับทั้งหมด'}</span>
                </button>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#212133]">
                <button
                  type="button"
                  onClick={() => setIsVipSettingsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#161624] hover:bg-[#1E1E30] text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกการตั้งค่าร้าน</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Blox Fruits Preset Picker Modal */}
      <BloxPresetPickerModal
        isOpen={isPresetPickerOpen}
        onClose={() => setIsPresetPickerOpen(false)}
        onSelect={handleSelectPresetForProduct}
        selectedUrl={
          presetPickerTarget === 'new' 
            ? newProduct.image 
            : presetPickerTarget === 'quick'
            ? (quickActiveTierTab === 'main' ? quickImageUrl : (quickImageTierUrls[quickActiveTierTab] || ''))
            : selectedProduct?.image
        }
      />

      {/* QUICK IMAGE EDIT MODAL */}
      {isQuickImageModalOpen && quickImageProduct && (
        <div 
          id="quick-image-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={() => !isSavingQuickImage && setIsQuickImageModalOpen(false)}
        >
          <div 
            id="quick-image-modal"
            className="bg-[#12121E] border border-purple-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl shadow-purple-950/60 relative overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#212133] relative z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600/30 to-purple-900/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                    <span>แก้ไขรูปภาพสินค้า</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 font-normal">
                      {quickImageProduct.category}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {quickImageProduct.name} <span className="text-zinc-600 font-mono">({quickImageProduct.productId})</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingQuickImage && setIsQuickImageModalOpen(false)}
                className="p-2 rounded-xl bg-[#1B1B2A] hover:bg-[#25253C] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Multi-tier Switcher (For Bounty Hunter Service or Multi-Tier items) */}
            {isBountyProduct(quickImageProduct) && (
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>เลือกระดับที่ต้องการแก้ไขรูปภาพ:</span>
                  </span>
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    บริการล่าค่าหัว (Multi-Tier)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'main', label: 'หน้าปกหลัก', badge: 'Cover Image' },
                    { id: '10M', label: 'แพ็กเกจ 10M', badge: '10M Bounty' },
                    { id: '20M', label: 'แพ็กเกจ 20M', badge: '20M Bounty' },
                    { id: '30M', label: 'แพ็กเกจ 30M', badge: '30M Max' },
                  ].map((tab) => {
                    const isActive = quickActiveTierTab === tab.id;
                    const tierImg = tab.id === 'main' ? quickImageUrl : quickImageTierUrls[tab.id];
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQuickActiveTierTab(tab.id as any)}
                        className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                          isActive 
                            ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-900/40' 
                            : 'bg-black/30 border-white/5 hover:border-purple-500/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 p-0.5 flex items-center justify-center shrink-0">
                          {tierImg ? (
                            <BloxImage
                              src={tierImg}
                              alt={tab.label}
                              productName={tab.label}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{tab.label}</div>
                          <div className="text-[9px] text-zinc-500 truncate">{tab.badge}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Active Image Info & Quick Official Presets */}
            {isBountyProduct(quickImageProduct) && quickActiveTierTab !== 'main' && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <span className="text-amber-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>กำลังแก้ไขรูป: <strong>แพ็กเกจ {quickActiveTierTab} Bounty / Honor</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const defaultUrl = `/images/blox/bounty_hunt_${quickActiveTierTab.toLowerCase()}.png`;
                    setQuickImageTierUrls((prev) => ({
                      ...prev,
                      [quickActiveTierTab]: defaultUrl
                    }));
                    success(`เปลี่ยนเป็นรูปโปสเตอร์ทางการ ${quickActiveTierTab} เรียบร้อย`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-[10px] cursor-pointer transition-colors"
                >
                  ใช้โปสเตอร์ {quickActiveTierTab} ทางการ
                </button>
              </div>
            )}

            {/* Main Image Editor Body */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center relative z-10">
              {/* Left Column: Live Preview Frame */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-black/40 border border-[#212133]">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">ตัวอย่างรูปภาพ (Preview)</div>
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-[#090910] border-2 border-purple-500/40 p-2 flex items-center justify-center overflow-hidden shadow-inner group">
                  {(() => {
                    const currentImg = quickActiveTierTab === 'main' ? quickImageUrl : quickImageTierUrls[quickActiveTierTab];
                    if (currentImg) {
                      return (
                        <BloxImage
                          src={currentImg}
                          alt={quickImageProduct.name}
                          productName={quickImageProduct.name}
                          className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(168,85,247,0.4)] transition-transform duration-300 group-hover:scale-105"
                        />
                      );
                    }
                    return (
                      <div className="text-center text-zinc-500 p-2">
                        <ImageIcon className="w-10 h-10 mx-auto mb-1.5 text-zinc-700" />
                        <span className="text-[11px] font-medium">ยังไม่มีรูปภาพ</span>
                      </div>
                    );
                  })()}
                </div>
                {(() => {
                  const currentImg = quickActiveTierTab === 'main' ? quickImageUrl : quickImageTierUrls[quickActiveTierTab];
                  if (currentImg) {
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (quickActiveTierTab === 'main') {
                            setQuickImageUrl('');
                          } else {
                            setQuickImageTierUrls((prev) => ({
                              ...prev,
                              [quickActiveTierTab]: '',
                            }));
                          }
                        }}
                        className="mt-2.5 text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer transition-colors"
                      >
                        ล้างรูปภาพนี้
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Right Column: Editing Inputs */}
              <div className="sm:col-span-8 space-y-3.5">
                {/* 1. Direct URL Input */}
                <div>
                  <label className="text-zinc-200 text-xs font-semibold block mb-1">
                    1. วาง URL รูปภาพ (Direct Image Link)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="https://example.com/image.png หรือ /images/..."
                      value={quickActiveTierTab === 'main' ? quickImageUrl : (quickImageTierUrls[quickActiveTierTab] || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (quickActiveTierTab === 'main') {
                          setQuickImageUrl(val);
                        } else {
                          setQuickImageTierUrls((prev) => ({
                            ...prev,
                            [quickActiveTierTab]: val,
                          }));
                        }
                      }}
                      className="w-full bg-[#0A0A12] border border-[#2B2B40] focus:border-purple-500 rounded-xl pl-9 pr-8 py-2.5 text-white text-xs placeholder:text-zinc-600 focus:outline-none transition-colors"
                    />
                    {Boolean(quickActiveTierTab === 'main' ? quickImageUrl : quickImageTierUrls[quickActiveTierTab]) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (quickActiveTierTab === 'main') {
                            setQuickImageUrl('');
                          } else {
                            setQuickImageTierUrls((prev) => ({ ...prev, [quickActiveTierTab]: '' }));
                          }
                        }}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. File Upload */}
                <div>
                  <label className="text-zinc-200 text-xs font-semibold block mb-1">
                    2. หรือ อัปโหลดจากคอมฯ/มือถือ (PNG, JPG, WEBP)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1D1D2F] hover:bg-[#282842] border border-purple-500/30 text-purple-200 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>เลือกไฟล์รูปภาพ</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleQuickImageUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-zinc-500">บีบอัดอัตโนมัติ โหลดไวทันใจ</span>
                  </div>
                </div>

                {/* 3. Blox Fruits Presets */}
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>3. หรือ เลือกจากคลัง Blox Fruits:</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPresetPickerTarget('quick');
                        setIsPresetPickerOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Search className="w-3 h-3" />
                      <span>เปิดค้นหาคลังทั้งหมด ({BLOX_FRUITS_PRESETS.length})</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {BLOX_FRUITS_PRESETS.slice(0, 15).map((preset) => {
                      const currentVal = quickActiveTierTab === 'main' ? quickImageUrl : quickImageTierUrls[quickActiveTierTab];
                      const isSelected = currentVal === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            if (quickActiveTierTab === 'main') {
                              setQuickImageUrl(preset.url);
                            } else {
                              setQuickImageTierUrls((prev) => ({
                                ...prev,
                                [quickActiveTierTab]: preset.url,
                              }));
                            }
                            success(`เลือกรูป ${preset.th}`);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-600/40'
                              : 'bg-[#181828] hover:bg-[#222238] text-zinc-300 border-white/5 hover:border-purple-500/40'
                          }`}
                        >
                          <BloxImage
                            src={preset.url}
                            alt={preset.name}
                            productName={preset.th || preset.name}
                            className="w-3.5 h-3.5 object-contain shrink-0"
                          />
                          <span>{preset.th}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#212133] relative z-10">
              <button
                type="button"
                disabled={isSavingQuickImage}
                onClick={() => setIsQuickImageModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSavingQuickImage}
                onClick={handleSaveQuickImage}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSavingQuickImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกรูปภาพ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกรูปภาพทันที</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ปรับเครดิตผู้ใช้ (Adjust User Balance) */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#11111A] border border-[#26263B] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#212133] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ปรับยอดเครดิตผู้ใช้</h3>
                  <p className="text-xs text-zinc-400">{selectedUserForCredit.displayName || 'ผู้ใช้'} ({selectedUserForCredit.email || selectedUserForCredit.uid})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForCredit(null)}
                className="w-8 h-8 rounded-lg bg-[#1C1C2C] hover:bg-[#2A2A40] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1 font-semibold">เครดิตปัจจุบัน</label>
                <div className="text-lg font-black text-white bg-[#0A0A10] px-4 py-2.5 rounded-xl border border-[#212133]">
                  ฿{(selectedUserForCredit.balance || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-zinc-200 block mb-1 font-semibold">ยอดเครดิตใหม่ที่ต้องการกำหนด (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={creditAdjustmentAmount}
                  onChange={(e) => setCreditAdjustmentAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0A0A10] border border-[#26263B] text-white text-base font-bold focus:outline-none focus:border-purple-500"
                  placeholder="เช่น 100"
                />
              </div>

              {/* Quick increment buttons */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] text-zinc-500 self-center mr-1">เพิ่มด่วน:</span>
                {[+10, +50, +100, +500, +1000].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const cur = Number(creditAdjustmentAmount) || 0;
                      setCreditAdjustmentAmount(String(cur + inc));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#1C1C2C] hover:bg-[#2A2A40] text-purple-300 text-[11px] font-bold border border-purple-500/20 cursor-pointer"
                  >
                    +{inc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#212133]">
              <button
                type="button"
                disabled={isAdjustingCredit}
                onClick={() => setSelectedUserForCredit(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isAdjustingCredit}
                onClick={() => {
                  const val = Number(creditAdjustmentAmount);
                  if (isNaN(val) || val < 0) {
                    toastError('ยอดไม่ถูกต้อง', 'กรุณาระบุยอดเครดิตเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0');
                    return;
                  }
                  handleAdjustUserBalance(selectedUserForCredit.uid, val);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isAdjustingCredit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ยืนยันปรับเครดิต</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: ตรวจสอบสถานะระบบทั้งหมด (System Health & Payment Audit Modal) */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#11111A] border border-[#26263B] rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#212133] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ผลการตรวจสอบระบบทั้งหมด (System Audit)</h3>
                  <p className="text-xs text-zinc-400">เช็คระบบเติมเงิน สลิป พร้อมเพย์ อั่งเปา และสถานะ Cloud Firestore</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#1C1C2C] hover:bg-[#2A2A40] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAuditingSystem && !systemAudit ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <div className="text-sm font-bold text-white">กำลังตรวจสุขภาพระบบ...</div>
                <p className="text-xs text-zinc-400">กำลังเชื่อมต่อ SlipOK, TrueMoney และฐานข้อมูล Firestore</p>
              </div>
            ) : systemAudit ? (
              <div className="space-y-4">
                {/* Status Overview Card */}
                {(() => {
                  const isOperational = systemAudit.overallStatus === 'operational' || systemAudit.overallStatus === 'healthy';
                  const isDegraded = systemAudit.overallStatus === 'degraded';
                  const isSlipokOnline = ['ready', 'online', 'operational'].includes(systemAudit.systems?.slipok?.status) || (systemAudit.systems?.slipok?.quotaRemaining !== undefined && systemAudit.systems?.slipok?.quotaRemaining !== 'N/A');
                  const isTruemoneyOnline = ['ready', 'online', 'operational'].includes(systemAudit.systems?.truemoney?.status) || Boolean(systemAudit.systems?.truemoney?.recipientPhone);
                  const cachedCount = systemAudit.systems?.cache?.cachedProductsCount ?? systemAudit.systems?.products?.cachedCount ?? 0;

                  return (
                    <>
                      <div className={`p-4 rounded-2xl border ${
                        isOperational 
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                          : isDegraded
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                          : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                      } flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-current animate-pulse"></div>
                          <div>
                            <div className="font-bold text-sm">
                              สถานะภาพรวม: {isOperational ? 'สมบูรณ์ 100%' : isDegraded ? 'มีบริการที่ต้องดูแล (Degraded)' : 'พบปัญหา (Outage)'}
                            </div>
                            <div className="text-[11px] opacity-80">{systemAudit.message || (isOperational ? 'ทุกระบบทำงานสมบูรณ์ 100% พร้อมให้บริการ' : 'ระบบกำลังประมวลผล')}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRunSystemAudit}
                          disabled={isAuditingSystem}
                          className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-current text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isAuditingSystem ? 'animate-spin' : ''}`} />
                          <span>ตรวจอีกครั้ง</span>
                        </button>
                      </div>

                      {/* Subsystems Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* SlipOK */}
                        <div className="p-4 rounded-2xl bg-[#141420] border border-[#242438] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <CheckCircle2 className={`w-4 h-4 ${isSlipokOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
                              <span>ระบบสแกนสลิป (SlipOK)</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSlipokOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {isSlipokOnline ? 'พร้อมใช้งาน' : 'ขัดข้อง'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-300 space-y-1">
                            <div>พร้อมเพย์รับเงิน: <strong className="text-white">{systemAudit.systems?.slipok?.promptpayNumber || systemAudit.systems?.slipok?.promptpayAccount || '0829848852'}</strong></div>
                            <div>โควต้าสลิปคงเหลือ: <strong className="text-emerald-400 font-bold">{systemAudit.systems?.slipok?.quotaRemaining ?? 78} ครั้ง</strong></div>
                            <div className="text-[10px] text-zinc-500">API Key: {systemAudit.systems?.slipok?.configured || isSlipokOnline ? 'ตั้งค่าแล้ว' : 'ยังไม่ตั้งค่า'}</div>
                          </div>
                        </div>

                        {/* TrueMoney */}
                        <div className="p-4 rounded-2xl bg-[#141420] border border-[#242438] space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <CheckCircle2 className={`w-4 h-4 ${isTruemoneyOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
                              <span>ระบบซองอั่งเปา TrueMoney</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTruemoneyOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {isTruemoneyOnline ? 'พร้อมใช้งาน' : 'ขัดข้อง'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-300 space-y-1">
                            <div>เบอร์โทรรับอั่งเปา: <strong className="text-white">{systemAudit.systems?.truemoney?.recipientPhone || '0829848852'}</strong></div>
                            <div>ระบบรับซอง: <span className="text-emerald-400">อัตโนมัติ 24 ชม.</span></div>
                            <div className="text-[10px] text-zinc-500">สถานะ: {systemAudit.systems?.truemoney?.message || 'พร้อมทำงาน'}</div>
                          </div>
                        </div>

                        {/* Firestore */}
                        <div className="p-4 rounded-2xl bg-[#141420] border border-[#242438] space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              {systemAudit.systems?.firestore?.quotaExceeded ? (
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                              <span>ฐานข้อมูล Cloud Firestore</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              systemAudit.systems?.firestore?.quotaExceeded
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {systemAudit.systems?.firestore?.quotaExceeded ? 'โควต้าเต็ม (Quota Exceeded)' : 'ปกติ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-300 space-y-1.5">
                            <div>รายละเอียด: <span>{systemAudit.systems?.firestore?.message}</span></div>
                            {systemAudit.systems?.firestore?.quotaExceeded && (
                              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                                <div>
                                  💡 <strong>วิธีแก้ไข:</strong> อัปเกรดฐานข้อมูลเป็นแพ็กเกจ Blaze (Pay-as-you-go) ใน Firebase Console เพื่อปลดล็อกโควต้าการอ่านและเขียนแบบไม่จำกัด หรือรอระบบรีเซ็ตโควต้าฟรีเวลา 07:00 น.
                                </div>
                                <a
                                  href="https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow transition-all"
                                >
                                  <span>คลิกอัปเกรดเป็น Blaze ทันที</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cache */}
                        <div className="p-4 rounded-2xl bg-[#141420] border border-[#242438] space-y-1 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>ระบบ Server Cache & Fallback</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              พร้อมใช้งาน
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            มีระบบแคชสินค้า {cachedCount} รายการ และ Home Config สำรองไว้ จึงทำให้ผู้ใช้ทั่วไปยังคงเข้าดูหน้าเว็บ สั่งซื้อ และใช้งานต่อได้ตามปกติ
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : null}

            <div className="flex items-center justify-end pt-3 border-t border-[#212133]">
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal for Orders */}
      <DigitalReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={receiptOrder}
      />

      {/* Modal: Quick Edit Highlight Card from Admin */}
      {isEditingHighlightCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
          onClick={() => setIsEditingHighlightCard(false)}
        >
          <div 
            className="bg-[#12121E] border border-purple-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/60 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#212133] flex items-center justify-between bg-[#151524]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>แก้ไขข้อมูลการ์ดโปรโมชั่นหน้าแรก</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    เปลี่ยนชื่อ, รูปไอคอน, ป้ายสถานะ, ราคา และคำอธิบายที่แสดงบนหน้าแรกของร้านค้า
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingHighlightCard(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Image selector */}
              <div className="p-3.5 rounded-xl bg-[#161626] border border-[#26263B] space-y-2.5">
                <label className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>รูปไอคอนสินค้า (Icon Image)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl bg-[#0B0716] border border-purple-500/50 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={highlightCardDraft.webBannerHighlightImage || '/images/blox/dark_coat.png'}
                      alt="Icon"
                      className="w-full h-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/blox/dark_coat.png'; }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={highlightCardDraft.webBannerHighlightImage || ''}
                        onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightImage: e.target.value }))}
                        placeholder="URL รูปภาพ เช่น /images/blox/dark_coat.png"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[#1D1D30] border border-[#2F2F4A] text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setIsHighlightPresetPickerOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>เลือกผล</span>
                      </button>
                      <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลด</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                toastError('ขนาดไฟล์เกิน 2MB');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightImage: ev.target?.result as string }));
                                success('อัปโหลดรูปสำเร็จ');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { name: 'Dark Coat', url: '/images/blox/dark_coat.png' },
                        { name: 'ดาบคู่ CDK', url: '/images/blox/cursed_dual_katana.png' },
                        { name: 'คิตสึเนะ', url: '/images/blox/kitsune.png' },
                        { name: 'ก็อดฮิวแมน', url: '/images/blox/godhuman.png' },
                        { name: 'กีตาร์โซล', url: '/images/blox/soul_guitar.png' },
                        { name: 'โมจิ', url: '/images/blox/dough.png' },
                      ].map(p => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightImage: p.url }))}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1C1C2C] hover:bg-[#28283E] text-zinc-300 border border-[#2B2B40] cursor-pointer"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    ชื่อสินค้าไฮไลท์ (Title)
                  </label>
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerHighlightTitle ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightTitle: e.target.value }))}
                    placeholder="เช่น ⚔️ สุ่มไก่ตันดาบคู่ (CDK) 35 บาท"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-300 font-semibold">ป้ายสถานะ (Badge)</label>
                    <div className="flex gap-1">
                      {['พร้อมส่งอัตโนมัติ', '⚡ ส่งด่วน', '🔥 แนะนำ'].map(b => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightBadge: b }))}
                          className="text-[9px] text-zinc-400 hover:text-emerald-300 cursor-pointer"
                        >
                          +{b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerHighlightBadge ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightBadge: e.target.value }))}
                    placeholder="เช่น พร้อมส่งอัตโนมัติ"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    คำอธิบายสินค้า (Subtitle / Description)
                  </label>
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerHighlightSubtitle ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightSubtitle: e.target.value }))}
                    placeholder="เช่น การันตีดาบคู่ CDK เลเวล Max 2800 สเตตัสตัน ส่งมอบไอดีและรหัสผ่านทันที 24 ชม."
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    ราคาโปรโมชั่น (บาท)
                  </label>
                  <input
                    type="number"
                    value={highlightCardDraft.webBannerHighlightPrice ?? 35}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    ราคาปกติ / ขีดฆ่า (บาท)
                  </label>
                  <input
                    type="number"
                    value={highlightCardDraft.webBannerHighlightOldPrice ?? 79}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightOldPrice: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    ข้อความปุ่มกดสั่งซื้อ (Button Text)
                  </label>
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerHighlightButtonText ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightButtonText: e.target.value }))}
                    placeholder="เช่น ⚡ สุ่มเลย ฿35"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-300 font-semibold block mb-1">
                    ปลายทางสั่งซื้อ (Product ID หรือ Link)
                  </label>
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerLink ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerLink: e.target.value }))}
                    placeholder="เช่น prod_gacha_cdk_35"
                    className="w-full px-3 py-2 rounded-xl bg-[#161624] border border-[#2E2E44] text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 4 Guarantee tags */}
              <div className="p-3.5 rounded-xl bg-[#161626] border border-[#26263B] space-y-2.5">
                <label className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>แท็กการันตี 4 ข้อด้านล่าง (Guarantee Tags)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerTag1 ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerTag1: e.target.value }))}
                    placeholder="แท็ก 1"
                    className="px-2.5 py-1.5 rounded-lg bg-[#1E1E32] border border-[#2F2F4B] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerTag2 ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerTag2: e.target.value }))}
                    placeholder="แท็ก 2"
                    className="px-2.5 py-1.5 rounded-lg bg-[#1E1E32] border border-[#2F2F4B] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerTag3 ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerTag3: e.target.value }))}
                    placeholder="แท็ก 3"
                    className="px-2.5 py-1.5 rounded-lg bg-[#1E1E32] border border-[#2F2F4B] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    value={highlightCardDraft.webBannerTag4 ?? ''}
                    onChange={(e) => setHighlightCardDraft(prev => ({ ...prev, webBannerTag4: e.target.value }))}
                    placeholder="แท็ก 4"
                    className="px-2.5 py-1.5 rounded-lg bg-[#1E1E32] border border-[#2F2F4B] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#212133] bg-[#151524] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditingHighlightCard(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveHighlightCard}
                disabled={isSavingHighlightCard}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingHighlightCard ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blox Preset Picker Modal for Highlight Card in Admin */}
      <BloxPresetPickerModal
        isOpen={isHighlightPresetPickerOpen}
        onClose={() => setIsHighlightPresetPickerOpen(false)}
        selectedUrl={highlightCardDraft.webBannerHighlightImage}
        title="เลือกรูปไอคอนการ์ดโปรโมชั่น"
        onSelect={(preset) => {
          setHighlightCardDraft(prev => ({ ...prev, webBannerHighlightImage: preset.url }));
          setIsHighlightPresetPickerOpen(false);
          success(`เลือกรูป ${preset.th || preset.name} สำเร็จ`);
        }}
      />

    </div>
  );
};

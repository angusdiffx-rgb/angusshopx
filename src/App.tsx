import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { HomeConfigProvider } from './context/HomeConfigContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { HomeView } from './views/HomeView';
import { ShopView } from './views/ShopView';
import { ProductDetailView } from './views/ProductDetailView';
import { WalletView } from './views/WalletView';
import { CheckoutView } from './views/CheckoutView';
import { InventoryView } from './views/InventoryView';
import { OrdersView } from './views/OrdersView';
import { AccountView } from './views/AccountView';
import { AdminView } from './views/AdminView';
import { collection, getDocs } from 'firebase/firestore';
import { db, isQuotaExceededError } from './lib/firebase';
import { initialProducts } from './data/initialProducts';
import type { Product, Order } from './types';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';

const PRODUCTS_CACHE_KEY = 'angus_cached_products';

const getInitialProducts = (): Product[] => {
  try {
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return initialProducts || [];
};

function MainShop() {
  const { addToCart } = useCart();
  const [currentView, setCurrentView] = useState<string>('home');
  const [navParam, setNavParam] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [hideQuotaNotice, setHideQuotaNotice] = useState(false);

  // Keep-alive Ping to prevent Render from sleeping
  useEffect(() => {
    // Ping every 4 minutes (4 * 60 * 1000 = 240000ms)
    const interval = setInterval(() => {
      fetch('/api/health')
        .then(res => res.json())
        .catch(() => {});
    }, 240000);

    return () => clearInterval(interval);
  }, []);

  // Fetch products with smart caching (Zero continuous Firestore reads for visitors):
  // 1. Initial render from localStorage (0ms, 0 reads)
  // 2. Fetch from /api/products (which is server-cached in memory for 5 minutes, 0 Firestore reads)
  // 3. Fallback to direct Firestore getDocs only if /api/products fails
  // 4. Listen for 'productsUpdated' custom event to immediately re-fetch with force=true
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async (force = false) => {
      try {
        const res = await fetch(`/api/products${force ? '?force=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            if (isMounted) {
              setProducts(data.products);
              setQuotaExceeded(false);
            }
            try {
              localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(data.products));
            } catch {}
            return;
          }
        }
      } catch (err) {
        console.warn('API /api/products notice:', err);
      }

      // If /api/products was not available (e.g. running client-only dev), try one-time Firestore getDocs
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty && isMounted) {
          const list: Product[] = [];
          snap.forEach((d) => {
            const item = d.data() as Product;
            list.push({ ...item, productId: item.productId || d.id });
          });
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setProducts(list);
          setQuotaExceeded(false);
          try {
            localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list));
          } catch {}
        }
      } catch (fbErr: any) {
        if (isQuotaExceededError(fbErr)) {
          if (isMounted) setQuotaExceeded(true);
        }
      }
    };

    // Initial fetch from server cache
    fetchProducts();

    // Smart visibility/focus refresh: only re-check if tab becomes active and 15+ minutes have passed
    let lastFetched = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetched > 15 * 60 * 1000) {
        lastFetched = Date.now();
        fetchProducts();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Listen to immediate updates triggered by Admin changes
    const handleProductsUpdated = () => {
      lastFetched = Date.now();
      fetchProducts(true);
    };
    window.addEventListener('productsUpdated', handleProductsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('productsUpdated', handleProductsUpdated);
    };
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setNavParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    addToCart(product, quantity);
    setSelectedProduct(product);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderCompleted = (order: Order) => {
    setLastOrder(order);
    setCurrentView('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08080C] text-white selection:bg-purple-600 selection:text-white">
      {/* Quota Exceeded Notice Banner */}
      {quotaExceeded && !hideQuotaNotice && (
        <div id="quota-exceeded-banner" className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>แจ้งเตือนโควต้า:</strong> โควต้าการอ่านฟรีประจำวันของ Firestore เต็มแล้ว (50,000 reads/วัน) — ระบบเปิดใช้แคชออฟไลน์อัตโนมัติ หน้าร้านยังสามารถเรียกดูสินค้าเดิมได้ตามปกติ และจะรีเซ็ตใหม่อัตโนมัติเวลาเที่ยงคืน
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a 
                href="https://console.firebase.google.com/project/angusshopx2/firestore/databases/ai-studio-remixangusshop-2abe89df-2474-4dff-adaa-6fff1a4696e5/data?openUpgradeDialog=true" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-amber-400 hover:underline"
              >
                <span>อัปเกรดแพ็กเกจ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button 
                onClick={() => setHideQuotaNotice(true)}
                className="p-1 hover:bg-amber-500/20 rounded text-amber-300"
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSearch={(term) => handleNavigate('shop', term)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            products={products}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'shop' && (
          <ShopView
            products={products}
            initialCategory={['ผลปีศาจ', 'Gamepass', 'ไอเทม', 'บริการ', 'อื่นๆ', 'ทั้งหมด'].includes(navParam || '') ? navParam : 'ทั้งหมด'}
            initialSearch={['ผลปีศาจ', 'Gamepass', 'ไอเทม', 'บริการ', 'อื่นๆ', 'ทั้งหมด'].includes(navParam || '') ? '' : (navParam || '')}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            allProducts={products}
            onSelectProduct={handleSelectProduct}
            onBack={() => handleNavigate('shop')}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'wallet' && <WalletView />}

        {currentView === 'checkout' && (
          <CheckoutView
            onNavigate={handleNavigate}
            onOrderCompleted={handleOrderCompleted}
          />
        )}

        {currentView === 'inventory' && <InventoryView />}

        {currentView === 'orders' && <OrdersView onNavigate={handleNavigate} />}

        {currentView === 'account' && <AccountView onNavigate={handleNavigate} />}

        {currentView === 'admin' && (
          <AdminView 
            products={products} 
            setProducts={setProducts} 
          />
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* Auth Modal (Login / Register) */}
      <AuthModal />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HomeConfigProvider>
        <CartProvider>
          <ToastProvider>
            <MainShop />
          </ToastProvider>
        </CartProvider>
      </HomeConfigProvider>
    </AuthProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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
import { collection, onSnapshot } from 'firebase/firestore';
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

  // Subscribe to products in Firestore (Realtime with local cache & graceful fallback)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        // If empty in firestore, maintain cache or initial products
        setProducts(prev => prev.length > 0 ? prev : initialProducts);
      } else {
        const list: Product[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as Product;
          list.push({
            ...item,
            productId: item.productId || d.id
          });
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setProducts(list);
        setQuotaExceeded(false);
        try {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(list));
        } catch {}
      }
    }, (err: any) => {
      console.warn('Products onSnapshot notice:', err);
      if (isQuotaExceededError(err)) {
        setQuotaExceeded(true);
      }
      // Never leave products empty on error or quota limit
      setProducts(prev => prev.length > 0 ? prev : getInitialProducts());
    });

    return () => unsub();
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

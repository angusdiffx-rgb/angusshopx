import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
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
import { collection, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import type { Product, Order } from './types';

function MainShop() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [navParam, setNavParam] = useState<string | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Dynamic Favicon Setup
  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'settings', 'homeConfig');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const config = docSnap.data();
          if (config.siteLogo) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = config.siteLogo;
          }
        }
      } catch (error) {
        console.error("Error fetching site logo for favicon:", error);
      }
    };
    fetchFavicon();
  }, []);

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

  // Subscribe to products in Firestore (Realtime - manual entry only)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        setProducts([]);
      } else {
        const list: Product[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Product);
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setProducts(list);
      }
    }, (err) => {
      console.warn('Products onSnapshot notice:', err);
      setProducts([]);
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
            initialCategory={navParam}
            initialSearch={navParam}
            onSelectProduct={handleSelectProduct}
            onBuyNow={handleBuyNow}
          />
        )}

        {currentView === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
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

        {currentView === 'admin' && <AdminView />}
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
      <CartProvider>
        <ToastProvider>
          <MainShop />
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

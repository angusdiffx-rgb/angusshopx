import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db, getDocSmart } from '../lib/firebase';
import type { HomeConfig } from '../types';
import { DEFAULT_HOME_CONFIG } from '../data/bloxPresets';

interface HomeConfigContextType {
  homeConfig: HomeConfig;
  loading: boolean;
  updateHomeConfig: (newConfig: Partial<HomeConfig>) => Promise<void>;
  saveFullHomeConfig: (fullConfig: HomeConfig) => Promise<void>;
}

const CACHE_KEY = 'angus_cached_home_config';

const getInitialHomeConfig = (): HomeConfig => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_HOME_CONFIG,
        ...parsed,
        trendingItems: parsed.trendingItems?.length ? parsed.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
        promoCard1: parsed.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
        promoCard2: parsed.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
      };
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_HOME_CONFIG;
};

const HomeConfigContext = createContext<HomeConfigContextType | undefined>(undefined);

export const HomeConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(getInitialHomeConfig);
  const [loading, setLoading] = useState(false);

  // Synchronize dynamic favicon
  const applyFavicon = (logoUrl?: string) => {
    if (!logoUrl) return;
    try {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      if (link.href !== logoUrl) {
        link.href = logoUrl;
      }
    } catch {
      // ignore
    }
  };

  // Single shared loader for homeConfig with server caching & local persistence (Zero continuous Firestore reads)
  useEffect(() => {
    // Apply cached favicon immediately
    if (homeConfig.siteLogo) {
      applyFavicon(homeConfig.siteLogo);
    }

    let isMounted = true;

    const fetchConfig = async (force = false) => {
      try {
        const res = await fetch(`/api/home-config${force ? '?force=true' : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.config) {
            const serverData = data.config as Partial<HomeConfig>;
            const merged: HomeConfig = {
              ...DEFAULT_HOME_CONFIG,
              ...serverData,
              trendingItems: serverData.trendingItems?.length ? serverData.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
              promoCard1: serverData.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
              promoCard2: serverData.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
            };
            if (isMounted) {
              setHomeConfig(merged);
              if (merged.siteLogo) {
                applyFavicon(merged.siteLogo);
              }
            }
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
            } catch {}
            return;
          }
        }
      } catch (err) {
        // network or dev fallback
      }

      // If cached in localStorage already, avoid unnecessary Firestore network calls
      const existingCached = localStorage.getItem(CACHE_KEY);
      if (existingCached) {
        try {
          const parsed = JSON.parse(existingCached);
          if (parsed && typeof parsed === 'object') {
            return;
          }
        } catch {}
      }

      // Check IndexedDB local cache first (0 network reads)
      try {
        const cachedSnap = await getDocFromCache(doc(db, 'settings', 'homeConfig'));
        if (cachedSnap.exists() && isMounted) {
          const data = cachedSnap.data() as HomeConfig;
          const merged: HomeConfig = {
            ...DEFAULT_HOME_CONFIG,
            ...data,
            trendingItems: data.trendingItems?.length ? data.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
            promoCard1: data.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
            promoCard2: data.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
          };
          setHomeConfig(merged);
          if (merged.siteLogo) {
            applyFavicon(merged.siteLogo);
          }
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
          } catch {}
          return;
        }
      } catch {}

      // Fallback: smart cache-first read from Firestore only if API unreachable and cache is empty
      try {
        const docSnap = await getDocSmart(doc(db, 'settings', 'homeConfig'));
        if (docSnap.exists() && isMounted) {
          const data = docSnap.data() as HomeConfig;
          const merged: HomeConfig = {
            ...DEFAULT_HOME_CONFIG,
            ...data,
            trendingItems: data.trendingItems?.length ? data.trendingItems : DEFAULT_HOME_CONFIG.trendingItems,
            promoCard1: data.promoCard1 || DEFAULT_HOME_CONFIG.promoCard1,
            promoCard2: data.promoCard2 || DEFAULT_HOME_CONFIG.promoCard2,
          };
          setHomeConfig(merged);
          if (merged.siteLogo) {
            applyFavicon(merged.siteLogo);
          }
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
          } catch {}
        }
      } catch (err: any) {
        console.warn('HomeConfig notice (using local cached config):', err?.message || err);
      }
    };

    fetchConfig();

    // Smart visibility/focus refresh: only check when user returns to active tab after 20+ minutes
    let lastFetched = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetched > 20 * 60 * 1000) {
        lastFetched = Date.now();
        fetchConfig();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    const handleConfigUpdated = () => {
      lastFetched = Date.now();
      fetchConfig(true);
    };
    window.addEventListener('homeConfigUpdated', handleConfigUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('homeConfigUpdated', handleConfigUpdated);
    };
  }, []);

  const updateHomeConfig = async (newConfig: Partial<HomeConfig>) => {
    const updated = { ...homeConfig, ...newConfig, updatedAt: new Date().toISOString() };
    setHomeConfig(updated);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      // Save via API to invalidate server cache immediately
      const token = await auth.currentUser?.getIdToken().catch(() => undefined);
      fetch('/api/admin/update-home-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ config: updated })
      }).catch(() => {});
      // Also save directly to Firestore as fallback
      await setDoc(doc(db, 'settings', 'homeConfig'), updated, { merge: true });
      window.dispatchEvent(new CustomEvent('homeConfigUpdated'));
    } catch (err) {
      console.warn('Could not save home config to Firestore:', err);
    }
  };

  const saveFullHomeConfig = async (fullConfig: HomeConfig) => {
    const updated = { ...fullConfig, updatedAt: new Date().toISOString() };
    setHomeConfig(updated);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      const token = await auth.currentUser?.getIdToken().catch(() => undefined);
      fetch('/api/admin/update-home-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ config: updated })
      }).catch(() => {});
      await setDoc(doc(db, 'settings', 'homeConfig'), updated, { merge: true });
      window.dispatchEvent(new CustomEvent('homeConfigUpdated'));
    } catch (err) {
      console.warn('Could not save full home config to Firestore:', err);
      throw err;
    }
  };

  return (
    <HomeConfigContext.Provider value={{ homeConfig, loading, updateHomeConfig, saveFullHomeConfig }}>
      {children}
    </HomeConfigContext.Provider>
  );
};

export const useHomeConfig = () => {
  const context = useContext(HomeConfigContext);
  if (!context) {
    throw new Error('useHomeConfig must be used within a HomeConfigProvider');
  }
  return context;
};

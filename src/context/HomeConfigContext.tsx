import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

  // Single shared listener for homeConfig with persistent cache support
  useEffect(() => {
    // Apply cached favicon immediately
    if (homeConfig.siteLogo) {
      applyFavicon(homeConfig.siteLogo);
    }

    const unsub = onSnapshot(doc(db, 'settings', 'homeConfig'), (docSnap) => {
      if (docSnap.exists()) {
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
        } catch {
          // localStorage full or restricted
        }
      }
    }, (err: any) => {
      // If quota exceeded or offline, graceful fallback without crash
      console.warn('HomeConfig notice (using local cached config):', err?.message || err);
    });

    return () => unsub();
  }, []);

  const updateHomeConfig = async (newConfig: Partial<HomeConfig>) => {
    const updated = { ...homeConfig, ...newConfig, updatedAt: new Date().toISOString() };
    setHomeConfig(updated);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'homeConfig'), updated, { merge: true });
    } catch (err) {
      console.warn('Could not save home config to Firestore:', err);
    }
  };

  const saveFullHomeConfig = async (fullConfig: HomeConfig) => {
    const updated = { ...fullConfig, updatedAt: new Date().toISOString() };
    setHomeConfig(updated);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      await setDoc(doc(db, 'settings', 'homeConfig'), updated, { merge: true });
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

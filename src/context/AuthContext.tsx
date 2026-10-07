import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  signUpWithEmail,
  loginWithEmailCredentials,
  formatAuthErrorMessage,
  isUserCancellation,
  logout, 
  onAuthStateChanged,
  type FirebaseUser 
} from '../lib/firebase';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  clearError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isAdmin: boolean;
  unlockAdminMode: (passcode?: string) => boolean;
  lockAdminMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_CACHE_KEY = 'angus_cached_user_profile';

const getInitialUser = (): UserProfile | null => {
  try {
    const saved = localStorage.getItem(USER_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(getInitialUser);
  const [loading, setLoading] = useState(!getInitialUser());
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setError(null);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;
    let currentFbUser: FirebaseUser | null = null;

    const detachUserListener = () => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
    };

    const attachUserListener = (fbUser: FirebaseUser) => {
      detachUserListener();

      const userRef = doc(db, 'users', fbUser.uid);
      
      // Listen to real-time changes on user document (balance, role, etc.)
      unsubscribeUserDoc = onSnapshot(userRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUser(data);
          setLoading(false);
          try {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
          } catch {}
        } else {
          // Create user profile if not exists
          const now = new Date().toISOString();
          const emailLower = (fbUser.email || '').toLowerCase().trim();
          const isAdmin = emailLower === 'otinrealxz@gmail.com' || emailLower === 'angusdiffx@gmail.com';
          const initialUser: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'Blox Player',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
            role: isAdmin ? 'admin' : 'user',
            balance: 0,
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
          };
          await setDoc(userRef, initialUser);
          setUser(initialUser);
          setLoading(false);
          try {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(initialUser));
          } catch {}
        }
      }, (err) => {
        console.warn('User snapshot notice:', err?.message || err);
        // On quota error, preserve cached profile so the user is never logged out
        setLoading(false);
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      currentFbUser = fbUser;
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Only attach real-time listener if tab is currently visible
        if (typeof document === 'undefined' || document.visibilityState === 'visible') {
          attachUserListener(fbUser);
        } else {
          setLoading(false);
        }
      } else {
        detachUserListener();
        setUser(null);
        setLoading(false);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
        } catch {}
      }
    });

    // Smart Visibility Connection Management:
    // Disconnect snapshot listener when user switches away or puts phone in pocket.
    // Drastically preserves the 100 concurrent connection limit on Firebase Free Tier!
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (currentFbUser) {
          attachUserListener(currentFbUser);
        }
      } else {
        detachUserListener();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribeAuth();
      detachUserListener();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      const res = await signInWithGoogle();
      if (!res) {
        // User closed or cancelled popup, exit quietly
        return;
      }
    } catch (err: any) {
      if (isUserCancellation(err)) {
        return;
      }
      console.warn('Google login notice:', err?.message || err);
      const errorMsg =
        err?.code === 'auth/popup-blocked'
          ? 'เบราว์เซอร์บล็อกหน้าต่าง Pop-up กรุณาเปิดเว็บไซต์ในแท็บใหม่ หรืออนุญาตหน้าต่าง Pop-up'
          : err?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้';
      setError(errorMsg);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    try {
      setError(null);
      await loginWithEmailCredentials(email, pass);
      setAuthModalOpen(false);
    } catch (err: any) {
      const msg = formatAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleEmailRegister = async (email: string, pass: string, displayName: string) => {
    try {
      setError(null);
      await signUpWithEmail(email, pass, displayName);
      setAuthModalOpen(false);
    } catch (err: any) {
      const msg = formatAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (err: any) {
      console.warn('Logout notice:', err);
      setError(err?.message || 'ไม่สามารถออกจากระบบได้');
    }
  };

  const refreshUserProfile = async () => {
    if (!firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setUser(snap.data() as UserProfile);
    }
  };

  // Security cleanup: Immediately purge any legacy insecure backdoor keys
  useEffect(() => {
    try {
      localStorage.removeItem('angus_admin_unlocked');
    } catch {}
  }, []);

  const unlockAdminMode = (_passcode?: string): boolean => {
    // Deprecated insecure method: Admin access requires authenticating with an authorized admin account
    return false;
  };

  const lockAdminMode = () => {
    try {
      localStorage.removeItem('angus_admin_unlocked');
    } catch {}
  };

  const fbEmailLower = (firebaseUser?.email || '').toLowerCase().trim();
  const userEmailLower = (user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(
    (firebaseUser || user) && (
      user?.role === 'admin' || 
      fbEmailLower === 'otinrealxz@gmail.com' || 
      fbEmailLower === 'angusdiffx@gmail.com' ||
      userEmailLower === 'otinrealxz@gmail.com' ||
      userEmailLower === 'angusdiffx@gmail.com'
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        clearError,
        loginWithGoogle: handleGoogleLogin,
        loginWithEmail: handleEmailLogin,
        registerWithEmail: handleEmailRegister,
        logoutUser: handleLogout,
        refreshUserProfile,
        isAdmin,
        unlockAdminMode,
        lockAdminMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

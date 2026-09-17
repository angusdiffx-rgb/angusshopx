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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid);
        
        // Listen to real-time changes on user document (balance, role, etc.)
        unsubscribeUserDoc = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            setUser(data);
            setLoading(false);
          } else {
            // Create user profile if not exists
            const now = new Date().toISOString();
            const isAdmin = fbUser.email === 'otinrealxz@gmail.com' || fbUser.email === 'angusdiffx@gmail.com';
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
          }
        }, (err) => {
          console.error('User snapshot error:', err);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
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

  const isAdmin = user?.role === 'admin' || firebaseUser?.email === 'otinrealxz@gmail.com' || firebaseUser?.email === 'angusdiffx@gmail.com';

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

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import type { UserProfile } from '../types';

// Use config from firebase-applet-config.json with fallback to environment variables
const metaEnv = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with Persistent Local Cache (IndexedDB)
// Drastically cuts read quota consumption by serving cached documents locally across tabs and reloads!
let firestoreDb: ReturnType<typeof getFirestore>;
try {
  if (typeof window !== 'undefined') {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, firebaseAppletConfig.firestoreDatabaseId || undefined);
  } else {
    firestoreDb = firebaseAppletConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId) 
      : getFirestore(app);
  }
} catch (err) {
  // If already initialized, retrieve the existing instance
  try {
    firestoreDb = firebaseAppletConfig.firestoreDatabaseId 
      ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId) 
      : getFirestore(app);
  } catch (fallbackErr) {
    firestoreDb = getFirestore(app);
  }
}

export const db = firestoreDb;
export const storage = getStorage(app);

export const isQuotaExceededError = (err: any): boolean => {
  if (!err) return false;
  const message = String(err?.message || '');
  const code = String(err?.code || '');
  return (
    code === 'resource-exhausted' ||
    message.includes('Quota exceeded') ||
    message.includes('resource_exhausted') ||
    message.includes('RESOURCE_EXHAUSTED')
  );
};

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const isUserCancellation = (error: any): boolean => {
  if (!error) return false;
  const code = error?.code || '';
  const message = error?.message || '';
  return (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('auth/popup-closed-by-user') ||
    message.includes('auth/cancelled-popup-request')
  );
};

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    if (!fbUser) return null;

    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    const now = new Date().toISOString();
    
    // Check if initial admin email (e.g. otinrealxz@gmail.com or angusdiffx@gmail.com)
    const isAdminEmail = fbUser.email === 'otinrealxz@gmail.com' || fbUser.email === 'angusdiffx@gmail.com';

    if (!userSnap.exists()) {
      const newUser: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || 'Blox Player',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
        role: isAdminEmail ? 'admin' : 'user',
        balance: 0,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      };
      await setDoc(userRef, newUser);
      return newUser;
    } else {
      const existingData = userSnap.data() as UserProfile;
      const updates: Partial<UserProfile> = {
        displayName: fbUser.displayName || existingData.displayName,
        photoURL: fbUser.photoURL || existingData.photoURL,
        lastLoginAt: now,
        updatedAt: now,
      };
      if (isAdminEmail && existingData.role !== 'admin') {
        updates.role = 'admin';
      }
      await updateDoc(userRef, updates);
      return { ...existingData, ...updates };
    }
  } catch (error: any) {
    if (isUserCancellation(error)) {
      // User closed the popup intentionally, ignore gracefully without error log
      return null;
    }
    console.warn('Google Sign In notice:', error);
    throw error;
  }
};

export const formatAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'อีเมลนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบ หรือใช้อีเมลอื่น';
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง';
    case 'auth/weak-password':
      return 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    case 'auth/user-not-found':
      return 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    case 'auth/operation-not-allowed':
      return 'การเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน ยังไม่ถูกเปิดใช้งานใน Firebase Console โปรดติดต่อผู้ดูแลระบบ';
    case 'auth/too-many-requests':
      return 'มีการพยายามเข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่';
    case 'auth/network-request-failed':
      return 'การเชื่อมต่ออินเทอร์เน็ตมีปัญหา กรุณาตรวจสอบสัญญาณเน็ต';
    case 'auth/popup-blocked':
      return 'เบราว์เซอร์บล็อกหน้าต่าง Pop-up กรุณาอนุญาตป๊อปอัปเพื่อดำเนินการต่อ';
    default:
      return error?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์';
  }
};

export const signUpWithEmail = async (
  email: string, 
  pass: string, 
  displayName: string
): Promise<UserProfile> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = cred.user;
    const cleanName = displayName.trim() || email.split('@')[0] || 'Blox Player';
    
    // Update auth profile
    await updateProfile(fbUser, {
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
    });

    const now = new Date().toISOString();
    const isAdminEmail = fbUser.email === 'otinrealxz@gmail.com' || fbUser.email === 'angusdiffx@gmail.com';
    
    const newUser: UserProfile = {
      uid: fbUser.uid,
      displayName: cleanName,
      email: fbUser.email || '',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
      role: isAdminEmail ? 'admin' : 'user',
      balance: 0,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    const userRef = doc(db, 'users', fbUser.uid);
    await setDoc(userRef, newUser);
    return newUser;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmailCredentials = async (
  email: string, 
  pass: string
): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  await fbSignOut(auth);
};

export { onAuthStateChanged, type FirebaseUser };

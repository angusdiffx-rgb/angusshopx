import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Flame,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    authModalTab, 
    closeAuthModal, 
    openAuthModal, 
    loginWithEmail, 
    registerWithEmail, 
    loginWithGoogle,
    error,
    clearError
  } = useAuth();
  const { success, showToast } = useToast();

  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setTab(authModalTab);
    setFormError(null);
    clearError();
  }, [authModalTab, authModalOpen]);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setFormError(null);
    clearError();
    closeAuthModal();
  };

  const handleTabSwitch = (newTab: 'login' | 'register') => {
    setTab(newTab);
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (tab === 'register') {
      if (password.length < 6) {
        setFormError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
        success('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับสู่ AngusShop!');
        closeAuthModal();
      } else {
        await registerWithEmail(email, password, displayName);
        success('สมัครสมาชิกสำเร็จ', 'ยินดีต้อนรับสู่ AngusShop!');
        closeAuthModal();
      }
    } catch (err: any) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setFormError(null);
    clearError();
    setLoading(true);
    try {
      await loginWithGoogle();
      success('เข้าสู่ระบบด้วย Google สำเร็จ!', 'ยินดีต้อนรับสู่ AngusShop');
      closeAuthModal();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setFormError('ยกเลิกหน้าต่างเข้าสู่ระบบด้วย Google แล้ว');
      } else if (err.code === 'auth/unauthorized-domain') {
        setFormError('โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication โปรดใช้การเข้าสู่ระบบด้วยอีเมล/รหัสผ่าน');
      } else {
        setFormError(err.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      }
    } finally {
      setLoading(false);
    }
  };

  const activeError = formError || error;

  return (
    <AnimatePresence>
      <div 
        id="auth-modal-backdrop" 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          id="auth-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md my-8 rounded-2xl bg-neutral-900/95 border border-purple-500/30 shadow-[0_0_50px_rgba(147,51,234,0.25)] overflow-hidden text-neutral-100"
        >
          {/* Top glowing ambient effect */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b from-purple-500/30 via-cyan-500/20 to-transparent blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            id="auth-modal-close-btn"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="pt-6 pb-4 px-6 text-center border-b border-neutral-800/80">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-xs font-semibold text-purple-300 mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>ANGUSSHOP • BLOX FRUITS</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-cyan-300">
              {tab === 'login' ? 'เข้าสู่ระบบร้านค้า' : 'สมัครสมาชิกใหม่'}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              {tab === 'login' 
                ? 'เข้าสู่ระบบเพื่อซื้อสินค้า เติมเงิน และดูประวัติการสั่งซื้อ' 
                : 'สร้างบัญชี AngusShop เพื่อรับสิทธิพิเศษและส่วนลดมากมาย'}
            </p>

            {/* Tab switch buttons */}
            <div className="flex p-1 mt-4 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <button
                id="auth-tab-login-btn"
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                เข้าสู่ระบบ
              </button>
              <button
                id="auth-tab-register-btn"
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Error Notification */}
            {activeError && (
              <div 
                id="auth-modal-error"
                className="mb-4 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-shake"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (Only in Register mode) */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    ชื่อที่แสดง / ชื่อตัวละคร Roblox
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      id="register-displayname-input"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="เช่น AngusProGamer, BloxMaster"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  อีเมล (Email)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tab === 'register' ? 'อย่างน้อย 6 ตัวอักษร' : 'กรอกรหัสผ่านของคุณ'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Only in Register mode) */}
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    ยืนยันรหัสผ่าน (Confirm Password)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      id="register-confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm tracking-wide shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-yellow-300" />
                    <span>{tab === 'login' ? 'เข้าสู่ระบบ AngusShop' : 'ยืนยันการสมัครสมาชิก'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <span className="relative px-3 bg-neutral-900 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                หรือเชื่อมต่อผ่าน
              </span>
            </div>

            {/* Google 1-Click Button */}
            <button
              id="auth-google-btn"
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-sm font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>ดำเนินการต่อด้วย Google</span>
            </button>

            {/* Bottom footer text */}
            <div className="mt-5 text-center text-xs text-neutral-400">
              {tab === 'login' ? (
                <p>
                  ยังไม่มีบัญชี AngusShop?{' '}
                  <button
                    id="switch-to-register-link"
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    สมัครสมาชิกฟรีทันที
                  </button>
                </p>
              ) : (
                <p>
                  มีบัญชีอยู่แล้ว?{' '}
                  <button
                    id="switch-to-login-link"
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="text-purple-400 hover:text-purple-300 font-bold underline underline-offset-2 ml-1 cursor-pointer"
                  >
                    เข้าสู่ระบบที่นี่
                  </button>
                </p>
              )}
            </div>

            {/* Safety guarantee badge */}
            <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ระบบปลอดภัย 100% เชื่อมต่อด้วย Firebase Authentication</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

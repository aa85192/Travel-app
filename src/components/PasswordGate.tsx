import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { sha256 } from '../utils/crypto';
import { VALID_HASHES } from '../config/passwords';

export const AUTH_STORAGE_KEY = 'milktea-auth';

/** 取得目前已登入的雜湊值，用於命名儲存空間 */
export function getAuthHash(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.hash ?? null;
  } catch {
    return null;
  }
}

/** 是否已登入 */
export function isAuthenticated(): boolean {
  return getAuthHash() !== null;
}

/** 登出（清除登入狀態，保留行程資料） */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.reload();
}

interface PasswordGateProps {
  onSuccess: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const hash = await sha256(password);
      const isValid = VALID_HASHES.includes(hash);

      if (isValid) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ hash }));
        onSuccess();
      } else {
        setError('密碼錯誤，請再試一次');
        setShakeKey((k) => k + 1);
        setPassword('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-milk-tea-50 flex flex-col items-center justify-center p-6">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-milk-tea-200 opacity-30" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent-coral opacity-20" />
        <div className="absolute top-1/3 -left-8 w-32 h-32 rounded-full bg-milk-tea-300 opacity-20" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm relative"
      >
        {/* Logo 區 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 bg-milk-tea-500 rounded-3xl flex items-center justify-center shadow-glow"
          >
            <span className="text-4xl">👑</span>
          </motion.div>
          <h1 className="text-lg font-extrabold text-milk-tea-900 tracking-tight">
            🎀✨Cindy's Paradise☁️💖
          </h1>
          <p className="text-sm text-milk-tea-400 mt-1">私人旅遊空間</p>
        </div>

        {/* 密碼卡片 */}
        <motion.div
          key={shakeKey}
          animate={
            error
              ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-6 border border-milk-tea-100"
        >
          <div className="flex items-center space-x-2 mb-5">
            <div className="w-8 h-8 rounded-full bg-milk-tea-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-milk-tea-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-milk-tea-900">私人空間</p>
              <p className="text-xs text-milk-tea-400">請輸入您的專屬密碼</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="輸入密碼"
                autoFocus
                className={`w-full bg-milk-tea-50 border rounded-2xl px-4 py-3 pr-12 text-milk-tea-900 placeholder-milk-tea-300 font-mono text-sm transition-all outline-none focus:ring-2 ${
                  error
                    ? 'border-accent-error focus:ring-accent-error/30'
                    : 'border-milk-tea-200 focus:ring-milk-tea-300'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-milk-tea-300 hover:text-milk-tea-500 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-accent-error font-medium px-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={!password.trim() || isLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 bg-milk-tea-500 text-white rounded-2xl font-bold shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>進入</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-milk-tea-300 mt-6">
          每組密碼對應獨立的行程資料
        </p>
      </motion.div>
    </div>
  );
};

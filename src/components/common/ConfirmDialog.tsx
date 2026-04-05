import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  variant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-milk-tea-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xs bg-white rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
            <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-milk-tea-50 text-milk-tea-500'
            }`}>
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-milk-tea-900 mb-2 font-display">{title}</h3>
            <p className="text-sm text-milk-tea-500 leading-relaxed">
              {message}
            </p>
          </div>
          
          <div className="flex border-t border-milk-tea-50">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-sm font-bold text-milk-tea-400 hover:bg-milk-tea-50 transition-colors"
            >
              {cancelText}
            </button>
            <div className="w-px bg-milk-tea-50" />
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                variant === 'danger' ? 'text-red-500 hover:bg-red-50' : 'text-milk-tea-600 hover:bg-milk-tea-50'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

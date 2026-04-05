import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '確定',
  cancelText = '取消',
  isDangerous = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-milk-tea-50 rounded-3xl shadow-2xl p-6 overflow-hidden"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                isDangerous ? 'bg-red-100 text-red-500' : 'bg-milk-tea-100 text-milk-tea-500'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-milk-tea-900 mb-2 font-display">
                {title}
              </h3>
              <p className="text-sm text-milk-tea-600 mb-6 leading-relaxed">
                {message}
              </p>
              <div className="flex w-full space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white border border-milk-tea-200 text-milk-tea-500 rounded-2xl font-bold hover:bg-milk-tea-100 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                    isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-milk-tea-500 hover:bg-milk-tea-600 shadow-milk-tea-200'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

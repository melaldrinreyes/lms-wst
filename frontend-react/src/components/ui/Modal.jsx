import { X } from 'lucide-react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    // On very small screens allow full width; on small and up constrain
    sm: 'max-w-full sm:max-w-md',
    md: 'max-w-full sm:max-w-2xl',
    lg: 'max-w-full sm:max-w-4xl',
    xl: 'max-w-full sm:max-w-6xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`modal-panel modal-panel--${size} bg-gray-900 border border-orange-500 rounded-xl shadow-xl mx-auto w-full ${sizes[size]} max-h-[90vh] overflow-hidden flex flex-col`}
            >
              <div className="flex items-center justify-between p-6 border-b border-orange-500 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300 p-2 rounded-md touch-manipulation"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

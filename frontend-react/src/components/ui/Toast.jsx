import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-500 border-green-400',
    error: 'bg-red-500 border-red-400',
    info: 'bg-blue-500 border-blue-400',
    warning: 'bg-orange-500 border-orange-400',
  };

  return (
    <div className={`fixed top-4 right-4 ${styles[type]} border text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-in`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        <X size={18} />
      </button>
    </div>
  );
}

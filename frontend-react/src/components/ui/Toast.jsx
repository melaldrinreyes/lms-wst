import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const config = {
    success: {
      bg: 'bg-white dark:bg-white',
      border: 'border-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      textColor: 'text-gray-900 dark:text-[#1d2026]'
    },
    error: {
      bg: 'bg-white dark:bg-white',
      border: 'border-red-500',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      textColor: 'text-gray-900 dark:text-[#1d2026]'
    },
    info: {
      bg: 'bg-white dark:bg-white',
      border: 'border-[#FF4C60]',
      icon: Info,
      iconColor: 'text-[#FF4C60]',
      textColor: 'text-gray-900 dark:text-[#1d2026]'
    },
    warning: {
      bg: 'bg-white dark:bg-white',
      border: 'border-[#ff6b6b]',
      icon: AlertTriangle,
      iconColor: 'text-[#FF4C60]',
      textColor: 'text-gray-900 dark:text-[#1d2026]'
    },
  };

  const currentConfig = config[type];
  const Icon = currentConfig.icon;

  return (
    <div className={`fixed top-4 right-4 ${currentConfig.bg} ${currentConfig.textColor} border-l-4 ${currentConfig.border} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 min-w-[300px] max-w-md animate-slide-in backdrop-blur-sm`}>
      <Icon className={`${currentConfig.iconColor} flex-shrink-0`} size={24} />
      <span className="flex-1 font-medium">{message}</span>
      <button 
        onClick={onClose} 
        className={`${currentConfig.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X size={18} />
      </button>
    </div>
  );
}

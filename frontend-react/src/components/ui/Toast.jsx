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
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-green-500',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      textColor: 'text-gray-900 dark:text-white'
    },
    error: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-red-500',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      textColor: 'text-gray-900 dark:text-white'
    },
    info: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-blue-500',
      icon: Info,
      iconColor: 'text-blue-500',
      textColor: 'text-gray-900 dark:text-white'
    },
    warning: {
      bg: 'bg-white dark:bg-gray-800',
      border: 'border-orange-500',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      textColor: 'text-gray-900 dark:text-white'
    },
  };

  const currentConfig = config[type];
  const Icon = currentConfig.icon;

  return (
    <div className={`fixed top-4 right-4 ${currentConfig.bg} ${currentConfig.textColor} border-l-4 ${currentConfig.border} px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 min-w-[300px] max-w-md animate-slide-in backdrop-blur-sm`}>
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

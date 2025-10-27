import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/notificationAPI';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <div className="relative p-2 text-gray-400">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}

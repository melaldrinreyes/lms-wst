import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Info, MessageCircle, LayoutDashboard, User, LogIn, ClipboardList, MoreHorizontal, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function MobileBottomNav({ onLoginClick, inline = false, sticky = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const guestNavItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/about', label: 'About', icon: Info },
  ];

  const studentNavItems = [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/courses', label: 'Courses', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  let navItems = guestNavItems;
  if (user) {
    navItems = user.role === 'admin' ? adminNavItems : studentNavItems;
  }

  const isActive = (path) => {
    if (path === '/' || path === '/student' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setShowMenu(false);
    logout();
  };

  return (
    <>
      {/* Menu Overlay */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`${inline ? 'md:hidden absolute bottom-20 right-4' : 'md:hidden fixed bottom-20 right-4'} bg-white border border-gray-800 rounded-xl shadow-2xl z-40 overflow-hidden min-w-[200px]`}
            >
              <Link
                to="/profile"
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-[#4a5568] hover:bg-white hover:text-[#FF4C60] transition border-b border-gray-800"
              >
                <User size={18} />
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition w-full text-left"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className={
        inline && sticky
          ? 'md:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-800 z-40 safe-area-bottom shadow-sm'
          : (inline
              ? 'md:hidden relative bg-white/95 border-t border-gray-800 shadow-none'
              : 'md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-800 z-40 safe-area-bottom shadow-2xl')
      }>
        <div className="flex justify-around items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
                  active
                    ? 'text-[#FF4C60]'
                    : 'text-[#718096] hover:text-[#4a5568]'
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF4C60] rounded-b-full"></div>
                )}

                <Icon size={22} strokeWidth={active ? 2.5 : 2} />

                <span className={`text-[10px] leading-tight whitespace-nowrap ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {!user ? (
            <button
              onClick={onLoginClick}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-[#FF4C60] hover:text-[#FF4C60] transition-colors"
            >
              <LogIn size={22} strokeWidth={2.5} />
              <span className="text-[10px] leading-tight whitespace-nowrap font-bold">Login</span>
            </button>
          ) : (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
                showMenu ? 'text-[#FF4C60]' : 'text-[#718096] hover:text-[#4a5568]'
              }`}
            >
              {showMenu && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF4C60] rounded-b-full"></div>
              )}
              <MoreHorizontal size={22} strokeWidth={showMenu ? 2.5 : 2} />
              <span className={`text-[10px] leading-tight whitespace-nowrap ${showMenu ? 'font-bold' : 'font-medium'}`}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

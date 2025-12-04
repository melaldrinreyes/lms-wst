import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  MessageSquare, 
  User, 
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  UserPlus,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo/logo.png';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { facultyAPI } from '../services/api';

// Helper function to get full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000/storage/${path.replace(/^\//, '')}`;
};

export default function DashboardLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Use provided role or user's role
  const currentRole = role || user?.role || 'student';

  // Fetch pending enrollment requests count for faculty
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (currentRole === 'faculty') {
        try {
          const response = await facultyAPI.getEnrollmentRequests();
          if (response.success) {
            const pendingCount = response.requests.filter(req => req.status === 'pending').length;
            setPendingRequestsCount(pendingCount);
          }
        } catch (error) {
          console.error('Error fetching pending requests:', error);
        }
      }
    };

    fetchPendingRequests();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingRequests, 30000);
    
    return () => clearInterval(interval);
  }, [currentRole]);

  const sidebarLinks = {
    student: [
      { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/student/courses', icon: BookOpen, label: 'My Courses' },
      { to: '/profile', icon: User, label: 'Profile', external: true },
    ],
    admin: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/users', icon: User, label: 'Manage Users' },
      { to: '/profile', icon: User, label: 'Profile', external: true },
    ],
    faculty: [
      { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/faculty/courses', icon: BookOpen, label: 'My Courses' },
      { to: '/faculty/join-requests', icon: UserPlus, label: 'Join Requests' },
      { to: '/profile', icon: User, label: 'Profile', external: true },
    ],
  };

  // Mobile bottom nav links (first 4 items)
  const mobileNavLinks = {
    student: [
      { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/student/courses', icon: BookOpen, label: 'Courses' },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
    admin: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/users', icon: User, label: 'Users' },
      { to: '/profile', icon: User, label: 'Profile' },
    ],
    faculty: [
      { to: '/faculty', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/faculty/courses', icon: BookOpen, label: 'Courses' },
      { to: '/faculty/join-requests', icon: UserPlus, label: 'Requests' },
    ],
  };

  const links = sidebarLinks[currentRole] || sidebarLinks.student;
  const mobileLinks = mobileNavLinks[currentRole] || mobileNavLinks.student;

  // Check if current page is content editor
  const isContentPage = location.pathname.includes('/content');

  const isActive = (path, end = false) => {
    if (end) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    setShowMobileMenu(false);
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Bottom Navigation Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-30"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="md:hidden fixed bottom-20 right-4 left-4 bg-white border border-gray-800 rounded-xl shadow-2xl z-40 overflow-hidden"
            >
              <div className="p-2">
                <NavLink
                  to="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                      isActive
                        ? 'bg-[#FF4C60]/10 text-[#FF4C60]'
                        : 'text-[#718096] hover:bg-white hover:text-[#FF4C60]'
                    }`
                  }
                >
                  <User size={20} />
                  <span className="font-medium">Profile</span>
                </NavLink>
              </div>
              <div className="border-t border-gray-800 p-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-800 shadow-lg"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="MINSU Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-[#FF4C60]/50"
              />
              <span className="text-lg font-bold text-[#1d2026]">
                MINSU
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {user?.profile_image ? (
                  <img 
                    src={getImageUrl(user.profile_image)} 
                    alt={user?.name || 'User'} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <User className="text-white" size={24} style={{ display: user?.profile_image ? 'none' : 'flex' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-[#718096] capitalize">
                  {currentRole}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition relative ${
                    isActive
                      ? 'bg-[#FF4C60]/10 text-[#FF4C60] border border-[#ff6b6b]/20'
                      : 'text-[#718096] hover:bg-white hover:text-[#FF4C60]'
                  }`
                }
              >
                <link.icon size={20} />
                <span className="font-medium">{link.label}</span>
                {/* Notification Badge */}
                {link.to === '/faculty/join-requests' && pendingRequestsCount > 0 && (
                  <span className="ml-auto bg-[#FF4C60] text-gray-900 text-xs font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-800 space-y-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-800 z-40 safe-area-bottom shadow-2xl">
        <div className="flex justify-around items-center h-16 px-1">
          {mobileLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.end);
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
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
                
                {/* Notification Badge */}
                {item.to === '/faculty/join-requests' && pendingRequestsCount > 0 && (
                  <span className="absolute top-2 right-1/4 bg-[#FF4C60] text-gray-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                    {pendingRequestsCount}
                  </span>
                )}
                
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] leading-tight whitespace-nowrap ${active ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
          
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative ${
              showMobileMenu ? 'text-[#ff5252] dark:text-[#FF4C60]' : 'text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#4a5568]'
            }`}
          >
            {showMobileMenu && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FF4C60] rounded-b-full"></div>
            )}
            <MoreHorizontal size={22} strokeWidth={showMobileMenu ? 2.5 : 2} />
            <span className={`text-[10px] leading-tight whitespace-nowrap ${showMobileMenu ? 'font-bold' : 'font-medium'}`}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full overflow-x-hidden bg-white">
        {/* Top Bar - Hide hamburger menu on mobile */}
        <header className="bg-white border-b border-gray-800 px-4 sm:px-6 py-4 sticky top-0 z-10 w-full shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 capitalize truncate">
              {location.pathname === '/faculty/courses' ? 'My Courses' : 
               location.pathname === '/student/courses' ? 'My Courses' :
               location.pathname === '/faculty/join-requests' ? 'Join Requests' :
               location.pathname === '/admin/users' ? 'Manage Users' :
               location.pathname === '/profile' ? 'Profile' :
               `${currentRole} Dashboard`}
            </h1>
          </div>
        </header>

        {/* Page Content - Added pb-20 for mobile bottom nav */}
        <main className={`flex-1 w-full ${isContentPage ? 'overflow-y-auto overflow-x-hidden p-0 pb-16 lg:pb-0' : 'overflow-y-auto overflow-x-hidden p-4 sm:p-6 pb-24 lg:pb-6'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import MobileBottomNav from './MobileBottomNav';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const handleScrollTo = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigateToWhyChoose = () => {
    const section = document.getElementById('why-choose');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navLinks = user
    ? [
        { to: `/${user.role}`, label: 'Dashboard', isRoute: true },
        { to: '/profile', label: 'Profile', isRoute: true },
      ]
    : [
        { to: 'home', label: 'Home', isRoute: false },
        { to: 'why-choose', label: 'Why Choose Us', isRoute: false },
        { to: 'values', label: 'Our Values', isRoute: false },
        { to: 'story', label: 'Our Story', isRoute: false },
      ];

  return (
    <>
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setLoginModalOpen(false);
          setForgotPasswordModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)}
      />
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onBackToLogin={() => {
          setForgotPasswordModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onLoginClick={() => setLoginModalOpen(true)} />
      
      {/* Material App Bar */}
      <nav className="surface shadow-md fixed top-0 left-0 right-0 z-30 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
                MINSU E-LEARN
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.to}
                  onClick={() => handleScrollTo(link.to)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-all"
                >
                  {link.label}
                </button>
              )
            ))}
            
            {!user && (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="btn-primary ml-2"
              >
                Login
              </button>
            )}
            
            {user && (
              <button
                onClick={logout}
                className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-all ml-2"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}

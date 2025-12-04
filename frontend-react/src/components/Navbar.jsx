import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import logo from '../logo/logo.png';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import ResetPasswordModal from './ResetPasswordModal';
import MobileBottomNav from './MobileBottomNav';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [suppressMobileNav, setSuppressMobileNav] = useState(false);

  const location = useLocation();

  // If a page wants to suppress the global mobile nav it can add
  // the `mobile-nav-inline` class to <body>. We also scope the global
  // mobile nav to student pages only so it doesn't appear for faculty/admin.
  useEffect(() => {
    try {
      setSuppressMobileNav(document?.body?.classList?.contains('mobile-nav-inline'));
    } catch (err) {
      void err;
      setSuppressMobileNav(false);
    }
  }, [location.pathname]);

  const handleScrollTo = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <ResetPasswordModal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
      />
      
      {/* Mobile Bottom Navigation (global for student pages) */}
      {!suppressMobileNav && (user?.role === 'student' || location.pathname.startsWith('/student')) && (
        <MobileBottomNav onLoginClick={() => setLoginModalOpen(true)} />
      )}
      
      {/* Eduquest Navigation Bar */}
      <nav className="bg-[#1e3a5f] backdrop-blur-xl shadow-md fixed top-0 left-0 right-0 z-30 border-b border-[#2d4a70]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="MINSU Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-semibold text-white tracking-tight">
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
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.to}
                  onClick={() => handleScrollTo(link.to)}
                  className="px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all"
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
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl font-medium transition-all ml-2"
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

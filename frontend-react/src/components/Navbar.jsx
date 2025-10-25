import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import MobileBottomNav from './MobileBottomNav';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const navLinks = user
    ? [
        { to: `/${user.role}`, label: 'Dashboard' },
        { to: '/chatbot', label: 'AI Assistant' },
        { to: '/profile', label: 'Profile' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/courses', label: 'Courses' },
        { to: '/about', label: 'About' },
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
      
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-white">
              MINSU E-LEARN
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-300 hover:text-orange-500 font-medium transition"
              >
                {link.label}
              </Link>
            ))}
            
            {!user && (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition"
              >
                Login
              </button>
            )}
            
            {user && (
              <button
                onClick={logout}
                className="text-gray-300 hover:text-red-400 font-medium transition"
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

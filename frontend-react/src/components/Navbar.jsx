import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import logo from '../logo/logo.jpg';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import MobileBottomNav from './MobileBottomNav';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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
      />
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)}
      />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onLoginClick={() => setLoginModalOpen(true)} />
      
      {/* Material App Bar */}
      <nav className="bg-white/10 backdrop-blur-xl shadow-lg fixed top-0 left-0 right-0 z-30 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="MINSU Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-medium text-white tracking-tight">
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
                  className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg font-medium transition-all"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.to}
                  onClick={() => handleScrollTo(link.to)}
                  className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg font-medium transition-all"
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
                className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg font-medium transition-all ml-2"
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

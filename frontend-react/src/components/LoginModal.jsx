/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo/logo.png';
import Toast from '../components/ui/Toast';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [toast, setToast] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      setToast({ message: `Welcome back, ${result.user?.name || 'User'}!`, type: 'success' });
      
      setTimeout(() => {
        onClose();
        
        // If there's a custom success handler, use it
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        } else {
          // Otherwise, navigate based on the user role from backend
          const userRole = result.user?.role;
          navigate(`/${userRole}`);
        }
      }, 1000);
    } else {
      setToast({ message: result.error || 'Login failed', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative modal-panel modal-panel--md w-full bg-white/95 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-2xl my-8 text-[#1d2026] dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {toast && <Toast {...toast} onClose={() => setToast(null)} />}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-[#1d2026] dark:text-white hover:text-[#1d2026] hover:bg-white/50 rounded-xl transition z-10 backdrop-blur-sm"
                aria-label="Close login modal"
              >
                <X size={20} />
              </button>

              <div className="p-6 sm:p-8">
                {/* Logo */}
                <div className="text-center mb-6">
                  <img 
                    src={logo} 
                    alt="MINSU Logo" 
                    className="inline-block w-14 h-14 rounded-xl object-cover mb-3 shadow-sm"
                  />
                  <h2 className="text-2xl font-bold text-[#1d2026] mb-1 drop-shadow-sm">
                    Welcome Back
                  </h2>
                  <p className="text-[#2c3e50] text-sm font-medium drop-shadow-sm">
                    Sign in to continue your learning journey
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1d2026] mb-2 drop-shadow-sm">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6b6b]/20 focus:border-[#ff6b6b] text-gray-900 placeholder-gray-400 transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-[#1d2026] mb-2 drop-shadow-sm">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] placeholder-gray-500 transition shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input type="checkbox" className="w-4 h-4 text-[#FF4C60] border-gray-300 rounded focus:ring-[#ff6b6b] bg-gray-50" />
                      <span className="ml-2 text-sm text-[#1d2026] font-medium">Remember me</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF4C60] text-white py-3 rounded-xl font-semibold hover:bg-[#ff3451] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-[#1d2026] font-medium rounded-full shadow-sm">New to MINSU E-Learn?</span>
                  </div>
                </div>

                {/* Register Link */}
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToRegister?.();
                  }}
                  className="block w-full text-center py-2.5 bg-white hover:bg-gray-50 text-[#1d2026] rounded-xl font-semibold transition border border-gray-300 shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

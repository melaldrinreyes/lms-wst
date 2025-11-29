import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

export default function LoginModal({ isOpen, onClose, onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }) {
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
      setToast({ message: 'Login successful!', type: 'success' });
      
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative modal-panel modal-panel--md w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {toast && <Toast {...toast} onClose={() => setToast(null)} />}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition z-10"
              >
                <X size={20} />
              </button>

              <div className="p-6 sm:p-8">
                {/* Logo */}
                <div className="text-center mb-6">
                  <div className="inline-block w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/50">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Sign in to continue your learning journey
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70 transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70 transition"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="w-4 h-4 text-orange-500 border-gray-700 rounded focus:ring-orange-500 bg-gray-800" />
                      <span className="ml-2 text-sm text-gray-400">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSwitchToForgotPassword?.();
                      }}
                      className="text-sm text-orange-500 hover:text-orange-400 transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-900 text-gray-400">New to MINSU?</span>
                  </div>
                </div>

                {/* Register Link */}
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToRegister?.();
                  }}
                  className="block w-full text-center py-2.5 bg-gray-800/50 hover:bg-gray-800 text-white rounded-xl font-semibold transition border border-gray-700 hover:border-gray-600"
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

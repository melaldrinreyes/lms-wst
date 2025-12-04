import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, UserCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo/logo.png';
import Toast from '../components/ui/Toast';

export default function RegisterModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    student_id: '',
  });
  const [toast, setToast] = useState(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    const result = await register(formData);
    if (result.success) {
      setToast({ message: 'Registration successful!', type: 'success' });
      setTimeout(() => {
        onClose();
        navigate('/student');
      }, 1000);
    } else {
      setToast({ message: result.error || 'Registration failed', type: 'error' });
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
              className="relative modal-panel modal-panel--md w-full max-w-md sm:max-w-lg bg-white/95 backdrop-blur-3xl rounded-2xl border border-white/20 shadow-2xl my-6 text-[#1d2026] dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {toast && <Toast {...toast} onClose={() => setToast(null)} />}

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-[#1d2026] dark:text-white hover:text-[#1d2026] hover:bg-white/50 rounded-xl transition z-10 backdrop-blur-sm"
                aria-label="Close register modal"
              >
                <X size={20} />
              </button>

              <div className="p-4 sm:p-6">
                {/* Logo */}
                <div className="text-center mb-4">
                  <img 
                    src={logo} 
                    alt="MINSU Logo" 
                    className="inline-block w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover mb-2 shadow-sm"
                  />
                  <h2 className="text-lg sm:text-xl font-bold text-[#1d2026] mb-1 drop-shadow-sm">
                    Create Student Account
                  </h2>
                  <p className="text-[#2c3e50] text-[13px] sm:text-xs font-medium drop-shadow-sm">
                    Register as a student at MINSU E-LEARN
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2026] mb-1.5 drop-shadow-sm">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] text-sm placeholder-gray-500 transition shadow-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2026] mb-1.5 drop-shadow-sm">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] text-sm placeholder-gray-500 transition shadow-sm"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Student ID */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2026] mb-1.5 drop-shadow-sm">
                      Student ID (Optional)
                    </label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.student_id}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] text-sm placeholder-gray-500 transition shadow-sm"
                        placeholder="2024-00001"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2026] mb-1.5 drop-shadow-sm">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] text-sm placeholder-gray-500 transition shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1d2026] mb-1.5 drop-shadow-sm">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FF4C60]/20 focus:border-[#FF4C60] text-[#1d2026] text-sm placeholder-gray-500 transition shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF4C60] text-white py-2 rounded-lg font-semibold text-sm hover:bg-[#ff3451] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {loading ? 'Creating account...' : 'Create Student Account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-[#1d2026] font-medium rounded-full shadow-sm">Already have an account?</span>
                  </div>
                </div>

                {/* Login Link */}
                <button
                  onClick={onClose}
                  className="block w-full text-center py-2 bg-white hover:bg-gray-50 text-[#1d2026] text-sm rounded-xl font-semibold transition border border-gray-300 shadow-sm"
                >
                  Sign In Instead
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

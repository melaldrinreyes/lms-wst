import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, CheckCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';
import { authAPI } from '../services/api';
import logo from '../logo/logo.png';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authAPI.forgotPassword({ email });
      if (result.success) {
        setSent(true);
        setToast({ 
          message: result.message, 
          type: 'success' 
        });
      } else {
        setToast({ 
          message: result.message || 'Failed to send reset link', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setToast({ 
        message: error.response?.data?.message || 'An error occurred', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    onClose();
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
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative modal-panel modal-panel--md w-full bg-white rounded-2xl border border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {toast && <Toast {...toast} onClose={() => setToast(null)} />}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-[#718096] hover:text-gray-900 hover:bg-white rounded-xl transition z-10"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                {!sent ? (
                  <>
                    {/* Logo */}
                    <div className="text-center mb-6">
                      <img 
                        src={logo}
                        alt="MINSU Logo"
                        className="inline-block w-14 h-14 rounded-xl object-cover mb-3 shadow-lg shadow-[#FF4C60]/50"
                      />
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        Forgot Password?
                      </h2>
                      <p className="text-[#718096] text-sm">
                        No worries, we'll send you reset instructions
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-[#4a5568] mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] text-[#1e3a5f] placeholder-[#1e3a5f] transition"
                            style={{ color: '#1e3a5f' }}
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-white py-3 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF4C60]/50 hover:shadow-[#FF4C60]/70"
                      >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    {/* Success State */}
                    <div className="text-center py-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                        <CheckCircle size={32} className="text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Check Your Email
                      </h2>
                      <p className="text-[#718096] mb-6">
                        We've sent a password reset link to
                      </p>
                      <p className="text-[#FF4C60] font-medium mb-6">
                        {email}
                      </p>
                      <p className="text-sm text-gray-500 mb-8">
                        Didn't receive the email? Check your spam folder or try again.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

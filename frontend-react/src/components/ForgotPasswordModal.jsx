import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, ArrowLeft, CheckCircle } from 'lucide-react';
import Toast from '../components/ui/Toast';

export default function ForgotPasswordModal({ isOpen, onClose, onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      setToast({ 
        message: 'Password reset link sent to your email!', 
        type: 'success' 
      });
    }, 1500);
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
              className="relative modal-panel modal-panel--md w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {toast && <Toast {...toast} onClose={() => setToast(null)} />}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition z-10"
              >
                <X size={20} />
              </button>

              <div className="p-6">
                {/* Back Button */}
                {!sent && (
                  <button
                    onClick={() => {
                      handleClose();
                      onBackToLogin?.();
                    }}
                    className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition mb-4"
                  >
                    <ArrowLeft size={18} />
                    <span className="text-sm">Back to Login</span>
                  </button>
                )}

                {!sent ? (
                  <>
                    {/* Logo */}
                    <div className="text-center mb-6">
                      <div className="inline-block w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-orange-500/50">
                        <span className="text-white font-bold text-xl">M</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        Forgot Password?
                      </h2>
                      <p className="text-gray-400 text-sm">
                        No worries, we'll send you reset instructions
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500 transition"
                            placeholder="you@example.com"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70"
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
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Check Your Email
                      </h2>
                      <p className="text-gray-400 mb-6">
                        We've sent a password reset link to
                      </p>
                      <p className="text-orange-400 font-medium mb-6">
                        {email}
                      </p>
                      <p className="text-sm text-gray-500 mb-8">
                        Didn't receive the email? Check your spam folder or try again.
                      </p>
                      
                      <button
                        onClick={() => {
                          handleClose();
                          onBackToLogin?.();
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/50"
                      >
                        Back to Login
                      </button>
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

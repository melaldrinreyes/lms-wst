import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';
import Toast from '../components/ui/Toast';

export default function ForgotPassword() {
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xl">
          {!sent ? (
            <>
              {/* Back to Login */}
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#718096] hover:text-[#FF4C60] transition mb-6"
              >
                <ArrowLeft size={18} />
                <span className="text-sm">Back to Login</span>
              </Link>

              {/* Logo & Title */}
              <div className="text-center mb-8">
                <div className="inline-block w-20 h-20 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#FF4C60]/50">
                  <span className="text-gray-900 font-bold text-3xl">M</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-[#718096]">
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-gray-900 placeholder-gray-500 transition"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 py-3.5 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF4C60]/30 hover:shadow-[#FF4C60]/50 hover:scale-[1.02]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                  <Mail size={32} className="text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h1>
                <p className="text-[#718096] mb-6">
                  We've sent a password reset link to
                </p>
                <p className="text-[#FF4C60] font-medium mb-6">
                  {email}
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                
                <Link
                  to="/login"
                  className="w-full bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 py-3.5 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 hover:shadow-[#FF4C60]/50 hover:scale-[1.02] inline-block text-center"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#718096]">
            © 2025 MINSU E-LEARN. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
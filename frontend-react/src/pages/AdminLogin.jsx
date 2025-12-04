import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import logo from "../logo/logo.png";
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate admin credentials
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    // Check if email is faculty/teacher domain
    if (!formData.email.includes('@minsu.edu.ph')) {
      setError('Please use your MINSU faculty email address');
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        role: 'admin' // Force admin role
      });

      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Invalid faculty credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF4C60]/100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img 
              src={logo} 
              alt="MINSU Logo" 
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Portal</h1>
          <p className="text-[#FF4C60] 200">MINSU E-LEARN Faculty Management System</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </motion.div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#FF4C60] 100 mb-2">
                Faculty Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF4C60] 300" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@minsu.edu.ph"
                  className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#FF4C60] 100 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF4C60] 300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-gray-900 placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF4C60] 300 hover:text-[#FF4C60] 200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#FF4C60] focus:ring-2 focus:ring-[#ff6b6b] focus:ring-offset-0"
                />
                <span className="text-sm text-[#FF4C60] 200">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordModal(true)}
                className="text-sm text-[#FF4C60] 300 hover:text-[#FF4C60] 200 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3 text-xs text-[#FF4C60] 200/80">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                This is a secure area for authorized faculty and teachers only. All login attempts are logged and monitored.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-[#FF4C60] 300 hover:text-[#FF4C60] 200 transition-colors inline-flex items-center gap-1"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-xs text-[#FF4C60] 300/60">
          <p>Mindoro State University</p>
          <p className="mt-1">E-Learning Management System v1.0</p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotPasswordModal}
        onClose={() => setForgotPasswordModal(false)}
        onBackToLogin={() => setForgotPasswordModal(false)}
      />
    </div>
  );
}

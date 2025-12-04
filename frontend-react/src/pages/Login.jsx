import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [toast, setToast] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    console.log('Form data before login:', formData);
    console.log('Attempting login with:', { email: formData.email });
    
    const result = await login(formData);
    
    if (result.success) {
      setToast({ message: `Welcome back, ${result.user?.name || 'User'}!`, type: 'success' });
      
      // Navigate based on the user role from backend
      const userRole = result.user?.role;
      
      setTimeout(() => {
        navigate(`/${userRole}`);
      }, 1000);
    } else {
      setToast({ message: result.error || 'Login failed', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xl">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-block w-20 h-20 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#FF4C60]/50">
              <span className="text-gray-900 font-bold text-3xl">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-[#718096]">
              Sign in to MINSU E-LEARN
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-gray-900 placeholder-gray-500 transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#4a5568] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" size={20} />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-gray-900 placeholder-white/70 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-[#FF4C60] border-gray-700 rounded focus:ring-[#ff6b6b] bg-white cursor-pointer" 
                />
                <span className="ml-2 text-sm text-[#718096]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#FF4C60] hover:text-[#ff5252] transition font-medium"
              >
                Forgot Password?
              </Link>
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-[#FF4C60]/100/10 border border-[#FF4C60]/20 rounded-xl">
            <p className="text-sm text-[#ff9f66] text-center">
              <strong>Note:</strong> Registration is managed by administrators. Contact your administrator for account access.
            </p>
          </div>
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

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, User, Mail, Phone, Lock } from 'lucide-react';

export default function AddInstructorModal({ isOpen, onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple validation (can be replaced with more robust logic)
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0 && onSubmit) onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="modal-panel modal-panel--md bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-auto border border-gray-200"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-[#1d2026]">Add New Instructor</h2>
                <button onClick={onClose} className="text-[#718096] hover:text-[#4a5568]">
                  <ArrowLeft size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-base font-semibold text-[#4a5568] mb-2">Full Name <span className="text-[#ff5252]">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096] w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60] text-base ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-base font-semibold text-[#4a5568] mb-2">Email Address <span className="text-[#ff5252]">*</span></label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096] w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60] text-base ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="instructor@example.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-base font-semibold text-[#4a5568] mb-2">Phone Number <span className="text-[#718096]">(Optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096] w-5 h-5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60] text-base border-gray-200"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Set Password <span className="text-[#ff5252]">*</span></h3>
                  <div className="mb-4">
                    <label className="block text-base font-semibold text-[#4a5568] mb-2">Password <span className="text-[#ff5252]">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096] w-5 h-5" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60] text-base ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="At least 8 characters"
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-base font-semibold text-[#4a5568] mb-2">Confirm Password <span className="text-[#ff5252]">*</span></label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#718096] w-5 h-5" />
                      <input
                        type="password"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60] text-base ${errors.password_confirmation ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Re-enter password"
                      />
                    </div>
                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>}
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 bg-white text-[#4a5568] rounded-xl font-semibold hover:bg-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#FF4C60]/20"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Create Instructor
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { superAdminAPI } from '../../services/api';

const AddUserForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await superAdminAPI.createUser(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Role
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60]"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          name="password_confirmation"
          value={formData.password_confirmation}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#FF4C60]"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 rounded-xl hover:bg-white dark:hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#FF4C60]/100 text-gray-900 rounded-xl hover:bg-[#FF4C60] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </form>
  );
};

export default AddUserForm;
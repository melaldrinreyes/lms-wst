import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';

const EditUserForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    status: 'active',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        status: user.status || 'active',
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await superAdminAPI.updateUser(user.id, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
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
          className="w-full px-3 py-2 bg-white border border-gray-600 rounded-xl text-gray-900 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] hover:border-gray-500 transition-colors duration-200"
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
          className="w-full px-3 py-2 bg-white border border-gray-600 rounded-xl text-gray-900 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] hover:border-gray-500 transition-colors duration-200"
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
          className="w-full px-3 py-2 bg-white border border-gray-600 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] hover:border-gray-500 transition-colors duration-200 appearance-none cursor-pointer"
        >
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-white border border-gray-600 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] hover:border-gray-500 transition-colors duration-200 appearance-none cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          New Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Leave blank to keep current password"
          className="w-full px-3 py-2 bg-white border border-gray-600 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] hover:border-gray-500 transition-colors duration-200"
        />
        <p className="mt-1 text-xs text-[#718096]">
          Only fill this if you want to change the user's password
        </p>
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
          className="px-4 py-2 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Updating...' : 'Update User'}
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
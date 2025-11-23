import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, MoreVertical } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { superAdminAPI } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getInstructors();
      
      if (response.success) {
        // Convert instructor data to user format
        const instructorUsers = response.instructors.map(instructor => ({
          id: instructor.id,
          name: instructor.name,
          email: instructor.email,
          phone: instructor.phone,
          role: 'faculty',
          status: instructor.status || 'active',
          joined: instructor.created_at,
          profile_image: instructor.profile_image,
        }));
        
        // Get admin user (current logged-in user or from auth)
        const adminResponse = await superAdminAPI.getDashboard();
        
        setUsers(instructorUsers);
      } else {
        setToast({ message: 'Failed to load users', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to load users',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const styles = {
      student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      faculty: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      alumni: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return styles[role] || styles.student;
  };

  const handleDelete = async (userId) => {
    try {
      const response = await superAdminAPI.deleteInstructor(userId);
      if (response.success) {
        setToast({ message: 'User deleted successfully', type: 'success' });
        fetchUsers(); // Refresh the user list
      } else {
        setToast({ message: 'Failed to delete user', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to delete user',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Material Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 dark:text-white mb-1">
            Manage Users
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add and manage system users
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {/* Material Search Card */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-outlined px-4 py-3 min-w-[140px]"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="alumni">Alumni</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Material Users Card */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 dark:border-orange-800 border-t-orange-600 dark:border-t-orange-400"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <UserPlus className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {searchTerm || filterRole !== 'all' ? 'No users found' : 'No users yet'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchTerm || filterRole !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first user'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="surface-variant border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Joined
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#2c2c2c] transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`chip ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="chip bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.joined).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="john@minsu.edu.ph"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Add User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

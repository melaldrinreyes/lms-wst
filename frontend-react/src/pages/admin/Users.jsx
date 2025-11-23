import { useState, useEffect } from 'react';
import { Search, UserPlus, Edit, Trash2, Eye } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { superAdminAPI } from '../../services/api';
import AddUserForm from '../../components/admin/AddUserForm';
import EditUserForm from '../../components/admin/EditUserForm';

function getRoleBadge(role) {
  switch (role) {
    case 'admin': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'faculty': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'student': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await superAdminAPI.getUsers();
      if (response.success) {
        setUsers(response.users || []);
      } else {
        setToast({ message: 'Failed to fetch users', type: 'error' });
      }
    } catch (e) {
      console.error('Error fetching users:', e);
      setToast({ message: e.response?.data?.message || 'Failed to fetch users', type: 'error' });
    }
    setLoading(false);
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
    setDetailsLoading(true);
    try {
      if (user.role === 'faculty') {
        const details = await superAdminAPI.getInstructor(user.id);
        setUserDetails(details);
      } else {
        setUserDetails({
          ...user,
          profilePicture: user.profilePicture || '/default-profile.png',
        });
      }
    } catch (e) {
      setToast({ message: 'Failed to fetch user details', type: 'error' });
    }
    setDetailsLoading(false);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await superAdminAPI.deleteUser(userId);
        fetchUsers();
        setToast({ message: 'User deleted successfully', type: 'success' });
      } catch (e) {
        setToast({ message: 'Failed to delete user', type: 'error' });
      }
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-gray-400">Manage system users and their roles</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition"
            >
              <UserPlus size={18} />
              Add User
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          {loading ? (
            <div className="p-16 text-center text-gray-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 mb-4">
                <UserPlus className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-white mb-1">
                {searchTerm || filterRole !== 'all' ? 'No users found' : 'No users yet'}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || filterRole !== 'all' ? 'Try adjusting your filters' : 'Get started by adding your first user'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">NAME</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">EMAIL</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ROLE</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">STATUS</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">JOINED</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-gray-900 hover:bg-gray-800 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700">
                            <img
                              src={user.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-base font-semibold text-white">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-base text-gray-300">
                        {user.email}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`chip ${getRoleBadge(user.role)} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="chip bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-base text-gray-300">
                        {new Date(user.joined).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
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
      </div>
      {/* Modals at root */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
      >
        <AddUserForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchUsers();
            setToast({ message: 'User added successfully', type: 'success' });
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
      >
        {selectedUser && (
          <EditUserForm
            user={selectedUser}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
              fetchUsers();
              setToast({ message: 'User updated successfully', type: 'success' });
            }}
            onCancel={() => {
              setIsEditModalOpen(false);
              setSelectedUser(null);
            }}
          />
        )}
      </Modal>
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedUser(null);
          setUserDetails(null);
        }}
        title={selectedUser ? `User Details` : 'User Details'}
      >
        {detailsLoading ? (
          <div className="p-8 text-center text-gray-400">Loading details...</div>
        ) : userDetails ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={userDetails.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDetails.name)}`}
                alt={userDetails.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
              />
              <div>
                <div className="text-xl font-bold text-white">{userDetails.name}</div>
                <div className="text-gray-400 text-sm">{userDetails.email}</div>
                {userDetails.phone && <div className="text-gray-400 text-sm">{userDetails.phone}</div>}
                <div className="mt-1">
                  <span className={`chip ${getRoleBadge(userDetails.role)} text-xs font-semibold px-3 py-1 rounded-full`}>{userDetails.role}</span>
                  <span className="chip ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">{userDetails.status}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-400">Joined</div>
                <div className="text-base text-white font-semibold">{new Date(userDetails.created_at || userDetails.joined).toLocaleDateString()}</div>
              </div>
              {userDetails.last_login && (
                <div>
                  <div className="text-xs text-gray-400">Last Login</div>
                  <div className="text-base text-white font-semibold">{new Date(userDetails.last_login).toLocaleDateString()}</div>
                </div>
              )}
            </div>
            {/* Faculty statistics */}
            {selectedUser && selectedUser.role === 'faculty' && userDetails.statistics && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Courses</div>
                  <div className="text-2xl font-bold text-orange-400">{userDetails.statistics.courses}</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Students</div>
                  <div className="text-2xl font-bold text-orange-400">{userDetails.statistics.students}</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Graded</div>
                  <div className="text-2xl font-bold text-orange-400">{userDetails.statistics.graded}</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-xs text-gray-400">Pending</div>
                  <div className="text-2xl font-bold text-orange-400">{userDetails.statistics.pending}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">No details available.</div>
        )}
      </Modal>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

export default AdminUsers;

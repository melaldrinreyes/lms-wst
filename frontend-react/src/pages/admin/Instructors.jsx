import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Users as UsersIcon,
  ClipboardCheck,
  Clock,
  Mail,
  Phone,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, instructor: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = instructors.filter(
        (instructor) =>
          instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInstructors(filtered);
    } else {
      setFilteredInstructors(instructors);
    }
  }, [searchTerm, instructors]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getInstructors();

      if (response.success) {
        setInstructors(response.instructors);
        setFilteredInstructors(response.instructors);
      } else {
        setToast({ message: 'Failed to load instructors', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to load instructors',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstructor = async () => {
    try {
      const response = await superAdminAPI.deleteInstructor(deleteModal.instructor.id);

      if (response.success) {
        setToast({ message: 'Instructor deleted successfully', type: 'success' });
        fetchInstructors(); // Refresh list
      } else {
        setToast({ message: response.message || 'Failed to delete instructor', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting instructor:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to delete instructor',
        type: 'error',
      });
    } finally {
      setDeleteModal({ show: false, instructor: null });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructors Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all instructors and their activities
          </p>
        </div>
        <Link
          to="/admin/instructors/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Add New Instructor
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Instructors List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No instructors found' : 'No instructors yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first instructor'}
          </p>
          {!searchTerm && (
            <Link
              to="/admin/instructors/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Instructor
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor, index) => (
            <motion.div
              key={instructor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-4">
                  <img
                    src={instructor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=random`}
                    alt={instructor.name}
                    className="w-16 h-16 rounded-full border-4 border-white"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg truncate">{instructor.name}</h3>
                    <p className="text-blue-100 text-sm truncate">{instructor.email}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{instructor.email}</span>
                  </div>
                  {instructor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{instructor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {instructor.courses_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Courses</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <UsersIcon className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {instructor.students_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <ClipboardCheck className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {instructor.submissions_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Graded</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {instructor.pending_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/admin/instructors/${instructor.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    to={`/admin/instructors/${instructor.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteModal({ show: true, instructor })}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <Modal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, instructor: null })}
          title="Delete Instructor"
        >
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteModal.instructor?.name}</span>? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ show: false, instructor: null })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInstructor}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

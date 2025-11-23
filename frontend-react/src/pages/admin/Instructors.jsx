import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users as UsersIcon,
  UserPlus,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  MoreVertical,
  Filter,
  Eye,
  Clock,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import AddInstructorModal from '../../components/AddInstructorModal';

export default function Instructors() {
  const location = useLocation();
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(location.state?.openAddModal || false);
  const [deleteModal, setDeleteModal] = useState({ show: false, instructor: null });
  const [detailsModal, setDetailsModal] = useState({ show: false, instructor: null });
  const [instructorDetails, setInstructorDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getInstructors();
      if (response.success) {
        setInstructors(response.instructors || []);
      } else {
        setToast({ message: 'Failed to load instructors', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setToast({ message: error.response?.data?.message || 'Failed to load instructors', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorDetails = async (instructorId) => {
    try {
      setDetailsLoading(true);
      const response = await superAdminAPI.getInstructor(instructorId);
      if (response.success) {
        setInstructorDetails(response.instructor);
      } else {
        setToast({ message: 'Failed to load instructor details', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching instructor details:', error);
      setToast({ message: error.response?.data?.message || 'Failed to load instructor details', type: 'error' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor => {
    if (filterStatus !== 'all' && instructor.status !== filterStatus) return false;
    if (searchTerm && !instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !instructor.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteModal.instructor) return;

    try {
      await superAdminAPI.deleteInstructor(deleteModal.instructor.id);
      setToast({ message: 'Instructor deleted successfully', type: 'success' });
      fetchInstructors();
      setDeleteModal({ show: false, instructor: null });
    } catch (error) {
      setToast({ message: 'Failed to delete instructor', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Instructors Management</h1>
          <p className="text-gray-400 mt-1">
            Manage instructor accounts and monitor their activities
          </p>
        </div>
        {user?.role === 'faculty' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Instructor
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instructors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-6 shadow-lg animate-pulse border border-gray-800">
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
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm ? 'No instructors found' : 'No instructors yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first instructor'}
          </p>
          {!searchTerm && user?.role === 'faculty' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Instructor
            </button>
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
              className="rounded-2xl shadow-xl bg-gray-900 border border-gray-800 p-0 overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                      {instructor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {instructor.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {instructor.email}
                      </p>
                      {instructor.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {instructor.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      instructor.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {instructor.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {instructor.statistics?.courses || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {instructor.statistics?.students || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {instructor.statistics?.graded || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Graded</div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDetailsModal({ show: true, instructor });
                      fetchInstructorDetails(instructor.id);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors text-center text-sm font-medium border border-gray-700"
                  >
                    View Details
                  </button>
                  {user?.role === 'faculty' && (
                    <>
                      <Link
                        to={`/admin/instructors/${instructor.id}/edit`}
                        className="px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal({ show: true, instructor })}
                        className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Instructor Modal */}
      {user?.role === 'faculty' && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Instructor"
        >
          <AddInstructorModal
            onSuccess={() => {
              setIsModalOpen(false);
              fetchInstructors();
              setToast({ message: 'Instructor added successfully', type: 'success' });
            }}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && user?.role === 'faculty' && (
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
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Instructor Details Modal */}
      {detailsModal.show && (
        <Modal
          isOpen={detailsModal.show}
          onClose={() => {
            setDetailsModal({ show: false, instructor: null });
            setInstructorDetails(null);
          }}
          title="Instructor Details"
          className="max-w-4xl"
        >
          <div className="p-0 max-h-[80vh] overflow-y-auto bg-gray-900 rounded-2xl">
            {detailsModal.instructor && (
              <div className="flex flex-col md:flex-row gap-8 p-8">
                {/* Left: Instructor Info */}
                <div className="md:w-1/3 w-full flex flex-col items-center bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-md">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl mb-4 border-4 border-gray-900">
                    {detailsModal.instructor.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1 text-center break-words">{detailsModal.instructor.name}</h3>
                  <div className="text-gray-400 text-sm flex flex-col items-center mb-2">
                    <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{detailsModal.instructor.email}</span>
                    {detailsModal.instructor.phone && (
                      <span className="flex items-center gap-2 mt-1"><Phone className="w-4 h-4" />{detailsModal.instructor.phone}</span>
                    )}
                  </div>
                  <span className={`inline-block px-4 py-1 text-sm font-medium rounded-full mt-2 ${
                    detailsModal.instructor.status === 'active'
                      ? 'bg-green-900/30 text-green-400'
                      : 'bg-red-900/30 text-red-400'
                  }`}>
                    {detailsModal.instructor.status}
                  </span>
                  <div className="mt-6 w-full">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span>Created:</span>
                        <span>{detailsModal.instructor.created_at ? new Date(detailsModal.instructor.created_at).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400 text-xs">
                        <span>Last Login:</span>
                        <span>{detailsModal.instructor.last_login ? new Date(detailsModal.instructor.last_login).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right: Courses & Students */}
                <div className="md:w-2/3 w-full flex flex-col gap-8">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-6 mb-2">
                    <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center border border-blue-900">
                      <div className="text-4xl font-bold text-blue-400 mb-1">{detailsModal.instructor.statistics?.courses || 0}</div>
                      <div className="text-base font-medium text-blue-300">Courses</div>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center border border-green-900">
                      <div className="text-4xl font-bold text-green-400 mb-1">{detailsModal.instructor.statistics?.students || 0}</div>
                      <div className="text-base font-medium text-green-300">Students</div>
                    </div>
                  </div>
                  {/* Courses List */}
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 pb-2 border-b border-gray-800">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      Courses ({instructorDetails && instructorDetails.courses ? instructorDetails.courses.length : 0})
                    </h4>
                    <div className="space-y-6">
                      {instructorDetails && instructorDetails.courses && Array.isArray(instructorDetails.courses) && instructorDetails.courses.length > 0 ? (
                        instructorDetails.courses.map((course) => (
                          <div key={course.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                              <div>
                                <h5 className="font-semibold text-white text-base">{course.name}</h5>
                                <div className="text-xs text-gray-400 mt-1">Code: {course.code}</div>
                              </div>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                course.status === 'active'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-gray-900/30 text-gray-400'
                              }`}>
                                {course.status}
                              </span>
                            </div>
                            {course.description && (
                              <p className="text-sm text-gray-400 mb-2 line-clamp-2">{course.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                              <span>{course.students} students</span>
                              <span>{course.assignments} assignments</span>
                            </div>
                            {/* Student List */}
                            {course.student_list && Array.isArray(course.student_list) && course.student_list.length > 0 ? (
                              <div className="mt-2">
                                <div className="text-xs text-gray-400 mb-1 font-semibold">Enrolled Students:</div>
                                <ul className="space-y-1">
                                  {course.student_list.map((student) => (
                                    <li key={student.id} className="flex items-center gap-2 text-gray-200">
                                      <span className="inline-block w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
                                        {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                      </span>
                                      <span className="truncate max-w-[120px]">{student.name}</span>
                                      <span className="text-xs text-gray-400 truncate max-w-[120px]">{student.email}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 italic mt-2">No students enrolled</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No courses assigned</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

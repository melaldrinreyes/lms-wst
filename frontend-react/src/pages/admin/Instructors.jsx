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
          <h1 className="text-3xl font-bold text-[#1d2026]">Instructors Management</h1>
          <p className="text-[#718096] mt-1">
            Manage instructor accounts and monitor their activities
          </p>
        </div>
        {user?.role === 'faculty' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 hover:shadow-[#FF4C60]/50 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Instructor
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-5 h-5 text-[#718096]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-700 rounded-xl text-gray-900 placeholder-white/70 focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-[#718096]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-700 rounded-xl text-gray-900 focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent appearance-none"
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
            <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse border border-gray-800">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white dark:bg-white rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-white dark:bg-white rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white dark:bg-white rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="bg-white dark:bg-white rounded-xl shadow-lg border border-[#ff6b6b] p-12 text-center">
          <UsersIcon className="w-16 h-16 text-[#718096] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No instructors found' : 'No instructors yet'}
          </h3>
          <p className="text-[#718096] dark:text-[#718096] mb-6">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Get started by adding your first instructor'}
          </p>
          {!searchTerm && user?.role === 'faculty' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4C60]/100 text-gray-900 rounded-xl hover:bg-[#FF4C60] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Instructor
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredInstructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center text-gray-900 font-bold text-sm flex-shrink-0">
                          {instructor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#1d2026]">{instructor.name}</div>
                          <div className="text-xs text-[#718096]">ID: {instructor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#4a5568]">{instructor.email}</div>
                      {instructor.phone && (
                        <div className="text-xs text-[#718096] mt-1">{instructor.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#ff9f66]">
                        {instructor.statistics?.courses || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-400">
                        {instructor.statistics?.students || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        instructor.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {instructor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#718096]">
                        {instructor.created_at ? new Date(instructor.created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <p className="text-[#4a5568] dark:text-[#4a5568] mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteModal.instructor?.name}</span>? This action cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ show: false, instructor: null })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 rounded-xl hover:bg-white dark:hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-gray-900 rounded-xl hover:bg-red-600 transition-colors"
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
          size="md"
        >
          {instructorDetails && (
            <>
              {/* Profile Section */}
              <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-700">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center text-gray-900 font-bold text-2xl shadow-lg">
                    {instructorDetails.name?.charAt(0).toUpperCase() || 'I'}
                  </div>
                  <span className={`absolute -bottom-1 -right-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                    instructorDetails.status === 'active'
                      ? 'bg-green-500 text-[#1d2026]'
                      : 'bg-red-500 text-[#1d2026]'
                  }`}>
                    {instructorDetails.status}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{instructorDetails.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[#4a5568] text-sm">
                      <Mail className="w-4 h-4 text-[#718096] flex-shrink-0" />
                      <span className="truncate">{instructorDetails.email}</span>
                    </div>
                    {instructorDetails.phone && (
                      <div className="flex items-center gap-2 text-[#4a5568] text-sm">
                        <Phone className="w-4 h-4 text-[#718096] flex-shrink-0" />
                        <span>{instructorDetails.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-700">
                      <div className="text-2xl font-bold text-[#ff9f66]">{instructorDetails.statistics?.courses || 0}</div>
                      <div className="text-xs text-[#718096] mt-1">Courses</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-700">
                      <div className="text-2xl font-bold text-green-400">{instructorDetails.statistics?.students || 0}</div>
                      <div className="text-xs text-[#718096] mt-1">Students</div>
                    </div>
                    <div className="bg-white rounded-xl p-3 text-center border border-gray-700">
                      <div className="text-xs text-[#4a5568] font-medium">
                        {instructorDetails.created_at ? new Date(instructorDetails.created_at).toLocaleDateString() : '-'}
                      </div>
                      <div className="text-xs text-[#718096] mt-1">Joined</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#ff9f66]" />
                  Courses
                  <span className="text-sm font-normal text-[#718096]">
                    ({instructorDetails.courses ? instructorDetails.courses.length : 0})
                  </span>
                </h4>

                {instructorDetails.courses && Array.isArray(instructorDetails.courses) && instructorDetails.courses.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-700 divide-y divide-gray-700">
                    {instructorDetails.courses.map((course, index) => (
                      <div key={course.id} className="p-4 hover:bg-white/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-semibold text-gray-900 text-base">{course.name}</h5>
                              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                course.status === 'active'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-white text-[#718096]'
                              }`}>
                                {course.status}
                              </span>
                            </div>
                            <div className="text-sm text-[#718096] mb-2">Course Code: {course.code}</div>
                            {course.description && (
                              <p className="text-sm text-[#718096] mb-3 line-clamp-2">{course.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-[#718096]">
                              <span className="flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" />
                                {course.students} {course.students === 1 ? 'student' : 'students'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <ClipboardCheck className="w-4 h-4" />
                                {course.assignments} {course.assignments === 1 ? 'assignment' : 'assignments'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/50 rounded-xl border border-gray-700">
                    <BookOpen className="w-12 h-12 text-[#718096] mx-auto mb-3" />
                    <p className="text-[#718096]">No courses assigned to this instructor</p>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

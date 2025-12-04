import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Users, 
  FileText, 
  BarChart,
  Edit,
  Trash2,
  Eye,
  Settings,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { courseAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';
import Swal from 'sweetalert2';
import Skeleton from '../../components/ui/Skeleton';
import CourseCard from '../../components/ui/CourseCard';

export default function FacultyCourses() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [copiedCourseId, setCopiedCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '3',
    semester: '',
    academic_year: '',
    thumbnail: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  // Open Create Course modal when navigated with state { openCreate: true }
  useEffect(() => {
    if (location?.state?.openCreate) {
      setShowCreateModal(true);
    }
  }, [location]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('Fetching faculty courses...');
      console.log('Current user:', JSON.parse(localStorage.getItem('user') || '{}'));
      console.log('Token exists:', !!localStorage.getItem('token'));
      
      const response = await courseAPI.getAll();
      console.log('Courses API response:', response);
      
      setCourses(response.courses || []);
      
      if (!response.courses || response.courses.length === 0) {
        console.warn('No courses found for this instructor');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setToast({ message: 'Failed to load courses', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;
    return matchesSearch && matchesSemester;
  });

  const handleShareCourse = async (courseId, courseName) => {
    const shareUrl = `${window.location.origin}/invite/${courseId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedCourseId(courseId);
      setToast({ 
        message: `Course link copied to clipboard!`, 
        type: 'success' 
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedCourseId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setToast({ 
        message: 'Failed to copy link. Please try again.', 
        type: 'error' 
      });
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse({
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description || '',
      credits: course.credits || 3,
      semester: course.semester,
      year_level: course.year_level || '',
      section: course.section || '',
      academic_year: course.academic_year,
      thumbnail: course.thumbnail || '',
      status: course.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    
    try {
      const response = await courseAPI.update(editingCourse.id, editingCourse);
      if (response.success) {
        setToast({ message: 'Course updated successfully!', type: 'success' });
        setShowEditModal(false);
        fetchCourses(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating course:', error);
      setToast({ message: error.response?.data?.message || 'Failed to update course', type: 'error' });
    }
  };

  const handleCreateCourse = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: '3',
      semester: '',
      academic_year: '',
      thumbnail: ''
    });
    setErrors({});
    setShowCreateModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    setErrors({});
    setCreating(true);

    try {
      // Ensure the created course is associated with the current faculty user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const payload = { ...formData };
      // Use known faculty key if present, fall back to generic id
      if (currentUser) {
        payload.faculty_id = currentUser.id || currentUser.faculty_id || currentUser.user_id || payload.faculty_id;
      }

      const result = await courseAPI.create(payload);

      if (result.success) {
        setToast({ message: 'Course created successfully!', type: 'success' });
        setShowCreateModal(false);
        fetchCourses();
      }
    } catch (err) {
      console.error('Error creating course:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        const firstErrorKey = Object.keys(err.response.data.errors)[0];
        const firstError = err.response.data.errors[firstErrorKey][0];
        setToast({ message: firstError, type: 'error' });
      } else {
        setToast({ 
          message: err.response?.data?.message || 'Failed to create course', 
          type: 'error' 
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    const res = await Swal.fire({
      title: 'Delete course',
      text: `Are you sure you want to delete "${courseName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      setDeleting(true);
      const response = await courseAPI.delete(courseId);
      if (response.success) {
        setToast({ message: 'Course deleted successfully!', type: 'success' });
        fetchCourses(); // Refresh the list
        Swal.fire({ title: 'Deleted', text: 'Course deleted', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete course', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Filters */}
      {loading ? (
        <div className="bg-white dark:bg-white rounded-xl border border-gray-800 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="flex-1 h-10 rounded-xl" />
            <Skeleton className="h-10 w-48 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-white rounded-xl border border-[#ff6b6b] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#718096]" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white border border-gray-700 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-gray-900 placeholder-white/70"
            />
          </div>

          {/* Semester Filter */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-white border border-gray-700 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-[#1d2026]"
          >
            <option value="all">All Semesters</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton loading for courses
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-white rounded-xl border border-gray-800 overflow-hidden">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
              </div>
            </div>
          ))
        ) : (
          filteredCourses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              variant="teacher"
              index={index}
              onEdit={handleEditCourse}
              onDelete={handleDeleteCourse}
              onShare={handleShareCourse}
              copiedCourseId={copiedCourseId}
            />
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-white rounded-xl border border-[#ff6b6b]">
          <BookOpen className="w-16 h-16 text-[#718096] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-[#718096] mb-6">
            Try adjusting your search or create a new course
          </p>
          <button
            onClick={handleCreateCourse}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create Your First Course
          </button>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-white rounded-xl shadow-2xl border border-[#ff6b6b] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-[#ff6b6b] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-[#007AFF] to-[#0051D5] rounded-xl">
                    <BookOpen className="w-6 h-6 text-[#1d2026]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#1d2026]">Create New Course</h2>
                    <p className="text-sm text-[#718096] mt-1">Add a new course to your teaching portfolio</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[#718096]" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="e.g., CS101, MATH201"
                    className={`w-full px-4 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-700'} rounded-xl focus:ring-2 focus:ring-[#ff6b6b] bg-white text-gray-900 placeholder-white/70`}
                    required
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.code[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Credits <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleFormChange}
                    min="1"
                    max="10"
                    className={`w-full px-4 py-2 border ${errors.credits ? 'border-red-500' : 'border-gray-700'} bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]`}
                    required
                  />
                  {errors.credits && (
                    <p className="mt-1 text-sm text-red-500">{errors.credits[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., Introduction to Computer Science"
                  className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-700'} bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name[0]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Course Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Describe what students will learn in this course..."
                  rows="3"
                  className={`w-full px-4 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-700'} bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b] resize-none`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleFormChange}
                    className={`w-full px-4 py-2 border ${errors.semester ? 'border-red-500' : 'border-gray-700'} bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]`}
                    required
                  >
                    <option value="">Select semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                  {errors.semester && (
                    <p className="mt-1 text-sm text-red-500">{errors.semester[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleFormChange}
                    placeholder="e.g., 2024-2025, 2025-2026"
                    className={`w-full px-4 py-2 border ${errors.academic_year ? 'border-red-500' : 'border-gray-700'} bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]`}
                    required
                  />
                  {errors.academic_year && (
                    <p className="mt-1 text-sm text-red-500">{errors.academic_year[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Thumbnail Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty to use default course image</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-white rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all font-semibold shadow-lg shadow-[#FF4C60]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Create Course
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-white text-[#4a5568] rounded-xl hover:bg-white transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-panel modal-panel--lg bg-white dark:bg-white rounded-xl shadow-2xl border border-[#ff6b6b] w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-[#ff6b6b]">
              <h2 className="text-2xl font-bold text-[#1d2026]">Edit Course</h2>
              <p className="text-sm text-[#718096] mt-1">Update course information</p>
            </div>

            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] bg-white text-gray-900 placeholder-white/70"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingCourse.credits}
                    onChange={(e) => setEditingCourse({ ...editingCourse, credits: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Description
                </label>
                <textarea
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Semester *
                  </label>
                  <select
                    value={editingCourse.semester}
                    onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                    required
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={editingCourse.academic_year}
                    onChange={(e) => setEditingCourse({ ...editingCourse, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Year Level
                  </label>
                  <input
                    type="text"
                    value={editingCourse.year_level}
                    onChange={(e) => setEditingCourse({ ...editingCourse, year_level: e.target.value })}
                    placeholder="e.g., 1st Year, 2nd Year"
                    className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4a5568] mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    value={editingCourse.section}
                    onChange={(e) => setEditingCourse({ ...editingCourse, section: e.target.value })}
                    placeholder="e.g., A, B, C"
                    className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Status *
                </label>
                <select
                  value={editingCourse.status}
                  onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4a5568] mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={editingCourse.thumbnail}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-700 bg-white text-gray-900 placeholder-white/70 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-[#ff6b6b]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-[#007AFF] to-[#0051D5] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all font-semibold shadow-lg shadow-[#FF4C60]/30"
                >
                  Update Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-white text-[#4a5568] rounded-xl hover:bg-white transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

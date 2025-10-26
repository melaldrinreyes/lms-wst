import { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { courseAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function FacultyCourses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [copiedCourseId, setCopiedCourseId] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      setCourses(response.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
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

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await courseAPI.delete(courseId);
      if (response.success) {
        setToast({ message: 'Course deleted successfully!', type: 'success' });
        fetchCourses(); // Refresh the list
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
      
      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-orange-500" size={28} />
              My Courses
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your courses, modules, and student activities
            </p>
          </div>
          <Link
            to="/faculty/courses/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create Course
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400"
            />
          </div>

          {/* Semester Filter */}
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 dark:bg-gray-900 border border-gray-700 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
          >
            <option value="all">All Semesters</option>
            <option value="1st Semester">1st Semester</option>
            <option value="2nd Semester">2nd Semester</option>
            <option value="Summer">Summer</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 overflow-hidden hover:border-orange-500/50 transition-all group"
          >
            {/* Thumbnail */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-500/10 to-purple-500/10">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-600" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 text-white text-xs font-semibold rounded-full ${
                  course.status === 'active' ? 'bg-green-500' : 
                  course.status === 'inactive' ? 'bg-gray-500' : 'bg-blue-500'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-orange-500">{course.code}</span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {course.name}
                  </h3>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {course.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-green-500" />
                  <span>{course.students}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>{course.modules} Modules</span>
                </div>
                <div className="flex items-center gap-1">
                  <BarChart className="w-4 h-4 text-purple-500" />
                  <span>{course.assignments}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                {course.semester} • {course.academic_year}
                {(course.year_level || course.section) && (
                  <> • {course.year_level}{course.year_level && course.section ? ' - ' : ''}{course.section}</>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/faculty/courses/${course.id}`}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all text-center text-sm font-semibold shadow-lg shadow-orange-500/30"
                >
                  Manage
                </Link>
                <button
                  onClick={() => handleShareCourse(course.id, course.name)}
                  className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all"
                  title="Share course link"
                >
                  {copiedCourseId === course.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEditCourse(course)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all"
                  title="Edit course"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id, course.name)}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No courses found
          </h3>
          <p className="text-gray-400 mb-6">
            Try adjusting your search or create a new course
          </p>
          <Link
            to="/faculty/courses/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create Your First Course
          </Link>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editingCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-white">Edit Course</h2>
              <p className="text-sm text-gray-400 mt-1">Update course information</p>
            </div>

            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingCourse.credits}
                    onChange={(e) => setEditingCourse({ ...editingCourse, credits: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  value={editingCourse.name}
                  onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingCourse.description}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Semester *
                  </label>
                  <select
                    value={editingCourse.semester}
                    onChange={(e) => setEditingCourse({ ...editingCourse, semester: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Summer">Summer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={editingCourse.academic_year}
                    onChange={(e) => setEditingCourse({ ...editingCourse, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year Level
                  </label>
                  <input
                    type="text"
                    value={editingCourse.year_level}
                    onChange={(e) => setEditingCourse({ ...editingCourse, year_level: e.target.value })}
                    placeholder="e.g., 1st Year, 2nd Year"
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    value={editingCourse.section}
                    onChange={(e) => setEditingCourse({ ...editingCourse, section: e.target.value })}
                    placeholder="e.g., A, B, C"
                    className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  value={editingCourse.status}
                  onChange={(e) => setEditingCourse({ ...editingCourse, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={editingCourse.thumbnail}
                  onChange={(e) => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30"
                >
                  Update Course
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all font-semibold"
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

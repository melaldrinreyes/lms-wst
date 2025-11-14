import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, BookOpen, Users, FileText, Calendar, Upload, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { courseAPI, superAdminAPI } from '../../services/api';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructorMap, setInstructorMap] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    faculty_id: '',
    credits: 3,
    semester: '1st Semester',
    academic_year: '2024-2025',
    thumbnail: ''
  });

  // Fetch courses and instructors on mount
  useEffect(() => {
    fetchInstructors();
  }, []);

  // Fetch courses when instructorMap is updated
  useEffect(() => {
    if (Object.keys(instructorMap).length > 0 || !loading) {
      fetchCourses();
    }
  }, [instructorMap]);

  const fetchInstructors = async () => {
    try {
      const response = await superAdminAPI.getInstructors();
      if (response.success) {
        const map = {};
        response.instructors.forEach(instructor => {
          map[instructor.id] = instructor.name;
        });
        setInstructorMap(map);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      
      if (response.success) {
        // Transform API response to match component expectations
        const formattedCourses = response.courses.map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
          description: course.description,
          faculty_id: course.faculty_id || 0,
          instructor: instructorMap[course.faculty_id] || 'Unknown',
          students: course.students || 0,
          modules: course.modules || 0,
          assignments: course.assignments || 0,
          status: course.status,
          credits: course.credits,
          semester: course.semester,
          academic_year: course.academic_year,
          thumbnail: course.thumbnail || `https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80`,
        }));
        setCourses(formattedCourses);
      } else {
        setToast({ message: 'Failed to load courses', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to load courses',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      faculty_id: '',
      credits: 3,
      semester: '1st Semester',
      academic_year: '2024-2025',
      thumbnail: ''
    });
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      description: course.description,
      faculty_id: course.faculty_id,
      credits: course.credits,
      semester: course.semester,
      academic_year: course.academic_year,
      thumbnail: course.thumbnail || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        const response = await courseAPI.update(editingCourse.id, {
          course_code: formData.code,
          course_name: formData.name,
          description: formData.description,
          faculty_id: formData.faculty_id,
          credits: formData.credits,
          semester: formData.semester,
          academic_year: formData.academic_year,
        });
        if (response.success) {
          setToast({ message: 'Course updated successfully!', type: 'success' });
          fetchCourses();
        }
      } else {
        const response = await courseAPI.create({
          course_code: formData.code,
          course_name: formData.name,
          description: formData.description,
          faculty_id: formData.faculty_id,
          credits: formData.credits,
          semester: formData.semester,
          academic_year: formData.academic_year,
        });
        if (response.success) {
          setToast({ message: 'Course created successfully!', type: 'success' });
          fetchCourses();
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving course:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to save course',
        type: 'error',
      });
    }
  };

  const handleDelete = async (courseId) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await courseAPI.delete(courseId);
        if (response.success) {
          setToast({ message: 'Course deleted successfully!', type: 'success' });
          fetchCourses();
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        setToast({
          message: error.response?.data?.message || 'Failed to delete course',
          type: 'error',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Manage Courses
        </h1>
        <button
          onClick={handleAddCourse}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No courses found' : 'No courses yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group"
          >
            {/* Thumbnail */}
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="text-gray-400" size={48} />
                </div>
              )}
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(course.status)}`}>
                {course.status}
              </span>
            </div>

            <div className="p-6">
              {/* Course Info */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{course.code}</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1 line-clamp-2">
                  {course.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                  {course.description}
                </p>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Instructor: {course.instructor}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b dark:border-gray-700">
                <div className="text-center">
                  <Users className="mx-auto text-blue-500 mb-1" size={20} />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Students</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{course.students}</p>
                </div>
                <div className="text-center">
                  <FileText className="mx-auto text-green-500 mb-1" size={20} />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Modules</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{course.modules}</p>
                </div>
                <div className="text-center">
                  <Calendar className="mx-auto text-purple-500 mb-1" size={20} />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tasks</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{course.assignments}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  to={`/admin/courses/${course.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  <Eye size={16} />
                  Manage
                </Link>
                <button 
                  onClick={() => handleEditCourse(course)}
                  className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition"
                  title="Edit Course"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                  title="Delete Course"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Add/Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="CS101"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credits *
              </label>
              <input
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({...formData, credits: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                min="1"
                max="6"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Introduction to Computer Science"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Course description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Academic Year *
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="2024-2025"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thumbnail URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({...formData, thumbnail: e.target.value})}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://..."
              />
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Upload Image"
              >
                <Upload size={20} />
              </button>
            </div>
            {formData.thumbnail && (
              <div className="mt-2">
                <img src={formData.thumbnail} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              {editingCourse ? 'Update Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

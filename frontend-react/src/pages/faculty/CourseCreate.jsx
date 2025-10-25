import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { ArrowLeft, Save, AlertCircle, BookOpen } from 'lucide-react';
import Toast from '../../components/ui/Toast';

const CourseCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '3',
    semester: '',
    academic_year: '',
    thumbnail: ''
  });

  const semesters = ['1st Semester', '2nd Semester', 'Summer'];
  const currentYear = new Date().getFullYear();
  const academicYears = [
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const result = await courseAPI.create(formData);

      if (result.success) {
        setToast({ message: 'Course created successfully!', type: 'success' });
        setTimeout(() => {
          navigate('/faculty/courses');
        }, 1500);
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
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/faculty/courses')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Course
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new course to your teaching portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Code and Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., CS101, MATH201"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Credits <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="1"
                max="10"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  errors.credits ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              />
              {errors.credits && (
                <p className="mt-1 text-sm text-red-500">{errors.credits[0]}</p>
              )}
            </div>
          </div>

          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Introduction to Computer Science"
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this course..."
              rows="4"
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white resize-none`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description[0]}</p>
            )}
          </div>

          {/* Semester and Academic Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  errors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              >
                <option value="">Select semester</option>
                {semesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              {errors.semester && (
                <p className="mt-1 text-sm text-red-500">{errors.semester[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <select
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${
                  errors.academic_year ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              >
                <option value="">Select academic year</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              {errors.academic_year && (
                <p className="mt-1 text-sm text-red-500">{errors.academic_year[0]}</p>
              )}
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thumbnail Image URL (Optional)
            </label>
            <input
              type="url"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty to use default course image
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/faculty/courses')}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Course...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Create Course
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseCreate;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { classAPI, courseAPI } from '../../services/api';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Toast from '../../components/ui/Toast';

const ClassForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    year_level: '',
    section: '',
    school_year: '',
    semester: '',
    status: 'active'
  });

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const semesters = ['1st Semester', '2nd Semester', 'Summer'];

  useEffect(() => {
    if (isEditMode) {
      fetchClass();
    }
  }, [id]);

  const fetchCourses = async () => {
    try {
      const result = await courseAPI.getAll();
      if (result.success && result.courses) {
        setCourses(result.courses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const fetchClass = async () => {
    try {
      setLoading(true);
      const result = await classAPI.getOne(id);
      if (result.success) {
        setFormData({
          subject_name: result.class.subject_name || '',
          year_level: result.class.year_level,
          section: result.class.section,
          school_year: result.class.school_year,
          semester: result.class.semester,
          status: result.class.status
        });
      }
    } catch (err) {
      console.error('Error fetching class:', err);
      alert('Failed to load class details');
      navigate('/faculty/classes');
    } finally {
      setLoading(false);
    }
  };

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
      let result;
      if (isEditMode) {
        result = await classAPI.update(id, formData);
      } else {
        result = await classAPI.create(formData);
      }

      if (result.success) {
        navigate('/faculty/classes');
      }
    } catch (err) {
      console.error('Error saving class:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert(err.response?.data?.message || 'Failed to save class');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/faculty/classes')}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-500 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Classes
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Class' : 'Create New Class'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isEditMode ? 'Update class information' : 'Add a new class section'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course/Subject Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject_name"
              value={formData.subject_name}
              onChange={handleChange}
              placeholder="e.g., Mathematics, Computer Science, English"
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                errors.subject_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
              } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
              required
            />
            {errors.subject_name && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.subject_name[0]}
              </p>
            )}
          </div>

          {/* Year Level and Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Year Level <span className="text-red-500">*</span>
              </label>
              <select
                name="year_level"
                value={formData.year_level}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                  errors.year_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              >
                <option value="">Select year level</option>
                {yearLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              {errors.year_level && (
                <p className="mt-1 text-sm text-red-500">{errors.year_level[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Section <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g., A, B, 1, 2"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                  errors.section ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              />
              {errors.section && (
                <p className="mt-1 text-sm text-red-500">{errors.section[0]}</p>
              )}
            </div>
          </div>

          {/* School Year and Semester */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School Year <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="school_year"
                value={formData.school_year}
                onChange={handleChange}
                placeholder="e.g., 2024-2025"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                  errors.school_year ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
                required
              />
              {errors.school_year && (
                <p className="mt-1 text-sm text-red-500">{errors.school_year[0]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester <span className="text-red-500">*</span>
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
                  errors.semester ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
                } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white`}
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
          </div>

          {/* Status (Edit mode only) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/faculty/classes')}
              className="flex-1 px-6 py-3 bg-gray-800/50 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 text-white rounded-xl transition-all font-medium border border-gray-700 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditMode ? 'Update Class' : 'Create Class'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassForm;

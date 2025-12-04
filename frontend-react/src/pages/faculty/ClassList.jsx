import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../../services/api';
import { 
  GraduationCap, 
  Users, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';

const ClassList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const result = await classAPI.getAll();
      if (result.success) {
        setClasses(result.classes);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classId) => {
    try {
      const result = await classAPI.delete(classId);
      if (result.success) {
        setClasses(classes.filter(c => c.id !== classId));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete class',
        confirmButtonColor: '#f97316'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b6b]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#1d2026]">My Classes</h1>
          <p className="text-[#718096] dark:text-[#718096] mt-1">
            Manage your classes, sections, and students
          </p>
        </div>
        <button
          onClick={() => navigate('/faculty/classes/new')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 hover:shadow-[#FF4C60]/50"
        >
          <Plus className="w-5 h-5" />
          Create New Class
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="bg-white dark:bg-white rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-[#718096] mb-4" />
          <h3 className="text-xl font-semibold text-[#4a5568] dark:text-[#4a5568] mb-2">
            No classes yet
          </h3>
          <p className="text-gray-500 dark:text-[#718096] mb-6">
            Create your first class to start organizing your students
          </p>
          <button
            onClick={() => navigate('/faculty/classes/new')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl font-semibold hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all shadow-lg shadow-[#FF4C60]/30 hover:shadow-[#FF4C60]/50"
          >
            <Plus className="w-4 h-4" />
            Create Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white dark:bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#ff6b6b]/50"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] p-4 text-[#1d2026]">
                <h3 className="text-lg font-bold mb-1">{classItem.subject_name || classItem.course?.name || 'N/A'}</h3>
                <p className="text-[#FF4C60] 100 text-sm">
                  Year {classItem.year_level} - Section {classItem.section}
                </p>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#4a5568] dark:text-[#4a5568]">
                  <Calendar className="w-4 h-4 text-[#FF4C60]" />
                  <span className="text-sm">
                    {classItem.school_year} - {classItem.semester}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#4a5568] dark:text-[#4a5568]">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    {classItem.students_count || 0} {classItem.students_count === 1 ? 'Student' : 'Students'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
                    classItem.status === 'active' 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-white/10 text-gray-500 border border-gray-500/20'
                  }`}>
                    {classItem.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-white/50 flex gap-2">
                <button
                  onClick={() => navigate(`/faculty/classes/${classItem.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#FF4C60]/100/10 text-[#FF4C60] rounded-xl hover:bg-[#FF4C60]/100/20 transition-all font-medium border border-[#FF4C60]/20"
                  title="View Students"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">View</span>
                </button>
                <button
                  onClick={() => navigate(`/faculty/classes/${classItem.id}/edit`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#FF4C60]/10 text-[#FF4C60] rounded-xl hover:bg-[#8B0000]/20 transition-all font-medium border border-[#ff6b6b]/20"
                  title="Edit Class"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">Edit</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm(classItem.id)}
                  className="px-3 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                  title="Delete Class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-panel modal-panel--md bg-white dark:bg-white rounded-2xl shadow-2xl w-full p-6 border border-gray-200 dark:border-gray-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Delete Class
            </h3>
            <p className="text-[#718096] dark:text-[#718096] mb-6">
              Are you sure you want to delete this class? This will remove all student enrollments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-white/50 dark:bg-white hover:bg-white dark:hover:bg-white text-gray-900 rounded-xl font-medium transition-all border border-gray-700 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] hover:from-red-600 hover:to-red-700 text-gray-900 rounded-xl font-medium transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;

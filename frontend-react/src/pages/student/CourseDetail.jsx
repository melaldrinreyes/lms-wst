import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  FileText,
  MessageSquare,
  Calendar,
  LogOut,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { courseAPI, moduleAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Helper: format relative time (simple, no extra dependency)
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.floor((now - then) / 1000); // seconds

    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff} sec${diff > 1 ? 's' : ''} ago`;
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return `${m} min${m > 1 ? 's' : ''} ago`;
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return `${h} hour${h > 1 ? 's' : ''} ago`;
    }
    if (diff < 2592000) {
      const d = Math.floor(diff / 86400);
      return `${d} day${d > 1 ? 's' : ''} ago`;
    }
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      if (response.success) {
        setCourse(response.course);
        setModules(response.course.modules || []);
        setAssignments(response.course.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({ message: 'Failed to load course data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCourse = async () => {
    try {
      setLeaving(true);
      const response = await courseAPI.removeStudent(id, user.id);
      
      if (response.success) {
        setToast({ 
          message: 'You have successfully left the course', 
          type: 'success' 
        });
        
        // Redirect to courses page after 1.5 seconds
        setTimeout(() => {
          navigate('/student/courses');
        }, 1500);
      }
    } catch (error) {
      console.error('Error leaving course:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to leave course. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLeaving(false);
      setShowLeaveModal(false);
    }
  };

  const handleDownloadModule = async (moduleId, moduleTitle) => {
    // Use direct URL download instead of API call
    const downloadUrl = `http://127.0.0.1:8000/api/modules/${moduleId}/download`;
    const token = localStorage.getItem('token');
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    link.setAttribute('target', '_blank');
    
    // Add authorization header by opening in new window with fetch
    fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = moduleTitle || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setToast({ message: 'Module downloaded successfully!', type: 'success' });
    })
    .catch(error => {
      console.error('Error downloading module:', error);
      setToast({ 
        message: 'Failed to download module. Please try again.', 
        type: 'error' 
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Course not found</p>
          <button
            onClick={() => navigate('/student/courses')}
            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const completedModules = modules.filter(m => m.status === 'published').length;
  const progress = modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-500 mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Courses</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span className="bg-gray-800 px-3 py-1 rounded-lg">{course.code}</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{course.name}</h1>
            <p className="text-gray-400 mb-4">{course.description || 'No description available'}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <BookOpen size={16} className="text-orange-500" />
                <span>{course.credits || 3} Credits</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={16} className="text-orange-500" />
                <span>{course.students || 0} Students</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} className="text-orange-500" />
                <span>{course.semester} {course.academic_year}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowLeaveModal(true)}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition flex items-center gap-2"
          >
            <LogOut size={18} />
            <span>Leave Course</span>
          </button>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'modules', label: 'Modules', icon: PlayCircle },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'announcements', label: 'Announcements', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Course Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Modules</span>
                  <span className="text-white font-semibold">{modules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Published</span>
                  <span className="text-green-400 font-semibold">{completedModules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assignments</span>
                  <span className="text-white font-semibold">{assignments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Students</span>
                  <span className="text-white font-semibold">{course.students || 0}</span>
                </div>
              </div>
            </motion.div>

            {/* Course Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Course Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Course Code</p>
                  <p className="text-white font-semibold">{course.code}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Credits</p>
                  <p className="text-white font-semibold">{course.credits || 3} units</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Semester</p>
                  <p className="text-white font-semibold">{course.semester}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Academic Year</p>
                  <p className="text-white font-semibold">{course.academic_year}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-4">
            {modules.length > 0 ? (
              modules.map((module, index) => (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        module.status === 'published' ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800'
                      }`}>
                        {module.status === 'published' ? (
                          <CheckCircle size={24} className="text-green-400" />
                        ) : (
                          <PlayCircle size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">{module.description || 'No description available'}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen size={14} />
                            Order: {module.order}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            module.status === 'published' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {module.status === 'published' ? 'Posted' : 'Draft'}
                          </span>
                          {/* Show updated indicator when module was modified after creation */}
                          {module.updated_at && module.created_at && module.updated_at !== module.created_at && (
                            <span className="flex items-center gap-1 text-yellow-400 text-xs" title={new Date(module.updated_at).toLocaleString()}>
                              <Clock size={12} />
                              Updated {formatRelativeTime(module.updated_at)}
                            </span>
                          )}
                          {module.file_path && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <FileText size={14} />
                              File attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {module.file_path ? (
                        module.status === 'published' ? (
                          <div className="relative">
                            <button 
                              onClick={() => handleDownloadModule(module.id, module.title)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                            >
                              <Download size={16} />
                              Download
                            </button>
                            {/* Show "Updated" badge on download button if file was modified */}
                            {module.updated_at && module.created_at && module.updated_at !== module.created_at && (
                              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded-full animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                        ) : (
                          <button 
                            disabled
                            className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg transition text-sm font-medium flex items-center gap-2 cursor-not-allowed"
                          >
                            <Download size={16} />
                            Not Available
                          </button>
                        )
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm italic">
                          No file uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No modules available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{assignment.title}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          assignment.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{assignment.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          Max Points: {assignment.max_points || 100}
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-sm font-medium">
                      {assignment.status === 'published' ? 'View' : 'Coming Soon'}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No assignments available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No announcements yet</p>
              <p className="text-gray-500 text-sm mt-2">Check back later for course updates</p>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Leave Course Confirmation Modal */}
      {showLeaveModal && (
        <Modal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          title="Leave Course"
        >
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                <strong>Warning:</strong> You are about to leave this course.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-300">
                Are you sure you want to leave <strong>{course?.name}</strong>?
              </p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>You will lose access to all course materials</li>
                <li>Your progress will be saved but marked as dropped</li>
                <li>You can re-enroll later using the invitation link</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowLeaveModal(false)}
                disabled={leaving}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveCourse}
                disabled={leaving}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {leaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Leaving...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={18} />
                    <span>Leave Course</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

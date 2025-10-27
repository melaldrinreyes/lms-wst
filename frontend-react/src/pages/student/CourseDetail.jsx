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
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import { courseAPI, submissionAPI } from '../../services/api';
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
  
  // Assignment submission states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    submission_text: '',
    file: null
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionData({ submission_text: '', file: null });
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    if (!submissionData.file && !submissionData.submission_text.trim()) {
      setToast({ 
        message: 'Please provide either a file or submission text', 
        type: 'error' 
      });
      return;
    }

    // Validate file size if provided
    if (submissionData.file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (submissionData.file.size > maxSize) {
        setToast({ 
          message: 'File size must be less than 10MB', 
          type: 'error' 
        });
        return;
      }
    }

    try {
      setSubmitting(true);

      // Build FormData if file exists
      let payload;
      if (submissionData.file) {
        payload = new FormData();
        payload.append('assignment_id', selectedAssignment.id);
        payload.append('submission_text', submissionData.submission_text || '');
        payload.append('file', submissionData.file);
      } else {
        payload = {
          assignment_id: selectedAssignment.id,
          submission_text: submissionData.submission_text,
        };
      }

      const response = await submissionAPI.submit(payload);

      if (response.success) {
        setToast({ 
          message: 'Assignment submitted successfully!', 
          type: 'success' 
        });
        setShowSubmitModal(false);
        setSubmissionData({ submission_text: '', file: null });
        setSelectedAssignment(null);
        
        // Refresh course data to update submission status
        fetchCourseData();
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setToast({ 
        message: error.response?.data?.message || 'Failed to submit assignment. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
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
                  className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{module.module_title}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          module.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {module.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{module.description || 'No description available'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          Order: {module.module_order}
                        </span>
                      </div>
                    </div>
                    {module.file_path && (
                      <a
                        href={`http://127.0.0.1:8000/storage/${module.file_path}`}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <FileText size={16} />
                        <span>Download</span>
                      </a>
                    )}
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
                        {/* Submission Status Badge */}
                        {assignment.status === 'published' && (
                          assignment.user_submission ? (
                            <span className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                              assignment.user_submission.status === 'graded'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {assignment.user_submission.status === 'graded' ? (
                                <>
                                  <CheckCircle size={12} />
                                  Graded ({assignment.user_submission.grade})
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={12} />
                                  Submitted
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20">
                              <Clock size={12} />
                              Not Submitted
                            </span>
                          )
                        )}
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
                        {assignment.user_submission && (
                          <span className="flex items-center gap-1 text-green-400">
                            <Clock size={14} />
                            Submitted: {new Date(assignment.user_submission.submitted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {/* Show grade and feedback if graded */}
                      {assignment.user_submission && assignment.user_submission.status === 'graded' && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-400">
                            <strong>Grade:</strong> {assignment.user_submission.grade} / {assignment.max_points}
                          </p>
                          {assignment.user_submission.feedback && (
                            <p className="text-sm text-gray-300 mt-1">
                              <strong>Feedback:</strong> {assignment.user_submission.feedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => assignment.status === 'published' && !assignment.user_submission && handleOpenSubmitModal(assignment)}
                      disabled={assignment.status !== 'published' || assignment.user_submission}
                      className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${
                        assignment.user_submission
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          : assignment.status === 'published'
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {assignment.user_submission ? (
                        <>
                          <CheckCircle size={16} />
                          <span>Submitted</span>
                        </>
                      ) : assignment.status === 'published' ? (
                        <>
                          <Upload size={16} />
                          <span>Submit</span>
                        </>
                      ) : (
                        'Coming Soon'
                      )}
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

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignment && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => !submitting && setShowSubmitModal(false)}
          title={`Submit Assignment: ${selectedAssignment.title}`}
        >
          <form onSubmit={handleSubmitAssignment} className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Due Date:</span>
                <span className="text-white font-medium">
                  {selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'No due date'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max Points:</span>
                <span className="text-white font-medium">{selectedAssignment.max_points || 100}</span>
              </div>
              {selectedAssignment.description && (
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-gray-400 text-xs mb-1">Description:</p>
                  <p className="text-gray-300 text-sm">{selectedAssignment.description}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="submission-text" className="block text-sm font-medium text-gray-300 mb-2">
                Submission Text (Optional)
              </label>
              <textarea
                id="submission-text"
                rows={4}
                value={submissionData.submission_text}
                onChange={(e) => setSubmissionData({ ...submissionData, submission_text: e.target.value })}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 resize-none"
                placeholder="Add any comments or notes about your submission..."
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="submission-file" className="block text-sm font-medium text-gray-300 mb-2">
                Upload File (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="file"
                  onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files[0] })}
                  className="hidden"
                  id="submission-file"
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
                  disabled={submitting}
                />
                <label
                  htmlFor="submission-file"
                  className={`flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition cursor-pointer text-center text-gray-300 ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submissionData.file ? submissionData.file.name : 'Choose File'}
                </label>
                {submissionData.file && (
                  <button
                    type="button"
                    onClick={() => setSubmissionData({ ...submissionData, file: null })}
                    className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-gray-300"
                    disabled={submitting}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: PDF, DOC, DOCX, TXT, ZIP, JPG, PNG (Max 10MB)
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-400 text-sm">
                <strong>Note:</strong> Make sure to provide either a file or submission text before submitting.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    <span>Submit Assignment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

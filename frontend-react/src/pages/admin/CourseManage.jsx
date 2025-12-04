import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, FileText, Calendar, Users, 
  CheckCircle, XCircle, Clock, Upload, Download, Eye, Check, X
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import Swal from 'sweetalert2';
import { courseAPI } from '../../services/api';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
export default function CourseManage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [fileChoice, setFileChoice] = useState(null);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      
      if (response.success) {
        const courseData = response.course;
        setCourse(courseData);
        setModules(courseData.modules || []);
        
        // Format assignments - API returns submissions count, not array
        const formattedAssignments = (courseData.assignments || []).map(assignment => ({
          ...assignment,
          submissions: assignment.submissions || 0, // This is a count, not an array
          total_students: assignment.total_students || 0,
          graded_submissions: assignment.graded_submissions || 0
        }));
        setAssignments(formattedAssignments);
        
        const enrolled = courseData.enrolled_students || [];
        setStudents(enrolled);

        // If some enrolled students are missing `student_id`, try to fetch full student records
        try {
          const missingCount = enrolled.filter(s => !s.student_id).length;
          if (missingCount > 0 && courseData.id) {
            const studentsResp = await studentAPI.getByCourse(courseData.id);
            const fetched = studentsResp.students || studentsResp.data || [];
            if (Array.isArray(fetched) && fetched.length > 0) {
              const byId = fetched.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
              const merged = enrolled.map(s => ({
                ...s,
                student_id: s.student_id || byId[s.id]?.student_id || byId[s.id]?.studentId || byId[s.id]?.id || s.student_id
              }));
              setStudents(merged);
            }
          }
        } catch (e) {
          console.debug('Could not fetch student_id for enrolled students', e);
        }
        
        // Submissions will be managed separately when needed
        // For now, we create mock submissions data from assignments
        const allSubmissions = formattedAssignments.map((assignment, index) => ({
          id: `${assignment.id}-submission-${index}`,
          student: 'Student Name',
          student_id: `STU-${index + 1}`,
          assignment: assignment.title,
          assignment_id: assignment.id,
          submitted_at: new Date().toISOString(),
          status: 'pending',
          grade: null,
          feedback: ''
        }));
        setSubmissions(allSubmissions);
      } else {
        setToast({ message: 'Failed to load course details', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to load course details',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id, fetchCourseData]);

  const handleAddModule = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      order: modules.length + 1,
      status: 'draft'
    });
    setIsModalOpen('module');
  };

  const handleAddAssignment = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      max_points: 100,
      status: 'draft'
    });
    setIsModalOpen('assignment');
  };

  const handleGradeSubmission = (submission) => {
    setFormData({
      id: submission.id,
      student: submission.student,
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setIsModalOpen('grade');
  };

  const handleViewModule = (module) => {
    setToast({ 
      message: `Viewing module: ${module.title}`, 
      type: 'info' 
    });
  };

  const handleEditModule = (module) => {
    setFormData({
      id: module.id,
      title: module.title,
      description: module.description,
      content: module.content || '',
      order: module.order || 1,
      status: module.status || 'draft'
    });
    setIsModalOpen('module');
  };

  const handleDeleteModule = async (module) => {
    const res = await Swal.fire({
      title: 'Delete module',
      text: `Are you sure you want to delete the module "${module.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      setToast({ message: `Module "${module.title}" deleted successfully!`, type: 'success' });
      // Refresh course data
      await fetchCourseData();
      Swal.fire({ title: 'Deleted', text: 'Module deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (error) {
      setToast({ message: `Failed to delete module: ${error.message}`, type: 'error' });
    }
  };

  const handleViewAssignment = (assignment) => {
    setToast({ 
      message: `Viewing assignment: ${assignment.title}`, 
      type: 'info' 
    });
  };

  const handleEditAssignment = (assignment) => {
    setFormData({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      max_points: assignment.max_points,
      status: assignment.status || 'draft'
    });
    setIsModalOpen('assignment');
  };

  const handleDeleteAssignment = async (assignment) => {
    const res = await Swal.fire({
      title: 'Delete assignment',
      text: `Are you sure you want to delete the assignment "${assignment.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      setToast({ message: `Assignment "${assignment.title}" deleted successfully!`, type: 'success' });
      // Refresh course data
      await fetchCourseData();
      Swal.fire({ title: 'Deleted', text: 'Assignment deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (error) {
      setToast({ message: `Failed to delete assignment: ${error.message}`, type: 'error' });
    }
  };

  const handleDownloadSubmission = (submission) => {
    try {
      setToast({ 
        message: `Downloading submission from ${submission.student}...`, 
        type: 'info' 
      });
      // In a real app, this would call an API to download the file
      // For now, just show the notification
      setTimeout(() => {
        setToast({ 
          message: `Submission from ${submission.student} downloaded successfully!`, 
          type: 'success' 
        });
      }, 1000);
    } catch (error) {
      setToast({ 
        message: `Failed to download submission: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const handleRejectSubmission = async (submission) => {
    const res = await Swal.fire({
      title: 'Reject submission',
      text: `Are you sure you want to reject the submission from ${submission.student}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reject',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      setToast({ message: `Submission from ${submission.student} rejected!`, type: 'success' });
      // In a real app, this would call an API to update the submission status
      await fetchCourseData();
      Swal.fire({ title: 'Rejected', text: 'Submission rejected', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (error) {
      setToast({ message: `Failed to reject submission: ${error.message}`, type: 'error' });
    }
  };

  const handleDownloadAssignment = (assignment) => {
    if (assignment.files && assignment.files.length > 1) {
      setFileChoice(assignment);
    } else if (assignment.files && assignment.files.length === 1) {
      handleDownloadFileById(assignment.files[0].id);
    } else {
      setToast({ message: 'No files available for download', type: 'error' });
    }
  };

  const handleDownloadFileById = async (fileId) => {
    try {
      setToast({ message: 'Downloading file...', type: 'info' });
      await studentAPI.downloadAssignmentFile(fileId);
      setToast({ message: 'File downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error downloading file:', error);
      setToast({ message: 'Failed to download file', type: 'error' });
    }
  };

  const handleViewFileById = async (fileId) => {
    try {
      await studentAPI.downloadAssignmentFile(fileId);
      // For viewing, the download will handle opening the file
    } catch (error) {
      console.error('Error viewing file:', error);
      setToast({ message: 'Failed to view file', type: 'error' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast({ 
      message: `${isModalOpen === 'module' ? 'Module' : isModalOpen === 'assignment' ? 'Assignment' : 'Grade'} saved successfully!`, 
      type: 'success' 
    });
    setIsModalOpen(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-12 bg-white dark:bg-white rounded mb-4"></div>
          <div className="h-24 bg-white dark:bg-white rounded"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white dark:bg-white rounded-xl shadow-sm p-12 text-center">
        <p className="text-[#718096] dark:text-[#718096]">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/courses"
          className="p-2 hover:bg-white dark:hover:bg-white rounded-xl transition"
        >
          <ArrowLeft size={24} className="text-[#718096] dark:text-[#718096]" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-[#718096] dark:text-[#718096]">{course.code}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#1d2026]">
            {course.name}
          </h1>
          <p className="text-sm text-[#718096] dark:text-[#718096] mt-1">
            Instructor: {course.faculty?.name || 'Unknown'} • {course.students || 0} Students
          </p>
        </div>
      </div>

      {/* Course Info Card */}
      <div className="bg-white dark:bg-white rounded-xl shadow-sm p-6 border border-[#ff6b6b]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[#718096] dark:text-[#718096]">Semester</p>
            <p className="font-semibold text-gray-900 dark:text-[#1d2026]">{course.semester}</p>
          </div>
          <div>
            <p className="text-sm text-[#718096] dark:text-[#718096]">Academic Year</p>
            <p className="font-semibold text-gray-900 dark:text-[#1d2026]">{course.academic_year}</p>
          </div>
          <div>
            <p className="text-sm text-[#718096] dark:text-[#718096]">Credits</p>
            <p className="font-semibold text-gray-900 dark:text-[#1d2026]">{course.credits}</p>
          </div>
          <div>
            <p className="text-sm text-[#718096] dark:text-[#718096]">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              course.status === 'active' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-white text-[#4a5568] dark:bg-white dark:text-[#718096]'
            }`}>
              {course.status}
            </span>
          </div>
        </div>
        {course.description && (
          <div className="mt-4 p-4 bg-white dark:bg-white/50 rounded-xl">
            <p className="text-sm text-[#718096] dark:text-[#718096]">Description</p>
            <p className="text-gray-900 dark:text-white mt-2">{course.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-white rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#ff6b6b] text-[#ff5252] dark:text-[#FF4C60]'
                : 'border-transparent text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#2c3e50]'
            }`}
          >
            <Eye className="inline mr-2" size={18} />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'modules'
                ? 'border-[#ff6b6b] text-[#ff5252] dark:text-[#FF4C60]'
                : 'border-transparent text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#2c3e50]'
            }`}
          >
            <FileText className="inline mr-2" size={18} />
            Modules
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'assignments'
                ? 'border-[#ff6b6b] text-[#ff5252] dark:text-[#FF4C60]'
                : 'border-transparent text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#2c3e50]'
            }`}
          >
            <Calendar className="inline mr-2" size={18} />
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'submissions'
                ? 'border-[#ff6b6b] text-[#ff5252] dark:text-[#FF4C60]'
                : 'border-transparent text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#2c3e50]'
            }`}
          >
            <Upload className="inline mr-2" size={18} />
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'students'
                ? 'border-[#ff6b6b] text-[#ff5252] dark:text-[#FF4C60]'
                : 'border-transparent text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-[#2c3e50]'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Students ({students.length})
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-white rounded-xl shadow-sm p-6 border border-[#ff6b6b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#718096] dark:text-[#718096]">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{students.length}</p>
              </div>
              <Users className="w-12 h-12 text-[#FF4C60]" />
            </div>
          </div>
          <div className="bg-white dark:bg-white rounded-xl shadow-sm p-6 border-[#ff6b6b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#718096] dark:text-[#718096]">Modules</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{modules.length}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-white rounded-xl shadow-sm p-6 border-[#ff6b6b]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#718096] dark:text-[#718096]">Assignments</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{assignments.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-[#FF4C60]" />
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#1d2026]">Course Modules</h2>
            {user?.role === 'faculty' && (
              <button
                onClick={handleAddModule}
                className="flex items-center gap-2 px-4 py-2 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition"
              >
                <Plus size={20} />
                Add Module
              </button>
            )}
          </div>

          {modules.length === 0 ? (
            <div className="bg-white dark:bg-white rounded-xl shadow-sm p-8 text-center border-[#ff6b6b]">
              <FileText className="w-12 h-12 text-[#718096] mx-auto mb-3" />
              <p className="text-[#718096] dark:text-[#718096]">No modules available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white dark:bg-white border-[#ff6b6b] rounded-xl p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500 dark:text-[#718096]">Module {module.order || 1}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          module.status === 'published' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-white text-[#4a5568] dark:bg-white dark:text-[#718096]'
                        }`}>
                          {module.status || 'draft'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {module.title}
                      </h3>
                      <p className="text-sm text-[#718096] dark:text-[#718096]">
                        {module.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleViewModule(module)}
                        className="p-2 text-[#FF4C60] dark:text-[#ff9f66] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                        title="View module"
                      >
                        <Eye size={18} />
                      </button>
                      {user?.role === 'faculty' && (
                        <>
                          <button 
                            onClick={() => handleEditModule(module)}
                            className="p-2 text-[#ff5252] dark:text-[#FF4C60] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                            title="Edit module"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteModule(module)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                            title="Delete module"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-[#1d2026]">Course Assignments</h2>
            {user?.role === 'faculty' && (
              <button
                onClick={handleAddAssignment}
                className="flex items-center gap-2 px-4 py-2 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition"
              >
                <Plus size={20} />
                Add Assignment
              </button>
            )}
          </div>

          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white dark:bg-white border-[#ff6b6b] rounded-xl p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-[#718096] dark:text-[#718096] mb-3">
                      {assignment.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-[#718096] dark:text-[#718096]">
                        <Calendar size={16} />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-[#718096] dark:text-[#718096]">
                        <FileText size={16} />
                        {assignment.max_points} points
                      </div>
                      <div className="flex items-center gap-2 text-[#718096] dark:text-[#718096]">
                        <Users size={16} />
                        {assignment.submissions}/{assignment.total_students} submitted
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleViewAssignment(assignment)}
                      className="p-2 text-[#FF4C60] dark:text-[#ff9f66] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                      title="View assignment"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => handleDownloadAssignment(assignment)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition"
                      title="Download assignment files"
                    >
                      <Download size={18} />
                    </button>
                    {user?.role === 'faculty' && (
                      <>
                        <button 
                          onClick={() => handleEditAssignment(assignment)}
                          className="p-2 text-[#ff5252] dark:text-[#FF4C60] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                          title="Edit assignment"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAssignment(assignment)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                          title="Delete assignment"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white dark:bg-white rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(assignment.submissions / assignment.total_students) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-[#718096] dark:text-[#718096]">
                      {Math.round((assignment.submissions / assignment.total_students) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#1d2026]">Student Submissions</h2>

          <div className="bg-white dark:bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white dark:bg-white/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Student
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Assignment
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Submitted
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Grade
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white dark:hover:bg-white/50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                            {submission.student}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#718096]">
                            {submission.student_id || submission.student?.student_id || submission.student?.id || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-[#718096] dark:text-[#718096]">
                        {submission.assignment}
                      </td>
                      <td className="py-4 px-6 text-sm text-[#718096] dark:text-[#718096]">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {submission.status === 'graded' && <CheckCircle size={12} />}
                          {submission.status === 'pending' && <Clock size={12} />}
                          {submission.status === 'rejected' && <XCircle size={12} />}
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                        {submission.grade !== null ? `${submission.grade}/100` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDownloadSubmission(submission)}
                            className="p-2 text-[#FF4C60] dark:text-[#ff9f66] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleGradeSubmission(submission)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition"
                            title={submission.status === 'graded' ? "Edit grade" : "Grade submission"}
                          >
                            {submission.status === 'graded' ? <Edit size={16} /> : <Check size={16} />}
                          </button>
                          <button 
                            onClick={() => handleRejectSubmission(submission)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-[#1d2026]">Enrolled Students ({students.length})</h2>
          
          {students.length === 0 ? (
            <div className="bg-white dark:bg-white rounded-xl shadow-sm p-8 text-center border-[#ff6b6b]">
              <Users className="w-12 h-12 text-[#718096] mx-auto mb-3" />
              <p className="text-[#718096] dark:text-[#718096]">No students enrolled in this course</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white dark:bg-white/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                        Name
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                        Email
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                        ID Number
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-[#1d2026]">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-white dark:hover:bg-white/50">
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                            {student.name}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#718096] dark:text-[#718096]">
                          {student.email}
                        </td>
                        <td className="py-4 px-6 text-sm text-[#718096] dark:text-[#718096]">
                          {student.student_id || student.id || '-'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-white text-[#4a5568] dark:bg-white dark:text-[#718096]'
                          }`}>
                            {student.status || 'active'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                          {student.grade !== null && student.grade !== undefined ? `${student.grade}/100` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module Modal */}
      <Modal
        isOpen={isModalOpen === 'module'}
        onClose={() => setIsModalOpen(null)}
        title="Add Module"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Content
            </label>
            <textarea
              rows={6}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-white resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-white transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition">
              Save Module
            </button>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen === 'assignment'}
        onClose={() => setIsModalOpen(null)}
        title="Add Assignment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
                Max Points *
              </label>
              <input
                type="number"
                value={formData.max_points || 100}
                onChange={(e) => setFormData({...formData, max_points: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-white transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-[#ff5252] text-gray-900 rounded-xl hover:bg-[#ff4444] transition">
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={isModalOpen === 'grade'}
        onClose={() => setIsModalOpen(null)}
        title={formData.grade !== null && formData.grade !== '' ? `Edit Grade - ${formData.student}` : `Grade Submission - ${formData.student}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Grade (out of 100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.grade || ''}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-[#1d2026]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5568] dark:text-[#4a5568] mb-2">
              Feedback
            </label>
            <textarea
              rows={4}
              value={formData.feedback || ''}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent dark:bg-white dark:text-white resize-none"
              placeholder="Provide feedback to the student..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-white transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-gray-900 rounded-xl hover:bg-green-700 transition">
              {formData.grade !== null && formData.grade !== '' ? 'Update Grade' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* File Choice Modal */}
      <Modal
        isOpen={fileChoice !== null}
        onClose={() => setFileChoice(null)}
        title="Select File to Download"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#718096] dark:text-[#718096]">
            This assignment has multiple files. Please select which file you want to download:
          </p>
          <div className="space-y-2">
            {fileChoice?.files?.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-white/50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                    {file.original_name || file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-[#718096]">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewFileById(file.id)}
                    className="p-2 text-[#FF4C60] dark:text-[#ff9f66] hover:bg-[#FF4C60]/10 dark:hover:bg-[#FF4C60] 900/30 rounded-xl transition"
                    title="View file"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadFileById(file.id);
                      setFileChoice(null);
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition"
                    title="Download file"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setFileChoice(null)}
              className="px-4 py-2 border dark:border-gray-600 rounded-xl hover:bg-white dark:hover:bg-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

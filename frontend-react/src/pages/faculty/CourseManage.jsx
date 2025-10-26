import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, FileText, Calendar, Users, 
  CheckCircle, XCircle, Clock, Upload, Download, Eye, Check, X, Share2, Copy, BookOpen, BarChart
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { courseAPI } from '../../services/api';

export default function CourseManage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('modules');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [formData, setFormData] = useState({});
  const [linkCopied, setLinkCopied] = useState(false);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      if (response.success) {
        setCourse(response.course);
        setModules(response.modules || []);
        setAssignments(response.assignments || []);
        setSubmissions(response.submissions || []);
        setStudents(response.course.enrolled_students || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({ message: 'Failed to load course data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast({ 
      message: `${isModalOpen === 'module' ? 'Module' : isModalOpen === 'assignment' ? 'Assignment' : 'Grade'} saved successfully!`, 
      type: 'success' 
    });
    setIsModalOpen(null);
  };

  const handleShareCourse = async () => {
    const shareUrl = `${window.location.origin}/invite/${id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setToast({ 
        message: 'Course link copied to clipboard!', 
        type: 'success' 
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setToast({ 
        message: 'Failed to copy link. Please try again.', 
        type: 'error' 
      });
    }
  };

  const handleUpdateStudentStatus = (student) => {
    setFormData({
      studentId: student.id,
      studentName: student.name,
      currentStatus: student.status || 'enrolled',
    });
    setIsModalOpen('updateStudent');
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove ${studentName} from this course? They will be able to re-enroll if needed.`)) {
      return;
    }

    try {
      const response = await courseAPI.removeStudent(id, studentId);
      
      if (response.success) {
        // Remove student from local state
        setStudents(students.filter(s => s.id !== studentId));
        
        setToast({ 
          message: 'Student removed successfully!', 
          type: 'success' 
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      setToast({ 
        message: 'Failed to remove student. Please try again.', 
        type: 'error' 
      });
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    try {
      const response = await courseAPI.updateStudentStatus(id, formData.studentId, formData.currentStatus);
      
      if (response.success) {
        // Update student in local state
        setStudents(students.map(s => 
          s.id === formData.studentId 
            ? { ...s, status: formData.currentStatus }
            : s
        ));
        
        setToast({ 
          message: 'Student status updated successfully!', 
          type: 'success' 
        });
        setIsModalOpen(null);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setToast({ 
        message: 'Failed to update student status.', 
        type: 'error' 
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course data...</p>
        </div>
      </div>
    );
  }

  // Error state - course not found
  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The course you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <Link
              to="/admin/courses"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Courses
            </Link>
          </div>
        </div>
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
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-gray-400">{course.code}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {course.name}
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Instructor: {course.instructor} • {course.students} Students
          </p>
        </div>
        <button
          onClick={handleShareCourse}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg"
          title="Share course link"
        >
          {linkCopied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Link</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg border border-gray-800 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 ${
              activeTab === 'modules'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <FileText size={20} />
            <span>Modules</span>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 ${
              activeTab === 'assignments'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Calendar size={20} />
            <span>Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 ${
              activeTab === 'submissions'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Upload size={20} />
            <span>Submissions</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 ${
              activeTab === 'students'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Users size={20} />
            <span>Students</span>
          </button>
        </div>
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Course Modules</h2>
              <p className="text-gray-400 text-sm">Organize your course content into modules</p>
            </div>
            <button
              onClick={handleAddModule}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
            >
              <Plus size={20} />
              Add Module
            </button>
          </div>

          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No modules yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Start building your course by creating modules. Each module can contain lessons, videos, and resources.
                </p>
                <button
                  onClick={handleAddModule}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold"
                >
                  <Plus size={20} />
                  Create First Module
                </button>
              </div>
            ) : (
              modules.map((module) => (
                <div
                  key={module.id}
                  className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium">
                          Module {module.order}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          module.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                          {module.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition">
                        {module.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {module.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-transparent hover:border-blue-500/20 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                      <button className="p-2.5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-transparent hover:border-orange-500/20 rounded-lg transition-all">
                        <Edit size={18} />
                      </button>
                      <button className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Course Assignments</h2>
              <p className="text-gray-400 text-sm">Create and manage course assignments</p>
            </div>
            <button
              onClick={handleAddAssignment}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
            >
              <Plus size={20} />
              Add Assignment
            </button>
          </div>

          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No assignments yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first assignment to get started.
                </p>
                <button
                  onClick={handleAddAssignment}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-semibold"
                >
                  <Plus size={20} />
                  Create First Assignment
                </button>
              </div>
            ) : (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4">
                        {assignment.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar size={16} className="text-orange-400" />
                          <span className="font-medium">Due:</span> {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <FileText size={16} className="text-blue-400" />
                          <span className="font-medium">{assignment.max_points} points</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Users size={16} className="text-green-400" />
                          <span className="font-medium">{assignment.submissions}/{assignment.total_students} submitted</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-transparent hover:border-blue-500/20 rounded-lg transition-all">
                        <Eye size={18} />
                      </button>
                      <button className="p-2.5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-transparent hover:border-orange-500/20 rounded-lg transition-all">
                        <Edit size={18} />
                      </button>
                      <button className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all"
                          style={{ width: `${(assignment.submissions / assignment.total_students) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-300 min-w-[50px] text-right">
                        {Math.round((assignment.submissions / assignment.total_students) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Submission progress</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Student Submissions</h2>
            <p className="text-gray-400 text-sm">Review and grade student work</p>
          </div>

          <div className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Student
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Assignment
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Submitted
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Grade
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="h-10 w-10 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No submissions yet</h3>
                        <p className="text-gray-400">
                          Student submissions will appear here once they submit their assignments.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    submissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-800/50 transition">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {submission.student}
                            </p>
                            <p className="text-xs text-gray-400">
                              {submission.student_id}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {submission.assignment}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            submission.status === 'graded'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : submission.status === 'pending'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {submission.status === 'graded' && <CheckCircle size={14} />}
                            {submission.status === 'pending' && <Clock size={14} />}
                            {submission.status === 'rejected' && <XCircle size={14} />}
                            {submission.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-white">
                          {submission.grade !== null ? `${submission.grade}/100` : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => handleGradeSubmission(submission)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                              title="Grade"
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Enrolled Students</h2>
              <p className="text-gray-400 text-sm">
                Total: {students.length} {students.length === 1 ? 'student' : 'students'}
              </p>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No students enrolled</h3>
              <p className="text-gray-400">
                Students will appear here once they enroll in this course.
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg overflow-hidden border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Student
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Student ID
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Enrolled Date
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {student.student_id || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {student.email}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                          {student.enrolled_date ? new Date(student.enrolled_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'enrolled'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : student.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {student.status === 'enrolled' && <CheckCircle size={12} />}
                            {student.status || 'enrolled'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleUpdateStudentStatus(student)}
                              className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition"
                              title="Update Status"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title="Remove Student"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              rows={6}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Points *
              </label>
              <input
                type="number"
                value={formData.max_points || 100}
                onChange={(e) => setFormData({...formData, max_points: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={isModalOpen === 'grade'}
        onClose={() => setIsModalOpen(null)}
        title={`Grade Submission - ${formData.student}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade (out of 100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.grade || ''}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback
            </label>
            <textarea
              rows={4}
              value={formData.feedback || ''}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Provide feedback to the student..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Submit Grade
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Student Status Modal */}
      <Modal
        isOpen={isModalOpen === 'updateStudent'}
        onClose={() => setIsModalOpen(null)}
        title={`Update Status - ${formData.studentName}`}
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enrollment Status *
            </label>
            <select
              value={formData.currentStatus || 'enrolled'}
              onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="enrolled">Enrolled</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Changing the status will affect the student's access to this course.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Update Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

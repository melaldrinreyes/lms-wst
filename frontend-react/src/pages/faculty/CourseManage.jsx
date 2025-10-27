import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, FileText, Calendar, Users, 
  CheckCircle, XCircle, Clock, Upload, Download, Eye, Check, X, Share2, Copy, BookOpen, BarChart
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { courseAPI, assignmentAPI, moduleAPI } from '../../services/api';

export default function CourseManage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('modules');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [showFileWarning, setShowFileWarning] = useState(false);
  const [formData, setFormData] = useState({});
  const [linkCopied, setLinkCopied] = useState(false);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionFilter, setSubmissionFilter] = useState('all');
  const [submissionSort, setSubmissionSort] = useState('date-desc');

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      
      console.log('=== COURSE DATA DEBUG ===');
      console.log('Course ID:', id);
      console.log('Full API Response:', response);
      console.log('Course object:', response.course);
      console.log('Assignments count:', response.course?.assignments?.length);
      
      if (response.success) {
        setCourse(response.course);
        setModules(response.course.modules || []);
        setAssignments(response.course.assignments || []);
        
        // Flatten all submissions from all assignments
        const allSubmissions = [];
        if (response.course.assignments) {
          console.log('Processing assignments:', response.course.assignments.length);
          response.course.assignments.forEach((assignment, index) => {
            console.log(`Assignment ${index + 1}:`, {
              title: assignment.title,
              id: assignment.id,
              status: assignment.status,
              submission_list: assignment.submission_list,
              submission_count: assignment.submission_list?.length || 0
            });
            
            if (assignment.submission_list && assignment.submission_list.length > 0) {
              assignment.submission_list.forEach(submission => {
                console.log('Adding submission:', submission);
                allSubmissions.push({
                  ...submission,
                  assignment_title: assignment.title,
                });
              });
            }
          });
        }
        console.log('Total submissions after flattening:', allSubmissions.length);
        console.log('All submissions:', allSubmissions);
        console.log('=== END DEBUG ===');
        
        setSubmissions(allSubmissions);
        
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
      student: submission.student_name,
      assignment: submission.assignment_title,
      grade: submission.grade || '',
      feedback: submission.feedback || '',
      submission_text: submission.submission_text,
      file_path: submission.file_path
    });
    setIsModalOpen('grade');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isModalOpen === 'assignment') {
        // Validate file size if attachment exists
        if (formData.attachment) {
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (formData.attachment.size > maxSize) {
            setToast({ message: 'File size must be less than 10MB', type: 'error' });
            return;
          }

          // Validate file type
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
          ];
          if (!allowedTypes.includes(formData.attachment.type)) {
            setToast({ message: 'Invalid file type. Only PDF, DOC, DOCX, TXT, and ZIP are allowed', type: 'error' });
            return;
          }
        }

        // Build payload - use FormData if attachment exists
        let payload;
        if (formData.attachment) {
          payload = new FormData();
          payload.append('title', formData.title);
          payload.append('description', formData.description || '');
          payload.append('due_date', formData.due_date);
          payload.append('max_points', formData.max_points);
          payload.append('course_id', id);
          payload.append('status', formData.status || 'draft');
          payload.append('attachment', formData.attachment);
        } else {
          payload = {
            title: formData.title,
            description: formData.description || '',
            due_date: formData.due_date,
            max_points: formData.max_points,
            course_id: id,
            status: formData.status || 'draft',
          };
        }

        const response = await assignmentAPI.create(payload);
        if (response && response.success) {
          // Prepend or append the new assignment to the list so it's visible immediately
          const created = response.assignment || response.data || response;
          setAssignments((prev) => [created, ...prev]);
          setToast({ message: 'Assignment created successfully!', type: 'success' });
        } else {
          setToast({ message: response.message || 'Failed to create assignment', type: 'error' });
        }
      } else if (isModalOpen === 'module') {
        // Validate that file is required
        if (!formData.file) {
          setShowFileWarning(true);
          return;
        }

        // Validate file size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (formData.file.size > maxSize) {
          setToast({ message: 'File size must be less than 10MB', type: 'error' });
          return;
        }

        // Build payload with FormData (file is required)
        const payload = new FormData();
        payload.append('title', formData.title);
        payload.append('description', formData.description || '');
        payload.append('content', formData.content || '');
        payload.append('order', formData.order || modules.length + 1);
        payload.append('status', formData.status || 'draft');
        payload.append('course_id', id);
        payload.append('file', formData.file);

        // Debug: Log what we're sending
        console.log('Sending module data:', {
          title: formData.title,
          description: formData.description,
          content: formData.content,
          order: formData.order || modules.length + 1,
          status: formData.status || 'draft',
          course_id: id,
          file: formData.file,
        });

        const response = await moduleAPI.create(payload);
        if (response && response.success) {
          // Add the new module to the list so it's visible immediately
          const created = response.module || response.data || response;
          setModules((prev) => [...prev, created].sort((a, b) => (a.module_order || a.order) - (b.module_order || b.order)));
          setToast({ message: 'Module created successfully!', type: 'success' });
        } else {
          console.error('Module creation failed:', response);
          setToast({ message: response.message || 'Failed to create module', type: 'error' });
        }
      } else if (isModalOpen === 'grade') {
        // Grade assignment submission
        const response = await submissionAPI.grade(formData.id, {
          grade: parseFloat(formData.grade),
          feedback: formData.feedback
        });
        
        if (response && response.success) {
          setToast({ message: 'Assignment graded successfully!', type: 'success' });
          // Refresh the course data to update submissions list
          fetchCourseData();
        } else {
          setToast({ message: response.message || 'Failed to grade assignment', type: 'error' });
        }
      }

      setIsModalOpen(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Validation errors:', error?.response?.data?.errors);
      
      // Display validation errors if available
      if (error?.response?.data?.errors) {
        const validationErrors = Object.entries(error.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        console.error('Formatted validation errors:', validationErrors);
        setToast({ message: validationErrors, type: 'error' });
      } else {
        setToast({ message: error?.response?.data?.message || 'An error occurred', type: 'error' });
      }
    }
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

  // Filter and sort submissions
  const getFilteredAndSortedSubmissions = () => {
    let filtered = [...submissions];

    // Apply filter
    if (submissionFilter === 'submitted') {
      filtered = filtered.filter(s => s.status === 'submitted');
    } else if (submissionFilter === 'graded') {
      filtered = filtered.filter(s => s.status === 'graded');
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (submissionSort) {
        case 'student-asc':
          return a.student_name.localeCompare(b.student_name);
        case 'student-desc':
          return b.student_name.localeCompare(a.student_name);
        case 'date-asc':
          return new Date(a.submitted_at) - new Date(b.submitted_at);
        case 'date-desc':
          return new Date(b.submitted_at) - new Date(a.submitted_at);
        case 'grade-asc':
          return (a.grade || 0) - (b.grade || 0);
        case 'grade-desc':
          return (b.grade || 0) - (a.grade || 0);
        default:
          return 0;
      }
    });

    return filtered;
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
            <span>Assignment Submissions</span>
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
                  className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-orange-500/50 transition-all group shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-300 rounded-lg text-sm font-bold border border-orange-500/30">
                          Module {module.module_order || module.order}
                        </span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          module.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {module.status === 'published' ? '✓ Published' : '◐ Draft'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                        {module.module_title || module.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                        {module.description || 'No description provided'}
                      </p>
                      
                      {/* Module Stats */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {module.submissions_count !== undefined && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Upload size={16} className="text-blue-400" />
                            <span className="font-medium">{module.submissions_count || 0}/{module.total_students || 0} submitted</span>
                          </div>
                        )}
                        {module.file_path && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <FileText size={16} className="text-purple-400" />
                            <span className="font-medium">Has attachment</span>
                          </div>
                        )}
                        {module.created_at && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={16} className="text-gray-500" />
                            <span className="text-xs">Created {new Date(module.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        className="p-2.5 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 border border-transparent hover:border-blue-500/20 rounded-lg transition-all"
                        title="View Module"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        className="p-2.5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-transparent hover:border-orange-500/20 rounded-lg transition-all"
                        title="Edit Module"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                        title="Delete Module"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Module Content Preview */}
                  {module.content && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Content Preview</p>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {module.content.length > 150 ? `${module.content.substring(0, 150)}...` : module.content}
                      </p>
                    </div>
                  )}
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
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full transition-all"
                          style={{ width: `${assignment.total_students > 0 ? (assignment.submissions / assignment.total_students) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-300 min-w-[50px] text-right">
                        {assignment.total_students > 0 ? Math.round((assignment.submissions / assignment.total_students) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Submission progress</p>
                      {assignment.submission_list && assignment.submission_list.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('submissions');
                            setTimeout(() => {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                          className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View Submissions ({assignment.submission_list.length})
                        </button>
                      )}
                    </div>
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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Student Submissions</h2>
              <p className="text-gray-400 text-sm">Review and grade student work</p>
            </div>
            <div className="flex gap-3">
              {/* Filter dropdown */}
              <div className="relative">
                <select
                  value={submissionFilter}
                  onChange={(e) => setSubmissionFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none pr-10 cursor-pointer"
                >
                  <option value="all">All Submissions</option>
                  <option value="submitted">Pending Review</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={submissionSort}
                  onChange={(e) => setSubmissionSort(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none pr-10 cursor-pointer"
                >
                  <option value="date-desc">Latest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="student-asc">Student A-Z</option>
                  <option value="student-desc">Student Z-A</option>
                  <option value="grade-desc">Highest Grade</option>
                  <option value="grade-asc">Lowest Grade</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Submissions</p>
                  <p className="text-2xl font-bold text-white mt-1">{submissions.length}</p>
                </div>
                <Upload className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {submissions.filter(s => s.status === 'submitted').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Graded</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {submissions.filter(s => s.status === 'graded').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>
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
                  {getFilteredAndSortedSubmissions().length === 0 ? (
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
                    getFilteredAndSortedSubmissions().map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-800/50 transition">
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {submission.student_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {submission.student_email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {submission.assignment_title}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            submission.status === 'graded'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {submission.status === 'graded' ? <CheckCircle size={14} /> : <Clock size={14} />}
                            {submission.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-white">
                          {submission.grade !== null ? `${submission.grade}/100` : '-'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {submission.file_path && (
                              <a
                                href={`http://127.0.0.1:8000/storage/${submission.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                title="Download"
                              >
                                <Download size={16} />
                              </a>
                            )}
                            <button 
                              onClick={() => handleGradeSubmission(submission)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                              title="Grade"
                            >
                              <Check size={16} />
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
        title="Add New Module"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Module Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
              placeholder="e.g., Introduction to Programming"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 resize-none"
              placeholder="Brief description of what this module covers..."
            />
          </div>

          {/* Module Order and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Module Order *
              </label>
              <input
                type="number"
                min="1"
                value={formData.order || modules.length + 1}
                onChange={(e) => setFormData({...formData, order: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status || 'draft'}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Content
            </label>
            <textarea
              rows={8}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 resize-none font-mono text-sm"
              placeholder="Enter the main content, lessons, or learning materials for this module..."
            />
            <p className="text-xs text-gray-500 mt-1">
              You can include text, links, code snippets, or instructions here.
            </p>
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attachment *
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                className="hidden"
                id="module-file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
              />
              <label
                htmlFor="module-file"
                className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg hover:bg-gray-700 transition cursor-pointer text-center text-gray-300 flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                {formData.file ? formData.file.name : 'Choose File'}
              </label>
              {formData.file && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, file: null})}
                  className="px-4 py-2.5 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-gray-300"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Required:</strong> PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP (Max 10MB)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-400">
                  <strong>Important:</strong> All modules require a file attachment. Keep modules organized by setting appropriate order numbers. Draft modules won't be visible to students until published.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-4 py-2.5 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-white font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-medium shadow-lg shadow-orange-500/30"
            >
              Create Module
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
              placeholder="Enter assignment title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 resize-none"
              placeholder="Enter assignment description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Points *
              </label>
              <input
                type="number"
                value={formData.max_points || 100}
                onChange={(e) => setFormData({...formData, max_points: e.target.value})}
                className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
                placeholder="100"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Attachment (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                onChange={(e) => setFormData({...formData, attachment: e.target.files[0]})}
                className="hidden"
                id="assignment-file"
                accept=".pdf,.doc,.docx,.txt,.zip"
              />
              <label
                htmlFor="assignment-file"
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition cursor-pointer text-center text-gray-300"
              >
                {formData.attachment ? formData.attachment.name : 'Choose File'}
              </label>
              {formData.attachment && (
                <button
                  type="button"
                  onClick={() => setFormData({...formData, attachment: null})}
                  className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-gray-300"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Supported formats: PDF, DOC, DOCX, TXT, ZIP (Max 10MB)</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-white">
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
          {/* Submission Details */}
          {(formData.submission_text || formData.file_path) && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">Submission Details</h4>
              {formData.assignment && (
                <div>
                  <p className="text-xs text-gray-500">Assignment:</p>
                  <p className="text-sm text-white">{formData.assignment}</p>
                </div>
              )}
              {formData.submission_text && (
                <div>
                  <p className="text-xs text-gray-500">Student's Note:</p>
                  <p className="text-sm text-gray-300">{formData.submission_text}</p>
                </div>
              )}
              {formData.file_path && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Submitted File:</p>
                  <a
                    href={`http://127.0.0.1:8000/storage/${formData.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition text-sm"
                  >
                    <Download size={14} />
                    Download Submission
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grade (out of 100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.grade || ''}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Feedback
            </label>
            <textarea
              rows={4}
              value={formData.feedback || ''}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white resize-none"
              placeholder="Provide feedback to the student..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition text-white">
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

      {/* File Attachment Warning Modal */}
      <Modal
        isOpen={showFileWarning}
        onClose={() => setShowFileWarning(false)}
        title="⚠️ File Attachment Required"
      >
        <div className="space-y-4">
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white mb-2">
                  No File Attached
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Modules require a file attachment so students can download learning materials. 
                  Please attach a PDF, DOC, DOCX, PPT, PPTX, TXT, or ZIP file before creating the module.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-2">
              <strong>Supported formats:</strong>
            </p>
            <ul className="text-xs text-gray-300 space-y-1 ml-4">
              <li>• PDF documents (.pdf)</li>
              <li>• Word documents (.doc, .docx)</li>
              <li>• PowerPoint presentations (.ppt, .pptx)</li>
              <li>• Text files (.txt)</li>
              <li>• Compressed archives (.zip)</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">
              <strong>Maximum file size:</strong> 10MB
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowFileWarning(false)}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

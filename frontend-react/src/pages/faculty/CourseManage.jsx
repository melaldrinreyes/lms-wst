import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, FileText, Calendar, Users, 
  CheckCircle, XCircle, Clock, Upload, Download, Eye, Check, X, Share2, Copy, BookOpen, BarChart, Megaphone, MessageCircle, Send, Reply, FileEdit
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import HierarchicalLectureContent from '../../components/HierarchicalLectureContent';
import { courseAPI, moduleAPI, assignmentAPI, submissionAPI, announcementAPI, announcementCommentAPI } from '../../services/api';
import { getFileTypeInfo, getFileName } from '../../utils/fileUtils';



export default function CourseManage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [formData, setFormData] = useState({});
  const [linkCopied, setLinkCopied] = useState(false);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementComments, setAnnouncementComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [newSubmissionsCount, setNewSubmissionsCount] = useState(0);

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
        setStudents(courseData.enrolled_students || []);
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

  const fetchAssignments = useCallback(async () => {
    try {
      // This function can be used to fetch assignments separately if needed
      // For now, assignments are fetched in fetchCourseData
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

  const fetchAllSubmissions = useCallback(async () => {
    try {
      // This function can be used to fetch all submissions separately if needed
      // For now, submissions are created from assignments in fetchCourseData
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await announcementAPI.getByCourse(id);
      if (response.success) {
        setAnnouncements(response.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }, [id]);

  const fetchAnnouncementComments = async (announcementId) => {
    try {
      const response = await announcementCommentAPI.getByAnnouncement(announcementId);
      if (response.success) {
        setAnnouncementComments(response.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
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

  const handleAddAnnouncement = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      status: 'published'
    });
    setIsModalOpen('announcement');
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    fetchAnnouncementComments(announcement.id);
  };

  const handleCloseAnnouncementDetail = () => {
    setSelectedAnnouncement(null);
    setAnnouncementComments([]);
  };

  const handleEditAnnouncement = (announcement) => {
    setFormData({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || 'normal',
      status: announcement.status || 'published'
    });
    setIsModalOpen('announcement');
  };

  const handleDeleteAnnouncement = async (announcementId, announcementTitle) => {
    if (!window.confirm(`Are you sure you want to delete the announcement "${announcementTitle}"?`)) return;

    try {
      await announcementAPI.delete(announcementId);
      setToast({ message: 'Announcement deleted successfully!', type: 'success' });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setToast({ message: 'Failed to delete announcement', type: 'error' });
    }
  };

  const handleDownloadModule = async (module) => {
    try {
      if (!module.file_path) {
        setToast({ message: 'No file attached to this module', type: 'error' });
        return;
      }

      const response = await moduleAPI.download(module.id);
      if (response.success) {
        setToast({ message: 'Module file downloaded successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to download module file', type: 'error' });
      }
    } catch (error) {
      console.error('Error downloading module:', error);
      setToast({ message: 'Failed to download module file', type: 'error' });
    }
  };

  const handleEditModule = (module) => {
    setFormData({
      id: module.id,
      title: module.title,
      description: module.description,
      content: module.content || '',
      order: module.order || 1,
      status: module.status || 'draft',
      existingFile: module.file_path
    });
    setIsModalOpen('module');
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!window.confirm(`Are you sure you want to delete the module "${moduleTitle}"?`)) return;

    try {
      await moduleAPI.delete(moduleId);
      setToast({ message: 'Module deleted successfully!', type: 'success' });
      await fetchCourseData();
    } catch (error) {
      console.error('Error deleting module:', error);
      setToast({ message: 'Failed to delete module', type: 'error' });
    }
  };

  const handleEditAssignment = (assignment) => {
    setFormData({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      due_date: assignment.due_date,
      max_points: assignment.max_points,
      status: assignment.status || 'draft',
      existingFile: assignment.file_path
    });
    setIsModalOpen('assignment');
  };

  const handleDeleteAssignment = async (assignmentId, assignmentTitle) => {
    if (!window.confirm(`Are you sure you want to delete the assignment "${assignmentTitle}"?`)) return;

    try {
      await assignmentAPI.delete(assignmentId);
      setToast({ message: 'Assignment deleted successfully!', type: 'success' });
      await fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setToast({ message: 'Failed to delete assignment', type: 'error' });
    }
  };

  const handleDownloadSubmission = async (submissionId, studentName) => {
    try {
      const response = await submissionAPI.download(submissionId);
      if (response.success) {
        setToast({ message: `Submission from ${studentName} downloaded successfully!`, type: 'success' });
      } else {
        setToast({ message: 'Failed to download submission', type: 'error' });
      }
    } catch (error) {
      console.error('Error downloading submission:', error);
      setToast({ message: 'Failed to download submission', type: 'error' });
    }
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

  const handleRejectSubmission = async (submissionId, studentName) => {
    if (!window.confirm(`Are you sure you want to reject the submission from ${studentName}?`)) return;

    try {
      await submissionAPI.reject(submissionId);
      setToast({ message: `Submission from ${studentName} rejected!`, type: 'success' });
      await fetchAllSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
      setToast({ message: 'Failed to reject submission', type: 'error' });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, files });
  };

  const handleRemoveFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await announcementCommentAPI.create({
        announcement_id: selectedAnnouncement.id,
        comment: newComment.trim()
      });

      if (response.success) {
        setToast({ message: 'Comment added successfully!', type: 'success' });
        setNewComment('');
        await fetchAnnouncementComments(selectedAnnouncement.id);
        // Update comments count
        setAnnouncements(announcements.map(a => 
          a.id === selectedAnnouncement.id 
            ? { ...a, comments_count: (a.comments_count || 0) + 1 }
            : a
        ));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setToast({ message: 'Failed to add comment', type: 'error' });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await announcementCommentAPI.delete(commentId);
      setToast({ message: 'Comment deleted successfully!', type: 'success' });
      await fetchAnnouncementComments(selectedAnnouncement.id);
      // Update comments count
      setAnnouncements(announcements.map(a => 
        a.id === selectedAnnouncement.id 
          ? { ...a, comments_count: Math.max(0, (a.comments_count || 0) - 1) }
          : a
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setToast({ message: 'Failed to delete comment', type: 'error' });
    }
  };

  const handleReplyComment = (comment) => {
    setReplyingTo(comment);
    setReplyText('');
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const response = await announcementCommentAPI.create({
        announcement_id: selectedAnnouncement.id,
        parent_id: replyingTo.id,
        comment: replyText.trim()
      });

      if (response.success) {
        setToast({ message: 'Reply added successfully!', type: 'success' });
        setReplyText('');
        setReplyingTo(null);
        await fetchAnnouncementComments(selectedAnnouncement.id);
        // Update comments count
        setAnnouncements(announcements.map(a => 
          a.id === selectedAnnouncement.id 
            ? { ...a, comments_count: (a.comments_count || 0) + 1 }
            : a
        ));
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      setToast({ message: 'Failed to add reply', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isModalOpen === 'module') {
        // Validate required fields
        if (!formData.title || formData.title.trim() === '') {
          setToast({ message: 'Module title is required', type: 'error' });
          return;
        }

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append('title', formData.title.trim());
        submitData.append('description', formData.description || '');
        submitData.append('content', formData.content || '');
        
        // Only add course_id for new modules
        if (!formData.id) {
          submitData.append('course_id', id);
        }
        
        submitData.append('order', formData.order || modules.length + 1);
        submitData.append('status', formData.status || 'draft');
        
        // Append file (single file, not array)
        if (formData.files && formData.files.length > 0) {
          const file = formData.files[0]; // Get first file
          console.log('Appending file:', file.name, file.size, file.type);
          submitData.append('file', file); // Send as 'file' not 'files[0]'
        } else {
          console.log('No files to upload');
        }

        // Debug: Log FormData contents
        console.log('FormData contents:');
        for (let [key, value] of submitData.entries()) {
          console.log(key, value);
        }

        if (formData.id) {
          // Update existing module
          await moduleAPI.update(formData.id, submitData);
          setToast({ message: 'Module updated successfully!', type: 'success' });
        } else {
          // Create new module
          await moduleAPI.create(submitData);
          setToast({ message: 'Module created successfully!', type: 'success' });
        }
        
        // Refresh modules list
        await fetchCourseData();
        
      } else if (isModalOpen === 'assignment') {
        // Validate required fields
        if (!formData.title || formData.title.trim() === '') {
          setToast({ message: 'Assignment title is required', type: 'error' });
          return;
        }

        if (!formData.due_date) {
          setToast({ message: 'Due date is required', type: 'error' });
          return;
        }

        // Create FormData for file upload
        const submitData = new FormData();
        submitData.append('title', formData.title.trim());
        submitData.append('description', formData.description || '');
        submitData.append('due_date', formData.due_date);
        submitData.append('max_points', parseInt(formData.max_points) || 100);
        submitData.append('status', formData.status || 'published');
        
        // Only add course_id for new assignments
        if (!formData.id) {
          submitData.append('course_id', id);
        }
        
        // Append file if any
        if (formData.files && formData.files.length > 0) {
          const file = formData.files[0];
          console.log('Appending file:', file.name, file.size, file.type);
          
          // Check file size (500MB = 524288000 bytes)
          if (file.size > 524288000) {
            setToast({ message: 'File size exceeds 500MB limit. Please choose a smaller file.', type: 'error' });
            return;
          }
          
          submitData.append('file', file);
        } else {
          console.log('No files to upload for assignment');
        }

        // Debug: Log FormData contents
        console.log('Assignment FormData contents:');
        for (let [key, value] of submitData.entries()) {
          console.log(key, value);
        }

        if (formData.id) {
          // Update existing assignment
          await assignmentAPI.update(formData.id, submitData);
          setToast({ message: 'Assignment updated successfully!', type: 'success' });
        } else {
          // Create new assignment
          await assignmentAPI.create(submitData);
          setToast({ message: 'Assignment created successfully!', type: 'success' });
        }
        
        // Refresh assignments list
        await fetchAssignments();
        
      } else if (isModalOpen === 'announcement') {
        // Validate required fields
        if (!formData.title || formData.title.trim() === '') {
          setToast({ message: 'Announcement title is required', type: 'error' });
          return;
        }

        if (!formData.content || formData.content.trim() === '') {
          setToast({ message: 'Announcement content is required', type: 'error' });
          return;
        }

        const submitData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          priority: formData.priority || 'normal',
          status: formData.status || 'published'
        };

        // Only add course_id for new announcements
        if (!formData.id) {
          submitData.course_id = id;
        }

        if (formData.id) {
          // Update existing announcement
          await announcementAPI.update(formData.id, submitData);
          setToast({ message: 'Announcement updated successfully!', type: 'success' });
        } else {
          // Create new announcement
          await announcementAPI.create(submitData);
          setToast({ message: 'Announcement created successfully!', type: 'success' });
        }
        
        // Refresh announcements list
        await fetchAnnouncements();
        
      } else if (isModalOpen === 'grade') {
        // Handle grading submission
        try {
          await submissionAPI.grade(formData.id, {
            grade: parseInt(formData.grade),
            feedback: formData.feedback || ''
          });
          
          setToast({ 
            message: 'Grade submitted successfully!', 
            type: 'success' 
          });
          
          // Refresh submissions to show updated grade
          await fetchAllSubmissions();
        } catch (error) {
          console.error('Grading error:', error);
          throw error; // Let the outer catch handle it
        }
      }
      
      setIsModalOpen(null);
      setFormData({});
      
    } catch (error) {
      console.error('Error saving:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save. Please try again.';
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to grade this submission.';
        } else if (error.response.status === 404) {
          errorMessage = 'Submission not found. It may have been deleted or you do not have access.';
        } else if (error.response.data) {
          const data = error.response.data;
          // Handle validation errors
          if (data.errors) {
            const firstError = Object.values(data.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            // Add helpful hints for common errors
            if (errorMessage.includes('file')) {
              errorMessage += '\n\n💡 Tip: Make sure Apache is restarted after changing PHP limits.';
              errorMessage += '\nVisit: http://localhost/lms-app/backend-laravel/public/check-upload-limits.php';
            }
          } else if (data.message) {
            errorMessage = data.message;
          }
          // Add file size hint for upload errors
          if (errorMessage.includes('file') || errorMessage.includes('upload')) {
            errorMessage += '\n\nCurrent limit: 500MB. Check FIX_UPLOAD_ERROR.md for help.';
          }
        }
      }
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
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

  // Recursive function to render comments and their replies
  const renderComment = (comment, depth = 0) => {
    const marginLeft = depth > 0 ? 'ml-8' : '';
    const avatarSize = depth === 0 ? 'w-8 h-8' : 'w-6 h-6';
    const avatarColor = depth === 0 
      ? 'from-blue-400 to-blue-600' 
      : 'from-green-400 to-green-600';
    const textSize = depth === 0 ? 'text-sm' : 'text-xs';
    
    return (
      <div key={comment.id} className={`${marginLeft} space-y-2`}>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <div className={`${avatarSize} bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-semibold text-xs">
                  {comment.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium text-gray-200 ${depth > 0 ? 'text-sm' : ''}`}>
                    {comment.user?.name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={`${textSize} text-gray-300 leading-relaxed`}>
                  {comment.comment}
                </p>
                <button
                  onClick={() => handleReplyComment(comment)}
                  className="mt-1.5 text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
                >
                  <Reply size={10} />
                  Reply
                </button>
              </div>
            </div>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
              title="Delete comment"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Reply Form */}
          {replyingTo?.id === comment.id && (
            <form onSubmit={handleSubmitReply} className="mt-2 ml-8 space-y-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${comment.user?.name}...`}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Send size={12} />
                  Reply
                </button>
                <button
                  type="button"
                  onClick={handleCancelReply}
                  className="px-3 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recursively render all nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      fetchCourseData();
      fetchAssignments();
      fetchAllSubmissions();
      fetchAnnouncements();
    }
  }, [id, fetchCourseData, fetchAssignments, fetchAllSubmissions, fetchAnnouncements]);

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
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 relative ${
              activeTab === 'submissions'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Upload size={20} />
            <span>Submissions</span>
            {newSubmissionsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
                {newSubmissionsCount}
              </span>
            )}
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
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <Megaphone size={20} />
            <span>Announcements</span>
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-semibold transition-all border-b-3 flex items-center justify-center gap-2 relative ${
              activeTab === 'content'
                ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <FileEdit size={20} />
            <span>Content</span>
            <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              ✓ NEW
            </span>
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
                      <p className="text-sm text-gray-400 mb-3">
                        {module.description}
                      </p>
                      {module.file_path && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${getFileTypeInfo(module.file_path).bgColor} ${getFileTypeInfo(module.file_path).borderColor}`}>
                            <span className="text-lg">{getFileTypeInfo(module.file_path).icon}</span>
                            <div className="flex flex-col">
                              <span className={`text-xs font-semibold ${getFileTypeInfo(module.file_path).color}`}>
                                {getFileTypeInfo(module.file_path).category}
                              </span>
                              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                {getFileName(module.file_path)}
                              </span>
                            </div>
                          </div>
                          <button
                            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold shadow"
                            onClick={() => handleDownloadModule(module)}
                            title="Download module file"
                          >
                            <Download size={16} /> Download
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleEditModule(module)}
                        className="p-2.5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-transparent hover:border-orange-500/20 rounded-lg transition-all"
                        title="Edit module"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteModule(module.id, module.title)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                        title="Delete module"
                      >
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
                      {assignment.file_path && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${getFileTypeInfo(assignment.file_path).bgColor} ${getFileTypeInfo(assignment.file_path).borderColor}`}>
                            <span className="text-lg">{getFileTypeInfo(assignment.file_path).icon}</span>
                            <div className="flex flex-col">
                              <span className={`text-xs font-semibold ${getFileTypeInfo(assignment.file_path).color}`}>
                                {getFileTypeInfo(assignment.file_path).category}
                              </span>
                              <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                {getFileName(assignment.file_path)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
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
                      <button 
                        onClick={() => handleEditAssignment(assignment)}
                        className="p-2.5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 border border-transparent hover:border-orange-500/20 rounded-lg transition-all"
                        title="Edit assignment"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                        className="p-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
                        title="Delete assignment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {/* Progress bar and percentage removed as requested */}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* New Submissions Notification Banner */}
          {newSubmissionsCount > 0 && (
            <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-l-4 border-green-500 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full p-2">
                  <Upload className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {newSubmissionsCount} New Submission{newSubmissionsCount > 1 ? 's' : ''}!
                  </h3>
                  <p className="text-green-300 text-sm">
                    Student{newSubmissionsCount > 1 ? 's have' : ' has'} submitted {newSubmissionsCount > 1 ? 'assignments' : 'an assignment'} while you were away
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewSubmissionsCount(0)}
                className="text-green-400 hover:text-green-300 transition"
              >
                <X size={20} />
              </button>
            </div>
          )}

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
                              onClick={() => handleDownloadSubmission(submission.id, submission.student)}
                              disabled={!submission.file_path}
                              className={`p-2 rounded-lg transition ${
                                submission.file_path
                                  ? 'text-blue-400 hover:bg-blue-900/30'
                                  : 'text-gray-600 cursor-not-allowed opacity-50'
                              }`}
                              title={submission.file_path ? "Download submission file" : "No file attached"}
                            >
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => handleGradeSubmission(submission)}
                              className="p-2 text-green-400 hover:bg-green-900/30 rounded-lg transition"
                              title={submission.status === 'graded' ? "Edit grade" : "Grade submission"}
                            >
                              {submission.status === 'graded' ? <Edit size={16} /> : <Check size={16} />}
                            </button>
                            <button 
                              onClick={() => handleRejectSubmission(submission.id, submission.student)}
                              disabled={submission.status === 'rejected'}
                              className={`p-2 rounded-lg transition ${
                                submission.status === 'rejected'
                                  ? 'text-gray-600 cursor-not-allowed opacity-50'
                                  : 'text-red-400 hover:bg-red-900/30'
                              }`}
                              title={submission.status === 'rejected' ? "Already rejected" : "Reject submission"}
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
                  <thead className="bg-gray-800/50 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Student
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Student ID
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Email
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Enrolled Date
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-800/50 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {student.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {student.student_id || 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-300">
                          {student.email}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {student.enrolled_date ? new Date(student.enrolled_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === 'enrolled'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : student.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-gray-700 text-gray-300 border border-gray-600'
                          }`}>
                            {student.status === 'enrolled' && <CheckCircle size={12} />}
                            {student.status || 'enrolled'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleUpdateStudentStatus(student)}
                              className="p-2 text-orange-400 hover:bg-orange-900/30 rounded-lg transition"
                              title="Update Status"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition"
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

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Course Announcements</h2>
              <p className="text-gray-400 text-sm">Share important updates with your students</p>
            </div>
            <button
              onClick={handleAddAnnouncement}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
            >
              <Plus size={20} />
              New Announcement
            </button>
          </div>

          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No announcements yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Create your first announcement to communicate important updates to your students
                </p>
                <button
                  onClick={handleAddAnnouncement}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 font-semibold"
                >
                  <Plus size={20} />
                  Create Announcement
                </button>
              </div>
            ) : (
              announcements.map((announcement) => {
                const priorityConfig = {
                  high: { emoji: '🔴', label: 'High Priority', color: 'text-red-400 bg-red-900/20 border-red-700' },
                  normal: { emoji: '🟡', label: 'Normal', color: 'text-yellow-400 bg-yellow-900/20 border-yellow-700' },
                  low: { emoji: '🟢', label: 'Low Priority', color: 'text-green-400 bg-green-900/20 border-green-700' }
                };
                const priority = priorityConfig[announcement.priority] || priorityConfig.normal;

                return (
                  <div 
                    key={announcement.id} 
                    className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleViewAnnouncement(announcement)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white hover:text-orange-400 transition">{announcement.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${priority.color}`}>
                              {priority.emoji} {priority.label}
                            </span>
                            {announcement.status === 'draft' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border text-gray-400 bg-gray-800 border-gray-700">
                                ○ Draft
                              </span>
                            )}
                            {announcement.status === 'published' && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border text-green-400 bg-green-900/20 border-green-700">
                                ✓ Published
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap mb-3 line-clamp-3">{announcement.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <MessageCircle size={16} />
                              <span>{announcement.comments_count || 0} {announcement.comments_count === 1 ? 'comment' : 'comments'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAnnouncement(announcement);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                            title="View Details & Comments"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAnnouncement(announcement);
                            }}
                            className="p-2 text-orange-400 hover:bg-orange-900/30 rounded-lg transition"
                            title="Edit Announcement"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(announcement.id, announcement.title);
                            }}
                            className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition"
                            title="Delete Announcement"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Module Modal */}
      <Modal
        isOpen={isModalOpen === 'module'}
        onClose={() => setIsModalOpen(null)}
        title={formData.id ? "Edit Module" : "Create New Module"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div>
            <label htmlFor="module-title" className="block text-sm font-semibold text-gray-200 mb-2">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              id="module-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              placeholder="Enter module title (e.g., Introduction to React)"
              required
            />
          </div>

          {/* Description Section */}
          <div>
            <label htmlFor="module-description" className="block text-sm font-semibold text-gray-200 mb-2">
              Short Description
            </label>
            <input
              id="module-description"
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              placeholder="Brief overview of the module"
            />
            <p className="mt-1 text-xs text-gray-400">
              A brief summary that appears in the module list
            </p>
          </div>

          {/* Content Section */}
          <div>
            <label htmlFor="module-content" className="block text-sm font-semibold text-gray-200 mb-2">
              Module Content
            </label>
            <textarea
              id="module-content"
              rows={8}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white resize-none transition font-mono text-sm"
              placeholder="Enter detailed module content, learning objectives, resources, etc."
            />
            <p className="mt-1 text-xs text-gray-400">
              Supports markdown formatting for rich content
            </p>
          </div>

          {/* File Upload Section */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-2">
              📎 Attachments (Videos, PDFs, Documents, etc.)
            </div>
            <div className="space-y-3">
              {/* File Upload Input */}
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-orange-500 transition">
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-300">
                      <span className="text-orange-400 font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Videos (MP4, MOV, AVI), PDFs, Documents, Images (up to 500MB each)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Files List */}
              {formData.files && formData.files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-200">
                    Uploaded Files ({formData.files.length})
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.files.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {file.type?.startsWith('video/') ? (
                              <div className="w-10 h-10 bg-purple-900/30 rounded flex items-center justify-center">
                                <span className="text-purple-400 text-xs font-bold">🎬</span>
                              </div>
                            ) : file.type?.startsWith('image/') ? (
                              <div className="w-10 h-10 bg-blue-900/30 rounded flex items-center justify-center">
                                <span className="text-blue-400 text-xs font-bold">🖼️</span>
                              </div>
                            ) : file.type?.includes('pdf') ? (
                              <div className="w-10 h-10 bg-red-900/30 rounded flex items-center justify-center">
                                <span className="text-red-400 text-xs font-bold">📄</span>
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                <FileText size={20} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="flex-shrink-0 p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              💡 Students will be able to view and download these files
            </p>
          </div>

          {/* Warning Message - No File Uploaded */}
          {!formData.files?.length && !formData.id && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-300 mb-1">
                    ⚠️ No file attached
                  </p>
                  <p className="text-xs text-yellow-400/80">
                    Consider uploading learning materials or adding content/links in the module content field to provide students with resources.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-sm hover:shadow-md"
            >
              {formData.id ? 'Update Module' : 'Create Module'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen === 'assignment'}
        onClose={() => setIsModalOpen(null)}
        title={formData.id ? "Edit Assignment" : "Create New Assignment"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div>
            <label htmlFor="assignment-title" className="block text-sm font-semibold text-gray-200 mb-2">
              Assignment Title <span className="text-red-500">*</span>
            </label>
            <input
              id="assignment-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              placeholder="Enter assignment title (e.g., Week 1 Quiz)"
              required
            />
          </div>

          {/* Description Section */}
          <div>
            <label htmlFor="assignment-description" className="block text-sm font-semibold text-gray-200 mb-2">
              Instructions & Description
            </label>
            <textarea
              id="assignment-description"
              rows={5}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white resize-none transition"
              placeholder="Provide detailed instructions for students..."
            />
            <p className="mt-1 text-xs text-gray-400">
              Clear instructions help students understand what is expected
            </p>
          </div>

          {/* Due Date and Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignment-due-date" className="block text-sm font-semibold text-gray-200 mb-2">
                📅 Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="assignment-due-date"
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
                required
              />
            </div>
            <div>
              <label htmlFor="assignment-max-points" className="block text-sm font-semibold text-gray-200 mb-2">
                🎯 Maximum Points <span className="text-red-500">*</span>
              </label>
              <input
                id="assignment-max-points"
                type="number"
                min="1"
                max="1000"
                value={formData.max_points || 100}
                onChange={(e) => setFormData({...formData, max_points: e.target.value})}
                className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
                placeholder="100"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                Total points possible
              </p>
            </div>
          </div>

          {/* Status Dropdown */}
          <div>
            <label htmlFor="assignment-status" className="block text-sm font-semibold text-gray-200 mb-2">
              📢 Status <span className="text-red-500">*</span>
            </label>
            <select
              id="assignment-status"
              value={formData.status || 'draft'}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              required
            >
              <option value="draft">Draft (Not visible to students)</option>
              <option value="published">Published (Visible to students)</option>
              <option value="closed">Closed (No new submissions)</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Set to "Published" to make this assignment visible to students
            </p>
          </div>

          {/* File Upload Section */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-2">
              📎 Attach File (Optional)
            </div>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center bg-gray-800/50 hover:border-orange-500/50 transition">
              <Upload className="mx-auto text-gray-500 mb-3" size={32} />
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="assignment-file-upload"
              />
              <label 
                htmlFor="assignment-file-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Choose File
              </label>
              <p className="mt-2 text-xs text-gray-400">
                PDF, DOC, PPT, images, videos, ZIP, Excel (Max 500MB)
              </p>
            </div>

            {/* Existing File Display (for edit mode) */}
            {formData.existingFile && !formData.files?.length && (
              <div className="mt-3 bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText size={18} className="text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300 truncate">
                      Current file: {formData.existingFile.split('/').pop()}
                    </span>
                  </div>
                  <span className="ml-2 px-2 py-1 bg-green-900/30 border border-green-800 text-green-400 text-xs rounded">
                    Uploaded
                  </span>
                </div>
              </div>
            )}

            {/* Show selected files */}
            {formData.files && formData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 font-medium mb-1">Selected File:</div>
                {formData.files.map((file, index) => (
                  <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText size={18} className="text-orange-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning Message - No File and No Link */}
          {!formData.files?.length && !formData.existingFile && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-300 mb-1">
                    ⚠️ No file or instructions attached
                  </p>
                  <p className="text-xs text-yellow-400/80">
                    Consider uploading assignment materials or adding detailed instructions in the description field above to help students understand the requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Tip */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-300">
              <span className="font-semibold">💡 Tip:</span> Students will be able to download attached files and upload their submissions after you create this assignment.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-sm hover:shadow-md"
            >
              {formData.id ? 'Update Assignment' : 'Create Assignment'}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student's Response */}
          {formData.submission_text && (
            <div>
              <div className="block text-sm font-semibold text-gray-200 mb-2">
                📝 Student's Response
              </div>
              <div className="w-full px-4 py-3 border border-gray-700 bg-gray-800/50 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {formData.submission_text}
                </p>
              </div>
            </div>
          )}

          {/* Submitted File */}
          {formData.file_path && (
            <div>
              <div className="block text-sm font-semibold text-gray-200 mb-2">
                📎 Submitted File
              </div>
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-lg hover:border-blue-600/50 transition">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-blue-400" />
                </div>
                <span className="text-sm text-gray-300 flex-1 font-medium truncate">
                  {formData.file_path.split('/').pop()}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadSubmission(formData.id, formData.student)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          )}

          {/* Grade Input */}
          <div>
            <label htmlFor="grade-input" className="block text-sm font-semibold text-gray-200 mb-2">
              🎯 Grade (out of 100) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="grade-input"
                type="number"
                min="0"
                max="100"
                value={formData.grade || ''}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white text-lg font-semibold transition"
                placeholder="Enter grade (0-100)"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                / 100
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>90-100: Excellent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>80-89: Good</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>70-79: Fair</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>&lt;70: Needs Improvement</span>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="grade-feedback" className="block text-sm font-semibold text-gray-200 mb-2">
              💬 Feedback for Student
            </label>
            <textarea
              id="grade-feedback"
              rows={5}
              value={formData.feedback || ''}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white resize-none transition"
              placeholder="Provide constructive feedback to help the student improve..."
            />
            <p className="mt-2 text-xs text-gray-400">
              💡 Clear feedback helps students understand their strengths and areas for improvement
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-medium shadow-lg shadow-green-900/30 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {formData.grade !== null && formData.grade !== '' ? 'Update Grade' : 'Submit Grade'}
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
        <form onSubmit={handleUpdateStudent} className="space-y-6">
          {/* Status Selection */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-3">
              📊 Enrollment Status <span className="text-red-500">*</span>
            </div>
            <div className="space-y-3">
              {/* Enrolled Option */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.currentStatus === 'enrolled'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="enrolled"
                  checked={formData.currentStatus === 'enrolled'}
                  onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                  className="w-5 h-5 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-400" />
                    <span className="font-semibold text-white">Enrolled</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Student has active access to the course</p>
                </div>
              </label>

              {/* Completed Option */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.currentStatus === 'completed'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="completed"
                  checked={formData.currentStatus === 'completed'}
                  onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-blue-400" />
                    <span className="font-semibold text-white">Completed</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Student has finished the course</p>
                </div>
              </label>

              {/* Dropped Option */}
              <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.currentStatus === 'dropped'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="dropped"
                  checked={formData.currentStatus === 'dropped'}
                  onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                  className="w-5 h-5 text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-red-400" />
                    <span className="font-semibold text-white">Dropped</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Student will lose access to the course</p>
                </div>
              </label>
            </div>
          </div>

          {/* Warning Notice */}
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-300 mb-1">
                  Important Note
                </p>
                <p className="text-xs text-blue-200">
                  Changing the enrollment status will immediately affect the student's access to this course and all its materials.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Update Status
            </button>
          </div>
        </form>
      </Modal>

      {/* Announcement Modal */}
      <Modal
        isOpen={isModalOpen === 'announcement'}
        onClose={() => setIsModalOpen(null)}
        title={formData.id ? "Edit Announcement" : "Create New Announcement"}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="announcement-title" className="block text-sm font-semibold text-gray-200 mb-2">
              📢 Announcement Title <span className="text-red-500">*</span>
            </label>
            <input
              id="announcement-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white transition"
              placeholder="Enter announcement title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="announcement-content" className="block text-sm font-semibold text-gray-200 mb-2">
              📝 Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="announcement-content"
              rows={6}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 border border-gray-700 bg-gray-800 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white resize-none transition"
              placeholder="Write your announcement here..."
              required
            />
          </div>

          {/* Priority */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-3">
              🎯 Priority Level <span className="text-red-500">*</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.priority === 'high'
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="high"
                  checked={formData.priority === 'high'}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="sr-only"
                />
                <span className="text-2xl">🔴</span>
                <span className="text-sm font-medium text-gray-200">High</span>
              </label>
              
              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.priority === 'normal'
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="normal"
                  checked={formData.priority === 'normal'}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="sr-only"
                />
                <span className="text-2xl">🟡</span>
                <span className="text-sm font-medium text-gray-200">Normal</span>
              </label>
              
              <label className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.priority === 'low'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="priority"
                  value="low"
                  checked={formData.priority === 'low'}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="sr-only"
                />
                <span className="text-2xl">🟢</span>
                <span className="text-sm font-medium text-gray-200">Low</span>
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="block text-sm font-semibold text-gray-200 mb-3">
              📊 Status <span className="text-red-500">*</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.status === 'published'
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={formData.status === 'published'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="sr-only"
                />
                <CheckCircle className={formData.status === 'published' ? 'text-green-400' : 'text-gray-600'} size={20} />
                <div>
                  <div className="text-sm font-medium text-gray-200">Published</div>
                  <div className="text-xs text-gray-400">Visible to students</div>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.status === 'draft'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}>
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formData.status === 'draft'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="sr-only"
                />
                <XCircle className={formData.status === 'draft' ? 'text-orange-400' : 'text-gray-600'} size={20} />
                <div>
                  <div className="text-sm font-medium text-gray-200">Draft</div>
                  <div className="text-xs text-gray-400">Only visible to you</div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(null)} 
              className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30 flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {formData.id ? 'Update' : 'Create'} Announcement
            </button>
          </div>
        </form>
      </Modal>

      {/* Announcement Detail Modal with Comments */}
      {selectedAnnouncement && (
        <Modal
          isOpen={true}
          onClose={handleCloseAnnouncementDetail}
          title={selectedAnnouncement.title}
        >
          <div className="space-y-6">
            {/* Announcement Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const priorityConfig = {
                    high: { emoji: '🔴', label: 'High Priority', color: 'bg-red-900/20 border-red-700 text-red-400' },
                    normal: { emoji: '🟡', label: 'Normal', color: 'bg-yellow-900/20 border-yellow-700 text-yellow-400' },
                    low: { emoji: '🟢', label: 'Low Priority', color: 'bg-green-900/20 border-green-700 text-green-400' }
                  };
                  const priority = priorityConfig[selectedAnnouncement.priority] || priorityConfig.normal;
                  return (
                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${priority.color}`}>
                      {priority.emoji} {priority.label}
                    </span>
                  );
                })()}
                {selectedAnnouncement.status === 'draft' && (
                  <span className="px-3 py-1.5 text-xs font-semibold rounded-lg border text-gray-400 bg-gray-800 border-gray-700">
                    ○ Draft
                  </span>
                )}
                {selectedAnnouncement.status === 'published' && (
                  <span className="px-3 py-1.5 text-xs font-semibold rounded-lg border text-green-400 bg-green-900/20 border-green-700">
                    ✓ Published
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>Posted {new Date(selectedAnnouncement.created_at).toLocaleString()}</span>
                </div>
                {selectedAnnouncement.updated_at !== selectedAnnouncement.created_at && (
                  <div className="flex items-center gap-2">
                    <Edit size={14} />
                    <span>Updated {new Date(selectedAnnouncement.updated_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Announcement Content */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MessageCircle size={20} className="text-orange-400" />
                  Student Comments ({announcementComments.length})
                </h3>
              </div>

              {/* Add Comment Form (Faculty can also comment) */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {announcementComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                ) : (
                  announcementComments.map((comment) => renderComment(comment, 0))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-900/20 to-orange-900/20 border border-blue-700/50 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileEdit size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Course Content Creator</h2>
                  <p className="text-gray-300 text-sm mb-3">Create rich formatted course material for your students with videos, images, tables, and more</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-700/50 rounded-full text-xs text-blue-300">📝 Rich Text Formatting</span>
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-700/50 rounded-full text-xs text-blue-300">🎥 Video Embedding</span>
                    <span className="px-3 py-1 bg-blue-900/40 border border-blue-700/50 rounded-full text-xs text-blue-300">🖼️ Images & Tables</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-xs font-semibold text-green-300">
                ✓ WYSIWYG Editor
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl shadow-lg overflow-hidden">
            <HierarchicalLectureContent 
              courseId={id}
              isTeacher={true}
              onSave={() => {
                setToast({ 
                  message: 'Course content saved successfully!', 
                  type: 'success' 
                });
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}




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
  Download,
  Upload,
  X,
  Megaphone,
  Send,
  Trash2,
  Edit,
  Reply,
  FileEdit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { courseAPI, moduleAPI, assignmentAPI, submissionAPI, announcementAPI, announcementCommentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import LectureContent from '../../components/LectureContent';
import { getFileTypeInfo, getFileName } from '../../utils/fileUtils';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementComments, setAnnouncementComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Notification badges
  const [newModulesCount, setNewModulesCount] = useState(0);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);
  const [hasContent, setHasContent] = useState(false);
  
  // Submission modal state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

  // Helper: calculate time until due date
  const getTimeUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate).getTime();
    const now = Date.now();
    const diff = Math.floor((due - now) / 1000); // seconds

    if (diff < 0) return { text: 'Overdue', color: 'text-red-400', urgent: true };
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return { text: `${m} min${m > 1 ? 's' : ''} left`, color: 'text-red-400', urgent: true };
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return { text: `${h} hour${h > 1 ? 's' : ''} left`, color: 'text-orange-400', urgent: true };
    }
    if (diff < 172800) { // 2 days
      return { text: '1 day left', color: 'text-yellow-400', urgent: true };
    }
    if (diff < 604800) { // 7 days
      const d = Math.floor(diff / 86400);
      return { text: `${d} days left`, color: 'text-yellow-400', urgent: false };
    }
    return { text: 'On time', color: 'text-green-400', urgent: false };
  };

  useEffect(() => {
    if (id) {
      fetchCourseData();
      fetchAssignments();
      checkContentExists();
    }
  }, [id]);

  const checkContentExists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/courses/${id}/content/view`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success && data.content?.content) {
        setHasContent(true);
      }
    } catch (error) {
      console.error('Error checking content:', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      if (response.success) {
        setCourse(response.course);
        const modulesData = response.course.modules || [];
        setModules(modulesData);
        
        // Calculate new modules (created within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newModules = modulesData.filter(m => {
          const createdDate = new Date(m.created_at);
          return createdDate > sevenDaysAgo;
        });
        setNewModulesCount(newModules.length);
        
        // Set announcements from course response (already filtered by backend)
        setAnnouncements(response.course.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({ message: 'Failed to load course data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      console.log('Fetching assignments for course:', id);
      const response = await assignmentAPI.getByCourse(id);
      console.log('Assignments API response:', response);
      if (response.success) {
        // Filter to show only published assignments to students
        const publishedAssignments = (response.assignments || []).filter(
          assignment => assignment.status === 'published'
        );
        setAssignments(publishedAssignments);
        
        // Calculate new assignments (created within last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newAssignments = publishedAssignments.filter(a => {
          const createdDate = new Date(a.created_at);
          return createdDate > sevenDaysAgo;
        });
        setNewAssignmentsCount(newAssignments.length);
        
        console.log('✅ Loaded', publishedAssignments.length, 'published assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      console.error('Error details:', error.response?.data);
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

  const handleDownloadAssignment = async (assignmentId, assignmentTitle) => {
    const downloadUrl = `http://127.0.0.1:8000/api/assignments/${assignmentId}/download`;
    const token = localStorage.getItem('token');
    
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
      a.download = assignmentTitle || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setToast({ message: 'Assignment file downloaded successfully!', type: 'success' });
    })
    .catch(error => {
      console.error('Error downloading assignment:', error);
      setToast({ 
        message: 'Failed to download assignment file. Please try again.', 
        type: 'error' 
      });
    });
  };

  // Open submission modal
  const handleSubmitWork = (assignment) => {
    setCurrentAssignment(assignment);
    setShowSubmissionModal(true);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  // Close submission modal
  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setCurrentAssignment(null);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setToast({
        message: 'File size exceeds 500MB limit. Please choose a smaller file.',
        type: 'error'
      });
      return;
    }

    setSubmissionFile(file);
  };

  // Submit assignment
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    if (!submissionText && !submissionFile) {
      setToast({
        message: 'Please provide either text or a file for your submission.',
        type: 'error'
      });
      return;
    }

    // Check file size on frontend (500MB limit)
    if (submissionFile) {
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (submissionFile.size > maxSize) {
        setToast({
          message: `File is too large! Maximum file size is 500MB. Your file is ${(submissionFile.size / 1024 / 1024).toFixed(2)}MB.`,
          type: 'error'
        });
        return;
      }
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('assignment_id', currentAssignment.id);
      if (submissionText) {
        formData.append('submission_text', submissionText);
      }
      if (submissionFile) {
        formData.append('file', submissionFile);
      }

      console.log('Submitting assignment:', {
        assignment_id: currentAssignment.id,
        has_text: !!submissionText,
        has_file: !!submissionFile,
        file_size: submissionFile ? `${(submissionFile.size / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });

      const response = await submissionAPI.create(formData);

      setToast({
        message: 'Assignment submitted successfully!',
        type: 'success'
      });
      
      closeSubmissionModal();
      
      // Refresh assignments to show submission status
      fetchAssignments();
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      
      let errorMessage = 'Failed to submit assignment. Please try again.';
      
      // Check for specific error types
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Validation errors
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors.join('. ');
      } else if (error.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. File may be too large or connection too slow.';
      }
      
      setToast({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Announcement handlers
  const handleOpenAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    await fetchAnnouncementComments(announcement.id);
  };

  const handleCloseAnnouncement = () => {
    setSelectedAnnouncement(null);
    setAnnouncementComments([]);
    setNewComment('');
    setReplyingTo(null);
    setReplyText('');
  };

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
                  {comment.user?.id === user?.id && (
                    <span className="px-1.5 py-0.5 text-xs bg-orange-900/30 text-orange-400 rounded-full border border-orange-700/50">
                      You
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(comment.created_at)}
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
            {comment.user?.id === user?.id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                title="Delete comment"
              >
                <Trash2 size={12} />
              </button>
            )}
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
                autoFocus
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

        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen, count: 0 },
          { id: 'content', label: 'Content', icon: FileEdit, count: hasContent ? 1 : 0, highlight: hasContent },
          { id: 'modules', label: 'Modules', icon: PlayCircle, count: newModulesCount },
          { id: 'assignments', label: 'Assignments', icon: FileText, count: newAssignmentsCount },
          { id: 'announcements', label: 'Announcements', icon: MessageSquare, count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all relative ${
              activeTab === tab.id
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
            {tab.highlight && !tab.count && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                ✓
              </span>
            )}
            {tab.count > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Materials Quick Access */}
            {hasContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:from-blue-900/40 hover:to-blue-800/30 transition-all"
                onClick={() => setActiveTab('content')}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileEdit size={20} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Course Content</h3>
                </div>
                <p className="text-blue-200 text-sm mb-4">
                  View important course materials, guidelines, and resources from your instructor.
                </p>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition">
                  <span>View Materials</span>
                  <ArrowLeft size={16} className="rotate-180" />
                </div>
              </motion.div>
            )}
            
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

        {activeTab === 'content' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {!hasContent ? (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileEdit className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Course Content Yet</h3>
                <p className="text-gray-400">
                  Your instructor hasn't posted any course content yet. Check back later for course materials and guidelines.
                </p>
              </div>
            ) : (
              <div className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-xl shadow-lg p-6">
                <div className="mb-4 flex items-center gap-2 pb-4 border-b border-gray-800">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FileEdit size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Course Materials</h3>
                    <p className="text-sm text-gray-400">Important course information and guidelines</p>
                  </div>
                </div>
                <LectureContent 
                  courseId={id}
                  isTeacher={false}
                />
              </div>
            )}
          </motion.div>
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
                        </div>
                        {module.file_path && (
                          <div className="flex items-center gap-2 mt-3">
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
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {module.file_path ? (
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
                  className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-orange-500 hover:bg-gray-800/60 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors duration-300">{assignment.title}</h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          assignment.status === 'published' 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 group-hover:bg-green-500/20'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors text-sm mb-2">{assignment.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} className="group-hover:text-orange-400 transition-colors" />
                          Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                        {assignment.due_date && (() => {
                          const timeInfo = getTimeUntilDue(assignment.due_date);
                          return timeInfo ? (
                            <span className={`flex items-center gap-1 ${timeInfo.color} font-medium ${timeInfo.urgent ? 'animate-pulse' : ''}`}>
                              <Clock size={14} />
                              {timeInfo.text}
                            </span>
                          ) : null;
                        })()}
                        <span className="flex items-center gap-1">
                          <FileText size={14} className="group-hover:text-orange-400 transition-colors" />
                          Max Points: {assignment.max_points || 100}
                        </span>
                      </div>
                      {assignment.file_path && (
                        <div className="flex items-center gap-2 mt-3">
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
                    </div>
                    <div className="flex gap-2">
                      {/* Download button - always show if file exists, regardless of status */}
                      {assignment.file_path && (
                        <button 
                          onClick={() => handleDownloadAssignment(assignment.id, assignment.title)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md text-sm font-medium flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                      
                      {/* Submit button - only show for published assignments */}
                      {assignment.status === 'published' && (
                        assignment.due_date && new Date(assignment.due_date) < new Date() ? (
                          <button 
                            disabled
                            className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg transition text-sm font-medium cursor-not-allowed"
                            title="Past due date"
                          >
                            Past Due
                          </button>
                        ) : assignment.has_submitted ? (
                          assignment.can_resubmit ? (
                            <button 
                              onClick={() => handleSubmitWork(assignment)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md text-sm font-medium"
                              title="Assignment was updated - you can resubmit"
                            >
                              Resubmit Work
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="px-4 py-2 bg-green-700 text-green-300 rounded-lg transition text-sm font-medium cursor-default"
                              title="Already submitted"
                            >
                              ✓ Submitted
                            </button>
                          )
                        ) : (
                          <button 
                            onClick={() => handleSubmitWork(assignment)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md text-sm font-medium"
                            title="Submit your work"
                          >
                            Submit Work
                          </button>
                        )
                      )}
                    </div>
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

      {/* Submission Modal */}
      {showSubmissionModal && currentAssignment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-xl p-8 max-w-3xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Upload size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Submit Assignment</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{currentAssignment.title}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={closeSubmissionModal}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-6">
              {/* Assignment Instructions */}
              {currentAssignment.description && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    📋 Assignment Instructions
                  </label>
                  <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {currentAssignment.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Due Date Info */}
              {currentAssignment.due_date && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    ⏰ Due Date
                  </label>
                  <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock size={20} className="text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-orange-400 font-semibold">
                          {new Date(currentAssignment.due_date).toLocaleString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {(() => {
                          const timeInfo = getTimeUntilDue(currentAssignment.due_date);
                          return timeInfo && (
                            <p className={`text-sm ${timeInfo.color} mt-1`}>
                              {timeInfo.text}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Points Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <FileText size={16} className="text-blue-400" />
                  <span className="font-medium">Maximum Points:</span>
                  <span className="text-blue-400 font-bold">{currentAssignment.max_points || 100}</span>
                </div>
              </div>

              {/* Written Response */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  📝 Written Response <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
                  rows="8"
                  placeholder="Type your answer or explanation here... You can also upload a file below if needed."
                />
                <p className="text-xs text-gray-400 mt-2">
                  💡 Provide a clear and detailed response to demonstrate your understanding
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  📎 Attach File <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="submission-file-upload"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mkv,.zip,.rar,.xls,.xlsx"
                  />
                  <label
                    htmlFor="submission-file-upload"
                    className="block border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-orange-500 cursor-pointer transition bg-gray-800/30 hover:bg-gray-800/50"
                  >
                    <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-sm text-gray-300">
                      <span className="text-orange-400 font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, PPT, images, videos, ZIP, Excel (Max 500MB)
                    </p>
                  </label>
                  
                  {/* Selected File Display */}
                  {submissionFile && (
                    <div className="mt-3 bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={20} className="text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {submissionFile.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(submissionFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSubmissionFile(null)}
                          className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition"
                          title="Remove file"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Requirements Notice */}
              {!submissionText && !submissionFile && (
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-300 mb-1">
                        ⚠️ Submission Required
                      </p>
                      <p className="text-xs text-yellow-400/80">
                        You must provide either a written response or upload a file to submit this assignment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={closeSubmissionModal}
                  className="flex-1 px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={submitting || (!submissionText && !submissionFile)}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
          </motion.div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Course Announcements</h2>
              <p className="text-gray-400 text-sm">Important updates from your instructor</p>
            </div>
          </div>

          <div className="grid gap-4">
            {announcements.length === 0 ? (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No announcements yet</h3>
                <p className="text-gray-400">
                  Your instructor hasn't posted any announcements for this course yet.
                </p>
              </div>
            ) : (
              announcements.map((announcement) => {
                const priorityConfig = {
                  high: { emoji: '🔴', label: 'High Priority', color: 'border-red-500/30 bg-red-900/10' },
                  normal: { emoji: '🟡', label: 'Normal', color: 'border-yellow-500/30 bg-yellow-900/10' },
                  low: { emoji: '🟢', label: 'Low Priority', color: 'border-green-500/30 bg-green-900/10' }
                };
                const priority = priorityConfig[announcement.priority] || priorityConfig.normal;

                return (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-900 dark:bg-gray-950 border-2 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all cursor-pointer ${priority.color}`}
                    onClick={() => handleOpenAnnouncement(announcement)}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gray-800 border border-gray-700 text-gray-300">
                              {priority.emoji} {priority.label}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-3 hover:text-orange-400 transition">
                            {announcement.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-xs">
                                  {announcement.creator?.name?.charAt(0) || 'I'}
                                </span>
                              </div>
                              <span className="font-medium text-gray-300">
                                {announcement.creator?.name || 'Instructor'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              <span>{formatRelativeTime(announcement.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} />
                              <span>{announcement.comments_count || 0} {announcement.comments_count === 1 ? 'comment' : 'comments'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Content */}
                      <div className="prose prose-invert max-w-none">
                        <p className="text-gray-300 leading-relaxed line-clamp-3">
                          {announcement.content}
                        </p>
                      </div>

                      {/* Read More */}
                      <div className="mt-4 flex items-center gap-2 text-orange-400 text-sm font-medium hover:text-orange-300 transition">
                        <span>Read more & comment</span>
                        <ArrowLeft size={16} className="rotate-180" />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={true}
          onClose={handleCloseAnnouncement}
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
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {selectedAnnouncement.creator?.name?.charAt(0) || 'I'}
                    </span>
                  </div>
                  <span className="font-medium text-gray-300">
                    {selectedAnnouncement.creator?.name || 'Instructor'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{formatRelativeTime(selectedAnnouncement.created_at)}</span>
                </div>
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
                  <MessageSquare size={20} className="text-orange-400" />
                  Comments ({announcementComments.length})
                </h3>
              </div>

              {/* Add Comment Form */}
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
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  announcementComments.map((comment) => renderComment(comment, 0))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

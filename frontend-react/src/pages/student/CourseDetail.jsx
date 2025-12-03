import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Clock, CheckCircle, PlayCircle, FileText, MessageSquare, Calendar, Download, Upload, X, Megaphone, Send, Trash2, Eye, User } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { submissionAPI, announcementCommentAPI, studentAPI, classMaterialAPI, assignmentAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import HierarchicalLectureContent from '../../components/HierarchicalLectureContent';
import { File as FileEdit } from 'lucide-react';
import { CornerDownLeft as Reply } from 'lucide-react';
import StudentClassMaterialsTab from '../../components/StudentClassMaterialsTab';
import Skeleton from '../../components/ui/Skeleton';


function CourseDetail() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [hasContent, setHasContent] = useState(false);
  const [newAssignmentsCount, setNewAssignmentsCount] = useState(0);
  const [fileChoice, setFileChoice] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [inlinePreviewUrl, setInlinePreviewUrl] = useState(null);
  const [inlinePreviewName, setInlinePreviewName] = useState(null);
  const [inlinePreviewType, setInlinePreviewType] = useState(null);
  const [announcementComments, setAnnouncementComments] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingMap, setDownloadingMap] = useState({});
  const [gradedModalAssignment, setGradedModalAssignment] = useState(null);
  const gradedModalRef = useRef(null);

  useEffect(() => {
    if (gradedModalAssignment && gradedModalRef.current) {
      try { gradedModalRef.current.focus(); } catch { console.debug && console.debug('graded modal focus failed'); }
    }
  }, [gradedModalAssignment]);

  // --- Download file by id ---
  const handleDownloadFileById = async (fileId, fileName) => {
    try {
      const response = await studentAPI.downloadAssignmentFile(fileId);
      const blob = new Blob([response.data], { type: response.data?.type || response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = fileName || 'downloaded_file';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        } else {
          const filenameMatch2 = contentDisposition.match(/filename="?([^";\n]+)"?/);
          if (filenameMatch2 && filenameMatch2[1]) filename = filenameMatch2[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'File downloaded', type: 'success' });
    } catch (error) {
      console.error('Error downloading file by id:', error);
      setToast({ message: 'Failed to download file', type: 'error' });
    }
  };

  const handleViewFileById = async (fileId) => {
    try {
      const response = await studentAPI.downloadAssignmentFile(fileId);
      const blob = new Blob([response.data], { type: response.data?.type || response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error viewing file by id:', error);
      setToast({ message: 'Failed to open file', type: 'error' });
    }
  };

  // Download multiple files sequentially (graceful fallback)
  const handleDownloadMultiple = async (files = []) => {
    if (!files || files.length === 0) return;
    for (const f of files) {
      try {
        await handleDownloadFileById(f.id || f.file_id, f.original_name || f.name);
        // small delay to avoid overwhelming the browser for large blobs
        await new Promise(r => setTimeout(r, 250));
      } catch (err) {
        console.warn('Failed to download file in batch', f, err);
      }
    }
  };

  // Download entire assignment package (if backend supports it)
  const handleDownloadAssignment = async (assignmentId) => {
    try {
      setDownloadingMap(prev => ({ ...prev, [assignmentId]: true }));
      await assignmentAPI.download(assignmentId);
      setToast({ message: 'Download started', type: 'success' });
    } catch (error) {
      console.error('Download failed for assignment', assignmentId, error);
      setToast({ message: 'Download failed', type: 'error' });
    } finally {
      setDownloadingMap(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

        // NOTE: inline preview creation is handled directly where needed.

        // Fetch course details + related resources for student view
        useEffect(() => {
          if (!id) return;


        const fetchAll = async () => {
          setLoading(true);
          try {
            // Use student-specific endpoint to ensure enrollment check
            const resp = await studentAPI.getCourseDetails(id);
            if (resp && resp.success) {
              setCourse(resp.course || null);
              setAssignments(resp.course?.assignments || []);
              setAnnouncements(resp.course?.announcements || []);
              setHasContent((resp.course?.assignments && resp.course.assignments.length > 0));
              setNewAssignmentsCount((resp.course?.assignments && resp.course.assignments.length) || 0);
            } else {
              throw new Error(resp?.message || 'Failed to load course details');
            }

            // Fetch class materials
            try {
              const materialsResp = await classMaterialAPI.getByCourse(id);
              if (materialsResp.success) {
                setMaterials(materialsResp.materials || []);
              }
            } catch (materialsError) {
              console.error('Error fetching class materials:', materialsError);
              // Don't fail the whole page load if materials fail
            }
          } catch (error) {
            console.error('Error fetching course details:', error);
            setCourse(null);
            setAssignments([]);
            setAnnouncements([]);
            setMaterials([]);
            setHasContent(false);
            setNewAssignmentsCount(0);
          }
          setLoading(false);
        };          fetchAll();
        }, [id]);

  // Utility functions
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTimeUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffInMs = due - now;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 0) return { text: 'Overdue', urgent: true, color: 'text-red-400' };
    if (diffInHours < 24) return { text: `${Math.ceil(diffInHours)}h left`, urgent: diffInHours < 6, color: diffInHours < 6 ? 'text-red-400' : 'text-yellow-400' };
    const diffInDays = Math.ceil(diffInHours / 24);
    return { text: `${diffInDays}d left`, urgent: false, color: 'text-green-400' };
  };

  // Find the latest student submission for an assignment, trying common shapes
  const getLatestSubmission = (assignment) => {
    if (!assignment) return null;
    // Common shapes: assignment.latest_submission, assignment.submission, assignment.submissions (array)
    if (assignment.latest_submission) return assignment.latest_submission;
    if (assignment.submission) return assignment.submission;
    if (Array.isArray(assignment.submissions) && assignment.submissions.length > 0) {
      // pick the most recent by created_at / submitted_date
      const sorted = assignment.submissions.slice().sort((a, b) => {
        const ta = new Date(a.submitted_at || a.created_at || a.createdAt || 0).getTime();
        const tb = new Date(b.submitted_at || b.created_at || b.createdAt || 0).getTime();
        return tb - ta;
      });
      return sorted[0];
    }
    // Some backends put student_submission or submissions_data
    if (assignment.student_submission) return assignment.student_submission;
    if (assignment.submitted_files && Array.isArray(assignment.submitted_files) && assignment.submitted_files.length > 0) {
      // return the most recent submitted file object
      return assignment.submitted_files.slice().sort((a,b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))[0];
    }
    return null;
  };

  // Close submission modal
  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setCurrentAssignment(null);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  // Open graded modal: fetch submission details (feedback/files) if available
  const openGradedModal = async (assignment) => {
    if (!assignment) return;
    try {
      console.log('Opening graded modal for assignment (raw):', assignment);
      // Try to find a submission id in common places
      const submissionId = assignment.latest_submission?.id || assignment.latest_submission?.submission_id || assignment.submission?.id || assignment.submission?.submission_id || assignment.student_submission?.id || (Array.isArray(assignment.submissions) && (assignment.submissions[0]?.id || assignment.submissions[0]?.submission_id)) || assignment.submission_id || assignment.submissionId || null;
      console.log('Computed submissionId for graded modal:', submissionId);
      let modalData = { ...assignment };

      if (submissionId) {
        try {
          const resp = await submissionAPI.getOne(submissionId);
          console.log('submissionAPI.getOne response (raw):', resp);
          // response may be wrapped
          const submission = (resp && resp.submission) || resp.data || resp || null;
          console.log('Normalized submission object:', submission);
          if (submission) {
            const feedback = submission.feedback || submission.instructor_feedback || submission.remarks || submission.comments || modalData.feedback || modalData.instructor_feedback || null;
            const gradedFiles = submission.files || submission.submission_files || submission.uploaded_files || modalData.graded_files || modalData.feedback_files || null;
            modalData = { ...modalData, feedback, graded_files: gradedFiles };
          }
        } catch (err) {
          console.warn('Failed to fetch submission details for graded modal:', err);
          // fall back to assignment-level feedback if any
        }
      } else {
        console.log('No submissionId found on assignment; querying submissions endpoint for this assignment/student');
        try {
          // Try to fetch submissions for this assignment (filter by assignment_id, optionally student)
          const params = { assignment_id: assignment.id };
          if (user && user.id) params.student_id = user.id;
          const listResp = await submissionAPI.getAll(params);
          console.log('submissionAPI.getAll response (raw):', listResp);
          // Normalize to array
          let subs = [];
          if (!listResp) subs = [];
          else if (Array.isArray(listResp)) subs = listResp;
          else if (Array.isArray(listResp.submissions)) subs = listResp.submissions;
          else if (Array.isArray(listResp.data)) subs = listResp.data;
          else if (Array.isArray(listResp.result)) subs = listResp.result;
          else {
            const arr = Object.values(listResp).find(v => Array.isArray(v));
            subs = arr || [];
          }
          if (subs && subs.length > 0) {
            // Pick most recent submission
            const sortedSubs = subs.slice().sort((a,b) => new Date(b.submitted_at || b.created_at || b.createdAt || 0) - new Date(a.submitted_at || a.created_at || a.createdAt || 0));
            const submission = sortedSubs[0];
            console.log('Selected submission from list:', submission);
            if (submission) {
              const feedback = submission.feedback || submission.instructor_feedback || submission.remarks || submission.comments || modalData.feedback || modalData.instructor_feedback || null;
              const gradedFiles = submission.files || submission.submission_files || submission.uploaded_files || modalData.graded_files || modalData.feedback_files || null;
              modalData = { ...modalData, feedback, graded_files: gradedFiles };
            }
          } else {
            console.log('No submissions found via submissions endpoint for assignment', assignment.id);
          }
        } catch (err) {
          console.warn('Error while fetching submissions list for graded modal fallback:', err);
        }
      }

      console.log('Final modal data to show:', modalData);
      setGradedModalAssignment(modalData);
    } catch (err) {
      console.error('openGradedModal error:', err);
      setGradedModalAssignment(assignment);
    }
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
  const handleSubmitWork = async (e) => {
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
    setUploadProgress(0);
    
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

      // Pass an onUploadProgress callback to track upload progress
      await submissionAPI.create(formData, (progressEvent) => {
        try {
          if (progressEvent && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        } catch {
          // ignore progress errors
        }
      });

      setToast({
        message: 'Assignment submitted successfully!',
        type: 'success'
      });
      
      closeSubmissionModal();
      
      // Refresh course data to update assignment status
      const refreshedResp = await studentAPI.getCourseDetails(id);
      if (refreshedResp && refreshedResp.success) {
        setCourse(refreshedResp.course || null);
        setAssignments(refreshedResp.course?.assignments || []);
      }
      
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
      setUploadProgress(0);
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
    const res = await Swal.fire({
      title: 'Delete comment',
      text: 'Are you sure you want to delete this comment?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;

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
        <div className="bg-gray-800/50 border border-orange-500 rounded-lg p-3 hover:border-orange-600 transition">
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
            {/* Students can only delete their own comments, not instructor comments */}
            {comment.user?.id === user?.id && comment.user?.role_id !== 2 && (
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
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
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
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
          <Skeleton variant="title" className="w-1/2" />
          <Skeleton className="w-3/4" />
          <Skeleton className="w-2/3" />
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <Skeleton variant="title" className="w-1/3 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="py-3 border-b border-gray-800 last:border-0">
              <Skeleton className="w-full mb-2" />
              <Skeleton className="w-1/2" />
            </div>
          ))}
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
          { id: 'materials', label: 'Class Materials', icon: FileText, count: materials.length || 0 },
          { id: 'assignments', label: 'Assignments', icon: FileText, count: newAssignmentsCount },
          { id: 'announcements', label: 'Announcements', icon: MessageSquare, count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'content') {
                // Open content in new window/tab
                window.open(`/student/courses/${id}/content`, '_blank');
              } else {
                setActiveTab(tab.id);
              }
            }}
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
          <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold text-white mb-2">Course Overview</h2>
                  <p className="text-sm text-gray-300 mb-4">{course?.description || 'No description provided by the instructor.'}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-800/40 rounded">
                      <h4 className="text-sm text-gray-200 font-semibold">Instructor</h4>
                      {course?.faculty ? (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {course.faculty.name?.charAt(0) || 'I'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">{course.faculty.name}</div>
                            <div className="text-xs text-gray-400">{course.faculty.email}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-400">Instructor information not available.</div>
                      )}
                    </div>

                    <div className="p-4 bg-gray-800/40 rounded">
                      <h4 className="text-sm text-gray-200 font-semibold">Course Info</h4>
                      <div className="mt-2 text-sm text-gray-300 space-y-1">
                        <div>Code: <span className="font-medium text-white">{course?.code || course?.id}</span></div>
                        <div>Credits: <span className="font-medium text-white">{course?.credits ?? '-'}</span></div>
                        <div>Section: <span className="font-medium text-white">{course?.section || '-'}</span></div>
                        <div>Semester: <span className="font-medium text-white">{course?.semester || '-'} {course?.academic_year || ''}</span></div>
                        <div>Students Enrolled: <span className="font-medium text-white">{course?.students ?? course?.enrolled_students?.length ?? 0}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 rounded p-4 border border-orange-500">
                      <h4 className="text-sm text-gray-200 font-semibold mb-2">Class Materials</h4>
                      {materials && materials.length > 0 ? (
                        <div className="space-y-2">
                          {materials.slice(0, 5).map((material) => (
                            <div key={material.id} className="flex items-center justify-between py-2 border-b border-gray-700">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-semibold truncate">{material.title}</div>
                                <div className="text-xs text-gray-400">{formatRelativeTime(material.created_at)}</div>
                              </div>
                              <button
                                onClick={() => classMaterialAPI.download(material.id)}
                                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium flex items-center gap-1 transition"
                                title="Download material"
                              >
                                <Download size={12} />
                              </button>
                            </div>
                          ))}
                          {materials.length > 5 && (
                            <div className="text-xs text-gray-400 text-center pt-2">
                              +{materials.length - 5} more materials available in Materials tab
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">No class materials available.</div>
                      )}
                    </div>

                    <div className="bg-gray-800/30 rounded p-4 border border-orange-500">
                      <h4 className="text-sm text-gray-200 font-semibold mb-2">Upcoming Assignments</h4>
                      {assignments && assignments.length > 0 ? (
                        assignments
                          .filter(a => a.due_date)
                          .sort((a,b) => new Date(a.due_date) - new Date(b.due_date))
                          .slice(0,5)
                          .map(a => (
                            <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                              <div className="flex-1">
                                <div className="text-sm text-white font-semibold">{a.title}</div>
                                <div className="text-xs text-gray-400">Due {new Date(a.due_date).toLocaleString()}</div>
                              </div>
                              <div className="text-xs text-gray-300">{getTimeUntilDue(a.due_date)?.text || ''}</div>
                            </div>
                          ))
                      ) : (
                        <div className="text-sm text-gray-400">No upcoming assignments.</div>
                      )}
                    </div>


                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="p-4 bg-gray-800/30 rounded">
                    <h4 className="text-sm text-gray-200 font-semibold mb-3">Recent Announcements</h4>
                    {announcements && announcements.length > 0 ? (
                      announcements.slice(0,6).map(ann => (
                        <div key={ann.id} className="mb-3">
                          <div className="text-sm text-white font-semibold">{ann.title}</div>
                          <div className="text-xs text-gray-400">{formatRelativeTime(ann.created_at)}</div>
                          <div className="text-xs text-gray-300 truncate mt-1">{ann.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400">No announcements yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        )}


        {activeTab === 'content' && (
          <Motion.div
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
                <HierarchicalLectureContent 
                  courseId={id}
                  isTeacher={false}
                />
              </div>
            )}
          </Motion.div>
        )}

        {activeTab === 'materials' && (
          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <StudentClassMaterialsTab courseId={id} />
          </Motion.div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No announcements yet</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for course updates</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-start gap-4">
                    <Megaphone className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{announcement.title}</h3>
                      <p className="text-gray-400 mb-4">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        {announcement.instructor && (
                          <span>By {announcement.instructor.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
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
          <Motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="modal-panel modal-panel--lg bg-gray-900 rounded-xl p-8 w-full border border-gray-800 max-h-[90vh] overflow-y-auto shadow-2xl"
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

            <form onSubmit={handleSubmitWork} className="space-y-6">
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
              <div className="bg-gray-800/50 border border-orange-500 rounded-lg p-4">
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
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

              {/* Upload progress bar */}
              {(uploadProgress > 0) && (
                <div className="mb-4">
                  <div className="w-full bg-gray-800 rounded h-3 overflow-hidden">
                    <div className="h-3 bg-blue-600" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{uploadProgress}% uploaded</div>
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
          </Motion.div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Assignments</h2>
              <p className="text-gray-400 text-sm">View assignments for this course</p>
            </div>
          </div>
          <div className="grid gap-4">
            {course.assignments && course.assignments.length > 0 ? (
              course.assignments.map((assignment) => (
                <Motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 dark:bg-gray-950 border-2 border-gray-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                        {assignment.description && (
                          <p className="text-gray-300 leading-relaxed mb-4">{assignment.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          {assignment.due_date && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} />
                              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FileText size={14} />
                            <span>Points: {assignment.max_points || 100}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {assignment.files && assignment.files.length > 0 && (
                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-sm font-semibold text-gray-200 mb-3">Attached Materials</h4>
                        <div className="space-y-2">
                          {assignment.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText size={16} className="text-blue-400" />
                                <span className="text-sm text-gray-300 truncate">{file.original_name || file.name}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewFileById(file.id)}
                                  className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownloadFileById(file.id, file.original_name || file.name)}
                                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Latest student submission (if any) */}
                    {(() => {
                      const latest = getLatestSubmission(assignment);
                      if (!latest) return null;
                      // Latest submission might be an object representing a submission or a file
                      const fileId = latest.id || latest.file_id || latest.file?.id || latest.file_id;
                      const fileName = latest.original_name || latest.name || latest.file?.original_name || latest.file?.name || latest.filename || latest.file_name || latest.file_name;
                      const submittedAt = latest.submitted_at || latest.created_at || latest.createdAt || latest.uploaded_at || latest.uploadedAt || latest.date;

                      return (
                        <div className="border-t border-gray-700 pt-4 mb-3">
                          <h4 className="text-sm font-semibold text-gray-200 mb-2">Your Latest Submission</h4>
                          <div className="flex items-center justify-between bg-gray-800/40 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText size={16} className="text-green-400" />
                              <div className="text-sm text-gray-200">
                                {fileName || 'Submission'}
                                <div className="text-xs text-gray-400">
                                  {submittedAt ? (
                                    <span title={new Date(submittedAt).toLocaleString()}>{formatRelativeTime(submittedAt)}</span>
                                  ) : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {fileId && (
                                <>
                                  <button
                                    onClick={() => handleViewFileById(fileId)}
                                    className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleDownloadFileById(fileId, fileName)}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                  >
                                    Download
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Action Buttons */}
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex gap-3">
                        {/* Download Assignment Files Button - Only if files exist */}
                        {(assignment.files && assignment.files.length > 0) && (
                          <button
                            onClick={() => {
                              if (assignment.files.length === 1) {
                                // Download single file directly
                                const file = assignment.files[0];
                                handleDownloadFileById(file.id, file.original_name || file.name);
                              } else {
                                // Show file choice modal for multiple files
                                setFileChoice({ 
                                  assignmentId: assignment.id, 
                                  files: assignment.files 
                                });
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition"
                            title="Download assignment files from instructor"
                          >
                            <Download size={16} />
                            Download Assignment ({assignment.files.length})
                          </button>
                        )}
                          {/* Visible assignment package download button (backend: /assignments/{id}/download) */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDownloadAssignment(assignment.id);
                            }}
                            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${downloadingMap[assignment.id] ? 'bg-gray-700 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            title="Download assignment package"
                          >
                            {downloadingMap[assignment.id] ? (
                              <>
                                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                                <span>Downloading...</span>
                              </>
                            ) : (
                              <>
                                <Download size={16} />
                                <span>Download Assignment</span>
                              </>
                            )}
                          </button>
                        
                        {/* Submit Assignment Button */}
                        <button
                          onClick={() => {
                            setCurrentAssignment(assignment);
                            setShowSubmissionModal(true);
                          }}
                          disabled={assignment.status === 'submitted' || assignment.status === 'graded'}
                          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                            assignment.status === 'submitted' || assignment.status === 'graded'
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          <Upload size={16} />
                          {assignment.status === 'submitted' ? 'Submitted' : 
                           assignment.status === 'graded' ? 'Graded' : 
                           'Submit Assignment'}
                        </button>
                      </div>
                      
                      {/* Status and Grade Display */}
                      {assignment.status && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'graded' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                            assignment.status === 'submitted' ? 'bg-blue-900/30 text-blue-400 border border-blue-700' :
                            assignment.status === 'late' ? 'bg-red-900/30 text-red-400 border border-red-700' :
                            'bg-gray-900/30 text-gray-400 border border-gray-700'
                          }`}>
                            Status: {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </div>
                          
                          {assignment.grade !== null && assignment.grade !== undefined && (
                            <div className="px-3 py-1 bg-purple-900/30 text-purple-400 border border-purple-700 rounded-full text-xs font-medium">
                              Grade: {assignment.grade}/{assignment.max_points || 100}
                            </div>
                          )}
                          
                          {assignment.submitted_date && (
                            <div className="text-gray-400 text-xs">
                              Submitted: {new Date(assignment.submitted_date).toLocaleDateString()}
                            </div>
                          )}
                          {(assignment.status === 'graded' || (assignment.grade !== null && assignment.grade !== undefined)) && (
                            <button
                              onClick={() => openGradedModal(assignment)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
                            >
                              View Result
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Motion.div>
              ))
            ) : (
              <div className="bg-gray-900 dark:bg-gray-950 border-2 border-dashed border-gray-700 rounded-xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No assignments yet</h3>
                <p className="text-gray-400">
                  Your instructor hasn't posted any assignments for this course yet.
                </p>
              </div>
            )}
          </div>
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
                  <Motion.div
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
                  </Motion.div>
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
              <div className="bg-gray-800/50 border border-orange-500 rounded-lg p-4 mb-6">
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
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
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
      {/* File choice modal for assignments with multiple files */}
      {fileChoice && (
        <div className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4`}>
          <div className="modal-panel modal-panel--md bg-gray-900 rounded-xl p-6 w-full border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Select a file to download</h3>
              <button onClick={() => setFileChoice(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {fileChoice.files.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-gray-800/40 p-3 rounded">
                  <div className="text-sm text-gray-200 truncate">{f.original_name || f.name || `File ${f.id}`}</div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setFileChoice(null); handleViewFileById(f.id); }} className="px-3 py-1.5 bg-gray-700 text-white rounded-lg">View</button>
                    <button type="button" onClick={() => { setFileChoice(null); handleDownloadFileById(f.id, f.original_name || f.name); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg">Download</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setFileChoice(null)} className="px-4 py-2 border rounded text-sm text-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {inlinePreviewUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="modal-panel modal-panel--xl bg-gray-900 rounded-xl p-6 w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Preview: {inlinePreviewName}</h3>
              <button onClick={() => { try { window.URL.revokeObjectURL(inlinePreviewUrl); } catch (err) { console.warn('revoke error', err); } setInlinePreviewUrl(null); setInlinePreviewName(null); setInlinePreviewType(null); }} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="bg-gray-900 p-2 rounded border border-gray-700">
              {inlinePreviewType === 'image' ? (
                <img src={inlinePreviewUrl} alt={inlinePreviewName} className="w-full h-[600px] object-contain rounded" />
              ) : inlinePreviewType === 'video' ? (
                <video src={inlinePreviewUrl} controls className="w-full h-[600px] rounded bg-black" />
              ) : (
                <iframe src={inlinePreviewUrl} title={inlinePreviewName} className="w-full h-[600px] rounded" />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Graded result modal */}
      {gradedModalAssignment && (
        <Modal
          isOpen={true}
          onClose={() => setGradedModalAssignment(null)}
          title={`Result: ${gradedModalAssignment.title}`}
          size="lg"
        >
          <Motion.div
            ref={gradedModalRef}
            tabIndex={-1}
            onKeyDown={(e) => { if (e.key === 'Escape') setGradedModalAssignment(null); }}
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Big Grade Badge */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl ring-4 ring-black/20">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-white">{gradedModalAssignment.grade ?? '-'}</div>
                      <div className="text-sm text-indigo-100/90">of {gradedModalAssignment.max_points || 100}</div>
                    </div>
                  </div>
                  {gradedModalAssignment.grade !== null && gradedModalAssignment.max_points ? (
                    <div className="text-center">
                      <div className="text-sm text-gray-300">Score</div>
                      <div className="text-lg font-semibold text-white">{Math.round((parseFloat(gradedModalAssignment.grade) / (gradedModalAssignment.max_points || 100)) * 100)}%</div>
                    </div>
                  ) : null}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${gradedModalAssignment.status === 'graded' ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-gray-800 text-gray-300'}`}>
                    {gradedModalAssignment.status ? (String(gradedModalAssignment.status).charAt(0).toUpperCase() + String(gradedModalAssignment.status).slice(1)) : 'Status'}
                  </div>
                </div>
              </div>

              {/* Middle: Feedback */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 border border-gray-800 rounded-lg p-6 shadow-inner">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                        {String((gradedModalAssignment.graded_by?.name || course?.faculty?.name || 'I').charAt(0)).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{gradedModalAssignment.graded_by?.name || course?.faculty?.name || 'Instructor'}</div>
                        <div className="text-xs text-gray-400">{gradedModalAssignment.graded_by?.title || course?.faculty?.title || ''}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-3">
                      {gradedModalAssignment.graded_at || gradedModalAssignment.graded_date ? (
                        <div className="text-xs text-gray-400">Graded on: {new Date(gradedModalAssignment.graded_at || gradedModalAssignment.graded_date).toLocaleString()}</div>
                      ) : null}
                      <button aria-label="Close result" onClick={() => setGradedModalAssignment(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">Instructor Feedback</h3>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                    {gradedModalAssignment.feedback || gradedModalAssignment.instructor_feedback || gradedModalAssignment.remarks || gradedModalAssignment.comments || 'No feedback provided.'}
                  </div>
                </div>

                {/* Files */}
                {(() => {
                  const files = gradedModalAssignment.graded_files || gradedModalAssignment.feedback_files || gradedModalAssignment.graded || (gradedModalAssignment.files && gradedModalAssignment.files.filter(f => f.is_feedback)) || null;
                  if (!files || (Array.isArray(files) && files.length === 0)) return null;
                  const fileArray = Array.isArray(files) ? files : [files];
                  return (
                    <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 border border-gray-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><FileText size={16} /> Files</h4>
                      <div className="space-y-3">
                        {fileArray.map((f) => (
                          <Motion.div
                            key={f.id || f.file_id || f.name}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between bg-gray-800/30 p-3 rounded-lg transition-shadow hover:shadow-lg"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-700 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                                {String((f.original_name || f.name || f.filename || '').charAt(0)).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm text-white truncate">{f.original_name || f.name || f.filename || `File ${f.id || f.file_id}`}</div>
                                {f.size && <div className="text-xs text-gray-400">{(f.size/1024/1024).toFixed(2)} MB</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button aria-label="View file" onClick={() => handleViewFileById(f.id || f.file_id)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg">
                                <Eye size={14} />
                                <span className="text-xs">View</span>
                              </button>
                              <button aria-label="Download file" onClick={() => handleDownloadFileById(f.id || f.file_id, f.original_name || f.name)} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg">
                                <Download size={14} />
                                <span className="text-xs">Download</span>
                              </button>
                            </div>
                          </Motion.div>
                        ))}
                      </div>
                    </div>
                  );
                  })()}

                  {/* Footer actions for modal */}
                  {(() => {
                    const files = gradedModalAssignment.graded_files || gradedModalAssignment.feedback_files || gradedModalAssignment.graded || (gradedModalAssignment.files && gradedModalAssignment.files.filter(f => f.is_feedback)) || null;
                    if (!files || (Array.isArray(files) && files.length === 0)) return (
                      <div className="mt-4 flex justify-end">
                        <button onClick={() => setGradedModalAssignment(null)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Close</button>
                      </div>
                    );
                    const fileArray = Array.isArray(files) ? files : [files];
                    return (
                      <div className="mt-4 flex justify-end gap-3">
                        <button onClick={() => handleDownloadMultiple(fileArray)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                          <Download size={14} />
                          Download All
                        </button>
                        <button onClick={() => setGradedModalAssignment(null)} className="px-4 py-2 bg-gray-700 text-white rounded-lg">Close</button>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </Motion.div>
        </Modal>
      )}
    </div>
  );
}

export default CourseDetail;

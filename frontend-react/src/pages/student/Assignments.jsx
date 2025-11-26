import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { Calendar, Clock, Upload, Download, FileText, Award, MessageSquare, CheckCircle, X, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { studentAPI, submissionAPI } from '../../services/api';
import { getFileTypeInfo } from '../../utils/fileUtils';

export default function Assignments() {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [file, setFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [inlinePreviewUrl, setInlinePreviewUrl] = useState(null);
  const [inlinePreviewName, setInlinePreviewName] = useState(null);
  const [inlinePreviewType, setInlinePreviewType] = useState(null); // 'pdf'|'image'|'video'|'other'
  const [fileChoice, setFileChoice] = useState(null); // { assignmentId, files: [...] }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyAssignments();
      if (response.success) {
        setAssignments(response.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setToast({ message: 'Failed to load assignments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Download an assignment file. If the assignment has multiple attached files
  // download the first file by default; otherwise fall back to the single
  // assignment file endpoint. You can pass either the assignment object or
 

  const handleDownloadFileById = async (fileId, fallbackName) => {
    try {
      const response = await studentAPI.downloadAssignmentFile(fileId);
      const blob = new Blob([response.data], { type: response.data?.type || response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = fallbackName || 'download';
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
      // Do not revoke immediately to allow user to view; revoke after a short timeout
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error viewing file by id:', error);
      setToast({ message: 'Failed to open file', type: 'error' });
    }
  };

  const handleViewInlineFileById = async (fileId, fallbackName) => {
    try {
      const response = await studentAPI.downloadAssignmentFile(fileId);
      const contentType = response.headers?.['content-type'] || '';
      const blob = new Blob([response.data], { type: contentType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      // Revoke any previous preview URL
      if (inlinePreviewUrl) {
        try { window.URL.revokeObjectURL(inlinePreviewUrl); } catch { /* ignore */ }
      }
      setInlinePreviewUrl(url);
      setInlinePreviewName(fallbackName || 'Preview');

      // determine preview type from content-type or fallback to extension
      let ptype = 'other';
      if (/^application\/pdf/i.test(contentType) || /\.pdf$/i.test(fallbackName || '')) ptype = 'pdf';
      else if (/^image\//i.test(contentType) || /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(fallbackName || '')) ptype = 'image';
      else if (/^video\//i.test(contentType) || /\.(mp4|webm|ogg|mov)$/i.test(fallbackName || '')) ptype = 'video';

      setInlinePreviewType(ptype);

      // Keep the blob alive for a minute, then revoke
      setTimeout(() => {
        try { window.URL.revokeObjectURL(url); } catch (e) {}
      }, 60000);
    } catch (error) {
      console.error('Error creating inline preview:', error);
      setToast({ message: 'Failed to create preview', type: 'error' });
    }
  };

  const handleDownloadSubmissionFile = async (submissionId, fallbackName) => {
    try {
      const response = await submissionAPI.download(submissionId);
      // submissionAPI.download returns {success:true} after doing the download in some places,
      // but here studentAPI.download returns blob response; ensure we handle both.
      if (response && response.data) {
        const blob = new Blob([response.data], { type: response.data?.type || response.headers['content-type'] || 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = response.headers['content-disposition'];
        let filename = fallbackName || 'submission-download';
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
      }
      setToast({ message: 'Submission downloaded', type: 'success' });
    } catch (error) {
      console.error('Error downloading submission file:', error);
      setToast({ message: 'Failed to download submission', type: 'error' });
    }
  };

  // Open the read-only view modal for an assignment
  const openViewModal = (assignment) => {
    setSelectedAssignment(assignment);
    // Open the details/results modal (read-only)
    setIsResultsModalOpen(true);
    // reset any inline preview state
    setInlinePreviewUrl(null);
    setInlinePreviewName(null);
    setInlinePreviewType(null);
  };

  // Open the submit modal (reuses the same modal UI)
  const openSubmissionModal = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
    setFile(null);
    setSubmissionText('');
  };

  // Open the results/details modal
  const openResultsModal = (assignment) => {
    setSelectedAssignment(assignment);
    setIsResultsModalOpen(true);
  };

  // Download assignment - prefer the per-file record if available
  const handleDownloadAssignment = async (assignment) => {
    try {
      if (assignment.files && assignment.files.length > 0) {
        const f = assignment.files[0];
        return await handleDownloadFileById(f.id, f.original_name || f.stored_name || f.file_path);
      }

      // Fallback: call the older assignment download endpoint
      const response = await studentAPI.downloadAssignment(assignment.id);
      // Otherwise assume binary blob
      const blob = new Blob([response.data], { type: response.data?.type || response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = assignment.title || 'assignment-download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) filename = decodeURIComponent(filenameMatch[1]);
        else {
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
      // If backend returned 409 with JSON listing files, present file choice
      if (error.response && error.response.status === 409 && error.response.data && error.response.data.files) {
        setFileChoice({ assignmentId: assignment.id, files: error.response.data.files });
        return;
      }

      console.error('Error downloading assignment:', error);
      setToast({ message: 'Failed to download assignment', type: 'error' });
    }
  };

  // Handle submit from the modal form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submissionText && !file) {
      setToast({ message: 'Please provide text or a file before submitting', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('assignment_id', selectedAssignment.id);
    if (submissionText) formData.append('submission_text', submissionText);
    if (file) formData.append('file', file);

    try {
      setUploading(true);
      setUploadProgress(0);

      await studentAPI.submitAssignment(formData, {
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      setToast({ message: 'Submitted successfully', type: 'success' });
      setIsModalOpen(false);
      setFile(null);
      setSubmissionText('');
      setUploadProgress(0);
      // refresh list
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment from modal:', error);
      setToast({ message: (error.response?.data?.message) || 'Failed to submit assignment', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (assignment.has_submitted) {
      if (assignment.grade !== null && assignment.grade !== undefined) {
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      } else if (assignment.can_resubmit) {
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      } else {
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      }
    } else {
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    }
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white">Assignments</h1>
        <p className="text-sm text-gray-400 mt-1">Track and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: assignments.length, color: 'orange' },
          { label: 'Pending', value: assignments.filter(a => !a.has_submitted).length, color: 'yellow' },
          { label: 'Submitted', value: assignments.filter(a => a.has_submitted && !a.can_resubmit && (!a.grade || a.grade === null)).length, color: 'blue' },
          { label: 'Resubmit', value: assignments.filter(a => a.can_resubmit).length, color: 'purple' },
          { label: 'Graded', value: assignments.filter(a => a.grade !== null && a.grade !== undefined).length, color: 'green' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Assignments List */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <Upload size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No assignments available yet</p>
            <p className="text-sm text-gray-500 mt-2">Assignments will appear here once your instructors post them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Assignment
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Course
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Due Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Points
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {assignments.map((assignment, index) => (
                <motion.tr
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-800/60 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group"
                >
                  <td className="py-5 px-6">
                    <div>
                      <p className="font-semibold text-sm text-white group-hover:text-orange-400 transition-colors duration-300">
                        {assignment.title}
                      </p>
                      {(assignment.file_path || (assignment.files && assignment.files.length > 0)) && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {assignment.files && assignment.files.length > 0 ? (
                            <div className={`px-2 py-0.5 rounded border flex items-center gap-1 ${getFileTypeInfo(assignment.files[0].original_name || assignment.files[0].stored_name || assignment.files[0].file_path || '').bgColor} ${getFileTypeInfo(assignment.files[0].original_name || assignment.files[0].stored_name || assignment.files[0].file_path || '').borderColor}`}>
                              <span className="text-xs">{getFileTypeInfo(assignment.files[0].original_name || assignment.files[0].stored_name || assignment.files[0].file_path || '').icon}</span>
                              <span className={`text-[10px] font-semibold ${getFileTypeInfo(assignment.files[0].original_name || assignment.files[0].stored_name || assignment.files[0].file_path || '').color}`}>
                                {getFileTypeInfo(assignment.files[0].original_name || assignment.files[0].stored_name || assignment.files[0].file_path || '').category}
                              </span>
                            </div>
                          ) : (
                            <div className={`px-2 py-0.5 rounded border flex items-center gap-1 ${getFileTypeInfo(assignment.file_path).bgColor} ${getFileTypeInfo(assignment.file_path).borderColor}`}>
                              <span className="text-xs">{getFileTypeInfo(assignment.file_path).icon}</span>
                              <span className={`text-[10px] font-semibold ${getFileTypeInfo(assignment.file_path).color}`}>
                                {getFileTypeInfo(assignment.file_path).category}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {!assignment.has_submitted && (
                        <p className="text-xs text-orange-400 mt-1 flex items-center gap-1 group-hover:text-orange-300 transition-colors">
                          <Clock size={12} className="inline" />
                          {getDaysRemaining(assignment.due_date)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {assignment.course?.name || assignment.course}
                  </td>
                  <td className="py-5 px-6 text-sm text-gray-300 group-hover:text-white transition-colors">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-500 group-hover:text-orange-400 transition-colors" />
                      {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-white font-semibold">
                    {assignment.grade !== null && assignment.grade !== undefined ? (
                      <span className="text-green-400 group-hover:text-green-300 transition-colors">
                        {assignment.grade}/{assignment.max_points}
                      </span>
                    ) : (
                      <span className="group-hover:text-orange-400 transition-colors">{assignment.max_points}</span>
                    )}
                  </td>
                  <td className="py-5 px-6">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium transition-all ${getStatusBadge(assignment)}`}>
                      {!assignment.has_submitted && 'Pending'}
                      {assignment.has_submitted && !assignment.can_resubmit && (!assignment.grade || assignment.grade === null) && 'Submitted'}
                      {assignment.has_submitted && assignment.can_resubmit && 'Resubmit Available'}
                      {assignment.grade !== null && assignment.grade !== undefined && 'Graded'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openViewModal(assignment)}
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm font-semibold transition-all duration-300"
                        title="View Assignment"
                      >
                        View
                      </button>

                      {/* Download Assignment Button - Always show if file exists */}
                      {(assignment.file_path || (assignment.files && assignment.files.length > 0)) && (
                        <button
                          onClick={() => handleDownloadAssignment(assignment)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 hover:shadow-md text-sm font-semibold transition-all duration-300 flex items-center gap-1"
                          title="Download Assignment"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline">Download</span>
                        </button>
                      )}
                      
                      {/* Submit/View Results Button */}
                      {(!assignment.has_submitted || assignment.can_resubmit) && (
                        <button
                          onClick={() => openSubmissionModal(assignment)}
                          className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-md ${
                            assignment.can_resubmit 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                          disabled={assignment.has_submitted && !assignment.can_resubmit}
                        >
                          {assignment.can_resubmit ? 'Resubmit' : 'Submit'}
                        </button>
                      )}
                      {assignment.has_submitted && !assignment.can_resubmit && (
                        <span className="text-sm text-gray-500 font-medium group-hover:text-gray-400 transition-colors flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-400" />
                          Submitted
                        </span>
                      )}
                      {assignment.grade !== null && assignment.grade !== undefined && (
                        <button 
                          onClick={() => openResultsModal(assignment)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 hover:scale-105 text-sm font-semibold transition-all duration-300 shadow-lg shadow-green-900/30 hover:shadow-green-900/50"
                        >
                          View Results
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFile(null);
          setSubmissionText('');
        }}
        title="Submit Assignment"
      >
        {selectedAssignment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Assignment Updated Notice */}
            {selectedAssignment.can_resubmit && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-purple-400 mb-1">
                      Assignment Updated by Faculty
                    </h4>
                    <p className="text-sm text-purple-300/80">
                      This assignment has been modified by the faculty after your submission. Please review the changes and resubmit your work.
                    </p>
                    {selectedAssignment.updated_by_faculty_at && (
                      <p className="text-xs text-purple-400/60 mt-2">
                        Updated: {new Date(selectedAssignment.updated_by_faculty_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedAssignment.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAssignment.description}
              </p>
                {selectedAssignment.files && selectedAssignment.files.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedAssignment.files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 p-2 bg-gray-800/30 rounded">
                        <div className="text-sm text-gray-200 truncate">{f.original_name}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewFileById(f.id)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm transition"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFileById(f.id, f.original_name)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                          >
                            <Download size={14} />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedAssignment.file_path ? (
                <button
                  type="button"
                  onClick={() => handleDownloadAssignment(selectedAssignment)}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                >
                  <Download size={16} />
                  Download Assignment File
                </button>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Submission Text (Optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={4}
                placeholder="Enter your submission text or notes here..."
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File (Optional)
              </label>
              <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                />
                {file && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {uploading && (
                <div className="w-full mb-2">
                  <div className="text-sm text-gray-300 mb-1">Uploading: {uploadProgress}%</div>
                  <div className="w-full bg-gray-700 rounded h-2 overflow-hidden">
                    <div className="bg-blue-500 h-2" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                  setSubmissionText('');
                }}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                  selectedAssignment.can_resubmit
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={16} className="animate-spin" />
                    <span>Uploading {uploadProgress}%</span>
                  </span>
                ) : (
                  selectedAssignment.can_resubmit 
                    ? 'Resubmit Assignment' 
                    : 'Submit Assignment'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Results Modal */}
      {selectedAssignment && (
        <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity ${isResultsModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isResultsModalOpen ? 1 : 0, scale: isResultsModalOpen ? 1 : 0.95 }}
            className="bg-gray-900 rounded-xl p-8 max-w-3xl w-full border border-gray-800 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Award size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{(selectedAssignment && (selectedAssignment.grade !== null && selectedAssignment.grade !== undefined)) ? 'Assignment Results' : 'Assignment Details'}</h3>
                    <p className="text-gray-400 text-sm mt-0.5">{selectedAssignment.title}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsResultsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                title="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Assignment Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">📋 Assignment Details</label>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Course:</span>
                      <span className="text-sm font-medium text-white">{selectedAssignment.course?.name || selectedAssignment.course}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Due Date:</span>
                      <span className="text-sm font-medium text-white flex items-center gap-1"><Calendar size={14} />{new Date(selectedAssignment.due_date).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Submitted:</span>
                      <span className="text-sm font-medium text-white flex items-center gap-1"><CheckCircle size={14} className="text-green-400" />{selectedAssignment.submitted_at ? new Date(selectedAssignment.submitted_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Graded On:</span>
                      <span className="text-sm font-medium text-white">{selectedAssignment.graded_at ? new Date(selectedAssignment.graded_at).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Your Submission */}
                {selectedAssignment.submission_text && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">📝 Your Submission</label>
                    <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4"><p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedAssignment.submission_text}</p></div>
                  </div>
                )}

                {/* Submitted File */}
                {selectedAssignment.submission && selectedAssignment.submission.file_path ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">📎 Submitted File</label>
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-lg hover:border-blue-600/50 transition">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0"><FileText size={20} className="text-blue-400" /></div>
                      <span className="text-sm text-gray-300 flex-1 font-medium truncate">{selectedAssignment.submission.file_path.split('/').pop()}</span>
                      <button type="button" onClick={() => handleDownloadSubmissionFile(selectedAssignment.submission.id, selectedAssignment.submission.file_path.split('/').pop())} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm hover:shadow-md"><Download size={16} /> Download</button>
                    </div>
                  </div>
                ) : selectedAssignment.submission && !selectedAssignment.submission.file_path ? (
                  <div className="text-sm text-gray-400">No submitted file</div>
                ) : null}

                {/* Instructor Posted Files */}
                {selectedAssignment.files && selectedAssignment.files.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">📁 Materials Posted by Instructor</label>
                    <div className="space-y-2">
                      {selectedAssignment.files.map((f) => (
                        <div key={f.id} className="flex items-center justify-between gap-3 p-3 bg-gray-800/40 rounded">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700/30 rounded-lg flex items-center justify-center">
                              <FileText size={18} className="text-gray-300" />
                            </div>
                            <div className="text-sm text-gray-200 truncate">{f.original_name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/\.pdf$/i.test(f.original_name) && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Prefer using public file_url for inline preview if available
                                  if (f.file_url && (f.mime && /pdf|image|video/.test(f.mime))) {
                                    const ptype = /^image\//i.test(f.mime) ? 'image' : /^video\//i.test(f.mime) ? 'video' : (/pdf/i.test(f.mime) ? 'pdf' : 'other');
                                    setInlinePreviewUrl(f.file_url);
                                    setInlinePreviewName(f.original_name);
                                    setInlinePreviewType(ptype);
                                  } else {
                                    handleViewInlineFileById(f.id, f.original_name);
                                  }
                                }}
                                className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm transition"
                                title="Preview PDF"
                              >
                                Preview
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleViewFileById(f.id)}
                              className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm transition"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFileById(f.id, f.original_name)}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inlinePreviewUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">🔍 Preview: {inlinePreviewName}</label>
                    <div className="bg-gray-900 p-2 rounded border border-gray-700">
                      <div className="flex justify-end mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            try { window.URL.revokeObjectURL(inlinePreviewUrl); } catch { /* ignore */ }
                            setInlinePreviewUrl(null);
                            setInlinePreviewName(null);
                          }}
                          className="text-sm text-gray-400 hover:text-white"
                        >
                          Close Preview
                        </button>
                      </div>
                      {/* render based on detected type */}
                      {inlinePreviewType === 'image' ? (
                        <img src={inlinePreviewUrl} alt={inlinePreviewName} className="w-full h-[600px] object-contain rounded" />
                      ) : inlinePreviewType === 'video' ? (
                        <video src={inlinePreviewUrl} controls className="w-full h-[600px] rounded bg-black" />
                      ) : (
                        <iframe src={inlinePreviewUrl} title={inlinePreviewName} className="w-full h-[600px] rounded" />
                      )}
                    </div>
                  </div>
                )}

                {/* Instructor Feedback */}
                {selectedAssignment.feedback && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">💬 Instructor Feedback</label>
                    <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-4"><div className="flex items-start gap-3"><MessageSquare size={20} className="text-orange-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{selectedAssignment.feedback}</p></div></div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700"><button onClick={() => setIsResultsModalOpen(false)} className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30">Close</button></div>
              </div>

              <div className="lg:col-span-1">
                {(selectedAssignment.grade !== null && selectedAssignment.grade !== undefined) ? (
                  <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-6">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-300 mb-2">Your Grade</p>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl font-bold text-green-400">
                          {(() => {
                            const gradeNum = Number(selectedAssignment.grade);
                            return !isNaN(gradeNum) ? gradeNum.toFixed(2) : 'N/A';
                          })()}
                        </span>
                        <span className="text-xl text-gray-400">/ {selectedAssignment.max_points}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {(() => {
                          const gradeNum = Number(selectedAssignment.grade);
                          const maxPoints = Number(selectedAssignment.max_points);
                          let percent = !isNaN(gradeNum) && !isNaN(maxPoints) && maxPoints > 0 ? (gradeNum / maxPoints) * 100 : null;
                          let label = '';
                          let labelClass = '';
                          if (percent === null) {
                            label = 'N/A';
                            labelClass = 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
                          } else if (percent >= 90) {
                            label = 'Excellent';
                            labelClass = 'bg-green-500/20 text-green-400 border border-green-500/30';
                          } else if (percent >= 75) {
                            label = 'Good';
                            labelClass = 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
                          } else if (percent >= 60) {
                            label = 'Fair';
                            labelClass = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                          } else {
                            label = 'Needs Improvement';
                            labelClass = 'bg-red-500/20 text-red-400 border border-red-500/30';
                          }
                          return (
                            <>
                              <div className={`px-4 py-2 rounded-lg font-semibold ${labelClass}`}>
                                {label}
                              </div>
                              <span className="text-gray-400">
                                {percent !== null ? `(${Math.round(percent)}%)` : ''}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 text-center text-sm text-gray-300">
                    No grade yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* File choice modal for assignments with multiple files */}
      {fileChoice && (
        <div className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4`}>
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg border border-gray-800">
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
    </div>
  );
}

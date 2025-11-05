import { useState, useEffect } from 'react';
import { Calendar, Clock, Upload, Download, FileText, Award, MessageSquare, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import { studentAPI } from '../../services/api';

export default function Assignments() {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [file, setFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleDownloadAssignment = async (assignmentId, assignmentTitle) => {
    try {
      const response = await studentAPI.downloadAssignment(assignmentId);
      
      // Create blob and download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${assignmentTitle}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setToast({ message: 'Assignment downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error downloading assignment:', error);
      setToast({ message: 'Failed to download assignment', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submit handler called');
    console.log('Selected Assignment:', selectedAssignment);
    console.log('File:', file);
    console.log('Submission Text:', submissionText);
    
    // For resubmission, we need at least file OR text
    // For first submission, same requirement
    if (!file && !submissionText) {
      setToast({ 
        message: selectedAssignment.status === 'updated' 
          ? 'Please provide a file or submission text for your resubmission' 
          : 'Please provide a file or submission text', 
        type: 'error' 
      });
      return;
    }

    try {
      setSubmitting(true);
      console.log('Submitting assignment...');
      
      const result = await studentAPI.submitAssignment({
        assignment_id: selectedAssignment.id,
        submission_text: submissionText,
        file: file,
      });
      
      console.log('Submission result:', result);
      
      setToast({ 
        message: selectedAssignment.status === 'updated'
          ? 'Assignment resubmitted successfully!' 
          : 'Assignment submitted successfully!', 
        type: 'success' 
      });
      setIsModalOpen(false);
      setFile(null);
      setSubmissionText('');
      
      // Refresh assignments
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      console.error('Error details:', error.response?.data);
      setToast({ 
        message: error.response?.data?.message || 'Failed to submit assignment', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResults = (assignment) => {
    setSelectedAssignment(assignment);
    setIsResultsModalOpen(true);
  };

  const getGradeColor = (grade, maxPoints) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-blue-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeLabel = (grade, maxPoints) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const getStatusBadge = (assignment) => {
    const styles = {
      pending: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      graded: 'bg-green-500/10 text-green-400 border border-green-500/20',
      late: 'bg-red-500/10 text-red-400 border border-red-500/20',
      updated: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    };
    return styles[assignment.status] || styles.pending;
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
          { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, color: 'yellow' },
          { label: 'Submitted', value: assignments.filter(a => a.status === 'submitted').length, color: 'blue' },
          { label: 'Updated', value: assignments.filter(a => a.status === 'updated').length, color: 'purple' },
          { label: 'Graded', value: assignments.filter(a => a.status === 'graded').length, color: 'green' },
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
                      {assignment.status === 'pending' && (
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
                    {assignment.status === 'graded' ? (
                      <span className="text-green-400 group-hover:text-green-300 transition-colors">
                        {assignment.grade}/{assignment.max_points}
                      </span>
                    ) : (
                      <span className="group-hover:text-orange-400 transition-colors">{assignment.max_points}</span>
                    )}
                  </td>
                  <td className="py-5 px-6">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium transition-all ${getStatusBadge(assignment)}`}>
                      {assignment.status === 'pending' && 'Pending'}
                      {assignment.status === 'submitted' && 'Submitted'}
                      {assignment.status === 'updated' && 'Updated - Resubmit'}
                      {assignment.status === 'graded' && 'Graded'}
                      {assignment.status === 'late' && 'Late'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      {/* Download Assignment Button - Always show if file exists */}
                      {assignment.file_path && (
                        <button
                          onClick={() => handleDownloadAssignment(assignment.id, assignment.title)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 hover:shadow-md text-sm font-semibold transition-all duration-300 flex items-center gap-1"
                          title="Download Assignment"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      )}
                      
                      {/* Submit/View Results Button */}
                      {(assignment.status === 'pending' || assignment.status === 'updated') && (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsModalOpen(true);
                          }}
                          className={`px-4 py-2 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-md ${
                            assignment.status === 'updated' 
                              ? 'bg-purple-600 hover:bg-purple-700' 
                              : 'bg-orange-500 hover:bg-orange-600'
                          }`}
                        >
                          {assignment.status === 'updated' ? 'Resubmit' : 'Submit'}
                        </button>
                      )}
                      {assignment.status === 'submitted' && (
                        <span className="text-sm text-gray-500 font-medium group-hover:text-gray-400 transition-colors">
                          Submitted
                        </span>
                      )}
                      {assignment.status === 'graded' && (
                        <button 
                          onClick={() => handleViewResults(assignment)}
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
            {selectedAssignment.status === 'updated' && (
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
              {selectedAssignment.file_path && (
                <button
                  type="button"
                  onClick={() => handleDownloadAssignment(selectedAssignment.id, selectedAssignment.title)}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition"
                >
                  <Download size={16} />
                  Download Assignment File
                </button>
              )}
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
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedAssignment.status === 'updated'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {submitting 
                  ? 'Submitting...' 
                  : selectedAssignment.status === 'updated' 
                    ? 'Resubmit Assignment' 
                    : 'Submit Assignment'}
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
                    <h3 className="text-2xl font-bold text-white">Assignment Results</h3>
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

            <div className="space-y-6">
              {/* Grade Display */}
              <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Your Grade</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className={`text-6xl font-bold ${getGradeColor(selectedAssignment.grade, selectedAssignment.max_points)}`}>
                      {selectedAssignment.grade}
                    </span>
                    <span className="text-3xl text-gray-400">/ {selectedAssignment.max_points}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className={`px-4 py-2 rounded-lg font-semibold ${
                      (selectedAssignment.grade / selectedAssignment.max_points) * 100 >= 90
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : (selectedAssignment.grade / selectedAssignment.max_points) * 100 >= 80
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : (selectedAssignment.grade / selectedAssignment.max_points) * 100 >= 70
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {getGradeLabel(selectedAssignment.grade, selectedAssignment.max_points)}
                    </div>
                    <span className="text-gray-400">
                      ({Math.round((selectedAssignment.grade / selectedAssignment.max_points) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  📋 Assignment Details
                </label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Course:</span>
                    <span className="text-sm font-medium text-white">{selectedAssignment.course?.name || selectedAssignment.course}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Due Date:</span>
                    <span className="text-sm font-medium text-white flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(selectedAssignment.due_date).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Submitted:</span>
                    <span className="text-sm font-medium text-white flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-400" />
                      {selectedAssignment.submitted_at 
                        ? new Date(selectedAssignment.submitted_at).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Graded On:</span>
                    <span className="text-sm font-medium text-white">
                      {selectedAssignment.graded_at 
                        ? new Date(selectedAssignment.graded_at).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Your Submission */}
              {selectedAssignment.submission_text && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    📝 Your Submission
                  </label>
                  <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-4">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedAssignment.submission_text}
                    </p>
                  </div>
                </div>
              )}

              {/* Submitted File */}
              {selectedAssignment.file_path && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    📎 Submitted File
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-900/20 to-blue-800/20 border border-blue-700/50 rounded-lg hover:border-blue-600/50 transition">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-blue-400" />
                    </div>
                    <span className="text-sm text-gray-300 flex-1 font-medium truncate">
                      {selectedAssignment.file_path.split('/').pop()}
                    </span>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm hover:shadow-md"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>
              )}

              {/* Instructor Feedback */}
              {selectedAssignment.feedback && (
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    💬 Instructor Feedback
                  </label>
                  <div className="bg-orange-900/10 border border-orange-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedAssignment.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => setIsResultsModalOpen(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition font-medium shadow-lg shadow-orange-900/30"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

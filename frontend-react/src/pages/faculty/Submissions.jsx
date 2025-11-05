import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Check,
  X,
  Clock,
  FileText,
  Calendar
} from 'lucide-react';
import { submissionAPI, courseAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';

export default function FacultySubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '', status: 'graded' });

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterCourse]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterCourse !== 'all') params.course_id = filterCourse;
      
      const submissionsData = await submissionAPI.getAll(params);
      console.log('Fetched submissions:', submissionsData);
      setSubmissions(submissionsData.submissions || []);
      
      const coursesData = await courseAPI.getAll();
      setCourses(coursesData.courses || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to load submissions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSubmission = async (submissionId, studentName) => {
    try {
      await submissionAPI.download(submissionId);
      setToast({ 
        message: `Downloaded ${studentName}'s submission successfully!`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error downloading submission:', error);
      setToast({ 
        message: 'Failed to download submission file.', 
        type: 'error' 
      });
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradeData.grade || gradeData.grade < 0 || gradeData.grade > 100) {
      setToast({ message: 'Please enter a valid grade (0-100)', type: 'error' });
      return;
    }

    try {
      await submissionAPI.grade(selectedSubmission.id, gradeData);
      setToast({ message: 'Submission graded successfully!', type: 'success' });
      setIsGradingModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error grading submission:', error);
      setToast({ message: 'Failed to grade submission', type: 'error' });
    }
  };

  const openGradingModal = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({ 
      grade: submission.grade || '', 
      feedback: submission.feedback || '', 
      status: 'graded' 
    });
    setIsGradingModalOpen(true);
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.assignment_title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'graded':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'returned':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Submissions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and grade student work
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Submissions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {submissions.length}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {submissions.filter(s => s.status === 'submitted').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Graded</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {submissions.filter(s => s.status === 'graded').length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student or assignment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="submitted">Pending</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading submissions...</p>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No submissions found</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
              {searchTerm ? 'Try adjusting your search or filters' : 'Students will appear here once they submit assignments'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSubmissions.map((submission, index) => (
                <motion.tr
                  key={submission.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={submission.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.student_name || 'Student')}&background=f97316&color=fff`}
                        alt={submission.student_name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.student_name || 'Student')}&background=f97316&color=fff`;
                        }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {submission.student_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {submission.student_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {submission.assignment_title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {submission.grade !== null ? (
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {submission.grade}%
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Not graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openGradingModal(submission)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Grade"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      {submission.file_path && (
                        <button
                          onClick={() => handleDownloadSubmission(submission.id, submission.student_name)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Download Submission"
                        >
                          <Download className="w-4 h-4" />
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

      {/* Grading Modal */}
      <Modal isOpen={isGradingModalOpen} onClose={() => setIsGradingModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Grade Submission
          </h3>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Student</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedSubmission.student_name}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Assignment</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedSubmission.assignment_title}
                </p>
              </div>

              {selectedSubmission.submission_text && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Student's Response</p>
                  <div className="max-h-96 overflow-y-auto">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedSubmission.submission_text}
                    </p>
                  </div>
                </div>
              )}

              {selectedSubmission.file_path && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        Attachment included
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadSubmission(selectedSubmission.id, selectedSubmission.student_name)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeData.grade}
                  onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Enter grade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feedback
                </label>
                <textarea
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="Enter feedback for the student..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGradeSubmission}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium"
                >
                  Submit Grade
                </button>
                <button
                  onClick={() => setIsGradingModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

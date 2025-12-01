import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { submissionAPI, courseAPI } from '../../services/api';
import StudentSubmissionsTable from '../../components/StudentSubmissionsTable';
import Modal from '../../components/ui/Modal';

export default function FacultySubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [gradeError, setGradeError] = useState('');
  // Toast and modal logic now handled in StudentSubmissionsTable

  const handleDownloadSubmission = async (submissionId) => {
    try {
      await submissionAPI.download(submissionId);
    } catch {
      // Optionally handle download error
    }
  };

  const handleRejectSubmission = async (submissionId) => {
    try {
      await submissionAPI.reject(submissionId);
      fetchData();
    } catch {
      // Optionally handle reject error
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    const res = await Swal.fire({
      title: 'Delete submission',
      text: 'Are you sure you want to delete this submission? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      await submissionAPI.delete(submissionId);
      fetchData();
      Swal.fire({ title: 'Deleted', text: 'Submission deleted', icon: 'success', timer: 1400, showConfirmButton: false });
    } catch (err) {
      console.error('Delete error', err);
      Swal.fire({ title: 'Error', text: 'Failed to delete submission', icon: 'error' });
    }
  };

  const handleGradeSubmission = async (submission) => {
    setGradingSubmission(submission);
    setGradeForm({
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setGradeError('');
    setShowGradeModal(true);
  };

  const submitGrade = async () => {
    try {
      const gradeValue = parseFloat(gradeForm.grade);
      
      // Validation
      if (!gradeForm.grade || gradeForm.grade === '') {
        setGradeError('Please enter a grade');
        return;
      }
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        setGradeError('Please enter a valid grade between 0 and 100');
        return;
      }

      await submissionAPI.grade(gradingSubmission.id, {
        grade: parseInt(gradeValue),
        feedback: gradeForm.feedback || ''
      });
      
      setShowGradeModal(false);
      setGradingSubmission(null);
      setGradeForm({ grade: '', feedback: '' });
      fetchData(); // Refresh the submissions list
      
      Swal.fire({ 
        title: 'Graded', 
        text: 'Submission graded successfully', 
        icon: 'success', 
        timer: 1400, 
        showConfirmButton: false 
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      setGradeError('Failed to grade submission. Please try again.');
    }
  };

  const fetchData = useCallback(async () => {
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
      // Optionally handle error notification here
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCourse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Duplicate handleDownloadSubmission, handleGradeSubmission, and openGradingModal removed



  return (
    <>
      <StudentSubmissionsTable
        submissions={submissions}
        courses={courses}
        onDownload={handleDownloadSubmission}
        onGrade={handleGradeSubmission}
        onReject={handleRejectSubmission}
        onDelete={handleDeleteSubmission}
        loading={loading}
        showFilters={true}
        showStats={true}
        filterCourse={filterCourse}
        setFilterCourse={setFilterCourse}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Grade Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => {
          setShowGradeModal(false);
          setGradingSubmission(null);
          setGradeForm({ grade: '', feedback: '' });
          setGradeError('');
        }}
        title={`Grade Submission - ${gradingSubmission?.student_name}`}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grade (0-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={gradeForm.grade}
              onChange={(e) => {
                setGradeForm({ ...gradeForm, grade: e.target.value });
                setGradeError('');
              }}
              placeholder="Enter grade (0-100)"
              className={`w-full px-4 py-3 bg-gray-800 border ${
                gradeError ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition`}
            />
            {gradeError && (
              <p className="mt-2 text-sm text-red-400">{gradeError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Feedback (optional)
            </label>
            <textarea
              value={gradeForm.feedback}
              onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
              placeholder="Provide feedback to the student..."
              rows="5"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={submitGrade}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30"
            >
              Submit Grade
            </button>
            <button
              onClick={() => {
                setShowGradeModal(false);
                setGradingSubmission(null);
                setGradeForm({ grade: '', feedback: '' });
                setGradeError('');
              }}
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

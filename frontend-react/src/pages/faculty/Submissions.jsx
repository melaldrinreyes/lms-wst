import { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { submissionAPI, courseAPI } from '../../services/api';
import StudentSubmissionsTable from '../../components/StudentSubmissionsTable';

export default function FacultySubmissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const { value: grade } = await Swal.fire({
        title: `Enter grade for ${submission.student_name}`,
        input: 'number',
        inputAttributes: { min: 0, max: 100, step: 1 },
        inputValue: submission.grade || '',
        showCancelButton: true,
        confirmButtonText: 'Next',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (value === '' || value === null) return 'Please enter a grade';
          const n = Number(value);
          if (isNaN(n) || n < 0 || n > 100) return 'Please enter a valid grade between 0 and 100.';
        }
      });
      if (grade === undefined || grade === null) return; // cancelled

      const { value: feedback } = await Swal.fire({
        title: 'Enter feedback (optional)',
        input: 'textarea',
        inputValue: submission.feedback || '',
        showCancelButton: true,
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel'
      });

      await submissionAPI.grade(submission.id, {
        grade: parseInt(grade),
        feedback: feedback || ''
      });
      fetchData(); // Refresh the submissions list
      Swal.fire({ title: 'Graded', text: 'Submission graded successfully', icon: 'success', timer: 1400, showConfirmButton: false });
    } catch (error) {
      console.error('Error grading submission:', error);
      Swal.fire({ title: 'Error', text: 'Failed to grade submission. Please try again.', icon: 'error' });
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
  );
}

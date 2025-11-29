import { useState, useEffect, useCallback } from 'react';
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
    if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      try {
        await submissionAPI.delete(submissionId);
        fetchData();
      } catch {
        // Optionally handle delete error
      }
    }
  };

  const handleGradeSubmission = async (submission) => {
    const grade = prompt(`Enter grade for ${submission.student_name}'s submission (0-100):`, submission.grade || '');
    if (grade === null) return; // User cancelled

    const numericGrade = parseInt(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      alert('Please enter a valid grade between 0 and 100.');
      return;
    }

    const feedback = prompt('Enter feedback (optional):', submission.feedback || '');

    try {
      await submissionAPI.grade(submission.id, {
        grade: numericGrade,
        feedback: feedback || ''
      });
      fetchData(); // Refresh the submissions list
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Failed to grade submission. Please try again.');
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

import { useState, useEffect } from 'react';
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

  const handleDownloadSubmission = async (submissionId, studentName) => {
    try {
      await submissionAPI.download(submissionId);
    } catch (error) {
      // Optionally handle download error
    }
  };

  const handleGradeSubmission = async (submission, gradeData) => {
    try {
      await submissionAPI.grade(submission.id, gradeData);
      fetchData();
    } catch (error) {
      // Optionally handle grade error
    }
  };

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

  // Duplicate handleDownloadSubmission, handleGradeSubmission, and openGradingModal removed

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
    <StudentSubmissionsTable
      submissions={submissions}
      courses={courses}
      onDownload={handleDownloadSubmission}
      onGrade={handleGradeSubmission}
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

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

  const handleGradeSubmission = async (submission, gradeData) => {
    try {
      await submissionAPI.grade(submission.id, gradeData);
      fetchData();
    } catch {
      // Optionally handle grade error
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

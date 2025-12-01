import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Bell, User, Megaphone, Clock, AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, DownloadCloud, ChevronUp } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { studentAPI, announcementAPI, assignmentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { SkeletonList } from '../../components/ui/Skeleton';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); // Store all assignments
  const [downloadingMap, setDownloadingMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [classesError, setClassesError] = useState(null);
  const assignmentsPerPage = 5;
  const [showScrollUp, setShowScrollUp] = useState(false);
  // Dev debug panel state removed

  

  const fetchEnrolledClasses = useCallback(async () => {
    // Helper to add a timeout to API calls
    const fetchWithTimeout = (promise, ms = 10000) => {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));
      return Promise.race([promise, timeout]);
    };

    try {
      setLoading(true);
      setClassesError(null);
      const response = await fetchWithTimeout(studentAPI.getMyClasses(), 10000);
      console.log('getMyClasses response (dashboard):', response);
      // Helper: find first array in common wrapper keys or nested objects
      const findArray = (obj) => {
        if (!obj) return null;
        if (Array.isArray(obj)) return obj;
        const commonKeys = ['classes', 'data', 'payload', 'items', 'result', 'rows'];
        for (const k of commonKeys) {
          if (Array.isArray(obj[k])) return obj[k];
          if (obj[k] && typeof obj[k] === 'object') {
            // sometimes nested under data.data
            for (const kk of commonKeys) {
              if (Array.isArray(obj[k][kk])) return obj[k][kk];
            }
          }
        }
        // fallback: search values for first array
        const arr = Object.values(obj).find(v => Array.isArray(v));
        if (arr) return arr;
        return null;
      };

      let classesResult = findArray(response);
      // If not found, try a secondary endpoint
      if (!classesResult || classesResult.length === 0) {
        try {
          const fallback = await fetchWithTimeout(studentAPI.getMyCourses(), 10000);
          console.log('getMyCourses fallback response:', fallback);
          classesResult = findArray(fallback) || classesResult || [];
        } catch (err) {
          console.warn('Fallback getMyCourses failed:', err);
          setClassesError(String(err?.message || err));
        }
      }

      if (classesResult && classesResult.length > 0) {
        setClasses(classesResult);
      } else {
        setClasses([]);
        console.warn('No enrolled classes found (response shape may differ).');
        if (!classesError) setClassesError('No enrolled classes found');
      }
      return classesResult || [];
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
      setClassesError(String(error?.message || error));
    } finally {
      setLoading(false);
    }
  }, []);

  // Dev debug fetch removed

  const fetchAssignmentsForEnrolledClasses = useCallback(async (classList = []) => {
    try {
      const classesToUse = Array.isArray(classList) && classList.length > 0 ? classList : classes;
      if (!classesToUse || classesToUse.length === 0) {
        setAllAssignments([]);
        setAssignments([]);
        return [];
      }

      // Fetch assignments per class in parallel
      const promises = classesToUse.map((c) => {
        const courseId = c.id || c.course_id || c.class_id;
        if (!courseId) return Promise.resolve({ status: 'skipped', value: [] });
        return assignmentAPI.getByCourse(courseId).then(res => ({ status: 'fulfilled', value: res })).catch(err => ({ status: 'rejected', reason: err }));
      });

      const settled = await Promise.all(promises);
      let all = [];
      settled.forEach((r, idx) => {
        if (!r) return;
        if (r.status === 'rejected') {
          console.warn('Assignment fetch failed for class', classesToUse[idx]?.id, r.reason);
          return;
        }
        const response = r.value;
        // Normalize response to an array
        let payload = [];
        if (!response) payload = [];
        else if (Array.isArray(response)) payload = response;
        else if (Array.isArray(response.assignments)) payload = response.assignments;
        else if (Array.isArray(response.data)) payload = response.data;
        else if (Array.isArray(response.payload)) payload = response.payload;
        else if (Array.isArray(response.items)) payload = response.items;
        else if (Array.isArray(response.result)) payload = response.result;
        else if (Array.isArray(response.rows)) payload = response.rows;
        else {
          const arr = Object.values(response).find(v => Array.isArray(v));
          payload = arr || [];
        }

        // Ensure each assignment has course_id/class mapping
        const withCourse = (payload || []).map(a => ({ ...a, course_id: a.course_id || classesToUse[idx]?.course_id || classesToUse[idx]?.id }));
        all = all.concat(withCourse);
      });

      // Deduplicate by assignment id if present
      const unique = [];
      const seen = new Set();
      all.forEach(a => {
        const key = a?.id || JSON.stringify(a);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(a);
        }
      });

      // Sort by due date ascending
      const sorted = unique.slice().sort((a, b) => {
        const dueA = a?.due_date || a?.due || a?.dueDate || null;
        const dueB = b?.due_date || b?.due || b?.dueDate || null;
        if (dueA && dueB) return new Date(dueA) - new Date(dueB);
        if (dueA && !dueB) return -1;
        if (!dueA && dueB) return 1;
        const createdA = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const createdB = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return createdB - createdA;
      });

      setAllAssignments(sorted);
      // Debug: show a sample normalized assignment so we can inspect field names
      if (sorted && sorted.length > 0) console.log('Sample normalized assignment (dashboard):', sorted[0]);
      const startIndex = (currentPage - 1) * assignmentsPerPage;
      const endIndex = startIndex + assignmentsPerPage;
      setAssignments(sorted.slice(startIndex, endIndex));
      console.log('Fetched and normalized assignments for enrolled classes:', sorted.length);
      return sorted;
    } catch (error) {
      console.error('Error fetching assignments for enrolled classes:', error);
      return [];
    }
  }, [classes, currentPage]);

  const fetchRecentAnnouncements = useCallback(async () => {
    try {
      const response = await announcementAPI.getAll();
      console.log('announcementAPI.getAll response:', response);
      if (response && response.success) {
        const recentAnnouncements = (response.announcements || [])
          .filter(a => a.status === 'published')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setAnnouncements(recentAnnouncements);
      } else if (Array.isArray(response)) {
        setAnnouncements(response.slice(0,3));
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }, []);

  const fetchUpcomingAssignments = useCallback(async () => {
    try {
      console.log('Fetching upcoming assignments...');
      const response = await studentAPI.getMyAssignments();
      console.log('Assignments API response (raw):', response);

      // Try several common places where the backend might put the assignments array
      let payload = [];
      if (!response) payload = [];
      else if (Array.isArray(response)) payload = response;
      else if (Array.isArray(response.assignments)) payload = response.assignments;
      else if (Array.isArray(response.data)) payload = response.data;
      else if (Array.isArray(response.payload)) payload = response.payload;
      else if (Array.isArray(response.items)) payload = response.items;
      else if (Array.isArray(response.result)) payload = response.result;
      else if (Array.isArray(response.rows)) payload = response.rows;
      else {
        // Fallback: search object values for first array
        const arr = Object.values(response).find(v => Array.isArray(v));
        payload = arr || [];
      }

      console.log('Normalized assignments payload length:', (payload && payload.length) || 0);

      // Sort by due date ascending (earliest first), fallback to created_at desc for tie
      const sortedAssignments = (payload || []).slice().sort((a, b) => {
        const dueA = a?.due_date || a?.due || a?.dueDate || null;
        const dueB = b?.due_date || b?.due || b?.dueDate || null;
        if (dueA && dueB) return new Date(dueA) - new Date(dueB);
        if (dueA && !dueB) return -1;
        if (!dueA && dueB) return 1;
        const createdA = new Date(a?.created_at || a?.createdAt || 0).getTime();
        const createdB = new Date(b?.created_at || b?.createdAt || 0).getTime();
        return createdB - createdA;
      });

      console.log('Sorted assignments (first 5):', sortedAssignments.slice(0,5));

      setAllAssignments(sortedAssignments);
      const startIndex = (currentPage - 1) * assignmentsPerPage;
      const endIndex = startIndex + assignmentsPerPage;
      setAssignments(sortedAssignments.slice(startIndex, endIndex));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, [currentPage]);

  const initRun = useRef(false);
  // Run init once on mount. We intentionally omit the callback deps to avoid re-running
  // when callbacks change during normal state updates.
  useEffect(() => {
    if (initRun.current) return;
    initRun.current = true;
    const init = async () => {
      console.log('Dashboard init start');
      const cls = await fetchEnrolledClasses();
      await fetchRecentAnnouncements();
      // Fetch assignments per-enrolled-class (prefer per-class endpoint). If no classes returned, fallback to student's assignments endpoint
      if (Array.isArray(cls) && cls.length > 0) {
        await fetchAssignmentsForEnrolledClasses(cls);
      } else {
        await fetchUpcomingAssignments();
      }
      console.log('Dashboard init complete');
      // Ensure loading is cleared after init (defensive)
      setLoading(false);
    };
    init();
    // run only once on mount
  }, []);

  // Handle scroll for scroll up button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * assignmentsPerPage;
    const endIndex = startIndex + assignmentsPerPage;
    setAssignments(allAssignments.slice(startIndex, endIndex));
  };

  // Calculate total pages
  const totalPages = Math.ceil(allAssignments.length / assignmentsPerPage);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return 'just now';
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

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return {
          bg: 'bg-red-900/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: '🔴'
        };
      case 'normal':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          icon: '🟡'
        };
      case 'low':
        return {
          bg: 'bg-green-900/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          icon: '🟢'
        };
      default:
        return {
          bg: 'bg-gray-900/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          icon: '⚪'
        };
    }
  };

  const getTimeUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate).getTime();
    const now = Date.now();
    const diff = Math.floor((due - now) / 1000); // seconds

    if (diff < 0) return { text: 'Overdue', color: 'text-red-400', bgColor: 'bg-red-900/20', urgent: true };
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return { text: `${m} min${m > 1 ? 's' : ''} left`, color: 'text-red-400', bgColor: 'bg-red-900/20', urgent: true };
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return { text: `${h} hour${h > 1 ? 's' : ''} left`, color: 'text-orange-400', bgColor: 'bg-orange-900/20', urgent: true };
    }
    if (diff < 172800) { // 2 days
      return { text: 'Due tomorrow', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', urgent: true };
    }
    if (diff < 604800) { // 7 days
      const d = Math.floor(diff / 86400);
      return { text: `${d} days left`, color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', urgent: false };
    }
    return { text: 'On track', color: 'text-green-400', bgColor: 'bg-green-900/20', urgent: false };
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
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
      toast.error('Failed to open file');
    }
  };

  const handleDownloadFileById = async (fileId, fileName) => {
    try {
      setDownloadingMap(prev => ({ ...prev, ['file-' + fileId]: true }));
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
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading file by id:', error);
      toast.error('Download failed');
    } finally {
      setDownloadingMap(prev => ({ ...prev, ['file-' + fileId]: false }));
    }
  };

  // Find the latest student submission for an assignment (best-effort across response shapes)
  const getLatestSubmission = (assignment) => {
    if (!assignment) return null;
    if (assignment.latest_submission) return assignment.latest_submission;
    if (assignment.submission) return assignment.submission;
    if (Array.isArray(assignment.submissions) && assignment.submissions.length > 0) {
      const sorted = assignment.submissions.slice().sort((a, b) => {
        const ta = new Date(a.submitted_at || a.created_at || a.createdAt || 0).getTime();
        const tb = new Date(b.submitted_at || b.created_at || b.createdAt || 0).getTime();
        return tb - ta;
      });
      return sorted[0];
    }
    if (assignment.student_submission) return assignment.student_submission;
    if (assignment.submitted_files && Array.isArray(assignment.submitted_files) && assignment.submitted_files.length > 0) {
      return assignment.submitted_files.slice().sort((a,b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))[0];
    }
    return null;
  };

  const activeClasses = classes.filter(c => {
    // Treat classes without an explicit status as active (backend may omit status)
    if (!('status' in c)) return true;
    return String(c.status).toLowerCase() === 'active';
  });
  const displayClasses = activeClasses.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg shadow-orange-500/30"
      >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-orange-100 mb-6">
            Ready to learn something new today? Check out your courses and assignments below.
          </p>
          <p className="text-sm text-orange-100/80 mb-4">
            {user?.student_id ? `Student ID: ${user.student_id}` : ''}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/student/courses"
              className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 transition text-center shadow-lg"
            >
              View Assignments
            </Link>
            <Link
              to="/student/courses"
              className="px-6 py-3 bg-orange-700 text-white rounded-xl font-semibold hover:bg-orange-800 transition border border-orange-500 text-center"
            >
              My Courses
            </Link>
          </div>
        </div>
      </Motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Courses', value: String(activeClasses.length), icon: BookOpen, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500' },
          { label: 'Assignments', value: String(assignments.length), icon: ClipboardList, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500' },
          { label: 'Announcements', value: String(announcements.length), icon: Bell, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500' },
        ].map((stat, index) => (
          <Motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800 hover:border-orange-500/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 ${stat.iconBg} rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Active Courses
              </h2>
              <Link
                to="/student/courses"
                className="text-orange-500 text-sm font-medium hover:text-orange-600 transition"
              >
                See All →
              </Link>
            </div>
            {/* Dev debug panel removed */}
            <div className="space-y-4">
              {loading ? (
                <SkeletonList items={3} />
              ) : classesError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-3">Failed to load classes</div>
                  <p className="text-gray-500 text-sm mb-3">{classesError}</p>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={async () => { setLoading(true); setClassesError(null); await fetchEnrolledClasses(); setLoading(false); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg">Retry</button>
                  </div>
                </div>
              ) : displayClasses.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No enrolled classes yet</p>
                  <p className="text-gray-500 text-sm mt-1">Your enrolled classes will appear here</p>
                </div>
              ) : (
                displayClasses.map((classItem) => (
                  <Link
                    key={classItem.id}
                    to={`/student/courses/${classItem.id}`}
                    className="block bg-gray-800/50 rounded-xl p-4 border border-orange-500 hover:border-orange-600 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">
                          {classItem.course_name || classItem.name || classItem.subject_name}
                        </h3>
                        {/* Instructor Info */}
                        <div className="flex items-center gap-2 mt-1">
                          {classItem.faculty?.profile_image ? (
                            <img 
                              src={classItem.faculty.profile_image} 
                              alt={classItem.faculty.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-orange-500/20 rounded-full flex items-center justify-center">
                              <User size={12} className="text-orange-400" />
                            </div>
                          )}
                          <p className="text-sm text-gray-400">
                            {classItem.faculty?.name || 'Instructor'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {classItem.semester} • {classItem.academic_year}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" />
              Recent Announcements
            </h2>
            {announcements.length > 0 && (
              <span className="text-sm text-gray-400">
                {announcements.length} new
              </span>
            )}
          </div>
          
          {announcements.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No announcements yet</p>
              <p className="text-gray-500 text-sm mt-1">Check back later for updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const priorityStyle = getPriorityStyles(announcement.priority);
                return (
                  <Link
                    key={announcement.id}
                    to={`/student/courses/${announcement.course_id}`}
                    className={`block p-4 rounded-xl border ${priorityStyle.border} ${priorityStyle.bg} hover:border-orange-500/50 transition-all group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg">{priorityStyle.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                            {announcement.title}
                          </h3>
                          <span className={`text-xs ${priorityStyle.text} uppercase font-medium flex-shrink-0`}>
                            {announcement.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {announcement.course?.name || 'General'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(announcement.created_at)}
                          </span>
                          {announcement.comments_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Bell className="w-3 h-3" />
                              {announcement.comments_count} comment{announcement.comments_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Upcoming Assignments
          </h2>
          <Link
            to="/student/courses"
            className="text-orange-500 text-sm font-medium hover:text-orange-600 transition"
          >
            See All →
          </Link>
        </div>
        
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No upcoming assignments</p>
            <p className="text-gray-500 text-sm mt-1">Your assignments will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const timeUntil = getTimeUntilDue(assignment.due_date);
              return (
                <Link
                  key={assignment.id}
                  to={`/student/courses/${assignment.course_id}`}
                  className={`block p-4 rounded-xl border border-gray-800 hover:border-orange-500 transition-all duration-300 bg-gray-800/30 hover:bg-gray-800/60 group hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors duration-300 line-clamp-1 mb-1">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 group-hover:text-gray-300 transition-colors mb-2">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 group-hover:text-orange-400 transition-colors" />
                          {assignment.course || 'Course'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 group-hover:text-orange-400 transition-colors" />
                          Due: {formatDueDate(assignment.due_date)}
                        </span>
                      </div>
                      {assignment.description && (
                        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors line-clamp-1 mb-2">
                          {assignment.description}
                        </p>
                      )}
                      {/* Latest student submission */}
                      {(() => {
                        const latest = getLatestSubmission(assignment);
                        if (!latest) return null;
                        const fileId = latest.id || latest.file_id || latest.file?.id;
                        const fileName = latest.original_name || latest.name || latest.file?.original_name || latest.file?.name || latest.filename || latest.file_name;
                        const submittedAt = latest.submitted_at || latest.created_at || latest.createdAt || latest.uploaded_at || latest.date;
                        return (
                          <div className="mt-2 border-t border-gray-700 pt-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-green-400" />
                                <div className="text-sm text-gray-300">
                                  {fileName || 'Your submission'}
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
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewFileById(fileId); }} className="px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">View</button>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadFileById(fileId, fileName); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Download</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        {timeUntil && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${timeUntil.bgColor} ${timeUntil.color}`}>
                            {timeUntil.urgent && <AlertCircle className="w-3 h-3" />}
                            {timeUntil.text}
                          </span>
                        )}
                        {assignment.has_submitted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-900/20 text-green-400 group-hover:bg-green-900/30 transition-colors">
                            <CheckCircle2 className="w-3 h-3" />
                            Submitted
                          </span>
                        )}
                        {assignment.max_points && (
                          <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                            {assignment.max_points} points
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const id = assignment.id;
                          try {
                            setDownloadingMap(prev => ({ ...prev, [id]: true }));
                            await assignmentAPI.download(id);
                            toast.success('Download started');
                          } catch (err) {
                            console.error('Download failed', err);
                            toast.error('Download failed');
                          } finally {
                            setDownloadingMap(prev => ({ ...prev, [id]: false }));
                          }
                        }}
                        className="p-2 rounded bg-gray-800 text-gray-300 hover:bg-orange-500 hover:text-white text-xs flex items-center justify-center"
                        title="Download assignment"
                        aria-label={`Download assignment ${assignment.title}`}
                      >
                        {downloadingMap[assignment.id] ? (
                          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <DownloadCloud className="w-4 h-4" />
                        )}
                      </button>
                      <ClipboardList className="w-5 h-5 text-gray-600 group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {allAssignments.length > assignmentsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">
              Showing {((currentPage - 1) * assignmentsPerPage) + 1} to {Math.min(currentPage * assignmentsPerPage, allAssignments.length)} of {allAssignments.length} assignments
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === 1
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-orange-500 hover:text-white'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-orange-500 hover:text-white'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scroll Up Button */}
      <AnimatePresence>
        {showScrollUp && (
          <Motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Scroll to top"
          >
            <ChevronUp size={24} />
          </Motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

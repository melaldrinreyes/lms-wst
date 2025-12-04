import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Bell, User, Megaphone, Clock, AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, DownloadCloud, ChevronUp } from 'lucide-react';
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
  const [classesError, setClassesError] = useState(null);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [activeCoursesPage, setActiveCoursesPage] = useState(1);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  // Dev debug panel state removed

  

  const fetchEnrolledClasses = useCallback(async () => {
    // Helper to add a timeout to API calls
    const fetchWithTimeout = (promise, ms = 10000) => {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms));
      return Promise.race([promise, timeout]);
    };

    try {
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
    }
  }, []);

  // Dev debug fetch removed

  const fetchAssignmentsForEnrolledClasses = useCallback(async (classList = []) => {
    try {
      const classesToUse = Array.isArray(classList) && classList.length > 0 ? classList : classes;
      if (!classesToUse || classesToUse.length === 0) {
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

      // Debug: show a sample normalized assignment so we can inspect field names
      if (sorted && sorted.length > 0) console.log('Sample normalized assignment (dashboard):', sorted[0]);
      setAssignments(sorted);
      console.log('Fetched and normalized assignments for enrolled classes:', sorted.length);
      return sorted;
    } catch (error) {
      console.error('Error fetching assignments for enrolled classes:', error);
      return [];
    }
  }, [classes]);

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

      setAssignments(sortedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  }, []);

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

  // Reset assignments page when assignments change
  useEffect(() => {
    setAssignmentsPage(1);
  }, [assignments]);

  // Reset active courses page when classes change
  useEffect(() => {
    setActiveCoursesPage(1);
  }, [classes]);

  // Reset announcements page when announcements change
  useEffect(() => {
    setAnnouncementsPage(1);
  }, [announcements]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const activeClasses = classes.filter(c => {
    // Treat classes without an explicit status as active (backend may omit status)
    if (!('status' in c)) return true;
    return String(c.status).toLowerCase() === 'active';
  });

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

  // Pagination for assignments
  const assignmentsPerPage = 4;
  const totalAssignmentPages = Math.ceil(assignments.length / assignmentsPerPage);
  const assignmentsStartIndex = (assignmentsPage - 1) * assignmentsPerPage;
  const displayedAssignments = assignments.slice(assignmentsStartIndex, assignmentsStartIndex + assignmentsPerPage);

  // Pagination for active courses
  const activeCoursesPerPage = 4;
  const totalActivePages = Math.ceil(activeClasses.length / activeCoursesPerPage);
  const activeCoursesStartIndex = (activeCoursesPage - 1) * activeCoursesPerPage;
  const displayedActiveCourses = activeClasses.slice(activeCoursesStartIndex, activeCoursesStartIndex + activeCoursesPerPage);

  // Helper function to get course name by ID
  const getCourseName = (courseId) => {
    if (!courseId) return 'Unknown Course';
    const course = classes.find(c => c.id == courseId);
    return course ? (course.name || course.course_name || 'Unknown Course') : 'Unknown Course';
  };

  // Pagination for announcements
  const announcementsPerPage = 4;
  const totalAnnouncementPages = Math.ceil(announcements.length / announcementsPerPage);
  const announcementsStartIndex = (announcementsPage - 1) * announcementsPerPage;
  const displayedAnnouncements = announcements.slice(announcementsStartIndex, announcementsStartIndex + announcementsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-gray-100 mb-6">
            Continue your learning journey. Access your enrolled courses and stay on top of your assignments.
          </p>
          <p className="text-sm text-gray-200 mb-4">
            {user?.student_id ? `Student ID: ${user.student_id}` : ''}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/student/courses"
              className="px-6 py-3 bg-[#FF4C60] text-white rounded-xl font-semibold hover:bg-[#ff3451] transition text-center shadow-sm"
            >
              View Assignments
            </Link>
            <Link
              to="/student/courses"
              className="px-6 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition border border-white/30 text-center"
            >
              View Courses
            </Link>
          </div>
        </div>
      </Motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Courses', value: String(activeClasses.length), icon: BookOpen, color: 'from-[#ff6b6b] to-[#0d4973]', bg: 'bg-[#FF4C60]/100/10', border: 'border-[#FF4C60]/20', iconBg: 'bg-[#FF4C60]/100' },
          { label: 'Assignments', value: String(assignments.length), icon: ClipboardList, color: 'from-[#ff6b6b] to-[#0d4973]', bg: 'bg-[#FF4C60]/10', border: 'border-[#ff6b6b]/20', iconBg: 'bg-[#FF4C60]' },
          { label: 'Announcements', value: String(announcements.length), icon: Bell, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500' },
        ].map((stat, index) => (
          <Motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-[#FF4C60] hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#718096] dark:text-[#718096] mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-[#1d2026]">
                  {stat.value}
                </p>
              </div>
              <div className={`p-4 ${stat.iconBg} rounded-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7 text-[#1d2026]" />
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Courses */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-[#1d2026] mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-white" />
            Active Courses
          </h3>
          {activeClasses.length > 0 ? (
            <div className="space-y-3">
              {displayedActiveCourses.map((course, index) => (
                <Motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => window.location.href = `/student/courses/${course.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#FF4C60]/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#1d2026]">{course.name || course.course_name}</h4>
                          <p className="text-xs text-[#4a5568]">{course.code || course.course_code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#718096]">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {course.faculty?.name || 'Instructor'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.semester || 'Ongoing'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Active
                      </span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Motion.div>
              ))}
              {totalActivePages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setActiveCoursesPage(prev => Math.max(1, prev - 1))}
                    disabled={activeCoursesPage === 1}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {activeCoursesPage} of {totalActivePages}
                  </span>
                  <button
                    onClick={() => setActiveCoursesPage(prev => Math.min(totalActivePages, prev + 1))}
                    disabled={activeCoursesPage === totalActivePages}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#4a5568]">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No active courses enrolled.</p>
            </div>
          )}
        </Motion.div>

        {/* Upcoming Assignments */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-[#1d2026] mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-white" />
            Upcoming Assignments
          </h3>
          {assignments.length > 0 ? (
            <div className="space-y-3">
              {displayedAssignments.map((assignment, index) => {
                const timeInfo = getTimeUntilDue(assignment.due_date);
                return (
                  <Motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="text-sm text-[#1d2026] font-semibold mb-1">{assignment.title}</div>
                    <div className="text-xs text-[#FF4C60] font-medium mb-1">
                      {assignment.course?.name || assignment.course?.title || getCourseName(assignment.course_id)}
                    </div>
                    <div className="text-xs text-[#718096]">Due: {new Date(assignment.due_date).toLocaleDateString()}</div>
                    {timeInfo && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${timeInfo.color}`}>
                        {timeInfo.text}
                      </span>
                    )}
                  </Motion.div>
                );
              })}
              {totalAssignmentPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setAssignmentsPage(prev => Math.max(1, prev - 1))}
                    disabled={assignmentsPage === 1}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {assignmentsPage} of {totalAssignmentPages}
                  </span>
                  <button
                    onClick={() => setAssignmentsPage(prev => Math.min(totalAssignmentPages, prev + 1))}
                    disabled={assignmentsPage === totalAssignmentPages}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#4a5568]">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No upcoming assignments.</p>
            </div>
          )}
        </Motion.div>

        {/* Recent Announcements */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h3 className="text-lg font-bold text-[#1d2026] mb-4 flex items-center gap-2">
            <Bell size={20} className="text-white" />
            Recent Announcements
          </h3>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {displayedAnnouncements.map((announcement, index) => (
                <Motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => {
                    if (announcement.course_id) {
                      window.location.href = `/student/courses/${announcement.course_id}`;
                    }
                  }}
                >
                  <div className="text-sm text-[#1d2026] font-semibold mb-1">{announcement.title}</div>
                  <div className="text-xs text-[#FF4C60] font-medium mb-1">
                    {announcement.course?.name || announcement.course?.title || getCourseName(announcement.course_id)}
                  </div>
                  <div className="text-xs text-[#4a5568] truncate mb-1">{announcement.content}</div>
                  <div className="text-xs text-[#718096]">{formatRelativeTime(announcement.created_at)}</div>
                </Motion.div>
              ))}
              {totalAnnouncementPages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setAnnouncementsPage(prev => Math.max(1, prev - 1))}
                    disabled={announcementsPage === 1}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {announcementsPage} of {totalAnnouncementPages}
                  </span>
                  <button
                    onClick={() => setAnnouncementsPage(prev => Math.min(totalAnnouncementPages, prev + 1))}
                    disabled={announcementsPage === totalAnnouncementPages}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg text-sm font-medium transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#4a5568]">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No recent announcements.</p>
            </div>
          )}
        </Motion.div>
      </div>

      {/* Scroll Up Button */}
      <AnimatePresence>
        {showScrollUp && (
          <Motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 bg-[#ff5252] hover:bg-[#ff4444] text-gray-900 p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Scroll to top"
          >
            <ChevronUp size={24} />
          </Motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Bell, User, Megaphone, Clock, AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { studentAPI, announcementAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]); // Store all assignments
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const assignmentsPerPage = 5;

  useEffect(() => {
    fetchEnrolledClasses();
    fetchRecentAnnouncements();
    fetchUpcomingAssignments();
  }, []);

  const fetchEnrolledClasses = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyClasses();
      if (response.success) {
        setClasses(response.classes || []);
      }
    } catch (error) {
      console.error('Error fetching enrolled classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAll();
      if (response.success) {
        // Filter only published announcements and get the 3 most recent
        const recentAnnouncements = (response.announcements || [])
          .filter(a => a.status === 'published')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 3);
        setAnnouncements(recentAnnouncements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchUpcomingAssignments = async () => {
    try {
      console.log('Fetching upcoming assignments...');
      const response = await studentAPI.getMyAssignments();
      console.log('Assignments API response:', response);
      
      if (response.success) {
        const now = new Date();
        console.log('Current time:', now);
        console.log('All assignments:', response.assignments);
        
        // Show most recent assignments (by created date) regardless of due date
        // Sort by created_at descending (newest first)
        const sortedAssignments = (response.assignments || [])
          .sort((a, b) => {
            // Sort by created_at if available, otherwise by due_date
            const dateA = new Date(a.created_at || a.due_date);
            const dateB = new Date(b.created_at || b.due_date);
            return dateB - dateA; // Descending (newest first)
          });
        
        console.log('Sorted assignments:', sortedAssignments);
        setAllAssignments(sortedAssignments);
        
        // Set initial page
        const startIndex = (currentPage - 1) * assignmentsPerPage;
        const endIndex = startIndex + assignmentsPerPage;
        setAssignments(sortedAssignments.slice(startIndex, endIndex));
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
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

  const activeClasses = classes.filter(c => c.status === 'active');
  const displayClasses = activeClasses.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg shadow-orange-500/30"
      >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-orange-100 mb-6">
            Ready to learn something new today? Check out your courses and assignments below.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/student/assignments"
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
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Courses', value: String(activeClasses.length), icon: BookOpen, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500' },
          { label: 'Assignments', value: String(assignments.length), icon: ClipboardList, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500' },
          { label: 'Announcements', value: String(announcements.length), icon: Bell, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500' },
        ].map((stat, index) => (
          <motion.div
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
          </motion.div>
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
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading classes...</p>
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
                    className="block bg-gray-800/50 rounded-xl p-4 border border-gray-800 hover:border-orange-500/50 transition cursor-pointer"
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
            to="/student/assignments"
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
                    <div className="flex-shrink-0">
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
    </div>
  );
}

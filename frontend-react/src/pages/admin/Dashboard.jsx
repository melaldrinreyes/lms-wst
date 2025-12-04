import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  BarChart3,
  Plus,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { superAdminAPI, courseAPI, studentAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    instructors: { total: 0, active: 0, inactive: 0 },
    students: { total: 0 },
    courses: { total: 0 },
    enrollments: { total: 0 },
    submissions: { total: 0, graded: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [showOverviewAll, setShowOverviewAll] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [instructorsList, setInstructorsList] = useState([]);
  // Server-driven pagination state for lists
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsTotalPages, setStudentsTotalPages] = useState(1);
  const STUDENTS_PER_PAGE = 10;

  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [coursesTotalPages, setCoursesTotalPages] = useState(1);
  const COURSES_PER_PAGE = 8;

  const [instructorsPage, setInstructorsPage] = useState(1);
  const [instructorsTotal, setInstructorsTotal] = useState(0);
  const [instructorsTotalPages, setInstructorsTotalPages] = useState(1);
  const INSTRUCTORS_PER_PAGE = 10;

  const safeMeta = (resp) => {
    // normalise different pagination shapes
    const meta = resp?.meta || resp?.pagination || resp?.paging || null;
    if (meta) {
      return {
        total: meta.total ?? meta.count ?? resp.total ?? 0,
        last_page: meta.last_page ?? meta.lastPage ?? Math.max(1, Math.ceil((meta.total || resp.total || 0) / (meta.per_page || STUDENTS_PER_PAGE))),
        per_page: meta.per_page ?? meta.perPage ?? STUDENTS_PER_PAGE,
        current_page: meta.current_page ?? meta.currentPage ?? resp.current_page ?? 1,
      };
    }
    // fallback to simple shapes
    const total = resp?.total ?? (Array.isArray(resp?.students) ? resp.students.length : (Array.isArray(resp?.data) ? resp.data.length : 0));
    return { total, last_page: Math.max(1, Math.ceil(total / STUDENTS_PER_PAGE)), per_page: STUDENTS_PER_PAGE, current_page: 1 };
  };

  const fetchStudentsPage = async (page = 1) => {
    try {
      const resp = await studentAPI.getAll({ page, per_page: STUDENTS_PER_PAGE });
      // resp may be { success, students, meta }
      const items = resp?.students ?? resp?.data ?? [];
      const meta = safeMeta(resp);
      setStudentsList(items || []);
      setStudentsTotal(meta.total || items.length);
      setStudentsTotalPages(meta.last_page || 1);
      setStudentsPage(page);
    } catch (err) {
      console.error('Failed fetching students page:', err);
      setStudentsList([]);
      setStudentsTotal(0);
      setStudentsTotalPages(1);
      setStudentsPage(1);
    }
  };

  const fetchCoursesPage = async (page = 1) => {
    try {
      const resp = await courseAPI.getAll({ page, per_page: COURSES_PER_PAGE, status: 'active' });
      const items = resp?.courses ?? resp?.data ?? [];
      const meta = safeMeta(resp);
      setCoursesList(items || []);
      setCoursesTotal(meta.total || items.length);
      setCoursesTotalPages(meta.last_page || 1);
      setCoursesPage(page);
    } catch (err) {
      console.error('Failed fetching courses page:', err);
      setCoursesList([]);
      setCoursesTotal(0);
      setCoursesTotalPages(1);
      setCoursesPage(1);
    }
  };

  const fetchInstructorsPage = async (page = 1) => {
    try {
      const resp = await superAdminAPI.getInstructors({ page, per_page: INSTRUCTORS_PER_PAGE });
      const items = resp?.instructors ?? resp?.data ?? [];
      const meta = safeMeta(resp);
      setInstructorsList(items || []);
      setInstructorsTotal(meta.total || items.length);
      setInstructorsTotalPages(meta.last_page || 1);
      setInstructorsPage(page);
    } catch (err) {
      console.error('Failed fetching instructors page:', err);
      setInstructorsList([]);
      setInstructorsTotal(0);
      setInstructorsTotalPages(1);
      setInstructorsPage(1);
    }
  };

  const toggleOverview = async () => {
    const next = !showOverviewAll;
    setShowOverviewAll(next);
    if (next) {
      // fetch fresh dashboard data when expanding to ensure actual numbers are shown
      try {
        setOverviewLoading(true);
        await fetchDashboardData();
        // fetch first pages for each list (server-driven pagination)
        await Promise.all([
          fetchStudentsPage(1),
          fetchCoursesPage(1),
          fetchInstructorsPage(1),
        ]);
      } catch (err) {
        console.error('Failed to refresh overview data:', err);
      } finally {
        setOverviewLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getDashboard();
      
      if (response.success) {
        setStats(response.statistics);
        setAdminProfile(response.adminProfile); // Assuming the API returns adminProfile
      } else {
        setToast({ message: 'Failed to load dashboard data', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setToast({ message: error.response?.data?.message || 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    setActionLoading('refresh');
    try {
      await fetchDashboardData();
      setToast({ message: 'Statistics refreshed successfully', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to refresh statistics', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportReport = async () => {
    setActionLoading('export');
    try {
      // Create CSV data for Excel
      const csvHeaders = [
        'Metric',
        'Value',
        'Description'
      ];

      const csvData = [
        ['Report Generated', new Date().toLocaleString(), 'System Dashboard Export'],
        ['', '', ''], // Empty row for spacing
        ['Total Students', stats.students.total, 'Total number of registered students'],
        ['Total Courses', stats.courses.total, 'Total number of courses in the system'],
        ['Total Instructors', stats.instructors.total, 'Total number of instructors'],
        ['Active Instructors', stats.instructors.active, 'Number of active instructors'],
        ['Inactive Instructors', stats.instructors.inactive, 'Number of inactive instructors'],
        ['Total Submissions', stats.submissions.total, 'Total assignment submissions'],
        ['Graded Submissions', stats.submissions.graded, 'Number of graded submissions'],
        ['Pending Submissions', stats.submissions.pending, 'Number of pending submissions']
      ];

      // Convert to CSV string
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download the file
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
      element.setAttribute('download', `dashboard-report-${new Date().getTime()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setToast({ message: 'Excel report exported successfully', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export report', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.students.total,
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
      link: '/admin/students',
    },
    {
      title: 'Total Courses',
      value: stats.courses.total,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      link: '/admin/courses',
    },
    {
      title: 'Total Instructors',
      value: stats.instructors.total,
      icon: Users,
      color: 'from-[#ff6b6b] to-[#0d4973]',
      link: '/admin/instructors',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Admin Profile Section */}
      {adminProfile && (
        <div className="bg-white dark:bg-white rounded-2xl p-6 shadow-md border border-[#ff6b6b]">
          <div className="flex items-center gap-4">
            <img
              src={adminProfile.pictureUrl || '/default-profile.png'}
              alt="Admin Profile"
              className="profile-picture"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#1d2026]">{adminProfile.name}</h2>
              <p className="text-sm text-gray-500 dark:text-[#718096]">System Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Material Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 drop-shadow mb-1">Admin Dashboard</h1>
          <p className="text-base text-[#4a5568] drop-shadow-sm">Manage instructors, monitor activities, and view statistics</p>
        </div>
      </div>

      {/* Material Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-white dark:bg-white rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-white dark:bg-white rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className="bg-white dark:bg-[#fff] rounded-2xl p-8 flex items-center justify-between shadow-md">
                  <div>
                    <p className="text-xs uppercase tracking-wider font-bold text-[#4a5568] mb-2">{stat.title}</p>
                    <p className="text-5xl font-extrabold text-[#181c23] mb-1" style={{letterSpacing:'-2px'}}>{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] flex items-center justify-center shadow-lg">
                    <stat.icon size={32} className="text-[#1d2026]" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-800 hover:border-[#ff6b6b]/50 transition-all p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/courses"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-[#ff6b6b] hover:bg-[#FF4C60]/10 transition-all text-center group"
          >
            <BookOpen className="w-8 h-8 text-[#FF4C60] mx-auto mb-2" />
            <p className="font-medium text-[#1d2026]">View All Courses</p>
            <p className="text-xs text-[#718096] mt-1">{stats.courses.total} courses</p>
          </Link>

          <Link
            to="/admin/students"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 transition-all text-center group"
          >
            <GraduationCap className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-[#1d2026]">View All Students</p>
            <p className="text-xs text-[#718096] mt-1">{stats.students.total} students</p>
          </Link>

          <button
            onClick={handleRefreshStats}
            disabled={actionLoading === 'refresh'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-8 h-8 text-purple-500 mx-auto mb-2 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            <p className="font-medium text-[#1d2026]">Refresh Stats</p>
            <p className="text-xs text-[#718096] mt-1">Update data</p>
          </button>

          <button
            onClick={handleExportReport}
            disabled={actionLoading === 'export'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
            <p className="font-medium text-[#1d2026]">Export to Excel</p>
            <p className="text-xs text-[#718096] mt-1">Download data</p>
          </button>
        </div>
      </motion.div>

      {/* System Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-800 hover:border-[#ff6b6b]/50 transition-all"
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1d2026]">System Overview</h2>
            <button
              onClick={toggleOverview}
              className="text-[#FF4C60] hover:text-[#ff5252] text-sm font-medium"
              aria-expanded={showOverviewAll}
            >
              {showOverviewAll ? 'Hide Details' : overviewLoading ? 'Loading…' : 'View Details →'}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: GraduationCap, value: stats.students.total, label: 'Total Students', color: 'bg-green-500/10', iconColor: 'text-green-500' },
              { icon: BookOpen, value: stats.courses.total, label: 'Active Courses', color: 'bg-purple-500/10', iconColor: 'text-purple-500' },
              { icon: Users, value: stats.instructors.total, label: 'Total Instructors', color: 'bg-[#FF4C60]/100/10', iconColor: 'text-[#FF4C60]' },
              { icon: ClipboardCheck, value: stats.submissions.total, label: 'Total Submissions', color: 'bg-[#FF4C60]/10', iconColor: 'text-[#FF4C60]' },
            ].map((s) => (
              <div key={s.label} className="bg-transparent">
                <div className="flex items-center gap-4 md:flex-col md:items-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${s.color} rounded-full`}>
                    <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                  </div>
                  <div className="text-left md:text-center">
                    <p className="text-2xl md:text-2xl font-bold text-[#1d2026]">{s.value}</p>
                    <p className="text-sm text-[#718096]">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Expanded details shown when user toggles View Details */}
          {showOverviewAll && (
            <div className="mt-6 border-t border-gray-800 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Students List */}
                <div className="bg-white rounded-xl p-4 border border-[#ff6b6b]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-[#718096]">Total Students</div>
                      <div className="text-lg font-bold text-[#1d2026]">{studentsTotal}</div>
                    </div>
                    <div className="text-xs text-[#718096]">{studentsTotal > 8 ? `${studentsTotal} total` : ''}</div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {studentsList.length === 0 ? (
                      <div className="text-sm text-[#718096] text-center py-8">No students available.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-white/50">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Student</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">ID</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Email</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {studentsList.map((s) => (
                              <tr key={s.id} className="hover:bg-white/30">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex-shrink-0">
                                      <img src={s.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}`} alt={s.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm text-gray-900 font-medium truncate">{s.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#4a5568] font-mono">{s.student_id || s.id}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#718096] truncate">{s.email}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    s.status === 'active' || !s.status
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-white/20 text-[#718096]'
                                  }`}>
                                    {s.status || 'active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {studentsList.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-[#718096]">
                          Showing {studentsTotal === 0 ? 0 : ((studentsPage - 1) * STUDENTS_PER_PAGE + 1)} - {Math.min(studentsPage * STUDENTS_PER_PAGE, studentsTotal)} of {studentsTotal}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchStudentsPage(Math.max(1, studentsPage - 1))}
                            disabled={studentsPage <= 1}
                          >
                            <ChevronLeft className="w-4 h-4 text-[#4a5568]" />
                          </button>
                          <div className="text-xs text-[#718096]">{studentsPage} / {studentsTotalPages}</div>
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchStudentsPage(Math.min(studentsTotalPages, studentsPage + 1))}
                            disabled={studentsPage >= studentsTotalPages}
                          >
                            <ChevronRight className="w-4 h-4 text-[#4a5568]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Courses List */}
                <div className="bg-white rounded-xl p-4 border border-[#ff6b6b]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-[#718096]">Active Courses</div>
                      <div className="text-lg font-bold text-[#1d2026]">{coursesTotal}</div>
                    </div>
                    <div className="text-xs text-[#718096]">{coursesTotal > 8 ? `${coursesTotal} total` : ''}</div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {coursesList.length === 0 ? (
                      <div className="text-sm text-[#718096] text-center py-8">No active courses.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-white/50">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Course</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Code</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Credits</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Students</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {coursesList.map((c) => (
                              <tr key={c.id} className="hover:bg-white/30">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded overflow-hidden flex-shrink-0">
                                      {c.thumbnail ? (
                                        <img 
                                          src={c.thumbnail} 
                                          alt={c.name || c.title}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <BookOpen size={12} className="text-[#718096]" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm text-gray-900 font-medium truncate">
                                        {c.name || c.title || c.course_name}
                                      </div>
                                      <div className="text-xs text-[#718096] truncate">
                                        {c.instructor || c.faculty_name || ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#4a5568] font-mono">{c.code}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#1d2026]">{c.credits}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#ff9f66]">{c.students ?? 0}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    c.status === 'active'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-white/20 text-[#718096]'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {coursesList.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-[#718096]">
                          Showing {coursesTotal === 0 ? 0 : ((coursesPage - 1) * COURSES_PER_PAGE + 1)} - {Math.min(coursesPage * COURSES_PER_PAGE, coursesTotal)} of {coursesTotal}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchCoursesPage(Math.max(1, coursesPage - 1))}
                            disabled={coursesPage <= 1}
                          >
                            <ChevronLeft className="w-4 h-4 text-[#4a5568]" />
                          </button>
                          <div className="text-xs text-[#718096]">{coursesPage} / {coursesTotalPages}</div>
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchCoursesPage(Math.min(coursesTotalPages, coursesPage + 1))}
                            disabled={coursesPage >= coursesTotalPages}
                          >
                            <ChevronRight className="w-4 h-4 text-[#4a5568]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructors List */}
                <div className="bg-white rounded-xl p-4 border border-[#ff6b6b]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm text-[#718096]">Instructors</div>
                      <div className="text-lg font-bold text-[#1d2026]">{instructorsTotal}</div>
                    </div>
                    <div className="text-xs text-[#718096]">{instructorsTotal > 8 ? `${instructorsTotal} total` : ''}</div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {instructorsList.length === 0 ? (
                      <div className="text-sm text-[#718096] text-center py-8">No instructors.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-white/50">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Instructor</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Email</th>
                              <th className="text-left py-2 px-3 text-xs font-semibold text-[#4a5568]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {instructorsList.map((ins) => (
                              <tr key={ins.id} className="hover:bg-white/30">
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex-shrink-0">
                                      <img src={ins.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(ins.name)}`} alt={ins.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm text-gray-900 font-medium truncate">{ins.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="text-sm text-[#718096] truncate">{ins.email}</span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                    ins.status === 'active' || !ins.status
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-white/20 text-[#718096]'
                                  }`}>
                                    {ins.status || 'active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {instructorsList.length > 0 && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-[#718096]">
                          Showing {instructorsTotal === 0 ? 0 : ((instructorsPage - 1) * INSTRUCTORS_PER_PAGE + 1)} - {Math.min(instructorsPage * INSTRUCTORS_PER_PAGE, instructorsTotal)} of {instructorsTotal}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchInstructorsPage(Math.max(1, instructorsPage - 1))}
                            disabled={instructorsPage <= 1}
                          >
                            <ChevronLeft className="w-4 h-4 text-[#4a5568]" />
                          </button>
                          <div className="text-xs text-[#718096]">{instructorsPage} / {instructorsTotalPages}</div>
                          <button
                            className="p-1 rounded-xl hover:bg-white/50 disabled:opacity-50"
                            onClick={() => fetchInstructorsPage(Math.min(instructorsTotalPages, instructorsPage + 1))}
                            disabled={instructorsPage >= instructorsTotalPages}
                          >
                            <ChevronRight className="w-4 h-4 text-[#4a5568]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

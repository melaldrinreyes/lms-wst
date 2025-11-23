import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  Activity,
  BarChart3,
  Plus,
  RefreshCw,
  Download,
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getDashboard();
      
      if (response.success) {
        setStats(response.statistics);
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
      // Create a simple CSV report
      const report = `System Report - ${new Date().toLocaleString()}
      
Dashboard Statistics:
- Total Students: ${stats.students.total}
- Total Courses: ${stats.courses.total}
- Total Instructors: ${stats.instructors.total}
- Total Enrollments: ${stats.enrollments.total}
- Pending Submissions: ${stats.submissions.pending}
- Graded Submissions: ${stats.submissions.graded}
`;
      
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
      element.setAttribute('download', `dashboard-report-${new Date().getTime()}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setToast({ message: 'Report exported successfully', type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to export report', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAllCourses = async () => {
    setActionLoading('courses');
    try {
      navigate('/admin/courses');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAllStudents = async () => {
    setActionLoading('students');
    try {
      navigate('/admin/students');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAllInstructors = async () => {
    setActionLoading('instructors');
    try {
      navigate('/admin/instructors');
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
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Material Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage instructors, monitor activities, and view statistics
          </p>
        </div>
        <Link
          to="/admin/instructors/new"
          className="btn-primary inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Instructor
        </Link>
      </div>

      {/* Material Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className="card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        {stat.title}
                      </p>
                      <p className="text-4xl font-medium text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <stat.icon size={28} className="text-white" />
                    </div>
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
        className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={handleViewAllCourses}
            disabled={actionLoading === 'courses'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium text-white">View All Courses</p>
            <p className="text-xs text-gray-400 mt-1">{stats.courses.total} courses</p>
          </button>

          <button
            onClick={handleViewAllStudents}
            disabled={actionLoading === 'students'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GraduationCap className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-white">View All Students</p>
            <p className="text-xs text-gray-400 mt-1">{stats.students.total} students</p>
          </button>

          <button
            onClick={handleViewAllInstructors}
            disabled={actionLoading === 'instructors'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-white">View All Instructors</p>
            <p className="text-xs text-gray-400 mt-1">{stats.instructors.total} instructors</p>
          </button>

          <button
            onClick={handleRefreshStats}
            disabled={actionLoading === 'refresh'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-8 h-8 text-purple-500 mx-auto mb-2 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
            <p className="font-medium text-white">Refresh Stats</p>
            <p className="text-xs text-gray-400 mt-1">Update data</p>
          </button>

          <Link
            to="/admin/instructors/new"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-all text-center group"
          >
            <Plus className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-medium text-white">Add Instructor</p>
            <p className="text-xs text-gray-400 mt-1">Create new</p>
          </Link>

          <button
            onClick={handleExportReport}
            disabled={actionLoading === 'export'}
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
            <p className="font-medium text-white">Export Report</p>
            <p className="text-xs text-gray-400 mt-1">Download data</p>
          </button>
        </div>
      </motion.div>

      {/* System Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all"
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">System Overview</h2>
            <Link to="/admin/statistics" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
              View Details →
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mb-3">
                <GraduationCap className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.students.total}</p>
              <p className="text-sm text-gray-400">Total Students</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-full mb-3">
                <BookOpen className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.courses.total}</p>
              <p className="text-sm text-gray-400">Active Courses</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.enrollments.total}</p>
              <p className="text-sm text-gray-400">Total Enrollments</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  Activity,
  BarChart3,
} from 'lucide-react';
import { superAdminAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    instructors: { total: 0, active: 0, inactive: 0 },
    students: { total: 0 },
    courses: { total: 0 },
    enrollments: { total: 0 },
    submissions: { total: 0, graded: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

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

  const statCards = [
    {
      title: 'Total Instructors',
      value: stats.instructors.total,
      subtitle: `${stats.instructors.active} active`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      link: '/admin/instructors',
    },
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
      title: 'Pending Submissions',
      value: stats.submissions.pending,
      subtitle: `${stats.submissions.graded} graded`,
      icon: ClipboardCheck,
      color: 'from-orange-500 to-orange-600',
      link: '/admin/submissions',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Super Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Manage instructors, monitor activities, and view statistics
            </p>
        </div>
        <Link
          to="/admin/instructors/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 font-semibold"
        >
          <UserPlus className="w-4 h-4" />
          Add New Instructor
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-6 shadow-lg animate-pulse border border-gray-800">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-800 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.title}</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                    <div className={`w-14 h-14 ${stat.color.replace('from-', 'bg-').replace(/to-.*/, '').replace('-500', '-500/10')} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon size={28} className={`${stat.color.replace('from-', 'text-').replace(/to-.*/, '')}`} />
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
          <Link
            to="/admin/instructors"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center group"
          >
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-white">Manage Instructors</p>
          </Link>
          <Link
            to="/admin/activities"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 transition-all text-center group"
          >
            <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-white">View Activities</p>
          </Link>
          <Link
            to="/admin/statistics"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group"
          >
            <BarChart3 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="font-medium text-white">Statistics</p>
          </Link>
          <Link
            to="/admin/courses"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-500/10 transition-all text-center group"
          >
            <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium text-white">View Courses</p>
          </Link>
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mb-3">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.instructors.active}</p>
              <p className="text-sm text-gray-400">Active Instructors</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mb-3">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.courses.total}</p>
              <p className="text-sm text-gray-400">Active Courses</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-full mb-3">
                <GraduationCap className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white">{stats.enrollments.total}</p>
              <p className="text-sm text-gray-400">Total Enrollments</p>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

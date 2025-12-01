import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Award,
  AlertCircle,
  UserPlus
} from 'lucide-react';
import { courseAPI, submissionAPI, studentAPI, facultyAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function FacultyDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data with individual error handling
      const [coursesResult, studentsResult, pendingResult, enrollmentRequestsResult] = await Promise.allSettled([
        courseAPI.getAll(),
        studentAPI.getAll(),
        submissionAPI.getPendingCount(),
        facultyAPI.getEnrollmentRequests()
      ]);
      
      console.log('Dashboard API Results:', { coursesResult, studentsResult, pendingResult, enrollmentRequestsResult });
      
      let totalCourses = 0;
      let totalStudents = 0;
      let pendingSubmissions = 0;
      let pendingRequests = 0;
      
      if (coursesResult.status === 'fulfilled' && coursesResult.value?.success) {
        totalCourses = coursesResult.value?.courses?.length || 0;
      } else {
        console.error('Courses fetch failed:', coursesResult);
      }
      
      if (studentsResult.status === 'fulfilled' && studentsResult.value?.success) {
        totalStudents = studentsResult.value?.students?.length || 0;
      } else {
        console.error('Students fetch failed:', studentsResult);
      }
      
      if (pendingResult.status === 'fulfilled' && pendingResult.value?.success) {
        pendingSubmissions = pendingResult.value?.count || 0;
      } else {
        console.error('Pending submissions fetch failed:', pendingResult);
      }

      if (enrollmentRequestsResult.status === 'fulfilled' && enrollmentRequestsResult.value?.success) {
        const requests = enrollmentRequestsResult.value?.requests || [];
        pendingRequests = requests.filter(req => req.status === 'pending').length;
      } else {
        console.error('Enrollment requests fetch failed:', enrollmentRequestsResult);
      }
      
      setStats({
        totalCourses,
        totalStudents,
        pendingSubmissions,
        pendingRequests,
      });

      // Show error toast only if all requests failed
      const allFailed = [coursesResult, studentsResult, pendingResult, enrollmentRequestsResult].every(
        result => result.status === 'rejected' || !result.value?.success
      );
      
      if (allFailed) {
        setToast({ message: 'Failed to load dashboard data. Please check your connection.', type: 'error' });
      } else if (coursesResult.status === 'rejected' || studentsResult.status === 'rejected' || pendingResult.status === 'rejected' || enrollmentRequestsResult.status === 'rejected') {
        setToast({ message: 'Some dashboard data could not be loaded.', type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      link: '/faculty/courses',
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingSubmissions,
      icon: ClipboardCheck,
      color: 'from-orange-500 to-orange-600',
      link: '/faculty/submissions',
      badge: stats.pendingSubmissions > 0,
    },
    {
      title: 'Join Requests',
      value: stats.pendingRequests,
      icon: UserPlus,
      color: 'from-purple-500 to-purple-600',
      link: '/faculty/join-requests',
      badge: stats.pendingRequests > 0,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Faculty Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome back! Here's what's happening with your courses.
            </p>
        </div>
        <Link
          to="/faculty/courses"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
        >
          <BookOpen className="w-4 h-4" />
          Create New Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all cursor-pointer group relative">
                {/* Notification Badge */}
                {stat.badge && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center shadow-lg shadow-orange-500/50 animate-pulse">
                    {stat.value}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {stat.value}
                    </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all"
        >
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-bold text-white">Upcoming Deadlines</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No upcoming deadlines</p>
              <p className="text-gray-500 text-sm mt-1">Assignment deadlines will appear here</p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all"
        >
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No recent activity</p>
              <p className="text-gray-500 text-sm mt-1">Student activities will appear here</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-900 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/faculty/courses"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-500/10 transition-all text-center group"
          >
            <BookOpen className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-medium text-white">Manage Courses</p>
          </Link>
          <Link
            to="/faculty/submissions"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-500/10 transition-all text-center group"
          >
            <ClipboardCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-white">Grade Submissions</p>
          </Link>
          <Link
            to="/faculty/join-requests"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group"
          >
            <UserPlus className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="font-medium text-white">Enrollment Requests</p>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

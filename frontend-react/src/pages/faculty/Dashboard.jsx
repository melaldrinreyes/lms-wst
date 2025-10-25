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
  AlertCircle
} from 'lucide-react';
import { courseAPI, submissionAPI, studentAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function FacultyDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    activeDiscussions: 8,
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
      const [coursesResult, studentsResult, pendingResult] = await Promise.allSettled([
        courseAPI.getAll(),
        studentAPI.getAll(),
        submissionAPI.getPendingCount()
      ]);
      
      console.log('Dashboard API Results:', { coursesResult, studentsResult, pendingResult });
      
      let totalCourses = 0;
      let totalStudents = 0;
      let pendingSubmissions = 0;
      
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
        pendingSubmissions = pendingResult.value?.pending_count || 0;
      } else {
        console.error('Pending submissions fetch failed:', pendingResult);
      }
      
      setStats({
        totalCourses,
        totalStudents,
        pendingSubmissions,
        activeDiscussions: 8, // Keep this as mock for now
      });

      // Show error toast only if all requests failed
      const allFailed = [coursesResult, studentsResult, pendingResult].every(
        result => result.status === 'rejected' || !result.value?.success
      );
      
      if (allFailed) {
        setToast({ message: 'Failed to load dashboard data. Please check your connection.', type: 'error' });
      } else if (coursesResult.status === 'rejected' || studentsResult.status === 'rejected' || pendingResult.status === 'rejected') {
        setToast({ message: 'Some dashboard data could not be loaded.', type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setToast({ message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'submission', student: 'Juan Dela Cruz', course: 'Web Development', time: '2 hours ago' },
    { id: 2, type: 'question', student: 'Maria Santos', course: 'Database Systems', time: '4 hours ago' },
    { id: 3, type: 'submission', student: 'Pedro Reyes', course: 'Programming 101', time: '5 hours ago' },
  ]);

  const [upcomingDeadlines, setUpcomingDeadlines] = useState([
    { id: 1, course: 'Web Development', assignment: 'Final Project', dueDate: '2025-10-28', submitted: 15, total: 20 },
    { id: 2, course: 'Database Systems', assignment: 'Midterm Exam', dueDate: '2025-10-30', submitted: 18, total: 25 },
    { id: 3, course: 'Programming 101', assignment: 'Lab Exercise 5', dueDate: '2025-11-02', submitted: 10, total: 20 },
  ]);

  const statCards = [
    {
      title: 'My Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      link: '/faculty/courses',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'from-green-500 to-green-600',
      link: '/faculty/students',
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingSubmissions,
      icon: ClipboardCheck,
      color: 'from-orange-500 to-orange-600',
      link: '/faculty/submissions',
    },
    {
      title: 'Discussions',
      value: stats.activeDiscussions,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      link: '/faculty/forums',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
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
          to="/faculty/courses/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50"
        >
          <BookOpen className="w-4 h-4" />
          Create New Course
        </Link>
      </div>

      {/* Stats Grid */}
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
          <div className="p-6 space-y-4">
            {upcomingDeadlines.map((deadline) => {
              const progress = (deadline.submitted / deadline.total) * 100;
              const daysLeft = Math.ceil((new Date(deadline.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={deadline.id} className="p-4 bg-gray-800/50 rounded-xl border border-gray-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{deadline.assignment}</h3>
                      <p className="text-sm text-gray-400">{deadline.course}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      daysLeft <= 2 
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {daysLeft}d left
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Submissions</span>
                      <span className="font-medium text-white">
                        {deadline.submitted}/{deadline.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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
          <div className="p-6 space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors border border-gray-800">
                <div className={`p-2 rounded-xl ${
                  activity.type === 'submission' 
                    ? 'bg-green-500/10' 
                    : 'bg-blue-500/10'
                }`}>
                  {activity.type === 'submission' ? (
                    <ClipboardCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {activity.student}
                  </p>
                  <p className="text-sm text-gray-400">
                    {activity.type === 'submission' ? 'Submitted assignment in' : 'Asked a question in'} {activity.course}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            to="/faculty/students"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center group"
          >
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-medium text-white">View Students</p>
          </Link>
          <Link
            to="/faculty/forums"
            className="p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center group"
          >
            <MessageSquare className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="font-medium text-white">Forum Discussions</p>
          </Link>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

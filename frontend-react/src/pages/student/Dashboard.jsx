import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledClasses();
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
          { label: 'Assignments', value: '0', icon: ClipboardList, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500' },
          { label: 'Announcements', value: '0', icon: Bell, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500' },
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
          <h2 className="text-xl font-bold text-white mb-6">
            Announcements
          </h2>
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No announcements yet</p>
            <p className="text-gray-500 text-sm mt-1">Check back later for updates</p>
          </div>
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
        <div className="text-center py-8">
          <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No upcoming assignments</p>
          <p className="text-gray-500 text-sm mt-1">Your assignments will appear here</p>
        </div>
      </div>
    </div>
  );
}

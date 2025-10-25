import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, TrendingUp, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentDashboard() {
  const activeCourses = [
    { id: 1, name: 'Web Development', progress: 75, instructor: 'Dr. Smith', color: 'from-orange-500 to-orange-600' },
    { id: 2, name: 'Data Structures', progress: 60, instructor: 'Prof. Johnson', color: 'from-orange-500 to-orange-600' },
    { id: 3, name: 'Database Systems', progress: 85, instructor: 'Dr. Williams', color: 'from-orange-500 to-orange-600' },
  ];

  const announcements = [
    { id: 1, title: 'Midterm Exam Schedule Released', date: '2 hours ago', type: 'important' },
    { id: 2, title: 'New Assignment Posted in Web Development', date: '5 hours ago', type: 'info' },
    { id: 3, title: 'Library Hours Extended During Finals Week', date: '1 day ago', type: 'info' },
  ];

  const upcomingAssignments = [
    { id: 1, title: 'React Project', course: 'Web Development', dueDate: 'Oct 28, 2025', status: 'pending' },
    { id: 2, title: 'Binary Trees Lab', course: 'Data Structures', dueDate: 'Oct 30, 2025', status: 'pending' },
    { id: 3, title: 'SQL Queries', course: 'Database Systems', dueDate: 'Nov 2, 2025', status: 'submitted' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-lg shadow-orange-500/30"
        >
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, Student! 👋
          </h1>
          <p className="text-orange-100 mb-6">
            You have 2 assignments due this week. Let's stay on track!
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Courses', value: '3', icon: BookOpen, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', iconBg: 'bg-blue-500' },
          { label: 'Assignments', value: '2', icon: ClipboardList, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', iconBg: 'bg-orange-500' },
          { label: 'Avg Progress', value: '73%', icon: TrendingUp, color: 'from-green-500 to-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20', iconBg: 'bg-green-500' },
          { label: 'Announcements', value: '3', icon: Bell, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20', iconBg: 'bg-purple-500' },
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
              {activeCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-800 hover:border-orange-500/50 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {course.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {course.instructor}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-orange-500">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`bg-gradient-to-r ${course.color} h-2.5 rounded-full transition-all shadow-md shadow-orange-500/30`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-orange-500/50 transition-all">
          <h2 className="text-xl font-bold text-white mb-6">
            Announcements
          </h2>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="pb-3 border-b border-gray-800 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      announcement.type === 'important' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {announcement.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Assignment
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Course
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Due Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {upcomingAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition"
                >
                  <td className="py-3 px-4 text-sm font-medium text-white">
                    {assignment.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {assignment.course}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {assignment.dueDate}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'submitted'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

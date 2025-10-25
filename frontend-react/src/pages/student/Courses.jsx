import { useState } from 'react';
import { BookOpen, Users, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Courses() {
  const [activeTab, setActiveTab] = useState('all');

  const courses = [
    {
      id: 1,
      name: 'Web Development',
      code: 'CS301',
      instructor: 'Dr. Smith',
      progress: 75,
      students: 45,
      duration: '12 weeks',
      color: 'from-blue-500 to-blue-600',
      modules: 12,
      assignments: 8,
    },
    {
      id: 2,
      name: 'Data Structures',
      code: 'CS202',
      instructor: 'Prof. Johnson',
      progress: 60,
      students: 50,
      duration: '14 weeks',
      color: 'from-green-500 to-green-600',
      modules: 14,
      assignments: 10,
    },
    {
      id: 3,
      name: 'Database Systems',
      code: 'CS303',
      instructor: 'Dr. Williams',
      progress: 85,
      students: 38,
      duration: '10 weeks',
      color: 'from-purple-500 to-purple-600',
      modules: 10,
      assignments: 6,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white">Continue Learning</h1>
        <p className="text-sm text-gray-400 mt-1">Result "{courses.length} Courses"</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {['all', 'in-progress', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition group"
          >
            {/* Course Image */}
            <div className="aspect-video bg-gray-800 dark:bg-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-purple-500/10"></div>
              <div className="absolute top-4 right-4">
                <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-semibold">
                  {course.progress}%
                </span>
              </div>
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Clock size={16} />
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span className="bg-gray-800 px-2 py-1 rounded">{course.code}</span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition">
                  {course.name}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{course.instructor}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Modules</p>
                  <p className="text-sm font-bold text-white">{course.modules}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Tasks</p>
                  <p className="text-sm font-bold text-white">{course.assignments}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Students</p>
                  <p className="text-sm font-bold text-white">{course.students}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${course.progress}%` }}
                />
              </div>

              {/* Action Button */}
              <Link
                to={`/student/courses/${course.id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                View Course
                <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

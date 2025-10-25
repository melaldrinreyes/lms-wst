import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  FileText,
  MessageSquare,
  Download,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock course data - in a real app, fetch this based on courseId
  const courseData = {
    1: {
      id: 1,
      name: 'Web Development',
      code: 'CS301',
      instructor: 'Dr. Smith',
      instructorEmail: 'dr.smith@minsuelearn.com',
      progress: 75,
      students: 45,
      duration: '12 weeks',
      startDate: 'Jan 15, 2025',
      endDate: 'Apr 10, 2025',
      description: 'Learn modern web development with HTML, CSS, JavaScript, and React. Build real-world projects and deploy them to the cloud.',
      modules: [
        { id: 1, title: 'Introduction to HTML', completed: true, duration: '2 hours', lessons: 8 },
        { id: 2, title: 'CSS Fundamentals', completed: true, duration: '3 hours', lessons: 12 },
        { id: 3, title: 'JavaScript Basics', completed: true, duration: '4 hours', lessons: 15 },
        { id: 4, title: 'React Fundamentals', completed: false, duration: '5 hours', lessons: 18 },
        { id: 5, title: 'State Management', completed: false, duration: '3 hours', lessons: 10 },
        { id: 6, title: 'API Integration', completed: false, duration: '4 hours', lessons: 14 },
      ],
      assignments: [
        { id: 1, title: 'HTML Portfolio Page', due: 'Feb 1, 2025', status: 'completed', grade: 95 },
        { id: 2, title: 'CSS Flexbox Layout', due: 'Feb 15, 2025', status: 'completed', grade: 88 },
        { id: 3, title: 'JavaScript Calculator', due: 'Mar 1, 2025', status: 'submitted', grade: null },
        { id: 4, title: 'React Todo App', due: 'Mar 20, 2025', status: 'pending', grade: null },
      ],
      announcements: [
        { id: 1, title: 'Midterm Exam Schedule', date: 'Mar 5, 2025', content: 'The midterm exam will be held on March 15th.' },
        { id: 2, title: 'New Assignment Posted', date: 'Mar 2, 2025', content: 'React Todo App assignment is now available.' },
      ]
    },
    2: {
      id: 2,
      name: 'Data Structures',
      code: 'CS202',
      instructor: 'Prof. Johnson',
      instructorEmail: 'prof.johnson@minsuelearn.com',
      progress: 60,
      students: 50,
      duration: '14 weeks',
      startDate: 'Jan 10, 2025',
      endDate: 'Apr 20, 2025',
      description: 'Master essential data structures including arrays, linked lists, trees, graphs, and their algorithms.',
      modules: [
        { id: 1, title: 'Arrays and Lists', completed: true, duration: '3 hours', lessons: 10 },
        { id: 2, title: 'Stacks and Queues', completed: true, duration: '2 hours', lessons: 8 },
        { id: 3, title: 'Trees and Binary Search', completed: false, duration: '4 hours', lessons: 12 },
        { id: 4, title: 'Graphs and Algorithms', completed: false, duration: '5 hours', lessons: 15 },
      ],
      assignments: [
        { id: 1, title: 'Array Manipulation', due: 'Feb 5, 2025', status: 'completed', grade: 92 },
        { id: 2, title: 'Stack Implementation', due: 'Feb 20, 2025', status: 'completed', grade: 85 },
        { id: 3, title: 'Binary Tree Traversal', due: 'Mar 10, 2025', status: 'pending', grade: null },
      ],
      announcements: [
        { id: 1, title: 'Office Hours Updated', date: 'Mar 1, 2025', content: 'New office hours: Tuesdays 2-4 PM.' },
      ]
    },
    3: {
      id: 3,
      name: 'Database Systems',
      code: 'CS303',
      instructor: 'Dr. Williams',
      instructorEmail: 'dr.williams@minsuelearn.com',
      progress: 85,
      students: 38,
      duration: '10 weeks',
      startDate: 'Feb 1, 2025',
      endDate: 'Apr 15, 2025',
      description: 'Learn database design, SQL, normalization, and work with modern database systems.',
      modules: [
        { id: 1, title: 'Database Fundamentals', completed: true, duration: '2 hours', lessons: 8 },
        { id: 2, title: 'SQL Basics', completed: true, duration: '3 hours', lessons: 12 },
        { id: 3, title: 'Advanced SQL', completed: true, duration: '4 hours', lessons: 15 },
        { id: 4, title: 'Database Design', completed: false, duration: '3 hours', lessons: 10 },
      ],
      assignments: [
        { id: 1, title: 'ER Diagram Design', due: 'Feb 20, 2025', status: 'completed', grade: 98 },
        { id: 2, title: 'SQL Queries Practice', due: 'Mar 5, 2025', status: 'completed', grade: 90 },
        { id: 3, title: 'Normalization Exercise', due: 'Mar 25, 2025', status: 'submitted', grade: null },
      ],
      announcements: [
        { id: 1, title: 'Final Project Details', date: 'Mar 3, 2025', content: 'Final project specifications are now available.' },
      ]
    }
  };

  const course = courseData[courseId] || courseData[1];
  const completedModules = course.modules.filter(m => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <button
          onClick={() => navigate('/student/courses')}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-500 mb-4 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Courses</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span className="bg-gray-800 px-3 py-1 rounded-lg">{course.code}</span>
              <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-lg border border-orange-500/20">
                {course.progress}% Complete
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{course.name}</h1>
            <p className="text-gray-400 mb-4">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={16} className="text-orange-500" />
                <span>{course.instructor}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock size={16} className="text-orange-500" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={16} className="text-orange-500" />
                <span>{course.startDate} - {course.endDate}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to={`/student/forums`}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <MessageSquare size={18} />
              <span>Discussions</span>
            </Link>
            <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center gap-2">
              <Download size={18} />
              <span>Resources</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Course Progress</span>
            <span className="text-orange-500 font-semibold">{completedModules} / {course.modules.length} modules completed</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'modules', label: 'Modules', icon: PlayCircle },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'announcements', label: 'Announcements', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'text-orange-500 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Course Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Modules</span>
                  <span className="text-white font-semibold">{course.modules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400 font-semibold">{completedModules}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assignments</span>
                  <span className="text-white font-semibold">{course.assignments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Students</span>
                  <span className="text-white font-semibold">{course.students}</span>
                </div>
              </div>
            </motion.div>

            {/* Instructor Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Instructor</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                  <Users size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-white font-semibold">{course.instructor}</p>
                  <p className="text-gray-400 text-sm">{course.instructorEmail}</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition">
                Contact Instructor
              </button>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-300">
                  Download Course Syllabus
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-300">
                  View Grade Book
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-gray-300">
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="space-y-4">
            {course.modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-orange-500/50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      module.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-gray-800'
                    }`}>
                      {module.completed ? (
                        <CheckCircle size={24} className="text-green-400" />
                      ) : (
                        <PlayCircle size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {module.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {module.lessons} lessons
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-sm font-medium">
                    {module.completed ? 'Review' : 'Start'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {course.assignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white">{assignment.title}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        assignment.status === 'completed' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : assignment.status === 'submitted'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Due: {assignment.due}
                      </span>
                      {assignment.grade && (
                        <span className="text-green-400 font-semibold">
                          Grade: {assignment.grade}%
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/student/assignments"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {course.announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={20} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{announcement.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{announcement.date}</p>
                    <p className="text-gray-300">{announcement.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { BookOpen, Users, Clock, ChevronRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';

export default function Courses() {
  const [activeTab, setActiveTab] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyCourses();
      if (response.success) {
        setCourses(response.classes || []);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in-progress') return course.progress < 100;
    if (activeTab === 'completed') return course.progress === 100;
    return true;
  });

  // (Course stats removed — not used after removing stats cards)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-orange-500" size={28} />
          My Courses
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {loading ? 'Loading...' : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'Course' : 'Courses'}`}
        </p>
      </div>

      {/* Stats Cards removed as requested */}

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
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading your courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No courses found</h3>
            <p className="text-gray-400">
              {activeTab === 'all' 
                ? "You haven't enrolled in any courses yet." 
                : `No ${activeTab.replace('-', ' ')} courses.`}
            </p>
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition group flex flex-col h-full"
            >
              {/* Course Image */}
              <div className="aspect-video bg-gradient-to-br from-orange-500/10 to-purple-500/10 relative overflow-hidden">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.course_name || course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
                  <Clock size={16} className="text-orange-400" />
                  <span>{course.semester || 'Ongoing'}</span>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <span className="bg-gray-800 px-2 py-1 rounded">
                      {course.course_code || course.code || 'N/A'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-500 transition">
                    {course.course_name || course.name || course.subject_name}
                  </h3>
                  {/* Instructor Info */}
                  <div className="flex items-center gap-2 mt-2">
                    {course.faculty?.profile_image ? (
                      <img 
                        src={course.faculty.profile_image} 
                        alt={course.faculty.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <User size={14} className="text-orange-400" />
                      </div>
                    )}
                    <p className="text-sm text-gray-400">
                      {course.faculty?.name || 'Instructor'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-800/50 border border-orange-500 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Credits</p>
                    <p className="text-lg font-bold text-white">{course.credits || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 border border-orange-500 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-bold text-green-400 capitalize">{course.status || 'Active'}</p>
                  </div>
                </div>

                {/* Action Button */}
                <Link
                  to={`/student/courses/${course.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30 mt-4"
                >
                  View Course
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { BookOpen, Clock, Users, Star, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import { courseAPI } from '../services/api';

export default function Courses() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      if (response.success) {
        setCourses(response.courses || []);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Web Development', 'Data Science', 'Design', 'Business', 'Marketing'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 overflow-x-hidden">
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-16 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6">
              Explore Our{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Courses
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Discover 200+ expert-led courses designed to help you master new skills and advance your career.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white/70"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category === 'All' ? 'all' : category)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    (category === 'All' ? 'all' : category) === selectedCategory
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {loading ? 'Loading...' : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'Course' : 'Courses'} Available`}
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition border border-gray-700">
              <Filter size={18} />
              Sort By
            </button>
          </div>

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={fetchCourses} className="px-4 py-2 bg-orange-500 text-white rounded-lg">
                Try Again
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-800"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-800 rounded mb-2"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/50 transition group flex flex-col h-full"
                >
                  {/* Course Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-800">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20"></div>
                    <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      Free
                    </div>
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-sm font-medium rounded-lg">
                      {course.semester || 'Ongoing'}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="text-xs text-orange-400 font-semibold mb-2">{course.code}</div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                      {course.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {course.description || 'This course will provide you with comprehensive knowledge and practical skills.'}
                    </p>

                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>{course.students} student{course.students !== 1 ? 's' : ''}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <BookOpen size={16} />
                        <span>{course.credits} Credit{course.credits !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock size={16} />
                        <span>{course.academic_year}</span>
                      </div>
                      <Link
                        to={`/invite/${course.id}`}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No courses found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

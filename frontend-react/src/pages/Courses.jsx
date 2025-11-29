import { BookOpen, Clock, Users, Star, Search, Filter, FileText, Eye, ChevronUp } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
  const [showScrollUp, setShowScrollUp] = useState(false);

  const categories = ['All', 'Web Development', 'Data Science', 'Design', 'Business', 'Marketing'];

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseAPI.getAll();
      
      if (response.success) {
        // Transform API response to match component expectations
        const formattedCourses = response.courses.map(course => ({
          id: course.id,
          code: course.code,
          title: course.name,
          description: course.description || 'No description available.',
          credits: course.credits,
          semester: course.semester,
          year_level: course.year_level,
          section: course.section,
          academic_year: course.academic_year,
          thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80',
          status: course.status,
          students: course.students || 0,
          assignments: course.assignments || 0,
          announcements: course.announcements || 0,
          category: getCategoryFromCourse(course),
          instructor: 'Instructor', // We'll need to fetch instructor info separately
          rating: 4.5, // Default rating since it's not in API
          duration: `${course.credits * 15} hours`, // Estimate based on credits
          level: course.year_level || 'All Levels',
          price: 'Free',
        }));
        setCourses(formattedCourses);
      } else {
        setError('Failed to load courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Handle scroll for scroll up button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollUp(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Helper function to determine category from course data
  const getCategoryFromCourse = (course) => {
    // You can customize this logic based on your course naming conventions
    const courseName = course.name.toLowerCase();
    
    if (courseName.includes('web') || courseName.includes('javascript') || courseName.includes('html') || courseName.includes('css')) {
      return 'Web Development';
    } else if (courseName.includes('data') || courseName.includes('python') || courseName.includes('machine') || courseName.includes('ai')) {
      return 'Data Science';
    } else if (courseName.includes('design') || courseName.includes('ui') || courseName.includes('ux')) {
      return 'Design';
    } else if (courseName.includes('business') || courseName.includes('management')) {
      return 'Business';
    } else if (courseName.includes('marketing') || courseName.includes('digital')) {
      return 'Marketing';
    } else {
      return 'Web Development'; // Default category
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0 overflow-x-hidden">
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-white dark:bg-gray-800 py-16 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Explore Our{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                Courses
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Discover 200+ expert-led courses designed to help you master new skills and advance your career.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={20} />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-orange-500 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-white"
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
                      ? 'bg-orange-500 text-white border border-orange-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-white hover:bg-gray-200 dark:hover:bg-gray-600 border border-orange-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses List */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">
              {loading ? 'Loading Courses...' : `${filteredCourses.length} ${filteredCourses.length === 1 ? 'Course' : 'Courses'} Available`}
            </h2>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-white rounded-lg transition border border-orange-500">
                <Filter size={18} />
                Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
                <Search size={18} />
                Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-500 p-8">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-500 p-12 text-center">
              <BookOpen size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Courses</h3>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-500 p-12 text-center">
              <BookOpen size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No courses found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px]">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Thumbnail</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Course Code</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Course Name</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Description</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Credits</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Semester</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Year Level</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Section</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Academic Year</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Students</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Assignments</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Announcements</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-white border-b-2 border-orange-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-500">
                    {filteredCourses.map((course, index) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-800 transition-colors"
                      >
                        <td className="py-4 px-6">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <BookOpen size={24} className="text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white font-semibold text-lg">{course.code}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-white font-medium">{course.title}</p>
                        </td>
                        <td className="py-4 px-6 max-w-sm">
                          <p className="text-white text-sm line-clamp-3">{course.description}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-medium text-lg">{course.credits}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-medium">{course.semester}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white">{course.year_level || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white">{course.section || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-white font-medium">{course.academic_year}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users size={18} className="text-white" />
                            <span className="text-white font-bold text-lg">{course.students}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <FileText className="text-white" size={18} />
                            <span className="text-white font-bold text-lg">{course.assignments}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-white" size={18} />
                            <span className="text-white font-bold text-lg">{course.announcements}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-4 py-2 rounded-full text-sm font-bold capitalize text-white ${
                              course.status === 'active'
                                ? 'bg-green-700'
                                : course.status === 'inactive'
                                ? 'bg-gray-700'
                                : 'bg-red-700'
                            }`}
                          >
                            {course.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Scroll Up Button */}
      <AnimatePresence>
        {showScrollUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
            title="Scroll to top"
          >
            <ChevronUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

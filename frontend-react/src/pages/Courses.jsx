import { motion } from 'framer-motion';
import { BookOpen, Clock, Users, Star, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';

export default function Courses() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['All', 'Web Development', 'Data Science', 'Design', 'Business', 'Marketing'];

  const courses = [
    {
      id: 1,
      title: 'Complete Web Development Bootcamp',
      category: 'Web Development',
      instructor: 'John Doe',
      rating: 4.8,
      students: 1234,
      duration: '12 weeks',
      level: 'Beginner',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500',
      description: 'Learn HTML, CSS, JavaScript, React, Node.js and more from scratch.',
    },
    {
      id: 2,
      title: 'Data Science & Machine Learning',
      category: 'Data Science',
      instructor: 'Jane Smith',
      rating: 4.9,
      students: 987,
      duration: '16 weeks',
      level: 'Intermediate',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500',
      description: 'Master Python, pandas, scikit-learn, and deep learning fundamentals.',
    },
    {
      id: 3,
      title: 'UI/UX Design Masterclass',
      category: 'Design',
      instructor: 'Mike Johnson',
      rating: 4.7,
      students: 856,
      duration: '8 weeks',
      level: 'Beginner',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500',
      description: 'Create stunning user interfaces with Figma, Adobe XD, and design principles.',
    },
    {
      id: 4,
      title: 'Digital Marketing Strategy',
      category: 'Marketing',
      instructor: 'Sarah Williams',
      rating: 4.6,
      students: 743,
      duration: '10 weeks',
      level: 'Beginner',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500',
      description: 'Learn SEO, social media marketing, content strategy, and analytics.',
    },
    {
      id: 5,
      title: 'Business Management Fundamentals',
      category: 'Business',
      instructor: 'Robert Brown',
      rating: 4.5,
      students: 612,
      duration: '12 weeks',
      level: 'Beginner',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500',
      description: 'Essential business skills including finance, leadership, and strategy.',
    },
    {
      id: 6,
      title: 'Advanced JavaScript & TypeScript',
      category: 'Web Development',
      instructor: 'Emily Davis',
      rating: 4.9,
      students: 1089,
      duration: '14 weeks',
      level: 'Advanced',
      price: 'Free',
      image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500',
      description: 'Deep dive into modern JavaScript, TypeScript, and advanced patterns.',
    },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
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
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
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
              {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'} Available
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition border border-gray-700">
              <Filter size={18} />
              Sort By
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-orange-500/50 transition-all group flex flex-col h-full"
              >
                {/* Course Image */}
                <div className="relative h-48 overflow-hidden bg-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20"></div>
                  <div className="absolute top-4 right-4 px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                    {course.price}
                  </div>
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-gray-900/80 backdrop-blur-sm text-white text-sm font-medium rounded-lg">
                    {course.level}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="text-xs text-orange-400 font-semibold mb-2">{course.category}</div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-semibold">{course.rating}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>{course.students.toLocaleString()} students</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={16} />
                      <span>{course.duration}</span>
                    </div>
                    <button
                      onClick={() => setLoginModalOpen(true)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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

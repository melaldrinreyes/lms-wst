import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, ArrowRight, GraduationCap, CheckCircle, Sparkles, Target, Zap, Heart, TrendingUp, Users, ClipboardList, Home as HomeIcon, Info, Award, LogIn } from 'lucide-react';
import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

export default function Home() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // About page data
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To make quality education accessible to everyone, everywhere. We believe learning should be flexible, engaging, and tailored to individual needs.',
      color: 'orange',
    },
    {
      icon: Heart,
      title: 'Student-Centered',
      description: 'Every decision we make puts students first. From course design to platform features, we focus on creating the best learning experience possible.',
      color: 'red',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We leverage cutting-edge technology, including AI-powered assistance, to enhance learning and provide personalized support 24/7.',
      color: 'yellow',
    },
  ];

  const milestones = [
    { year: '01', event: 'Project conceptualization and requirements gathering with MINSU faculty and administration.' },
    { year: '02', event: 'System architecture design and development of core authentication and authorization modules.' },
    { year: '03', event: 'Implementation of course management system with WYSIWYG editor and hierarchical lecture structure.' },
    { year: '04', event: 'Development of assignment submission system with multi-file upload and grading capabilities.' },
    { year: '05', event: 'Integration of announcements system with real-time commenting and notification features.' },
    { year: '06', event: 'Comprehensive security audit, testing, and deployment for MINSU university community.' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 overflow-x-hidden">
      <Navbar />
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)}
      />
      
      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-20 lg:py-32 mt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1920&q=80)',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/70 via-gray-950/80 to-gray-950/90"></div>
        </div>

        {/* Animated Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-8"
            >
              <Sparkles size={16} className="text-orange-500" />
              <span className="text-orange-400 text-sm font-medium">Welcome to the Future of Learning</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Transform Your Learning with{' '}
              <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                MINSU E-LEARN
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed"
            >
              A comprehensive Learning Management System designed for educational excellence. 
              Streamlined course management, assignment tracking, and seamless collaboration between faculty and students.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 flex items-center justify-center gap-2"
              >
                Get Started
              </button>
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all border border-gray-700 flex items-center justify-center gap-2"
              >
                Create Account
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="why-choose" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose MINSU E-LEARN?
            </h2>
            <p className="text-gray-300 text-base sm:text-lg">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Organized Course Content',
                description: 'Access well-structured lectures with rich multimedia content. Each course has organized modules for easy navigation.',
                color: 'orange',
              },
              {
                icon: Users,
                title: 'Role-Based Access',
                description: 'Dedicated dashboards for students, faculty, and administrators. Each role has tailored features and permissions.',
                color: 'blue',
              },
              {
                icon: ClipboardList,
                title: 'Assignment Management',
                description: 'Submit assignments, track deadlines, and receive feedback. Faculty can create, grade, and manage submissions efficiently.',
                color: 'green',
              },
              {
                icon: MessageCircle,
                title: 'Announcements & Updates',
                description: 'Stay informed with course announcements and important updates. Real-time notifications keep everyone connected.',
                color: 'purple',
              },
              {
                icon: GraduationCap,
                title: 'Student Enrollment',
                description: 'Easy course enrollment system with approval workflow. Students can browse and request access to available courses.',
                color: 'pink',
              },
              {
                icon: CheckCircle,
                title: 'Progress Tracking',
                description: 'Monitor your learning progress with detailed dashboards. View submitted assignments, grades, and course completion status.',
                color: 'yellow',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-8 hover:border-orange-500/50 transition-all group"
              >
                <div className={`w-14 h-14 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} className={`text-${feature.color}-500`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative overflow-hidden bg-gray-950">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-orange-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join MINSU E-LEARN today and unlock your potential with world-class education.
            </p>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 px-10 py-5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 text-lg"
            >
              Get Started Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800 rounded-2xl border border-gray-700 p-8 hover:border-orange-500/50 transition-all"
              >
                <div className={`w-14 h-14 bg-${value.color}-500/10 rounded-xl flex items-center justify-center mb-6`}>
                  <value.icon size={28} className={`text-${value.color}-500`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-20 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-300 leading-relaxed">
                <p>
                  Our platform was created to provide accessible and high-quality education to students within our local community. 
                  With a focus on innovation and collaboration, we aim to empower learners to achieve their academic and personal goals.
                </p>
                <p>
                  Since our inception, we have grown into a trusted resource for local students and educators. Our courses are 
                  tailored to meet the specific needs of our community, ensuring that everyone has the opportunity to learn and succeed.
                </p>
                <p>
                  We remain committed to enhancing the learning experience by introducing new tools and resources. Together, we 
                  are shaping the future of education for our local community.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-orange-500 text-sm mb-1">{milestone.year}</div>
                    <p className="text-gray-300 leading-relaxed">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => scrollToSection('home')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeSection === 'home' ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <HomeIcon size={20} />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => scrollToSection('why-choose')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeSection === 'why-choose' ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <Award size={20} />
            <span className="text-xs font-medium">Features</span>
          </button>
          
          <button
            onClick={() => scrollToSection('values')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeSection === 'values' ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <Heart size={20} />
            <span className="text-xs font-medium">Values</span>
          </button>
          
          <button
            onClick={() => scrollToSection('story')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeSection === 'story' ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <Info size={20} />
            <span className="text-xs font-medium">Story</span>
          </button>

          <button
            onClick={() => setLoginModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <LogIn size={20} />
            <span className="text-xs font-medium">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
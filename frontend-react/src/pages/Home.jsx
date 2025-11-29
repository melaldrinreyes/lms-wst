import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, ArrowRight, GraduationCap, CheckCircle, Sparkles, Target, Zap, Heart, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

export default function Home() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

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
    { year: '2020', event: 'Initial concept and planning for the LMS system.' },
    { year: '2021', event: 'Development of core features and internal testing.' },
    { year: '2022', event: 'Launch of the platform for local students with foundational modules.' },
    { year: '2023', event: 'Enhanced user interface and added new course categories tailored to local needs.' },
    { year: '2024', event: 'Introduced faculty and student dashboards for better management.' },
    { year: '2025', event: 'Implemented mobile responsiveness and advanced reporting tools for local institutions.' },
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
        onSwitchToForgotPassword={() => {
          setLoginModalOpen(false);
          setForgotPasswordModalOpen(true);
        }}
      />
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)}
      />
      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onBackToLogin={() => {
          setForgotPasswordModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
      
      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-20 lg:py-32 mt-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-sm"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1920&q=80)',
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-gray-950/50 to-gray-950/60"></div>
        </div>

        {/* Animated Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
              className="text-lg sm:text-xl text-gray-400 mb-12 leading-relaxed"
            >
              Join thousands of students mastering new skills with our comprehensive online learning platform. 
              Expert-led courses, 24/7 AI support, and a thriving community await you.
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
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-8 py-4 bg-gray-800/50 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700 hover:border-gray-600 flex items-center justify-center gap-2"
              >
                Create Account
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="why-choose" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose MINSU E-LEARN?
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
              Discover the features that make learning management seamless and effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Comprehensive Course Management',
                description: 'Access all your enrolled courses, lecture materials, and course content in one centralized platform.',
                color: 'orange',
              },
              {
                icon: MessageCircle,
                title: 'Interactive Learning',
                description: 'Engage with course content through hierarchical lectures, assignments, and real-time announcements.',
                color: 'blue',
              },
              {
                icon: Users,
                title: 'Student-Teacher Collaboration',
                description: 'Connect directly with instructors, submit assignments, and receive personalized feedback on your work.',
                color: 'green',
              },
              {
                icon: GraduationCap,
                title: 'Progress Tracking',
                description: 'Monitor your academic progress, view grades, and track assignment submissions across all courses.',
                color: 'purple',
              },
              {
                icon: CheckCircle,
                title: 'Secure & Reliable',
                description: 'Experience a secure learning environment with reliable access to course materials and resources.',
                color: 'pink',
              },
              {
                icon: CheckCircle,
                title: 'Flexible Access',
                description: 'Study anytime, anywhere with 24/7 access to course materials, assignments, and learning resources.',
                color: 'yellow',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 p-8 hover:border-orange-500/50 transition-all group"
              >
                <div className={`w-14 h-14 bg-${feature.color}-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={28} className={`text-${feature.color}-500`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative overflow-hidden">
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
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join MINSU E-LEARN today and unlock your potential with world-class education.
            </p>
            <button
              onClick={() => setRegisterModalOpen(true)}
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 text-lg"
            >
              Get Started Now
              <ArrowRight size={24} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
                className="bg-gray-900 rounded-2xl border border-gray-800 p-8 hover:border-orange-500/50 transition-all"
              >
                <div className={`w-14 h-14 bg-${value.color}-500/10 rounded-xl flex items-center justify-center mb-6`}>
                  <value.icon size={28} className={`text-${value.color}-500`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="story" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
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
              className="space-y-4"
            >
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                  <div className="flex-1 pb-4 border-l border-orange-500 pl-4">
                    <p className="text-gray-300">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-orange-500/10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Join Our Growing Community
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Be part of a global learning community. Start your journey with MINSU E-LEARN today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setRegisterModalOpen(true)}
                className="px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/50 text-lg inline-flex items-center justify-center gap-2"
              >
                Get Started Free
                <TrendingUp size={20} />
              </button>
              <Link
                to="/courses"
                className="px-10 py-5 bg-gray-800/50 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all border border-gray-700 hover:border-gray-600 text-lg inline-flex items-center justify-center gap-2"
              >
                Explore Courses
                <BookOpen size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
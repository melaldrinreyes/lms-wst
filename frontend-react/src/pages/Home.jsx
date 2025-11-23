import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, ArrowRight, GraduationCap, CheckCircle, Sparkles, Target, Award, Zap, Heart, Globe, TrendingUp } from 'lucide-react';
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
  const stats = [
    { icon: Users, value: '5,000+', label: 'Active Students' },
    { icon: BookOpen, value: '200+', label: 'Expert Courses' },
    { icon: Award, value: '150+', label: 'Top Instructors' },
    { icon: Globe, value: '50+', label: 'Countries Reached' },
  ];

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

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Founder & CEO',
      image: 'https://i.pravatar.cc/300?img=1',
      bio: '15+ years in education technology',
    },
    {
      name: 'Michael Chen',
      role: 'Head of Product',
      image: 'https://i.pravatar.cc/300?img=13',
      bio: 'Former Google engineer',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Chief Learning Officer',
      image: 'https://i.pravatar.cc/300?img=5',
      bio: 'PhD in Educational Psychology',
    },
    {
      name: 'David Kim',
      role: 'Head of Engineering',
      image: 'https://i.pravatar.cc/300?img=12',
      bio: '10+ years in EdTech',
    },
  ];

  const milestones = [
    { year: '2020', event: 'MINSU E-LEARN founded with a vision to democratize education' },
    { year: '2021', event: 'Launched first 50 courses, reached 1,000 students' },
    { year: '2022', event: 'Introduced AI-powered chatbot for 24/7 student support' },
    { year: '2023', event: 'Expanded to 100+ courses, 50 countries, 3,000+ students' },
    { year: '2024', event: 'Reached 5,000+ students, 200+ courses, 150+ instructors' },
    { year: '2025', event: 'Launched mobile app and advanced certification programs' },
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

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">5K+</div>
                <div className="text-sm text-gray-400">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">200+</div>
                <div className="text-sm text-gray-400">Quality Courses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">150+</div>
                <div className="text-sm text-gray-400">Expert Instructors</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">95%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Why Choose MINSU E-LEARN?
            </h2>
            <p className="text-gray-400 text-base sm:text-lg">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Expert-Led Courses',
                description: 'Learn from industry professionals with real-world experience across 200+ courses.',
                color: 'orange',
              },
              {
                icon: MessageCircle,
                title: '24/7 AI Assistant',
                description: 'Get instant help anytime with our intelligent chatbot that understands your needs.',
                color: 'blue',
              },
              {
                icon: Users,
                title: 'Thriving Community',
                description: 'Connect with 5,000+ active learners, share knowledge, and grow together.',
                color: 'green',
              },
              {
                icon: GraduationCap,
                title: 'Industry Certifications',
                description: 'Earn recognized certificates that boost your career and validate your skills.',
                color: 'purple',
              },
              {
                icon: CheckCircle,
                title: 'Proven Success',
                description: '95% of our students achieve their learning goals and advance their careers.',
                color: 'pink',
              },
              {
                icon: CheckCircle,
                title: 'Flexible Learning',
                description: 'Study at your own pace, anytime, anywhere. Access course materials 24/7.',
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

      {/* About Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 py-20 border-b border-gray-800 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6">
              About{' '}
              <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                MINSU E-LEARN
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
              Empowering learners worldwide with accessible, high-quality education. 
              We're on a mission to transform lives through innovative online learning experiences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-2xl mb-4">
                  <stat.icon size={32} className="text-orange-500" />
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
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
      <section className="py-20 bg-gray-900/50">
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
                  MINSU E-LEARN was born from a simple yet powerful idea: education should be accessible to everyone, 
                  regardless of location, background, or circumstances. Founded in 2020, we set out to create a 
                  learning platform that combines expert instruction with cutting-edge technology.
                </p>
                <p>
                  What started as a small team of passionate educators and technologists has grown into a thriving 
                  community of over 5,000 students across 50 countries. We've partnered with 150+ top instructors 
                  to create 200+ courses spanning technology, business, design, and more.
                </p>
                <p>
                  Our AI-powered chatbot, launched in 2022, revolutionized student support by providing instant, 
                  personalized assistance 24/7. We're constantly innovating to make learning more engaging, 
                  effective, and accessible for everyone.
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
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-right">
                    <div className="text-orange-500 font-bold text-lg">{milestone.year}</div>
                  </div>
                  <div className="flex-shrink-0 w-px bg-orange-500/30 relative">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-gray-300">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Meet Our Leadership</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Experienced leaders passionate about transforming education
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 p-6 text-center hover:border-orange-500/50 transition-all"
              >
                <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-orange-500/20">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <div className="text-orange-400 text-sm font-medium mb-2">{member.role}</div>
                <p className="text-gray-400 text-sm">{member.bio}</p>
              </motion.div>
            ))}
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
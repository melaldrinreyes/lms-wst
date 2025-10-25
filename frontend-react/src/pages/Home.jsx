import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, ArrowRight, GraduationCap, CheckCircle, Sparkles } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 overflow-x-hidden">
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
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background */}
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

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Join MINSU E-LEARN today and unlock your potential with world-class education.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/50 hover:shadow-orange-500/70 text-lg"
            >
              Get Started Now
              <ArrowRight size={24} />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
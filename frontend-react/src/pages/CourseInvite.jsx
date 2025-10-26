import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar,
  CheckCircle,
  ArrowRight,
  FileText,
  Award,
  User,
  Mail,
  AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { courseAPI } from '../services/api';
import Toast from '../components/ui/Toast';
import LoginModal from '../components/LoginModal';

export default function CourseInvite() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [toast, setToast] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    
    // Show prompt if user is not logged in
    if (!user && !sessionStorage.getItem('loginPromptShown')) {
      setToast({ 
        message: 'Please log in to enroll in this course', 
        type: 'info' 
      });
      sessionStorage.setItem('loginPromptShown', 'true');
    }
  }, [id, user]);

  // Clean up login prompt flag when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('loginPromptShown');
    };
  }, []);

  // Auto-enroll after login
  useEffect(() => {
    const shouldAutoEnroll = sessionStorage.getItem('autoEnrollCourseId');
    if (shouldAutoEnroll === id && user) {
      sessionStorage.removeItem('autoEnrollCourseId');
      handleEnroll();
    }
  }, [user, id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getOne(id);
      if (response.success) {
        setCourse(response.course);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({ message: 'Failed to load course details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      // Store the course ID for auto-enrollment after login
      sessionStorage.setItem('autoEnrollCourseId', id);
      setShowLoginModal(true);
      return;
    }

    // Check if user is a student
    if (user.role_id !== 3 && user.role !== 'student') {
      setToast({ 
        message: 'Only students can enroll in courses.', 
        type: 'error' 
      });
      return;
    }

    try {
      setEnrolling(true);
      console.log('Enrolling user:', user.id, 'in course:', id);
      const response = await courseAPI.enroll(id);
      console.log('Enrollment response:', response);
      
      if (response.success) {
        // Check if the message indicates approval is needed
        const needsApproval = response.message && response.message.toLowerCase().includes('approval');
        
        if (needsApproval) {
          // Show the success modal
          setShowSuccessModal(true);
          setToast({ 
            message: 'Enrollment request submitted successfully!', 
            type: 'success' 
          });
        } else {
          // Direct enrollment (if approval not needed)
          setToast({ 
            message: 'Successfully enrolled in the course!', 
            type: 'success' 
          });
          setTimeout(() => {
            navigate(`/student/courses/${id}`);
          }, 1500);
        }
      } else {
        throw new Error(response.message || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });
      
      // Get the error message from the response
      const errorMessage = error.response?.data?.message || error.message || 'Failed to enroll in course. Please try again.';
      
      setToast({ 
        message: errorMessage, 
        type: 'error' 
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    // After successful login, the auto-enroll effect will trigger
    // Just close the modal
    setShowLoginModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading course details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">Course Not Found</h2>
            <p className="mt-2 text-gray-300">
              The course you're looking for doesn't exist or is no longer available.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Browse Courses
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {showLoginModal && (
        <LoginModal 
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gray-900 dark:bg-gray-950 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-800"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white text-center">
              <div className="w-20 h-20 bg-gray-900/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Request Submitted!
              </h3>
              <p className="text-green-100">
                Your enrollment request has been sent
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                      What happens next?
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      The instructor will review your request. You'll be notified once it's approved, and you can then access the course materials.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/student');
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full bg-gray-800 border border-gray-700 text-gray-300 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  Stay on Page
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Login Required Banner */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border-b border-blue-500/20"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-blue-300 font-semibold">Login Required</p>
                  <p className="text-blue-400/80 text-sm">You need to log in to enroll in this course</p>
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem('autoEnrollCourseId', id);
                  setShowLoginModal(true);
                }}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium whitespace-nowrap"
              >
                Log In Now
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 md:p-12 text-white mb-8"
        >
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gray-900/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Course Invitation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              You've Been Invited to Join
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-orange-100 mb-2">
              {course.name}
            </p>
            <p className="text-lg text-orange-100 mb-6">
              {course.code}
            </p>
            <div className="bg-gray-900/20 backdrop-blur-sm border border-white/30 rounded-lg p-4">
              <p className="text-sm">
                {!user ? (
                  <><strong>Note:</strong> You need to be logged in to enroll in this course.</>
                ) : (
                  <><strong>Note:</strong> After submitting your enrollment request, please wait for the instructor to approve it before you can access the course.</>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Course Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg border border-gray-800 p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                About This Course
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {course.description || 'This course will provide you with comprehensive knowledge and practical skills in the subject matter.'}
              </p>
            </motion.div>

            {/* What You'll Learn */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg border border-gray-800 p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                What You'll Learn
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  'Comprehensive course content',
                  'Hands-on practical exercises',
                  'Real-world applications',
                  'Expert instructor guidance',
                  'Interactive learning materials',
                  'Assessment and feedback'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Instructor Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg border border-gray-800 p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                Your Instructor
              </h2>
              <div className="flex items-start gap-4">
                {course.faculty?.profile_image ? (
                  <img 
                    src={course.faculty.profile_image} 
                    alt={course.faculty.name}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {course.faculty?.name || 'Expert Instructor'}
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Course Instructor
                  </p>
                  {course.faculty?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{course.faculty.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-lg border border-gray-800 p-6 sticky top-6"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready to Request Enrollment?
                </h3>
                <p className="text-gray-300 text-sm">
                  Submit your enrollment request and the instructor will review it
                </p>
              </div>

              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrolling ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting Request...
                  </>
                ) : user ? (
                  <>
                    Request to Enroll
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Login to Enroll
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="mt-3 text-xs text-center text-gray-400">
                Your enrollment request will be sent to the instructor for approval
              </p>

              <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Users className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">
                    {course.students || 0} student{course.students !== 1 ? 's' : ''} enrolled
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">
                    {course.credits || 3} Credit{course.credits !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">
                    {course.semester} {course.academic_year}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span className="text-sm">
                    {course.modules?.length || 0} Module{course.modules?.length !== 1 ? 's' : ''} • {course.assignments?.length || 0} Assignment{course.assignments?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </motion.div>            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-950/30 to-indigo-950/30 rounded-xl p-6 border border-blue-800"
            >
              <h4 className="font-semibold text-white mb-3">
                Course Benefits
              </h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Lifetime access to course materials</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Regular updates and new content</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Certificate upon completion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>Direct instructor support</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileEdit, ArrowLeft } from 'lucide-react';
import HierarchicalLectureContent from '../../components/HierarchicalLectureContent';
import MobileBottomNav from '../../components/MobileBottomNav';
import Toast from '../../components/ui/Toast';
import { courseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function CourseContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Check if user is a teacher (faculty or admin)
  const isTeacher = user?.role === 'faculty' || user?.role === 'admin';
  // Check if this is student view based on URL
  const isStudentView = location.pathname.includes('/student/');

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await courseAPI.getOne(id);
      if (response.success) {
        setCourse(response.data);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setToast({ message: 'Failed to load course', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If this is the student view, suppress the global navbar mobile nav
  // so we can render a page-specific mobile nav for content.
  useEffect(() => {
    if (isStudentView) {
      try { document.body.classList.add('mobile-nav-inline'); } catch (err) { void err; }
      return () => { try { document.body.classList.remove('mobile-nav-inline'); } catch (err) { void err; } };
    }
    return undefined;
  }, [isStudentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-[#1d2026]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full md:h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - Fixed on mobile, static on desktop */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 fixed top-0 left-0 right-0 z-30 md:static">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (isStudentView) {
                navigate(`/student/courses/${id}`);
              } else {
                navigate(`/faculty/courses/${id}`);
              }
            }}
            className="p-2 text-[#718096] hover:text-gray-900 hover:bg-white rounded-xl transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
              {course?.title || 'Course Content'}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
              {isStudentView ? 'View course content' : 'Create and manage course content'}
            </p>
          </div>
        </div>
      </div>

      {/* Content Editor - NetAcad Style */}
      <div className="flex-1 bg-white overflow-hidden pt-[64px] md:pt-0">
        <div className="relative min-h-0">
          <div className="pb-20 md:pb-0">
            <HierarchicalLectureContent 
              courseId={id}
              isTeacher={isTeacher && !isStudentView}
              onSave={() => {
                setToast({ 
                  message: 'Course content saved successfully!', 
                  type: 'success' 
                });
              }}
            />
          </div>

          {isStudentView && (
            <div className="md:hidden absolute left-0 right-0 bottom-0">
              <div className="px-3 py-2 bg-white border-t border-gray-200">
                <MobileBottomNav />
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default CourseContent;

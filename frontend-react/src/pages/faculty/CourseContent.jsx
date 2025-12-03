import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileEdit, ArrowLeft } from 'lucide-react';
import HierarchicalLectureContent from '../../components/HierarchicalLectureContent';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full md:h-screen bg-white flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => {
              if (isStudentView) {
                navigate(`/student/courses/${id}`);
              } else {
                navigate(`/faculty/courses/${id}`);
              }
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
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
      <div className="flex-1 bg-gray-50 overflow-hidden">
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

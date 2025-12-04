import React from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  FileText,
  Edit,
  Trash2,
  Eye,
  Share2,
  Check,
  BarChart
} from 'lucide-react';

const CourseCard = ({
  course,
  variant = 'student', // 'student' or 'teacher'
  onEdit,
  onDelete,
  onShare,
  copiedCourseId,
  className = '',
  index = 0
}) => {
  const isTeacher = variant === 'teacher';

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#FF4C60] hover:shadow-xl transition-all group flex flex-col h-full ${className}`}
    >
      {/* Thumbnail - Same for both variants */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#152d4a]">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-[#718096]" />
          </div>
        )}
        {/* Status badge - Same for both variants */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            course.status === 'active' ? 'bg-green-500 text-white' :
            course.status === 'inactive' ? 'bg-white text-[#1d2026]' : 'bg-[#FF4C60] text-white'
          }`}>
            {course.status || 'active'}
          </span>
        </div>
      </div>

      {/* Content - Same structure for both variants */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            { (course.code || course.name || course.title || course.course_name) && (
              <>
                {course.code && <span className="text-sm font-semibold text-[#FF4C60]">{course.code}</span>}
                <h3 className="text-xl font-bold text-gray-900 mt-1 truncate">
                  {course.name || course.title || course.course_name || course.code || 'Untitled Course'}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Description - Show for both, but content differs */}
        <div className="text-[#718096] text-sm mb-4 line-clamp-2">
          {isTeacher ? (
            course.description || 'No description available'
          ) : (
            course.faculty?.name ? `Instructor: ${course.faculty.name}` : 'Instructor information not available'
          )}
        </div>

        {/* Stats/Info section - Same layout for both */}
        <div className="flex items-center gap-4 text-sm text-[#718096] mb-4">
          {isTeacher ? (
            <>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-green-500" />
                <span>{course.students || 0} students</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart className="w-4 h-4 text-purple-500" />
                <span>{course.assignments || 0} assignments</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-[#FF4C60]" />
              <span>Enrolled</span>
            </div>
          )}
        </div>

        {/* Semester/Year info - Show for both */}
        <div className="text-xs text-gray-500 mb-4">
          {course.semester && course.academic_year ? (
            <>
              {course.semester} • {course.academic_year}
              {(course.year_level || course.section) && (
                <> • {course.year_level}{course.year_level && course.section ? ' - ' : ''}{course.section}</>
              )}
            </>
          ) : (
            'Course information'
          )}
        </div>

        {/* Actions - Same button styling, different content */}
        <div className="flex gap-2 mt-4">
          {isTeacher ? (
            // Teacher actions
            <>
              <Link
                to={`/faculty/courses/${course.id}`}
                className="flex-1 px-4 py-2 bg-[#FF4C60] hover:bg-[#ff3451] text-white rounded-xl text-center text-sm font-medium transition shadow-sm"
              >
                Manage
              </Link>
              <button
                onClick={() => onShare?.(course.id, course.name)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                title="Share course link"
              >
                {copiedCourseId === course.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onEdit?.(course)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                title="Edit course"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete?.(course.id, course.name)}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                title="Delete course"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            // Student action
            <Link
              to={`/student/courses/${course.id}`}
              className="flex-1 px-4 py-2 bg-[#FF4C60] hover:bg-[#ff3451] text-white rounded-xl text-center text-sm font-medium transition shadow-sm"
            >
              View Course
            </Link>
          )}
        </div>
      </div>
    </Motion.div>
  );
};

export default CourseCard;
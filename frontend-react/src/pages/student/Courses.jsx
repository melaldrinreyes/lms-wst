import { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { studentAPI } from '../../services/api';
import { SkeletonCard } from '../../components/ui/Skeleton';
import CourseCard from '../../components/ui/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getMyCourses();
      if (response.success) {
        setCourses(response.classes || []);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // (Course stats removed — not used after removing stats cards)

  return (
    <div className="space-y-6">
      {/* Stats Cards removed as requested */}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-[#718096] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses found</h3>
            <p className="text-[#718096]">
              You haven't enrolled in any courses yet.
            </p>
          </div>
        ) : (
          courses.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              variant="student"
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}

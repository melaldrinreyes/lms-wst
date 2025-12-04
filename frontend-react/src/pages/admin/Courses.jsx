import { useState, useEffect } from 'react';
import { Search, BookOpen, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import Toast from '../../components/ui/Toast';
import { courseAPI, superAdminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminCourses() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [instructorMap, setInstructorMap] = useState({});

  // Filtering logic (must be before pagination)
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / pageSize);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Fetch courses and instructors on mount
  useEffect(() => {
    fetchInstructors();
  }, []);

  // Fetch courses when instructorMap is updated
  useEffect(() => {
    if (Object.keys(instructorMap).length > 0 || !loading) {
      fetchCourses();
    }
  }, [instructorMap]);

  const fetchInstructors = async () => {
    try {
      const response = await superAdminAPI.getInstructors();
      if (response.success) {
        const map = {};
        response.instructors.forEach(instructor => {
          map[instructor.id] = instructor.name;
        });
        setInstructorMap(map);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll();
      
      if (response.success) {
        // Transform API response to match component expectations
        const formattedCourses = response.courses.map(course => ({
          id: course.id,
          code: course.code,
          name: course.name,
          description: course.description,
          faculty_id: course.faculty_id || 0,
          instructor: instructorMap[course.faculty_id] || 'Unknown',
          students: course.students || 0,
          modules: course.modules || 0,
          assignments: course.assignments || 0,
          status: course.status,
          credits: course.credits,
          semester: course.semester,
          academic_year: course.academic_year,
          thumbnail: course.thumbnail || `https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80`,
        }));
        setCourses(formattedCourses);
      } else {
        setToast({ message: 'Failed to load courses', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setToast({
        message: error.response?.data?.message || 'Failed to load courses',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-white text-[#4a5568] dark:bg-white dark:text-[#718096]';
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1d2026]">
          Manage Courses
        </h1>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ff6b6b]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" size={20} />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#ff6b6b] rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Courses Table (Desktop) */}
      <div className="hidden md:block">
        {/* Pagination above table if many pages */}
        {totalPages > 1 && (
          <div className="flex justify-end mb-2">
            <nav className="inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-l bg-white text-gray-900 border border-[#ff6b6b] disabled:opacity-50">Prev</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => handlePageChange(i+1)} className={`px-3 py-1 border-t border-b border-[#ff6b6b] ${currentPage === i+1 ? 'bg-[#FF4C60] text-[#1d2026]' : 'bg-white text-[#1d2026]'}`}>{i+1}</button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-r bg-white text-gray-900 border border-[#ff6b6b] disabled:opacity-50">Next</button>
            </nav>
          </div>
        )}
        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ff6b6b]">
            <div className="animate-pulse">
              <div className="h-12 bg-white dark:bg-white rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-white dark:bg-white rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-[#718096] mx-auto mb-4" />
            <p className="text-[#718096] dark:text-[#718096]">
              {searchTerm ? 'No courses found' : 'No courses available'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#ff6b6b]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#ff5252]">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Thumbnail</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Course Code</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Course Name</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Credits</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Semester</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Academic Year</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Students</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-[#1d2026]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-white transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div className="w-16 h-12 bg-white dark:bg-white rounded overflow-hidden">
                          {course.thumbnail ? (
                            <img 
                              src={course.thumbnail} 
                              alt={course.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <BookOpen className="text-[#718096]" size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-[#1d2026]">{course.code}</td>
                      <td className="py-4 px-6 text-sm text-[#1d2026]">{course.name}</td>
                      <td className="py-4 px-6 text-sm text-[#1d2026]">{course.credits}</td>
                      <td className="py-4 px-6 text-sm text-[#1d2026]">{course.semester || '-'}</td>
                      <td className="py-4 px-6 text-sm text-[#1d2026]">{course.academic_year}</td>
                      <td className="py-4 px-6 text-sm text-[#1d2026]">{course.students}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          course.status === 'active'
                            ? 'bg-[#FF4C60] text-[#1d2026]'
                            : getStatusBadge(course.status)
                        }`}>
                          {course.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Courses Cards (Mobile) */}
      <div className="block md:hidden">
        {/* Pagination above cards if many pages */}
        {totalPages > 1 && (
          <div className="flex justify-end mb-2">
            <nav className="inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-l bg-white text-gray-900 border border-[#ff6b6b] disabled:opacity-50">Prev</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i+1} onClick={() => handlePageChange(i+1)} className={`px-3 py-1 border-t border-b border-[#ff6b6b] ${currentPage === i+1 ? 'bg-[#FF4C60] text-[#1d2026]' : 'bg-white text-[#1d2026]'}`}>{i+1}</button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-r bg-white text-gray-900 border border-[#ff6b6b] disabled:opacity-50">Next</button>
            </nav>
          </div>
        )}
        {/* Cards */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-[#ff6b6b]">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-white rounded"></div>
              ))}
            </div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-[#ff6b6b]">
            <BookOpen className="w-16 h-16 text-[#718096] mx-auto mb-4" />
            <p className="text-[#718096] dark:text-[#718096]">
              {searchTerm ? 'No courses found' : 'No courses available'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow p-4 flex gap-4 items-center border border-[#ff6b6b]">
                <div className="w-20 h-16 flex-shrink-0 rounded overflow-hidden bg-white flex items-center justify-center">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="text-[#718096]" size={32} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-lg truncate">{course.name}</div>
                  <div className="text-gray-900 text-sm">Code: {course.code}</div>
                  <div className="text-gray-900 text-sm">Credits: {course.credits}</div>
                  <div className="text-gray-900 text-sm">Semester: {course.semester || '-'}</div>
                  <div className="text-gray-900 text-sm">Year: {course.academic_year}</div>
                  <div className="text-gray-900 text-sm">Students: {course.students}</div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    course.status === 'active'
                      ? 'bg-[#FF4C60] text-[#1d2026]'
                      : getStatusBadge(course.status)
                  }`}>
                    {course.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

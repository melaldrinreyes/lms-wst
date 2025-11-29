import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Eye, 
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  UserPlus,
  GraduationCap
} from 'lucide-react';
import { studentAPI, courseAPI, classAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';

export default function FacultyStudents() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState(['all']);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    fetchData();
    fetchClasses();
  }, [filterCourse]);

  const fetchClasses = async () => {
    try {
      const result = await classAPI.getAll();
      if (result.success) {
        setClasses(result.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const params = filterCourse !== 'all' ? { course_id: filterCourse } : {};
      const studentsData = await studentAPI.getAll(params);
      const initial = studentsData.students || [];
      setStudents(initial);

      // If some students missing student_id, fetch full student records and merge
      try {
        const missing = initial.filter(s => !s.student_id).length;
        if (missing > 0) {
          const allResp = await studentAPI.getAll();
          const fetched = allResp.students || allResp.data || [];
          if (Array.isArray(fetched) && fetched.length > 0) {
            const byId = fetched.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
            const merged = initial.map(s => ({
              ...s,
              student_id: s.student_id || byId[s.id]?.student_id || byId[s.id]?.studentId || s.student_id
            }));
            setStudents(merged);
          }
        }
      } catch (e) {
        console.debug('Failed to merge student_id in FacultyStudents', e);
      }
      
      // Fetch courses for filter
      const coursesData = await courseAPI.getAll();
      setCourses(['all', ...(coursesData.courses?.map(c => c.name) || [])]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({ message: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || student.courses?.includes(filterCourse);
    return matchesSearch && matchesCourse;
  });

  const getPerformanceColor = (grade) => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 75) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressPercentage = (submitted, total) => {
    return (submitted / total) * 100;
  };

  const handleViewDetails = (student) => {
    navigate(`/faculty/students/${student.id}`);
  };

  const handleEnrollClick = (student) => {
    setSelectedStudentForEnroll(student);
    setSelectedClass('');
    setShowEnrollModal(true);
  };

  const handleEnrollSubmit = async () => {
    if (!selectedClass || !selectedStudentForEnroll) {
      Swal.fire({
        icon: 'warning',
        title: 'No Class Selected',
        text: 'Please select a class to enroll the student',
        confirmButtonColor: '#f97316',
      });
      return;
    }

    try {
      const result = await classAPI.addStudent(selectedClass, selectedStudentForEnroll.id);
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Enrollment Successful!',
          text: `${selectedStudentForEnroll.name} has been enrolled in the class.`,
          confirmButtonColor: '#f97316',
        });
        setShowEnrollModal(false);
        setSelectedStudentForEnroll(null);
        setSelectedClass('');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Enrollment Failed',
          text: result.message || 'Failed to enroll student',
          confirmButtonColor: '#f97316',
        });
      }
    } catch (error) {
      // Check if it's a 400 error (student already enrolled)
      if (error.response?.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Already Enrolled',
          text: error.response?.data?.message || 'This student is already enrolled in this class',
          confirmButtonColor: '#f97316',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'An error occurred while enrolling the student',
          confirmButtonColor: '#f97316',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Students</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage student progress across your courses
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/faculty/students/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800/50 dark:bg-gray-800 text-white rounded-xl hover:bg-gray-700 dark:hover:bg-gray-700 transition-all border border-gray-700 dark:border-gray-600 font-medium">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{students.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Grade</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round(students.reduce((acc, s) => acc + s.average_grade, 0) / students.length)}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {students.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {Math.round((students.reduce((acc, s) => acc + s.submissions, 0) / 
                  students.reduce((acc, s) => acc + s.total_assignments, 0)) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
          >
            {courses.map(course => (
              <option key={course} value={course}>
                {course === 'all' ? 'All Courses' : course}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Avg Grade
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.profile_image}
                        alt={student.name}
                        className="w-10 h-10 rounded-full"
                      />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{student.student_id || student.id || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {student.courses?.join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {student.submissions}/{student.total_assignments}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(getProgressPercentage(student.submissions, student.total_assignments))}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-orange-600 h-1.5 rounded-full"
                          style={{ width: `${getProgressPercentage(student.submissions, student.total_assignments)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-lg font-semibold ${getPerformanceColor(student.average_grade)}`}>
                      {student.average_grade}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewDetails(student)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEnrollClick(student)}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Enroll to Class"
                      >
                        <GraduationCap className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No students found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-panel modal-panel--md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full p-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Enroll Student to Class
            </h3>
            
            {selectedStudentForEnroll && (
              <div className="mb-6 p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudentForEnroll.profile_image}
                    alt={selectedStudentForEnroll.name}
                    className="w-12 h-12 rounded-full border-2 border-white"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {selectedStudentForEnroll.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedStudentForEnroll.student_id || selectedStudentForEnroll.id || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select Class/Subject
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 dark:text-white"
              >
                <option value="">Choose a class...</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subject_name} - Year {cls.year_level} {cls.section} ({cls.school_year} {cls.semester})
                  </option>
                ))}
              </select>
              {classes.length === 0 && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                  No classes available. Create a class first.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedStudentForEnroll(null);
                  setSelectedClass('');
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollSubmit}
                disabled={!selectedClass}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enroll Student
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { classAPI } from '../../services/api';
import { 
  ArrowLeft, 
  UserPlus, 
  Trash2, 
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  Mail,
  AlertCircle,
  Search
} from 'lucide-react';

const ClassStudents = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [classData, setClassData] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchClassData();
  }, [id]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const result = await classAPI.getOne(id);
      if (result.success) {
        setClassData(result.class);
      }
    } catch (err) {
      console.error('Error fetching class:', err);
      await Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Failed to load class details', confirmButtonColor: '#f97316' });
      navigate('/faculty/classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const result = await classAPI.getAvailableStudents(id);
      if (result.success) {
        setAvailableStudents(result.students);
      }
    } catch (err) {
      console.error('Error fetching available students:', err);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudent) {
      Swal.fire({
        icon: 'warning',
        title: 'No Student Selected',
        text: 'Please select a student to enroll',
        confirmButtonColor: '#f97316',
      });
      return;
    }

    try {
      const result = await classAPI.addStudent(id, selectedStudent);
      if (result.success) {
        await fetchClassData();
        setShowAddModal(false);
        setSelectedStudent('');
        
        Swal.fire({
          icon: 'success',
          title: 'Student Enrolled!',
          text: 'The student has been successfully enrolled in this class.',
          confirmButtonColor: '#f97316',
        });
      }
    } catch (err) {
      console.error('Error adding student:', err);
      
      // Check if it's a 400 error (student already enrolled)
      if (err.response?.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Already Enrolled',
          text: err.response?.data?.message || 'This student is already enrolled in this class',
          confirmButtonColor: '#f97316',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Enrollment Failed',
          text: err.response?.data?.message || 'Failed to add student to the class',
          confirmButtonColor: '#f97316',
        });
      }
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const result = await Swal.fire({
      title: 'Remove Student?',
      text: "Are you sure you want to remove this student from the class?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const apiResult = await classAPI.removeStudent(id, studentId);
        if (apiResult.success) {
          await fetchClassData();
          setDeleteConfirm(null);
          
          Swal.fire({
            icon: 'success',
            title: 'Removed!',
            text: 'Student has been removed from the class.',
            confirmButtonColor: '#f97316',
          });
        }
      } catch (err) {
        console.error('Error removing student:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to remove student from the class',
          confirmButtonColor: '#f97316',
        });
      }
    }
  };

  const openAddModal = async () => {
    setShowAddModal(true);
    await fetchAvailableStudents();
  };

  const filteredStudents = classData?.students?.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || 
           student.email?.toLowerCase().includes(search) ||
           student.student_id?.toLowerCase().includes(search);
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b6b]"></div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/faculty/classes')}
          className="flex items-center gap-2 text-[#718096] dark:text-[#718096] hover:text-gray-900 dark:hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Classes
        </button>

        {/* Class Info Card */}
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-2xl shadow-lg p-6 text-gray-900 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{classData.subject_name || classData.course?.name || 'Class'}</h1>
              <div className="flex flex-wrap gap-4 text-[#FF4C60] 100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>{classData.year_level} - Section {classData.section}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{classData.school_year} - {classData.semester}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{classData.students?.length || 0} Students</span>
                </div>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-white text-[#ff5252] rounded-xl hover:bg-[#FF4C60]/10 transition-colors font-medium shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#718096]" />
          <input
            type="text"
            placeholder="Search students by name, email, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#ff6b6b] focus:border-transparent text-gray-900 dark:text-[#1d2026]"
          />
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-white rounded-2xl shadow-md">
          <Users className="w-16 h-16 mx-auto text-[#718096] mb-4" />
          <h3 className="text-xl font-semibold text-[#4a5568] dark:text-[#4a5568] mb-2">
            {searchTerm ? 'No students found' : 'No students enrolled yet'}
          </h3>
          <p className="text-gray-500 dark:text-[#718096] mb-6">
            {searchTerm ? 'Try adjusting your search' : 'Add students to this class to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all duration-200"
            >
              Add Your First Student
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white dark:bg-white border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-[#718096] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white dark:hover:bg-white transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-full flex items-center justify-center text-gray-900 font-bold">
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-[#1d2026]">
                            {student.first_name} {student.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-[#718096] dark:text-[#718096]">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[#1d2026]">
                      {student.student_id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.pivot?.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : student.pivot?.status === 'dropped'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-[#FF4C60] 100 dark:bg-[#FF4C60] 900/30 text-[#FF4C60] 800 dark:text-[#FF4C60] 300'
                      }`}>
                        {student.pivot?.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#718096] dark:text-[#718096]">
                      {student.pivot?.enrolled_date ? new Date(student.pivot.enrolled_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setDeleteConfirm(student.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                        title="Remove from class"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-panel modal-panel--lg bg-white dark:bg-white rounded-2xl shadow-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-[#1d2026]">
                Add Student to Class
              </h3>
              <p className="text-[#718096] dark:text-[#718096] mt-1">
                Select a student from your registered students
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {availableStudents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-[#718096] mb-3" />
                  <p className="text-[#718096] dark:text-[#718096]">
                    No available students to add. All your students are already enrolled in this class.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedStudent === student.id
                          ? 'border-[#ff6b6b] bg-[#FF4C60]/10 dark:bg-[#FF4C60] 900/20'
                          : 'border-gray-200 dark:border-gray-800 hover:border-[#FF4C60] 400 dark:hover:border-[#ff5252]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="student"
                        value={student.id}
                        checked={selectedStudent === student.id}
                        onChange={(e) => setSelectedStudent(parseInt(e.target.value))}
                        className="w-4 h-4 text-[#ff5252] focus:ring-[#ff6b6b]"
                      />
                      <div className="ml-4 flex-1">
                        <div className="font-medium text-gray-900 dark:text-[#1d2026]">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-[#718096] dark:text-[#718096]">
                          {student.email} • ID: {student.student_id || 'N/A'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudent('');
                }}
                className="flex-1 px-4 py-2 bg-white dark:bg-white text-[#2c3e50] dark:text-[#2c3e50] rounded-xl hover:bg-white dark:hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudent}
                disabled={!selectedStudent}
                className="flex-1 px-4 py-2 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] text-gray-900 rounded-xl hover:from-[#0a3d62] hover:to-[#0a3d62] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-panel modal-panel--md bg-white dark:bg-white rounded-2xl shadow-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Remove Student
            </h3>
            <p className="text-[#718096] dark:text-[#718096] mb-6">
              Are you sure you want to remove this student from the class?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-white dark:bg-white text-[#2c3e50] dark:text-[#2c3e50] rounded-xl hover:bg-white dark:hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveStudent(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-gray-900 rounded-xl hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassStudents;

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import Toast from '../../components/ui/Toast';
import Modal from '../../components/ui/Modal';
import Swal from 'sweetalert2';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll();
      if (response.success) {
        setStudents(response.students || []);
      } else {
        setToast({ message: 'Failed to load students', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setToast({ message: error.response?.data?.message || 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddStudent = () => {
    setFormData({
      name: '',
      email: '',
      student_id: '',
      phone: '',
    });
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleEditStudent = (student) => {
    setFormData({
      name: student.name,
      email: student.email,
      student_id: student.student_id,
      phone: student.phone || '',
    });
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (student) => {
    const res = await Swal.fire({
      title: 'Delete student',
      text: `Are you sure you want to delete ${student.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/students/${student.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      
      if (result.success) {
        // Remove the student from the local state
        setStudents(students.filter((s) => s.id !== student.id));
        setToast({ message: `Student ${student.name} deleted successfully`, type: 'success' });
        Swal.fire({ title: 'Deleted', text: 'Student deleted', icon: 'success', timer: 1200, showConfirmButton: false });
      } else {
        setToast({ message: result.message || 'Failed to delete student', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setToast({ message: 'Failed to delete student', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStudent) {
        // Update existing student
        const response = await fetch(`http://127.0.0.1:8000/api/students/${selectedStudent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        
        if (result.success) {
          // Update the student in the local state
          setStudents(students.map(student => 
            student.id === selectedStudent.id 
              ? { ...student, ...formData }
              : student
          ));
          setToast({ message: `${formData.name} updated successfully`, type: 'success' });
        } else {
          setToast({ message: result.message || 'Failed to update student', type: 'error' });
          return;
        }
      } else {
        // Add new student
        const response = await fetch('http://127.0.0.1:8000/api/faculty/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            ...formData,
            password: 'password123', // Default password
            password_confirmation: 'password123',
          }),
        });
        const result = await response.json();
        
        if (result.success) {
          // Add the new student to the local state
          setStudents([...students, result.student]);
          setToast({ message: `${formData.name} added successfully`, type: 'success' });
        } else {
          setToast({ message: result.message || 'Failed to add student', type: 'error' });
          return;
        }
      }
      setIsModalOpen(false);
      setFormData({});
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error saving student:', error);
      setToast({ message: 'Failed to save student', type: 'error' });
    }
  };

  const handleExportStudents = () => {
    try {
      const csv = [
        ['Name', 'Email', 'Student ID', 'Phone'],
        ...filteredStudents.map((s) => [
          s.name,
          s.email,
          s.student_id || '',
          s.phone || '',
        ]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      element.setAttribute('download', `students-${new Date().getTime()}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setToast({ message: `${filteredStudents.length} students exported successfully`, type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to export students', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Students Management</h1>
          <p className="text-gray-400 mt-1">
            Manage student accounts and enrollments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportStudents}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleAddStudent}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
          <p className="text-gray-400 text-lg">No students found</p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {currentStudents.map((student, index) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-900 rounded-2xl border border-gray-800 p-6 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
                      {student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                      <p className="text-white font-medium text-sm">{student.student_id || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Email:</span>
                    <span className="text-gray-300 text-sm">{student.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Phone:</span>
                    <span className="text-gray-300 text-sm">{student.phone || '-'}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-sm">Instructor(s):</span>
                    <div className="flex-1">
                      {Array.isArray(student.instructors) && student.instructors.length > 0 ? (
                        <div className="space-y-1">
                          {student.instructors.map((instructor, idx) => (
                            <div key={idx} className="text-gray-300 text-sm">
                              {instructor.name}
                              {instructor.email && (
                                <span className="ml-2 text-xs text-gray-400">({instructor.email})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:block bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Student ID
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Phone
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Instructor(s)
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {currentStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
                            {student.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{student.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-white font-medium">
                        {student.student_id || '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">
                        {student.email}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">
                        {student.phone || '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-400">
                        {Array.isArray(student.instructors) && student.instructors.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {student.instructors.map((instructor, idx) => (
                              <li key={idx} className="text-gray-300">
                                {instructor.name}
                                {instructor.email ? (
                                  <span className="ml-2 text-xs text-gray-400">({instructor.email})</span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Pagination - Same for both views */}
          {filteredStudents.length >= 5 && (
            <div className="px-6 py-4 bg-gray-800/50 border border-gray-800 rounded-2xl mt-4 md:mt-0 md:border-t-0 md:border-l md:border-r md:rounded-t-none">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-lg transition ${
                            currentPage === pageNum
                              ? 'bg-orange-500 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {totalPages <= 1 && (
            <div className="px-6 py-4 bg-gray-800/50 text-sm text-gray-400 border border-gray-800 rounded-2xl mt-4 md:mt-0 md:border-t-0 md:border-l md:border-r md:rounded-t-none">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          )}
        </>
      )}

      {/* Student Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? `Edit Student: ${selectedStudent.name}` : 'Add New Student'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 dark:bg-gray-700 text-white text-base min-h-[48px] overflow-visible placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Student ID *
                </label>
                <input
                  type="text"
                  value={formData.student_id || ''}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 dark:bg-gray-700 text-white text-base min-h-[48px] overflow-visible placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter student ID"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 dark:bg-gray-700 text-white text-base min-h-[48px] overflow-visible break-all placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 dark:bg-gray-700 text-white text-base min-h-[48px] overflow-visible placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium shadow-lg shadow-orange-500/25"
              >
                {selectedStudent ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
      </Modal>
    </div>
  );
}

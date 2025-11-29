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
  Filter,
  Download,
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);

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

    const matchesFilter =
      filterStatus === 'all' || student.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleAddStudent = () => {
    setFormData({
      name: '',
      email: '',
      student_id: '',
      phone: '',
      address: '',
      status: 'active',
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
      address: student.address || '',
      status: student.status || 'active',
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
      // In a real app, this would call an API to delete the student
      setStudents(students.filter((s) => s.id !== student.id));
      setToast({ message: `Student ${student.name} deleted successfully`, type: 'success' });
      Swal.fire({ title: 'Deleted', text: 'Student deleted', icon: 'success', timer: 1200, showConfirmButton: false });
    } catch (error) {
      setToast({ message: 'Failed to delete student', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStudent) {
        // Update existing student
        setToast({ message: `${formData.name} updated successfully`, type: 'success' });
      } else {
        // Add new student
        setStudents([...students, { ...formData, id: Date.now() }]);
        setToast({ message: `${formData.name} added successfully`, type: 'success' });
      }
      setIsModalOpen(false);
      setFormData({});
    } catch (error) {
      setToast({ message: 'Failed to save student', type: 'error' });
    }
  };

  const handleExportStudents = () => {
    try {
      const csv = [
        ['Name', 'Email', 'Student ID', 'Phone', 'Address', 'Status'],
        ...filteredStudents.map((s) => [
          s.name,
          s.email,
          s.student_id || '',
          s.phone || '',
          s.address || '',
          s.status,
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

      setToast({ message: 'Students exported successfully', type: 'success' });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
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
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredStudents.map((student, index) => (
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
                    <td className="py-4 px-6 text-sm text-gray-400">
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
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : student.status === 'inactive'
                            ? 'bg-gray-500/20 text-gray-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {student.status}
                      </span>
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
          <div className="px-6 py-4 bg-gray-800/50 text-sm text-gray-400">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </motion.div>
      )}

      {/* Student Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? `Edit Student: ${selectedStudent.name}` : 'Add New Student'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Student ID *
              </label>
              <input
                type="text"
                value={formData.student_id || ''}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status || 'active'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              {selectedStudent ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

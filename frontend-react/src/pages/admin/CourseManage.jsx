import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Edit, Trash2, FileText, Calendar, Users, 
  CheckCircle, XCircle, Clock, Upload, Download, Eye, Check, X
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

export default function CourseManage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('modules');
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(null);
  const [formData, setFormData] = useState({});

  // Mock course data
  const course = {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Computer Science',
    instructor: 'Dr. John Smith',
    students: 45,
    description: 'Fundamentals of programming, algorithms, and computational thinking'
  };

  const modules = [
    {
      id: 1,
      title: 'Week 1: Introduction to Programming',
      description: 'Overview of programming concepts and languages',
      order: 1,
      status: 'published',
      content: 'Introduction to basic programming concepts...',
      file_path: null
    },
    {
      id: 2,
      title: 'Week 2: Control Structures',
      description: 'Conditional statements and loops',
      order: 2,
      status: 'published',
      content: 'Learn about if-else statements, loops...',
      file_path: null
    },
    {
      id: 3,
      title: 'Week 3: Functions and Methods',
      description: 'Creating reusable code blocks',
      order: 3,
      status: 'draft',
      content: '',
      file_path: null
    }
  ];

  const assignments = [
    {
      id: 1,
      title: 'Programming Assignment 1: Variables and Data Types',
      description: 'Create a program demonstrating variables and data types',
      due_date: '2025-11-01',
      max_points: 100,
      status: 'published',
      submissions: 23,
      total_students: 45
    },
    {
      id: 2,
      title: 'Programming Assignment 2: Control Flow',
      description: 'Write a program using if-else and loops',
      due_date: '2025-11-08',
      max_points: 100,
      status: 'published',
      submissions: 15,
      total_students: 45
    }
  ];

  const submissions = [
    {
      id: 1,
      assignment: 'Programming Assignment 1',
      student: 'Juan Dela Cruz',
      student_id: '2024-00001',
      submitted_at: '2025-10-25 14:30:00',
      status: 'pending',
      grade: null,
      file_path: 'submissions/assignment1_juan.zip'
    },
    {
      id: 2,
      assignment: 'Programming Assignment 1',
      student: 'Maria Clara Santos',
      student_id: '2024-00002',
      submitted_at: '2025-10-24 10:15:00',
      status: 'graded',
      grade: 95,
      feedback: 'Excellent work! Good implementation.',
      file_path: 'submissions/assignment1_maria.zip'
    }
  ];

  const handleAddModule = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      order: modules.length + 1,
      status: 'draft'
    });
    setIsModalOpen('module');
  };

  const handleAddAssignment = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      max_points: 100,
      status: 'draft'
    });
    setIsModalOpen('assignment');
  };

  const handleGradeSubmission = (submission) => {
    setFormData({
      id: submission.id,
      student: submission.student,
      grade: submission.grade || '',
      feedback: submission.feedback || ''
    });
    setIsModalOpen('grade');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setToast({ 
      message: `${isModalOpen === 'module' ? 'Module' : isModalOpen === 'assignment' ? 'Assignment' : 'Grade'} saved successfully!`, 
      type: 'success' 
    });
    setIsModalOpen(null);
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/courses"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{course.code}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {course.name}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Instructor: {course.instructor} • {course.students} Students
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'modules'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="inline mr-2" size={18} />
            Modules
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'assignments'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="inline mr-2" size={18} />
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'submissions'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="inline mr-2" size={18} />
            Submissions
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition border-b-2 ${
              activeTab === 'students'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Users className="inline mr-2" size={18} />
            Students
          </button>
        </div>
      </div>

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Modules</h2>
            <button
              onClick={handleAddModule}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Plus size={20} />
              Add Module
            </button>
          </div>

          <div className="space-y-3">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Module {module.order}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        module.status === 'published' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {module.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {module.description}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Assignments</h2>
            <button
              onClick={handleAddAssignment}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Plus size={20} />
              Add Assignment
            </button>
          </div>

          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {assignment.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar size={16} />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <FileText size={16} />
                        {assignment.max_points} points
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users size={16} />
                        {assignment.submissions}/{assignment.total_students} submitted
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(assignment.submissions / assignment.total_students) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round((assignment.submissions / assignment.total_students) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Submissions</h2>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Student
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Assignment
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Submitted
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Grade
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.student}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {submission.student_id}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {submission.assignment}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(submission.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : submission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {submission.status === 'graded' && <CheckCircle size={12} />}
                          {submission.status === 'pending' && <Clock size={12} />}
                          {submission.status === 'rejected' && <XCircle size={12} />}
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">
                        {submission.grade !== null ? `${submission.grade}/100` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            onClick={() => handleGradeSubmission(submission)}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                            title={submission.status === 'graded' ? "Edit grade" : "Grade submission"}
                          >
                            {submission.status === 'graded' ? <Edit size={16} /> : <Check size={16} />}
                          </button>
                          <button 
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enrolled Students</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              Total Students: {course.students}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Student list will be displayed here with their progress and grades.
            </p>
          </div>
        </div>
      )}

      {/* Module Modal */}
      <Modal
        isOpen={isModalOpen === 'module'}
        onClose={() => setIsModalOpen(null)}
        title="Add Module"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              rows={6}
              value={formData.content || ''}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
              Save Module
            </button>
          </div>
        </form>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen === 'assignment'}
        onClose={() => setIsModalOpen(null)}
        title="Add Assignment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date || ''}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Points *
              </label>
              <input
                type="number"
                value={formData.max_points || 100}
                onChange={(e) => setFormData({...formData, max_points: e.target.value})}
                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
              Save Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={isModalOpen === 'grade'}
        onClose={() => setIsModalOpen(null)}
        title={formData.grade !== null && formData.grade !== '' ? `Edit Grade - ${formData.student}` : `Grade Submission - ${formData.student}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade (out of 100) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.grade || ''}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback
            </label>
            <textarea
              rows={4}
              value={formData.feedback || ''}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Provide feedback to the student..."
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(null)} className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              {formData.grade !== null && formData.grade !== '' ? 'Update Grade' : 'Submit Grade'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

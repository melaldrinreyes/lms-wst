import { useState } from 'react';
import { Calendar, Clock, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';

export default function Assignments() {
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [file, setFile] = useState(null);

  const assignments = [
    {
      id: 1,
      title: 'React Project - Build a Todo App',
      course: 'Web Development',
      dueDate: '2025-10-28',
      status: 'pending',
      points: 100,
      description: 'Create a fully functional todo application using React with CRUD operations.',
    },
    {
      id: 2,
      title: 'Binary Trees Implementation',
      course: 'Data Structures',
      dueDate: '2025-10-30',
      status: 'pending',
      points: 80,
      description: 'Implement binary tree operations including insertion, deletion, and traversal.',
    },
    {
      id: 3,
      title: 'SQL Queries Assignment',
      course: 'Database Systems',
      dueDate: '2025-11-02',
      status: 'submitted',
      points: 50,
      submittedDate: '2025-10-20',
      description: 'Write complex SQL queries for the given database schema.',
    },
    {
      id: 4,
      title: 'Sorting Algorithms Analysis',
      course: 'Data Structures',
      dueDate: '2025-11-05',
      status: 'graded',
      points: 60,
      grade: 55,
      description: 'Analyze and compare different sorting algorithms.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setToast({ message: 'Please select a file', type: 'error' });
      return;
    }
    setToast({ message: 'Assignment submitted successfully!', type: 'success' });
    setIsModalOpen(false);
    setFile(null);
  };

  const getStatusBadge = (assignment) => {
    const styles = {
      pending: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      graded: 'bg-green-500/10 text-green-400 border border-green-500/20',
      late: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return styles[assignment.status] || styles.pending;
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white">Assignments</h1>
        <p className="text-sm text-gray-400 mt-1">Track and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: assignments.length, color: 'orange' },
          { label: 'Pending', value: assignments.filter(a => a.status === 'pending').length, color: 'yellow' },
          { label: 'Submitted', value: assignments.filter(a => a.status === 'submitted').length, color: 'blue' },
          { label: 'Graded', value: assignments.filter(a => a.status === 'graded').length, color: 'green' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Assignments List */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Assignment
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Course
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Due Date
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Points
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {assignments.map((assignment, index) => (
                <motion.tr
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 transition"
                >
                  <td className="py-5 px-6">
                    <div>
                      <p className="font-semibold text-sm text-white">
                        {assignment.title}
                      </p>
                      {assignment.status === 'pending' && (
                        <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                          <Clock size={12} className="inline" />
                          {getDaysRemaining(assignment.dueDate)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-gray-400">
                    {assignment.course}
                  </td>
                  <td className="py-5 px-6 text-sm text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-500" />
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-5 px-6 text-sm text-white font-semibold">
                    {assignment.status === 'graded' ? (
                      <span className="text-green-400">
                        {assignment.grade}/{assignment.points}
                      </span>
                    ) : (
                      <span>{assignment.points}</span>
                    )}
                  </td>
                  <td className="py-5 px-6">
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusBadge(assignment)}`}>
                      {assignment.status === 'pending' && 'Pending'}
                      {assignment.status === 'submitted' && 'Submitted'}
                      {assignment.status === 'graded' && 'Graded'}
                      {assignment.status === 'late' && 'Late'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    {assignment.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold transition"
                      >
                        Submit
                      </button>
                    )}
                    {assignment.status === 'submitted' && (
                      <span className="text-sm text-gray-500 font-medium">
                        Submitted
                      </span>
                    )}
                    {assignment.status === 'graded' && (
                      <button className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 text-sm font-semibold transition">
                        View Feedback
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFile(null);
        }}
        title="Submit Assignment"
      >
        {selectedAssignment && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedAssignment.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAssignment.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed dark:border-gray-600 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                />
                {file && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFile(null);
                }}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Submit Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

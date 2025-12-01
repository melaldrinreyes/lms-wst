import { FileText, Check, Download, X, Trash2 } from 'lucide-react';
import Skeleton from './ui/Skeleton';

export default function StudentSubmissionsTable({
  submissions = [],
  onDownload,
  onGrade,
  onReject,
  onDelete,
  loading = false,
  searchTerm = '',
}) {
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = (submission.student_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (submission.assignment_title || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesSearch;
  });

  // Use dark theme colors with proper contrast
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'graded':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'returned':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div>
      {loading ? (
        <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-900 border border-orange-500 rounded-2xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
                    <div className="flex flex-col items-center justify-center">
                      <FileText size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-300 text-lg">No submissions found</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {searchTerm ? 'Try adjusting your search or filters' : 'Students will appear here once they submit assignments'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      <div className="flex items-center gap-3">
                        <img
                          src={submission.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.student_name || 'Student')}&background=f97316&color=fff`}
                          alt={submission.student_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-white">
                            {submission.student_name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {submission.student_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {submission.assignment_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {submission.grade !== null ? (
                        <span className="text-lg font-semibold text-green-600">
                          {submission.grade}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2 justify-end">
                        {submission.file_path && (
                          <button
                            onClick={() => onDownload && onDownload(submission.id, submission.student_name)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Download Submission"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {submission.status !== 'graded' && submission.status !== 'rejected' && (
                          <button
                            onClick={() => onGrade && onGrade(submission)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Grade Submission"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {submission.status === 'submitted' && (
                          <button
                            onClick={() => onReject && onReject(submission.id)}
                            className="text-orange-600 hover:text-orange-800 p-1"
                            title="Reject Submission"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete && onDelete(submission.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Submission"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

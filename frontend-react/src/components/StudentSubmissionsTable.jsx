import { FileText, Check, Download, X, Trash2 } from 'lucide-react';

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

  // Use system palette: orange for submitted, green for graded, blue for returned, red for rejected, gray for default
  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-orange-100 text-orange-600';
      case 'graded':
        return 'bg-green-100 text-green-600';
      case 'returned':
        return 'bg-blue-100 text-blue-600';
      case 'rejected':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading submissions...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-2xl shadow-card">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assignment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
                    <div className="flex flex-col items-center justify-center">
                      <FileText size={48} className="text-gray-400 mb-4" />
                      <p className="text-gray-600 text-lg">No submissions found</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {searchTerm ? 'Try adjusting your search or filters' : 'Students will appear here once they submit assignments'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={submission.student_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.student_name || 'Student')}&background=f97316&color=fff`}
                          alt={submission.student_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {submission.student_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {submission.assignment_title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
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

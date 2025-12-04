import { useState, useEffect } from 'react';
import { Users, Check, X, Clock, Calendar, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facultyAPI } from '../../services/api';
import Swal from 'sweetalert2';
import Skeleton from '../../components/ui/Skeleton';

// Helper to normalize image URLs (local storage vs absolute)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleaned = path.replace(/^\//, '');
  if (cleaned.startsWith('uploads')) return `http://127.0.0.1:8000/${cleaned}`;
  return `http://127.0.0.1:8000/storage/${cleaned}`;
};

export default function JoinRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'success' | 'error', message: string }
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getEnrollmentRequests();
      if (response.success) {
        setRequests(response.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setModal({ type: 'error', message: 'Failed to load enrollment requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      const response = await facultyAPI.approveEnrollmentRequest(id);
      if (response.success) {
        setModal({ type: 'success', message: 'Enrollment request approved successfully!' });
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving request:', error);
      setModal({ type: 'error', message: error.response?.data?.message || 'Failed to approve request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      const response = await facultyAPI.rejectEnrollmentRequest(id);
      if (response.success) {
        setModal({ type: 'success', message: 'Enrollment request rejected successfully' });
        fetchRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      setModal({ type: 'error', message: error.response?.data?.message || 'Failed to reject request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({
      title: 'Delete request',
      text: 'Are you sure you want to delete this enrollment request? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316'
    });
    if (!res.isConfirmed) return;
    try {
      setProcessingId(id);
      const response = await facultyAPI.deleteEnrollmentRequest(id);
      if (response.success) {
        setModal({ type: 'success', message: 'Enrollment request deleted successfully' });
        fetchRequests(); // Refresh the list
        Swal.fire({ title: 'Deleted', text: 'Enrollment request removed', icon: 'success', timer: 1200, showConfirmButton: false });
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      setModal({ type: 'error', message: error.response?.data?.message || 'Failed to delete request' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests
    .filter(req => {
      if (filter === 'all') return true;
      return req.status === filter;
    })
    .filter(req => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (req.student?.name || '').toLowerCase().includes(q) ||
        (req.student?.email || '').toLowerCase().includes(q) ||
        (req.course?.name || '').toLowerCase().includes(q) ||
        (req.course?.code || '').toLowerCase().includes(q)
      );
    });

  // Pagination (responsive): show 4 per page on small screens, 8 on md+
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 8);

  useEffect(() => {
    setPage(1); // reset page when filters/search change
  }, [filter, searchTerm]);

  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 768;
      setPageSize(small ? 4 : 8);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = filteredRequests.slice((page - 1) * pageSize, page * pageSize);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-400 border border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return styles[status] || styles.pending;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Success/Error Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setModal(null)}
          >
              <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
                className="modal-panel modal-panel--md bg-white dark:bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-gray-800"
            >
              {/* Modal Header */}
              <div className={`p-6 ${
                modal.type === 'success' 
                  ? 'bg-gradient-to-br from-[#1e3a5f] to-[#152d4a]' 
                  : 'bg-gradient-to-br from-[#1e3a5f] to-[#152d4a]'
              }`}>
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {modal.type === 'success' ? (
                      <CheckCircle className="w-10 h-10 text-[#1d2026]" />
                    ) : (
                      <XCircle className="w-10 h-10 text-[#1d2026]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <h3 className={`text-xl font-bold text-center mb-2 ${
                  modal.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {modal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-[#4a5568] text-center mb-6">
                  {modal.message}
                </p>
                
                {/* Action Button */}
                <button
                  onClick={() => setModal(null)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    modal.type === 'success'
                      ? 'bg-green-500 hover:bg-green-600 text-[#1d2026]'
                      : 'bg-red-500 hover:bg-red-600 text-[#1d2026]'
                  }`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-white rounded-xl p-6 border border-gray-800">
          <p className="text-sm text-[#718096] mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-[#1d2026]">{requests.length}</p>
        </div>
        <div className="bg-white dark:bg-white rounded-xl p-6 border border-yellow-500/20">
          <p className="text-sm text-[#718096] mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-white rounded-xl p-6 border border-green-500/20">
          <p className="text-sm text-[#718096] mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
        </div>
        <div className="bg-white dark:bg-white rounded-xl p-6 border border-red-500/20">
          <p className="text-sm text-[#718096] mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
        </div>
      </div>

      {/* Search + Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-1/2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, email, or course..."
            className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6b6b]"
          />
        </div>

        <div className="flex gap-2 border-b border-gray-800 overflow-x-auto pb-2 -mx-1 px-1">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`min-w-max px-4 py-2 font-semibold border-b-2 transition text-sm ${
              filter === tab.id
                ? 'border-[#ff6b6b] text-[#FF4C60]'
                : 'border-transparent text-[#718096] hover:text-[#4a5568]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-white rounded-xl p-6 border border-gray-800">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-20 rounded-xl" />
                  </div>
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-10 w-32 rounded-xl" />
                  <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-white rounded-xl p-12 border border-gray-800 text-center">
          <Users size={48} className="mx-auto text-[#718096] mb-4" />
          <p className="text-[#718096]">No {filter !== 'all' ? filter : ''} enrollment requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile cards (visible on small screens) */}
          <div className="md:hidden space-y-3">
            {paginatedRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-white rounded-lg p-2 border border-gray-800 hover:border-[#ff6b6b]/30 transition"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between">
                  <div className="flex gap-2 flex-1">
                    {/* Student Avatar */}
                    <div className="flex-shrink-0">
                      {request.student.profile_image ? (
                        <img
                          src={getImageUrl(request.student.profile_image)}
                          alt={request.student.name}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-full flex items-center justify-center">
                          <Users className="text-[#1d2026]" size={14} />
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[11px] font-semibold text-[#1d2026] truncate">{request.student.name}</h3>
                        <span className={`px-1 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#718096] truncate">{request.student.email}</p>
                      <p className="text-[10px] text-[#4a5568]">ID: {request.student.student_id || 'N/A'}</p>

                      <div className="mt-1 p-0.5 bg-white/50 rounded-md border border-gray-700">
                        <p className="text-[10px] text-[#4a5568] mb-1 font-medium">Course</p>
                        <p className="text-[11px] font-semibold text-[#1d2026] truncate">
                          {request.course.code} - {request.course.name}
                        </p>
                      </div>

                      {request.message && (
                        <div className="mt-1 p-0.5 bg-[#FF4C60]/10 rounded-md border border-[#FF4C60]/20">
                          <p className="text-[10px] text-[#FF4C60] mb-1 font-medium">Message</p>
                          <p className="text-[10px] text-[#4a5568] truncate">{request.message}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-[#718096]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                        </div>
                        {request.responded_at && (
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>Responded: {new Date(request.responded_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-2 sm:mt-0 sm:ml-4 w-full sm:w-36">
                    {request.status === 'pending' ? (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 w-full">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          aria-label={`Approve request from ${request.student.name}`}
                          className="w-full sm:w-auto px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] text-[11px]"
                        >
                          <Check size={14} />
                          {processingId === request.id ? '...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          aria-label={`Reject request from ${request.student.name}`}
                          className="w-full sm:w-auto px-2 py-1.5 mt-2 sm:mt-0 bg-red-500 hover:bg-red-600 text-white rounded-md transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b] text-[11px]"
                        >
                          <X size={14} />
                          {processingId === request.id ? '...' : 'Reject'}
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-white/50 rounded-xl border border-gray-700">
                        <p className="text-xs text-[#4a5568] text-center font-medium">
                          {request.status === 'approved' ? '✓ Request Approved' : '✗ Request Rejected'}
                        </p>
                        <p className="text-xs text-[#718096] text-center mt-1">
                          No further actions available
                        </p>
                      </div>
                    )}
                    
                    {/* Delete Button - Always visible */}
                    <button
                      onClick={() => handleDelete(request.id)}
                      disabled={processingId === request.id}
                      aria-label={`Delete request from ${request.student.name}`}
                      className="w-full sm:w-auto px-4 py-3 bg-white hover:bg-red-600 text-[#4a5568] hover:text-white rounded-xl transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredRequests.length > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[#718096]">
                Showing {Math.min((page - 1) * pageSize + 1, filteredRequests.length)}–{Math.min(page * pageSize, filteredRequests.length)} of {filteredRequests.length}
              </div>
              <div className="inline-flex items-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded-xl font-semibold transition ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-[#4a5568] hover:bg-gray-50'}` + ' focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]'}
                >
                  Prev
                </button>
                <div className="text-sm text-[#4a5568]">Page {page} of {totalPages}</div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded-xl font-semibold transition ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-[#4a5568] hover:bg-gray-50'}` + ' focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]'}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Desktop table (visible on md+) */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-800 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#718096] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#718096] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#718096] uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#718096] uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#718096] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#718096] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {request.student.profile_image ? (
                          <img src={getImageUrl(request.student.profile_image)} alt={request.student.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a5f] to-[#152d4a] rounded-full flex items-center justify-center">
                            <Users className="text-[#1d2026]" size={18} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-[#1d2026]">{request.student.name}</div>
                          <div className="text-xs text-[#718096]">ID: {request.student.student_id || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4a5568]">{request.student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1d2026]">{request.course.code} - {request.course.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#718096]">{new Date(request.requested_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-xl text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]"
                          >
                            {processingId === request.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]"
                          >
                            {processingId === request.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <span className="text-xs text-[#4a5568]">{request.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(request.id)}
                        disabled={processingId === request.id}
                        aria-label={`Delete request from ${request.student.name}`}
                        className="ml-3 px-3 py-1.5 bg-white border border-gray-300 rounded-xl hover:bg-red-600 hover:text-white transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ff6b6b]"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Users, Check, X, Clock, Calendar, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facultyAPI } from '../../services/api';
import Swal from 'sweetalert2';

export default function JoinRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'success' | 'error', message: string }
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

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

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

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
                className="modal-panel modal-panel--md bg-gray-900 dark:bg-gray-950 rounded-2xl shadow-2xl w-full overflow-hidden border border-gray-800"
            >
              {/* Modal Header */}
              <div className={`p-6 ${
                modal.type === 'success' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gradient-to-r from-red-500 to-red-600'
              }`}>
                <div className="flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-900/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    {modal.type === 'success' ? (
                      <CheckCircle className="w-10 h-10 text-white" />
                    ) : (
                      <XCircle className="w-10 h-10 text-white" />
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
                <p className="text-gray-300 text-center mb-6">
                  {modal.message}
                </p>
                
                {/* Action Button */}
                <button
                  onClick={() => setModal(null)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    modal.type === 'success'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="text-orange-500" size={28} />
          Join Requests
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage student enrollment requests for your courses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
          <p className="text-sm text-gray-400 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-white">{requests.length}</p>
        </div>
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-yellow-500/20">
          <p className="text-sm text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
        </div>
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-green-500/20">
          <p className="text-sm text-gray-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
        </div>
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-red-500/20">
          <p className="text-sm text-gray-400 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 font-semibold border-b-2 transition text-sm ${
              filter === tab.id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-12 border border-gray-800 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-400">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-12 border border-gray-800 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-400">No {filter !== 'all' ? filter : ''} enrollment requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800 hover:border-orange-500/30 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* Student Avatar */}
                  <div className="flex-shrink-0">
                    {request.student.profile_image ? (
                      <img
                        src={request.student.profile_image}
                        alt={request.student.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <Users className="text-white" size={28} />
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{request.student.name}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{request.student.email}</p>
                    <p className="text-sm text-gray-300">Student ID: {request.student.student_id || 'N/A'}</p>
                    
                    <div className="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-300 mb-1 font-medium">Course Request</p>
                      <p className="text-sm font-semibold text-white">
                        {request.course.code} - {request.course.name}
                      </p>
                    </div>

                    {request.message && (
                      <div className="mt-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <p className="text-xs text-blue-300 mb-1 font-medium">Message</p>
                        <p className="text-sm text-gray-300">{request.message}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Requested: {new Date(request.requested_at).toLocaleDateString()}</span>
                      </div>
                      {request.responded_at && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>Responded: {new Date(request.responded_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check size={18} />
                        {processingId === request.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={18} />
                        {processingId === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-300 text-center font-medium">
                        {request.status === 'approved' ? '✓ Request Approved' : '✗ Request Rejected'}
                      </p>
                      <p className="text-xs text-gray-400 text-center mt-1">
                        No further actions available
                      </p>
                    </div>
                  )}
                  
                  {/* Delete Button - Always visible */}
                  <button
                    onClick={() => handleDelete(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

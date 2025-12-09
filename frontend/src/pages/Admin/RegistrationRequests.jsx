import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import { FaCheck, FaTimes, FaUser, FaEnvelope, FaPhone, FaBuilding, FaSpinner, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'ALL' ? { status: filter } : {};
      const data = await adminService.getRegistrationRequests(params);
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load registration requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this registration?')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminService.approveRequest(id);
      toast.success('Registration approved successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.response?.data?.error || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await adminService.rejectRequest(selectedRequest.id, rejectReason);
      toast.success('Registration rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.response?.data?.error || 'Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplay = (role) => {
    const roles = {
      FABRICANT: 'Manufacturer',
      TRANSPORT: 'Transport',
      ENTREPOT: 'Warehouse',
      MAGASIN: 'Store',
      CLIENT: 'Client',
      ADMIN: 'Admin',
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Registration Requests</h1>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaClock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">No {filter.toLowerCase()} requests found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{request.company_name}</h3>
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="badge badge-primary">{getRoleDisplay(request.role)}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="text-gray-400" />
                      <span>{request.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-gray-400" />
                      <span>{request.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-gray-400" />
                      <span>{request.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      <span>
                        {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{request.message}</p>
                    </div>
                  )}
                </div>

                {request.status === 'PENDING' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FaCheck />
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(request)}
                      disabled={actionLoading}
                      className="btn-danger flex items-center gap-2"
                    >
                      <FaTimes />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {request.processed_at && (
                <div className="text-sm text-gray-500 border-t pt-3">
                  Processed on: {format(new Date(request.processed_at), 'MMM dd, yyyy HH:mm')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Registration</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedRequest?.company_name}'s registration:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field mb-4"
              rows="4"
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="btn-danger flex-1"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequest(null);
                }}
                disabled={actionLoading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationRequests;

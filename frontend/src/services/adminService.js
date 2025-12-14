import api from './api';

const adminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/');
    return response.data;
  },

  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },

  // Update a user
  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}/`, data);
    return response.data;
  },

  // Delete a user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  },

  // Create a new user (pre-approved by admin)
  createUser: async (data) => {
    const response = await api.post('/users/', data);
    return response.data;
  },

  // Get registration requests
  getRegistrationRequests: async (params = {}) => {
    const response = await api.get('/registration-requests/', { params });
    return response.data;
  },

  // Approve registration request
  approveRequest: async (id) => {
    const response = await api.post(`/registration-requests/${id}/process/`, {
      action: 'APPROVE'
    });
    return response.data;
  },

  // Reject registration request
  rejectRequest: async (id, reason) => {
    const response = await api.post(`/registration-requests/${id}/process/`, {
      action: 'REJECT',
      reason: reason
    });
    return response.data;
  },

  // Get notifications
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (id) => {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },

  // Get blockchain records
  getBlockchainRecords: async (params = {}) => {
    const response = await api.get('/blockchain-records/', { params });
    return response.data;
  },
};

export default adminService;
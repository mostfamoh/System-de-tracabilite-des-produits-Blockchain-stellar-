import React from 'react';
import { FaUsers, FaClipboardCheck, FaChartBar } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/admin/users" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
          <FaUsers className="h-12 w-12 text-primary-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Manage Users</h3>
          <p className="text-gray-600">View and manage all users</p>
        </Link>
        
        <Link to="/admin/requests" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
          <FaClipboardCheck className="h-12 w-12 text-yellow-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Registration Requests</h3>
          <p className="text-gray-600">Approve/reject requests</p>
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <FaChartBar className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">System Stats</h3>
          <p className="text-gray-600">View system statistics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
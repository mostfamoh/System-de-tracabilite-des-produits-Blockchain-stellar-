import React from 'react';
import { FaBoxOpen, FaPlus, FaChartBar } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ManufacturerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manufacturer Dashboard
        </h1>
        <p className="text-gray-600">Welcome, {user?.company_name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/manufacturer/products/create" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
          <FaPlus className="h-12 w-12 text-primary-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Create Product</h3>
          <p className="text-gray-600">Add new product to system</p>
        </Link>
        
        <Link to="/manufacturer/products" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
          <FaBoxOpen className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">My Products</h3>
          <p className="text-gray-600">Manage your products</p>
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <FaChartBar className="h-12 w-12 text-purple-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Statistics</h3>
          <p className="text-gray-600">View analytics</p>
        </div>
      </div>
    </div>
  );
};

export default ManufacturerDashboard;

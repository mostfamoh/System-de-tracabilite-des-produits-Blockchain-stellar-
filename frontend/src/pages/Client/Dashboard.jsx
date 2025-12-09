import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaBoxOpen, FaQrcode, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ClientDashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'Browse Products',
      description: 'View all available products',
      icon: FaBoxOpen,
      link: '/client/products',
      color: 'bg-blue-500',
    },
    {
      title: 'Scan QR Code',
      description: 'Verify product authenticity',
      icon: FaQrcode,
      link: '/scan',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.company_name}!
        </h1>
        <p className="text-gray-600">Explore products and verify their authenticity</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              to={action.link}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className={`${action.color} p-4 rounded-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-primary-50 p-6 rounded-xl">
          <h3 className="font-semibold text-primary-900 mb-2">Instant Verification</h3>
          <p className="text-sm text-primary-700">
            Scan QR codes to instantly verify product authenticity using blockchain technology
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-xl">
          <h3 className="font-semibold text-green-900 mb-2">Complete Traceability</h3>
          <p className="text-sm text-green-700">
            View the complete journey of products from manufacturer to store
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-xl">
          <h3 className="font-semibold text-purple-900 mb-2">Secure & Transparent</h3>
          <p className="text-sm text-purple-700">
            All product data is secured and verified on the blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

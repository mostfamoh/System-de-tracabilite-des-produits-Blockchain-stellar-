import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaMapMarkerAlt, FaBoxOpen, FaCheckCircle, FaClock } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const TransportDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inTransit: 0,
    delivered: 0,
    pending: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransportData();
  }, []);

  const fetchTransportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/');
      
      // Filter products that are in transport or need transport
      const transportProducts = response.data.results || response.data;
      const filtered = transportProducts.filter(p => 
        p.current_status === 'IN_TRANSIT' || p.current_status === 'IN_QUALITY_CHECK'
      );
      
      setProducts(filtered);
      
      // Calculate stats
      const inTransit = filtered.filter(p => p.current_status === 'IN_TRANSIT').length;
      const delivered = filtered.filter(p => p.current_status === 'DELIVERED').length;
      
      setStats({
        inTransit,
        delivered,
        pending: filtered.length - inTransit - delivered,
        total: filtered.length
      });
    } catch (error) {
      console.error('Error fetching transport data:', error);
      toast.error('Failed to load transport data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTransport = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'TRANSPORT_START',
        description: 'Transport started',
        location: 'Departure Point',
        notes: 'Package picked up'
      });
      toast.success('Transport started successfully');
      fetchTransportData();
    } catch (error) {
      console.error('Error starting transport:', error);
      toast.error(error.response?.data?.error || 'Failed to start transport');
    }
  };

  const handleCompleteTransport = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'TRANSPORT_END',
        description: 'Transport completed',
        location: 'Destination',
        notes: 'Package delivered'
      });
      toast.success('Transport completed successfully');
      fetchTransportData();
    } catch (error) {
      console.error('Error completing transport:', error);
      toast.error(error.response?.data?.error || 'Failed to complete transport');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaTruck className="text-blue-600" />
            Transport Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage your transportation operations</p>
        </div>
        <button
          onClick={() => navigate('/transport/products')}
          className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <FaBoxOpen /> Manage Products
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <FaBoxOpen className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inTransit}</p>
            </div>
            <FaTruck className="text-4xl text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Delivered</p>
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <FaClock className="text-4xl text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Active Shipments</h2>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No active shipments</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">Batch: {product.batch_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaMapMarkerAlt className="text-gray-400 mr-2" />
                        {product.current_location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${product.current_status === 'IN_TRANSIT' ? 'bg-orange-100 text-orange-800' : ''}
                        ${product.current_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                        ${product.current_status === 'IN_QUALITY_CHECK' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {product.current_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {product.current_status !== 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleStartTransport(product.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Start Transport
                        </button>
                      )}
                      {product.current_status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleCompleteTransport(product.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransportDashboard;

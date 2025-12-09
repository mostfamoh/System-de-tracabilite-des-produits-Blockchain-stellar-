import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaEye, FaMapMarkerAlt, FaCalendar, FaSearch, FaFilter } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const TransportProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/');
      const allProducts = response.data.results || response.data;
      
      // Filter products relevant to transport: CREATED, IN_TRANSIT, IN_WAREHOUSE
      const filtered = allProducts.filter(p => 
        ['CREATED', 'IN_TRANSIT', 'IN_WAREHOUSE', 'IN_QUALITY_CHECK'].includes(p.current_status)
      );
      
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTransport = async (productId) => {
    const location = prompt('Enter pickup location:');
    if (!location) return;
    
    const notes = prompt('Enter any notes (optional):');
    const gpsCoords = prompt('Enter GPS coordinates (optional, format: lat,lng):');

    try {
      const formData = new FormData();
      formData.append('step_type', 'TRANSPORT_START');
      formData.append('location', location);
      if (gpsCoords) {
        formData.append('gps_coordinates', gpsCoords);
      }
      formData.append('details', JSON.stringify({
        action: 'Transport started',
        pickup_time: new Date().toISOString(),
        notes: notes || 'Package picked up for delivery',
        driver_name: 'Driver'
      }));

      await api.post(`/products/${productId}/add_step/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Transport started successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error starting transport:', error);
      toast.error(error.response?.data?.error || 'Failed to start transport');
    }
  };

  const handleEndTransport = async (productId) => {
    const location = prompt('Enter delivery location:');
    if (!location) return;
    
    const notes = prompt('Enter any notes (optional):');
    const recipientName = prompt('Enter recipient name (optional):');
    const gpsCoords = prompt('Enter GPS coordinates (optional, format: lat,lng):');

    try {
      const formData = new FormData();
      formData.append('step_type', 'TRANSPORT_END');
      formData.append('location', location);
      if (gpsCoords) {
        formData.append('gps_coordinates', gpsCoords);
      }
      formData.append('details', JSON.stringify({
        action: 'Transport completed',
        delivery_time: new Date().toISOString(),
        recipient_name: recipientName || 'Warehouse',
        notes: notes || 'Package delivered successfully'
      }));

      await api.post(`/products/${productId}/add_step/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Transport completed successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error ending transport:', error);
      toast.error(error.response?.data?.error || 'Failed to complete transport');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.current_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'CREATED': 'bg-blue-100 text-blue-800',
      'IN_TRANSIT': 'bg-orange-100 text-orange-800',
      'IN_WAREHOUSE': 'bg-purple-100 text-purple-800',
      'IN_QUALITY_CHECK': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaTruck className="text-blue-600" />
          Transport Products
        </h1>
        <p className="text-gray-600 mt-2">Manage products for transportation</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="CREATED">Ready for Pickup</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="IN_WAREHOUSE">In Warehouse</option>
              <option value="IN_QUALITY_CHECK">Quality Check</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaTruck className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(product.current_status)}`}>
                  {product.current_status}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">SKU:</span>
                  <span>{product.sku}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Batch:</span>
                  <span>{product.batch_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>{product.current_location || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-gray-400" />
                  <span>{product.production_date ? format(new Date(product.production_date), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Manufacturer:</span>
                  <span className="text-xs">{product.manufacturer_name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="flex-1 btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2"
                >
                  <FaEye /> View
                </button>
                
                {product.current_status === 'CREATED' && (
                  <button
                    onClick={() => handleStartTransport(product.id)}
                    className="flex-1 btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Start Transport
                  </button>
                )}
                
                {product.current_status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => handleEndTransport(product.id)}
                    className="flex-1 btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransportProducts;

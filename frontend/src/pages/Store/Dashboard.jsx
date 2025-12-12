import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaShoppingCart, FaBoxOpen, FaDollarSign, FaChartLine } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const StoreDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inStore: 0,
    sold: 0,
    revenue: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/');
      
      const storeProducts = response.data.results || response.data;
      const filtered = storeProducts.filter(p => 
        p.current_status === 'IN_STORE' || p.current_status === 'SOLD' || p.current_status === 'IN_WAREHOUSE'
      );
      
      setProducts(filtered);
      
      const inStore = filtered.filter(p => p.current_status === 'IN_STORE').length;
      const sold = filtered.filter(p => p.current_status === 'SOLD').length;
      const revenue = filtered
        .filter(p => p.current_status === 'SOLD')
        .reduce((sum, p) => sum + parseFloat(p.unit_price || 0), 0);
      
      setStats({
        inStore,
        sold,
        revenue: revenue.toFixed(2),
        total: filtered.length
      });
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveInStore = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'STORE_ENTRY',
        description: 'Product received at store',
        location: 'Store Inventory',
        notes: 'Product ready for sale'
      });
      toast.success('Product received in store');
      fetchStoreData();
    } catch (error) {
      console.error('Error receiving product:', error);
      toast.error(error.response?.data?.error || 'Failed to receive product');
    }
  };

  const handleSellProduct = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'SALE',
        description: 'Product sold to customer',
        location: 'Store Point of Sale',
        notes: 'Transaction completed'
      });
      toast.success('Sale recorded successfully');
      fetchStoreData();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error(error.response?.data?.error || 'Failed to record sale');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaStore className="text-indigo-600" />
            Store Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage store inventory and sales</p>
        </div>
        <button
          onClick={() => navigate('/store/products')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          <FaBoxOpen /> Manage Products
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <FaBoxOpen className="text-4xl text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Store</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inStore}</p>
            </div>
            <FaStore className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Sold</p>
              <p className="text-2xl font-bold text-green-600">{stats.sold}</p>
            </div>
            <FaShoppingCart className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">DZ {stats.revenue}</p>
            </div>
            <FaDollarSign className="text-4xl text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Store Inventory</h2>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <FaStore className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products in store</p>
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
                    Price
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.currency} {product.unit_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${product.current_status === 'IN_STORE' ? 'bg-blue-100 text-blue-800' : ''}
                        ${product.current_status === 'SOLD' ? 'bg-green-100 text-green-800' : ''}
                        ${product.current_status === 'IN_WAREHOUSE' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}>
                        {product.current_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {product.current_status !== 'IN_STORE' && product.current_status !== 'SOLD' && (
                        <button
                          onClick={() => handleReceiveInStore(product.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Receive
                        </button>
                      )}
                      {product.current_status === 'IN_STORE' && (
                        <button
                          onClick={() => handleSellProduct(product.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Sell
                        </button>
                      )}
                      {product.current_status === 'SOLD' && (
                        <span className="text-gray-400">Completed</span>
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

export default StoreDashboard;

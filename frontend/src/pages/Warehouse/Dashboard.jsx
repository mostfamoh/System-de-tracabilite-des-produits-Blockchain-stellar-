import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWarehouse, FaBoxOpen, FaArrowDown, FaArrowUp, FaChartBar } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';

const WarehouseDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inWarehouse: 0,
    received: 0,
    shipped: 0,
    total: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products/');
      
      const warehouseProducts = response.data.results || response.data;
      const filtered = warehouseProducts.filter(p => 
        p.current_status === 'IN_WAREHOUSE' || p.current_status === 'DELIVERED'
      );
      
      setProducts(filtered);
      
      const inWarehouse = filtered.filter(p => p.current_status === 'IN_WAREHOUSE').length;
      
      setStats({
        inWarehouse,
        received: filtered.length,
        shipped: 0,
        total: filtered.length
      });
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      toast.error('Failed to load warehouse data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveProduct = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'WAREHOUSE_ENTRY',
        description: 'Product received at warehouse',
        location: 'Warehouse Storage',
        notes: 'Product checked and stored'
      });
      toast.success('Product received successfully');
      fetchWarehouseData();
    } catch (error) {
      console.error('Error receiving product:', error);
      toast.error(error.response?.data?.error || 'Failed to receive product');
    }
  };

  const handleShipProduct = async (productId) => {
    try {
      await api.post(`/products/${productId}/add_step/`, {
        step_type: 'WAREHOUSE_EXIT',
        description: 'Product shipped from warehouse',
        location: 'Warehouse Loading Dock',
        notes: 'Product prepared for shipment'
      });
      toast.success('Product shipped successfully');
      fetchWarehouseData();
    } catch (error) {
      console.error('Error shipping product:', error);
      toast.error(error.response?.data?.error || 'Failed to ship product');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaWarehouse className="text-purple-600" />
            Warehouse Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage warehouse inventory and operations</p>
        </div>
        <button
          onClick={() => navigate('/warehouse/products')}
          className=" bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg"
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
            <FaBoxOpen className="text-4xl text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">In Warehouse</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inWarehouse}</p>
            </div>
            <FaWarehouse className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Received</p>
              <p className="text-2xl font-bold text-green-600">{stats.received}</p>
            </div>
            <FaArrowDown className="text-4xl text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Shipped</p>
              <p className="text-2xl font-bold text-orange-600">{stats.shipped}</p>
            </div>
            <FaArrowUp className="text-4xl text-orange-500" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Warehouse Inventory</h2>
        </div>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <FaWarehouse className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No products in warehouse</p>
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
                    Batch
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
                      <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.batch_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${product.current_status === 'IN_WAREHOUSE' ? 'bg-blue-100 text-blue-800' : ''}
                        ${product.current_status === 'DELIVERED' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {product.current_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {product.current_status !== 'IN_WAREHOUSE' && (
                        <button
                          onClick={() => handleReceiveProduct(product.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Receive
                        </button>
                      )}
                      {product.current_status === 'IN_WAREHOUSE' && (
                        <button
                          onClick={() => handleShipProduct(product.id)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Ship Out
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

export default WarehouseDashboard;

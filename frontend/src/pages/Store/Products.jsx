import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaEye, FaShoppingCart, FaDollarSign, FaCalendar, FaSearch, FaFilter, FaBox } from 'react-icons/fa';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const StoreProducts = () => {
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
      
      // Filter products relevant to store: IN_WAREHOUSE, IN_STORE, SOLD
      const filtered = allProducts.filter(p => 
        ['IN_WAREHOUSE', 'IN_STORE', 'SOLD'].includes(p.current_status)
      );
      
      setProducts(filtered);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveInStore = async (productId) => {
    const location = prompt('Enter store location/shelf:');
    if (!location) return;
    
    const notes = prompt('Enter any notes (optional):');
    const receivedBy = prompt('Received by (name):');
    const condition = prompt('Product condition (Good/Damaged):', 'Good');

    try {
      const formData = new FormData();
      formData.append('step_type', 'STORE_ENTRY');
      formData.append('location', location);
      formData.append('details', JSON.stringify({
        action: 'Product received at store',
        reception_time: new Date().toISOString(),
        shelf_location: location,
        condition: condition || 'Good',
        received_by: receivedBy || 'Store staff',
        notes: notes || 'Product ready for sale'
      }));

      await api.post(`/products/${productId}/add_step/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Product received in store');
      fetchProducts();
    } catch (error) {
      console.error('Error receiving product:', error);
      toast.error(error.response?.data?.error || 'Failed to receive product');
    }
  };

  const handleSellProduct = async (productId) => {
    const salePrice = prompt('Enter sale price:', '');
    if (!salePrice || isNaN(parseFloat(salePrice))) {
      toast.warning('Valid sale price is required');
      return;
    }
    
    const customerName = prompt('Enter customer name (optional):');
    const customerPhone = prompt('Enter customer phone (optional):');
    const paymentMethod = prompt('Payment method (Cash/Card):', 'Cash');
    const invoiceNumber = prompt('Invoice number (optional):');

    try {
      const formData = new FormData();
      formData.append('step_type', 'SALE');
      formData.append('location', 'Store Point of Sale');
      formData.append('details', JSON.stringify({
        action: 'Product sold to customer',
        sale_time: new Date().toISOString(),
        sale_price: parseFloat(salePrice),
        customer_name: customerName || 'Walk-in customer',
        customer_phone: customerPhone || 'N/A',
        payment_method: paymentMethod || 'Cash',
        invoice_number: invoiceNumber || `INV-${Date.now()}`,
        notes: 'Transaction completed successfully'
      }));

      await api.post(`/products/${productId}/add_step/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Sale recorded successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error(error.response?.data?.error || 'Failed to record sale');
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
      'IN_WAREHOUSE': 'bg-yellow-100 text-yellow-800',
      'IN_STORE': 'bg-blue-100 text-blue-800',
      'SOLD': 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FaStore className="text-indigo-600" />
          Store Products
        </h1>
        <p className="text-gray-600 mt-2">Manage store inventory and sales</p>
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
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="IN_WAREHOUSE">Available to Receive</option>
              <option value="IN_STORE">In Store</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaStore className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
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
                  <FaDollarSign className="text-green-500" />
                  <span className="font-medium">Price:</span>
                  <span className="text-green-600 font-semibold">{product.currency} {product.unit_price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaCalendar className="text-gray-400" />
                  <span>{product.production_date ? format(new Date(product.production_date), 'MMM dd, yyyy') : 'N/A'}</span>
                </div>
                {product.expiration_date && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Expires:</span>
                    <span className="text-red-600 text-xs">{format(new Date(product.expiration_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FaBox className="text-gray-400" />
                  <span className="font-medium">Category:</span>
                  <span className="text-xs">{product.category_name || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="flex-1 btn btn-sm bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center gap-2"
                >
                  <FaEye /> View
                </button>
                
                {product.current_status === 'IN_WAREHOUSE' && (
                  <button
                    onClick={() => handleReceiveInStore(product.id)}
                    className="flex-1 btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                  >
                    <FaBox /> Receive
                  </button>
                )}
                
                {product.current_status === 'IN_STORE' && (
                  <button
                    onClick={() => handleSellProduct(product.id)}
                    className="flex-1 btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
                  >
                    <FaShoppingCart /> Sell
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

export default StoreProducts;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import productService from '../../services/productService';
import { toast } from 'react-toastify';
import { 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaQrcode, 
  FaBox, 
  FaSpinner,
  FaEye 
} from 'react-icons/fa';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });

  useEffect(() => {
    fetchProducts();
  }, [search, ordering, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search,
        ordering,
        page,
      };
      const data = await productService.getProducts(params);
      setProducts(data.results || []);
      setTotalPages(Math.ceil((data.count || 0) / 20));
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await productService.deleteProduct(productId);
      toast.success('Product deleted successfully');
      fetchProducts();
      setDeleteModal({ show: false, product: null });
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleGenerateQR = async (productId) => {
    try {
      await productService.generateQRCode(productId);
      toast.success('QR code generated successfully');
      fetchProducts();
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      CREATED: { label: 'Created', class: 'bg-blue-100 text-blue-800' },
      IN_TRANSIT: { label: 'In Transit', class: 'bg-yellow-100 text-yellow-800' },
      IN_WAREHOUSE: { label: 'In Warehouse', class: 'bg-purple-100 text-purple-800' },
      IN_STORE: { label: 'In Store', class: 'bg-green-100 text-green-800' },
      SOLD: { label: 'Sold', class: 'bg-gray-100 text-gray-800' },
    };
    const statusInfo = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <p className="text-gray-600 mt-1">Create, edit, and manage your products</p>
        </div>
        <Link
          to="/manufacturer/products/create"
          className="btn btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span>Create Product</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="-name">Name (Z-A)</option>
            <option value="price">Price (Low to High)</option>
            <option value="-price">Price (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-4xl text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <FaBox className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
          <p className="text-gray-500 mb-4">Start by creating your first product</p>
          <Link to="/manufacturer/products/create" className="btn btn-primary">
            <FaPlus className="inline mr-2" />
            Create Product
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3">
                            <FaBox className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {product.price} {product.currency}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(product.current_status)}
                    </td>
                    <td className="px-6 py-4">
                      {product.qr_code ? (
                        <a
                          href={product.qr_code}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaQrcode className="text-xl" />
                        </a>
                      ) : (
                        <button
                          onClick={() => handleGenerateQR(product.id)}
                          className="text-gray-400 hover:text-primary"
                          title="Generate QR Code"
                        >
                          <FaQrcode className="text-xl" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/manufacturer/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FaEye className="text-lg" />
                        </Link>
                        <Link
                          to={`/manufacturer/products/${product.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Edit"
                        >
                          <FaEdit className="text-lg" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ show: true, product })}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteModal.product?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, product: null })}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal.product.id)}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;

import React, { useState, useEffect } from 'react';
import productService from '../../services/productService';
import { toast } from 'react-toastify';
import { FaSearch, FaSpinner, FaQrcode, FaBox } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ClientProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      const data = await productService.getClientProducts(params);
      setProducts(data.results);
      setTotalPages(Math.ceil(data.count / 20));
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      CREATED: 'badge badge-info',
      IN_TRANSIT: 'badge badge-warning',
      IN_WAREHOUSE: 'badge status-in-warehouse',
      IN_STORE: 'badge status-in-store',
      SOLD: 'badge status-sold',
    };
    return statusMap[status] || 'badge';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <Link to="/scan" className="btn-primary flex items-center space-x-2">
          <FaQrcode />
          <span>Scan QR Code</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU, manufacturer..."
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="input-field"
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="name">Name A-Z</option>
              <option value="-name">Name Z-A</option>
              <option value="unit_price">Price Low to High</option>
              <option value="-unit_price">Price High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FaSpinner className="animate-spin h-12 w-12 text-primary-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <FaBox className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
                {/* Product Image/QR */}
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {product.qr_code_url ? (
                    <img
                      src={product.qr_code_url}
                      alt={product.name}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <FaBox className="h-20 w-20 text-gray-400" />
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manufacturer:</span>
                      <span className="font-medium">{product.manufacturer_name}</span>
                    </div>
                    {product.category_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{product.category_name}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">{product.unit_price} {product.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={getStatusBadge(product.current_status)}>
                        {product.status_display}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/product/${product.id}/verify`}
                    className="block w-full text-center btn-primary mt-4"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientProducts;

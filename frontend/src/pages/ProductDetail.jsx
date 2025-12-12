import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaIndustry, FaCalendar, FaMapMarkerAlt, FaQrcode, FaHistory, FaCheckCircle, FaTruck, FaWarehouse, FaStore } from 'react-icons/fa';
import api from '../services/api';
import productService from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyReport, setVerifyReport] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}/`);
      setProduct(response.data);
      setSteps(response.data.steps || []);
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    if (!user || user.role !== 'ADMIN') {
      toast.error('Only admins can verify the product chain');
      return;
    }

    try {
      setVerifying(true);
      setVerifyReport(null);
      const data = await productService.verifyChain(id);
      setVerifyReport(data);
      toast.success('Chain verification report received');
    } catch (error) {
      console.error('Chain verification failed', error);
      toast.error('Chain verification failed');
      setVerifyReport({ error: error?.response?.data || String(error) });
    } finally {
      setVerifying(false);
    }
  };

  const getStepIcon = (stepType) => {
    const icons = {
      'CREATION': <FaIndustry className="text-blue-500" />,
      'QUALITY_CHECK': <FaCheckCircle className="text-green-500" />,
      'TRANSPORT_START': <FaTruck className="text-orange-500" />,
      'TRANSPORT_END': <FaTruck className="text-blue-500" />,
      'WAREHOUSE_ENTRY': <FaWarehouse className="text-purple-500" />,
      'WAREHOUSE_EXIT': <FaWarehouse className="text-indigo-500" />,
      'STORE_ENTRY': <FaStore className="text-teal-500" />,
      'SALE': <FaCheckCircle className="text-emerald-500" />
    };
    return icons[stepType] || <FaBox className="text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'CREATED': 'bg-blue-100 text-blue-800',
      'IN_QUALITY_CHECK': 'bg-yellow-100 text-yellow-800',
      'IN_TRANSIT': 'bg-orange-100 text-orange-800',
      'IN_WAREHOUSE': 'bg-purple-100 text-purple-800',
      'IN_STORE': 'bg-indigo-100 text-indigo-800',
      'SOLD': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Product not found</p>
          <button onClick={() => navigate(-1)} className="mt-4 btn bg-blue-600 text-white">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
        <p className="text-gray-600 mt-2">{product.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBox className="text-blue-600" />
              Product Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="text-gray-800">{product.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Batch Number</label>
                <p className="text-gray-800">{product.batch_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <p className="text-gray-800">{product.category_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(product.current_status)}`}>
                  {product.current_status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Unit Price</label>
                <p className="text-gray-800 font-semibold">{product.currency} {product.unit_price}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Weight</label>
                <p className="text-gray-800">{product.weight || 'N/A'} kg</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Production Date</label>
                <p className="text-gray-800">
                  {product.production_date ? format(new Date(product.production_date), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expiration Date</label>
                <p className="text-gray-800">
                  {product.expiration_date ? format(new Date(product.expiration_date), 'MMM dd, yyyy') : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Location</label>
                <p className="text-gray-800 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-gray-400" />
                  {product.current_location || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Dimensions</label>
                <p className="text-gray-800">{product.dimensions || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Manufacturer Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaIndustry className="text-blue-600" />
              Manufacturer Information
            </h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-gray-800">{product.manufacturer_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Manufacturing Details</label>
                <p className="text-gray-600 text-sm">{product.manufacturing_details || 'No additional details available'}</p>
              </div>
            </div>
          </div>

          {/* Supply Chain History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaHistory className="text-blue-600" />
              Supply Chain History
            </h2>
            {steps.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No history available</p>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getStepIcon(step.step_type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{step.step_type_display}</h3>
                        <span className="text-sm text-gray-500">
                          {format(new Date(step.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{step.description || 'No description'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          {step.location || 'N/A'}
                        </span>
                        <span>By: {step.actor_name || 'System'}</span>
                      </div>
                      {step.details && Object.keys(step.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          {Object.entries(step.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code Card */}
          {product.qr_code_url && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaQrcode className="text-blue-600" />
                QR Code
              </h2>
              <div className="flex justify-center">
                <img
                  src={product.qr_code_url}
                  alt="Product QR Code"
                  className="w-48 h-48 border-2 border-gray-200 rounded"
                />
              </div>
              <p className="text-sm text-gray-500 text-center mt-4">
                Scan to verify product authenticity
              </p>
            </div>
          )}

          {/* Blockchain Info Card */}
          {product.blockchain_hash && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Blockchain Verification
              </h2>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Blockchain Hash</label>
                  <p className="text-xs text-gray-800 font-mono break-all bg-gray-50 p-2 rounded">
                    {product.blockchain_hash}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <FaCheckCircle />
                  <span className="text-sm font-medium">Verified on Blockchain</span>
                </div>

                {user && user.role === 'ADMIN' && (
                  <div className="mt-4">
                    <button
                      onClick={handleVerifyChain}
                      disabled={verifying}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      {verifying ? 'Verifying...' : 'Verify Full Chain'}
                    </button>
                    {verifyReport && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-700">
                        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(verifyReport, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Steps</span>
                <span className="font-semibold text-gray-800">{steps.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-semibold text-gray-800">
                  {product.created_at ? format(new Date(product.created_at), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-semibold text-gray-800">
                  {product.updated_at ? format(new Date(product.updated_at), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

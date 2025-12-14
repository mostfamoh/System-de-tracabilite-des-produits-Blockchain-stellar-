import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import productService from '../../services/productService';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaMapMarkerAlt, FaClock, FaUser } from 'react-icons/fa';
import { format } from 'date-fns';

const ProductVerification = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await productService.getPublicProduct(id);
      setProduct(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Product not found or invalid QR code');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <FaSpinner className="animate-spin h-12 w-12 text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FaExclamationCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to="/scan" className="btn-primary">Scan Another Code</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <FaSpinner className="animate-spin h-12 w-12 text-primary-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading product information...</p>
      </div>
    );
  }

  const { product: productInfo, supply_chain, verification } = product;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Verification Status */}
      <div className={`p-6 rounded-xl ${verification.is_genuine ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
        <div className="flex items-center justify-center space-x-3">
          {verification.is_genuine ? (
            <>
              <FaCheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-green-900">Product Verified ✓</h2>
                <p className="text-green-700">This is an authentic product</p>
              </div>
            </>
          ) : (
            <>
              <FaExclamationCircle className="h-8 w-8 text-red-600" />
              <div>
                <h2 className="text-2xl font-bold text-red-900">Verification Failed</h2>
                <p className="text-red-700">This product could not be verified</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row gap-8">
          {/* QR Code Display */}
          {productInfo.qr_code_url && (
            <div className="flex-shrink-0">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <img 
                  src={productInfo.qr_code_url} 
                  alt="Product QR Code" 
                  className="w-48 h-48 object-contain"
                />
                <p className="text-center text-xs text-gray-600 mt-2">Scan to verify</p>
              </div>           
            </div>
          )}

          {/* Product Details */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Product Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Name</h4>
                <p className="text-gray-900">{productInfo.name}</p>
              </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">SKU</h4>
            <p className="text-gray-900">{productInfo.sku}</p>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
            <p className="text-gray-900">{productInfo.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Batch Number</h4>
            <p className="text-gray-900">{productInfo.batch_number}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Production Date</h4>
            <p className="text-gray-900">
              {productInfo.production_date ? format(new Date(productInfo.production_date), 'PPP') : 'N/A'}
            </p>
          </div>

          {productInfo.weight && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Weight</h4>
              <p className="text-gray-900">{productInfo.weight} kg</p>
            </div>
          )}

          {productInfo.dimensions && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Dimensions</h4>
              <p className="text-gray-900">{productInfo.dimensions}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Price</h4>
            <p className="text-gray-900">{productInfo.unit_price} {productInfo.currency}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Current Status</h4>
            <span className="badge badge-success">{productInfo.current_status_display}</span>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manufacturer Information */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Manufacturer Information</h3>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-700">Company Name</h4>
            <p className="text-gray-900">{productInfo.manufacturer.name}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700">Contact</h4>
            <p className="text-gray-900">{productInfo.manufacturer.contact}</p>
          </div>
          {productInfo.manufacturer.phone && (
            <div>
              <h4 className="font-semibold text-gray-700">Phone</h4>
              <p className="text-gray-900">{productInfo.manufacturer.phone}</p>
            </div>
          )}
          {productInfo.manufacturer.address && (
            <div>
              <h4 className="font-semibold text-gray-700">Address</h4>
              <p className="text-gray-900">{productInfo.manufacturer.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Supply Chain History */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Supply Chain History ({supply_chain.total_steps} steps)
        </h3>

        <div className="space-y-6">
          {supply_chain.steps.map((step) => (
            <div key={step.step_number} className="border-l-4 border-primary-500 pl-6 relative">
              <div className="absolute left-[-8px] top-0 w-4 h-4 bg-primary-500 rounded-full"></div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {step.step_number}. {step.step_type_display}
                  </h4>
                  {step.blockchain_verified && (
                    <span className="badge badge-success text-xs">
                      <FaCheckCircle className="inline mr-1" />
                      Blockchain Verified
                    </span>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <FaUser className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">Actor</p>
                      <p className="font-medium">{step.actor.name}</p>
                      <p className="text-xs text-gray-500">{step.actor.role}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <FaMapMarkerAlt className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium">{step.location}</p>
                      {step.gps_coordinates && (
                        <p className="text-xs text-gray-500">{step.gps_coordinates}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <FaClock className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-gray-600">Timestamp</p>
                      <p className="font-medium">
                        {format(new Date(step.timestamp), 'PPpp')}
                      </p>
                    </div>
                  </div>

                  {step.details && Object.keys(step.details).length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Details</p>
                      <div className="text-gray-900 space-y-1">
                        {Object.entries(step.details).map(([key, value]) => (
                          <p key={key} className="text-sm">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(step.photo_url || step.document_url) && (
                  <div className="flex space-x-2 mt-2">
                    {step.photo_url && (
                      <a
                        href={step.photo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs btn-secondary"
                      >
                        View Photo
                      </a>
                    )}
                    {step.document_url && (
                      <a
                        href={step.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs btn-secondary"
                      >
                        View Document
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blockchain Verification */}
      {verification.blockchain_verified && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Blockchain Verification</h3>
          <p className="text-sm text-blue-700 mb-2">
            This product's authenticity has been verified on the blockchain.
          </p>
          <p className="text-xs text-blue-600 font-mono break-all">
            Hash: {verification.blockchain_hash}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Link to="/scan" className="btn-primary">
          Scan Another Product
        </Link>
        <button onClick={() => window.print()} className="btn-secondary">
          Print Verification
        </button>
      </div>
    </div>
  );
};

export default ProductVerification;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaQrcode, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';

const QRScanner = () => {
  const [manualId, setManualId] = useState('');
  const navigate = useNavigate();

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      navigate(`/product/${manualId.trim()}/verify`);
    } else {
      toast.error('Please enter a product ID');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <FaQrcode className="h-20 w-20 text-primary-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan QR Code</h1>
        <p className="text-gray-600">Verify product authenticity instantly</p>
      </div>

      {/* Manual Entry */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Product ID</h2>
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product ID (UUID)
            </label>
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              className="input-field"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the product UUID from the QR code
            </p>
          </div>
          <button type="submit" className="w-full btn-primary">
            Verify Product
          </button>
        </form>
      </div>

      {/* Camera Scanner Note */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
        <div className="flex items-start space-x-3">
          <FaCamera className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Camera Scanner</h3>
            <p className="text-sm text-blue-700 mb-2">
              To use your device camera for scanning:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
              <li>Allow camera permissions when prompted</li>
              <li>Point your camera at the QR code</li>
              <li>Wait for automatic detection</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Note: Camera scanning requires HTTPS or localhost
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white p-8 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              1
            </span>
            <p>Scan the QR code on the product or enter the product ID manually</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              2
            </span>
            <p>System verifies the product against blockchain records</p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              3
            </span>
            <p>View complete product information and supply chain history</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

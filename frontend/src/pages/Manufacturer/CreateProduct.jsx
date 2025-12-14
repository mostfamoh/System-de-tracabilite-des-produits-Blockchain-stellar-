import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import productService from '../../services/productService';
import { FaBox, FaCalendar, FaWeight, FaDollarSign, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    batch_number: '',
    production_date: '',
    expiration_date: '',
    weight: '',
    dimensions: '',
    unit_price: '',
    currency: 'DZ',
    current_location: '',
    image:null,
  });
  const [image, setImage] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data.results || data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleImageChange = (e) => {
  setImage(e.target.files[0]); 
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      const submitData = { ...formData };
      
      if (!submitData.category) delete submitData.category;
      if (!submitData.expiration_date) delete submitData.expiration_date;
      if (!submitData.weight) delete submitData.weight;
      if (!submitData.dimensions) delete submitData.dimensions;
      if (!submitData.current_location) delete submitData.current_location;

      await productService.createProduct(submitData);
      const productId = response.id;

    
    if (image) {
      const formDataImage = new FormData();
      formDataImage.append("image", image);

      await productService.uploadProductImage(productId, formDataImage);
    }
      toast.success('Product created successfully!');
      navigate('/manufacturer/products');
    } catch (error) {
      console.error('Failed to create product:', error);
      
      if (error.response?.data) {
        const errors = error.response.data;
        Object.keys(errors).forEach(key => {
          if (Array.isArray(errors[key])) {
            toast.error(`${key}: ${errors[key][0]}`);
          } else {
            toast.error(`${key}: ${errors[key]}`);
          }
        });
      } else {
        toast.error('Failed to create product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Product</h1>
          <p className="text-gray-600">
            Fill in the product details to create a new traceable item in the system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBox className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g., Premium Olive Oil"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="input-field"
                  placeholder="Detailed product description..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number *
                </label>
                <input
                  type="text"
                  id="batch_number"
                  name="batch_number"
                  required
                  value={formData.batch_number}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., BATCH-2025-001"
                />
              </div>
            </div>
          </div>

          {/* Production Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Production Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="production_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Production Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="production_date"
                    name="production_date"
                    required
                    value={formData.production_date}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="expiration_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="expiration_date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaWeight className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-2">
                  Dimensions
                </label>
                <input
                  type="text"
                  id="dimensions"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 10 x 5 x 3 cm"
                />
              </div>
            </div>
          </div>
         
          <div className="text-center">
            <p className='text-xl font-semibold text-gray-800 mb-4'>Product Image</p>
          <label
            htmlFor="file-upload"
            className="cursor-pointer btn-primary text-white font-semibold py-2 px-4 rounded mr-4"
          >
            Choose Image
          </label>
          <span id="file-name" className="text-gray-700">
            {formData.image?.name || "No file chosen"}
          </span>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                image: e.target.files[0],
              }))
            }
          />
        </div>


          {/* Pricing & Location */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pricing & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaDollarSign className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="unit_price"
                    name="unit_price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  value={formData.currency}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="DZ">DZ (Algerian Dinar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <div>
                <label htmlFor="current_location" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="current_location"
                    name="current_location"
                    value={formData.current_location}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="e.g., Factory Floor A"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/manufacturer/products')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FaBox />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;

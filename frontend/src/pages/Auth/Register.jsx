import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaBuilding, FaSpinner, FaMapMarkerAlt } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    company_name: '',
    address: '',
    phone: '',
    tax_id: '',
    role: 'FABRICANT',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { value: 'FABRICANT', label: 'Manufacturer' },
    { value: 'TRANSPORT', label: 'Transport Company' },
    { value: 'ENTREPOT', label: 'Warehouse' },
    { value: 'MAGASIN', label: 'Store' },
    { value: 'CLIENT', label: 'Client' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      if (formData.role === 'CLIENT') {
        toast.success('Account created! You can now login.');
        navigate('/login');
      } else {
        toast.success('Registration successful! Please wait for admin approval.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      // Handle validation errors
      if (error.response?.data) {
        const data = error.response.data;
        
        // Check for specific field errors
        if (data.email) {
          toast.error(`Email: ${data.email[0]}`);
        } else if (data.company_name) {
          toast.error(`Company Name: ${data.company_name[0]}`);
        } else if (data.password) {
          toast.error(`Password: ${data.password[0]}`);
        } else if (data.role) {
          toast.error(`Role: ${data.role[0]}`);
        } else if (data.error) {
          toast.error(data.error);
        } else if (data.detail) {
          toast.error(data.detail);
        } else {
          toast.error('Registration failed. Please check your information.');
        }
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Register Account
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name *</label>
              <input
                name="company_name"
                type="text"
                required
                value={formData.company_name}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tax ID</label>
              <input
                name="tax_id"
                type="text"
                value={formData.tax_id}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field mt-1"
              >
                {roles
                .filter((role) => role.value !== "CLIENT") 
                .map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <input
                name="password_confirmation"
                type="password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className="input-field mt-1"
              />
            </div>
          </div>

          {formData.role !== 'CLIENT' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠ Your account will require admin approval before you can access the system.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin h-5 w-5" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

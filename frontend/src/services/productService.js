import api from './api';

const productService = {
  // Get all products (client view)
  getClientProducts: async (params = {}) => {
    const response = await api.get('/client/products/', { params });
    return response.data;
  },

  // Get all products (admin/manufacturer view)
  getProducts: async (params = {}) => {
    const response = await api.get('/products/', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}/`);
    return response.data;
  },

  // Get public product (QR code scan)
  getPublicProduct: async (id) => {
    // No auth required
    const response = await api.get(`/public/product/${id}/`);
    return response.data;
  },

  // Create product
  createProduct: async (data) => {
    const response = await api.post('/products/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update product
  updateProduct: async (id, data) => {
    const response = await api.put(`/products/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}/`);
    return response.data;
  },

  // Add product step
  addProductStep: async (productId, data) => {
    const response = await api.post(`/products/${productId}/add_step/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get product steps
  getProductSteps: async (productId) => {
    const response = await api.get(`/products/${productId}/steps/`);
    return response.data;
  },

  // Get product categories
  getCategories: async () => {
    const response = await api.get('/product-categories/');
    return response.data;
  },

  // Generate QR code
  generateQRCode: async (productId) => {
    const response = await api.post(`/products/${productId}/generate_qr/`);
    return response.data;
  },
  // Verify full product chain (admin)
  verifyChain: async (productId) => {
    const response = await api.post(`/products/${productId}/verify_chain/`);
    return response.data;
  },
};

export default productService;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth pages
import Login from './pages/Auth/Login';
import ClientRegister from './pages/Auth/ClientRegister';
import Register from './pages/Auth/Register';

// Public pages
import Home from './pages/Home';
import QRScanner from './pages/Public/QRScanner';
import ProductVerification from './pages/Public/ProductVerification';
import ProductDetail from './pages/ProductDetail';
import TestPage from './pages/TestPage';

// Client pages
import ClientDashboard from './pages/Client/Dashboard';
import ClientProducts from './pages/Client/Products';

// Manufacturer pages
import ManufacturerDashboard from './pages/Manufacturer/Dashboard';
import CreateProduct from './pages/Manufacturer/CreateProduct';
import ManageProducts from './pages/Manufacturer/ManageProducts';

// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageUsers from './pages/Admin/ManageUsers';
import RegistrationRequests from './pages/Admin/RegistrationRequests';
import AdminProducts from './pages/Admin/Products';

// Transport pages
import TransportDashboard from './pages/Transport/Dashboard';
import TransportProducts from './pages/Transport/Products';

// Warehouse pages
import WarehouseDashboard from './pages/Warehouse/Dashboard';
import WarehouseProducts from './pages/Warehouse/Products';

// Store pages
import StoreDashboard from './pages/Store/Dashboard';
import StoreProducts from './pages/Store/Products';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/client" element={<ClientRegister />} />
            <Route path="/register" element={<Register />} />
            <Route path="/scan" element={<QRScanner />} />
            <Route path="/product/:id/verify" element={<ProductVerification />} />
            
            {/* Product Detail - Protected route for authenticated users */}
            <Route
              path="/product/:id"
              element={
                <PrivateRoute roles={['ADMIN', 'FABRICANT', 'TRANSPORT', 'ENTREPOT', 'MAGASIN', 'CLIENT']}>
                  <ProductDetail />
                </PrivateRoute>
              }
            />

            {/* Client routes */}
            <Route
              path="/client/dashboard"
              element={
                <PrivateRoute roles={['CLIENT']}>
                  <ClientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/client/products"
              element={
                <PrivateRoute roles={['CLIENT']}>
                  <ClientProducts />
                </PrivateRoute>
              }
            />

            {/* Manufacturer routes */}
            <Route
              path="/manufacturer/dashboard"
              element={
                <PrivateRoute roles={['FABRICANT']}>
                  <ManufacturerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/manufacturer/products/create"
              element={
                <PrivateRoute roles={['FABRICANT']}>
                  <CreateProduct />
                </PrivateRoute>
              }
            />
            <Route
              path="/manufacturer/products"
              element={
                <PrivateRoute roles={['FABRICANT']}>
                  <ManageProducts />
                </PrivateRoute>
              }
            />

            {/* Transport routes */}
            <Route
              path="/transport/dashboard"
              element={
                <PrivateRoute roles={['TRANSPORT']}>
                  <TransportDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/transport/products"
              element={
                <PrivateRoute roles={['TRANSPORT']}>
                  <TransportProducts />
                </PrivateRoute>
              }
            />

            {/* Warehouse routes */}
            <Route
              path="/warehouse/dashboard"
              element={
                <PrivateRoute roles={['ENTREPOT']}>
                  <WarehouseDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/warehouse/products"
              element={
                <PrivateRoute roles={['ENTREPOT']}>
                  <WarehouseProducts />
                </PrivateRoute>
              }
            />

            {/* Store routes */}
            <Route
              path="/store/dashboard"
              element={
                <PrivateRoute roles={['MAGASIN']}>
                  <StoreDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/store/products"
              element={
                <PrivateRoute roles={['MAGASIN']}>
                  <StoreProducts />
                </PrivateRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <ManageUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <RegistrationRequests />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminProducts />
                </PrivateRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
}

export default App;

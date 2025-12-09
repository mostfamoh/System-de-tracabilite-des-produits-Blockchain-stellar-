import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaHome, FaQrcode, FaBoxOpen, FaUserCircle, 
  FaSignOutAlt, FaChartBar, FaUsers, FaClipboardCheck 
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { path: '/', label: 'Home', icon: FaHome },
        { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        { path: '/login', label: 'Login', icon: FaUserCircle },
      ];
    }

    switch (user.role) {
      case 'ADMIN':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/admin/users', label: 'Users', icon: FaUsers },
          { path: '/admin/requests', label: 'Requests', icon: FaClipboardCheck },
          { path: '/admin/products', label: 'Products', icon: FaBoxOpen },
        ];
      case 'FABRICANT':
        return [
          { path: '/manufacturer/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/manufacturer/products', label: 'Products', icon: FaBoxOpen },
        ];
      case 'CLIENT':
        return [
          { path: '/client/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/client/products', label: 'Products', icon: FaBoxOpen },
          { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        ];
      case 'TRANSPORT':
        return [
          { path: '/transport/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        ];
      case 'ENTREPOT':
        return [
          { path: '/warehouse/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        ];
      case 'MAGASIN':
        return [
          { path: '/store/dashboard', label: 'Dashboard', icon: FaChartBar },
          { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        ];
      default:
        return [
          { path: '/', label: 'Home', icon: FaHome },
          { path: '/scan', label: 'Scan QR', icon: FaQrcode },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <FaQrcode className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                TraceChain
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <div className="hidden md:block text-sm text-gray-700">
                    <div className="font-medium">{user.company_name}</div>
                    <div className="text-xs text-gray-500">{user.role_display}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <FaSignOutAlt className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/register/client"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 TraceChain. Product Traceability System.</p>
            <p className="mt-1">Powered by Blockchain Technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

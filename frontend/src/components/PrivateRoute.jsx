import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectMap = {
      ADMIN: '/admin/dashboard',
      FABRICANT: '/manufacturer/dashboard',
      CLIENT: '/client/dashboard',
      TRANSPORT: '/transport/dashboard',
      ENTREPOT: '/warehouse/dashboard',
      MAGASIN: '/store/dashboard',
    };
    return <Navigate to={redirectMap[user.role] || '/'} replace />;
  }

  return children;
};

export default PrivateRoute;

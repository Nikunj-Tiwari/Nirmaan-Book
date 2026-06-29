import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { AuthSpinner } from './CustomerRoute';

/**
 * BusinessRoute
 *
 * Allows access when:
 *   role == "business_partner"  AND  status == "active"
 *
 * Otherwise:
 *   loading                     → spinner
 *   not signed in               → /login  (preserving from-location)
 *   status == "pending"         → /pending-approval
 *   status == "suspended"       → /login  (LoginPage shows suspended error on next login)
 *   role == "customer"          → /dashboard
 *   role == "super_admin"       → /admin
 */
const BusinessRoute = ({ children }) => {
  const { currentUser, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSpinner label="Loading your business profile..." />;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'business_partner') {
    if (status === 'active') return children;
    if (status === 'pending') return <Navigate to="/pending-approval" replace />;
    // suspended or unknown → back to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'customer') return <Navigate to="/dashboard" replace />;
  if (role === 'super_admin') return <Navigate to="/admin" replace />;

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default BusinessRoute;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { AuthSpinner } from './CustomerRoute';

/**
 * AdminRoute
 *
 * Allows access when:
 *   role == "super_admin"
 *
 * Otherwise:
 *   loading                    → spinner
 *   user signed in, role null  → spinner (profile still resolving)
 *   not signed in              → /login  (preserving from-location)
 *   role == "customer"         → /dashboard
 *   role == "business_partner" → /business  (or /pending-approval if pending)
 */
const AdminRoute = ({ children }) => {
  const { currentUser, role, status, loading } = useAuth();
  const location = useLocation();

  // Auth context still resolving — wait
  if (loading) return <AuthSpinner label="Verifying admin access..." />;

  // User is signed in but Firestore profile hasn't resolved role yet — wait
  // This prevents premature redirect when Firebase auth fires before Firestore read completes
  if (currentUser && role === null) {
    return <AuthSpinner label="Loading admin profile..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === 'super_admin') return children;

  if (role === 'business_partner') {
    return status === 'pending' ? (
      <Navigate to="/pending-approval" replace />
    ) : (
      <Navigate to="/business" replace />
    );
  }

  if (role === 'customer') return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default AdminRoute;

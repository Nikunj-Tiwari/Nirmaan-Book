import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

/** Reusable full-page loading spinner matching NirmanBook design language. */
export const AuthSpinner = ({ label = 'Verifying session...' }) => (
  <div
    style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-muted)',
      gap: 16,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'authSpin 0.8s linear infinite',
      }}
    />
    <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
    <style>{`@keyframes authSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/**
 * CustomerRoute
 *
 * Allows access when:
 *   role == "customer"  AND  status == "active"
 *
 * Otherwise:
 *   loading          → spinner
 *   not authed       → /login  (preserving from-location)
 *   wrong role/status → /login
 */
const CustomerRoute = ({ children }) => {
  const { currentUser, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthSpinner label="Loading your profile..." />;

  // Not signed in at all
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Signed in but right role + status
  if (role === 'customer' && status === 'active') {
    return children;
  }

  // Business partner or admin landed here → send to their dashboard
  if (role === 'business_partner') {
    return status === 'pending' ? (
      <Navigate to="/pending-approval" replace />
    ) : (
      <Navigate to="/business" replace />
    );
  }
  if (role === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Pending customer (edge case), suspended, or no profile yet
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default CustomerRoute;

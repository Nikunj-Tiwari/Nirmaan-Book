import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

/**
 * ProtectedRoute component that restricts access to authenticated users only.
 * If the user is not logged in, they are redirected to the login page.
 * The current location is preserved in navigation state to allow redirecting back.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a clean loading state while Firebase initializes the auth session
  if (loading) {
    return (
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
          className="spinner"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>
          Verifying session...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;

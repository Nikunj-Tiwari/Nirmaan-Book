import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { LayoutDashboard, LogOut, Wrench } from 'lucide-react';
import logo from '../assets/logo.png';

/**
 * CustomerDashboard — placeholder.
 * Will be built out in a later step.
 */
const CustomerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 24,
      }}
    >
      <img src={logo} alt="NirmanBook" style={{ height: 32 }} />

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'var(--accent-light)',
            border: '1.5px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <LayoutDashboard size={26} color="var(--accent)" />
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 8,
            fontFamily: 'var(--font-display)',
          }}
        >
          Customer Dashboard
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 28,
            lineHeight: 1.6,
          }}
        >
          Welcome back, <strong>{currentUser?.name || currentUser?.email}</strong>!
          <br />
          Your dashboard is being built. Coming soon.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navigate('/configure/project')}
            style={{
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Wrench size={15} /> Start Configuring
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

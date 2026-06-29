import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ShieldCheck, LogOut, Users, Package, Tag } from 'lucide-react';
import logo from '../assets/logo.png';

/** AdminPanel — placeholder (built in Step 6). */
const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const shortcuts = [
    { icon: <Users size={16} />, label: 'Manage Users' },
    { icon: <Package size={16} />, label: 'Platform Catalog' },
    { icon: <Tag size={16} />, label: 'Pricing Overrides' },
  ];

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
            background: 'rgba(79,70,229,0.1)',
            border: '1.5px solid rgba(79,70,229,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <ShieldCheck size={26} color="#4f46e5" />
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
          Admin Panel
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          Signed in as <strong>{currentUser?.email}</strong>.
          <br />
          Full admin panel coming in Step 6.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {shortcuts.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {s.icon} {s.label}
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  borderRadius: 99,
                  padding: '2px 8px',
                  fontWeight: 600,
                }}
              >
                Soon
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
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
  );
};

export default AdminPanel;

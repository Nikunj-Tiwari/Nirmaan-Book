import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  ShieldCheck,
  LogOut,
  Users,
  Package,
  LayoutDashboard,
  ChevronRight,
  Database,
  FileText,
} from 'lucide-react';
import logo from '../../assets/logo.png';

const NAV = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', Icon: Users },
  { to: '/admin/catalog', label: 'Catalog', Icon: Package },
  { to: '/admin/quotes', label: 'All Quotes', Icon: FileText },
  { to: '/admin/seed', label: 'Seed Data', Icon: Database },
];

const SIDEBAR_W = 220;
const ADMIN_ACCENT = '#4f46e5'; // indigo — distinct from customer/business blue

/**
 * AdminLayout
 *
 * Shell for all /admin/* pages.
 *   • Sticky top header bar (logo + "NirmanBook Admin" + pending alert + logout)
 *   • Left sidebar 220px with nav links
 *   • Scrollable main content
 *
 * Props:
 *   pendingCount  – number shown as amber badge on header (optional)
 *   children      – page content
 */
const AdminLayout = ({ children, pendingCount = 0 }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? ADMIN_ACCENT : 'var(--text-secondary)',
    background: isActive ? `${ADMIN_ACCENT}12` : 'transparent',
    border: isActive ? `1px solid ${ADMIN_ACCENT}30` : '1px solid transparent',
    textDecoration: 'none',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-sans)',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Top header ── */}
      <header
        style={{
          height: 54,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          zIndex: 30,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Left: logo + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="NirmanBook" style={{ height: 26 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: `${ADMIN_ACCENT}12`,
              border: `1px solid ${ADMIN_ACCENT}30`,
              borderRadius: 99,
              padding: '3px 10px',
            }}
          >
            <ShieldCheck size={12} color={ADMIN_ACCENT} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: ADMIN_ACCENT,
                letterSpacing: '0.04em',
              }}
            >
              NirmanBook Admin
            </span>
          </div>
        </div>

        {/* Right: pending badge + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {pendingCount > 0 && (
            <NavLink
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 99,
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: 11,
                fontWeight: 700,
                color: '#f59e0b',
                textDecoration: 'none',
              }}
            >
              ⚠ {pendingCount} pending
            </NavLink>
          )}

          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: ADMIN_ACCENT,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {currentUser?.email?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--danger)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <nav
          style={{
            width: SIDEBAR_W,
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            padding: '20px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            position: 'sticky',
            top: 54,
            height: 'calc(100vh - 54px)',
            overflowY: 'auto',
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '4px 14px 8px',
            }}
          >
            Admin
          </p>

          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={navLinkStyle}>
              <Icon size={15} />
              {label}
              <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </NavLink>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', padding: '0 14px' }}>
              Super Admin only
            </p>
          </div>
        </nav>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

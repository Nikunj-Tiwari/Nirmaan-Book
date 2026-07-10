import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  Building2,
  LayoutDashboard,
  Tag,
  FileText,
  Package,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import logo from '../../assets/logo.png';

// ── Nav item definition ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/business', label: 'Overview', Icon: LayoutDashboard, end: true },
  { to: '/business/pricing', label: 'Platform Catalog', Icon: Tag },
  { to: '/business/catalog', label: 'My Modules', Icon: Package },
  { to: '/business/quotes', label: 'Quotes', Icon: FileText },
];

// ── Sidebar width ─────────────────────────────────────────────────────────────
const SIDEBAR_W = 220;

/**
 * BusinessLayout
 *
 * Wraps every /business/* page with:
 *   • Left sidebar (logo + nav links)
 *   • Top header strip (business name + logout)
 *   • Scrollable main content area
 *
 * Props:
 *   businessName  – string, displayed in header
 *   children      – page content
 */
const BusinessLayout = ({ children, businessName = '' }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Active link style helper
  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    background: isActive ? 'var(--accent-light)' : 'transparent',
    border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
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
      {/* ── Top header bar ── */}
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
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="NirmanBook" style={{ height: 26, display: 'block' }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Business Portal
          </span>
        </div>

        {/* Right: business name chip + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {(businessName || currentUser?.email) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 99,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              <Building2 size={13} />
              {businessName || currentUser?.email}
            </div>
          )}

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
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
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
            Navigation
          </p>

          {NAV_ITEMS.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} style={navLinkStyle}>
              <Icon size={15} />
              {label}
              <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </NavLink>
          ))}

          {/* Spacer + version note */}
          <div style={{ marginTop: 'auto', paddingTop: 20 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', padding: '0 14px' }}>
              NirmanBook Business Portal
            </p>
          </div>
        </nav>

        {/* Main scrollable content */}
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

export default BusinessLayout;

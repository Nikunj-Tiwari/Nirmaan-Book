import React, { useState } from 'react';
import { Menu, X, Layers } from 'lucide-react';

export const MobileNav = ({ onMenuOpen, user, onLogout, onBack, onSavedDesigns }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <header
        style={{
          display: 'none',
          height: 56,
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
          background: 'var(--bg-secondary)',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
        className="mobile-header"
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
          onClick={() => {
            onBack();
            closeMenu();
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: 'var(--accent)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={14} color="white" />
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              NirmanBook
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Configurator
            </div>
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 90,
              display: 'none',
            }}
            className="mobile-backdrop"
          />

          {/* Drawer */}
          <div
            style={{
              position: 'fixed',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--bg-secondary)',
              zIndex: 95,
              display: 'none',
              flexDirection: 'column',
              overflow: 'auto',
              maxHeight: 'calc(100vh - 56px)',
            }}
            className="mobile-drawer"
          >
            <div style={{ padding: '16px' }}>
              {/* Saved Designs */}
              <button
                onClick={() => {
                  onSavedDesigns();
                  closeMenu();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.background = 'var(--accent-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-primary)';
                }}
              >
                📌 Saved Designs
              </button>

              {/* Back to Home */}
              <button
                onClick={() => {
                  onBack();
                  closeMenu();
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                ← Back to Home
              </button>

              {/* Logout */}
              {user && (
                <button
                  onClick={() => {
                    onLogout();
                    closeMenu();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'var(--danger-light)',
                    border: '1px solid var(--danger)',
                    borderRadius: 8,
                    color: 'var(--danger)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  🚪 Logout
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 767px) {
          .mobile-header {
            display: flex !important;
          }
          .mobile-backdrop {
            display: block !important;
          }
          .mobile-drawer {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNav;

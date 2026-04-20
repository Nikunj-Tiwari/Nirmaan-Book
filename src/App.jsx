import React, { useState, useEffect, useCallback } from 'react';

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { STEPS } from './data/config';
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  BookOpen,
  Bookmark,
} from 'lucide-react';

// Pages & Components
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import StepIndicator from './components/StepIndicator';
import ToastProvider from './components/ToastProvider';
import ConfiguratorFlow from './components/ConfiguratorFlow';
import SavedDesignsDrawer from './components/SavedDesignsDrawer';
import ThemeToggle from './components/ThemeToggle';
import MobileNav from './components/MobileNav';
import MobileSidebar from './components/MobileSidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Global State
import { useConfig } from './store/ConfigContext';
import { useAuth } from './store/AuthContext';
import { useToast } from './components/ToastProvider';
import { getDraft, clearDraft, relativeTime, getConfigs } from './utils/storage';
import { useResponsive } from './hooks/useResponsive';

/* ── Draft Restore Banner ── */
const DraftBanner = ({ draft, onResume, onDismiss }) => {
  const when = relativeTime(draft.savedAt);
  return (
    <div
      className="no-print"
      style={{
        margin: '0 0 24px',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #162d48 100%)',
        border: '1px solid var(--accent-border)',
        borderRadius: 12,
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
        animation: 'fadeSlideDown 0.3s ease',
      }}
    >
      {/* Pulse dot */}
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: '#60d5ff',
          boxShadow: '0 0 8px rgba(96,213,255,0.7)',
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }}
      />
      <div style={{ flex: 1, minWidth: 200 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e0f2fe' }}>Unsaved draft found</span>
        <span style={{ fontSize: 12, color: '#93c5fd', marginLeft: 8 }}>Auto-saved {when}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onResume}
          style={{
            padding: '7px 16px',
            borderRadius: 7,
            border: 'none',
            background: '#3b82f6',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
        >
          Resume Draft
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: '7px 12px',
            borderRadius: 7,
            border: '1px solid #2d5a8e',
            background: 'transparent',
            color: '#93c5fd',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#60d5ff';
            e.currentTarget.style.color = '#e0f2fe';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2d5a8e';
            e.currentTarget.style.color = '#93c5fd';
          }}
        >
          Dismiss
        </button>
      </div>
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

/* ── Configurator Shell ── */
const ConfiguratorApp = ({ setConfigured, activeConfigId, setActiveConfigId }) => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [draftBanner, setDraftBanner] = useState(null); // the draft object or null
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { config, derived, actions, lastDraftSave } = useConfig();
  const { totalModules, valuation, validation } = derived;
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  // Reactive saved-design count — re-read localStorage on demand
  const [savedCount, setSavedCount] = useState(() => getConfigs().length);
  const refreshSavedCount = useCallback(() => setSavedCount(getConfigs().length), []);

  // Check for draft on first mount (only if nothing is already active)
  useEffect(() => {
    if (!activeConfigId) {
      const draft = getDraft();
      if (draft?.data) {
        // Use requestAnimationFrame to defer setState
        requestAnimationFrame(() => setDraftBanner(draft));
      }
    }
  }, [activeConfigId]);

  const handleResumeDraft = () => {
    actions.loadConfig(draftBanner.data);
    setDraftBanner(null);
    addToast('Draft restored — pick up where you left off', 'success');
    navigate('/configure/dimensions');
  };

  const handleDismissDraft = () => {
    clearDraft();
    setDraftBanner(null);
  };

  const handleLoadDesign = (entry) => {
    actions.loadConfig(entry.data);
    setActiveConfigId(entry.id);
    setSavedDrawerOpen(false);
    addToast(`Loaded "${entry.name}"`, 'success');
    refreshSavedCount();
    navigate('/configure/dimensions');
  };

  const percentUsed = validation.percentUsed || 0;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          background: 'var(--bg-primary)',
          minHeight: '100vh',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          width: '100%',
        }}
      >
        {/* ── Mobile Navigation ── */}
        {isMobile && (
          <MobileNav
            onMenuOpen={() => {}}
            user={user}
            onLogout={logout}
            onBack={() => {
              setConfigured(false);
              navigate('/');
            }}
            onSavedDesigns={() => setSavedDrawerOpen(true)}
          />
        )}

        {/* ── Sidebar (Desktop Only) ── */}
        {!isMobile && (
          <aside
            className="no-print desktop-sidebar"
            style={{
              width: 256,
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              position: 'sticky',
              top: 0,
              padding: isMobile ? 0 : '24px 18px',
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-xs)',
              zIndex: 10,
            }}
          >
            {/* Logo + back */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 32,
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
                onClick={() => {
                  setConfigured(false);
                  navigate('/');
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    background: 'var(--accent)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={15} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      letterSpacing: '-0.03em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    NirmanBook
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                      marginTop: 1,
                    }}
                  >
                    Configurator
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Steps
              </div>
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    opacity: 0.7,
                  }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                      border: `2px solid var(--border)`,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {step.id}
                  </span>
                  <span style={{ lineHeight: 1.25 }}>{step.title}</span>
                </div>
              ))}
            </nav>

            {/* Bottom section */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Price card */}
              <div
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 3,
                  }}
                >
                  Total Price
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: 'var(--accent)',
                    lineHeight: 1,
                  }}
                >
                  ₹{valuation.total.toLocaleString()}
                </div>
              </div>

              {/* User + logout */}
              {user && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 9,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Pro Account</div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-sans)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── Mobile Sidebar Drawer (Mobile Only) ── */}
        {isMobile && (
          <MobileSidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            valuation={valuation}
            totalModules={totalModules}
            config={config}
            derived={derived}
            user={user}
          />
        )}

        {/* ── Main Content ── */}
        <div
          className="main-content"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: isMobile ? 'auto' : '100vh',
            minHeight: isMobile ? '100vh' : 'auto',
            overflow: isMobile ? 'visible' : 'hidden',
            width: '100%',
          }}
        >
          {/* Top Header (Desktop Only) */}
          {!isMobile && (
            <header
              className="no-print header-desktop"
              style={{
                height: 56,
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 32px',
                background: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 30,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Wardrobe Configurator
                </span>
                {/* Draft auto-save indicator */}
                {lastDraftSave && (
                  <span
                    style={{
                      marginLeft: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#22c55e',
                        display: 'inline-block',
                        animation: 'draftPulse 3s ease-in-out infinite',
                      }}
                    />
                    <style>{`@keyframes draftPulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
                    Draft saved
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Saved Designs */}
                <button
                  id="configurator-saved-btn"
                  aria-label="Open saved designs panel"
                  onClick={() => setSavedDrawerOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.borderColor = 'var(--accent-border)';
                    e.currentTarget.style.background = 'var(--accent-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <Bookmark size={13} />
                  Saved Designs
                  {savedCount > 0 && (
                    <span
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 99,
                        background: 'var(--accent)',
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        marginLeft: 2,
                      }}
                    >
                      {savedCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setConfigured(false);
                    navigate('/');
                  }}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  ← Back to home
                </button>

                {/* Theme toggle */}
                <ThemeToggle size="sm" />

                {user && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </header>
          )}

          {/* Mobile Step Indicator */}
          {isMobile && (
            <div
              className="step-indicator-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                background: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              <span>Wardrobe Configurator</span>
            </div>
          )}

          {/* Step Indicator (Desktop Only) */}
          {/* Now handled by ConfiguratorFlow */}

          {/* Main Flow with Routing */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <ConfiguratorFlow
              activeConfigId={activeConfigId}
              setActiveConfigId={setActiveConfigId}
              onRefreshCount={refreshSavedCount}
            />
            {draftBanner && (
              <div
                style={{
                  padding: isMobile ? '12px' : '24px 40px',
                  background: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <DraftBanner
                  draft={draftBanner}
                  onResume={handleResumeDraft}
                  onDismiss={handleDismissDraft}
                />
              </div>
            )}
          </div>

          {/* Mobile Bottom Bar (Mobile Only) */}
          {isMobile && (
            <div
              className="mobile-bottom-bar no-print"
              style={{
                display: 'flex',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'auto',
                padding: '12px 16px 20px',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border)',
                gap: 12,
                zIndex: 50,
                flexDirection: 'column',
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Price display */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 2,
                    }}
                  >
                    Total Price
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: 'var(--accent)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    ₹{valuation.total.toLocaleString()}
                  </div>
                </div>
                {/* Configuration button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: 'var(--accent-light)',
                    border: '1px solid var(--accent-border)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--accent-light)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  title="View configuration"
                >
                  ⚙️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Designs Drawer */}
      <SavedDesignsDrawer
        isOpen={savedDrawerOpen}
        onClose={() => {
          setSavedDrawerOpen(false);
          refreshSavedCount();
        }}
        onLoad={handleLoadDesign}
        activeConfigId={activeConfigId}
        onToast={addToast}
        onRefreshCount={refreshSavedCount}
      />
    </>
  );
};

/* ── Root Router ── */
const App = () => {
  const [configured, setConfigured] = useState(false);
  const [activeConfigId, setActiveConfigId] = useState(null);

  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={
            configured ? (
              <ProtectedRoute>
                <ConfiguratorApp
                  setConfigured={setConfigured}
                  activeConfigId={activeConfigId}
                  setActiveConfigId={setActiveConfigId}
                />
              </ProtectedRoute>
            ) : (
              <HomePage
                onStart={() => setConfigured(true)}
                activeConfigId={activeConfigId}
                setActiveConfigId={setActiveConfigId}
                onLaunchConfigurator={() => setConfigured(true)}
              />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/configure/*"
          element={
            <ProtectedRoute>
              <ConfiguratorApp
                setConfigured={setConfigured}
                activeConfigId={activeConfigId}
                setActiveConfigId={setActiveConfigId}
              />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

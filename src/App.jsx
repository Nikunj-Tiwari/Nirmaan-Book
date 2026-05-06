import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import logo from './assets/logo.png';

// Pages & Components
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import ToastProvider from './components/ToastProvider';
import ConfiguratorFlow from './components/ConfiguratorFlow';
import SavedDesignsDrawer from './components/SavedDesignsDrawer';
import ThemeToggle from './components/ThemeToggle';
import MobileNav from './components/MobileNav';
import ProtectedRoute from './components/ProtectedRoute';

// Global State
import { useConfig } from './store/ConfigContext';
import { useAuth } from './store/AuthContext';
import { useToast } from './components/ToastProvider';
import { getDraft, clearDraft, relativeTime, getConfigs } from './utils/storage';
import { useResponsive } from './hooks/useResponsive';

/* ── Draft Restore Banner — compact ribbon style ── */
const DraftBanner = ({ draft, onResume, onDismiss }) => {
  const when = relativeTime(draft.savedAt);
  return (
    <div
      className="no-print"
      style={{
        padding: '8px 20px',
        background: 'linear-gradient(90deg, #1e3a5f 0%, #162d48 100%)',
        borderBottom: '1px solid var(--accent-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
        zIndex: 35,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#60d5ff',
          flexShrink: 0,
          boxShadow: '0 0 6px rgba(96,213,255,0.8)',
        }}
      />
      <span style={{ fontSize: 12, color: '#e0f2fe', fontWeight: 600, flex: 1 }}>
        Unsaved draft found
        <span style={{ fontSize: 11, color: '#93c5fd', marginLeft: 8, fontWeight: 400 }}>
          Auto-saved {when}
        </span>
      </span>
      <button
        onClick={onResume}
        style={{
          padding: '5px 14px',
          borderRadius: 6,
          border: 'none',
          background: '#3b82f6',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Resume Draft
      </button>
      <button
        onClick={onDismiss}
        style={{
          padding: '5px 10px',
          borderRadius: 6,
          border: '1px solid #2d5a8e',
          background: 'transparent',
          color: '#93c5fd',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Dismiss
      </button>
    </div>
  );
};

/* ── Configurator Shell ── */
const ConfiguratorApp = ({ setConfigured, activeConfigId, setActiveConfigId }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [draftBanner, setDraftBanner] = useState(null);
  const { actions, lastDraftSave } = useConfig();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Reactive saved-design count
  const [savedCount, setSavedCount] = useState(() => getConfigs().length);
  const refreshSavedCount = useCallback(() => setSavedCount(getConfigs().length), []);

  // Check for draft on first mount
  useEffect(() => {
    if (!activeConfigId) {
      const draft = getDraft();
      if (draft?.data) {
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

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-primary)',
          height: '100vh',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* ── Mobile nav bar ── */}
        {isMobile && (
          <MobileNav
            onMenuOpen={() => {}}
            user={user}
            onBack={() => {
              setConfigured(false);
              navigate('/');
            }}
            onSavedDesigns={() => setSavedDrawerOpen(true)}
          />
        )}

        {/* ── Top header (Desktop) — 52px ── */}
        {!isMobile && (
          <header
            className="no-print"
            style={{
              height: 52,
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              background: 'var(--bg-secondary)',
              flexShrink: 0,
              zIndex: 40,
            }}
          >
            {/* Logo + title + autosave dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                onClick={() => {
                  setConfigured(false);
                  navigate('/');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.8)}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
              >
                <img src={logo} alt="Nirmanbook" style={{ height: 26, width: 'auto' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                Wardrobe Configurator
              </span>
              {lastDraftSave && (
                <span
                  style={{
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

            {/* Right: saved designs, back to home, theme, user avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                id="configurator-saved-btn"
                aria-label="Open saved designs panel"
                onClick={() => setSavedDrawerOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '5px 10px',
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
                <Bookmark size={12} />
                Saved Designs
                {savedCount > 0 && (
                  <span
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 99,
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
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
                  padding: '5px 10px',
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

              <ThemeToggle size="sm" />

              {user && (
                <div
                  title={`Logged in as ${user.name}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          </header>
        )}

        {/* ── Compact draft restore ribbon ── */}
        {draftBanner && (
          <DraftBanner
            draft={draftBanner}
            onResume={handleResumeDraft}
            onDismiss={handleDismissDraft}
          />
        )}

        {/* ── Main configurator (stepper + preview 78% + controls 22% + bottom nav) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <ConfiguratorFlow
            activeConfigId={activeConfigId}
            setActiveConfigId={setActiveConfigId}
            onRefreshCount={refreshSavedCount}
          />
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

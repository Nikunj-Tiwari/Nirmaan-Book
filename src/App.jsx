import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  ArrowUp,
} from 'lucide-react';

// Pages & Components
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import StepIndicator from './components/StepIndicator';
import ToastProvider from './components/ToastProvider';
import StepDimensions from './components/StepDimensions';
import StepModules from './components/StepModules';
import StepFinishes from './components/StepFinishes';
import StepHardware from './components/StepHardware';
import StepVisualisation from './components/StepVisualisation';
import StepBOQ from './components/StepBOQ';
import Viewer from './components/Viewer';
import SavedDesignsDrawer from './components/SavedDesignsDrawer';
import ThemeToggle from './components/ThemeToggle';
import MobileNav from './components/MobileNav';
import MobileSidebar from './components/MobileSidebar';

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
        border: '1px solid #2d5a8e',
        borderRadius: 12,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [draftBanner, setDraftBanner] = useState(null); // the draft object or null
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { config, derived, actions, lastDraftSave } = useConfig();
  const { totalModules, valuation, validation } = derived;
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const mainRef = useRef(null);

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

  // Scroll listener for back-to-top button
  useEffect(() => {
    const mainContainer = mainRef.current;
    if (!mainContainer) return;

    const handleScroll = () => setShowBackToTop(mainContainer.scrollTop > 300);
    mainContainer.addEventListener('scroll', handleScroll);
    return () => mainContainer.removeEventListener('scroll', handleScroll);
  }, []);

  const handleResumeDraft = () => {
    actions.loadConfig(draftBanner.data);
    setDraftBanner(null);
    setCurrentStep(1);
    addToast('Draft restored — pick up where you left off', 'success');
  };

  const handleDismissDraft = () => {
    clearDraft();
    setDraftBanner(null);
  };

  const handleLoadDesign = (entry) => {
    actions.loadConfig(entry.data);
    setActiveConfigId(entry.id);
    setCurrentStep(1);
    setSavedDrawerOpen(false);
    addToast(`Loaded "${entry.name}"`, 'success');
    refreshSavedCount();
  };

  const canNavigateTo = (stepId) => {
    if (stepId <= currentStep) return true;
    if (stepId === 2 && currentStep === 1) return true;
    if (stepId === 3 && currentStep === 2) return totalModules > 0 && validation.isValid;
    if (stepId === 4 && currentStep === 3) return totalModules > 0 && validation.isValid;
    if (stepId > currentStep + 1) return false;
    return true;
  };

  const goToStep = (id) => canNavigateTo(id) && setCurrentStep(id);
  const nextStep = () => canNavigateTo(currentStep + 1) && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <StepDimensions />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <StepModules />
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Visualisation sits above the fold so dimension changes are immediately visible */}
            <StepVisualisation />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <StepFinishes />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <StepHardware />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <Viewer />
          </div>
        );

      case 3:
        return (
          <StepBOQ
            activeConfigId={activeConfigId}
            setActiveConfigId={setActiveConfigId}
            onRefreshCount={refreshSavedCount}
          />
        );

      default:
        return null;
    }
  };

  const configuratorSteps = STEPS.filter((s) => s.id !== 1); // Steps 2-4 mapped to 1-3

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
              {[
                { id: 1, title: 'Dimensions & Modules' },
                { id: 2, title: 'Finishes & Hardware' },
                { id: 3, title: 'Quote & Export' },
              ].map((step) => {
                const isLocked = !canNavigateTo(step.id);
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;

                return (
                  <div
                    key={step.id}
                    className={`sidebar-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                    style={{
                      opacity: isLocked ? 0.35 : 1,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !isLocked && goToStep(step.id)}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        border: `2px solid ${isActive || isDone ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: isActive || isDone ? 'var(--accent)' : 'transparent',
                        color: isActive || isDone ? 'white' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isDone ? <Check size={11} strokeWidth={3} /> : step.id}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--accent)' : 'inherit',
                        lineHeight: 1.25,
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </nav>

            {/* Live Price Tracker */}
            <div
              style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 10,
                padding: '14px 14px',
                marginTop: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Total Price
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '-0.03em',
                }}
              >
                ₹{valuation.total.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--accent)',
                  marginTop: 4,
                  opacity: 0.7,
                }}
              >
                {totalModules} module{totalModules !== 1 ? 's' : ''} selected
              </div>
            </div>

            {/* Bottom section */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Catalogue */}
              <a
                href="/Wardrobe Catalogue_Nirmanbook.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  textDecoration: 'none',
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
                <FileText size={14} color="var(--text-secondary)" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Product Catalogue
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>View all modules</div>
                </div>
              </a>

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
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginBottom: 5,
                    }}
                  >
                    <span>Width used</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: validation.isValid ? 'var(--text-primary)' : 'var(--danger)',
                      }}
                    >
                      {percentUsed.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'var(--bg-tertiary)',
                      borderRadius: 99,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(percentUsed, 100)}%`,
                        background: validation.isValid ? 'var(--accent)' : 'var(--danger)',
                        borderRadius: 99,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    <span>{totalModules} modules</span>
                    <span>
                      {derived.validation.usedWidth} / {config.width} mm
                    </span>
                  </div>
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
            currentStep={currentStep}
            canNavigateTo={canNavigateTo}
            goToStep={goToStep}
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
                  Step {currentStep} of 3
                </span>
                <span style={{ color: 'var(--border-strong)', margin: '0 4px' }}>·</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {
                    ['Dimensions & Modules', 'Finishes & Hardware', 'Quote & Export'][
                      currentStep - 1
                    ]
                  }
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
              <span>Step {currentStep} of 3</span>
              <span>·</span>
              <span
                style={{
                  flex: 1,
                  textAlign: 'center',
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {['Dimensions & Modules', 'Finishes & Hardware', 'Quote & Export'][currentStep - 1]}
              </span>
            </div>
          )}

          {/* Step Indicator (Desktop Only) */}
          {!isMobile && <StepIndicator currentStep={currentStep} totalSteps={3} />}

          {/* Scrollable Content */}
          <main
            ref={mainRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '16px 12px' : '40px 48px',
              paddingBottom: isMobile ? 180 : 120,
            }}
          >
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              {/* Draft banner — shown once on first visit if draft exists */}
              {draftBanner && (
                <DraftBanner
                  draft={draftBanner}
                  onResume={handleResumeDraft}
                  onDismiss={handleDismissDraft}
                />
              )}
              {renderStep()}
            </div>
          </main>

          {/* Floating Bottom Bar (Desktop Only) */}
          {!isMobile && (
            <div
              className="no-print"
              style={{
                position: 'fixed',
                bottom: 20,
                left: 256,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 40,
              }}
            >
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: 'var(--shadow-lg)',
                  pointerEvents: 'auto',
                  maxWidth: 480,
                  width: '100%',
                }}
              >
                {/* Progress dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 6 }}>
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      style={{
                        height: 5,
                        width: currentStep === s ? 20 : 6,
                        borderRadius: 99,
                        background:
                          currentStep === s
                            ? 'var(--accent)'
                            : currentStep > s
                              ? '#93c5fd'
                              : 'var(--border-strong)',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </div>

                <div style={{ flex: 1 }} />

                {/* Prev button */}
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    aria-label="Go to previous step"
                    style={{
                      width: 38,
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = 'var(--border-strong)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <ChevronLeft size={17} />
                  </button>
                )}

                {/* Next button */}
                <button
                  onClick={nextStep}
                  disabled={currentStep < 3 && !canNavigateTo(currentStep + 1)}
                  style={{
                    height: 38,
                    padding: '0 22px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'not-allowed'
                        : 'pointer',
                    background:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--bg-tertiary)'
                        : 'var(--accent)',
                    color:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--text-muted)'
                        : 'white',
                    border: '1px solid',
                    borderColor:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--border)'
                        : 'transparent',
                    opacity: currentStep < 3 && !canNavigateTo(currentStep + 1) ? 0.55 : 1,
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {currentStep === 3 ? 'Export Quote' : 'Continue'}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

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

              {/* Navigation buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'space-between',
                }}
              >
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    style={{
                      minHeight: 48,
                      minWidth: 44,
                      padding: '0 8px',
                      borderRadius: 8,
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 13,
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Previous step"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={nextStep}
                  disabled={currentStep < 3 && !canNavigateTo(currentStep + 1)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'not-allowed'
                        : 'pointer',
                    background:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--bg-tertiary)'
                        : 'var(--accent)',
                    color:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--text-muted)'
                        : 'white',
                    border: '1px solid',
                    borderColor:
                      currentStep < 3 && !canNavigateTo(currentStep + 1)
                        ? 'var(--border)'
                        : 'transparent',
                    opacity: currentStep < 3 && !canNavigateTo(currentStep + 1) ? 0.55 : 1,
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {currentStep === 3 ? 'Export Quote' : 'Next'} →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--accent)',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            zIndex: 40,
            transition: 'all 0.3s ease',
            animation: 'slideUp 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-hover)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Back to top"
        >
          <ArrowUp size={20} />
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </button>
      )}

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
              <ConfiguratorApp
                setConfigured={setConfigured}
                activeConfigId={activeConfigId}
                setActiveConfigId={setActiveConfigId}
              />
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
          path="/configure"
          element={
            <ConfiguratorApp
              setConfigured={setConfigured}
              activeConfigId={activeConfigId}
              setActiveConfigId={setActiveConfigId}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

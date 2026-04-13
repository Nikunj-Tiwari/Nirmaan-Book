import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { STEPS } from './data/config';
import { Layers, ChevronRight, ChevronLeft, Check, FileText } from 'lucide-react';

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

// Global State
import { useConfig } from './store/ConfigContext';
import { useAuth } from './store/AuthContext';

/* ── Configurator Shell ── */
const ConfiguratorApp = ({ setConfigured }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const { config, derived } = useConfig();
  const { totalModules, valuation, validation } = derived;
  const { user, logout } = useAuth();

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
            <StepFinishes />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <StepHardware />
            <div style={{ height: 1, background: 'var(--border)', width: '100%' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <StepVisualisation />
              <Viewer />
            </div>
          </div>
        );
      case 3:
        return <StepBOQ />;
      default:
        return null;
    }
  };

  const configuratorSteps = STEPS.filter((s) => s.id !== 1); // Steps 2-4 mapped to 1-3

  const percentUsed = validation.percentUsed || 0;

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-primary)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="no-print"
        style={{
          width: 256,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          padding: '24px 18px',
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
                style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}
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

      {/* ── Main Content ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <header
          className="no-print"
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
              {['Dimensions & Modules', 'Finishes & Hardware', 'Quote & Export'][currentStep - 1]}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                {user.name.charAt(0)}
              </div>
            )}
          </div>
        </header>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {/* Scrollable Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 120 }}>{renderStep()}</div>
        </main>

        {/* Floating Bottom Bar */}
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
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
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
                  currentStep < 3 && !canNavigateTo(currentStep + 1) ? 'not-allowed' : 'pointer',
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
      </div>
    </div>
  );
};

/* ── Root Router ── */
const App = () => {
  const [configured, setConfigured] = useState(false);

  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={
            configured ? (
              <ConfiguratorApp setConfigured={setConfigured} />
            ) : (
              <HomePage onStart={() => setConfigured(true)} />
            )
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/configure" element={<ConfiguratorApp setConfigured={setConfigured} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import HorizontalStepper from './HorizontalStepper';
import StepProject from './StepProject';
import PreviewPanel from './PreviewPanel';
import StepDimensions from './StepDimensions';
import StepModules from './StepModules';
import StepMaterials from './StepMaterials';
import StepHardware from './StepHardware';
import StepBOQ from './StepBOQ';
import { useStepGuard } from '../hooks/useStepGuard';
import { useResponsive } from '../hooks/useResponsive';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';

const STEP_ROUTES = [
  { id: 1, path: '/configure/project', name: 'Project Info' },
  { id: 2, path: '/configure/dimensions', name: 'Dimensions' },
  { id: 3, path: '/configure/modules', name: 'Modules' },
  { id: 4, path: '/configure/materials', name: 'Materials' },
  { id: 5, path: '/configure/hardware', name: 'Hardware' },
  { id: 6, path: '/configure/summary', name: 'Summary' },
];

/**
 * ConfiguratorFlow — redesigned layout.
 * Row 1: HorizontalStepper (sticky, 48px)
 * Row 2: PreviewPanel (78%) + ControlPanel (22%), fills remaining viewport
 * Row 3: Minimal bottom nav — Back | Total Price | Continue
 */
const ConfiguratorFlow = ({ activeConfigId, setActiveConfigId, onRefreshCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  const { addToast } = useToast();
  const { derived } = useConfig();
  const { isStepLocked, getLockReason, canNavigateTo } = useStepGuard();
  const { valuation } = derived;

  // Resolve current step from URL
  const currentPath = location.pathname;
  const currentStepObj = STEP_ROUTES.find((s) => s.path === currentPath);
  const currentStep = currentStepObj?.id || 1;

  // Redirect /configure → /configure/project
  useEffect(() => {
    if (currentPath === '/configure' || currentPath === '/configure/') {
      navigate('/configure/project', { replace: true });
    }
  }, [currentPath, navigate]);

  const navigateToStep = useCallback(
    (stepId) => {
      if (!canNavigateTo(stepId)) {
        addToast(getLockReason(stepId), 'warning');
        return;
      }
      const route = STEP_ROUTES.find((s) => s.id === stepId);
      if (route) navigate(route.path);
    },
    [navigate, canNavigateTo, getLockReason, addToast]
  );

  const handleNext = useCallback(() => {
    if (currentStep < 6 && canNavigateTo(currentStep + 1)) {
      navigateToStep(currentStep + 1);
    } else if (currentStep < 6) {
      addToast(getLockReason(currentStep + 1), 'warning');
    }
  }, [currentStep, canNavigateTo, navigateToStep, getLockReason, addToast]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) navigateToStep(currentStep - 1);
  }, [currentStep, navigateToStep]);

  // Render the active step's control panel content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepProject />;
      case 2:
        return <StepDimensions />;
      case 3:
        return <StepModules />;
      case 4:
        return <StepMaterials />;
      case 5:
        return <StepHardware />;
      case 6:
        // Step 6 (Summary/BOQ) is rendered full-width directly in the layout — not here
        return null;
      default:
        return null;
    }
  };

  // ── Resizable split ratio for desktop (preview vs controls)
  // Declared here (before any early return) to satisfy Rules of Hooks
  const [splitPct, setSplitPct] = useState(72);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(82, Math.max(30, pct)));
    };
    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ── Mobile: full-screen stacked layout (preview on top, controls below)
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <HorizontalStepper currentStep={currentStep} onStepClick={navigateToStep} />

        {/* Preview — compact strip on mobile */}
        {currentStep !== 1 && (
          <div
            style={{
              height: 220,
              flexShrink: 0,
              padding: '10px 12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <PreviewPanel currentStep={currentStep} />
          </div>
        )}

        {/* Controls — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: 0 }}>
          <div key={currentStep} className="step-animate">
            {renderStepContent()}
          </div>
        </div>

        {/* Bottom nav */}
        <BottomNav
          currentStep={currentStep}
          totalPrice={valuation.total}
          onPrev={handlePrev}
          onNext={handleNext}
          isNextLocked={isStepLocked(currentStep + 1)}
          isMobile
        />
      </div>
    );
  }

  // ── Desktop: Step 6 (Summary) = full-width, Steps 2-5 = resizable split
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Sticky horizontal stepper */}
      <HorizontalStepper currentStep={currentStep} onStepClick={navigateToStep} />

      {/* ── Step 6: Summary — full-width, no preview panel ── */}
      {currentStep === 6 ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            padding: '24px 32px 100px',
            background: 'var(--bg-primary)',
            minHeight: 0,
            boxSizing: 'border-box',
          }}
        >
          <div key={currentStep} className="step-animate">
            <StepBOQ
              activeConfigId={activeConfigId}
              setActiveConfigId={setActiveConfigId}
              onRefreshCount={onRefreshCount}
            />
          </div>
        </div>
      ) : (
        /* ── Steps 1–5: resizable split-pane ── */
        <div
          ref={containerRef}
          style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden', height: 0 }}
        >
          {/* ── Preview Panel (left pane) — hidden on Step 1 */}
          {currentStep !== 1 && (
            <>
              <div
                style={{
                  flex: `0 0 ${splitPct}%`,
                  width: `${splitPct}%`,
                  padding: '16px',
                  background: 'var(--bg-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <PreviewPanel currentStep={currentStep} />
              </div>

              {/* ── Draggable Divider ── */}
              <div
                onMouseDown={onDividerMouseDown}
                title="Drag to resize"
                style={{
                  flexShrink: 0,
                  width: 6,
                  cursor: 'col-resize',
                  background: 'var(--border)',
                  position: 'relative',
                  zIndex: 10,
                  transition: 'background 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  if (!isDragging.current) e.currentTarget.style.background = 'var(--border)';
                }}
              >
                {/* Grip dots */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    pointerEvents: 'none',
                  }}
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 2,
                        height: 2,
                        borderRadius: '50%',
                        background: 'var(--text-muted)',
                        opacity: 0.6,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Control Panel (right pane) — full-width on Step 1 */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              borderLeft: currentStep === 1 ? 'none' : 'none',
              background: 'var(--bg-secondary)',
              overflowY: 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              height: '100%',
              padding: currentStep === 1 ? '0' : '16px 12px 80px',
              boxSizing: 'border-box',
            }}
          >
            <div
              key={currentStep}
              className="step-animate"
              style={currentStep === 1 ? { height: '100%' } : {}}
            >
              {renderStepContent()}
            </div>
          </div>
        </div>
      )}

      {/* Minimal floating bottom nav */}
      <BottomNav
        currentStep={currentStep}
        totalPrice={valuation.total}
        onPrev={handlePrev}
        onNext={handleNext}
        isNextLocked={isStepLocked(currentStep + 1)}
        getLockReason={getLockReason}
      />

      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-animate { animation: stepFadeIn 0.28s ease-out; }
      `}</style>
    </div>
  );
};

/* ── Minimal bottom nav bar ────────────────────────────────────────────────── */
const BottomNav = ({
  currentStep,
  totalPrice,
  onPrev,
  onNext,
  isNextLocked,
  getLockReason,
  isMobile,
}) => (
  <div
    className="no-print"
    style={{
      position: 'sticky',
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '10px 16px' : '10px 24px',
      height: 52,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(8px)',
      zIndex: 30,
      flexShrink: 0,
      gap: 12,
    }}
  >
    {/* Back */}
    <button
      onClick={onPrev}
      disabled={currentStep === 1}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 16px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: currentStep === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
        fontSize: 13,
        fontWeight: 600,
        cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
        opacity: currentStep === 1 ? 0.45 : 1,
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        if (currentStep > 1) e.currentTarget.style.background = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <ChevronLeft size={14} /> Back
    </button>

    {/* Total price — center — only show from Step 3 onwards */}
    {currentStep >= 3 ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1.2,
          background: 'var(--bg-tertiary)',
          padding: '4px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: 'var(--text-muted)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Total Config
        </span>
        <span
          key={totalPrice}
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            animation: 'priceUpdate 0.4s ease',
          }}
        >
          ₹{(totalPrice || 0).toLocaleString()}
        </span>
        <style>{`@keyframes priceUpdate { 0% { transform: scale(1.08); color: var(--accent); } 100% { transform: scale(1); color: var(--text-primary); } }`}</style>
      </div>
    ) : (
      <div style={{ flex: 1 }} />
    )}

    {/* Continue */}
    <button
      onClick={onNext}
      disabled={currentStep === 6 || isNextLocked}
      title={
        isNextLocked && getLockReason
          ? getLockReason(currentStep + 1)
          : currentStep === 6
            ? 'You are on the final step'
            : 'Continue to next step'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 20px',
        borderRadius: 8,
        border: 'none',
        background: currentStep === 6 || isNextLocked ? 'var(--bg-tertiary)' : 'var(--accent)',
        color: currentStep === 6 || isNextLocked ? 'var(--text-muted)' : 'white',
        fontSize: 13,
        fontWeight: 700,
        cursor: currentStep === 6 || isNextLocked ? 'not-allowed' : 'pointer',
        opacity: currentStep === 6 || isNextLocked ? 0.5 : 1,
        fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
        boxShadow: currentStep < 6 && !isNextLocked ? 'var(--shadow-sm)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (currentStep < 6 && !isNextLocked)
          e.currentTarget.style.background = 'var(--accent-dark, #1d4ed8)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          currentStep === 6 || isNextLocked ? 'var(--bg-tertiary)' : 'var(--accent)';
      }}
    >
      {currentStep === 6 ? 'Complete' : 'Continue'}
      {currentStep < 6 && <ChevronRight size={14} />}
    </button>
  </div>
);

export default ConfiguratorFlow;

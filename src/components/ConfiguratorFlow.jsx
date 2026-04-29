import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import StepIndicator from './StepIndicator';
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
 * ConfiguratorFlow Component
 * Handles 5-step linear flow with navigation guards and controls.
 * Routes users through the configurator steps with Continue/Back buttons.
 */
const ConfiguratorFlow = ({ activeConfigId, setActiveConfigId, onRefreshCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  const { addToast } = useToast();
  const { config, derived } = useConfig();
  const { isStepLocked, getLockReason, canNavigateTo } = useStepGuard();

  // Determine current step from URL
  const currentPath = location.pathname;
  const currentStepObj = STEP_ROUTES.find((s) => s.path === currentPath);
  const currentStep = currentStepObj?.id || 1;

  // Redirect from /configure to /configure/project
  useEffect(() => {
    if (currentPath === '/configure' || currentPath === '/configure/') {
      navigate('/configure/project', { replace: true });
    }
  }, [currentPath, navigate]);

  // Navigate to step with guard checks
  const navigateToStep = useCallback(
    (stepId) => {
      if (!canNavigateTo(stepId)) {
        addToast(getLockReason(stepId), 'warning');
        return;
      }
      const route = STEP_ROUTES.find((s) => s.id === stepId);
      if (route) {
        navigate(route.path);
      }
    },
    [navigate, canNavigateTo, getLockReason, addToast]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep < 6 && canNavigateTo(currentStep + 1)) {
      navigateToStep(currentStep + 1);
    } else if (currentStep < 6) {
      addToast(getLockReason(currentStep + 1), 'warning');
    }
  }, [currentStep, canNavigateTo, navigateToStep, getLockReason, addToast]);

  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      navigateToStep(currentStep - 1);
    }
  }, [currentStep, navigateToStep]);

  // Render current step content
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
        return (
          <StepBOQ
            activeConfigId={activeConfigId}
            setActiveConfigId={setActiveConfigId}
            onRefreshCount={onRefreshCount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.35s ease-out;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Step Indicator (moved to sidebar) */}

        {/* 2-Column Layout: Content + Preview */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 0,
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* LEFT: Step Content (Scrollable) */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: isMobile ? '16px' : '32px 40px',
              borderRight: !isMobile ? '1px solid var(--border)' : 'none',
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <div
              style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}
              className="animate-fade-in"
            >
              {renderStepContent()}
            </div>
          </div>

          {/* RIGHT: Preview Panel (Desktop Only) — fixed height, no sticky wrapper */}
          {!isMobile && (
            <div
              style={{
                width: '35%',
                minWidth: 320,
                maxWidth: 450,
                padding: '20px 16px',
                background: 'var(--bg-primary)',
                borderLeft: '1px solid var(--border)',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* PreviewPanel fills the entire column height */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <PreviewPanel currentStep={currentStep} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div
          style={{
            padding: isMobile ? '12px 16px' : '20px 40px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}
          className="no-print"
        >
          {/* Back Button */}
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: isMobile ? '12px 20px' : '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: currentStep === 1 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: currentStep === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              fontSize: isMobile ? 14 : 13,
              fontWeight: 600,
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              opacity: currentStep === 1 ? 0.5 : 1,
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (currentStep > 1) e.currentTarget.style.background = 'var(--accent-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
            }}
          >
            <ChevronLeft size={14} />
            Back
          </button>

          {/* Step Info */}
          <div style={{ textAlign: 'center', flex: 1 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-secondary)',
              }}
            >
              Step {currentStep} of 6
            </span>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleNext}
            disabled={currentStep === 6 || isStepLocked(currentStep + 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: isMobile ? '12px 24px' : '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: currentStep === 6 ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: currentStep === 6 ? 'var(--text-tertiary)' : 'white',
              fontSize: isMobile ? 14 : 13,
              fontWeight: 700,
              cursor: currentStep === 6 ? 'default' : 'pointer',
              transition: 'all 0.15s',
              opacity: currentStep === 6 || isStepLocked(currentStep + 1) ? 0.5 : 1,
              boxShadow: 'var(--shadow-sm)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (currentStep < 6 && !isStepLocked(currentStep + 1)) {
                e.currentTarget.style.background = 'var(--accent-dark)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
            title={
              isStepLocked(currentStep + 1)
                ? getLockReason(currentStep + 1)
                : currentStep === 6
                  ? 'You are on the final step'
                  : 'Continue to next step'
            }
          >
            {currentStep === 6 ? 'Complete' : 'Continue'}
            {currentStep < 6 && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfiguratorFlow;

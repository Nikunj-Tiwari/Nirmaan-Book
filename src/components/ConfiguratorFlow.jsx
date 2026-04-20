import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import StepIndicator from './StepIndicator';
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
  { id: 1, path: '/configure/dimensions', name: 'Dimensions' },
  { id: 2, path: '/configure/modules', name: 'Modules' },
  { id: 3, path: '/configure/materials', name: 'Materials' },
  { id: 4, path: '/configure/hardware', name: 'Hardware' },
  { id: 5, path: '/configure/summary', name: 'Summary' },
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

  // Redirect from /configure to /configure/dimensions
  useEffect(() => {
    if (currentPath === '/configure' || currentPath === '/configure/') {
      navigate('/configure/dimensions', { replace: true });
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
    if (currentStep < 5 && canNavigateTo(currentStep + 1)) {
      navigateToStep(currentStep + 1);
    } else if (currentStep < 5) {
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
        return <StepDimensions />;
      case 2:
        return <StepModules />;
      case 3:
        return <StepMaterials />;
      case 4:
        return <StepHardware />;
      case 5:
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
        {/* Step Indicator */}
        {!isMobile && (
          <StepIndicator currentStep={currentStep} totalSteps={5} onStepClick={navigateToStep} />
        )}

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

          {/* RIGHT: Preview Panel (Sticky, Desktop Only) */}
          {!isMobile && (
            <div
              style={{
                width: '35%',
                minWidth: 320,
                maxWidth: 450,
                padding: '24px 20px',
                overflowY: 'auto',
                overflowX: 'hidden',
                background: 'var(--bg-primary)',
                borderLeft: '1px solid var(--border)',
                minHeight: 0,
                flexShrink: 0,
              }}
            >
              <div style={{ position: 'sticky', top: 20 }}>
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
              padding: '10px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: currentStep === 1 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
              color: currentStep === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
              fontSize: 13,
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
              Step {currentStep} of 5
            </span>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleNext}
            disabled={currentStep === 5 || isStepLocked(currentStep + 1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: currentStep === 5 ? 'var(--bg-tertiary)' : 'var(--accent)',
              color: currentStep === 5 ? 'var(--text-tertiary)' : 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: currentStep === 5 ? 'default' : 'pointer',
              transition: 'all 0.15s',
              opacity: currentStep === 5 || isStepLocked(currentStep + 1) ? 0.5 : 1,
              boxShadow: 'var(--shadow-sm)',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              if (currentStep < 5 && !isStepLocked(currentStep + 1)) {
                e.currentTarget.style.background = 'var(--accent-dark)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
            }}
            title={
              isStepLocked(currentStep + 1)
                ? getLockReason(currentStep + 1)
                : currentStep === 5
                  ? 'You are on the final step'
                  : 'Continue to next step'
            }
          >
            {currentStep === 5 ? 'Complete' : 'Continue'}
            {currentStep < 5 && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfiguratorFlow;

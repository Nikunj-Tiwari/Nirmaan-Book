import React from 'react';
import { Check, Lock } from 'lucide-react';
import { useStepGuard } from '../hooks/useStepGuard';

/**
 * StepIndicator Component
 * Shows 5-step progress with visual status: completed, active, pending, or locked
 */
const StepIndicator = ({ currentStep = 1, totalSteps = 5, onStepClick }) => {
  const { isStepLocked } = useStepGuard();

  const STEP_LABELS = ['Dimensions', 'Modules', 'Materials', 'Hardware', 'Summary'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const isLocked = isStepLocked(stepNum);

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {/* Step Circle */}
            <button
              onClick={() => onStepClick && !isLocked && onStepClick(stepNum)}
              disabled={isLocked}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                background: isDone
                  ? '#22c55e'
                  : isActive
                    ? '#3b82f6'
                    : isLocked
                      ? '#f3f4f6'
                      : '#e5e7eb',
                color: isDone || isActive ? '#ffffff' : isLocked ? '#9ca3af' : '#6b7280',
                transition: 'all 0.2s ease',
                border: isActive ? '2px solid #2563eb' : 'none',
                cursor: isLocked ? 'not-allowed' : isActive ? 'default' : 'pointer',
                fontFamily: 'var(--font-sans)',
                padding: 0,
              }}
              title={isLocked ? 'Complete previous steps first' : label}
            >
              {isLocked ? <Lock size={14} /> : isDone ? <Check size={14} /> : stepNum}
            </button>

            {/* Step Label */}
            <span
              className="step-label"
              style={{
                fontSize: 12,
                fontWeight: 500,
                marginLeft: 6,
                marginRight: 12,
                whiteSpace: 'nowrap',
                color: isActive ? '#3b82f6' : isDone ? '#22c55e' : '#9ca3af',
              }}
            >
              {label}
            </span>

            {/* Separator */}
            {stepNum < totalSteps && (
              <div
                className="step-separator"
                style={{
                  width: 24,
                  height: 1,
                  background: isDone ? '#22c55e' : '#e5e7eb',
                  margin: '0 8px',
                }}
              />
            )}
          </div>
        );
      })}
      <style>{`
        .step-label, .step-separator {
          display: none;
        }
        @media (min-width: 768px) {
          .step-label {
            display: inline;
          }
          .step-separator {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default StepIndicator;

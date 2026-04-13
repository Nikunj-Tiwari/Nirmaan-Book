import React from 'react';

/**
 * StepIndicator Component
 * Clean, minimal step progress indicator
 */
const StepIndicator = ({ currentStep = 1, totalSteps = 3 }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {['Dimensions', 'Customization', 'Summary'].map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Step Circle */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                background: isDone ? '#22c55e' : isActive ? '#3b82f6' : '#e5e7eb',
                color: isDone || isActive ? '#ffffff' : '#6b7280',
                transition: 'all 0.2s ease',
              }}
            >
              {isDone ? '✓' : stepNum}
            </div>

            {/* Step Label */}
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#3b82f6' : isDone ? '#22c55e' : '#9ca3af',
                display: 'none',
                '@media (min-width: 768px)': {
                  display: 'inline',
                },
              }}
            >
              {label}
            </span>

            {/* Separator */}
            {stepNum < totalSteps && (
              <div
                style={{
                  width: 24,
                  height: 1,
                  background: isDone ? '#22c55e' : '#e5e7eb',
                  margin: '0 8px',
                  display: 'none',
                  '@media (min-width: 768px)': {
                    display: 'block',
                  },
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;

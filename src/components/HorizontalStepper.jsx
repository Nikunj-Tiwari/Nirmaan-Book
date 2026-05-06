import React from 'react';
import { Check } from 'lucide-react';
import { useStepGuard } from '../hooks/useStepGuard';

const STEP_DEFS = [
  { id: 1, label: 'Project Info', short: 'Project' },
  { id: 2, label: 'Dimensions', short: 'Dims' },
  { id: 3, label: 'Modules', short: 'Modules' },
  { id: 4, label: 'Materials', short: 'Materials' },
  { id: 5, label: 'Hardware', short: 'Hardware' },
  { id: 6, label: 'Summary', short: 'Summary' },
];

/**
 * HorizontalStepper — replaces the left sidebar nav.
 * Pinned to the top of the configurator shell (below the app header).
 * States: completed (green check), active (accent), upcoming (outlined/dimmed).
 */
const HorizontalStepper = ({ currentStep = 1, onStepClick }) => {
  const { isStepLocked, canNavigateTo } = useStepGuard();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        gap: 0,
        flexShrink: 0,
      }}
    >
      {STEP_DEFS.map((step, idx) => {
        const isDone = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isLocked = isStepLocked(step.id);
        const clickable = isDone || (isActive && step.id > 1);

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Step node */}
            <button
              onClick={() => clickable && canNavigateTo(step.id) && onStepClick?.(step.id)}
              disabled={!clickable}
              title={step.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 8px',
                borderRadius: 99,
                border: isActive
                  ? '1px solid var(--accent-border)'
                  : isDone
                    ? '1px solid rgba(69, 196, 124, 0.3)'
                    : '1px solid var(--border)',
                background: isActive
                  ? 'var(--bg-tertiary)'
                  : isDone
                    ? 'rgba(69, 196, 124, 0.05)'
                    : 'transparent',
                cursor: clickable ? 'pointer' : 'default',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.18s',
                outline: 'none',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (clickable) e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isActive
                    ? 'linear-gradient(135deg, #C58B4E, #9B6735)'
                    : isDone
                      ? 'var(--success)'
                      : 'var(--bg-tertiary)',
                  color: isActive || isDone ? '#fff' : 'var(--text-muted)',
                  boxShadow: isActive
                    ? '0 0 12px rgba(197, 139, 78, 0.5)'
                    : isDone
                      ? '0 0 12px rgba(69, 196, 124, 0.4)'
                      : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {isDone ? <Check size={11} strokeWidth={3} /> : step.id}
              </span>

              {/* Label — hide on small screens via class */}
              <span
                className="stepper-label"
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--accent)' : isDone ? '#22c55e' : 'var(--text-muted)',
                }}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {idx < STEP_DEFS.length - 1 && (
              <div
                style={{
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  background: isDone ? '#22c55e' : 'var(--border)',
                  margin: '0 4px',
                  flexShrink: 0,
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Responsive: hide labels on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .stepper-label { display: none; }
        }
      `}</style>
    </div>
  );
};

export default HorizontalStepper;

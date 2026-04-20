import React, { useState } from 'react';
import { X, Layers, Check, FileText } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStepGuard } from '../hooks/useStepGuard';

export const MobileSidebar = ({
  isOpen,
  onClose,
  valuation,
  totalModules,
  config,
  derived,
  user,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canNavigateTo } = useStepGuard();

  const STEP_ROUTES = [
    { id: 1, path: '/configure/dimensions', title: 'Dimensions' },
    { id: 2, path: '/configure/modules', title: 'Modules' },
    { id: 3, path: '/configure/materials', title: 'Materials' },
    { id: 4, path: '/configure/hardware', title: 'Hardware' },
    { id: 5, path: '/configure/summary', title: 'Summary' },
  ];

  // Derive current step from URL
  const currentStep = STEP_ROUTES.find((s) => s.path === location.pathname)?.id || 1;

  const goToStep = (stepId) => {
    const route = STEP_ROUTES.find((s) => s.id === stepId);
    if (route) {
      navigate(route.path);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 110,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 320,
          background: 'var(--bg-secondary)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isOpen ? '-4px 0 20px rgba(0, 0, 0, 0.15)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          animation: isOpen ? 'slideInRight 0.3s ease' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Configuration
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Step Navigation */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 12,
                letterSpacing: '0.05em',
              }}
            >
              Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STEP_ROUTES.map((step) => {
                const isLocked = !canNavigateTo(step.id);
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => !isLocked && goToStep(step.id)}
                    style={{
                      padding: '10px 12px',
                      background: isActive ? 'var(--accent-light)' : 'var(--bg-primary)',
                      border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 8,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.35 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLocked) {
                        e.currentTarget.style.borderColor = 'var(--accent-border)';
                      }
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
                        border: `2px solid ${isActive || isDone ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: isActive || isDone ? 'var(--accent)' : 'transparent',
                        color: isActive || isDone ? 'white' : 'var(--text-secondary)',
                      }}
                    >
                      {isDone ? <Check size={10} strokeWidth={3} /> : step.id}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                        flex: 1,
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Summary */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 12,
                letterSpacing: '0.05em',
              }}
            >
              Summary
            </div>
            <div
              style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 8,
                padding: '12px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
                  marginBottom: 8,
                }}
              >
                ₹{valuation.total.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--accent)',
                  fontWeight: 600,
                }}
              >
                {totalModules} module{totalModules !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>

          {/* Width Indicator */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 12,
                letterSpacing: '0.05em',
              }}
            >
              Width Usage
            </div>
            <div
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                <span>Used</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {derived.validation.usedWidth} / {config.width} mm
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min((derived.validation.usedWidth / config.width) * 100, 100)}%`,
                    background: derived.validation.isValid ? 'var(--accent)' : 'var(--danger)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {Math.min((derived.validation.usedWidth / config.width) * 100, 100).toFixed(0)}%
                used
              </div>
            </div>
          </div>

          {/* Catalogue Link */}
          <a
            href="/Wardrobe Catalogue_Nirmanbook.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              textDecoration: 'none',
              transition: 'all 0.15s',
              marginBottom: 12,
              color: 'var(--text-primary)',
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
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-primary)',
              }}
            >
              Product Catalogue
            </div>
          </a>
        </div>

        {/* Footer - User Info */}
        {user && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
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
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {user.name.split(' ')[0]}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}
              >
                Pro Account
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default MobileSidebar;

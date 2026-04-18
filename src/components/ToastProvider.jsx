import React, { useState, useCallback, useRef } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

/**
 * Toast Context & Hook for global feedback
 */
const ToastContext = React.createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    const id = idRef.current++;
    const toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Individual Toast Component
 */
const Toast = ({ id, message, type, onRemove }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'info':
        return <Info size={18} />;
      default:
        return null;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#f0fdf4',
          border: '#dcfce7',
          text: '#166534',
          icon: '#22c55e',
        };
      case 'error':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#991b1b',
          icon: '#ef4444',
        };
      case 'info':
        return {
          bg: '#eff6ff',
          border: '#bfdbfe',
          text: '#1e40af',
          icon: '#3b82f6',
        };
      default:
        return {
          bg: '#f3f4f6',
          border: '#d1d5db',
          text: '#374151',
          icon: '#6b7280',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      style={{
        animation: 'slideIn 0.3s ease-out',
        marginBottom: 12,
        padding: '12px 16px',
        borderRadius: 8,
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: styles.text,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transform: 'translateX(0)',
        opacity: 1,
      }}
    >
      <div style={{ color: styles.icon, flexShrink: 0 }}>{getIcon()}</div>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => onRemove(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: styles.text,
          opacity: 0.6,
          padding: 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 767px) {
          .toast-container {
            bottom: 110px !important;
            right: 16px !important;
            left: 16px !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastProvider;

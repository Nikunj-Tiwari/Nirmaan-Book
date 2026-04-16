import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';

/**
 * SaveDesignModal
 * Props:
 *   mode: 'save' | 'update'
 *   initialName: string (prefilled for update)
 *   existingNames: string[] (for duplicate detection)
 *   onConfirm(name: string): void
 *   onClose(): void
 */
const SaveDesignModal = ({
  mode = 'save',
  initialName = '',
  existingNames = [],
  onConfirm,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  };

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a project name.');
      return;
    }
    const isDuplicate =
      mode === 'save' && existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setError('A design with this name already exists.');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1100,
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'save' ? 'Save Design' : 'Update Design Name'}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1101,
          width: 420,
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '28px 28px 24px',
          boxShadow: '0 24px 72px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          animation: 'modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {mode === 'save' ? 'Save Design' : 'Rename Design'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {mode === 'save'
                ? 'Give your configuration a name to find it later.'
                : 'Update the name of this saved design.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Input */}
        <div>
          <label
            htmlFor="design-name-input"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: 8,
              letterSpacing: '0.02em',
            }}
          >
            PROJECT NAME
          </label>
          <input
            id="design-name-input"
            ref={inputRef}
            type="text"
            value={name}
            maxLength={60}
            placeholder="e.g. Master Bedroom Wardrobe"
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              if (!error) e.target.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              if (!error) e.target.style.borderColor = 'var(--border)';
            }}
          />
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>{error}</p>}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            {mode === 'save' ? <Save size={14} /> : <RefreshCw size={14} />}
            {mode === 'save' ? 'Save Design' : 'Rename'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
};

export default SaveDesignModal;

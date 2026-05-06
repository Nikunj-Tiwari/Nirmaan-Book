import React, { useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import Viewer3D from './Viewer3D';
import FullscreenToolbar from './FullscreenToolbar';
import { useConfig } from '../store/ConfigContext';
import { drawBlueprintLight } from '../utils/visuals';

/**
 * FullscreenPreviewModal
 * Fullscreen 2-panel view: adjustable viewer (left) + live-edit toolbar (right).
 */
const FullscreenPreviewModal = ({ currentStep, viewMode, setViewMode, onClose }) => {
  const { config, derived } = useConfig();
  const { totalModules, modulesList } = derived;

  const canvasRef = useRef(null);
  const containerRef = useRef(null); // main flex container
  const viewerRef = useRef(null); // left viewer area

  const [toolbarWidth, setToolbarWidth] = React.useState(380);
  const [isDragging, setIsDragging] = React.useState(false);

  // ── Responsive canvas drawing ──────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const viewer = viewerRef.current;
    if (!canvas || !viewer || viewMode !== '2d') return;

    const dpr = window.devicePixelRatio || 1;
    const rect = viewer.getBoundingClientRect();
    const cw = Math.floor(rect.width);
    const ch = Math.floor(rect.height);
    if (cw < 1 || ch < 1) return;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    drawBlueprintLight(ctx, cw, ch, config, modulesList);
  }, [viewMode, config, modulesList]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on viewer area resize (also fires when toolbar is dragged)
  useEffect(() => {
    if (viewMode !== '2d') return;
    const el = viewerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, draw]);

  // ── Divider drag logic ─────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const minW = 280;
      const maxW = rect.width * 0.55;
      if (newWidth >= minW && newWidth <= maxW) setToolbarWidth(newWidth);
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ── Keyboard: Escape closes ───────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.97)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top chrome bar ───────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(21,18,15,0.8)',
          backdropFilter: 'blur(16px)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#C58B4E',
              boxShadow: '0 0 8px rgba(197,139,78,0.6)',
            }}
          />
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Fullscreen Preview
          </h2>
          {totalModules > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {totalModules} module{totalModules !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* 2D / 3D toggle */}
          <div
            style={{
              display: 'flex',
              gap: 3,
              background: 'rgba(255,255,255,0.07)',
              padding: 4,
              borderRadius: 9,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {[
              { id: '2d', label: '2D Blueprint' },
              { id: '3d', label: '3D Model' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: 'none',
                  background: viewMode === m.id ? '#C58B4E' : 'transparent',
                  color: viewMode === m.id ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close fullscreen (Esc)"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Body: Viewer + Toolbar ───────────────────────────────────── */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: viewer */}
        <div
          ref={viewerRef}
          style={{
            flex: 1,
            overflow: 'hidden',
            background:
              viewMode === '2d'
                ? 'var(--bg-primary)'
                : 'radial-gradient(circle at center, #211C17 0%, #0F0D0B 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {viewMode === '2d' ? (
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              {totalModules > 0 ? (
                <Viewer3D
                  modules={modulesList || []}
                  material={config.colour}
                  roomWidth={config.width}
                  roomHeight={config.height}
                  roomDepth={config.depth}
                  wallType={config.wallType}
                  width2={config.width2}
                  width3={config.width3}
                  darkMode={true}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 12,
                    color: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <div style={{ fontSize: 40 }}>📦</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    Add modules to see the 3D model
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drag divider */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 5,
            background: isDragging ? 'rgba(197,139,78,0.7)' : 'rgba(255,255,255,0.07)',
            cursor: 'col-resize',
            transition: isDragging ? 'none' : 'background 0.2s',
            flexShrink: 0,
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) e.currentTarget.style.background = 'rgba(197,139,78,0.4)';
          }}
          onMouseLeave={(e) => {
            if (!isDragging) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
          }}
        >
          {/* Centre grip dots */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              pointerEvents: 'none',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: toolbar */}
        <div
          style={{
            width: toolbarWidth,
            minWidth: 280,
            maxWidth: '55%',
            background: 'rgba(15,13,11,0.85)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FullscreenToolbar
              currentStep={currentStep}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onClose={onClose}
            />
          </div>

          {/* Close at bottom of toolbar */}
          <div
            style={{
              padding: 16,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.08)',
                color: 'rgba(239,68,68,0.85)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
            >
              ← Exit Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPreviewModal;

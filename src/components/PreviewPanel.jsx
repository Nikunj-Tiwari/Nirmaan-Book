import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import { useConfig } from '../store/ConfigContext';
import FullscreenPreviewModal from './FullscreenPreviewModal';
import Viewer3D from './Viewer3D';
import { drawBlueprintLight } from '../utils/visuals';

/**
 * PreviewPanel
 * Persistent sidebar preview — 2D blueprint or interactive 3D model.
 * Switches between views with a pill toggle. Supports fullscreen modal.
 */
const PreviewPanel = ({ currentStep }) => {
  const { config, derived } = useConfig();
  const [viewMode, setViewMode] = useState('2d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const { totalModules, modulesList } = derived;

  // ── Responsive canvas: match container size & redraw on resize ───────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || viewMode !== '2d') return;

    // Match canvas resolution to container (handles HiDPI)
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
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

  // Redraw on config / mode change
  useEffect(() => {
    draw();
  }, [draw]);

  // Redraw on container resize
  useEffect(() => {
    if (viewMode !== '2d') return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [viewMode, draw]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        boxSizing: 'border-box',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Preview Content with Floating Controls ──────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 10,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          position: 'relative',
          background:
            viewMode === '2d'
              ? 'var(--bg-primary)'
              : 'radial-gradient(circle at center, #211C17 0%, #0F0D0B 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Floating Controls */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: viewMode === '3d' ? '#F3EEE7' : 'var(--text-primary)',
              margin: 0,
              textShadow: viewMode === '3d' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            Live Preview
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Pill toggle */}
            <div
              style={{
                display: 'flex',
                background: viewMode === '3d' ? 'rgba(0,0,0,0.4)' : 'var(--bg-tertiary)',
                borderRadius: 8,
                padding: 3,
                border:
                  viewMode === '3d'
                    ? '1px solid rgba(197, 139, 78, 0.2)'
                    : '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
                gap: 3,
              }}
            >
              {[
                { id: '2d', label: '2D', title: 'Blueprint view' },
                { id: '3d', label: '3D', title: 'Interactive 3D model' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id)}
                  title={m.title}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: viewMode === m.id ? 'var(--accent)' : 'transparent',
                    color:
                      viewMode === m.id
                        ? '#fff'
                        : viewMode === '3d'
                          ? 'rgba(255,255,255,0.6)'
                          : 'var(--text-secondary)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                    letterSpacing: '0.04em',
                    boxShadow: viewMode === m.id ? '0 2px 8px rgba(197, 139, 78, 0.4)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Fullscreen button */}
            <button
              onClick={() => setIsFullscreen(true)}
              title="Fullscreen preview mode"
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border:
                  viewMode === '3d'
                    ? '1px solid rgba(197, 139, 78, 0.2)'
                    : '1px solid var(--border)',
                background: viewMode === '3d' ? 'rgba(0,0,0,0.4)' : 'var(--bg-tertiary)',
                backdropFilter: 'blur(8px)',
                color: viewMode === '3d' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  viewMode === '3d' ? 'rgba(0,0,0,0.4)' : 'var(--bg-tertiary)';
                e.currentTarget.style.color =
                  viewMode === '3d' ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)';
              }}
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {viewMode === '2d' ? (
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'block',
            }}
          />
        ) : (
          <Viewer3D
            modules={modulesList}
            material={config.colour}
            roomWidth={config.width}
            roomHeight={config.height}
            roomDepth={config.depth}
            wallType={config.wallType}
            width2={config.width2}
            width3={config.width3}
            darkMode={true}
          />
        )}
      </div>

      {/* ── Footer info strip ─────────────────────────────────────────── */}
      {totalModules > 0 && (
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--bg-primary)',
            borderRadius: 7,
            border: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalModules} module{totalModules !== 1 ? 's' : ''}
            </span>
            {' selected'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              fontWeight: 500,
              textAlign: 'right',
            }}
          >
            {config.material?.name} · {config.colour?.name}
          </div>
        </div>
      )}

      {/* ── Fullscreen Modal ──────────────────────────────────────────── */}
      {isFullscreen && (
        <FullscreenPreviewModal
          currentStep={currentStep}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
};

export default PreviewPanel;

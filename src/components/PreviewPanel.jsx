import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Box } from 'lucide-react';
import { useConfig } from '../store/ConfigContext';
import FullscreenPreviewModal from './FullscreenPreviewModal';

/**
 * PreviewPanel Component
 * Persistent preview showing 2D blueprint or 3D model
 * Updates in real-time based on configuration changes
 */
const PreviewPanel = ({ currentStep }) => {
  const { config, derived } = useConfig();
  const [viewMode, setViewMode] = useState('2d'); // '2d' or '3d'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);
  const { totalModules } = derived;

  // Draw 2D blueprint
  useEffect(() => {
    if (viewMode !== '2d' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, cw, ch);

    // Grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < cw; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    // If no modules, show empty state
    if (totalModules === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '500 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add modules to preview', cw / 2, ch / 2 - 10);
      ctx.font = '400 11px Inter, sans-serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText('(dimensions visible after selection)', cw / 2, ch / 2 + 10);
      return;
    }

    // Draw simple cabinet outline
    const padding = 30;
    const scale = 0.5; // Scale down for preview
    const width = Math.min(config.width * scale, cw - padding * 2);
    const height = Math.min(config.height * scale, ch - padding * 2);
    const x = (cw - width) / 2;
    const y = (ch - height) / 2;

    // Cabinet body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Module slots indicator
    if (Object.values(config.modules).some((qty) => qty > 0)) {
      ctx.fillStyle = '#dbeafe';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#3b82f6';
      ctx.textAlign = 'center';
      ctx.fillText(`${totalModules} module${totalModules !== 1 ? 's' : ''}`, cw / 2, y - 10);
    }

    // Dimensions label
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${config.width}W × ${config.height}H mm`, cw / 2, ch - 12);
  }, [viewMode, config, totalModules]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Header */}
      <div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 12,
          }}
        >
          Live Preview
        </h3>

        {/* View Toggle + Fullscreen */}
        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              gap: 6,
              background: 'var(--bg-tertiary)',
              padding: 4,
              borderRadius: 8,
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setViewMode('2d')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === '2d' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === '2d' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                boxShadow: viewMode === '2d' ? 'var(--shadow-xs)' : 'none',
              }}
              title="2D Blueprint View"
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === '3d' ? 'var(--bg-secondary)' : 'transparent',
                color: viewMode === '3d' ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
                boxShadow: viewMode === '3d' ? 'var(--shadow-xs)' : 'none',
              }}
              title="3D Model View"
            >
              3D
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-sans)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-primary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Fullscreen preview mode"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div style={{ flex: 1, minHeight: 300, display: 'flex', flexDirection: 'column' }}>
        {viewMode === '2d' ? (
          <canvas
            ref={canvasRef}
            width={320}
            height={380}
            style={{
              background: 'white',
              borderRadius: 8,
              border: '1px solid var(--border)',
              flex: 1,
              maxWidth: '100%',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              flex: 1,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#1a1a1a',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {totalModules > 0 ? (
              <div style={{ width: '100%', height: '100%' }} id="preview-3d-container">
                {/* Will be populated by FullscreenPreviewModal */}
              </div>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  color: '#9ca3af',
                  textAlign: 'center',
                  padding: 16,
                }}
              >
                <Box size={32} opacity={0.5} />
                <div style={{ fontSize: 13, fontWeight: 500 }}>Add modules to preview</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Footer */}
      {totalModules > 0 && (
        <div
          style={{
            padding: 12,
            background: 'var(--bg-primary)',
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {totalModules} module{totalModules !== 1 ? 's' : ''}
            </span>
            {' selected'}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            {config.material.name} • {config.colour.name}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
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

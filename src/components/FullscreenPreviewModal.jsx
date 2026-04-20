import React from 'react';
import { X } from 'lucide-react';
import Viewer3D from './Viewer3D';
import FullscreenToolbar from './FullscreenToolbar';
import { useConfig } from '../store/ConfigContext';

/**
 * FullscreenPreviewModal
 * Fullscreen view with 70% viewer + 30% toolbar for live editing
 */
const FullscreenPreviewModal = ({ currentStep, viewMode, setViewMode, onClose }) => {
  const { config, derived } = useConfig();
  const { totalModules } = derived;
  const canvasRef = React.useRef(null);

  // Draw 2D blueprint for fullscreen
  React.useEffect(() => {
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
    const gridSize = 32;
    for (let x = 0; x < cw; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    if (totalModules === 0) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add modules to preview', cw / 2, ch / 2 - 20);
      ctx.font = '400 14px Inter, sans-serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText('(dimensions visible after module selection)', cw / 2, ch / 2 + 20);
      return;
    }

    // Draw cabinet
    const padding = 60;
    const scale = 1.2;
    const width = Math.min(config.width * scale, cw - padding * 2);
    const height = Math.min(config.height * scale, ch - padding * 2);
    const x = (cw - width) / 2;
    const y = (ch - height) / 2;

    // Cabinet body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Module count
    if (Object.values(config.modules).some((qty) => qty > 0)) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${totalModules} module${totalModules !== 1 ? 's' : ''}`, cw / 2, y - 20);
    }

    // Dimensions
    ctx.fillStyle = '#6b7280';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${config.width}W × ${config.height}H × ${config.depth}D mm`, cw / 2, ch - 20);
  }, [viewMode, config, totalModules]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'white',
            margin: 0,
          }}
        >
          Live Preview Editor
        </h2>

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'rgba(255, 255, 255, 0.1)',
              padding: 4,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <button
              onClick={() => setViewMode('2d')}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === '2d' ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                color: viewMode === '2d' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3d')}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === '3d' ? 'rgba(59, 130, 246, 0.9)' : 'transparent',
                color: viewMode === '3d' ? 'white' : 'rgba(255, 255, 255, 0.6)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              3D
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            title="Close fullscreen"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Content: 70% Viewer + 30% Toolbar */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          gap: 0,
        }}
      >
        {/* LEFT: 70% - Viewer */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {viewMode === '2d' ? (
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%' }}>
              {totalModules > 0 ? (
                <Viewer3D />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 18,
                    textAlign: 'center',
                  }}
                >
                  <div>Add modules to view 3D model</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: 30% - Toolbar */}
        <div
          style={{
            width: '30%',
            minWidth: 320,
            maxWidth: 400,
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.7)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FullscreenToolbar currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
};

export default FullscreenPreviewModal;

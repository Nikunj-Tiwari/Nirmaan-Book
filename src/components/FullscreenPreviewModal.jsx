import React from 'react';
import { X, GripVertical } from 'lucide-react';
import Viewer3D from './Viewer3D';
import FullscreenToolbar from './FullscreenToolbar';
import { useConfig } from '../store/ConfigContext';

/**
 * FullscreenPreviewModal
 * Fullscreen view with adjustable viewer + toolbar for live editing
 */
const FullscreenPreviewModal = ({ currentStep, viewMode, setViewMode, onClose }) => {
  const { config, derived } = useConfig();
  const { totalModules, modulesList } = derived;
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);

  // State for resizable toolbar width
  const [toolbarWidth, setToolbarWidth] = React.useState(380);
  const [isDragging, setIsDragging] = React.useState(false);

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
    // Draw cabinet skeleton
    const padding = 60;
    const scale = 1.2;
    const width = Math.min(config.width * scale, cw - padding * 2);
    const height = Math.min(config.height * scale, ch - padding * 2);
    const x = (cw - width) / 2;
    const y = (ch - height) / 2;

    // Cabinet body
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Render individual modules internally
    if (modulesList && modulesList.length > 0) {
      const totalW = modulesList.reduce((sum, m) => sum + m.width, 0);
      const scaleW = width / totalW;
      let currentX = x;

      modulesList.forEach((mod) => {
        const modW = mod.width * scaleW;

        // Module divider lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(currentX + modW, y);
        ctx.lineTo(currentX + modW, y + height);
        ctx.stroke();

        // Type-specific internal layout indicators
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const type = mod.type?.toLowerCase() || '';

        if (type.includes('shelf')) {
          for (let i = 1; i <= 4; i++) {
            const sY = y + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(currentX + 4, sY);
            ctx.lineTo(currentX + modW - 4, sY);
            ctx.stroke();
          }
        } else if (type.includes('hanging')) {
          const rY = y + height * 0.15;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(currentX + 8, rY);
          ctx.lineTo(currentX + modW - 8, rY);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (type.includes('drawer')) {
          const dY = y + height * 0.75;
          ctx.beginPath();
          ctx.moveTo(currentX + 4, dY);
          ctx.lineTo(currentX + modW - 4, dY);
          ctx.stroke();
        }

        currentX += modW;
      });
    }

    // Dimensions labels
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px var(--font-display)';
    ctx.textAlign = 'center';
    ctx.fillText(`${config.width} mm Width`, cw / 2, y - 25);

    ctx.save();
    ctx.translate(x - 30, ch / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${config.height} mm Height`, 0, 0);
    ctx.restore();
  }, [viewMode, config, totalModules, modulesList]);

  // Handle divider drag
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newToolbarWidth = containerRect.right - e.clientX;

      // Min width: 280px, Max width: 60% of container
      const minWidth = 280;
      const maxWidth = containerRect.width * 0.6;

      if (newToolbarWidth >= minWidth && newToolbarWidth <= maxWidth) {
        setToolbarWidth(newToolbarWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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

      {/* Main Content: Adjustable Viewer + Toolbar */}
      <div
        ref={containerRef}
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
            border: '1px solid rgba(255, 255, 255, 0.15)',
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
                <Viewer3D
                  modules={modulesList || []}
                  material={config.material}
                  roomWidth={config.width}
                  roomHeight={config.height}
                  roomDepth={config.depth}
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

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: 4,
            background: isDragging ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.1)',
            cursor: 'col-resize',
            transition: isDragging ? 'none' : 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            flexShrink: 0,
            '&:hover': {
              background: 'rgba(59, 130, 246, 0.4)',
            },
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          title="Drag to resize"
        />

        {/* RIGHT: Toolbar with dynamic width */}
        <div
          style={{
            width: toolbarWidth,
            minWidth: 280,
            maxWidth: '60%',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.7)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FullscreenToolbar currentStep={currentStep} />
          </div>

          {/* Exit Button at Bottom */}
          <div
            style={{
              padding: 20,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.5)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.5)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'rgba(239, 68, 68, 0.9)',
                fontSize: 13,
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
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              title="Exit fullscreen preview mode"
            >
              <span>←</span>
              Exit Fullscreen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenPreviewModal;

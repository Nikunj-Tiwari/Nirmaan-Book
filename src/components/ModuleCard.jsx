import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getModuleImagePath, generateModulePlaceholder } from '../data/moduleImages';
import { useToast } from './ToastProvider';

/**
 * ModuleCard — redesigned for correct image fill and compact content layout.
 *
 * Root issues fixed:
 *   - Image container had fixed height: 160px with no fill instruction → large empty gap
 *   - Counter was on its own row below dimensions → wasted vertical space
 *   - Category badge had no blur/pill treatment
 */
const ModuleCard = React.forwardRef(
  ({ module, qty, canAdd, onQtyChange, typeColors, typeLabels, onFocusNext, onFocusPrev }, ref) => {
    const { addToast } = useToast();
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const isSelected = qty > 0;

    // Selection palette
    const SEL_BORDER = '#16a34a';
    const SEL_BADGE_BG = '#22c55e';
    const SEL_GLOW = 'rgba(34,197,94,0.15)';
    const SEL_IMG_TINT = 'rgba(34,197,94,0.06)';

    const imagePath = getModuleImagePath(module.id);
    const placeholderImage = generateModulePlaceholder(module.layout || {});

    const handleImageError = () => {
      setImageError(true);
      setIsLoading(false);
    };
    const handleImageLoad = () => setIsLoading(false);

    const handleAddModule = () => {
      if (canAdd) {
        onQtyChange(module.id, 1);
        addToast(`${module.name} added to configuration`, 'success');
      } else {
        addToast('Not enough space available for this module', 'error');
      }
    };

    const handleRemoveModule = () => {
      if (qty > 0) {
        onQtyChange(module.id, -1);
        addToast(`${module.name} removed from configuration`, 'success');
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (qty > 0) handleRemoveModule();
        else if (canAdd) handleAddModule();
      } else if (e.key === 'ArrowRight' && onFocusNext) {
        e.preventDefault();
        onFocusNext();
      } else if (e.key === 'ArrowLeft' && onFocusPrev) {
        e.preventDefault();
        onFocusPrev();
      }
    };

    // Long-press to remove all
    const [pressTimer, setPressTimer] = React.useState(null);
    const handleRemoveBtnMouseDown = () => {
      const timer = setTimeout(() => {
        if (qty > 0) {
          onQtyChange(module.id, -qty);
          addToast(`All ${module.name} removed`, 'success');
        }
      }, 500);
      setPressTimer(timer);
    };
    const handleRemoveBtnMouseUp = () => {
      if (pressTimer) clearTimeout(pressTimer);
      setPressTimer(null);
    };

    const typeColor = typeColors?.[module.type] || 'var(--border)';
    const typeLabel = typeLabels?.[module.type] || module.type;

    return (
      <div
        ref={ref}
        className="module-card-container"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: isSelected ? '#f0fdf4' : 'var(--bg-secondary)',
          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? SEL_BORDER : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: isSelected
            ? `0 0 0 3px ${SEL_GLOW}, 0 4px 12px rgba(22,163,74,0.12)`
            : isHovered
              ? '0 12px 24px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          position: 'relative',
        }}
      >
        {/* ── Image Container ──────────────────────────────────────────
            background: var(--bg-primary) → dark in dark mode, light in light mode.
            No fixed height — aspect-ratio drives proportional height.
            objectFit: contain keeps full wardrobe visible with no crop. */}
        <div
          className="module-image-container"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 4',
            overflow: 'hidden',
            background: isSelected ? '#dcfce7' : 'var(--bg-primary)',
            borderBottom: `1px solid ${isSelected ? '#bbf7d0' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            transition: 'background 0.25s ease',
          }}
        >
          {/* Green selection tint */}
          {isSelected && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: SEL_IMG_TINT,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Shimmer while loading */}
          {isLoading && !imageError && imagePath && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          )}

          {/* Image — fills container completely with no padding */}
          {imagePath && !imageError ? (
            <img
              src={imagePath}
              alt={module.name}
              loading="lazy"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                display: 'block',
                padding: '8px',
                boxSizing: 'border-box',
                transition: 'transform 0.3s ease, opacity 0.2s ease',
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                opacity: isLoading ? 0.4 : 1,
              }}
            />
          ) : (
            /* SVG placeholder — same fill treatment */
            <img
              src={placeholderImage}
              alt={`${module.name} (placeholder)`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                display: 'block',
                padding: '8px',
                boxSizing: 'border-box',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.03)' : 'scale(1)',
              }}
            />
          )}

          {/* Image-load error */}
          {imageError && imagePath && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                zIndex: 2,
              }}
            >
              <AlertCircle size={28} strokeWidth={1.5} />
              <span style={{ fontSize: 11, fontWeight: 500 }}>Image Not Found</span>
            </div>
          )}

          {/* Category badge — pill overlay, top-left, theme-aware */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: `1.5px solid ${typeColor}`,
              color: '#ffffff',
              zIndex: 10,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {typeLabel}
          </div>

          {/* Quantity circle badge — top-right */}
          {qty > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: SEL_BADGE_BG,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 800,
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
              }}
            >
              {qty}
            </div>
          )}
        </div>

        {/* ── Content Block ────────────────────────────────────────────
            Compact: code → name → [dimensions + counter] on one row.
            No extra gaps or decorative dividers. */}
        <div
          style={{
            padding: '10px 12px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Module code — light enough to read on dark bg, muted on light bg */}
          <span
            style={{
              fontSize: 11,
              color: isSelected ? '#16a34a' : 'var(--text-secondary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {module.id}
          </span>

          {/* Module name */}
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
              marginBottom: 6,
            }}
          >
            {module.name}
          </span>

          {/* Dimensions (left) + Counter (right) — same flex row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 1, minWidth: 0 }}>
              W: {module.width}mm&nbsp;•&nbsp;H: {module.height}mm
            </span>

            {/* − / count / + */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <button
                onClick={handleRemoveModule}
                onMouseDown={handleRemoveBtnMouseDown}
                onMouseUp={handleRemoveBtnMouseUp}
                onMouseLeave={handleRemoveBtnMouseUp}
                disabled={qty === 0}
                title={qty > 0 ? 'Hold to remove all' : 'None added'}
                aria-label={`Remove one ${module.name}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: qty === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: qty === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  lineHeight: 1,
                }}
              >
                −
              </button>

              <span
                style={{
                  width: 28,
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: isSelected ? '#16a34a' : 'var(--text-primary)',
                }}
              >
                {qty}
              </span>

              <button
                onClick={handleAddModule}
                disabled={!canAdd}
                title={!canAdd ? 'Not enough space' : 'Add module (Enter)'}
                aria-label={`Add one ${module.name}`}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: canAdd ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: canAdd ? 'white' : 'var(--text-muted)',
                  cursor: canAdd ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  lineHeight: 1,
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ModuleCard.displayName = 'ModuleCard';
export default ModuleCard;

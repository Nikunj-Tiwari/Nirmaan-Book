import React, { useState, useRef } from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { getModuleImagePath, generateModulePlaceholder } from '../data/moduleImages';
import { useToast } from './ToastProvider';

const ModuleCard = React.forwardRef(
  ({ module, qty, canAdd, onQtyChange, typeColors, typeLabels, onFocusNext, onFocusPrev }, ref) => {
    const { addToast } = useToast();
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);

    const isSelected = qty > 0;

    // Selected state colours (green palette)
    const SEL_BORDER = '#16a34a'; // green-600
    const SEL_BG = '#f0fdf4'; // green-50
    const SEL_BADGE_BG = '#22c55e'; // green-500
    const SEL_GLOW = 'rgba(34,197,94,0.15)';
    const SEL_IMG_TINT = 'rgba(34,197,94,0.06)';

    // Get image path from mapping - null if not found
    const imagePath = getModuleImagePath(module.id);

    // Generate SVG placeholder as fallback
    const placeholderImage = generateModulePlaceholder(module.layout || {});

    const handleImageError = () => {
      setImageError(true);
      setIsLoading(false);
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

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
        if (qty > 0) {
          handleRemoveModule();
        } else if (canAdd) {
          handleAddModule();
        }
      } else if (e.key === 'ArrowRight' && onFocusNext) {
        e.preventDefault();
        onFocusNext();
      } else if (e.key === 'ArrowLeft' && onFocusPrev) {
        e.preventDefault();
        onFocusPrev();
      }
    };

    // Long press for remove all
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

    return (
      <div
        ref={ref}
        className="module-card-container"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          flexDirection: 'column',
          background: isSelected ? SEL_BG : 'var(--bg-secondary)',
          border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? SEL_BORDER : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: isSelected
            ? `0 0 0 3px ${SEL_GLOW}, 0 4px 12px rgba(22,163,74,0.12)`
            : isHovered
              ? '0 12px 24px rgba(0, 0, 0, 0.12)'
              : '0 1px 3px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          position: 'relative',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div
          className="module-image-container"
          style={{
            height: '160px',
            background: isSelected ? '#dcfce7' : '#f1f3f5',
            borderBottom: `1px solid ${isSelected ? '#bbf7d0' : 'var(--border)'}`,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.25s ease',
          }}
        >
          {/* Green selection tint overlay */}
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
          {/* Loading skeleton */}
          {isLoading && !imageError && imagePath && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
                zIndex: 1,
              }}
            />
          )}

          {/* Actual Image or Generated Placeholder */}
          {imagePath ? (
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
                padding: '12px',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                opacity: isLoading && !imageError ? 0.5 : 1,
              }}
            />
          ) : (
            /* SVG Placeholder when no image exists */
            <img
              src={placeholderImage}
              alt={`${module.name} (placeholder)`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '12px',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          )}

          {/* Error fallback: No image available */}
          {imageError && imagePath && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '16px',
              }}
            >
              <AlertCircle size={32} strokeWidth={1.5} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>Image Not Found</span>
            </div>
          )}

          {/* Type Badge */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              padding: '4px 10px',
              borderRadius: '99px',
              fontSize: '10px',
              fontWeight: '600',
              background: '#fff',
              border: `1.5px solid ${typeColors[module.type] || 'var(--border)'}`,
              color: typeColors[module.type] || 'var(--text-secondary)',
              zIndex: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {typeLabels?.[module.type] || module.type}
          </div>

          {/* Quantity Badge — green when selected */}
          {qty > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: SEL_BADGE_BG,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '700',
                zIndex: 10,
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
              }}
            >
              {qty}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div
          style={{
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flex: 1,
          }}
        >
          {/* Module ID & Name */}
          <div>
            <div
              style={{
                fontSize: '10px',
                color: isSelected ? '#16a34a' : 'var(--text-muted)',
                fontWeight: '600',
                marginBottom: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {module.id}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: '1.3',
                letterSpacing: '-0.01em',
              }}
            >
              {module.name}
            </div>
          </div>

          {/* Dimensions */}
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <span>W: {module.width}mm</span>
            <span>•</span>
            <span>H: {module.height}mm</span>
          </div>

          {/* Price & Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: '8px',
            }}
          >
            <span
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--accent)',
                letterSpacing: '-0.02em',
              }}
            >
              ₹{(module.basePrice || 0).toLocaleString()}
            </span>

            {/* Quantity Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleRemoveModule}
                onMouseDown={handleRemoveBtnMouseDown}
                onMouseUp={handleRemoveBtnMouseUp}
                onMouseLeave={handleRemoveBtnMouseUp}
                disabled={qty === 0}
                title={qty > 0 ? 'Hold to remove all' : 'Remove module'}
                className="module-control-btn"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: qty === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  cursor: qty === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <Minus size={18} />
              </button>

              <span
                style={{
                  minWidth: '32px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              >
                {qty}
              </span>

              <button
                onClick={handleAddModule}
                disabled={!canAdd}
                title={!canAdd ? 'Not enough space available' : 'Add module (Enter key)'}
                className="module-control-btn"
                style={{
                  minWidth: '44px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: 'none',
                  background: canAdd ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: canAdd ? 'white' : 'var(--text-muted)',
                  cursor: canAdd ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={18} />
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

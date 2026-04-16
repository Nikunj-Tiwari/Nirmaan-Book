import React, { useState } from 'react';

const Tooltip = ({ text, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    const baseStyle = {
      position: 'absolute',
      background: 'var(--text-primary)',
      color: 'white',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      zIndex: 1000,
      pointerEvents: 'none',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.2s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    };

    const arrowStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    if (position === 'top') {
      return {
        tooltip: {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '6px',
        },
        arrow: {
          ...arrowStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '4px 4px 0 4px',
          borderColor: 'var(--text-primary) transparent transparent transparent',
        },
      };
    } else if (position === 'bottom') {
      return {
        tooltip: {
          ...baseStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '6px',
        },
        arrow: {
          ...arrowStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderWidth: '0 4px 4px 4px',
          borderColor: 'transparent transparent var(--text-primary) transparent',
        },
      };
    } else if (position === 'left') {
      return {
        tooltip: {
          ...baseStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '6px',
        },
        arrow: {
          ...arrowStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '4px 0 4px 4px',
          borderColor: 'transparent transparent transparent var(--text-primary)',
        },
      };
    } else if (position === 'right') {
      return {
        tooltip: {
          ...baseStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '6px',
        },
        arrow: {
          ...arrowStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderWidth: '4px 4px 4px 0',
          borderColor: 'transparent var(--text-primary) transparent transparent',
        },
      };
    }
  };

  const positions = getPositionStyles();

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div style={positions.tooltip}>
        {text}
        <div style={positions.arrow} />
      </div>
    </div>
  );
};

export default Tooltip;

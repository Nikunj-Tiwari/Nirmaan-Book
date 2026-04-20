import React from 'react';
import { useConfig } from '../store/ConfigContext';
import { COLOURS, MATERIALS, HANDLES, LIGHTING, ACCESSORIES } from '../data/config';
import { Check } from 'lucide-react';

/**
 * FullscreenToolbar
 * Context-aware toolbar showing different controls based on current step
 */
const FullscreenToolbar = ({ currentStep }) => {
  const { config, actions, derived } = useConfig();
  const { totalModules } = derived;

  const toolbarStyle = {
    padding: 20,
    color: 'white',
    fontFamily: 'var(--font-sans)',
  };

  const sectionStyle = {
    marginBottom: 24,
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 10,
  };

  const sliderStyle = {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 6,
    border: '1px solid rgba(59, 130, 246, 0.5)',
    background: 'rgba(59, 130, 246, 0.1)',
    color: 'white',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
  };

  const buttonStyle = (isSelected) => ({
    padding: '10px 12px',
    borderRadius: 6,
    border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.1)'}`,
    background: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
    color: isSelected ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s',
    width: '100%',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-sans)',
  });

  // STEP 1: DIMENSIONS
  if (currentStep === 1) {
    return (
      <div style={toolbarStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'white' }}>
          Edit Dimensions
        </h3>

        <div style={sectionStyle}>
          <div style={labelStyle}>Width</div>
          <input
            type="range"
            min="600"
            max="3600"
            step="100"
            value={config.width}
            onChange={(e) => actions.setDimension('width', parseInt(e.target.value))}
            style={sliderStyle}
          />
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'rgba(59, 130, 246, 0.9)',
              fontWeight: 600,
            }}
          >
            {config.width} mm
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Height</div>
          <input
            type="range"
            min="1200"
            max="2400"
            step="100"
            value={config.height}
            onChange={(e) => actions.setDimension('height', parseInt(e.target.value))}
            style={sliderStyle}
          />
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'rgba(59, 130, 246, 0.9)',
              fontWeight: 600,
            }}
          >
            {config.height} mm
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Depth</div>
          <input
            type="range"
            min="300"
            max="700"
            step="50"
            value={config.depth}
            onChange={(e) => actions.setDimension('depth', parseInt(e.target.value))}
            style={sliderStyle}
          />
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: 'rgba(59, 130, 246, 0.9)',
              fontWeight: 600,
            }}
          >
            {config.depth} mm
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: MATERIALS & COLOURS
  if (currentStep === 3) {
    return (
      <div style={toolbarStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'white' }}>
          Finishes & Colors
        </h3>

        <div style={sectionStyle}>
          <div style={labelStyle}>Material</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => actions.setFinish('material', m)}
                style={buttonStyle(config.material.id === m.id)}
              >
                <span>{m.name}</span>
                {config.material.id === m.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Colour</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {COLOURS.map((c, idx) => (
              <button
                key={idx}
                onClick={() => actions.setFinish('colour', c)}
                style={{
                  ...buttonStyle(config.colour.name === c.name),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    background: c.hex,
                    border: `2px solid ${config.colour.name === c.name ? 'rgba(59, 130, 246, 0.9)' : 'rgba(255, 255, 255, 0.2)'}`,
                  }}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
                {config.colour.name === c.name && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: HARDWARE & ACCESSORIES
  if (currentStep === 4) {
    return (
      <div style={toolbarStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'white' }}>
          Hardware & Accessories
        </h3>

        <div style={sectionStyle}>
          <div style={labelStyle}>Handles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {HANDLES.map((h) => (
              <button
                key={h.name}
                onClick={() => actions.setFinish('handle', h)}
                style={buttonStyle(config.handle.name === h.name)}
              >
                <span>{h.name}</span>
                {config.handle.name === h.name && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Lighting</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LIGHTING.map((l) => (
              <button
                key={l.name}
                onClick={() => actions.setFinish('lighting', l)}
                style={buttonStyle(config.lighting.name === l.name)}
              >
                <span>{l.name}</span>
                {config.lighting.name === l.name && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Accessories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACCESSORIES.map((acc) => {
              const isSelected = config.selectedAccessories.has(acc.id);
              return (
                <button
                  key={acc.id}
                  onClick={() => actions.toggleAccessory(acc.id)}
                  style={buttonStyle(isSelected)}
                >
                  <span>{acc.name}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT: Show summary info
  return (
    <div style={toolbarStyle}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: 'white' }}>
        Configuration Summary
      </h3>

      <div style={sectionStyle}>
        <div style={labelStyle}>Dimensions</div>
        <div
          style={{
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 6,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
          }}
        >
          <div>
            {config.width}W × {config.height}H × {config.depth}D mm
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Modules</div>
        <div
          style={{
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 6,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {totalModules} module{totalModules !== 1 ? 's' : ''} selected
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Finish</div>
        <div
          style={{
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 6,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
          }}
        >
          <div>{config.material.name}</div>
          <div>{config.colour.name}</div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Hardware</div>
        <div
          style={{
            padding: 12,
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 6,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.6,
          }}
        >
          <div>Handles: {config.handle.name}</div>
          <div>Lighting: {config.lighting.name}</div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenToolbar;

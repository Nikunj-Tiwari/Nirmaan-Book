import React, { useEffect, useRef } from 'react';
import { WALL_TYPES } from '../data/config';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';
import { Layout } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

const StepDimensions = () => {
  const { config, actions, derived } = useConfig();
  const { isMobile } = useResponsive();
  const { wallType, width, width2, width3, height, depth } = config;

  const NumericInput = ({ value, min, max, onChange, label }) => {
    const [temp, setTemp] = React.useState(value);

    React.useEffect(() => {
      setTemp(value);
    }, [value]);

    const commit = (val) => {
      const v = Math.min(max, Math.max(min, parseInt(val) || min));
      setTemp(v);
      if (v !== value) {
        onChange(v);
      }
    };

    return (
      <input
        type="number"
        value={temp}
        min={min}
        max={max}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(e.target.value)}
        style={{
          width: 75,
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'right',
          color: 'var(--accent)',
          fontFamily: 'var(--font-sans)',
        }}
      />
    );
  };

  const sliderCard = (label, key, min, max, step, value, unit) => (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NumericInput
            value={value}
            min={min}
            max={max}
            label={label}
            onChange={(v) => actions.setDimension(key, v)}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          actions.setDimension(key, v);
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}
      >
        <span>{min}</span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 32,
        alignItems: 'start',
      }}
      className="animate-fade-in"
    >
      {/* Left: Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Section label */}
        <div>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 0,
            }}
          >
            Choose Layout
          </h2>
        </div>

        {/* Layout Type */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Layout Type
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'single', label: 'Straight' },
              { id: 'l-shape', label: 'L-Shape' },
              { id: 'u-shape', label: 'U-Shape' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  actions.setDimension('wallType', w.id);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1.5px solid ${wallType === w.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  background: wallType === w.id ? 'var(--accent-light)' : 'var(--bg-primary)',
                  color: wallType === w.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Layout size={18} />
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {sliderCard(
          wallType === 'single' ? 'Room Width' : 'Wall 1 Width',
          'width',
          600,
          6000,
          100,
          width,
          'mm',
          'Primary Wall'
        )}
        {(wallType === 'l-shape' || wallType === 'u-shape') &&
          sliderCard('Wall 2 Width', 'width2', 0, 6000, 100, width2, 'mm', 'Left Return')}
        {wallType === 'u-shape' &&
          sliderCard('Wall 3 Width', 'width3', 0, 6000, 100, width3, 'mm', 'Right Return')}

        {sliderCard('Wardrobe Height', 'height', 1800, 3000, 100, height, 'mm', null)}
        {sliderCard('Internal Depth', 'depth', 300, 1200, 50, depth, 'mm', null)}
      </div>
    </div>
  );
};

export default StepDimensions;

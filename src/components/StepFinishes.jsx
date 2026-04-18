import React from 'react';
import { Check } from 'lucide-react';
import { MATERIALS, COLOURS } from '../data/config';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';
import Tooltip from './Tooltip';
import { useResponsive } from '../hooks/useResponsive';

const StepFinishes = () => {
  const { config, actions } = useConfig();
  const { addToast } = useToast();
  const { material, colour, fascia } = config;
  const { isMobile } = useResponsive();

  const FASCIAS = ['Akila', 'Inline', 'J-Pull'];

  const selStyle = (isSelected) => ({
    padding: '14px 16px',
    borderRadius: 10,
    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
    background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.15s',
    textAlign: 'left',
    width: '100%',
    fontFamily: 'var(--font-sans)',
    boxShadow: 'var(--shadow-xs)',
  });

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}
      className="animate-fade-in"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Section header */}
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Finishes & Materials
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Pick the core material and colour tone
          </p>
        </div>

        {/* Material */}
        <div>
          <div className="section-title">Core Material</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  actions.setFinish('material', m);
                  addToast(`Material changed to ${m.name}`, 'success');
                }}
                aria-label={`Select ${m.name} material`}
                style={selStyle(material.id === m.id)}
              >
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: material.id === m.id ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {m.name}
                    {m.multiplier > 1 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: material.id === m.id ? 'var(--accent)' : 'var(--text-secondary)',
                          marginLeft: '8px',
                        }}
                      >
                        (+{Math.round((m.multiplier - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: material.id === m.id ? 'var(--accent)' : 'var(--text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {m.sub}
                  </div>
                </div>
                {material.id === m.id && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} color="white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Colour */}
        <div>
          <div className="section-title">Colour Tone</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: 10,
            }}
          >
            {COLOURS.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  actions.setFinish('colour', c);
                  addToast(`Colour changed to ${c.name}`, 'success');
                }}
                aria-label={`Select ${c.name} colour`}
                style={{
                  padding: '10px 8px',
                  borderRadius: 10,
                  border: `1.5px solid ${colour.id === c.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: colour.id === c.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Tooltip text={c.name} position="top">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: c.hex,
                      border: '2px solid rgba(0,0,0,0.06)',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: colour.id === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Door Profile */}
        <div>
          <div className="section-title">Door Style</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {FASCIAS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  actions.setFinish('fascia', f);
                  addToast(`Door style changed to ${f}`, 'success');
                }}
                aria-label={`Select ${f} door style`}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${fascia === f ? 'var(--accent)' : 'var(--border)'}`,
                  background: fascia === f ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  color: fascia === f ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Configuration Summary Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}
          >
            Style Preview
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Your current finish selections
          </p>
        </div>

        {/* Colour swatch */}
        <div
          style={{
            height: 160,
            borderRadius: 12,
            background: colour.hex,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <span
            style={{
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {colour.name} Sample
          </span>
        </div>

        {/* Spec rows */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {[
            { label: 'Colour', value: colour.name },
            { label: 'Material', value: material.name },
            { label: 'Door Style', value: fascia },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepFinishes;

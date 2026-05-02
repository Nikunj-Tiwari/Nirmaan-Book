import React from 'react';
import { Check } from 'lucide-react';
import { MATERIALS, COLOURS } from '../data/config.jsx';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';
import Tooltip from './Tooltip';
import { useResponsive } from '../hooks/useResponsive';

/**
 * StepMaterials Component
 * Combines materials, finishes, and colour selection in one view.
 * Part of the 5-step configurator flow.
 */
const StepMaterials = () => {
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
      style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}
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
              marginBottom: 24,
            }}
          >
            Materials & Finishes
          </h2>
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
                      <Tooltip title={`${(m.multiplier * 100 - 100).toFixed(0)}% price increase`}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            marginLeft: 6,
                            opacity: 0.7,
                          }}
                        >
                          +{(m.multiplier * 100 - 100).toFixed(0)}%
                        </span>
                      </Tooltip>
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
                {material.id === m.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Colour */}
        <div>
          <div className="section-title">Colour Tone</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {COLOURS.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  actions.setFinish('colour', c);
                  addToast(`Colour changed to ${c.name}`, 'success');
                }}
                aria-label={`Select ${c.name} colour`}
                style={selStyle(colour.name === c.name)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: c.hex,
                      border: `2px solid ${colour.name === c.name ? '#3b82f6' : '#e5e7eb'}`,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: colour.name === c.name ? 'var(--accent)' : 'var(--text-primary)',
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colour.name === c.name ? 'var(--accent)' : 'var(--text-secondary)',
                        marginTop: 2,
                      }}
                    >
                      {c.sub}
                    </div>
                  </div>
                </div>
                {colour.name === c.name && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Fascia */}
        <div>
          <div className="section-title">Fascia Style</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: 8,
            }}
          >
            {FASCIAS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  actions.setFinish('fascia', f);
                  addToast(`Fascia changed to ${f}`, 'success');
                }}
                aria-label={`Select ${f} fascia`}
                style={selStyle(fascia === f)}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: fascia === f ? 'var(--accent)' : 'var(--text-primary)',
                  }}
                >
                  {f}
                </div>
                {fascia === f && <Check size={16} color="var(--accent)" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepMaterials;

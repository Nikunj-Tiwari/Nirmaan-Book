import React, { useMemo } from 'react';
import { useConfig } from '../store/ConfigContext';
import { MODULES } from '../data/modules';

export const SummaryPanel = ({ state, removeModule, totalPrice, bom }) => {
  const { config, derived } = useConfig();
  const { valuation, validation } = derived;

  const activeModules = useMemo(
    () =>
      Object.entries(config.modules)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const mod = MODULES.find((m) => m.id === id);
          return { ...mod, qty };
        }),
    [config.modules]
  );

  const usedWidth = validation.usedWidth;
  const totalWidth = config.width;
  const remaining = totalWidth - usedWidth;
  const percentUsed = Math.min((usedWidth / totalWidth) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Title */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        Your Configuration
      </h3>

      {/* Module list */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {activeModules.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            No modules selected yet
          </div>
        ) : (
          activeModules.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: i < activeModules.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {m.width} mm × {m.qty}
                </div>
              </div>
              <span
                style={{
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ×{m.qty}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Width usage */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Width Used
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: validation.isValid ? 'var(--text-primary)' : 'var(--danger)',
            }}
          >
            {usedWidth} / {totalWidth} mm
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: 'var(--bg-tertiary)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentUsed}%`,
              background: validation.isValid ? 'var(--accent)' : 'var(--danger)',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          <span>{remaining} mm remaining</span>
          <span>{Math.round(percentUsed)}%</span>
        </div>
      </div>

      {/* Total Price */}
      <div
        style={{
          background: 'var(--accent-light)',
          border: '1.5px solid var(--accent-border)',
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Total Price
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: 'var(--accent)',
            letterSpacing: '-0.04em',
          }}
        >
          ₹ {valuation.total.toLocaleString()}
        </div>
        <div style={{ fontSize: 11, color: 'var(--accent)', opacity: 0.7, marginTop: 4 }}>
          Includes all selected modules &amp; accessories
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;

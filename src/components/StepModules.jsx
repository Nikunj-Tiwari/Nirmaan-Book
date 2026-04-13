import React, { useState, useMemo } from 'react';
import { MODULES, CATEGORIES, TYPE_COLORS, TYPE_LABELS } from '../data/modules';
import { canAddModule } from '../utils/rules';
import { useConfig } from '../store/ConfigContext';
import ModuleCard from './ModuleCard';

const StepModules = () => {
  const { config, derived, actions } = useConfig();
  const [filter, setFilter] = useState('all');

  const filteredModules = useMemo(
    () => (filter === 'all' ? MODULES : MODULES.filter((m) => m.type === filter)),
    [filter]
  );

  const { remainingWidth, usedWidth, validation } = useMemo(
    () => ({
      remainingWidth: derived.remainingWidth,
      usedWidth: derived.validation.usedWidth,
      validation: derived.validation,
    }),
    [derived]
  );

  const chQty = (code, delta) => actions.setModuleQty(code, delta);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-in">
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
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
            Choose Modules
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Select the components for your wardrobe
          </p>
        </div>

        {/* Capacity bar */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 18px',
            minWidth: 240,
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Space Available
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: !validation.isValid ? 'var(--danger)' : 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {remainingWidth} mm
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
                width: `${Math.min(validation.percentUsed, 100)}%`,
                background: !validation.isValid ? 'var(--danger)' : 'var(--accent)',
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
            <span>{usedWidth} mm used</span>
            <span>{Math.round(validation.percentUsed)}%</span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[{ id: 'all', label: 'All Modules' }, ...CATEGORIES].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            style={{
              padding: '7px 16px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 600,
              border: `1.5px solid ${filter === cat.id ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === cat.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
              color: filter === cat.id ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '18px',
          '@media (max-width: 768px)': {
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '14px',
          },
          '@media (max-width: 480px)': {
            gridTemplateColumns: '1fr',
            gap: '12px',
          },
        }}
      >
        {filteredModules.map((m) => {
          const qty = config.modules[m.id] || 0;
          const canAdd = canAddModule(config.width, config.modules, m.id);

          return (
            <ModuleCard
              key={m.id}
              module={m}
              qty={qty}
              canAdd={canAdd}
              onQtyChange={chQty}
              typeColors={TYPE_COLORS}
              typeLabels={TYPE_LABELS}
            />
          );
        })}
      </div>
    </div>
  );
};

export default StepModules;

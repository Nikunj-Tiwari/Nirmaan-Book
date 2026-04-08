import React, { useState, useMemo } from 'react';
import { MODULES, CATEGORIES, TYPE_COLORS, TYPE_LABELS } from '../data/modules';
import { canAddModule } from '../utils/rules';
import { useConfig } from '../store/ConfigContext';
import { Plus, Minus } from 'lucide-react';

const ModuleVisual = ({ layout }) => (
  <div style={{ width: '100%', height: '100%', padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div
      style={{
        flex: 1,
        background: '#f1f3f5',
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {layout.shelves > 0 && Array(layout.shelves).fill(0).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '100%',
            height: 1,
            background: '#d1d5db',
            top: `${(100 / (layout.shelves + 1)) * (i + 1)}%`,
          }}
        />
      ))}
      {layout.hang > 0 && (
        <div style={{
          position: 'absolute',
          width: '75%',
          height: 2,
          background: '#3b82f6',
          top: 10,
          left: '12.5%',
          borderRadius: 99,
        }} />
      )}
      {layout.drawers > 0 && (
        <div style={{ position: 'absolute', bottom: 0, width: '100%' }}>
          {Array(layout.drawers).fill(0).map((_, i) => (
            <div key={i} style={{ width: '100%', height: 14, background: '#fff', borderTop: '1px solid #e5e7eb' }} />
          ))}
        </div>
      )}
    </div>
  </div>
);

const StepModules = () => {
  const { config, derived, actions } = useConfig();
  const [filter, setFilter] = useState('all');

  const filteredModules = useMemo(() =>
    filter === 'all' ? MODULES : MODULES.filter(m => m.type === filter),
    [filter]
  );

  const { remainingWidth, usedWidth, validation } = useMemo(() => ({
    remainingWidth: derived.remainingWidth,
    usedWidth: derived.validation.usedWidth,
    validation: derived.validation,
  }), [derived]);

  const chQty = (code, delta) => actions.setModuleQty(code, delta);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-in">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 4 }}>
            Choose Modules
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Select the components for your wardrobe</p>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Space Available</span>
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
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{usedWidth} mm used</span>
            <span>{Math.round(validation.percentUsed)}%</span>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[{ id: 'all', label: 'All Modules' }, ...CATEGORIES].map(cat => (
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {filteredModules.map(m => {
          const qty = config.modules[m.id] || 0;
          const canAdd = canAddModule(config.width, config.modules, m.id);

          return (
            <div
              key={m.id}
              className={`premium-card ${qty > 0 ? 'selected' : ''}`}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {/* Thumbnail */}
              <div
                className="module-thumb"
                style={{ height: 130, position: 'relative' }}
              >
                <ModuleVisual layout={m.layout} type={m.type} />

                {/* Type badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    padding: '3px 8px',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 600,
                    background: '#fff',
                    border: `1.5px solid ${TYPE_COLORS[m.type] || 'var(--border)'}`,
                    color: TYPE_COLORS[m.type] || 'var(--text-secondary)',
                  }}
                >
                  {TYPE_LABELS?.[m.type] || m.type}
                </div>

                {/* Qty badge */}
                {qty > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {qty}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
                    {m.id}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {m.width} mm wide
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                    ₹{(m.basePrice || 0).toLocaleString()}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => chQty(m.id, -1)}
                      disabled={qty === 0}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: '1px solid var(--border)',
                        background: qty === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {qty}
                    </span>
                    <button
                      onClick={() => chQty(m.id, 1)}
                      disabled={!canAdd}
                      title={!canAdd ? 'Not enough space remaining' : 'Add module'}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        border: 'none',
                        background: canAdd ? 'var(--accent)' : 'var(--bg-tertiary)',
                        color: canAdd ? 'white' : 'var(--text-muted)',
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepModules;

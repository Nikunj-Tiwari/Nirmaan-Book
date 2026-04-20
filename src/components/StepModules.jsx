import React, { useState, useMemo, useRef, useCallback } from 'react';
import { MODULES, CATEGORIES, TYPE_COLORS, TYPE_LABELS } from '../data/modules';
import { canAddModule } from '../utils/rules';
import { useConfig } from '../store/ConfigContext';
import { Search, Grid3X3, List } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { useResponsive } from '../hooks/useResponsive';

const StepModules = () => {
  const { config, derived, actions } = useConfig();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const { isMobile } = useResponsive();

  // Keyboard navigation refs
  const moduleRefs = useRef({});

  const createFocusHandlers = useCallback((moduleId, filteredModulesList) => {
    return {
      onFocusNext: () => {
        const currentIndex = filteredModulesList.findIndex((m) => m.id === moduleId);
        if (currentIndex < filteredModulesList.length - 1) {
          const nextModule = filteredModulesList[currentIndex + 1];
          moduleRefs.current[nextModule.id]?.focus();
        }
      },
      onFocusPrev: () => {
        const currentIndex = filteredModulesList.findIndex((m) => m.id === moduleId);
        if (currentIndex > 0) {
          const prevModule = filteredModulesList[currentIndex - 1];
          moduleRefs.current[prevModule.id]?.focus();
        }
      },
    };
  }, []);

  const filteredModules = useMemo(() => {
    let modules = filter === 'all' ? MODULES : MODULES.filter((m) => m.type === filter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      modules = modules.filter(
        (m) => m.name.toLowerCase().includes(term) || m.id.toLowerCase().includes(term)
      );
    }
    return modules;
  }, [filter, searchTerm]);

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
      {/* Header */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: 0,
        }}
      >
        Choose Modules
      </h2>

      {/* Filter pills + View Toggle */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            gap: 8,
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? 8 : 0,
            WebkitOverflowScrolling: 'touch',
            width: isMobile ? '100%' : 'auto',
          }}
          className="no-scrollbar"
        >
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {CATEGORIES.map((cat) => (
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

        {/* View Toggle */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            borderRadius: 8,
            background: 'var(--bg-tertiary)',
            padding: 4,
          }}
        >
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              border: 'none',
              background: viewMode === 'list' ? 'var(--accent)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {Object.values(config.modules).every((qty) => qty === 0) && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-secondary)',
            border: '2px dashed var(--border)',
            borderRadius: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 12,
              opacity: 0.3,
            }}
          >
            📦
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            Your wardrobe is empty
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
            }}
          >
            Add modules from the list below to get started
          </p>
        </div>
      )}

      {/* Module Grid */}
      {filteredModules.length > 0 ? (
        viewMode === 'grid' ? (
          <div
            className="module-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '18px',
              /* Responsive grid via media queries in CSS */
              /* Desktop: 3-4 columns */
              /* Tablet: 2 columns */
              /* Mobile: 1 column */
            }}
          >
            {filteredModules.map((m) => {
              const qty = config.modules[m.id] || 0;
              const canAdd = canAddModule(config.width, config.modules, m.id);
              const { onFocusNext, onFocusPrev } = createFocusHandlers(m.id, filteredModules);

              return (
                <ModuleCard
                  key={m.id}
                  ref={(el) => {
                    moduleRefs.current[m.id] = el;
                  }}
                  module={m}
                  qty={qty}
                  canAdd={canAdd}
                  onQtyChange={chQty}
                  typeColors={TYPE_COLORS}
                  typeLabels={TYPE_LABELS}
                  onFocusNext={onFocusNext}
                  onFocusPrev={onFocusPrev}
                />
              );
            })}
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {filteredModules.map((m, idx) => {
              const qty = config.modules[m.id] || 0;
              const canAdd = canAddModule(config.width, config.modules, m.id);
              const typeColor = TYPE_COLORS[m.type] || 'var(--border)';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 100px 120px 120px',
                    gap: '14px',
                    padding: '14px 16px',
                    borderBottom:
                      idx < filteredModules.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(37, 99, 235, 0.02)',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      idx % 2 === 0 ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      idx % 2 === 0 ? 'transparent' : 'rgba(37, 99, 235, 0.02)';
                  }}
                  tabIndex={0}
                >
                  {/* Type Icon */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: typeColor,
                      opacity: 0.15,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      color: typeColor,
                    }}
                  />

                  {/* Name & ID */}
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {m.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                      ID: {m.id}
                    </div>
                  </div>

                  {/* Width */}
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '6px 10px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 6,
                    }}
                  >
                    {m.width}mm
                  </div>

                  {/* Price */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      textAlign: 'center',
                      padding: '6px 10px',
                      background: 'rgba(37, 99, 235, 0.1)',
                      borderRadius: 6,
                    }}
                  >
                    ₹{m.basePrice.toLocaleString()}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button
                      onClick={() => qty > 0 && chQty(m.id, -1)}
                      disabled={qty === 0}
                      aria-label={`Remove one ${m.name}`}
                      title={qty > 0 ? 'Remove one' : 'Cannot remove'}
                      style={{
                        minWidth: '44px',
                        height: 40,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: qty === 0 ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                        color: qty === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                        fontSize: 16,
                        fontWeight: 600,
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <div
                      style={{
                        minWidth: '36px',
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        background: qty > 0 ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      {qty}
                    </div>
                    <button
                      onClick={() => canAdd && chQty(m.id, 1)}
                      disabled={!canAdd}
                      aria-label={`Add one ${m.name}`}
                      title={!canAdd ? 'Not enough space' : 'Add one'}
                      style={{
                        minWidth: '44px',
                        height: 40,
                        borderRadius: 8,
                        border: 'none',
                        background: canAdd ? 'var(--accent)' : 'var(--bg-tertiary)',
                        cursor: canAdd ? 'pointer' : 'not-allowed',
                        color: canAdd ? 'white' : 'var(--text-muted)',
                        fontSize: 16,
                        fontWeight: 600,
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 24px',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No modules found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default StepModules;

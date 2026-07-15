import React, { useState, useMemo, useRef, useCallback } from 'react';
import { CATEGORIES, TYPE_COLORS, TYPE_LABELS } from '../data/modules';
import { canAddModule } from '../utils/rules';
import { useConfig } from '../store/ConfigContext';
import { Search, Grid3X3, List, Zap } from 'lucide-react';
import ModuleCard from './ModuleCard';
import { useResponsive } from '../hooks/useResponsive';
import { useToast } from './ToastProvider';
import { wardrobeAccessories as STATIC_ACCESSORIES } from '../../wardrobeCatalogueData.js';

const QUICK_TEMPLATES = [
  {
    name: 'Basic',
    subtitle: 'Essentials only',
    emoji: '🪄',
    // 2× Full hanging
    modules: { 'OW/SW 01': 2 },
    estimatedPrice: 11000,
  },
  {
    name: 'Standard',
    subtitle: 'Most popular',
    emoji: '⭐',
    highlighted: true,
    // 2× Full hanging + 1× Short hang+3 drawers + 1× Long hang+3 shelves
    modules: { 'OW/SW 01': 2, 'OW/SW 07': 1, 'OW/SW 04': 1 },
    estimatedPrice: 25600,
  },
  {
    name: 'Premium',
    subtitle: 'Great for couples',
    emoji: '💎',
    modules: { 'OW/SW 01': 2, 'OW/SW 07': 1, 'OW/SW 04': 1, 'OW/SW 08': 1 },
    estimatedPrice: 34100,
  },
  {
    name: 'Master',
    subtitle: 'Walk-in ready',
    emoji: '🏆',
    modules: { 'OW/SW 01': 2, 'OW/SW 07': 2, 'OW/SW 04': 1, 'OW/SW 08': 1 },
    estimatedPrice: 41900,
  },
];

const StepModules = () => {
  const { config, derived, actions, activeModules, activeAccessories, moduleAccessories } =
    useConfig();
  const { addToast } = useToast();
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
    const source = activeModules && activeModules.length > 0 ? activeModules : [];
    let modules = filter === 'all' ? source : source.filter((m) => m.type === filter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      modules = modules.filter(
        (m) => m.name.toLowerCase().includes(term) || m.id.toLowerCase().includes(term)
      );
    }
    return modules;
  }, [filter, searchTerm, activeModules]);

  const { remainingWidth, usedWidth, validation } = useMemo(
    () => ({
      remainingWidth: derived.remainingWidth,
      usedWidth: derived.validation.usedWidth,
      validation: derived.validation,
    }),
    [derived]
  );

  const chQty = (code, delta) => actions.setModuleQty(code, delta);

  // Apply a quick-start template: reset all modules then set template quantities
  const applyTemplate = useCallback(
    (template) => {
      // Reset every currently selected module to 0
      Object.keys(config.modules).forEach((id) => {
        const qty = config.modules[id] || 0;
        if (qty > 0) actions.setModuleQty(id, -qty);
      });
      // Then add template quantities
      Object.entries(template.modules).forEach(([id, qty]) => {
        actions.setModuleQty(id, qty);
      });
      addToast(`"${template.name}" template applied! Customise further below.`, 'success');
    },
    [config.modules, actions, addToast]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
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

      {/* ── Quick Start Templates ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Zap size={13} color="var(--accent)" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Quick Start Templates
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch',
          }}
          className="no-scrollbar"
        >
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => applyTemplate(tpl)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '10px 14px',
                borderRadius: 10,
                border: `1.5px solid ${tpl.highlighted ? 'var(--accent)' : 'var(--border)'}`,
                background: tpl.highlighted ? 'var(--accent-light)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textAlign: 'left',
                transition: 'all 0.15s',
                minWidth: 120,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = tpl.highlighted
                  ? 'var(--accent)'
                  : 'var(--border)';
                e.currentTarget.style.background = tpl.highlighted
                  ? 'var(--accent-light)'
                  : 'var(--bg-secondary)';
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{tpl.emoji}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tpl.highlighted ? 'var(--accent)' : 'var(--text-primary)',
                  marginTop: 4,
                }}
              >
                {tpl.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tpl.subtitle}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>
                ~₹{tpl.estimatedPrice.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>

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
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {filteredModules.map((m) => {
              const qty = config.modules[m.id] || 0;
              const canAdd = canAddModule(config.width, config.modules, m.id, activeModules);

              const { onFocusNext, onFocusPrev } = createFocusHandlers(m.id, filteredModules);

              // ── Interior fitting inline selector (Fix 6) ──────────────
              // Only compute this for selected accessoryEditable modules.
              const showFittingSelector = qty > 0 && m.accessoryEditable === true;
              let fittingSelector = null;
              if (showFittingSelector) {
                const defaultSlotEntry = (m.sections || []).find((s) => s.type === 'accessory');
                const defaultSlot = defaultSlotEntry?.slot ?? null;
                const firestoreOpts = (activeAccessories || []).filter(
                  (a) => a.slotType === 'accessory'
                );
                const staticOpts = STATIC_ACCESSORIES.filter((a) => a.slotType === 'accessory');
                const fittingOpts = firestoreOpts.length > 0 ? firestoreOpts : staticOpts;
                const currentId = moduleAccessories?.[m.id] ?? defaultSlot ?? null;

                fittingSelector =
                  fittingOpts.length > 0 ? (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderTop: 'none',
                        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                        padding: '8px 10px 10px',
                        minWidth: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#16a34a',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          marginBottom: 6,
                        }}
                      >
                        Interior fitting
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {fittingOpts.map((acc) => {
                          const isActive = currentId === acc.id;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => actions.setModuleAccessory(m.id, acc.id)}
                              title={
                                acc.price
                                  ? `₹${Number(acc.price).toLocaleString('en-IN')}`
                                  : acc.name
                              }
                              style={{
                                padding: '3px 9px',
                                borderRadius: 99,
                                border: `1.5px solid ${isActive ? '#16a34a' : '#86efac'}`,
                                background: isActive ? '#16a34a' : 'white',
                                color: isActive ? 'white' : '#15803d',
                                fontSize: 11,
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: 'var(--font-sans)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {isActive && <span style={{ marginRight: 3 }}>✓</span>}
                              {acc.name}
                            </button>
                          );
                        })}
                      </div>
                      {currentId && currentId !== defaultSlot && (
                        <button
                          onClick={() => actions.setModuleAccessory(m.id, null)}
                          style={{
                            marginTop: 5,
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: 10,
                            color: '#86efac',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Reset to default
                        </button>
                      )}
                    </div>
                  ) : null;
              }

              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <ModuleCard
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
                    cardStyleOverride={
                      fittingSelector
                        ? {
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            boxShadow: 'none',
                          }
                        : undefined
                    }
                  />
                  {fittingSelector}
                </div>
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
              const canAdd = canAddModule(config.width, config.modules, m.id, activeModules);

              const typeColor = TYPE_COLORS[m.type] || 'var(--border)';

              return (
                <div
                  key={m.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 100px 120px',
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
      {/* ── Interior Fittings (Fix 6) ─────────────────────────────────────────
          Shown only when at least one accessoryEditable module is selected.
          Lets the customer swap the fitting slot (tray / trouser rack / etc).
      ─────────────────────────────────────────────────────────────────────── */}
      {(() => {
        // Find selected modules that have accessoryEditable === true
        const editableSelected = activeModules.filter(
          (m) => m.accessoryEditable === true && (config.modules[m.id] || 0) > 0
        );
        if (editableSelected.length === 0) return null;

        return (
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '12px 16px 10px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 15 }}>🪄</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Interior Fittings
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  Swap the fitting inside each module — choose from matching options
                </div>
              </div>
            </div>

            {/* One row per accessoryEditable module */}
            {editableSelected.map((mod) => {
              // Get default slot from sections (the accessory section's slot value)
              const defaultSlotEntry = (mod.sections || []).find((s) => s.type === 'accessory');
              const defaultSlot = defaultSlotEntry?.slot ?? null;

              // IMPORTANT: strict slotType === 'accessory' — do NOT default null/undefined
              // to 'accessory', or hardware items (hinges, lift motors, etc.) will leak in.
              const matchingSlotType = 'accessory';

              // Filter Firestore accessories by strict slotType, then fall back to static catalogue
              const firestoreOpts = (activeAccessories || []).filter(
                (a) => a.slotType === matchingSlotType
              );
              const staticOpts = STATIC_ACCESSORIES.filter((a) => a.slotType === matchingSlotType);
              const matchingAccessories = firestoreOpts.length > 0 ? firestoreOpts : staticOpts;

              // Current selection: from state, or fall back to the default slot
              const currentId = moduleAccessories?.[mod.id] ?? defaultSlot ?? null;

              return (
                <div
                  key={mod.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {/* Module name */}
                  <div style={{ minWidth: 160, flex: '0 0 auto' }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.3,
                      }}
                    >
                      {mod.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        marginTop: 2,
                      }}
                    >
                      {mod.id}
                    </div>
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    Interior fitting:
                  </div>

                  {/* Pill selector */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchingAccessories.length === 0 ? (
                      <span
                        style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}
                      >
                        No fittings available yet (import catalogue first)
                      </span>
                    ) : (
                      matchingAccessories.map((acc) => {
                        const isSelected = currentId === acc.id;
                        return (
                          <button
                            key={acc.id}
                            onClick={() => actions.setModuleAccessory(mod.id, acc.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 99,
                              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                              background: isSelected ? 'var(--accent-light)' : 'var(--bg-primary)',
                              color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              fontFamily: 'var(--font-sans)',
                              whiteSpace: 'nowrap',
                            }}
                            title={acc.price ? `₹${acc.price.toLocaleString()}` : ''}
                          >
                            {acc.imageUrl && (
                              <img
                                src={acc.imageUrl}
                                alt=""
                                style={{
                                  width: 18,
                                  height: 18,
                                  borderRadius: 4,
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            {acc.name}
                            {isSelected && (
                              <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>✓</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Reset to default link */}
                  {currentId && currentId !== defaultSlot && (
                    <button
                      onClick={() => actions.setModuleAccessory(mod.id, null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'var(--font-sans)',
                        flexShrink: 0,
                      }}
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

export default StepModules;

import React, { useState } from 'react';
import { useConfig } from '../store/ConfigContext';
import { COLOURS, MATERIALS, HANDLES, LIGHTING, ACCESSORIES } from '../data/config.jsx';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { MODULES } from '../data/modules';

// ─── Reusable sub-components ──────────────────────────────────────────────────

const WALL_LABELS = {
  A: { label: 'Main', color: '#3b82f6' },
  B: { label: 'Left', color: '#8b5cf6' },
  C: { label: 'Right', color: '#06b6d4' },
};

function Section({ title, defaultOpen = true, accent = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: accent ? '#60a5fa' : 'rgba(255,255,255,0.7)',
          fontSize: 11,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {title}
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && <div style={{ padding: '0 20px 16px' }}>{children}</div>}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, unit = 'mm' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: '#60a5fa', fontWeight: 700 }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 5,
          borderRadius: 3,
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.12) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.12) 100%)`,
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          outline: 'none',
        }}
      />
    </div>
  );
}

function OptionRow({ label, subtitle, isSelected, onClick, swatch }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 11px',
        borderRadius: 8,
        border: isSelected ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
        background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
        color: isSelected ? '#93c5fd' : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 500,
        textAlign: 'left',
        transition: 'all 0.12s',
        fontFamily: 'var(--font-sans)',
        marginBottom: 4,
      }}
    >
      {swatch && (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            background: swatch,
            border: isSelected ? '2px solid #60a5fa' : '1.5px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
            {subtitle}
          </div>
        )}
      </div>
      {isSelected && <Check size={13} style={{ flexShrink: 0, color: '#60a5fa' }} />}
    </button>
  );
}

// ─── Wall type selector ────────────────────────────────────────────────────────
const WALL_TYPES = [
  { id: 'single', label: 'Single Wall', icon: '▬' },
  { id: 'l-shape', label: 'L-Shape', icon: '⌐' },
  { id: 'u-shape', label: 'U-Shape', icon: 'U' },
  { id: 'walkin', label: 'Walk-In', icon: '⬚' },
];

// ─── Main component ────────────────────────────────────────────────────────────
const FullscreenToolbar = ({ currentStep, viewMode, setViewMode, onClose }) => {
  const { config, actions, derived } = useConfig();
  const { totalModules, modulesList } = derived;

  const isMultiWall = config.wallType === 'l-shape' || config.wallType === 'u-shape';
  const availableWalls = config.wallType === 'u-shape' ? ['A', 'B', 'C'] : ['A', 'B'];

  return (
    <div style={{ color: 'white', fontFamily: 'var(--font-sans)', paddingBottom: 12 }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#3b82f6',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          ◈ Fullscreen Controls
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { id: '2d', label: '2D Blueprint' },
            { id: '3d', label: '3D Model' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode && setViewMode(m.id)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: 7,
                border:
                  viewMode === m.id
                    ? '1px solid rgba(59,130,246,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                background: viewMode === m.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                color: viewMode === m.id ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DIMENSIONS ────────────────────────────────────────────────── */}
      <Section title="Dimensions" defaultOpen={currentStep === 1}>
        {/* Wall type */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Layout Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {WALL_TYPES.map((wt) => {
              const isActive = config.wallType === wt.id;
              return (
                <button
                  key={wt.id}
                  onClick={() => actions.setDimension('wallType', wt.id)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 7,
                    border: isActive
                      ? '1px solid rgba(59,130,246,0.5)'
                      : '1px solid rgba(255,255,255,0.07)',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>{wt.icon}</span>
                  <span style={{ fontSize: 9 }}>{wt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Slider
          label="Width (Wall A)"
          value={config.width}
          min={600}
          max={5000}
          step={100}
          onChange={(v) => actions.setDimension('width', v)}
        />
        {isMultiWall && (
          <Slider
            label="Width (Wall B)"
            value={config.width2}
            min={300}
            max={3000}
            step={100}
            onChange={(v) => actions.setDimension('width2', v)}
          />
        )}
        {config.wallType === 'u-shape' && (
          <Slider
            label="Width (Wall C)"
            value={config.width3}
            min={300}
            max={3000}
            step={100}
            onChange={(v) => actions.setDimension('width3', v)}
          />
        )}
        <Slider
          label="Height"
          value={config.height}
          min={1800}
          max={3000}
          step={100}
          onChange={(v) => actions.setDimension('height', v)}
        />
        <Slider
          label="Depth"
          value={config.depth}
          min={300}
          max={800}
          step={50}
          onChange={(v) => actions.setDimension('depth', v)}
        />

        {/* Summary chip */}
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 7,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            fontSize: 11,
            color: '#60a5fa',
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {config.width}W {isMultiWall ? `· ${config.width2}B` : ''}{' '}
          {config.wallType === 'u-shape' ? `· ${config.width3}C` : ''} × {config.height}H ×{' '}
          {config.depth}D mm
        </div>
      </Section>

      {/* ── MODULES ───────────────────────────────────────────────────── */}
      <Section title={`Modules (${totalModules})`} defaultOpen={currentStep === 2}>
        {/* Current module list */}
        {modulesList.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              Selected
            </div>
            {modulesList.map((mod, idx) => {
              const wallInfo = isMultiWall ? WALL_LABELS[mod.wall || 'A'] : null;
              return (
                <div
                  key={mod.wallKey || `${mod.id}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 4,
                  }}
                >
                  {wallInfo && (
                    <div
                      style={{
                        width: 3,
                        height: 24,
                        borderRadius: 2,
                        background: wallInfo.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#e2e8f0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {mod.id}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{mod.width}mm</div>
                  </div>
                  {/* Wall pills for L/U */}
                  {isMultiWall && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      {availableWalls.map((w) => {
                        const wInfo = WALL_LABELS[w];
                        const isActive = (mod.wall || 'A') === w;
                        return (
                          <button
                            key={w}
                            onClick={() => actions.setModuleWall(mod.wallKey, w)}
                            style={{
                              padding: '2px 7px',
                              borderRadius: 4,
                              border: isActive
                                ? `1px solid ${wInfo.color}`
                                : '1px solid rgba(255,255,255,0.12)',
                              background: isActive ? `${wInfo.color}22` : 'transparent',
                              color: isActive ? wInfo.color : 'rgba(255,255,255,0.3)',
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: 'pointer',
                              letterSpacing: '0.06em',
                              transition: 'all 0.12s',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {w}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {/* Remove */}
                  <button
                    onClick={() => actions.setModuleQty(mod.id, -1)}
                    title="Remove one"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: 'rgba(239,68,68,0.7)',
                      cursor: 'pointer',
                      fontSize: 14,
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'monospace',
                    }}
                  >
                    −
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add modules quick-access */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            Add Module
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {MODULES.slice(0, 12).map((mod) => {
              const qty = config.modules[mod.id] || 0;
              return (
                <div
                  key={mod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 8px',
                    borderRadius: 7,
                    background: qty > 0 ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)',
                    border:
                      qty > 0
                        ? '1px solid rgba(59,130,246,0.2)'
                        : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: qty > 0 ? '#93c5fd' : 'rgba(255,255,255,0.55)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {mod.id}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                      {mod.width}mm
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {qty > 0 && (
                      <button
                        onClick={() => actions.setModuleQty(mod.id, -1)}
                        style={{
                          ...smallBtn,
                          color: 'rgba(239,68,68,0.7)',
                          borderColor: 'rgba(239,68,68,0.25)',
                        }}
                      >
                        −
                      </button>
                    )}
                    {qty > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#60a5fa',
                          minWidth: 14,
                          textAlign: 'center',
                        }}
                      >
                        {qty}
                      </span>
                    )}
                    <button
                      onClick={() => actions.setModuleQty(mod.id, 1)}
                      style={{
                        ...smallBtn,
                        color: '#60a5fa',
                        borderColor: 'rgba(59,130,246,0.35)',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── FINISHES & COLOUR ─────────────────────────────────────────── */}
      <Section title="Finishes & Colour" defaultOpen={currentStep === 3}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Material
          </div>
          {MATERIALS.map((m) => (
            <OptionRow
              key={m.id}
              label={m.name}
              isSelected={config.material.id === m.id}
              onClick={() => actions.setFinish('material', m)}
            />
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Colour
          </div>
          {COLOURS.map((c, i) => (
            <OptionRow
              key={i}
              label={c.name}
              swatch={c.hex}
              isSelected={config.colour.name === c.name}
              onClick={() => actions.setFinish('colour', c)}
            />
          ))}
        </div>
      </Section>

      {/* ── HARDWARE ──────────────────────────────────────────────────── */}
      <Section title="Hardware & Accessories" defaultOpen={currentStep === 4}>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Handles
          </div>
          {HANDLES.map((h) => (
            <OptionRow
              key={h.name}
              label={h.name}
              isSelected={config.handle.name === h.name}
              onClick={() => actions.setFinish('handle', h)}
            />
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Lighting
          </div>
          {LIGHTING.map((l) => (
            <OptionRow
              key={l.name}
              label={l.name}
              isSelected={config.lighting.name === l.name}
              onClick={() => actions.setFinish('lighting', l)}
            />
          ))}
        </div>
        <div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 8,
            }}
          >
            Accessories
          </div>
          {ACCESSORIES.map((acc) => {
            const isSelected = config.selectedAccessories.has(acc.id);
            return (
              <OptionRow
                key={acc.id}
                label={acc.name}
                isSelected={isSelected}
                onClick={() => actions.toggleAccessory(acc.id)}
              />
            );
          })}
        </div>
      </Section>

      {/* ── SUMMARY ───────────────────────────────────────────────────── */}
      <Section title="Summary" defaultOpen={currentStep === 5} accent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            {
              label: 'Dimensions',
              value: `${config.width}W × ${config.height}H × ${config.depth}D mm`,
            },
            {
              label: 'Layout',
              value: WALL_TYPES.find((w) => w.id === config.wallType)?.label || 'Single Wall',
            },
            { label: 'Modules', value: `${totalModules} selected` },
            { label: 'Material', value: config.material?.name },
            { label: 'Colour', value: config.colour?.name },
            { label: 'Handles', value: config.handle?.name },
            { label: 'Lighting', value: config.lighting?.name },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600, textAlign: 'right' }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Total price */}
        {derived.valuation?.totalPrice > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#60a5fa',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Estimated Price
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
              ₹{derived.valuation.totalPrice.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
};

const smallBtn = {
  width: 22,
  height: 22,
  borderRadius: 5,
  border: '1px solid',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: 15,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'monospace',
  transition: 'all 0.1s',
};

export default FullscreenToolbar;

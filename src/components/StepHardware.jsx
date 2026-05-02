import React, { useState } from 'react';
import { HANDLES, LIGHTING, ACCESSORIES, BRANDS } from '../data/config.jsx';
import { useConfig } from '../store/ConfigContext';
import { useToast } from './ToastProvider';
import { Check, ChevronDown } from 'lucide-react';

/* ─────────────────────────────────────────────
   Accordion primitives
   Level 1: exclusive (only one open at a time)
   Level 2: independent per sub-folder
───────────────────────────────────────────── */

/** Shared animated accordion body */
const AccordionBody = ({ open, children }) => (
  <div
    style={{
      maxHeight: open ? 9999 : 0,
      overflow: 'hidden',
      transition: 'max-height 220ms ease-in-out',
    }}
  >
    {children}
  </div>
);

/** Level 1 header — larger font, full-width click target */
const L1Header = ({ label, open, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      background: open ? 'var(--accent-light)' : 'var(--bg-primary)',
      border: 'none',
      borderRadius: open ? '8px 8px 0 0' : 8,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'background 0.15s',
    }}
    onMouseEnter={(e) => {
      if (!open) e.currentTarget.style.background = 'var(--bg-tertiary)';
    }}
    onMouseLeave={(e) => {
      if (!open) e.currentTarget.style.background = 'var(--bg-primary)';
    }}
  >
    <span
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: open ? 'var(--accent)' : 'var(--text-primary)',
      }}
    >
      {label}
    </span>
    <ChevronDown
      size={15}
      color={open ? 'var(--accent)' : 'var(--text-muted)'}
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
    />
  </button>
);

/** Level 2 header — smaller font, indented */
const L2Header = ({ label, open, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '7px 10px 7px 14px',
      background: 'transparent',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      transition: 'background 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--bg-tertiary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </span>
    <ChevronDown
      size={12}
      color="var(--text-muted)"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
    />
  </button>
);

/* ─────────────────────────────────────────────
   Option card — compact 2-col grid item
───────────────────────────────────────────── */
const OptionCard = ({ item, isSelected, onClick }) => (
  <button
    onClick={onClick}
    aria-label={`Select ${item.name}`}
    style={{
      padding: '10px 8px',
      borderRadius: 8,
      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
      background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 6,
      transition: 'all 0.15s',
      textAlign: 'left',
      fontFamily: 'var(--font-sans)',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 7,
        background: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: isSelected ? '#ffffff' : 'var(--text-primary)',
      }}
    >
      <span>{item.icon}</span>
    </div>
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
          lineHeight: 1.3,
        }}
      >
        {item.name}
      </div>
      <div
        style={{
          fontSize: 10,
          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
          marginTop: 2,
          lineHeight: 1.3,
        }}
      >
        {item.sub}
      </div>
    </div>
  </button>
);

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const StepHardware = () => {
  const { config, actions } = useConfig();
  const { addToast } = useToast();
  const { handle, lighting, brand, selectedAccessories } = config;

  // Level 1: exclusive — 'hardware' | 'accessories'
  const [l1Open, setL1Open] = useState('hardware');
  const toggleL1 = (key) => setL1Open((prev) => (prev === key ? null : key));

  // Level 2: independent booleans inside Hardware
  const [brandOpen, setBrandOpen] = useState(true);
  const [handlesOpen, setHandlesOpen] = useState(true);
  const [lightingOpen, setLightingOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* ── Level 1: Hardware ── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}
      >
        <L1Header
          label="Hardware"
          open={l1Open === 'hardware'}
          onToggle={() => toggleL1('hardware')}
        />

        <AccordionBody open={l1Open === 'hardware'}>
          <div
            style={{
              borderTop: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* ── L2: Hardware Brand ── */}
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <L2Header
                label="Hardware Brand"
                open={brandOpen}
                onToggle={() => setBrandOpen((v) => !v)}
              />
              <AccordionBody open={brandOpen}>
                <div style={{ padding: '0 10px 12px 14px' }}>
                  {/* 3×2 brand grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {BRANDS.map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          actions.setFinish('brand', b);
                          addToast(`Brand changed to ${b}`, 'success');
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 7,
                          border: `1.5px solid ${brand === b ? 'var(--accent)' : 'var(--border)'}`,
                          background: brand === b ? 'var(--accent-light)' : 'var(--bg-secondary)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 11,
                          textAlign: 'center',
                          color: brand === b ? 'var(--accent)' : 'var(--text-primary)',
                          transition: 'all 0.15s',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                  {/* View brand details link — replaces media placeholder */}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    style={{
                      fontSize: 11,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    View brand details →
                  </a>
                </div>
              </AccordionBody>
            </div>

            {/* ── L2: Handles ── */}
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <L2Header
                label="Handles"
                open={handlesOpen}
                onToggle={() => setHandlesOpen((v) => !v)}
              />
              <AccordionBody open={handlesOpen}>
                <div style={{ padding: '0 10px 12px 14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {HANDLES.map((h) => (
                      <OptionCard
                        key={h.name}
                        item={h}
                        isSelected={handle.name === h.name}
                        onClick={() => {
                          actions.setFinish('handle', h);
                          addToast(`Handle changed to ${h.name}`, 'success');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </AccordionBody>
            </div>

            {/* ── L2: Lighting ── */}
            <div>
              <L2Header
                label="Lighting"
                open={lightingOpen}
                onToggle={() => setLightingOpen((v) => !v)}
              />
              <AccordionBody open={lightingOpen}>
                <div style={{ padding: '0 10px 12px 14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {LIGHTING.map((l) => (
                      <OptionCard
                        key={l.name}
                        item={l}
                        isSelected={lighting.name === l.name}
                        onClick={() => {
                          actions.setFinish('lighting', l);
                          addToast(`Lighting changed to ${l.name}`, 'success');
                        }}
                      />
                    ))}
                  </div>
                </div>
              </AccordionBody>
            </div>
          </div>
        </AccordionBody>
      </div>

      {/* ── Level 1: Accessories ── */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--bg-primary)',
        }}
      >
        <L1Header
          label="Accessories"
          open={l1Open === 'accessories'}
          onToggle={() => toggleL1('accessories')}
        />

        <AccordionBody open={l1Open === 'accessories'}>
          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 10px 12px' }}>
            {/* Section label */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 4px 8px',
              }}
            >
              Internal Add-ons
            </div>

            {/* Vertical checkbox list — all items from ACCESSORIES data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ACCESSORIES.map((acc) => {
                const isSelected = selectedAccessories.has(acc.id);
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      actions.toggleAccessory(acc.id);
                      addToast(isSelected ? `${acc.name} removed` : `${acc.name} added`, 'success');
                    }}
                    aria-label={`${isSelected ? 'Remove' : 'Add'} ${acc.name} accessory`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 10px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                      width: '100%',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        flexShrink: 0,
                        background: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      }}
                    >
                      <span>{acc.icon}</span>
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                          lineHeight: 1.3,
                        }}
                      >
                        {acc.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                          marginTop: 1,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {acc.desc}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        flexShrink: 0,
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      {isSelected && <Check size={11} color="white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </AccordionBody>
      </div>
    </div>
  );
};

export default StepHardware;

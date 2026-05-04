import React, { useEffect, useRef, useMemo } from 'react';
import { MODULES } from '../data/modules';
import { ACCESSORIES } from '../data/config.jsx';
import { drawBlueprintLight } from '../utils/visuals';
import { getDerivedState } from '../utils/engine';

// ── Shared font constant ────────────────────────────────────────────
const SF = '"Arial", sans-serif';

// ── Sub-components declared OUTSIDE PrintQuote to satisfy ESLint ────

const PQDivider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid #1a1a1a', margin: '0 0 12px 0' }} />
);

const PQSectionTitle = ({ text }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: '#1a1a1a',
        textTransform: 'uppercase',
        marginBottom: 6,
        fontFamily: SF,
      }}
    >
      {text}
    </div>
    <PQDivider />
  </div>
);

const PQSpecRow = ({ label, value }) => (
  <div style={{ display: 'flex', fontSize: 11, color: '#222', marginBottom: 5, fontFamily: SF }}>
    <span style={{ width: 180, flexShrink: 0, color: '#555' }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);

const PQTableHeader = ({ children, align = 'left' }) => (
  <th
    style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#1a1a1a',
      padding: '8px 10px',
      textAlign: align,
      borderBottom: '1px solid #1a1a1a',
      fontFamily: SF,
      background: 'transparent',
    }}
  >
    {children}
  </th>
);

const PQTableCell = ({ children, align = 'left', bold = false }) => (
  <td
    style={{
      fontSize: 11,
      color: bold ? '#1a1a1a' : '#444',
      padding: '7px 10px',
      textAlign: align,
      fontWeight: bold ? 700 : 400,
      borderBottom: '1px solid #e5e5e5',
      fontFamily: SF,
    }}
  >
    {children}
  </td>
);

const PQPageHeader = ({ today, projectName }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 36,
    }}
  >
    <div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: '#1a1a1a',
          fontFamily: SF,
        }}
      >
        Summary of Configuration
      </div>
      {projectName && (
        <div
          style={{
            fontSize: 13,
            color: '#333',
            marginTop: 4,
            fontWeight: 600,
            fontFamily: SF,
          }}
        >
          {projectName}
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          color: '#666',
          marginTop: 4,
          letterSpacing: '0.05em',
          fontFamily: SF,
        }}
      >
        Generated: {today}
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#1a1a1a',
          fontFamily: SF,
        }}
      >
        nirman<span style={{ color: '#3b82f6' }}>book</span>
      </div>
      <div
        style={{
          fontSize: 9,
          color: '#888',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: 2,
          fontFamily: SF,
        }}
      >
        Wardrobe Configurator
      </div>
    </div>
  </div>
);

const PQPageFooter = ({ today }) => (
  <div
    style={{
      borderTop: '1px solid #1a1a1a',
      paddingTop: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <div style={{ fontSize: 9, color: '#888', fontFamily: SF, letterSpacing: '0.05em' }}>
      Quote valid for 30 days from issue date · {today}
    </div>
    <div style={{ fontSize: 9, color: '#888', fontFamily: SF }}>www.nirmanbook.com</div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────

/**
 * PrintQuote — Premium raumplus-style PDF layout
 * Page 1: Summary (specs + BOM + total + technical notes)
 * Page 2: Full A4 2D Layout Plan (blueprint — never cut or overlapped)
 *
 * Rendered off-screen and captured by html2canvas for PDF export.
 */
const PrintQuote = React.forwardRef(function PrintQuote(
  { config, boqItems, valuation, totalModulesCount, view3dImageUrl },
  ref
) {
  const blueprintRef = useRef(null);

  const accessories = useMemo(
    () =>
      Array.from(config.selectedAccessories || new Set())
        .map((id) => ACCESSORIES.find((a) => a.id === id))
        .filter(Boolean),
    [config.selectedAccessories]
  );

  const moduleRows = useMemo(
    () =>
      Object.entries(config.modules || {})
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const mod = MODULES.find((m) => m.id === id);
          if (!mod) return null;
          const rate = mod.basePrice * (config.material?.multiplier || 1);
          return { id, name: mod.name, qty, rate, total: rate * qty };
        })
        .filter(Boolean),
    [config.modules, config.material]
  );

  const modulesList = useMemo(() => getDerivedState(config).modulesList, [config]);

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Draw 2D blueprint on Page 2 canvas whenever config/modules change
  useEffect(() => {
    if (!blueprintRef.current) return;
    const canvas = blueprintRef.current;
    const cw = 682; // A4 content width (794 - 2×56 padding)
    const ch = 520;
    const dpr = 2;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fafbfc';
    ctx.fillRect(0, 0, cw, ch);
    drawBlueprintLight(ctx, cw, ch, config, modulesList);
  }, [config, modulesList]);

  return (
    <div
      ref={ref}
      data-print-target="true"
      style={{ width: 794, background: '#ffffff', fontFamily: SF, color: '#1a1a1a' }}
    >
      {/* ══════════════════════════════════════════════════
          PAGE 1 — Configuration Summary
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          width: 794,
          minHeight: 1123,
          background: '#ffffff',
          padding: '48px 56px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PQPageHeader today={today} projectName={config.projectInfo?.name} />

        {/* PROJECT */}
        <PQSectionTitle text="Project" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 40px',
            marginBottom: 28,
          }}
        >
          <div>
            <PQSpecRow label="Project Name" value={config.projectInfo?.name || '—'} />
            <PQSpecRow label="Project Type" value={config.projectInfo?.type || '—'} />
          </div>
          <div>
            <PQSpecRow label="City" value={config.projectInfo?.city || '—'} />
            <PQSpecRow label="Start Date" value={config.projectInfo?.startDate || '—'} />
          </div>
        </div>

        {/* ROOM & DIMENSIONS */}
        <PQSectionTitle text="Room & Dimensions" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 40px',
            marginBottom: 28,
          }}
        >
          <div>
            <PQSpecRow
              label="Layout Type"
              value={(config.wallType || 'single').replace('-', ' ').toUpperCase()}
            />
            <PQSpecRow label="Room Width" value={`${config.width || 0} mm`} />
            <PQSpecRow label="Wardrobe Height" value={`${config.height || 0} mm`} />
          </div>
          <div>
            <PQSpecRow label="Internal Depth" value={`${config.depth || 0} mm`} />
            <PQSpecRow label="Total Modules" value={`${totalModulesCount} units`} />
          </div>
        </div>

        {/* MATERIALS & FINISHES */}
        <PQSectionTitle text="Materials & Finishes" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 40px',
            marginBottom: 28,
          }}
        >
          <div>
            <PQSpecRow label="Core Material" value={config.material?.name || '—'} />
            <PQSpecRow label="Grade Multiplier" value={`${config.material?.multiplier || 1}x`} />
            <PQSpecRow label="Fascia Style" value={config.fascia || '—'} />
          </div>
          <div>
            <PQSpecRow label="Colour Tone" value={config.colour?.name || '—'} />
            <PQSpecRow label="Colour Sub-type" value={config.colour?.sub || '—'} />
          </div>
        </div>

        {/* HARDWARE & LIGHTING */}
        <PQSectionTitle text="Hardware & Lighting" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0 40px',
            marginBottom: 28,
          }}
        >
          <div>
            <PQSpecRow label="Hardware Brand" value={config.brand || '—'} />
            <PQSpecRow label="Handle Type" value={config.handle?.name || '—'} />
            <PQSpecRow label="Handle Spec" value={config.handle?.sub || '—'} />
          </div>
          <div>
            <PQSpecRow label="Lighting" value={config.lighting?.name || '—'} />
            <PQSpecRow label="Lighting Spec" value={config.lighting?.sub || '—'} />
          </div>
        </div>

        {/* BILL OF MATERIALS */}
        <PQSectionTitle text="Bill of Materials" />
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
          <thead>
            <tr>
              <PQTableHeader>Item</PQTableHeader>
              <PQTableHeader>Module ID</PQTableHeader>
              <PQTableHeader align="center">Qty</PQTableHeader>
              <PQTableHeader align="right">Unit Rate</PQTableHeader>
              <PQTableHeader align="right">Total</PQTableHeader>
            </tr>
          </thead>
          <tbody>
            {moduleRows.map((row, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={i}>
                <PQTableCell>{row.name}</PQTableCell>
                <PQTableCell>{row.id}</PQTableCell>
                <PQTableCell align="center">{row.qty}</PQTableCell>
                <PQTableCell align="right">₹{row.rate.toLocaleString()}</PQTableCell>
                <PQTableCell align="right" bold>
                  ₹{row.total.toLocaleString()}
                </PQTableCell>
              </tr>
            ))}
            <tr>
              <PQTableCell>Handle Set</PQTableCell>
              <PQTableCell>{config.handle?.name || '—'}</PQTableCell>
              <PQTableCell align="center">{totalModulesCount}</PQTableCell>
              <PQTableCell align="right">
                ₹{(config.handle?.price || 0).toLocaleString()}
              </PQTableCell>
              <PQTableCell align="right" bold>
                ₹{((config.handle?.price || 0) * totalModulesCount).toLocaleString()}
              </PQTableCell>
            </tr>
            {(config.lighting?.price || 0) > 0 && (
              <tr>
                <PQTableCell>Ambience Lighting</PQTableCell>
                <PQTableCell>{config.lighting?.name || '—'}</PQTableCell>
                <PQTableCell align="center">1</PQTableCell>
                <PQTableCell align="right">
                  ₹{(config.lighting?.price || 0).toLocaleString()}
                </PQTableCell>
                <PQTableCell align="right" bold>
                  ₹{(config.lighting?.price || 0).toLocaleString()}
                </PQTableCell>
              </tr>
            )}
            {accessories.map((acc, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <tr key={`acc-${i}`}>
                <PQTableCell>{acc.name}</PQTableCell>
                <PQTableCell>{acc.desc}</PQTableCell>
                <PQTableCell align="center">1</PQTableCell>
                <PQTableCell align="right">₹{acc.price.toLocaleString()}</PQTableCell>
                <PQTableCell align="right" bold>
                  ₹{acc.price.toLocaleString()}
                </PQTableCell>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: '8px 10px',
                  fontSize: 11,
                  color: '#555',
                  textAlign: 'right',
                  borderTop: '1px solid #ccc',
                  fontFamily: SF,
                }}
              >
                Modules Subtotal
              </td>
              <td
                style={{
                  padding: '8px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  textAlign: 'right',
                  borderTop: '1px solid #ccc',
                  fontFamily: SF,
                }}
              >
                ₹{valuation.modulesSubtotal?.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  color: '#555',
                  textAlign: 'right',
                  fontFamily: SF,
                }}
              >
                Accessories &amp; Hardware
              </td>
              <td
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  textAlign: 'right',
                  fontFamily: SF,
                }}
              >
                ₹{valuation.accessoriesTotal?.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* TOTAL PRICE — dark hero banner */}
        <div
          style={{
            background: '#1a1a1a',
            borderRadius: 4,
            padding: '20px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 4,
                fontFamily: SF,
              }}
            >
              Total Project Quote
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: SF }}>
              Inclusive of all modules, hardware &amp; accessories
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              fontFamily: SF,
            }}
          >
            ₹{valuation.total?.toLocaleString()}
          </div>
        </div>

        {/* TECHNICAL NOTES */}
        <PQSectionTitle text="Technical Notes" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px 40px',
            marginBottom: 28,
          }}
        >
          {[
            '18mm high-density calibrated panel core',
            '2mm impact-resistant PVC edge banding',
            'Pricing based on modular unit baseline',
            'Site-specific assembly factors may apply',
            'Pricing valid for 30 days from issue date',
            'All dimensions in millimetres (mm)',
          ].map((note, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <div
              key={i}
              style={{
                fontSize: 10,
                color: '#555',
                padding: '3px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                fontFamily: SF,
              }}
            >
              <span style={{ color: '#1a1a1a', fontWeight: 700, flexShrink: 0 }}>·</span>
              {note}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <PQPageFooter today={today} />
      </div>

      {/* ══════════════════════════════════════════════════
          PAGE 2 — Full 2D Layout Plan
          Exactly A4 height — blueprint canvas fills 100%
          of remaining space, never cut or overlapped.
          ══════════════════════════════════════════════════ */}
      <div
        style={{
          width: 794,
          height: 1123,
          background: '#ffffff',
          padding: '48px 56px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PQPageHeader today={today} />

        <PQSectionTitle text="2D Layout Plan" />

        {/* Spec pills */}
        <div style={{ display: 'flex', gap: 36, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Layout',
              value: (config.wallType || 'single').replace('-', ' ').toUpperCase(),
            },
            { label: 'Width', value: `${config.width || 0} mm` },
            { label: 'Height', value: `${config.height || 0} mm` },
            { label: 'Depth', value: `${config.depth || 0} mm` },
            { label: 'Modules', value: `${totalModulesCount} units` },
            { label: 'Material', value: config.material?.name || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#888',
                  marginBottom: 3,
                  fontFamily: SF,
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: SF }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Blueprint canvas — fills all remaining vertical space */}
        <div
          style={{
            flex: 1,
            background: '#fafbfc',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <canvas
            ref={blueprintRef}
            style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>

        {/* Caption */}
        <div
          style={{
            fontSize: 10,
            color: '#888',
            textAlign: 'center',
            marginBottom: 20,
            fontStyle: 'italic',
            fontFamily: SF,
          }}
        >
          Front elevation — schematic representation. Patterns are indicative and may not reflect
          exact proportions.
        </div>

        <PQPageFooter today={today} />
      </div>

      {/* ══════════════════════════════════════════════════
          PAGE 3 — 3D Front View (only when captured)
          ══════════════════════════════════════════════════ */}
      {view3dImageUrl && (
        <div
          style={{
            width: 794,
            height: 1123,
            background: '#ffffff',
            padding: '48px 56px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PQPageHeader today={today} projectName={config.projectInfo?.name} />

          <PQSectionTitle text="3D Front View Visualization" />

          {/* Spec pills */}
          <div style={{ display: 'flex', gap: 36, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Colour', value: config.colour?.name || '—' },
              { label: 'Material', value: config.material?.name || '—' },
              { label: 'Fascia', value: config.fascia || '—' },
              { label: 'Modules', value: `${totalModulesCount} units` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#888',
                    marginBottom: 3,
                    fontFamily: SF,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: SF }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* 3D screenshot — fills remaining space */}
          <div
            style={{
              flex: 1,
              background: '#0d1117',
              borderRadius: 8,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              border: '1px solid #e5e7eb',
            }}
          >
            <img
              src={view3dImageUrl}
              alt="3D Wardrobe Front View"
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Caption */}
          <div
            style={{
              fontSize: 10,
              color: '#888',
              textAlign: 'center',
              marginBottom: 20,
              fontStyle: 'italic',
              fontFamily: SF,
            }}
          >
            Interactive 3D visualization — perspective view. Rendered from the configured modules,
            materials, and finishes.
          </div>

          <PQPageFooter today={today} />
        </div>
      )}
    </div>
  );
});

export default PrintQuote;

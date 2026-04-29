import React, { useMemo, useRef, useState, useCallback } from 'react';
import { MODULES } from '../data/modules';
import { ACCESSORIES } from '../data/config';
import {
  Printer,
  Download,
  Share2,
  FileJson,
  FileText,
  Check,
  Loader2,
  Bookmark,
  RefreshCw,
} from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { useConfig } from '../store/ConfigContext';
import { handlePrint, generatePDF, exportQuoteJSON, exportTextSummary } from '../utils/export';
import { saveConfig, updateConfig, getConfigs, clearDraft } from '../utils/storage';
import { drawBlueprintLight } from '../utils/visuals';

import SaveDesignModal from './SaveDesignModal';
import { useToast } from './ToastProvider';

/* ── tiny hook: manage per-button loading + success state ── */
function useActionState() {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done'
  const trigger = useCallback(async (asyncFn) => {
    setState('loading');
    try {
      await asyncFn();
      setState('done');
      setTimeout(() => setState('idle'), 2200);
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  }, []);
  return [state, trigger];
}

/* ── ActionButton: handles loading + success visuals ── */
const ActionButton = ({
  label,
  loadingLabel = 'Processing…',
  doneLabel,
  icon: Icon,
  doneIcon: DoneIcon = Check,
  onClick,
  variant = 'ghost', // 'ghost' | 'primary'
  style: extraStyle = {},
}) => {
  const [state, trigger] = useActionState();
  const isLoading = state === 'loading';
  const isDone = state === 'done';

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: isLoading ? 'wait' : 'pointer',
    transition: 'all 0.18s',
    fontFamily: 'var(--font-sans)',
    border: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    opacity: isLoading ? 0.75 : 1,
    ...(variant === 'ghost'
      ? {
          background: 'var(--bg-secondary)',
          color: isDone ? 'var(--success)' : 'var(--text-primary)',
          border: `1px solid ${isDone ? 'var(--success)' : 'var(--border)'}`,
          boxShadow: 'var(--shadow-xs)',
        }
      : {
          background: isDone ? 'var(--success)' : 'var(--accent)',
          color: 'white',
          boxShadow: 'var(--shadow-sm)',
        }),
    ...extraStyle,
  };

  const CurrentIcon = isLoading ? Loader2 : isDone ? DoneIcon : Icon;
  const currentLabel = isLoading ? loadingLabel : isDone ? (doneLabel ?? label) : label;

  return (
    <button
      style={baseStyle}
      disabled={isLoading}
      onClick={() => trigger(onClick)}
      aria-label={label}
    >
      <CurrentIcon size={15} style={isLoading ? { animation: 'spin 0.8s linear infinite' } : {}} />
      {currentLabel}
    </button>
  );
};

/* ══════════════════════════════════════════
   StepBOQ — Quote Summary + Export Page
   ══════════════════════════════════════════ */
const StepBOQ = ({ activeConfigId, setActiveConfigId, onRefreshCount }) => {
  const { config, derived } = useConfig();
  const { isMobile } = useResponsive();
  const { valuation } = derived;
  const printRef = useRef(null);
  const canvasRef = useRef(null);
  const { addToast } = useToast();

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const cw = 700; // Fixed width for high quality print
    const ch = 450; // Fixed height

    const dpr = 2; // High resolution for PDF
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Fill white background for print
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    drawBlueprintLight(ctx, cw, ch, config, derived.modulesList);
  }, [config, derived.modulesList]);

  /* ── Save modal state ── */
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingNames, setExistingNames] = useState([]);

  const openSaveModal = () => {
    setExistingNames(getConfigs().map((c) => c.name));
    setShowSaveModal(true);
  };

  const handleSaveName = (name) => {
    const newList = saveConfig({ name, configState: config, totalPrice: valuation.total });
    const saved = newList[0]; // newest is first
    if (setActiveConfigId) setActiveConfigId(saved.id);
    setShowSaveModal(false);
    clearDraft(); // draft is now a named save — remove the auto-draft
    addToast(`“${name}” saved successfully`, 'success');
    if (onRefreshCount) onRefreshCount();
  };

  /* ── Update with visual confirmation ── */
  const [updateDone, setUpdateDone] = useState(false);
  const handleUpdate = () => {
    if (!activeConfigId) return;
    const list = getConfigs();
    const current = list.find((c) => c.id === activeConfigId);
    updateConfig(activeConfigId, config, valuation.total);
    setUpdateDone(true);
    setTimeout(() => setUpdateDone(false), 2500);
    addToast(
      `“${current?.name ?? 'Design'}” updated — your latest changes have been saved`,
      'success'
    );
  };

  /* ── Accessories list ── */
  const accessories = useMemo(
    () => Array.from(config.selectedAccessories).map((id) => ACCESSORIES.find((a) => a.id === id)),
    [config.selectedAccessories]
  );

  /* ── Module count ── */
  const totalModulesCount = useMemo(
    () => Object.values(config.modules).reduce((a, b) => a + b, 0),
    [config.modules]
  );

  /* ── BOQ rows ── */
  const boqItems = useMemo(() => {
    const moduleRows = Object.entries(config.modules)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const mod = MODULES.find((m) => m.id === id);
        const rate = mod.basePrice * config.material.multiplier;
        return {
          category: 'Wardrobe Module',
          name: mod.name,
          desc: `${mod.id} — ${config.material.name}`,
          qty,
          rate,
          total: rate * qty,
          status: 'Active',
        };
      });

    const hardwareRows = [
      {
        category: 'Hardware',
        name: 'Handle Set',
        desc: `${config.handle.name} (${config.handle.sub})`,
        qty: totalModulesCount,
        rate: config.handle.price,
        total: config.handle.price * totalModulesCount,
        status: 'Active',
      },
      {
        category: 'Lighting',
        name: 'Ambience Lighting',
        desc: config.lighting.name,
        qty: 1,
        rate: config.lighting.price,
        total: config.lighting.price,
        status: config.lighting.price > 0 ? 'Active' : 'Not included',
      },
    ];

    const accRows = accessories.map((a) => ({
      category: 'Accessory',
      name: a.name,
      desc: a.desc,
      qty: 1,
      rate: a.price,
      total: a.price,
      status: 'Active',
    }));

    return [...moduleRows, ...hardwareRows, ...accRows];
  }, [config, accessories, totalModulesCount]);

  /* ── Shared export payload ── */
  const exportPayload = { config, boqItems, valuation, totalModulesCount };

  const mainContent = (
    <>
      {/* Spinner keyframe injected inline so it works without extra CSS */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
        className="animate-fade-in"
      >
        {/* ── Header with action buttons ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Quote Summary
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              A full breakdown of your selected configuration and pricing.
            </p>
          </div>

          {/* ── Action Buttons Row ── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* SAVE / UPDATE */}
            {activeConfigId ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 4,
                }}
              >
                <button
                  id="boq-update-design-btn"
                  onClick={handleUpdate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    border: `1px solid ${updateDone ? '#16a34a' : 'var(--border)'}`,
                    background: updateDone ? '#f0fdf4' : 'var(--bg-secondary)',
                    color: updateDone ? '#16a34a' : 'var(--text-primary)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  {updateDone ? <Check size={15} /> : <RefreshCw size={15} />}
                  {updateDone ? 'Updated ✓' : 'Update Design'}
                </button>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 2 }}>
                  Overwrites the saved version
                </span>
              </div>
            ) : (
              <button
                id="boq-save-design-btn"
                onClick={openSaveModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  border: '1px solid var(--accent-border)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-light)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
                }}
              >
                <Bookmark size={14} />
                Save Design
              </button>
            )}
            {/* PRINT */}
            <ActionButton
              label="Print"
              icon={Printer}
              doneLabel="Sent to Printer"
              variant="ghost"
              onClick={async () => handlePrint()}
            />

            {/* EXPORT PDF */}
            <ActionButton
              label="Export PDF"
              loadingLabel="Generating…"
              doneLabel="PDF Downloaded"
              icon={Download}
              variant="primary"
              onClick={() => generatePDF(printRef.current)}
            />

            {/* EXPORT JSON */}
            <ActionButton
              label="Export Quote"
              loadingLabel="Exporting…"
              doneLabel="Quote Exported"
              icon={FileJson}
              variant="ghost"
              onClick={async () => exportQuoteJSON(exportPayload)}
            />

            {/* EXPORT TEXT SUMMARY */}
            <ActionButton
              label="Text Summary"
              loadingLabel="Generating…"
              doneLabel="Downloaded"
              icon={FileText}
              variant="ghost"
              onClick={async () => exportTextSummary(exportPayload)}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════
            PRINTABLE / CAPTURABLE CONTAINER
            data-print-target + ref for PDF capture
            ═══════════════════════════════════════ */}
        <div
          ref={printRef}
          data-print-target="true"
          className="print-zone"
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* ── Print header (hidden on screen) ── */}
          <div className="print-only" style={{ display: 'none', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: '#3b82f6',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>N</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.03em' }}>
                NirmanBook Wardrobe Configurator
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              Quote generated on{' '}
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* ── Spec pills ── */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              gap: 32,
              flexWrap: 'wrap',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {[
              {
                label: 'Material',
                value: `${config.material.name} (${config.material.multiplier}x)`,
              },
              { label: 'Depth × Height', value: `${config.depth} mm × ${config.height} mm` },
              { label: 'Width', value: `${config.width} mm` },
              { label: 'Total Modules', value: `${totalModulesCount} units` },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* ── 2D Blueprint ── */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <h4
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 16,
                alignSelf: 'flex-start',
              }}
            >
              2D Layout Plan
            </h4>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* ── BOM Table ── */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['Item', 'Details', 'Qty', 'Rate', 'Total'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 18px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        textAlign: i >= 2 ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boqItems.map((item, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < boqItems.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: 3,
                        }}
                      >
                        {item.category}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                      </div>
                      {item.status === 'Not included' && (
                        <span
                          style={{
                            marginTop: 4,
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 600,
                            background: '#fef2f2',
                            color: '#ef4444',
                            padding: '2px 7px',
                            borderRadius: 4,
                          }}
                        >
                          Not included
                        </span>
                      )}
                    </td>
                    <td
                      style={{ padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)' }}
                    >
                      {item.desc}
                    </td>
                    <td
                      style={{
                        padding: '14px 18px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textAlign: 'right',
                      }}
                    >
                      {item.qty}
                    </td>
                    <td
                      style={{
                        padding: '14px 18px',
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        textAlign: 'right',
                      }}
                    >
                      ₹{item.rate.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '14px 18px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textAlign: 'right',
                      }}
                    >
                      ₹{item.total.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td
                    colSpan={4}
                    style={{
                      padding: '14px 18px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    Modules Subtotal
                  </td>
                  <td
                    style={{
                      padding: '14px 18px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    ₹{valuation.modulesSubtotal.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px 18px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    Accessories &amp; Hardware
                  </td>
                  <td
                    style={{
                      padding: '10px 18px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textAlign: 'right',
                    }}
                  >
                    ₹{valuation.accessoriesTotal.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ background: 'var(--accent)' }}>
                  <td
                    colSpan={4}
                    style={{
                      padding: '18px 18px',
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.75)',
                      textAlign: 'right',
                      fontWeight: 600,
                    }}
                  >
                    Total Project Quote
                  </td>
                  <td
                    style={{
                      padding: '18px 18px',
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'white',
                      textAlign: 'right',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    ₹{valuation.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Bottom cards ── */}
          <div
            className="print-cards-grid"
            style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}
          >
            {/* Technical Notes */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 14,
                }}
              >
                Technical Notes
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  '18mm high-density calibrated panel core',
                  '2mm impact-resistant PVC edge banding',
                  'Pricing based on modular unit baseline',
                  'Site-specific assembly factors may apply',
                  'Pricing valid for 30 days from issue date',
                ].map((note, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
                      ·
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA / Export Card */}
            <div
              className="print-cta-card"
              style={{
                background: 'var(--accent-light)',
                border: '1.5px solid var(--accent-border)',
                borderRadius: 12,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div>
                <h4
                  style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}
                >
                  Ready to Proceed?
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Export this quote as a PDF, share the JSON data file, or download a plain-text
                  summary. Pricing is valid for 30 days.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <ActionButton
                  label="Export PDF"
                  loadingLabel="Generating…"
                  doneLabel="PDF Downloaded"
                  icon={Download}
                  variant="primary"
                  onClick={() => generatePDF(printRef.current)}
                />
                <ActionButton
                  label="Export JSON"
                  loadingLabel="Exporting…"
                  doneLabel="Exported"
                  icon={FileJson}
                  variant="ghost"
                  onClick={async () => exportQuoteJSON(exportPayload)}
                />
              </div>
            </div>
          </div>
        </div>
        {/* end printRef zone */}
      </div>
    </>
  );

  return (
    <>
      {mainContent}
      {showSaveModal && (
        <SaveDesignModal
          mode="save"
          initialName=""
          existingNames={existingNames}
          onConfirm={handleSaveName}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
};

export default StepBOQ;

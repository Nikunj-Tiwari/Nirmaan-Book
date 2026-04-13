import React, { useEffect, useRef } from 'react';
import { WALL_TYPES } from '../data/config';
import { useConfig } from '../store/ConfigContext';
import { Layout } from 'lucide-react';

const StepDimensions = () => {
  const { config, actions, derived } = useConfig();
  const { wallType, width, height, width2, width3, depth } = config;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Light background
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, cw, ch);

    // Light grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < cw; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }
    for (let y = 0; y < ch; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
      ctx.stroke();
    }

    if (!width || !height) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Enter dimensions to preview', cw / 2, ch / 2);
      return;
    }

    const pad = 56;
    const slots = Math.floor(width / 600);

    const drawBox = (x, y, w, h, slts, label, sublabel) => {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fillRect(x + 4, y + 4, w, h);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      if (slts > 0) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 1; i < slts; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * (w / slts), y);
          ctx.lineTo(x + i * (w / slts), y + h);
          ctx.stroke();
        }
      }

      ctx.fillStyle = '#1a1a1a';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + w / 2, y + h + 22);

      if (sublabel) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '500 10px Inter, sans-serif';
        ctx.fillText(sublabel, x + w / 2, y + h + 38);
      }
    };

    const heightLabel = (x, y, h2) => {
      ctx.save();
      ctx.translate(x, y + h2 / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#6b7280';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(height + ' mm', 0, 0);
      ctx.restore();
    };

    if (wallType === 'single') {
      const mW = cw - pad * 2,
        mH = ch - pad * 2 - 48;
      const r = Math.min(mW / width, mH / height);
      const rw = width * r,
        rh = height * r,
        rx = (cw - rw) / 2,
        ry = (ch - rh) / 2 - 10;
      heightLabel(rx - 28, ry, rh);
      drawBox(rx, ry, rw, rh, Math.floor(width / 600), width + ' mm', 'Main Wall');
    } else if (wallType === 'l-shape') {
      const B = width2 || 1200;
      const r = Math.min((cw - pad * 3) / (width + B), (ch - pad * 2 - 48) / height, 0.12);
      const aW = width * r,
        aH = height * r,
        bW = B * r;
      const ox = (cw - (aW + bW + 20)) / 2,
        oy = (ch - aH) / 2 - 10;
      drawBox(ox, oy, aW, aH, Math.floor(width / 600), width + ' mm', 'Wall 1');
      drawBox(ox + aW + 20, oy, bW, aH, Math.floor(B / 600), B + ' mm', 'Wall 2');
    } else if (wallType === 'u-shape') {
      const w1 = width,
        w2 = width2,
        w3 = width3 || 1200;
      const r = Math.min((cw - pad * 4) / (w1 + w2 + w3), (ch - pad * 2 - 48) / height, 0.09);
      const aW = w1 * r,
        bW = w2 * r,
        cW = w3 * r,
        aH = height * r;
      const ox = (cw - (aW + bW + cW + 40)) / 2,
        oy = (ch - aH) / 2 - 10;
      drawBox(ox, oy, aW, aH, Math.floor(w1 / 600), w1 + ' mm', 'Wall 1');
      drawBox(ox + aW + 20, oy, bW, aH, Math.floor(w2 / 600), w2 + ' mm', 'Wall 2');
      drawBox(ox + aW + bW + 40, oy, cW, aH, Math.floor(w3 / 600), w3 + ' mm', 'Wall 3');
    } else {
      const r = Math.min(
        (cw - pad * 2) / width,
        (ch - pad * 2 - 48) / Math.max(width * 0.6, 400),
        0.15
      );
      const rw = width * r,
        rd = depth * 4 * r;
      const rx = (cw - rw) / 2,
        ry = (ch - rd) / 2 - 10;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rd);
      ctx.fillStyle = '#f1f3f5';
      ctx.fillRect(rx, ry, depth * r * 0.7, rd);
      ctx.fillRect(rx + rw - depth * r * 0.7, ry, depth * r * 0.7, rd);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, rw, rd);
      ctx.fillStyle = '#6b7280';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Walk-in Closet', rx + rw / 2, ry + rd / 2 + 5);
    }
  }, [width, height, wallType, width2, width3, depth]);

  const NumericInput = ({ value, min, max, onChange }) => {
    const [temp, setTemp] = React.useState(value);

    React.useEffect(() => {
      setTemp(value);
    }, [value]);

    const commit = (val) => {
      const v = Math.min(max, Math.max(min, parseInt(val) || min));
      setTemp(v);
      onChange(v);
    };

    return (
      <input
        type="number"
        value={temp}
        min={min}
        max={max}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(e.target.value)}
        style={{
          width: 75,
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'right',
          color: 'var(--accent)',
          fontFamily: 'var(--font-sans)',
        }}
      />
    );
  };

  const sliderCard = (label, key, min, max, step, value, unit, hint) => (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NumericInput
            value={value}
            min={min}
            max={max}
            onChange={(v) => actions.setDimension(key, v)}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        onChange={(e) => actions.setDimension(key, parseInt(e.target.value))}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 11,
          color: 'var(--text-muted)',
          fontWeight: 500,
        }}
      >
        <span>
          {min} {unit}
        </span>
        {hint && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{hint}</span>}
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'start' }}
      className="animate-fade-in"
    >
      {/* Left: Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Section label */}
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
            Room Setup
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Choose layout and set your dimensions
          </p>
        </div>

        {/* Layout Type */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '18px 20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Layout Type
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'single', label: 'Straight' },
              { id: 'l-shape', label: 'L-Shape' },
              { id: 'u-shape', label: 'U-Shape' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => actions.setDimension('wallType', w.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1.5px solid ${wallType === w.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8,
                  background: wallType === w.id ? 'var(--accent-light)' : 'var(--bg-primary)',
                  color: wallType === w.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Layout size={18} />
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {sliderCard(
          wallType === 'single' ? 'Room Width' : 'Wall 1 Width',
          'width',
          600,
          6000,
          100,
          width,
          'mm',
          'Primary Wall'
        )}
        {(wallType === 'l-shape' || wallType === 'u-shape') &&
          sliderCard('Wall 2 Width', 'width2', 0, 6000, 100, width2, 'mm', 'Left Return')}
        {wallType === 'u-shape' &&
          sliderCard('Wall 3 Width', 'width3', 0, 6000, 100, width3, 'mm', 'Right Return')}

        {sliderCard('Wardrobe Height', 'height', 1800, 3000, 100, height, 'mm', null)}
        {sliderCard('Internal Depth', 'depth', 300, 1200, 50, depth, 'mm', null)}
      </div>

      {/* Right: Blueprint Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            Layout Preview
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Live preview of your configuration
          </p>
        </div>

        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            aspectRatio: '4/3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Total Capacity', value: `${derived.totalCapacity} mm` },
            { label: 'Sections', value: `${Math.floor(derived.totalCapacity / 600)} units` },
            {
              label: 'Area',
              value: `${(((derived.totalCapacity * height) / 1e6) * 10.764).toFixed(1)} sqft`,
            },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepDimensions;

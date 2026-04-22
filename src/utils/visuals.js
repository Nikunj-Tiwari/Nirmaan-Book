import { getDerivedState } from './engine';
import { TYPE_COLORS } from '../data/modules';

/**
 * Technical Visualization Layer
 */

// ─── DARK MODE — technical schematic (StepVisualisation) ─────────────────────
export const getElevationLayout = (config, cw, ch) => {
  const { modulesList } = getDerivedState(config);
  if (modulesList.length === 0) return { primitives: [], status: 'EMPTY' };

  const pad = 100;
  const totalW = modulesList.reduce((sum, mod) => sum + mod.width, 0);
  const totalH = config.height;
  const r = Math.min((cw - pad * 2) / Math.max(totalW, 600), (ch - pad * 2) / totalH, 0.18);
  const rw = totalW * r;
  const rh = totalH * r;
  const ox = (cw - rw) / 2;
  const oy = (ch - rh) / 2 - 20;

  const primitives = [];
  primitives.push({ type: 'rect', x: 0, y: 0, w: cw, h: ch, fill: '#0f1115' });
  primitives.push({
    type: 'rect',
    x: ox - 80,
    y: oy - 80,
    w: rw + 160,
    h: rh + 160,
    fill: '#0f1115',
    stroke: 'rgba(255,255,255,0.07)',
    lineWidth: 1,
  });

  let currentX = ox;
  modulesList.forEach((mod, i) => {
    const mx = currentX;
    const my = oy;
    const mw = mod.width * r;
    const mh = rh;
    const isLatest = i === modulesList.length - 1;
    const layout = mod.layout || {};

    primitives.push({
      type: 'rect',
      x: mx,
      y: my,
      w: mw,
      h: mh,
      fill: '#1a1d23',
      stroke: isLatest ? '#4f8cff' : 'rgba(255,255,255,0.18)',
      lineWidth: isLatest ? 2.5 : 1.5,
    });

    const innerMx = mx + 2;
    const innerMw = mw - 4;
    const numHang = layout.hang || 0;
    const numShelves = layout.shelves || 0;
    const numDrawers = layout.drawers || 0;
    const numShoe = layout.shoe || 0;

    if (numHang > 0) {
      primitives.push({
        type: 'line',
        x1: innerMx,
        y1: my + mh * 0.06,
        x2: innerMx + innerMw,
        y2: my + mh * 0.06,
        stroke: 'rgba(255,255,255,0.18)',
        lineWidth: 1.5,
      });
      const railY1 = numHang >= 2 ? my + mh * 0.14 : my + mh * 0.18;
      primitives.push({
        type: 'line',
        x1: innerMx + 6,
        y1: railY1,
        x2: innerMx + innerMw - 6,
        y2: railY1,
        stroke: 'rgba(180,180,180,0.65)',
        lineWidth: 3,
      });
    }
    if (numHang >= 2) {
      primitives.push({
        type: 'line',
        x1: innerMx + 6,
        y1: my + mh * 0.55,
        x2: innerMx + innerMw - 6,
        y2: my + mh * 0.55,
        stroke: 'rgba(180,180,180,0.65)',
        lineWidth: 3,
      });
    }

    const storageTopR = numHang > 0 ? (numHang >= 2 ? 0.7 : 0.48) : 0;
    if (numHang > 0 && (numShelves > 0 || numDrawers > 0 || numShoe > 0)) {
      primitives.push({
        type: 'line',
        x1: innerMx,
        y1: my + mh * storageTopR,
        x2: innerMx + innerMw,
        y2: my + mh * storageTopR,
        stroke: 'rgba(255,255,255,0.25)',
        lineWidth: 1.5,
      });
    }

    const sYS = my + mh * storageTopR;
    const sYE = my + mh - 2;
    const sH = sYE - sYS;

    if (numShelves > 0 && numDrawers === 0) {
      for (let s = 1; s <= numShelves; s++) {
        const sy = sYS + (sH / (numShelves + 1)) * s;
        primitives.push({
          type: 'line',
          x1: innerMx,
          y1: sy,
          x2: innerMx + innerMw,
          y2: sy,
          stroke: 'rgba(255,255,255,0.15)',
          lineWidth: 1.5,
        });
      }
    }

    if (numDrawers > 0) {
      const dzt = numShelves > 0 ? sYS + sH * 0.45 : sYS;
      if (numShelves > 0) {
        for (let s = 1; s <= numShelves; s++) {
          const sy = sYS + ((sH * 0.45) / (numShelves + 1)) * s;
          primitives.push({
            type: 'line',
            x1: innerMx,
            y1: sy,
            x2: innerMx + innerMw,
            y2: sy,
            stroke: 'rgba(255,255,255,0.15)',
            lineWidth: 1.5,
          });
        }
      }
      const dh = (sYE - dzt) / numDrawers;
      for (let d = 0; d < numDrawers; d++) {
        const dy = dzt + d * dh;
        primitives.push({
          type: 'rect',
          x: innerMx + 2,
          y: dy + 2,
          w: innerMw - 4,
          h: dh - 4,
          fill: 'rgba(79,140,255,0.06)',
          stroke: 'rgba(255,255,255,0.14)',
          lineWidth: 1,
        });
        const hw = Math.min(innerMw * 0.36, 28);
        primitives.push({
          type: 'rect',
          x: innerMx + innerMw / 2 - hw / 2,
          y: dy + dh / 2 - 1.5,
          w: hw,
          h: 3,
          fill: 'rgba(255,255,255,0.32)',
        });
      }
    }

    if (numShoe > 0) {
      for (let s = 1; s <= numShoe; s++) {
        const sy = sYS + (sH / (numShoe + 1)) * s;
        primitives.push({
          type: 'line',
          x1: innerMx + 2,
          y1: sy,
          x2: innerMx + innerMw - 2,
          y2: sy,
          stroke: 'rgba(255,200,100,0.5)',
          lineWidth: 2,
        });
      }
    }

    primitives.push({
      type: 'text',
      x: mx + mw / 2,
      y: my + mh + 24,
      text: mod.id,
      font: '800 9px Inter,sans-serif',
      align: 'center',
      fill: isLatest ? '#4f8cff' : 'rgba(255,255,255,0.5)',
    });
    if (i === 0)
      primitives.push({
        type: 'text',
        x: mx,
        y: my - 14,
        text: `${mod.width}mm`,
        font: '700 9px Inter,sans-serif',
        align: 'left',
        fill: 'rgba(255,255,255,0.35)',
      });

    currentX += mw;
  });

  primitives.push({
    type: 'text',
    x: ox + rw / 2,
    y: oy + rh + 52,
    text: `${totalW} MM  ·  ${config.height} MM  ·  ${config.depth} MM DEPTH`,
    font: '800 11px Inter,sans-serif',
    align: 'center',
    fill: '#4f8cff',
  });

  return { primitives, status: 'OK', totalW, scale: r };
};

// ─── LIGHT MODE — blueprint (PreviewPanel & FullscreenPreviewModal) ───────────
/**
 * Draws a 2D blueprint. Supports single, l-shape, and u-shape wall types.
 */
export const drawBlueprintLight = (ctx, cw, ch, config, modulesList) => {
  const wallType = config.wallType || 'single';

  // Background + grid
  ctx.clearRect(0, 0, cw, ch);
  ctx.fillStyle = '#fafbfc';
  ctx.fillRect(0, 0, cw, ch);
  ctx.strokeStyle = '#eef0f3';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < cw; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = 0; y < ch; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }

  // Empty state
  if (!modulesList || modulesList.length === 0) {
    ctx.fillStyle = '#c4c9d4';
    ctx.font = '500 12px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Add modules to see blueprint', cw / 2, ch / 2 - 8);
    ctx.fillStyle = '#d8dbe1';
    ctx.font = '400 10px Inter,sans-serif';
    ctx.fillText('(Step 2 → Select Modules)', cw / 2, ch / 2 + 12);
    return;
  }

  // ─ Draw internal detail for a single module column ─
  const drawModuleDetail = (mx, my, mw, mh, mod, i, total) => {
    const layout = mod.layout || {};
    const typeColor = TYPE_COLORS[mod.type] || '#6b7280';
    const innerMx = mx + 3;
    const innerMw = mw - 6;

    ctx.fillStyle = i % 2 === 0 ? 'rgba(37,99,235,0.035)' : 'rgba(37,99,235,0.015)';
    ctx.fillRect(mx + 1, my + 1, mw - 2, mh - 2);
    ctx.fillStyle = typeColor;
    ctx.fillRect(mx + 1, my + 1, mw - 2, 3);

    if (i < total - 1) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(mx + mw, my + 4);
      ctx.lineTo(mx + mw, my + mh - 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const numHang = layout.hang || 0;
    const numShelves = layout.shelves || 0;
    const numDrawers = layout.drawers || 0;
    const numShoe = layout.shoe || 0;

    const hangEnd = my + mh * (numHang >= 2 ? 0.7 : 0.5);
    const storageTop = numHang > 0 ? hangEnd : my + 4;
    const storageBot = my + mh - 4;
    const storageH = storageBot - storageTop;

    if (numHang > 0) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(innerMx, my + mh * 0.07);
      ctx.lineTo(innerMx + innerMw, my + mh * 0.07);
      ctx.stroke();
    }

    const drawRail = (yr) => {
      const ry = my + mh * yr;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(innerMx + 4, ry);
      ctx.lineTo(innerMx + innerMw - 4, ry);
      ctx.stroke();
      ctx.lineCap = 'butt';
      const hc = Math.max(1, Math.floor(innerMw / 22));
      const hs = innerMw / (hc + 1);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      for (let h = 1; h <= hc; h++) {
        const hx = innerMx + hs * h;
        ctx.beginPath();
        ctx.moveTo(hx, ry);
        ctx.lineTo(hx, ry + Math.min(mh * 0.12, 16));
        ctx.stroke();
      }
    };

    if (numHang >= 1) drawRail(numHang >= 2 ? 0.14 : 0.18);
    if (numHang >= 2) drawRail(0.56);

    if (numHang > 0 && (numShelves > 0 || numDrawers > 0 || numShoe > 0)) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(innerMx, storageTop);
      ctx.lineTo(innerMx + innerMw, storageTop);
      ctx.stroke();
    }

    if (numShelves > 0 && numDrawers === 0) {
      for (let s = 1; s <= numShelves; s++) {
        const sy = storageTop + (storageH / (numShelves + 1)) * s;
        ctx.strokeStyle = '#b0bec5';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(innerMx, sy);
        ctx.lineTo(innerMx + innerMw, sy);
        ctx.stroke();
      }
    }

    if (numDrawers > 0) {
      const dzt = numShelves > 0 ? storageTop + storageH * 0.44 : storageTop;
      if (numShelves > 0) {
        for (let s = 1; s <= numShelves; s++) {
          const sy = storageTop + ((storageH * 0.44) / (numShelves + 1)) * s;
          ctx.strokeStyle = '#b0bec5';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(innerMx, sy);
          ctx.lineTo(innerMx + innerMw, sy);
          ctx.stroke();
        }
      }
      const dh = (storageBot - dzt) / numDrawers;
      for (let d = 0; d < numDrawers; d++) {
        const dy = dzt + d * dh;
        ctx.fillStyle = 'rgba(37,99,235,0.05)';
        ctx.fillRect(innerMx + 1, dy + 2, innerMw - 2, dh - 4);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(innerMx + 1, dy + 2, innerMw - 2, dh - 4);
        const hw = Math.min(innerMw * 0.38, 28);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(innerMx + innerMw / 2 - hw / 2, dy + dh / 2 - 1.5, hw, 3);
      }
    }

    if (numShoe > 0) {
      for (let s = 1; s <= numShoe; s++) {
        const sy = storageTop + (storageH / (numShoe + 1)) * s;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(innerMx, sy);
        ctx.lineTo(innerMx + innerMw, sy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (mw > 24) {
      ctx.fillStyle = typeColor;
      ctx.font = `700 ${Math.max(7, Math.min(9, mw / 8))}px Inter,sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(mod.id, mx + mw / 2, my + 15);
    }
  };

  // ─ Draw a wall section with shadow, outline, modules & dimension arrows ─
  const drawWallSection = (ox, oy, rw, rh, mods, scale, strokeColor, fillColor) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.09)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = fillColor || '#ffffff';
    ctx.fillRect(ox, oy, rw, rh);
    ctx.restore();
    ctx.strokeStyle = strokeColor || '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, rw, rh);
    if (fillColor && fillColor !== '#ffffff') {
      ctx.fillStyle = 'rgba(99,102,241,0.06)';
      ctx.fillRect(ox, oy, rw, rh);
    }
    let curX = ox;
    mods.forEach((mod, i) => {
      const mw = mod.width * scale;
      drawModuleDetail(curX, oy, mw, rh, mod, i, mods.length);
      curX += mw;
    });
  };

  // ─ Dimension arrow helper ─
  const drawArrowH = (x1, y, x2, label, color) => {
    ctx.strokeStyle = color || '#2563eb';
    ctx.fillStyle = color || '#2563eb';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    [
      [x1, 1],
      [x2, -1],
    ].forEach(([ax, dir]) => {
      ctx.beginPath();
      ctx.moveTo(ax + dir * 5, y - 3);
      ctx.lineTo(ax, y);
      ctx.lineTo(ax + dir * 5, y + 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, y - 5);
      ctx.lineTo(ax, y + 5);
      ctx.stroke();
    });
    ctx.font = '700 10px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y - 5);
  };

  const drawArrowV = (x, y1, y2, label, color) => {
    ctx.save();
    ctx.translate(x, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    const len = Math.abs(y2 - y1);
    ctx.strokeStyle = color || '#2563eb';
    ctx.fillStyle = color || '#2563eb';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    [
      [-len / 2, 1],
      [len / 2, -1],
    ].forEach(([ax, dir]) => {
      ctx.beginPath();
      ctx.moveTo(ax + dir * 5, -3);
      ctx.lineTo(ax, 0);
      ctx.lineTo(ax + dir * 5, 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax, -5);
      ctx.lineTo(ax, 5);
      ctx.stroke();
    });
    ctx.font = '700 10px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -7);
    ctx.restore();
  };

  const drawBadge = (text, bx, by, bgColor, textColor) => {
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, 68, 22, 11);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = '700 10px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, bx + 34, by + 15);
  };

  const drawMaterialLabel = () => {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 9px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${config.material?.name || ''} · ${config.colour?.name || ''}`, cw - 10, ch - 8);
  };

  // ──────────────────────────────────────────────────────────────────
  // SINGLE / WALK-IN — front elevation
  // ──────────────────────────────────────────────────────────────────
  if (wallType === 'single' || wallType === 'walkin') {
    const totalW = modulesList.reduce((s, m) => s + m.width, 0);
    const padX = Math.min(cw * 0.16, 64);
    const padY = Math.min(ch * 0.2, 52);
    const scale = Math.min((cw - padX * 2) / totalW, (ch - padY * 2) / config.height);
    const rw = totalW * scale;
    const rh = config.height * scale;
    const ox = (cw - rw) / 2;
    const oy = (ch - rh) / 2 + 10;

    drawWallSection(ox, oy, rw, rh, modulesList, scale);
    drawArrowH(ox, oy - 22, ox + rw, `${config.width} mm`);
    drawArrowV(ox - 24, oy, oy + rh, `${config.height} mm`);

    // Width per module below
    let curX2 = ox;
    modulesList.forEach((mod) => {
      const mw = mod.width * scale;
      if (mw > 30) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 8px Inter,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${mod.width}`, curX2 + mw / 2, oy + rh + 14);
      }
      curX2 += mw;
    });

    drawMaterialLabel();
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // L-SHAPE — front elevation displayed as two sections side-by-side
  // Left section = Wall B (secondary, perpendicular), Right = Wall A (main)
  // ──────────────────────────────────────────────────────────────────
  if (wallType === 'l-shape') {
    const wA = config.width || 1800;
    const wB = config.width2 || 900;
    const h = config.height || 2400;

    const padX = Math.min(cw * 0.14, 56);
    const padY = Math.min(ch * 0.22, 56);
    const totalMM = wA + wB;
    const scale = Math.min((cw - padX * 2 - 12) / totalMM, (ch - padY * 2) / h);

    const rA = wA * scale;
    const rB = wB * scale;
    const rh = h * scale;
    const GAP = 6; // gap between wall sections in px

    const totalPx = rA + rB + GAP;
    const oxB = (cw - totalPx) / 2;
    const oxA = oxB + rB + GAP;
    const oy = (ch - rh) / 2 + 10;

    // Wall B — secondary (shown with tinted bg)
    drawWallSection(oxB, oy, rB, rh, [], scale, '#6366f1', '#eef2ff');
    ctx.save();
    ctx.translate(oxB + rB / 2, oy + rh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#6366f1';
    ctx.font = '700 9px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wall B · ${wB} mm`, 0, 0);
    ctx.restore();

    // Wall A — primary (with modules)
    drawWallSection(oxA, oy, rA, rh, modulesList, scale, '#2563eb', '#ffffff');

    // Corner joint indicator
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(oxA, oy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(oxA, oy + rh, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dimension annotations
    drawArrowH(oxB, oy - 22, oxB + rB, `Wall B: ${wB} mm`, '#6366f1');
    drawArrowH(oxA, oy - 22, oxA + rA, `Wall A: ${wA} mm`, '#2563eb');
    drawArrowV(oxB - 24, oy, oy + rh, `${h} mm`);

    drawBadge('L-Shape', cw - 80, 14, 'rgba(99,102,241,0.12)', '#6366f1');
    drawMaterialLabel();
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // U-SHAPE — three sections: [B] [A (main)] [C]
  // ──────────────────────────────────────────────────────────────────
  if (wallType === 'u-shape') {
    const wA = config.width || 1800;
    const wB = config.width2 || 900;
    const wC = config.width3 || 900;
    const h = config.height || 2400;

    const padX = Math.min(cw * 0.12, 48);
    const padY = Math.min(ch * 0.22, 56);
    const totalMM = wA + wB + wC;
    const scale = Math.min((cw - padX * 2 - 24) / totalMM, (ch - padY * 2) / h);

    const rA = wA * scale;
    const rB = wB * scale;
    const rC = wC * scale;
    const rh = h * scale;
    const GAP = 5;

    const totalPx = rB + GAP + rA + GAP + rC;
    const oxB = (cw - totalPx) / 2;
    const oxA = oxB + rB + GAP;
    const oxC = oxA + rA + GAP;
    const oy = (ch - rh) / 2 + 12;

    // Wall B (left)
    drawWallSection(oxB, oy, rB, rh, [], scale, '#6366f1', '#eef2ff');
    ctx.save();
    ctx.translate(oxB + rB / 2, oy + rh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#6366f1';
    ctx.font = '700 9px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wall B · ${wB} mm`, 0, 0);
    ctx.restore();

    // Wall A (main, centre)
    drawWallSection(oxA, oy, rA, rh, modulesList, scale, '#2563eb', '#ffffff');

    // Wall C (right)
    drawWallSection(oxC, oy, rC, rh, [], scale, '#6366f1', '#eef2ff');
    ctx.save();
    ctx.translate(oxC + rC / 2, oy + rh / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#6366f1';
    ctx.font = '700 9px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wall C · ${wC} mm`, 0, 0);
    ctx.restore();

    // Corner joints
    [oxA, oxA + rA + GAP].forEach((cx) => {
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(cx, oy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, oy + rh, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Annotations
    drawArrowH(oxB, oy - 22, oxB + rB, `B: ${wB} mm`, '#6366f1');
    drawArrowH(oxA, oy - 22, oxA + rA, `A: ${wA} mm`, '#2563eb');
    drawArrowH(oxC, oy - 22, oxC + rC, `C: ${wC} mm`, '#6366f1');
    drawArrowV(oxB - 24, oy, oy + rh, `${h} mm`);

    drawBadge('U-Shape', cw - 80, 14, 'rgba(99,102,241,0.12)', '#6366f1');
    drawMaterialLabel();
    return;
  }

  drawMaterialLabel();
};

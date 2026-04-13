import { getDerivedState } from './engine';

/**
 * Technical Visualization Layer
 * Calculates absolute coordinates and drawing primitives.
 * Does not interact with states directly.
 */

export const getElevationLayout = (config, cw, ch) => {
  const { modulesList } = getDerivedState(config);

  if (modulesList.length === 0) return { primitives: [], status: 'EMPTY' };

  const pad = 120;

  // Calculate true technical width sum
  const totalW = modulesList.reduce((sum, mod) => sum + mod.width, 0);
  const totalH = config.height;

  // Scale fitting (Realistic architectural standard 0.18)
  const r = Math.min((cw - pad * 2) / Math.max(totalW, 600), (ch - pad * 2) / totalH, 0.18);
  const rw = totalW * r;
  const rh = totalH * r;
  const ox = (cw - rw) / 2;
  const oy = (ch - rh) / 2 - 20;

  const primitives = [];

  // 1. Background Frame
  primitives.push({ type: 'rect', x: 0, y: 0, w: cw, h: ch, fill: '#0f1115' }); // bg-primary
  primitives.push({
    type: 'rect',
    x: ox - 100,
    y: oy - 100,
    w: rw + 200,
    h: rh + 200,
    fill: '#0f1115',
    stroke: 'rgba(255,255,255,0.1)',
    lineWidth: 1,
  });

  // 2. Module Rendering (Sequential Left-to-Right)
  let currentX = ox;
  modulesList.forEach((mod, i) => {
    const mx = currentX;
    const my = oy;
    const mw = mod.width * r;
    const mh = rh;

    // Pulse effect for the latest added module
    const isLatest = i === modulesList.length - 1;

    // Outer Module Box
    primitives.push({
      type: 'rect',
      x: mx,
      y: my,
      w: mw,
      h: mh,
      fill: '#1a1d23',
      stroke: isLatest ? '#4f8cff' : 'rgba(255,255,255,0.2)',
      lineWidth: isLatest ? 3 : 1.5,
    });

    // Technical ID Label
    primitives.push({
      type: 'text',
      x: mx + mw / 2,
      y: my + mh + 28,
      text: mod.id,
      font: '900 10px Inter,sans-serif',
      align: 'center',
      fill: isLatest ? '#4f8cff' : 'rgba(255,255,255,0.6)',
    });

    const layout = mod.layout || {};

    // Internal Components (Normalized to module dimensions)
    if (layout.shelves > 0) {
      for (let j = 1; j <= layout.shelves; j++) {
        const sy = my + (mh / (layout.shelves + 1)) * j;
        primitives.push({
          type: 'line',
          x1: mx + 2,
          y1: sy,
          x2: mx + mw - 2,
          y2: sy,
          stroke: 'rgba(255,255,255,0.1)',
          lineWidth: 1.5,
        });
      }
    }

    if (layout.hang > 0) {
      for (let j = 0; j < layout.hang; j++) {
        const hy = my + 30 + j * 80 * r;
        primitives.push({
          type: 'line',
          x1: mx + 10,
          y1: hy,
          x2: mx + mw - 10,
          y2: hy,
          stroke: 'rgba(255,255,255,0.4)',
          lineWidth: 3,
        });
      }
    }

    if (layout.drawers > 0) {
      const drawerH = mh / 8;
      for (let j = 0; j < layout.drawers; j++) {
        const dy = my + mh - (j + 1) * drawerH;
        primitives.push({
          type: 'rect',
          x: mx + 4,
          y: dy + 2,
          w: mw - 8,
          h: drawerH - 4,
          fill: 'rgba(79, 140, 255, 0.05)',
          stroke: 'rgba(255,255,255,0.1)',
          lineWidth: 1,
        });
        primitives.push({
          type: 'rect',
          x: mx + mw / 2 - 8,
          y: dy + drawerH / 2 - 1,
          w: 16,
          h: 2,
          fill: 'rgba(255,255,255,0.3)',
        }); // Handle
      }
    }

    // Increment X coordinate for next module
    currentX += mw;
  });

  // 3. Dimensional Annotation
  primitives.push({
    type: 'text',
    x: ox + rw / 2,
    y: oy + rh + 60,
    text: `${totalW} MM TOTAL WIDTH`,
    font: '900 12px Inter,sans-serif',
    align: 'center',
    fill: '#4f8cff',
  });

  return { primitives, status: 'OK', totalW, scale: r };
};

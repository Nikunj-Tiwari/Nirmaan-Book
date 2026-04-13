/**
 * export.js — NirmanBook export utilities
 * Handles Print, PDF Export, JSON Export, and Text Summary Export
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/* ─────────────────────────────────────────
   1. PRINT
   ───────────────────────────────────────── */
export function handlePrint() {
  window.print();
}

/* ─────────────────────────────────────────
   2. PDF EXPORT (html2canvas + jsPDF)
   ───────────────────────────────────────── */
export async function generatePDF(containerRef) {
  if (!containerRef) throw new Error('No container ref provided');

  // A4 dimensions in mm
  const PDF_WIDTH_MM = 210;
  const PDF_HEIGHT_MM = 297;
  const MARGIN_MM = 12;
  const CONTENT_WIDTH_MM = PDF_WIDTH_MM - MARGIN_MM * 2;

  const canvas = await html2canvas(containerRef, {
    scale: 2, // retina / high-DPI for text clarity
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    // Temporarily force light background for capture
    onclone: (clonedDoc) => {
      const el = clonedDoc.querySelector('[data-print-target]');
      if (el) {
        el.style.background = '#ffffff';
        el.style.color = '#1a1a1a';
        el.style.boxShadow = 'none';
      }
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;

  // Scale to fit content width on A4
  const scale = CONTENT_WIDTH_MM / (imgWidthPx / 3.7795); // px → mm
  const renderedWidthMm = CONTENT_WIDTH_MM;
  const renderedHeightMm = (imgHeightPx / 3.7795) * scale;

  const pdf = new jsPDF({
    orientation: renderedHeightMm > PDF_HEIGHT_MM - MARGIN_MM * 2 ? 'portrait' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // If content fits in one page
  const availableHeight = PDF_HEIGHT_MM - MARGIN_MM * 2;

  if (renderedHeightMm <= availableHeight) {
    pdf.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM, renderedWidthMm, renderedHeightMm);
  } else {
    // Multi-page: slice the canvas
    const pixelsPerMm = imgWidthPx / renderedWidthMm;
    const pageHeightPx = availableHeight * pixelsPerMm;
    let yOffset = 0;
    let pageNum = 0;

    while (yOffset < imgHeightPx) {
      if (pageNum > 0) pdf.addPage();

      const sliceHeight = Math.min(pageHeightPx, imgHeightPx - yOffset);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = imgWidthPx;
      sliceCanvas.height = sliceHeight;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, yOffset, imgWidthPx, sliceHeight, 0, 0, imgWidthPx, sliceHeight);

      const sliceData = sliceCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceHeight / pixelsPerMm;
      pdf.addImage(sliceData, 'PNG', MARGIN_MM, MARGIN_MM, renderedWidthMm, sliceHeightMm);

      yOffset += sliceHeight;
      pageNum++;
    }
  }

  pdf.save('NirmanBook_Quote.pdf');
}

/* ─────────────────────────────────────────
   3. JSON EXPORT
   ───────────────────────────────────────── */
export function exportQuoteJSON({ config, boqItems, valuation, totalModulesCount }) {
  const modules = Object.entries(config.modules)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const item = boqItems.find((i) => i.desc?.startsWith(id));
      return {
        id,
        name: item?.name ?? id,
        quantity: qty,
        unitPrice: item?.rate ?? 0,
        total: item?.total ?? 0,
      };
    });

  const accessories = boqItems
    .filter((i) => i.category === 'Accessory')
    .map((i) => ({
      name: i.name,
      description: i.desc,
      quantity: i.qty,
      unitPrice: i.rate,
      total: i.total,
    }));

  const hardware = boqItems
    .filter((i) => i.category === 'Hardware' || i.category === 'Lighting')
    .map((i) => ({
      name: i.name,
      description: i.desc,
      quantity: i.qty,
      unitPrice: i.rate,
      total: i.total,
    }));

  const payload = {
    project: 'NirmanBook Wardrobe',
    generatedAt: new Date().toISOString(),
    configuration: {
      wallType: config.wallType,
      roomWidth: config.width,
      height: config.height,
      depth: config.depth,
      material: config.material?.name ?? '',
      materialMultiplier: config.material?.multiplier ?? 1,
      colour: config.colour?.name ?? '',
      fascia: config.fascia,
    },
    modules,
    hardware,
    accessories,
    pricing: {
      modulesSubtotal: valuation.modulesSubtotal,
      accessoriesTotal: valuation.accessoriesTotal,
      totalPrice: valuation.total,
      currency: 'INR',
    },
    totalModules: totalModulesCount,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quote.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────
   4. TEXT / INVOICE SUMMARY EXPORT
   ───────────────────────────────────────── */
export function exportTextSummary({ config, boqItems, valuation, totalModulesCount }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const line = (char = '─', n = 58) => char.repeat(n);
  const rpad = (str, len) => String(str).padEnd(len);
  const lpad = (str, len) => String(str).padStart(len);
  const fmt = (num) => `INR ${Number(num).toLocaleString('en-IN')}`;

  const rows = boqItems
    .map((i) => `  ${rpad(i.name, 28)} ${rpad(`x${i.qty}`, 5)} ${lpad(fmt(i.total), 16)}`)
    .join('\n');

  const text = [
    '',
    '  NIRMANBOOK WARDROBE — QUOTE SUMMARY',
    `  Generated: ${dateStr}`,
    '',
    line(),
    '  CONFIGURATION',
    line(),
    `  Wall Type     : ${config.wallType}`,
    `  Width         : ${config.width} mm`,
    `  Height        : ${config.height} mm`,
    `  Depth         : ${config.depth} mm`,
    `  Material      : ${config.material?.name ?? '—'} (${config.material?.multiplier ?? 1}x)`,
    `  Colour        : ${config.colour?.name ?? '—'}`,
    `  Fascia        : ${config.fascia}`,
    `  Total Modules : ${totalModulesCount}`,
    '',
    line(),
    '  BILL OF MATERIALS',
    line(),
    `  ${'Item'.padEnd(28)} ${'Qty'.padEnd(5)} ${'Total'.padStart(16)}`,
    line('·'),
    rows,
    line('·'),
    `  ${'Modules Subtotal'.padEnd(35)} ${lpad(fmt(valuation.modulesSubtotal), 16)}`,
    `  ${'Accessories & Hardware'.padEnd(35)} ${lpad(fmt(valuation.accessoriesTotal), 16)}`,
    line(),
    `  ${'TOTAL PROJECT QUOTE'.padEnd(35)} ${lpad(fmt(valuation.total), 16)}`,
    line(),
    '',
    '  * Pricing valid for 30 days from date of generation.',
    '  * Site-specific assembly factors may apply.',
    '  * 18mm high-density calibrated panels | 2mm PVC edge banding.',
    '',
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'NirmanBook_Quote_Summary.txt';
  a.click();
  URL.revokeObjectURL(url);
}

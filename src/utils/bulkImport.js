/**
 * bulkImport.js — Shared utility for bulk catalog import
 *
 * Supports .xlsx and .csv files via SheetJS.
 * Used by AdminCatalog.jsx and BusinessCatalog.jsx.
 *
 * API:
 *   parseFile(file)              → Promise<object[]>   raw rows from file
 *   validateRows(rows, type)     → { validRows, errorRows }
 *   generateTemplate(type)       → Blob  (downloadable .xlsx)
 *   TEMPLATES[type].columns      → string[]  (header labels)
 */

import * as XLSX from 'xlsx';

// ─── Schema definitions per item type ────────────────────────────────────────

const SCHEMA = {
  modules: {
    required: ['name', 'category', 'basePrice', 'width', 'height', 'depth'],
    numeric: ['basePrice', 'width', 'height', 'depth'],
    optional: ['imageUrl', 'type', 'description'],
    sample: [
      {
        name: 'Single Hang Unit',
        category: 'Hanging',
        basePrice: 8500,
        width: 600,
        height: 2400,
        depth: 600,
        imageUrl: '',
        type: 'hanging',
        description: 'Full-height hanging unit',
      },
    ],
  },
  materials: {
    required: ['name', 'sub', 'priceMultiplier'],
    numeric: ['priceMultiplier'],
    optional: ['hex', 'description'],
    sample: [
      {
        name: 'Matte White Laminate',
        sub: 'Laminate',
        priceMultiplier: 1.0,
        hex: '#f5f5f0',
        description: '',
      },
    ],
  },
  handles: {
    required: ['name', 'basePrice'],
    numeric: ['basePrice'],
    optional: ['sub', 'imageUrl', 'description'],
    sample: [
      {
        name: 'Chrome Bar Handle',
        basePrice: 350,
        sub: 'Chrome',
        imageUrl: '',
        description: '',
      },
    ],
  },
  accessories: {
    required: ['name', 'category', 'basePrice'],
    numeric: ['basePrice'],
    optional: ['imageUrl', 'description'],
    sample: [
      {
        name: 'Trouser Rack',
        category: 'Storage',
        basePrice: 1200,
        imageUrl: '',
        description: '',
      },
    ],
  },
};

// ─── parseFile ────────────────────────────────────────────────────────────────

/**
 * Parse a .xlsx or .csv File into an array of plain row objects.
 * Uses SheetJS; first row is treated as headers.
 * @param {File} file
 * @returns {Promise<object[]>}
 */
export async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows;
}

// ─── validateRows ─────────────────────────────────────────────────────────────

/**
 * Validate rows against a type schema.
 * @param {object[]} rows   - raw rows from parseFile
 * @param {string}   type   - 'modules' | 'materials' | 'handles' | 'accessories'
 * @returns {{ validRows: object[], errorRows: { row: object, errors: string[], index: number }[] }}
 */
export function validateRows(rows, type) {
  const schema = SCHEMA[type];
  if (!schema) throw new Error(`Unknown import type: ${type}`);

  const validRows = [];
  const errorRows = [];

  rows.forEach((row, index) => {
    const errors = [];

    // Check required fields
    schema.required.forEach((field) => {
      const val = row[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        errors.push(`Missing required field: "${field}"`);
      }
    });

    // Check numeric fields
    schema.numeric.forEach((field) => {
      const val = row[field];
      if (val !== undefined && val !== '' && isNaN(Number(val))) {
        errors.push(`"${field}" must be a number (got "${val}")`);
      }
      if (Number(val) < 0) {
        errors.push(`"${field}" must be ≥ 0`);
      }
    });

    if (errors.length > 0) {
      errorRows.push({ row, errors, index: index + 2 }); // +2 = 1-based + header row
    } else {
      // Coerce numeric fields
      const cleaned = { ...row };
      schema.numeric.forEach((field) => {
        cleaned[field] = Number(cleaned[field]);
      });
      validRows.push(cleaned);
    }
  });

  return { validRows, errorRows };
}

// ─── generateTemplate ─────────────────────────────────────────────────────────

/**
 * Generate a downloadable .xlsx template with sample data.
 * @param {string} type - 'modules' | 'materials' | 'handles' | 'accessories'
 * @returns {Blob}
 */
export function generateTemplate(type) {
  const schema = SCHEMA[type];
  if (!schema) throw new Error(`Unknown import type: ${type}`);

  const ws = XLSX.utils.json_to_sheet(schema.sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type);

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download a template file in the browser.
 * @param {string} type
 */
export function downloadTemplate(type) {
  const blob = generateTemplate(type);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nirmanbook-${type}-template.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export const SCHEMA_COLUMNS = Object.fromEntries(
  Object.entries(SCHEMA).map(([type, s]) => [type, [...s.required, ...s.optional]])
);

/**
 * Module Image Mapping
 * Maps module IDs to their image filenames
 * Handles inconsistent image naming conventions
 */

export const MODULE_IMAGES = {
  // OW/SW series 01-11 (with underscore before number)
  'OW/SW 01': 'OW_SW_01.png',
  'OW/SW 02': 'OW_SW_02.png',
  'OW/SW 03': 'OW_SW_03.png',
  'OW/SW 04': 'OW_SW_04.png',
  'OW/SW 05': 'OW_SW_05.png',
  'OW/SW 06': 'OW_SW_06.png',
  'OW/SW 07': 'OW_SW_07.png',
  'OW/SW 08': 'OW_SW_08.png',
  'OW/SW 09': 'OW_SW_09.png',
  'OW/SW 10': 'OW_SW_10.png',
  'OW/SW 11': 'OW_SW_11.png',

  // OW series (no slash, spaces removed)
  'OW 12': 'OW12.png',
  'OW 13': 'OW13.png',
  'OW 16': 'OW16.png',
  'OW 17': 'OW17.png',
  'OW 18': 'OW18.png',
  'OW 19': 'OW19.png',
  'OW 20A': 'OW_20A.png',
  'OW 20B': 'OW_20B.png',
  'OW 21A': 'OW_21A.png',
  'OW 21B': 'OW_21B.png',
  'OW 30': 'OW30.png',
  'OW 36': 'OW36.png',
  'OW 38': 'OW38.png',
  'OW 39': 'OW39.png',
  'OW 40': 'OW40.png',

  // OW/SW series 14+ (no underscore before number)
  'OW/SW 14': 'OW_SW14.png',
  'OW/SW 15': 'OW_SW15.png',
  'OW/SW 22': 'OW_SW22.png',
  'OW/SW 23': 'OW_SW23.png',
  'OW/SW 24': 'OW_SW24.png',
  'OW/SW 25': 'OW_SW25.png',
  'OW/SW 26': 'OW_SW26.png',
  'OW/SW 27': 'OW_SW27.png',
  'OW/SW 28': 'OW_SW28.png',
  'OW/SW 29': 'OW_SW29.png',
  'OW/SW 31': 'OW_SW31.png',
  'OW/SW 32': 'OW_SW32.png',
  'OW/SW 33': 'OW_SW33.png',
  'OW/SW 34': 'OW_SW34.png',
  'OW/SW 35': 'OW_SW35.png',
  'OW/SW 37': 'OW_SW37.png',
  'OW/SW 41': 'OW_SW41.png',
  'OW/SW 42': 'OW_SW42.png',
  'OW/SW 43': 'OW_SW43.png',
  'OW/SW 44': 'OW_SW44.png',
  'OW/SW 45': 'OW_SW45.png',
  'OW/SW 46': 'OW_SW46.png',
  'OW/SW 47': 'OW_SW47.png',
};

/**
 * Get image path for a module
 * @param {string} moduleId - Module ID (e.g., 'OW/SW 01')
 * @returns {string} - Path to image file or null if not found
 */
export const getModuleImagePath = (moduleId) => {
  const filename = MODULE_IMAGES[moduleId];
  if (filename) {
    return `/wardrobe_modules/${filename}`;
  }
  return null;
};

/**
 * Check if module has an image
 * @param {string} moduleId - Module ID
 * @returns {boolean} - True if image exists in mapping
 */
export const hasModuleImage = (moduleId) => {
  return moduleId in MODULE_IMAGES;
};

/**
 * Generate SVG placeholder based on module layout
 * Alternative visualization when image is not available
 * @param {object} layout - Module layout object { hang, shelves, drawers, ... }
 * @returns {string} - SVG data URL
 */
export const generateModulePlaceholder = (layout = {}) => {
  const { hang = 0, shelves = 0, drawers = 0, shoe = 0, rack = 0, cubbies = 0 } = layout;

  // Create a simple SVG representation
  const svg = `
    <svg width="160" height="160" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <!-- Background -->
      <rect width="160" height="160" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
      
      <!-- Title bar -->
      <rect width="160" height="30" fill="#e8e8e8"/>
      <text x="80" y="20" font-size="12" font-weight="bold" text-anchor="middle" fill="#333">Module Parts</text>
      
      <!-- Layout indicators -->
      <g transform="translate(10, 40)">
        ${hang > 0 ? `<rect x="0" y="0" width="70" height="30" fill="#fff3e0" stroke="#ffb74d" stroke-width="1"/><text x="35" y="20" font-size="10" text-anchor="middle" fill="#333">Hang×${hang}</text>` : ''}
        ${shelves > 0 ? `<rect x="75" y="0" width="70" height="30" fill="#e3f2fd" stroke="#64b5f6" stroke-width="1"/><text x="110" y="20" font-size="10" text-anchor="middle" fill="#333">Shelf×${shelves}</text>` : ''}
      </g>
      
      <g transform="translate(10, 75)">
        ${drawers > 0 ? `<rect x="0" y="0" width="70" height="30" fill="#f3e5f5" stroke="#ce93d8" stroke-width="1"/><text x="35" y="20" font-size="10" text-anchor="middle" fill="#333">Draw×${drawers}</text>` : ''}
        ${shoe > 0 ? `<rect x="75" y="0" width="70" height="30" fill="#e8f5e9" stroke="#81c784" stroke-width="1"/><text x="110" y="20" font-size="10" text-anchor="middle" fill="#333">Shoe×${shoe}</text>` : ''}
      </g>
      
      ${rack > 0 ? `<text x="80" y="135" font-size="11" text-anchor="middle" fill="#666">+ Rack</text>` : ''}
      ${cubbies > 0 ? `<text x="80" y="135" font-size="11" text-anchor="middle" fill="#666">+ Cubbies</text>` : ''}
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
};

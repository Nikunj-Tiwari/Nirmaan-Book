/**
 * Module Image Utility
 * Handles image loading, caching, and fallback for module cards
 * Loads images from /wardrobe_modules/ folder
 */

// Supported image formats to try in order
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg'];

/**
 * Normalize module ID to match image filename
 * Converts "OW/SW 01" → "OW_SW_01" and "OW 12" → "OW12"
 * @param {string} moduleId - The module ID (e.g., 'OW/SW 01')
 * @returns {string} - Normalized ID for filename matching
 */
const normalizeModuleId = (moduleId) => {
  // Two patterns:
  // 1. With slash: "OW/SW 01" → "OW_SW_01" (replace / and spaces with _)
  // 2. Without slash: "OW 12" → "OW12" (just remove spaces)
  if (moduleId.includes('/')) {
    return moduleId
      .replace(/[/\\]+/g, '_') // Replace slashes with underscores
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toUpperCase(); // Ensure uppercase
  } else {
    return moduleId
      .replace(/\s+/g, '') // Remove spaces entirely (no underscore)
      .toUpperCase(); // Ensure uppercase
  }
};

/**
 * Generate image path for a module
 * Tries multiple image formats (.png, .jpg, .jpeg)
 * @param {string} moduleId - The module ID (e.g., 'OW/SW 01')
 * @param {string} format - Specific format to use (optional)
 * @returns {string} - The relative path to the image
 *
 * Naming Convention:
 * Images in /wardrobe_modules/ folder, named by module ID
 * - 'OW/SW 01' → '/wardrobe_modules/OW_SW_01.png' (or .jpg, .jpeg)
 * - 'OW/DW 01' → '/wardrobe_modules/OW_DW_01.png'
 *
 * Auto-tries formats: .png → .jpg → .jpeg
 */
export const getModuleImagePath = (moduleId, format = '.png') => {
  const normalized = normalizeModuleId(moduleId);
  return `/wardrobe_modules/${normalized}${format}`;
};

/**
 * Get next image format to try
 * Used for fallback when primary format not found
 * @param {string} currentFormat - Current format (e.g., '.png')
 * @returns {string|null} - Next format to try, or null if no more formats
 */
export const getNextImageFormat = (currentFormat = '.png') => {
  const index = SUPPORTED_FORMATS.indexOf(currentFormat);
  if (index >= 0 && index < SUPPORTED_FORMATS.length - 1) {
    return SUPPORTED_FORMATS[index + 1];
  }
  return null;
};

/**
 * Get all supported image formats
 * @returns {string[]} - List of supported formats
 */
export const getSupportedFormats = () => SUPPORTED_FORMATS;
/**
 * Preload an image to check if it exists
 * @param {string} path - The image path
 * @returns {Promise<boolean>} - Resolves to true if image loads successfully
 */
export const preloadImage = (path) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = path;
  });
};

/**
 * Get image dimensions for responsive sizing
 * @param {string} path - The image path
 * @returns {Promise<Object>} - Resolves to { width, height } or null if load fails
 */
export const getImageDimensions = (path) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = path;
  });
};

export default {
  getModuleImagePath,
  getNextImageFormat,
  getSupportedFormats,
  preloadImage,
  getImageDimensions,
};

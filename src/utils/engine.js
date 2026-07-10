import { MODULES } from '../data/modules';
import { calculateValuation } from './pricing';
import { validateSpaceCapacity, canAddModule, calculateUsedWidth } from './rules';

/**
 * Core Configuration Engine - State Transitions
 * Pure functions that enforce business rules.
 */

/**
 * updateModuleQty — pure reducer helper.
 * NOTE: the canAddModule guard has been moved to the ConfigContext action layer
 * so it can receive `activeModules` (the merged platform + business catalog).
 * This function still enforces the 0-floor.
 */
export const updateModuleQty = (config, id, delta) => {
  const currentQty = config.modules[id] || 0;
  const newQty = Math.max(0, currentQty + delta);

  const newModules = { ...config.modules };
  if (newQty === 0) {
    delete newModules[id];
  } else {
    newModules[id] = newQty;
  }

  return { ...config, modules: newModules };
};

export const updateFinishes = (config, key, value) => {
  return { ...config, [key]: value };
};

export const updateDimensions = (config, key, value) => {
  if (key === 'wallType') return { ...config, [key]: value };

  const v = parseInt(value) || 0;

  // Architectural Constraints
  if (key === 'width' && (v < 600 || v > 6000)) return config;
  if (key === 'width2' && (v < 0 || v > 6000)) return config;
  if (key === 'width3' && (v < 0 || v > 6000)) return config;
  if (key === 'height' && (v < 1800 || v > 3000)) return config;
  if (key === 'depth' && (v < 300 || v > 1200)) return config;

  // Occupancy Guard: Cannot shrink room below currently placed modules
  if (key === 'width' || key === 'width2' || key === 'width3') {
    const used = calculateUsedWidth(config.modules);

    const nextConfig = { ...config, [key]: v };
    const totalCap =
      nextConfig.wallType === 'u-shape'
        ? nextConfig.width + nextConfig.width2 + nextConfig.width3
        : nextConfig.wallType === 'l-shape'
          ? nextConfig.width + nextConfig.width2
          : nextConfig.width;

    if (totalCap < used) return config;
  }

  return { ...config, [key]: v };
};

/**
 * Derived Configuration Metrics
 * Centralized logic for all business state derivations.
 *
 * @param {object} config - current config state
 * @param {object[]} [allModules] - merged catalog (platform + business).
 *   Falls back to static MODULES if not provided. Passing this ensures
 *   business-created modules appear in modulesList (→ 3D/2D/Summary).
 */
export const getDerivedState = (config, allModules) => {
  const catalog = allModules && allModules.length > 0 ? allModules : MODULES;

  const totalModules = Object.values(config.modules).reduce((a, b) => a + b, 0);

  // Calculate total capacity based on layout
  const totalCapacity =
    config.wallType === 'u-shape'
      ? config.width + config.width2 + config.width3
      : config.wallType === 'l-shape'
        ? config.width + config.width2
        : config.width;

  const valuation = calculateValuation(config);
  const validation = validateSpaceCapacity(totalCapacity, config.modules, catalog);

  // Flat list for visualization/bom — each entry carries wallKey + wall assignment.
  // Uses `catalog` (not static MODULES) so business-created modules
  // appear correctly in the 3D preview, 2D blueprint, and Summary page.
  const moduleWalls = config.moduleWalls || {};
  const moduleOverrides = config.moduleOverrides || {};
  const modulesList = [];
  Object.entries(config.modules).forEach(([id, qty]) => {
    const mod = catalog.find((m) => m.id === id);
    if (mod) {
      for (let i = 0; i < qty; i++) {
        const wallKey = `${id}:${i}`;
        const wall = moduleWalls[wallKey] || 'A';
        const overrides = moduleOverrides[wallKey] || {};
        modulesList.push({ ...mod, wallKey, wall, ...overrides });
      }
    }
  });

  return {
    totalModules,
    totalCapacity,
    valuation,
    validation,
    modulesList,
    remainingWidth: validation.remaining,
  };
};

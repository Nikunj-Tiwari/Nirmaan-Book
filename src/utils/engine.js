import { MODULES } from '../data/modules';
import { calculateValuation } from './pricing';
import { validateSpaceCapacity, canAddModule } from './rules';

/**
 * Core Configuration Engine - State Transitions
 * Pure functions that enforce business rules.
 */

export const updateModuleQty = (config, id, delta) => {
  const currentQty = config.modules[id] || 0;
  const newQty = Math.max(0, currentQty + delta);
  
  // If adding, check physical constraints
  if (delta > 0 && !canAddModule(config.width, config.modules, id)) {
    return config; // Explicitly block state change
  }

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
  const v = parseInt(value) || 0;
  
  // Architectural Constraints
  if (key === 'width' && (v < 600 || v > 6000)) return config;
  if (key === 'height' && (v < 1800 || v > 3000)) return config;
  if (key === 'depth' && (v < 300 || v > 1200)) return config;

  // Occupancy Guard: Cannot shrink room below currently placed modules
  if (key === 'width') {
    const used = Object.entries(config.modules).reduce((total, [id, qty]) => {
      const mod = MODULES.find(m => m.id === id);
      return total + (mod?.width || 0) * qty;
    }, 0);
    if (v < used) return config;
  }

  return { ...config, [key]: v };
};

/**
 * Derived Configuration Metrics
 * Centralized logic for all business state derivations.
 */
export const getDerivedState = (config) => {
  const totalModules = Object.values(config.modules).reduce((a, b) => a + b, 0);
  const valuation = calculateValuation(config);
  const validation = validateSpaceCapacity(config.width, config.modules);
  
  // Flat list for visualization/bom (using id)
  const modulesList = [];
  Object.entries(config.modules).forEach(([id, qty]) => {
    const mod = MODULES.find(m => m.id === id);
    if (mod) {
      for (let i = 0; i < qty; i++) {
        modulesList.push(mod);
      }
    }
  });

  return {
    totalModules,
    valuation,
    validation,
    modulesList,
    remainingWidth: validation.remaining
  };
};

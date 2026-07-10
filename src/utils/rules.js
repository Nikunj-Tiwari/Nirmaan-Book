import { MODULES } from '../data/modules';

/**
 * Deterministic Space Capacity Validation
 * Ensures physical constraints are met (Main Wall, Side Walls).
 *
 * @param {object} configModules - map of moduleId → qty from config state
 * @param {object[]} [allModules] - optional merged catalog (platform + business).
 *   Falls back to static MODULES if not provided.
 */
export const calculateUsedWidth = (configModules, allModules) => {
  const catalog = allModules && allModules.length > 0 ? allModules : MODULES;
  return Object.entries(configModules).reduce((total, [id, qty]) => {
    const mod = catalog.find((m) => m.id === id);
    return total + (mod?.width || 0) * qty;
  }, 0);
};

export const validateSpaceCapacity = (roomWidth, configModules, allModules) => {
  const usedWidth = calculateUsedWidth(configModules, allModules);
  const remaining = roomWidth - usedWidth;
  const percentUsed = (usedWidth / roomWidth) * 100;

  return {
    isValid: usedWidth <= roomWidth,
    usedWidth,
    remaining,
    percentUsed: Math.min(100, percentUsed),
    message:
      usedWidth > roomWidth ? `EXCEEDS LIMIT BY ${usedWidth - roomWidth}MM` : 'WITHIN CAPACITY',
  };
};

/**
 * Technical Constraint Check
 * Prevents adding a module if it violates the width rule.
 *
 * @param {object[]} [allModules] - optional merged catalog (platform + business).
 */
export const canAddModule = (roomWidth, configModules, moduleId, allModules) => {
  const catalog = allModules && allModules.length > 0 ? allModules : MODULES;
  const modToAdd = catalog.find((m) => m.id === moduleId);
  if (!modToAdd) return false;

  const currentUsed = calculateUsedWidth(configModules, allModules);
  return currentUsed + modToAdd.width <= roomWidth;
};

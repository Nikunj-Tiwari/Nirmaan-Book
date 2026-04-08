import { MODULES } from '../data/modules';

/**
 * Deterministic Space Capacity Validation
 * Ensures physical constraints are met (Main Wall, Side Walls).
 */
export const calculateUsedWidth = (configModules) => {
  return Object.entries(configModules).reduce((total, [id, qty]) => {
    const mod = MODULES.find(m => m.id === id);
    return total + (mod?.width || 0) * qty;
  }, 0);
};

export const validateSpaceCapacity = (roomWidth, configModules) => {
  const usedWidth = calculateUsedWidth(configModules);
  const remaining = roomWidth - usedWidth;
  const percentUsed = (usedWidth / roomWidth) * 100;
  
  return {
    isValid: usedWidth <= roomWidth,
    usedWidth,
    remaining,
    percentUsed: Math.min(100, percentUsed),
    message: usedWidth > roomWidth ? `EXCEEDS LIMIT BY ${usedWidth - roomWidth}MM` : 'WITHIN CAPACITY'
  };
};

/**
 * Technical Constraint Check
 * Prevents adding a module if it violates the width rule.
 */
export const canAddModule = (roomWidth, configModules, moduleId) => {
  const modToAdd = MODULES.find(m => m.id === moduleId);
  if (!modToAdd) return false;
  
  const currentUsed = calculateUsedWidth(configModules);
  return (currentUsed + modToAdd.width) <= roomWidth;
};

import { MODULES } from '../data/modules';
import { ACCESSORIES } from '../data/config.jsx';

/**
 * Deterministic Project Valuation Engine
 * Strictly follows the formula: (sum of module base prices × material multiplier) + sum of accessory prices
 */
export const calculateValuation = (config) => {
  // 1. Sum of Module Base Prices
  const moduleTotalBase = Object.entries(config.modules).reduce((total, [id, qty]) => {
    const mod = MODULES.find((m) => m.id === id);
    return total + (mod?.basePrice || 0) * qty;
  }, 0);

  // 2. Material Multiplier
  const materialMultiplier = config.material?.multiplier || 1.0;

  // 3. Subtotal (Modules * Multiplier)
  const modulesValuation = moduleTotalBase * materialMultiplier;

  // 4. Sum of Accessory Prices (Hardware & Internal Accessories)
  const totalUnits = Object.values(config.modules).reduce((a, b) => a + b, 0);
  const handleCost = totalUnits * (config.handle?.price || 0);
  const lightingCost = config.lighting?.price || 0;
  const accessoriesCost = Array.from(config.selectedAccessories).reduce((total, id) => {
    const acc = ACCESSORIES.find((a) => a.id === id);
    return total + (acc?.price || 0);
  }, 0);

  const totalAccessories = handleCost + lightingCost + accessoriesCost;

  // 5. Total Price
  const total = modulesValuation + totalAccessories;

  return {
    modulesSubtotal: Math.round(modulesValuation),
    accessoriesTotal: Math.round(totalAccessories),
    total: Math.round(total),
  };
};

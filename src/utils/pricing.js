import { MODULES } from '../data/modules';
import { ACCESSORIES } from '../data/config.jsx';

/**
 * Deterministic Project Valuation Engine
 * Strictly follows the formula: (sum of module base prices × material multiplier) + sum of accessory prices
 *
 * ─── DATA SOURCE CHANGE (Step 5) ─────────────────────────────────────────────
 * The function now accepts an optional `activePricing` parameter.
 * When provided, prices are sourced from activePricing (Firestore / business overrides).
 * When absent or when a specific item is not found in activePricing,
 * it falls back silently to the original local data files.
 * NO FORMULA OR MATH WAS CHANGED — only WHERE the numbers come from.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const calculateValuation = (config, activePricing = null) => {
  // ── Helper: resolve module basePrice ──────────────────────────────────────
  // CHANGED: try activePricing first (Firestore-merged price), fall back to local MODULES array
  const resolveModulePrice = (id) => {
    if (activePricing?.modules) {
      // Firestore ids use underscores; original ids use "OW/SW 01" format
      const safeId = id.replace(/[/\s]+/g, '_');
      const entry = activePricing.modules[safeId] ?? activePricing.modules[id];
      if (entry?.resolvedPrice != null) return entry.resolvedPrice;
    }
    // Fallback: local modules.js
    const mod = MODULES.find((m) => m.id === id);
    return mod?.basePrice ?? 0;
  };

  // ── Helper: resolve material multiplier ───────────────────────────────────
  // CHANGED: try activePricing first, fall back to config.material.multiplier (already on config)
  const resolveMaterialMultiplier = () => {
    if (activePricing?.materials) {
      const matId = config.material?.id;
      if (matId) {
        const entry = activePricing.materials[matId];
        if (entry?.resolvedMultiplier != null) return entry.resolvedMultiplier;
      }
    }
    // Fallback: value already embedded in config by ConfigContext (from MATERIALS)
    return config.material?.multiplier ?? 1.0;
  };

  // ── Helper: resolve handle basePrice ──────────────────────────────────────
  // CHANGED: try activePricing first, fall back to config.handle.price (already on config)
  const resolveHandlePrice = () => {
    if (activePricing?.handles) {
      const handleName = config.handle?.name;
      if (handleName) {
        // Try name-based lookup (e.g. "Matte Black") then id-based ("matte-black")
        const idKey = handleName.toLowerCase().replace(/\s+/g, '-');
        const entry = activePricing.handles[handleName] ?? activePricing.handles[idKey];
        if (entry?.resolvedPrice != null) return entry.resolvedPrice;
      }
    }
    // Fallback: value already embedded in config by ConfigContext (from HANDLES)
    return config.handle?.price ?? 0;
  };

  // ── Helper: resolve accessory price ───────────────────────────────────────
  // CHANGED: try activePricing first, fall back to local ACCESSORIES array
  const resolveAccessoryPrice = (id) => {
    if (activePricing?.accessories) {
      const entry = activePricing.accessories[id];
      if (entry?.resolvedPrice != null) return entry.resolvedPrice;
    }
    // Fallback: local config.jsx ACCESSORIES
    const acc = ACCESSORIES.find((a) => a.id === id);
    return acc?.price ?? 0;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // FORMULA BELOW IS UNCHANGED — only the data source helpers changed above
  // ════════════════════════════════════════════════════════════════════════════

  // 1. Sum of Module Base Prices
  const moduleTotalBase = Object.entries(config.modules).reduce((total, [id, qty]) => {
    return total + resolveModulePrice(id) * qty; // CHANGED: was MODULES.find(...)
  }, 0);

  // 2. Material Multiplier
  const materialMultiplier = resolveMaterialMultiplier(); // CHANGED: was config.material?.multiplier

  // 3. Subtotal (Modules * Multiplier)
  const modulesValuation = moduleTotalBase * materialMultiplier;

  // 4. Sum of Accessory Prices (Hardware & Internal Accessories)
  const totalUnits = Object.values(config.modules).reduce((a, b) => a + b, 0);
  const handleCost = totalUnits * resolveHandlePrice(); // CHANGED: was config.handle?.price
  const lightingCost = config.lighting?.price ?? 0; // UNCHANGED: lighting not in Firestore yet
  const accessoriesCost = Array.from(config.selectedAccessories).reduce((total, id) => {
    return total + resolveAccessoryPrice(id); // CHANGED: was ACCESSORIES.find(...)
  }, 0);

  const totalAccessories = handleCost + lightingCost + accessoriesCost;

  // 5. Total Price
  const total = modulesValuation + totalAccessories;

  return {
    modulesSubtotal: Math.round(modulesValuation), // UNCHANGED
    accessoriesTotal: Math.round(totalAccessories), // UNCHANGED
    total: Math.round(total), // UNCHANGED
  };
};

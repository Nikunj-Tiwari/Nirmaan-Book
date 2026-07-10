/**
 * firestorePricing.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure data-fetching helper.  No React.  No side effects.
 *
 * Responsibilities:
 *   1. Fetch all platform_catalog sub-collections from Firestore.
 *   2. Optionally fetch price_overrides for a given businessId.
 *   3. Merge: override customPrice wins over platform basePrice.
 *   4. Return a structured activePricing object.
 *
 * Called by ConfigContext on login.  Falls back gracefully on error.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// ── Local fallback data (never modified by this file) ──────────────────────
import { MODULES } from '../data/modules';
import { ACCESSORIES } from '../data/config.jsx';
import { MATERIALS, HANDLES } from '../data/config.jsx';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all items from a platform_catalog sub-collection.
 * Path: platform_catalog/{subCol}/items/{id}
 *
 * @param {string} subCol  – "modules" | "materials" | "handles" | "accessories"
 * @returns {Object}       – { [docId]: docData }
 */
async function fetchCatalogItems(subCol) {
  // Path: platform_catalog/catalog/{subCol}/{itemId}
  // 'catalog' is the bridging document so the subcollection path has 3 segments (odd = valid)
  const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', subCol));
  const result = {};
  snap.forEach((doc) => {
    // Only include active, non-deleted items
    const data = doc.data();
    if (data.isDeleted === true) return;
    result[doc.id] = data;
  });
  return result;
}

/**
 * Fetch all price_overrides documents for a given businessId.
 *
 * @param {string} businessId
 * @returns {Object} – { [productId]: overrideDoc }
 */
async function fetchPriceOverrides(businessId) {
  const q = query(collection(db, 'price_overrides'), where('businessId', '==', businessId));
  const snap = await getDocs(q);
  const result = {};
  snap.forEach((doc) => {
    const data = doc.data();
    result[data.productId] = data;
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the LOCAL fallback activePricing from imported JS files.
 * Shape matches the Firestore-fetched version so pricing.js needs no branching.
 *
 * @returns {Object} activePricing
 */
export function buildLocalFallbackPricing() {
  const modules = {};
  MODULES.forEach((m) => {
    // Sanitise id the same way the seed script did: "OW/SW 01" → "OW_SW_01"
    const safeId = m.id.replace(/[/\s]+/g, '_');
    modules[safeId] = { ...m, resolvedPrice: m.basePrice };
    // Also store under original id so lookups work both ways
    modules[m.id] = { ...m, resolvedPrice: m.basePrice };
  });

  const materials = {};
  MATERIALS.forEach((mat) => {
    materials[mat.id] = { ...mat, resolvedMultiplier: mat.multiplier };
  });

  const handles = {};
  HANDLES.forEach((h) => {
    // Normalise handle name to an id-style key (e.g. "Matte Black" → "matte-black")
    const id = h.name.toLowerCase().replace(/\s+/g, '-');
    handles[id] = { ...h, resolvedPrice: h.price };
    handles[h.name] = { ...h, resolvedPrice: h.price }; // also by name
  });

  const accessories = {};
  ACCESSORIES.forEach((a) => {
    accessories[a.id] = { ...a, resolvedPrice: a.price };
  });

  return { modules, materials, handles, accessories };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main entry point called by ConfigContext.
 *
 * Architecture change: price_overrides are no longer read at runtime.
 * Platform prices (admin-set basePrice) are final.
 * Business partner's own modules use their own basePrice stored in business_modules.
 *
 * @returns {Promise<Object>} activePricing (throws on hard failure)
 */
export async function fetchActivePricing() {
  // Fetch all 4 platform_catalog sub-collections in parallel
  const [fsModules, fsMaterials, fsHandles, fsAccessories] = await Promise.all([
    fetchCatalogItems('modules'),
    fetchCatalogItems('materials'),
    fetchCatalogItems('handles'),
    fetchCatalogItems('accessories'),
  ]);

  // Modules — resolvedPrice = admin's basePrice (final, no override)
  const modules = {};
  Object.entries(fsModules).forEach(([id, data]) => {
    modules[id] = { ...data, resolvedPrice: data.basePrice ?? 0 };
  });

  // Materials — resolvedMultiplier = admin's priceMultiplier (final)
  const materials = {};
  Object.entries(fsMaterials).forEach(([id, data]) => {
    materials[id] = {
      ...data,
      resolvedMultiplier: data.priceMultiplier ?? data.multiplier ?? 1.0,
    };
  });

  // Handles — resolvedPrice = admin's basePrice (final)
  const handles = {};
  Object.entries(fsHandles).forEach(([id, data]) => {
    handles[id] = { ...data, resolvedPrice: data.basePrice ?? 0 };
    if (data.name) handles[data.name] = handles[id]; // backwards compat name lookup
  });

  // Accessories — resolvedPrice = admin's basePrice (final)
  const accessories = {};
  Object.entries(fsAccessories).forEach(([id, data]) => {
    accessories[id] = { ...data, resolvedPrice: data.basePrice ?? 0 };
  });

  return { modules, materials, handles, accessories };
}

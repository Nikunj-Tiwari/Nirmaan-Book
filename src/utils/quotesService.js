/**
 * quotesService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All Firestore read/write operations for the `quotes` collection.
 * No React. No side effects. Pure async functions.
 *
 * Quote document shape:
 *   quoteId:        string  (auto-generated)
 *   customerId:     string  (uid of the customer)
 *   businessId:     string  (uid of the business partner)
 *   customerEmail:  string
 *   projectName:    string
 *   wallType:       string
 *   status:         "draft" | "sent" | "approved" | "rejected"
 *   snapshotPrices: { modules, handles, materials, accessories }
 *   totalAmount:    number
 *   createdAt:      timestamp
 *   updatedAt:      timestamp
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Create a new quote document in Firestore.
 *
 * @param {{
 *   customerId: string,
 *   customerEmail: string,
 *   businessId: string,
 *   projectName: string,
 *   wallType: string,
 *   modules: object,
 *   activePricing: object,
 *   valuation: { modulesSubtotal: number, accessoriesTotal: number, total: number },
 * }} payload
 * @returns {Promise<string>} quoteId
 */
export async function createQuote({
  customerId,
  customerEmail,
  businessId,
  projectName,
  wallType,
  modules,
  activePricing,
  valuation,
  configSnapshot,
}) {
  // Build a serialisable price snapshot (only plain numbers, no functions/JSX)
  const snapshotPrices = {
    modules: {},
    handles: {},
    materials: {},
    accessories: {},
  };

  if (activePricing?.modules) {
    Object.entries(activePricing.modules).forEach(([id, data]) => {
      snapshotPrices.modules[id] = data.resolvedPrice ?? data.basePrice ?? 0;
    });
  }
  if (activePricing?.handles) {
    Object.entries(activePricing.handles).forEach(([id, data]) => {
      snapshotPrices.handles[id] = data.resolvedPrice ?? data.basePrice ?? 0;
    });
  }
  if (activePricing?.materials) {
    Object.entries(activePricing.materials).forEach(([id, data]) => {
      snapshotPrices.materials[id] = data.resolvedMultiplier ?? data.priceMultiplier ?? 1.0;
    });
  }
  if (activePricing?.accessories) {
    Object.entries(activePricing.accessories).forEach(([id, data]) => {
      snapshotPrices.accessories[id] = data.resolvedPrice ?? data.basePrice ?? 0;
    });
  }

  // Recursively sanitize objects for Firestore: strips React elements, functions, symbols, and converts Sets
  function sanitizeForFirestore(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'function' || typeof val === 'symbol') return undefined;
    if (typeof val !== 'object') return val;
    if (val instanceof Date) return val;
    if (val instanceof Set) return Array.from(val).map(sanitizeForFirestore);
    if (Array.isArray(val)) return val.map(sanitizeForFirestore).filter((v) => v !== undefined);
    // Remove React elements ($$typeof symbol)
    if (val.$$typeof || val._owner || (val.props && val.type)) return undefined;

    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      if (k === 'icon' && typeof v === 'object') continue;
      const sv = sanitizeForFirestore(v);
      if (sv !== undefined) clean[k] = sv;
    }
    return clean;
  }

  const safeSnapshot = configSnapshot ? sanitizeForFirestore(configSnapshot) : null;
  const safeModules = modules ? sanitizeForFirestore(modules) : {};

  const ref = await addDoc(collection(db, 'quotes'), {
    customerId,
    customerEmail: customerEmail ?? '',
    businessId,
    projectName: projectName || 'Untitled Project',
    wallType: wallType || 'single',
    modules: safeModules,
    status: 'sent',
    snapshotPrices,
    configSnapshot: safeSnapshot,
    totalAmount: valuation?.total ?? 0,
    modulesSubtotal: valuation?.modulesSubtotal ?? 0,
    accessoriesTotal: valuation?.accessoriesTotal ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all quotes where customerId == uid.
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function getCustomerQuotes(uid) {
  // NOTE: Using where() only (no orderBy) to avoid requiring a composite Firestore index.
  // Sorting is done client-side below.
  const q = query(collection(db, 'quotes'), where('customerId', '==', uid));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ quoteId: d.id, ...d.data() }));
  // Sort client-side: newest first
  return docs.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

/**
 * Fetch all quotes where businessId == uid.
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function getBusinessQuotes(uid) {
  // NOTE: Using where() only (no orderBy) to avoid requiring a composite Firestore index.
  // Sorting is done client-side below.
  const q = query(collection(db, 'quotes'), where('businessId', '==', uid));
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ quoteId: d.id, ...d.data() }));
  // Sort client-side: newest first
  return docs.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}

/**
 * Fetch ALL quotes (super_admin only).
 * @returns {Promise<Array>}
 */
export async function getAllQuotes() {
  const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ quoteId: d.id, ...d.data() }));
}

/**
 * Fetch a single quote by ID.
 * @param {string} quoteId
 * @returns {Promise<object|null>}
 */
export async function getQuote(quoteId) {
  const snap = await getDoc(doc(db, 'quotes', quoteId));
  if (!snap.exists()) return null;
  return { quoteId: snap.id, ...snap.data() };
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Update quote status. Called by business partner.
 * @param {string} quoteId
 * @param {'draft'|'sent'|'approved'|'rejected'} status
 */
export async function updateQuoteStatus(quoteId, status) {
  await updateDoc(doc(db, 'quotes', quoteId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─── Price Overrides ──────────────────────────────────────────────────────────

/**
 * Fetch all price overrides for a businessId.
 * @param {string} businessId
 * @returns {Promise<Array>} array of override docs
 */
export async function getPriceOverrides(businessId) {
  const q = query(collection(db, 'price_overrides'), where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

/**
 * Save a price override for a specific product.
 * Creates or overwrites the doc.
 * @param {string} businessId
 * @param {string} productId
 * @param {'module'|'material'|'handle'|'accessory'} productType
 * @param {number} customPrice
 */
export async function savePriceOverride(businessId, productId, productType, customPrice) {
  const { setDoc } = await import('firebase/firestore');
  const docId = `${businessId}_${productId}`;
  await setDoc(doc(db, 'price_overrides', docId), {
    businessId,
    productId,
    productType,
    customPrice: Number(customPrice),
    isManualOverride: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a price override (revert to platform price).
 * @param {string} businessId
 * @param {string} productId
 */
export async function deletePriceOverride(businessId, productId) {
  const { deleteDoc } = await import('firebase/firestore');
  const docId = `${businessId}_${productId}`;
  await deleteDoc(doc(db, 'price_overrides', docId));
}

// ─── Users (Admin) ────────────────────────────────────────────────────────────

/**
 * Fetch all users (super_admin only).
 * @returns {Promise<Array>}
 */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data());
}

/**
 * Update a user's status (approve / suspend).
 * Also syncs status on the businesses doc for business_partner users.
 * @param {string} uid
 * @param {'active'|'suspended'|'pending'} status
 */
export async function updateUserStatus(uid, status) {
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);

  // Update users/{uid}
  batch.update(doc(db, 'users', uid), { status });

  // Check if they have a businesses doc and sync
  const bizSnap = await getDoc(doc(db, 'businesses', uid));
  if (bizSnap.exists()) {
    batch.update(doc(db, 'businesses', uid), {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

/**
 * Fetch all platform catalog items for a sub-collection.
 * @param {'modules'|'materials'|'handles'|'accessories'} subCol
 * @returns {Promise<Array>}
 */
export async function getCatalogItems(subCol) {
  // Path: platform_catalog/catalog/{subCol}/{docId}  (3-segment collection, valid)
  const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', subCol));
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

/**
 * Toggle isActive on a platform catalog item.
 * @param {'modules'|'materials'|'handles'|'accessories'} subCol
 * @param {string} itemId
 * @param {boolean} isActive
 */
export async function setCatalogItemActive(subCol, itemId, isActive) {
  await updateDoc(doc(db, 'platform_catalog', 'catalog', subCol, itemId), {
    isActive,
    updatedAt: serverTimestamp(),
  });
}

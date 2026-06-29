/**
 * seedPlatformCatalog.js
 *
 * Populates the Firestore `platform_catalog` collection with modules,
 * materials, handles, and accessories sourced from the existing local data files.
 *
 * HOW TO USE
 * ----------
 * Import and call seedPlatformCatalog() once from the browser console or a
 * temporary admin page.  NEVER import this function in any production code path
 * — it must be triggered manually.
 *
 * Example (browser console while app is running and you are signed in as
 * super_admin):
 *
 *   import { seedPlatformCatalog } from './utils/seedPlatformCatalog';
 *   await seedPlatformCatalog();
 *
 * The function is idempotent — re-running it will overwrite existing docs with
 * the same id (setDoc, merge: false).  Watch the console for per-item logs.
 */

import { getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ─── Source data ──────────────────────────────────────────────────────────────
// Only plain-data arrays are imported. React JSX icon nodes inside config.jsx
// are stripped out at the item level below — we never import or render them.
import { MODULES } from '../data/modules.js';
import { MATERIALS, HANDLES, ACCESSORIES } from '../data/config.jsx';

// ─── Firebase helpers ─────────────────────────────────────────────────────────

/**
 * Returns the already-initialised Firestore instance.
 * Throws if the Firebase app has not been initialised yet.
 */
function getDb() {
  const existingApps = getApps();
  if (!existingApps.length) {
    throw new Error(
      '[seedPlatformCatalog] Firebase app is not initialised. ' +
        'Make sure the main firebase.js has been imported before calling this function.'
    );
  }
  return getFirestore(existingApps[0]);
}

/**
 * Writes a single document to a platform_catalog sub-collection.
 * Logs success (✅) or failure (❌) to the console.
 *
 * Firestore path:
 *   platform_catalog / {subCollection} / {docId}
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} subCollection  e.g. 'modules' | 'materials' | 'handles' | 'accessories'
 * @param {string} docId          Document ID
 * @param {object} data           Payload fields (timestamps are added here)
 */
async function writeItem(db, subCollection, docId, data) {
  const ref = doc(collection(db, 'platform_catalog', subCollection, 'items'), docId);
  try {
    await setDoc(ref, {
      ...data,
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`  ✅ [${subCollection}] "${docId}" — written`);
  } catch (err) {
    console.error(`  ❌ [${subCollection}] "${docId}" — FAILED:`, err.message);
  }
}

// ─── Sub-seeders ──────────────────────────────────────────────────────────────

async function seedModules(db) {
  console.group('📦 Seeding modules …');
  for (const mod of MODULES) {
    const { id, name, type: category, basePrice, width, height, depth } = mod;
    await writeItem(db, 'modules', id, {
      id,
      name,
      category, // mapped from `type` in modules.js
      basePrice,
      width,
      height,
      depth,
    });
  }
  console.groupEnd();
}

async function seedMaterials(db) {
  console.group('🪵 Seeding materials …');
  for (const mat of MATERIALS) {
    const { id, name, multiplier } = mat;
    await writeItem(db, 'materials', id, {
      id,
      name,
      priceMultiplier: multiplier,
    });
  }
  console.groupEnd();
}

async function seedHandles(db) {
  console.group('🔧 Seeding handles …');
  for (const handle of HANDLES) {
    // HANDLES in config.jsx have no id — derive a stable one from the name.
    const id = handle.name.toLowerCase().replace(/\s+/g, '-');
    await writeItem(db, 'handles', id, {
      id,
      name: handle.name,
      basePrice: handle.price,
    });
  }
  console.groupEnd();
}

async function seedAccessories(db) {
  console.group('✨ Seeding accessories …');
  for (const acc of ACCESSORIES) {
    // Accessories in config.jsx contain React JSX icon nodes — strip them.
    const { id, name, desc, price } = acc;

    // Derive a broad category from the id for easier Firestore querying.
    let category = 'general';
    if (id.startsWith('jewel')) category = 'jewellery';
    else if (id.startsWith('acc')) category = 'tray';
    else if (id === 'shoe') category = 'shoe';
    else if (id === 'rack-t') category = 'rack';
    else if (id === 'mirror') category = 'mirror';
    else if (id === 'side' || id === 'top') category = 'rod';

    await writeItem(db, 'accessories', id, {
      id,
      name,
      basePrice: price,
      category,
      description: desc ?? '',
    });
  }
  console.groupEnd();
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * seedPlatformCatalog()
 *
 * Call this ONCE, manually, from a super_admin session.
 *
 * It writes all platform catalog data to Firestore under:
 *
 *   platform_catalog/modules/items/{id}
 *   platform_catalog/materials/items/{id}
 *   platform_catalog/handles/items/{id}
 *   platform_catalog/accessories/items/{id}
 *
 * Every document is stamped with:
 *   isActive: true, isDeleted: false, createdAt: <now>, updatedAt: <now>
 *
 * DO NOT call this function on app startup or in any production code path.
 */
export async function seedPlatformCatalog() {
  console.log('');
  console.log('🚀 seedPlatformCatalog — starting …');
  console.log('   ⚠️  Run ONCE only from a super_admin session.');
  console.log('');

  const db = getDb();

  await seedModules(db);
  await seedMaterials(db);
  await seedHandles(db);
  await seedAccessories(db);

  console.log('');
  console.log('🎉 seedPlatformCatalog — complete!');
  console.log('   Verify in Firebase Console → Firestore → platform_catalog/*');
  console.log('');
}

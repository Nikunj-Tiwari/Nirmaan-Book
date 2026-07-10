/**
 * seedPlatformCatalog.js
 *
 * Populates the Firestore `platform_catalog` collection with modules,
 * materials, handles, and accessories sourced from the existing local data files.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  HOW TO USE                                                             │
 * │  ──────────                                                             │
 * │  Call seedPlatformCatalog() ONCE, manually, from a super_admin session. │
 * │  Never import this in any production code path.                         │
 * │                                                                         │
 * │  Option A — browser console (app must be running, signed in as          │
 * │  super_admin):                                                           │
 * │                                                                         │
 * │    const { seedPlatformCatalog } =                                      │
 * │      await import('/src/utils/seedPlatformCatalog.js');                 │
 * │    await seedPlatformCatalog();                                          │
 * │                                                                         │
 * │  Option B — a temporary admin-only button/route that calls the fn.      │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Firestore paths written:
 *   platform_catalog/modules/{moduleId}
 *   platform_catalog/materials/{materialId}
 *   platform_catalog/handles/{handleId}
 *   platform_catalog/accessories/{accessoryId}
 *
 * Every document is stamped with:
 *   isActive: true  |  isDeleted: false  |  createdAt: <now>  |  updatedAt: <now>
 *
 * The function is idempotent — re-running it overwrites existing docs with the
 * same id (setDoc, merge: false).  Watch the console for per-item logs.
 */

import { getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ─── Source data ──────────────────────────────────────────────────────────────
// Only plain-data arrays are imported.
// React JSX icon nodes inside config.jsx are stripped at the item level below.
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
        'Ensure firebase.js has been imported before calling this function.'
    );
  }
  return getFirestore(existingApps[0]);
}

/**
 * Writes a single document into a platform_catalog sub-collection.
 * Logs ✅ on success or ❌ on failure.
 *
 * Firestore path:  platform_catalog/{subCollection}/{docId}
 *
 * @param {import('firebase/firestore').Firestore} db
 * @param {'modules'|'materials'|'handles'|'accessories'} subCollection
 * @param {string} docId   Document ID
 * @param {object} data    Plain payload (no JSX, no functions)
 */
async function writeItem(db, subCollection, docId, data) {
  // Correct Firestore path: platform_catalog/catalog/{subCollection}/{docId}
  // - 'platform_catalog' = top-level collection (1 segment)
  // - 'catalog'          = bridging document    (2 segments, even = valid doc)
  // - subCollection      = sub-collection       (3 segments, odd = valid collection)
  // - docId              = item document        (4 segments, even = valid doc) ✓
  const ref = doc(db, 'platform_catalog', 'catalog', subCollection, docId);
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

/**
 * Seeds platform_catalog/modules/{id}
 * Source: src/data/modules.js → MODULES array
 * Fields: id, name, category (mapped from `type`), basePrice, width, height, depth
 */
async function seedModules(db) {
  console.group('📦 Seeding modules …');
  for (const mod of MODULES) {
    const { id, name, type: category, basePrice, width, height, depth } = mod;
    await writeItem(db, 'modules', id, {
      id,
      name,
      category, // `type` in modules.js → `category` in Firestore schema
      basePrice,
      width,
      height,
      depth,
    });
  }
  console.groupEnd();
}

/**
 * Seeds platform_catalog/materials/{id}
 * Source: src/data/config.jsx → MATERIALS array
 * Fields: id, name, priceMultiplier (mapped from `multiplier`)
 */
async function seedMaterials(db) {
  console.group('🪵 Seeding materials …');
  for (const mat of MATERIALS) {
    const { id, name, multiplier } = mat;
    await writeItem(db, 'materials', id, {
      id,
      name,
      priceMultiplier: multiplier, // `multiplier` in config.jsx → `priceMultiplier` in schema
    });
  }
  console.groupEnd();
}

/**
 * Seeds platform_catalog/handles/{id}
 * Source: src/data/config.jsx → HANDLES array
 * HANDLES have no `id` field — a stable id is derived from the name.
 * Fields: id (derived), name, basePrice (mapped from `price`)
 */
async function seedHandles(db) {
  console.group('🔧 Seeding handles …');
  for (const handle of HANDLES) {
    // Derive a stable, URL-safe id from the handle name (source has no id field).
    const id = handle.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    await writeItem(db, 'handles', id, {
      id,
      name: handle.name,
      basePrice: handle.price, // `price` in config.jsx → `basePrice` in schema
    });
  }
  console.groupEnd();
}

/**
 * Seeds platform_catalog/accessories/{id}
 * Source: src/data/config.jsx → ACCESSORIES array
 * JSX icon nodes are intentionally omitted — only plain data fields are written.
 * Fields: id, name, basePrice (mapped from `price`), category (derived), description
 */
async function seedAccessories(db) {
  console.group('✨ Seeding accessories …');
  for (const acc of ACCESSORIES) {
    // Strip React JSX `icon` node — only use serialisable fields.
    const { id, name, desc, price } = acc;

    // Derive a broad category from the id for Firestore querying convenience.
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
      basePrice: price, // `price` in config.jsx → `basePrice` in schema
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
 * Writes all platform catalog items to Firestore.
 * Call ONCE, manually, from a super_admin session.
 *
 * Collections written:
 *   platform_catalog/modules/{id}
 *   platform_catalog/materials/{id}
 *   platform_catalog/handles/{id}
 *   platform_catalog/accessories/{id}
 *
 * ⚠️  DO NOT call on app startup or in any production code path.
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

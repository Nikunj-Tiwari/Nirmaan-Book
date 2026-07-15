/**
 * scripts/seedFirestoreNode.mjs
 *
 * Seeds Firestore using the Firebase REST API (no firebase-admin / no ADC needed).
 * Authenticates with email + password to get an ID token, then writes all 65 docs.
 *
 * Usage:
 *   node scripts/seedFirestoreNode.mjs <email> <password>
 *
 * Example:
 *   node scripts/seedFirestoreNode.mjs admin@example.com yourpassword
 *
 * The account must have super_admin role in Firestore (matches firestore.rules).
 * All 71 images must already be in ImageKit (run importCatalogueNode.mjs first).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---- Config ------------------------------------------------------------------
const API_KEY         = 'AIzaSyCnuAm7FcFrObKIsh2Zlssp63ChtmlLr_U';
const PROJECT_ID      = 'nirmanbook-15825';
const IMAGEKIT_BASE   = 'https://ik.imagekit.io/nirmaanbook/catalogue/';
const FIRESTORE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ---- Pricing formula ---------------------------------------------------------
function computeBasePrice(mod, isCorner) {
  let base;
  if (isCorner) {
    base = 3200;
  } else {
    const isOWOnly = Array.isArray(mod.availableIn) && mod.availableIn.length === 1 && mod.availableIn[0] === 'OW';
    base = isOWOnly ? 1500 : 1800;
  }
  let extra = 0; let accCharged = false;
  for (const s of mod.sections || []) {
    if (s.type === 'shelf')   extra += 300  * (s.count || 1);
    if (s.type === 'hanging') extra += 800  * (s.count || 1);
    if (s.type === 'drawer')  extra += 1200 * (s.count || 1);
    if (s.type === 'door')    extra += 600  * (s.count || 1);
    if (s.type === 'accessory' && !accCharged) { extra += 600; accCharged = true; }
  }
  return base + extra;
}

const ACCESSORY_PRICES = {
  'shoe-rack': 800, 'trouser-rack': 700,
  'side-mounted-hanger-rod': 650, 'top-mounted-hanger-rod': 650,
  'jewellery-tray': 550, 'accessory-tray': 450,
};

// ---- Firebase REST Auth ------------------------------------------------------
async function signIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Sign-in failed: ${data.error?.message || res.status}`);
  console.log('Signed in as:', data.email);
  return data.idToken;
}

// ---- Firestore REST write ----------------------------------------------------
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toFirestoreValue(v);
  return fields;
}

async function writeDoc(idToken, collectionPath, id, data) {
  const path = `${FIRESTORE_URL}/${collectionPath}/${id}`;
  const body = JSON.stringify({ fields: toFirestoreFields({
    ...data,
    isActive: true, isDeleted: false,
    createdBy: 'admin', createdByName: 'Admin',
  }) });

  const res = await fetch(path, {
    method: 'PATCH',  // PATCH = createOrUpdate (upsert)
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Firestore write failed (${res.status})`);
  }
  return res.json();
}

// ---- Main -------------------------------------------------------------------
const { wardrobeModules, cornerUnits, internalColours, drawerFascia, wardrobeAccessories } =
  await import('../wardrobeCatalogueData.js');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node scripts/seedFirestoreNode.mjs <email> <password>');
  console.error('Example: node scripts/seedFirestoreNode.mjs admin@yourapp.com password123');
  process.exit(1);
}

const idToken = await signIn(email, password);

const BASE_PATH = 'platform_catalog%2Fcatalog';  // URL-encoded subcollection path

// Helper: imagekit URL for a filename
const ik = (filename) => IMAGEKIT_BASE + filename;

let ok = 0, fail = 0;

async function w(col, id, data) {
  try {
    await writeDoc(idToken, `platform_catalog/catalog/${col}`, id, data);
    console.log(`  OK [${col}] ${id}`);
    ok++;
  } catch (e) {
    console.log(`  FAIL [${col}] ${id}: ${e.message}`);
    fail++;
  }
}

console.log('\nSeeding modules (45)...');
for (const mod of wardrobeModules) {
  await w('modules', mod.id, {
    id: mod.id, displayId: mod.displayId, name: mod.name,
    category: mod.category, availableIn: mod.availableIn,
    sections: mod.sections, accessoryEditable: mod.accessoryEditable,
    imageUrl: ik(mod.image),
    basePrice: computeBasePrice(mod, false), width: 600, height: 2400, depth: 600,
  });
}

console.log('\nSeeding corner units (4)...');
for (const cu of cornerUnits) {
  await w('modules', cu.id, {
    id: cu.id, displayId: cu.displayId, name: cu.name,
    category: cu.category, availableIn: cu.availableIn,
    cornerVariant: cu.cornerVariant, sections: cu.sections,
    accessoryEditable: cu.accessoryEditable,
    imageUrl: ik(cu.image),
    basePrice: computeBasePrice(cu, true), width: 900, height: 2400, depth: 600,
  });
}

console.log('\nSeeding internal colours (7)...');
for (const c of internalColours) {
  await w('internalColours', c.id, { id: c.id, name: c.name, hex: c.hex, imageUrl: ik(c.image) });
}

console.log('\nSeeding drawer fascia (9)...');
for (const f of drawerFascia) {
  await w('drawerFascia', f.id, { id: f.id, name: f.name, handleStyle: f.handleStyle, imageUrl: ik(f.image) });
}

console.log('\nSeeding accessories (6)...');
for (const a of wardrobeAccessories) {
  const basePrice = ACCESSORY_PRICES[a.id] || 500;
  await w('accessories', a.id, { id: a.id, name: a.name, slotType: a.slotType, imageUrl: ik(a.image), basePrice });
}

console.log(`\n=== DONE: ${ok} docs written, ${fail} failed ===`);
if (fail === 0) {
  console.log('SUCCESS -- all 65 Firestore docs seeded!');
  console.log('Admin Catalog: 49 modules, 7 colours, 9 fascia, 6 accessories');
}
process.exit(fail > 0 ? 1 : 0);

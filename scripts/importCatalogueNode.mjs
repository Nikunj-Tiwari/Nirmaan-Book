/**
 * scripts/importCatalogueNode.mjs
 *
 * Standalone Node.js import script.  Run from the project root:
 *
 *   node scripts/importCatalogueNode.mjs
 *
 * Requirements:
 *   - Node 18+ (uses native fetch)
 *   - functions/node_modules must be installed (cd functions && npm install)
 *   - functions/.env must have IMAGEKIT_PRIVATE_KEY + IMAGEKIT_PUBLIC_KEY
 *   - Firebase auth: one of the following (checked in order):
 *       1. GOOGLE_APPLICATION_CREDENTIALS env var pointing to service-account JSON
 *       2. Application Default Credentials (run: gcloud auth application-default login)
 *       3. Set FIREBASE_TOKEN in environment (firebase login --no-localhost, copy token)
 *
 * This script uses the @imagekit/nodejs SDK directly with the private key,
 * so NO browser session or /api/imagekit-auth endpoint is needed.
 */

import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FUNCTIONS_DIR = resolve(ROOT, 'functions');

// Load .env from functions/
const envPath = resolve(FUNCTIONS_DIR, '.env');
if (!existsSync(envPath)) {
  console.error('ERROR: functions/.env not found at', envPath);
  process.exit(1);
}
const envVars = {};
readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^([^=]+)=["']?(.+?)["']?\s*$/);
  if (m) envVars[m[1].trim()] = m[2].trim();
});

const IMAGEKIT_PRIVATE_KEY  = envVars.IMAGEKIT_PRIVATE_KEY  || process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_PUBLIC_KEY   = envVars.IMAGEKIT_PUBLIC_KEY   || process.env.IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_URL_ENDPOINT = envVars.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/nirmaanbook';
const FIREBASE_PROJECT_ID   = 'nirmanbook-15825';

if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY) {
  console.error('ERROR: IMAGEKIT_PRIVATE_KEY / IMAGEKIT_PUBLIC_KEY not found in functions/.env');
  process.exit(1);
}

// Require firebase-admin from functions/node_modules
const require = createRequire(import.meta.url);
let admin;
try {
  admin = require(resolve(FUNCTIONS_DIR, 'node_modules', 'firebase-admin'));
} catch (e) {
  console.error('ERROR: firebase-admin not found. Run: cd functions && npm install');
  process.exit(1);
}

// Init firebase-admin with Application Default Credentials
try {
  admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  console.log('Firebase Admin initialised (project:', FIREBASE_PROJECT_ID, ')');
} catch (e) {
  console.error('Firebase Admin init failed:', e.message);
  console.error('Fix: run  gcloud auth application-default login  or set GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

const db = admin.firestore();

// ---- Catalogue data (inline from wardrobeCatalogueData.js) ------------------
// We inline the data here rather than import it to avoid ESM/CJS issues.
// If you update wardrobeCatalogueData.js, re-sync this section.
const { wardrobeModules, cornerUnits, internalColours, drawerFascia, wardrobeAccessories } =
  await import('../wardrobeCatalogueData.js');

// ---- Pricing formula ---------------------------------------------------------

function computeBasePrice(mod, isCorner) {
  let base;
  if (isCorner) {
    base = 3200;
  } else {
    const isOWOnly = Array.isArray(mod.availableIn) && mod.availableIn.length === 1 && mod.availableIn[0] === 'OW';
    base = isOWOnly ? 1500 : 1800;
  }
  let extra = 0;
  let accCharged = false;
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

// ---- ImageKit upload (direct, no browser auth endpoint) ---------------------

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_BASE_URL   = 'https://ik.imagekit.io/nirmaanbook/catalogue/';

function generateImageKitAuth() {
  const token  = crypto.randomUUID();
  const expire = String(Math.floor(Date.now() / 1000) + 2400);
  const signature = crypto
    .createHmac('sha1', IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');
  return { token, expire, signature };
}

async function checkExistingImageKit(filename) {
  try {
    const r = await fetch(IMAGEKIT_BASE_URL + filename, { method: 'HEAD' });
    return r.ok ? (IMAGEKIT_BASE_URL + filename) : null;
  } catch { return null; }
}

async function uploadImageNode(filename) {
  const imgPath = resolve(ROOT, 'public', 'catalogue-images', filename);
  if (!existsSync(imgPath)) throw new Error('File not found: ' + imgPath);
  const fileBuffer = readFileSync(imgPath);
  if (fileBuffer.length === 0) throw new Error(filename + ' is 0 bytes');

  const auth = generateImageKitAuth();  // local, no HTTP call needed

  const { FormData, Blob } = await import('node:buffer').then(() => globalThis).catch(() => ({}));
  // Use undici/node fetch FormData
  const fd = new (globalThis.FormData || (await import('formdata-node')).FormData)();
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  fd.append('file', blob, filename);
  fd.append('fileName', filename);
  fd.append('publicKey', IMAGEKIT_PUBLIC_KEY);
  fd.append('folder', '/catalogue');
  fd.append('signature', auth.signature);
  fd.append('expire', auth.expire);
  fd.append('token', auth.token);

  const res = await fetch(IMAGEKIT_UPLOAD_URL, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Upload failed ' + res.status);
  }
  const data = await res.json();
  if (!data.url) throw new Error('ImageKit response missing url');
  return data.url;
}

// ---- Firestore ---------------------------------------------------------------

async function writeDoc(colName, id, data) {
  const ref = db.collection('platform_catalog').doc('catalog').collection(colName).doc(id);
  await ref.set({
    ...data,
    isActive: true, isDeleted: false,
    createdBy: 'admin', createdByName: 'Admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ---- Main -------------------------------------------------------------------

async function main() {
  const allItems = [...wardrobeModules, ...cornerUnits, ...internalColours, ...drawerFascia, ...wardrobeAccessories];
  const allFilenames = [...new Set(allItems.map((i) => i.image))];
  console.log('\nImages to process:', allFilenames.length);

  const urlMap = {};
  const failures = [];
  let skipped = 0;

  for (let i = 0; i < allFilenames.length; i++) {
    const fn = allFilenames[i];
    try {
      const existing = await checkExistingImageKit(fn);
      if (existing) {
        urlMap[fn] = existing; skipped++;
        console.log('  SKIP [' + (i+1) + '/' + allFilenames.length + '] ' + fn);
        continue;
      }
      const url = await uploadImageNode(fn);
      urlMap[fn] = url;
      console.log('  OK   [' + (i+1) + '/' + allFilenames.length + '] ' + fn);
    } catch (err) {
      failures.push({ filename: fn, error: err.message });
      console.log('  FAIL [' + (i+1) + '/' + allFilenames.length + '] ' + fn + ' -- ' + err.message);
    }
  }

  console.log('\nImages: ' + Object.keys(urlMap).length + ' ok, ' + skipped + ' skipped, ' + failures.length + ' failed');

  // Seed Firestore
  console.log('\nSeeding Firestore...');
  for (const mod of wardrobeModules) {
    await writeDoc('modules', mod.id, {
      id: mod.id, displayId: mod.displayId, name: mod.name,
      category: mod.category, availableIn: mod.availableIn,
      sections: mod.sections, accessoryEditable: mod.accessoryEditable,
      imageUrl: urlMap[mod.image] || '',
      basePrice: computeBasePrice(mod, false), width: 600, height: 2400, depth: 600,
    });
    console.log('  [mod] ' + mod.id);
  }
  for (const cu of cornerUnits) {
    await writeDoc('modules', cu.id, {
      id: cu.id, displayId: cu.displayId, name: cu.name,
      category: cu.category, availableIn: cu.availableIn,
      cornerVariant: cu.cornerVariant, sections: cu.sections,
      accessoryEditable: cu.accessoryEditable,
      imageUrl: urlMap[cu.image] || '',
      basePrice: computeBasePrice(cu, true), width: 900, height: 2400, depth: 600,
    });
    console.log('  [cor] ' + cu.id);
  }
  for (const c of internalColours) {
    await writeDoc('internalColours', c.id, { id: c.id, name: c.name, hex: c.hex, imageUrl: urlMap[c.image] || '' });
    console.log('  [col] ' + c.id);
  }
  for (const f of drawerFascia) {
    await writeDoc('drawerFascia', f.id, { id: f.id, name: f.name, handleStyle: f.handleStyle, imageUrl: urlMap[f.image] || '' });
    console.log('  [fas] ' + f.id);
  }
  for (const a of wardrobeAccessories) {
    const basePrice = ACCESSORY_PRICES[a.id] || 500;
    await writeDoc('accessories', a.id, { id: a.id, name: a.name, slotType: a.slotType, imageUrl: urlMap[a.image] || '', basePrice });
    console.log('  [acc] ' + a.id + ' Rs.' + basePrice);
  }

  console.log('\n=== DONE ===');
  console.log('Images : ' + Object.keys(urlMap).length + '/' + allFilenames.length + ' (' + failures.length + ' failed)');
  if (failures.length) {
    console.log('FAILED:');
    failures.forEach(f => console.log('  ' + f.filename + ': ' + f.error));
  } else {
    console.log('SUCCESS -- all 71 images uploaded!');
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

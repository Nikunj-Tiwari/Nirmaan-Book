/**
 * importCatalogueData.js
 *
 * One-time import script.  Reads wardrobeCatalogueData.js, uploads all 71
 * product images to ImageKit, then writes every Firestore document for:
 *   - 45 modules + 4 corner units  =>  platform_catalog/catalog/modules/{id}
 *   - 7 internal colours           =>  platform_catalog/catalog/internalColours/{id}
 *   - 9 drawer fascia              =>  platform_catalog/catalog/drawerFascia/{id}
 *   - 6 accessories                =>  platform_catalog/catalog/accessories/{id}
 *
 * ROOT-CAUSE FIX (2026-07-15):
 *   The previous version cached a single {token, signature, expire} triplet
 *   and reused it for all 71 uploads. ImageKit treats `token` as a one-time
 *   anti-replay nonce -- only the FIRST upload succeeds; the rest are rejected.
 *   Fix: fetch a FRESH auth token per file.
 *
 * Safe to re-run: images already in ImageKit are skipped (HEAD check).
 * Firestore docs are always overwritten (setDoc with fixed IDs, no duplicates).
 *
 * PRICING:
 *   Provisional formula applied automatically:
 *     OW-only base 1500, OW/SW base 1800, Corner base 3200
 *     + shelf 300*n, hanging 800*n, drawer 1200*n, door 600*n, accessory 600 flat
 */

import { getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  wardrobeModules,
  cornerUnits,
  internalColours,
  drawerFascia,
  wardrobeAccessories,
} from '../../wardrobeCatalogueData.js';

// ---- Firebase ----------------------------------------------------------------

function getDb() {
  const apps = getApps();
  if (!apps.length) throw new Error('[importCatalogueData] Firebase not initialised');
  return getFirestore(apps[0]);
}

// ---- Pricing formula ---------------------------------------------------------

function computeBasePrice(mod, isCorner) {
  let base;
  if (isCorner) {
    base = 3200;
  } else {
    const isOWOnly =
      Array.isArray(mod.availableIn) && mod.availableIn.length === 1 && mod.availableIn[0] === 'OW';
    base = isOWOnly ? 1500 : 1800;
  }

  let extra = 0;
  let accessoryCharged = false;
  for (const s of mod.sections || []) {
    if (s.type === 'shelf') extra += 300 * (s.count || 1);
    if (s.type === 'hanging') extra += 800 * (s.count || 1);
    if (s.type === 'drawer') extra += 1200 * (s.count || 1);
    if (s.type === 'door') extra += 600 * (s.count || 1);
    if (s.type === 'accessory' && !accessoryCharged) {
      extra += 600;
      accessoryCharged = true;
    }
  }
  return base + extra;
}

const ACCESSORY_PRICES = {
  'shoe-rack': 800,
  'trouser-rack': 700,
  'side-mounted-hanger-rod': 650,
  'top-mounted-hanger-rod': 650,
  'jewellery-tray': 550,
  'accessory-tray': 450,
};

// ---- ImageKit ----------------------------------------------------------------

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/nirmaanbook/catalogue/';

/** ROOT-CAUSE FIX: always fetch a FRESH auth token -- never cache. */
async function getFreshAuth() {
  const res = await fetch('/api/imagekit-auth');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Auth endpoint returned ${res.status}`);
  }
  return res.json();
}

/** HEAD-check whether a file already exists in ImageKit. */
async function checkExistingImageKit(filename) {
  try {
    const url = IMAGEKIT_BASE_URL + filename;
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok ? url : null;
  } catch {
    return null;
  }
}

/** Upload one image; returns hosted URL. Fresh auth token every time. */
async function uploadImage(filename, publicKey) {
  const imgRes = await fetch('/catalogue-images/' + filename);
  if (!imgRes.ok) throw new Error('Could not fetch /catalogue-images/' + filename);
  const blob = await imgRes.blob();
  if (blob.size === 0) throw new Error(filename + ' is 0 bytes');
  const file = new File([blob], filename, { type: 'image/jpeg' });

  const auth = await getFreshAuth(); // <-- fresh token every call

  const fd = new FormData();
  fd.append('file', file);
  fd.append('fileName', filename);
  fd.append('publicKey', publicKey);
  fd.append('folder', '/catalogue');
  fd.append('signature', auth.signature);
  fd.append('expire', String(auth.expire));
  fd.append('token', auth.token);

  const upRes = await fetch(IMAGEKIT_UPLOAD_URL, { method: 'POST', body: fd });
  if (!upRes.ok) {
    const err = await upRes.json().catch(() => ({}));
    throw new Error(err.message || 'Upload failed (' + upRes.status + ')');
  }
  const data = await upRes.json();
  if (!data.url) throw new Error('ImageKit response missing url field');
  return data.url;
}

// ---- Firestore ---------------------------------------------------------------

async function writeDoc(db, colName, id, data) {
  const ref = doc(db, 'platform_catalog', 'catalog', colName, id);
  await setDoc(ref, {
    ...data,
    isActive: true,
    isDeleted: false,
    createdBy: 'admin',
    createdByName: 'Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ---- Main export -------------------------------------------------------------

/**
 * importCatalogueData({ onProgress })
 * Full pipeline: upload images (skip already-done) -> write Firestore docs.
 * Returns a result summary object.
 */
export async function importCatalogueData({ onProgress } = {}) {
  const log = (msg) => {
    console.log(msg);
    onProgress?.(msg);
  };

  log('Starting catalogue import...');
  log('  * Fresh auth token per upload (auth-cache bug fixed)');
  log('  * Already-uploaded images will be skipped');
  log('  * Prices computed from provisional formula');
  log('');

  const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
  if (!publicKey) throw new Error('VITE_IMAGEKIT_PUBLIC_KEY missing in .env');

  const db = getDb();

  // Step 1: collect filenames
  const allItems = [
    ...wardrobeModules,
    ...cornerUnits,
    ...internalColours,
    ...drawerFascia,
    ...wardrobeAccessories,
  ];
  const allFilenames = [...new Set(allItems.map((i) => i.image))];
  log('Images to process: ' + allFilenames.length);

  // Step 2: upload (or skip)
  const urlMap = {};
  const failures = [];
  let skipped = 0;

  for (let i = 0; i < allFilenames.length; i++) {
    const fn = allFilenames[i];
    try {
      const existing = await checkExistingImageKit(fn);
      if (existing) {
        urlMap[fn] = existing;
        skipped++;
        log('  SKIP [' + (i + 1) + '/' + allFilenames.length + '] ' + fn);
        continue;
      }
      const url = await uploadImage(fn, publicKey);
      urlMap[fn] = url;
      log('  OK   [' + (i + 1) + '/' + allFilenames.length + '] ' + fn);
    } catch (err) {
      failures.push({ filename: fn, error: err.message });
      log('  FAIL [' + (i + 1) + '/' + allFilenames.length + '] ' + fn + ' -- ' + err.message);
    }
  }

  log('');
  log(
    'Images: ' +
      Object.keys(urlMap).length +
      ' available, ' +
      skipped +
      ' skipped, ' +
      failures.length +
      ' failed'
  );
  if (failures.length) {
    log('Failed uploads:');
    failures.forEach(({ filename, error }) => log('  * ' + filename + ': ' + error));
  }

  // Step 3: modules (45)
  log('');
  log('Seeding 45 modules...');
  let moduleCount = 0;
  for (const mod of wardrobeModules) {
    const basePrice = computeBasePrice(mod, false);
    await writeDoc(db, 'modules', mod.id, {
      id: mod.id,
      displayId: mod.displayId,
      name: mod.name,
      category: mod.category,
      availableIn: mod.availableIn,
      sections: mod.sections,
      accessoryEditable: mod.accessoryEditable,
      imageUrl: urlMap[mod.image] || '',
      basePrice,
      width: 600,
      height: 2400,
      depth: 600,
    });
    moduleCount++;
    log('  OK [modules] ' + mod.id + ' -- ' + mod.name + ' (Rs.' + basePrice + ')');
  }

  // Step 4: corner units (4)
  log('');
  log('Seeding 4 corner units...');
  let cornerCount = 0;
  for (const cu of cornerUnits) {
    const basePrice = computeBasePrice(cu, true);
    await writeDoc(db, 'modules', cu.id, {
      id: cu.id,
      displayId: cu.displayId,
      name: cu.name,
      category: cu.category,
      availableIn: cu.availableIn,
      cornerVariant: cu.cornerVariant,
      sections: cu.sections,
      accessoryEditable: cu.accessoryEditable,
      imageUrl: urlMap[cu.image] || '',
      basePrice,
      width: 900,
      height: 2400,
      depth: 600,
    });
    cornerCount++;
    log('  OK [corner] ' + cu.id + ' -- ' + cu.name + ' (Rs.' + basePrice + ')');
  }

  // Step 5: internal colours (7)
  log('');
  log('Seeding 7 internal colours...');
  let colourCount = 0;
  for (const c of internalColours) {
    await writeDoc(db, 'internalColours', c.id, {
      id: c.id,
      name: c.name,
      hex: c.hex,
      imageUrl: urlMap[c.image] || '',
    });
    colourCount++;
    log('  OK [colour] ' + c.id + ' -- ' + c.name);
  }

  // Step 6: drawer fascia (9)
  log('');
  log('Seeding 9 drawer fascia...');
  let fasciaCount = 0;
  for (const f of drawerFascia) {
    await writeDoc(db, 'drawerFascia', f.id, {
      id: f.id,
      name: f.name,
      handleStyle: f.handleStyle,
      imageUrl: urlMap[f.image] || '',
    });
    fasciaCount++;
    log('  OK [fascia] ' + f.id + ' -- ' + f.name);
  }

  // Step 7: accessories (6) with prices
  log('');
  log('Seeding 6 accessories...');
  let accCount = 0;
  for (const a of wardrobeAccessories) {
    const basePrice = ACCESSORY_PRICES[a.id] || 500;
    await writeDoc(db, 'accessories', a.id, {
      id: a.id,
      name: a.name,
      slotType: a.slotType,
      imageUrl: urlMap[a.image] || '',
      basePrice,
    });
    accCount++;
    log('  OK [acc] ' + a.id + ' (Rs.' + basePrice + ')');
  }

  // Summary
  const summary = {
    imagesUploaded: Object.keys(urlMap).length,
    imagesSkipped: skipped,
    imagesFailed: failures.length,
    failures,
    modulesWritten: moduleCount,
    cornerUnitsWritten: cornerCount,
    coloursWritten: colourCount,
    fasciaWritten: fasciaCount,
    accessoriesWritten: accCount,
    totalDocsWritten: moduleCount + cornerCount + colourCount + fasciaCount + accCount,
    urlMap,
  };

  log('');
  log('=== IMPORT COMPLETE ===');
  log(
    'Images   : ' +
      summary.imagesUploaded +
      '/' +
      allFilenames.length +
      ' (' +
      summary.imagesSkipped +
      ' skipped, ' +
      summary.imagesFailed +
      ' failed)'
  );
  log('Docs     : ' + summary.totalDocsWritten + ' total');
  log('  Modules  : ' + moduleCount + ' (+' + cornerCount + ' corners)');
  log('  Colours  : ' + colourCount);
  log('  Fascia   : ' + fasciaCount);
  log('  Acc      : ' + accCount);
  if (summary.imagesFailed === 0) {
    log('SUCCESS -- 71/71 images uploaded!');
  } else {
    log(
      'PARTIAL -- ' +
        summary.imagesFailed +
        ' image(s) failed. Re-run to retry (already-done are skipped).'
    );
  }

  return summary;
}

/**
 * scripts/runSeed.mjs
 *
 * Standalone Node.js seed script — no React/JSX, no bundler needed.
 * Run once from the project root:
 *
 *   node scripts/runSeed.mjs
 *
 * Requires: firebase (already in node_modules)
 * Uses the Firebase CLIENT SDK initialised with your project credentials.
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Firebase config (mirrors src/firebase.js) ────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCnuAm7FcFrObKIsh2Zlssp63ChtmlLr_U',
  authDomain: 'nirmanbook-15825.firebaseapp.com',
  projectId: 'nirmanbook-15825',
  storageBucket: 'nirmanbook-15825.firebasestorage.app',
  messagingSenderId: '425973286997',
  appId: '1:425973286997:web:7a2d955e60c4b3e8412cdc',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Data (copied from modules.js / config.jsx — no JSX) ─────────────────────

const MODULES = [
  { id: 'OW/SW 01', name: 'Full hanging — top & bottom rails',      category: 'hanging',  basePrice: 5500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 02', name: 'Full hanging + top shelf',               category: 'hanging',  basePrice: 5800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 03', name: 'Double hang + bottom shelf',             category: 'hanging',  basePrice: 6200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 04', name: 'Long hang + 3 shelves',                  category: 'hanging',  basePrice: 6500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 05', name: 'Double hang + shelves',                  category: 'hanging',  basePrice: 6800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 06', name: 'Single hang + drawer + shelf',           category: 'hanging',  basePrice: 7200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 07', name: 'Short hang + shelf + 2 drawers',         category: 'hanging',  basePrice: 7800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 08', name: 'Short hang + 3 drawers + base',          category: 'hanging',  basePrice: 8500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 09', name: 'Short hang + shelf + 2 drawers (v2)',    category: 'hanging',  basePrice: 6800,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW/SW 10', name: 'Short hang + 3 equal drawers',           category: 'drawers',  basePrice: 8200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 11', name: 'Short hang + 4 drawers',                 category: 'drawers',  basePrice: 9500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 12',    name: 'Half hang + shelf + open below',         category: 'hanging',  basePrice: 4200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 13',    name: 'Hanging + lower open shelves',           category: 'shelves',  basePrice: 4800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 14', name: 'Hang + cubbies + 2 drawers',            category: 'specialty', basePrice: 8800, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 15', name: 'Hang + drawer + open shelf',            category: 'hanging',  basePrice: 5200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 16',    name: 'Hanging + lower shelf unit',            category: 'shelves',  basePrice: 5400,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 17',    name: 'Hanging + open shelf + decor',          category: 'hanging',  basePrice: 4200,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW 18',    name: '3-drawer tower',                        category: 'drawers',  basePrice: 7200,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW 19',    name: 'Top shelf + 3 drawers (light)',         category: 'drawers',  basePrice: 6800,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW/SW 22', name: 'Hang + accessory tray (glass) + fold', category: 'specialty', basePrice: 10500, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 23', name: 'Short hang + jewellery tray (glass)',  category: 'specialty', basePrice: 9200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 24', name: 'Short hang + jewellery + 3 drawers',  category: 'specialty', basePrice: 12500, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 25', name: 'Short hang + accessory + 2 drawers',  category: 'specialty', basePrice: 11200, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 26', name: 'Short hang + accessory + 3 drawers',  category: 'specialty', basePrice: 12800, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 27', name: 'Short hang + jewellery + 2 drawers',  category: 'specialty', basePrice: 11800, width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 28', name: 'Double hang + trouser rack',           category: 'specialty', basePrice: 9800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 29', name: 'Short hang + trouser rack + shelf',   category: 'specialty', basePrice: 8500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 30',    name: 'Short hang + trouser rack + open',    category: 'specialty', basePrice: 7200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 31', name: '5-tier full-height shoe rack',        category: 'shoe',      basePrice: 6500,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW/SW 32', name: 'Shelves + shoe tier',                 category: 'shoe',      basePrice: 5800,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW/SW 33', name: 'Mixed storage + 2 shoe tiers',        category: 'shoe',      basePrice: 5200,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW/SW 34', name: 'Hang + drawers + shoe tier',          category: 'shoe',      basePrice: 8500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 35', name: 'Shelves + drawers + shoe tier',       category: 'shoe',      basePrice: 7800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 36',    name: 'Hanging + 4 stacked drawers',         category: 'drawers',   basePrice: 9800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 37', name: 'Short hang + shelf + 3 drawers',      category: 'drawers',   basePrice: 8800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW 38',    name: 'Hang + open shelf + open base',       category: 'hanging',   basePrice: 3800,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW 39',    name: 'Hanging + 2 shelves + open base',     category: 'hanging',   basePrice: 4200,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW 40',    name: 'Cubbies + drawers + shelves',         category: 'specialty', basePrice: 9200,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 41', name: 'Short hang + jewellery tray (glass) v2', category: 'specialty', basePrice: 8200, width: 450, height: 2400, depth: 600 },
  { id: 'OW/SW 42', name: 'Short hang + jewellery (wood) + shelves', category: 'specialty', basePrice: 8500, width: 600, height: 2400, depth: 600 },
  { id: 'OW/SW 43', name: 'Hang + jewellery tray (wood)',        category: 'specialty', basePrice: 7800,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 44', name: 'Short hang + accessory (wood)',       category: 'specialty', basePrice: 7500,  width: 600,  height: 2400, depth: 600 },
  { id: 'OW/SW 45', name: 'Short hang + accessory (wood) + drawers', category: 'specialty', basePrice: 9500, width: 600, height: 2400, depth: 600 },
  { id: 'OW/SW 46', name: 'Hang + jewellery (wood) + 3 drawers', category: 'specialty', basePrice: 11500, width: 600, height: 2400, depth: 600 },
  { id: 'OW/SW 47', name: 'Display shelves, varied heights',     category: 'shelves',   basePrice: 5200,  width: 450,  height: 2400, depth: 600 },
  { id: 'OW 20A',   name: 'Corner unit — hang left, swing door', category: 'corner',    basePrice: 15500, width: 1050, height: 2400, depth: 1050 },
  { id: 'OW 20B',   name: 'Corner unit — shelves + hang, open', category: 'corner',    basePrice: 16500, width: 1050, height: 2400, depth: 1050 },
  { id: 'OW 21A',   name: 'Narrow corner — swing door',         category: 'corner',    basePrice: 12500, width: 900,  height: 2400, depth: 900 },
  { id: 'OW 21B',   name: 'Narrow corner — open',               category: 'corner',    basePrice: 10500, width: 900,  height: 2400, depth: 900 },
];

const MATERIALS = [
  { id: 'pb',   name: 'Particle Board', priceMultiplier: 1.0  },
  { id: 'mdf',  name: 'MDF',            priceMultiplier: 1.2  },
  { id: 'hdmr', name: 'HDMR',           priceMultiplier: 1.35 },
  { id: 'bwr',  name: 'BWR Ply',        priceMultiplier: 1.5  },
  { id: 'bwp',  name: 'BWP Ply',        priceMultiplier: 1.8  },
];

const HANDLES = [
  { id: 'matte-black',  name: 'Matte Black',  basePrice: 450  },
  { id: 'brushed-gold', name: 'Brushed Gold', basePrice: 850  },
  { id: 'satin-steel',  name: 'Satin Steel',  basePrice: 550  },
  { id: 'handleless',   name: 'Handleless',   basePrice: 1200 },
];

const ACCESSORIES = [
  { id: 'rack-t',  name: 'Trouser Rack',           basePrice: 4500, category: 'rack'      },
  { id: 'jewel-g', name: 'Jewellery Tray (Glass)',  basePrice: 8500, category: 'jewellery' },
  { id: 'acc-g',   name: 'Accessory Tray (Glass)',  basePrice: 7200, category: 'tray'      },
  { id: 'jewel-w', name: 'Jewellery Tray (Wood)',   basePrice: 6500, category: 'jewellery' },
  { id: 'acc-w',   name: 'Accessory Tray (Wood)',   basePrice: 5800, category: 'tray'      },
  { id: 'shoe',    name: 'Shoe Rack Shelves',        basePrice: 2200, category: 'shoe'      },
  { id: 'side',    name: 'Side Hanger Rod',          basePrice: 1800, category: 'rod'       },
  { id: 'top',     name: 'Top Hanger Rod',           basePrice: 1200, category: 'rod'       },
  { id: 'mirror',  name: 'Mirror Panel',             basePrice: 4200, category: 'mirror'    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Sanitise raw id for Firestore: "OW/SW 01" → "OW_SW_01" */
function safeId(raw) {
  return raw.replace(/[/\s]+/g, '_');
}

/** Sleep for ms milliseconds */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Writer (with retry + backoff) ───────────────────────────────────────────

async function writeItem(subCollection, rawDocId, data) {
  const docId = safeId(rawDocId);
  const ref = doc(collection(db, 'platform_catalog', subCollection, 'items'), docId);
  const payload = {
    ...data,
    id: docId,
    isActive: true,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const MAX_RETRIES = 4;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await setDoc(ref, payload);
      console.log(`  ✅ [${subCollection}] "${docId}"`);
      return; // success — stop retrying
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = 300 * attempt; // 300ms, 600ms, 900ms
        console.warn(`  ⏳ [${subCollection}] "${docId}" retry ${attempt}/${MAX_RETRIES - 1} in ${delay}ms…`);
        await sleep(delay);
      } else {
        console.error(`  ❌ [${subCollection}] "${docId}" FAILED after ${MAX_RETRIES} attempts — ${err.message}`);
      }
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 seedPlatformCatalog — starting\n');

  console.log('📦 Modules …');
  for (const m of MODULES) await writeItem('modules', m.id, m);

  console.log('\n🪵 Materials …');
  for (const m of MATERIALS) await writeItem('materials', m.id, m);

  console.log('\n🔧 Handles …');
  for (const h of HANDLES) await writeItem('handles', h.id, h);

  console.log('\n✨ Accessories …');
  for (const a of ACCESSORIES) await writeItem('accessories', a.id, a);

  console.log('\n🎉 Done! Check Firebase Console → Firestore → platform_catalog/\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});

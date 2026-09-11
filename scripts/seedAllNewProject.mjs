import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { MODULES } from '../src/data/modules.js';

const firebaseConfig = {
  apiKey: 'AIzaSyArWfsogLZrxA5uAzvpQ9lBOHDq8R2RnMc',
  authDomain: 'nimaanbook.firebaseapp.com',
  projectId: 'nimaanbook',
  storageBucket: 'nimaanbook.firebasestorage.app',
  messagingSenderId: '405154325006',
  appId: '1:405154325006:web:cb4a2e512cc73f4bc8d25f'
};

const MATERIALS = [
  { id: 'pb', name: 'Particle Board', priceMultiplier: 1.0 },
  { id: 'mdf', name: 'MDF', priceMultiplier: 1.2 },
  { id: 'hdmr', name: 'HDMR', priceMultiplier: 1.35 },
  { id: 'bwr', name: 'BWR Ply', priceMultiplier: 1.5 },
  { id: 'bwp', name: 'BWP Ply', priceMultiplier: 1.8 }
];

const HANDLES = [
  { id: 'matte-black', name: 'Matte Black', basePrice: 450 },
  { id: 'brushed-gold', name: 'Brushed Gold', basePrice: 850 },
  { id: 'satin-steel', name: 'Satin Steel', basePrice: 550 },
  { id: 'handleless', name: 'Handleless', basePrice: 1200 }
];

const ACCESSORIES = [
  { id: 'rack-t', name: 'Trouser Rack', basePrice: 4500, category: 'rack' },
  { id: 'jewel-g', name: 'Jewellery Tray (Glass)', basePrice: 8500, category: 'jewellery' },
  { id: 'acc-g', name: 'Accessory Tray (Glass)', basePrice: 7200, category: 'tray' },
  { id: 'jewel-w', name: 'Jewellery Tray (Wood)', basePrice: 6500, category: 'jewellery' },
  { id: 'acc-w', name: 'Accessory Tray (Wood)', basePrice: 5800, category: 'tray' },
  { id: 'shoe', name: 'Shoe Rack Shelves', basePrice: 2200, category: 'shoe' },
  { id: 'side', name: 'Side Hanger Rod', basePrice: 1800, category: 'rod' },
  { id: 'top', name: 'Top Hanger Rod', basePrice: 1200, category: 'rod' },
  { id: 'mirror', name: 'Mirror Panel', basePrice: 4200, category: 'mirror' }
];

async function run() {
  console.log('Connecting to Firebase project nimaanbook...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Signing in as developer@nirmanbook.com...');
  const userCred = await signInWithEmailAndPassword(auth, 'developer@nirmanbook.com', 'Nirmanbook@2026');
  const uid = userCred.user.uid;
  console.log('Signed in successfully! UID:', uid);

  // 1. Super Admin Docs
  console.log('Setting up Super Admin in users and admins collections...');
  await setDoc(doc(db, 'users', uid), {
    uid,
    email: 'developer@nirmanbook.com',
    role: 'super_admin',
    status: 'active',
    linkedBusinessId: null,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, 'admins', uid), {
    uid,
    email: 'developer@nirmanbook.com',
    role: 'super_admin',
    createdAt: serverTimestamp()
  });
  console.log('✅ Super Admin docs created.');

  // 2. Modules
  console.log(`Seeding ${MODULES.length} modules...`);
  for (const mod of MODULES) {
    const docId = mod.id.replace(/[/\s]+/g, '_');
    await setDoc(doc(db, 'platform_catalog', 'catalog', 'modules', docId), {
      ...mod,
      id: docId,
      originalId: mod.id,
      category: mod.type || 'hanging',
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  console.log('✅ All modules seeded.');

  // 3. Materials
  console.log(`Seeding ${MATERIALS.length} materials...`);
  for (const mat of MATERIALS) {
    await setDoc(doc(db, 'platform_catalog', 'catalog', 'materials', mat.id), {
      ...mat,
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  console.log('✅ All materials seeded.');

  // 4. Handles
  console.log(`Seeding ${HANDLES.length} handles...`);
  for (const h of HANDLES) {
    await setDoc(doc(db, 'platform_catalog', 'catalog', 'handles', h.id), {
      ...h,
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  console.log('✅ All handles seeded.');

  // 5. Accessories
  console.log(`Seeding ${ACCESSORIES.length} accessories...`);
  for (const acc of ACCESSORIES) {
    await setDoc(doc(db, 'platform_catalog', 'catalog', 'accessories', acc.id), {
      ...acc,
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
  console.log('✅ All accessories seeded.');

  console.log('\n🎉 Platform catalog and super admin successfully initialized in nimaanbook!\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

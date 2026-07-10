import React, { useState } from 'react';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { Sprout, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

// ── Platform catalog seed data ────────────────────────────────────────────────
const SEED_MODULES = [
  {
    id: 'full-hanging',
    name: 'Full Hanging',
    category: 'Storage',
    basePrice: 5500,
    width: 600,
    height: 2100,
    depth: 580,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'drawer-tower',
    name: 'Drawer Tower',
    category: 'Drawers',
    basePrice: 8200,
    width: 450,
    height: 2100,
    depth: 580,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'shoe-rack',
    name: 'Shoe Rack',
    category: 'Accessories',
    basePrice: 6500,
    width: 450,
    height: 2100,
    depth: 580,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'half-hanging',
    name: 'Half Hanging',
    category: 'Storage',
    basePrice: 4800,
    width: 600,
    height: 1050,
    depth: 580,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'locker-unit',
    name: 'Locker Unit',
    category: 'Storage',
    basePrice: 3200,
    width: 300,
    height: 2100,
    depth: 580,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'open-shelf',
    name: 'Open Shelf Unit',
    category: 'Display',
    basePrice: 2800,
    width: 600,
    height: 600,
    depth: 400,
    isActive: true,
    isDeleted: false,
  },
];

const SEED_MATERIALS = [
  {
    id: 'hdhmr-white',
    name: 'HDHMR White',
    priceMultiplier: 1.0,
    isActive: true,
    isDeleted: false,
  },
  { id: 'hdhmr-grey', name: 'HDHMR Grey', priceMultiplier: 1.05, isActive: true, isDeleted: false },
  { id: 'ply-teak', name: 'Plywood Teak', priceMultiplier: 1.15, isActive: true, isDeleted: false },
  {
    id: 'mdf-premium',
    name: 'MDF Premium',
    priceMultiplier: 1.2,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'ply-marine',
    name: 'Marine Plywood',
    priceMultiplier: 1.35,
    isActive: true,
    isDeleted: false,
  },
];

const SEED_HANDLES = [
  {
    id: 'profile-handle',
    name: 'Profile Handle',
    basePrice: 350,
    isActive: true,
    isDeleted: false,
  },
  { id: 'j-handle', name: 'J Pull Handle', basePrice: 280, isActive: true, isDeleted: false },
  { id: 'knob-round', name: 'Round Knob', basePrice: 150, isActive: true, isDeleted: false },
  { id: 'finger-pull', name: 'Finger Pull', basePrice: 200, isActive: true, isDeleted: false },
  {
    id: 'bar-handle-ss',
    name: 'Stainless Bar Handle',
    basePrice: 450,
    isActive: true,
    isDeleted: false,
  },
];

const SEED_ACCESSORIES = [
  {
    id: 'trouser-rack',
    name: 'Trouser Rack',
    category: 'Fittings',
    basePrice: 1800,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'tie-rack',
    name: 'Tie Rack',
    category: 'Fittings',
    basePrice: 1200,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'soft-close-hinge',
    name: 'Soft Close Hinge',
    category: 'Hardware',
    basePrice: 320,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'drawer-channel',
    name: 'Drawer Channel (Tandem)',
    category: 'Hardware',
    basePrice: 850,
    isActive: true,
    isDeleted: false,
  },
  {
    id: 'wardrobe-lift',
    name: 'Wardrobe Lift (Motorised)',
    category: 'Lift',
    basePrice: 4500,
    isActive: true,
    isDeleted: false,
  },
];

const SEED_PLAN = [
  { type: 'modules', label: 'Seeding modules…', items: SEED_MODULES },
  { type: 'materials', label: 'Seeding materials…', items: SEED_MATERIALS },
  { type: 'handles', label: 'Seeding handles…', items: SEED_HANDLES },
  { type: 'accessories', label: 'Seeding accessories…', items: SEED_ACCESSORIES },
];

async function checkCatalogHasData() {
  const snap = await getDocs(
    query(collection(db, 'platform_catalog', 'catalog', 'modules'), limit(1))
  );
  return !snap.empty;
}

async function runSeed(onProgress) {
  for (const { type, label, items } of SEED_PLAN) {
    onProgress(label);
    for (const item of items) {
      await setDoc(
        doc(db, 'platform_catalog', 'catalog', type, item.id),
        { ...item, updatedAt: serverTimestamp(), createdAt: serverTimestamp() },
        { merge: true }
      );
    }
  }
}

const AdminSeed = () => {
  const [phase, setPhase] = useState('idle'); // idle | checking | confirm | seeding | done | error
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const handleSeedClick = async () => {
    setPhase('checking');
    setError('');
    try {
      const hasData = await checkCatalogHasData();
      if (hasData) {
        setPhase('confirm');
      } else {
        await doSeed();
      }
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  };

  const doSeed = async () => {
    setPhase('seeding');
    try {
      await runSeed((msg) => setProgress(msg));
      setPhase('done');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  };

  const btnBase = {
    padding: '12px 28px',
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 4,
          }}
        >
          Seed Platform Catalog
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Populate Firestore with default modules, materials, handles and accessories
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 40,
          maxWidth: 560,
        }}
      >
        {/* Idle */}
        {phase === 'idle' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Sprout size={26} color="#16a34a" />
              </div>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                Seed Platform Catalog
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                This will populate the catalog with default platform data:
              </p>
              <ul
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                  marginTop: 10,
                  paddingLeft: 20,
                }}
              >
                {SEED_PLAN.map(({ type, items }) => (
                  <li key={type}>
                    <strong>{items.length}</strong> {type}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleSeedClick}
              style={{ ...btnBase, background: '#16a34a', color: 'white' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#15803d')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#16a34a')}
            >
              <Sprout size={16} /> Seed Platform Catalog
            </button>
          </>
        )}

        {/* Checking */}
        {phase === 'checking' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader
              size={28}
              color="var(--accent)"
              style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}
            />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Checking existing catalog…
            </p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Confirm */}
        {phase === 'confirm' && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
              }}
            >
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>
                  Catalog already has data
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Re-seeding will overwrite existing platform defaults. Business partner price
                  overrides will <strong>NOT</strong> be affected. Continue?
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={doSeed}
                style={{ ...btnBase, background: '#f59e0b', color: '#1a1200' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#d97706')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f59e0b')}
              >
                Yes, Re-seed
              </button>
              <button
                onClick={() => setPhase('idle')}
                style={{
                  ...btnBase,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Seeding */}
        {phase === 'seeding' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader
              size={28}
              color="#16a34a"
              style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }}
            />
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              {progress || 'Starting…'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Please do not close this tab</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
              }}
            >
              <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                  Catalog seeded successfully!
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  All modules, materials, handles and accessories are now available in the catalog.
                </p>
              </div>
            </div>
            <button
              onClick={() => setPhase('idle')}
              style={{
                ...btnBase,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              Seed Again
            </button>
          </>
        )}

        {/* Error */}
        {phase === 'error' && (
          <>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
              }}
            >
              <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                  Seeding failed
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {error}
                </p>
              </div>
            </div>
            <button
              onClick={() => setPhase('idle')}
              style={{
                ...btnBase,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSeed;

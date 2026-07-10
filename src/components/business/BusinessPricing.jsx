import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Tag, Layers, Package, Wrench, RefreshCw } from 'lucide-react';
import BusinessLayout from './BusinessLayout';
import { getCatalogItems } from '../../utils/quotesService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// ── Tab definition ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'modules', label: 'Modules', Icon: Layers, priceKey: 'basePrice', isMult: false },
  { id: 'materials', label: 'Materials', Icon: Package, priceKey: 'priceMultiplier', isMult: true },
  { id: 'handles', label: 'Handles', Icon: Wrench, priceKey: 'basePrice', isMult: false },
  { id: 'accessories', label: 'Accessories', Icon: Tag, priceKey: 'basePrice', isMult: false },
];

// ── Read-only catalog table ───────────────────────────────────────────────────
function CatalogTable({ tabId }) {
  const tab = TABS.find((t) => t.id === tabId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await getCatalogItems(tabId);
      setItems(catalog);
    } catch (err) {
      console.error(`[BusinessPricing] Load failed for ${tabId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtPrice = (item) => {
    if (tab.isMult) {
      const v = item.priceMultiplier ?? item.multiplier ?? 1;
      return `×${v}`;
    }
    const v = item.basePrice ?? item.price ?? 0;
    return `₹${Number(v).toLocaleString('en-IN')}`;
  };

  return (
    <div>
      {/* Sub-header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <tab.Icon size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {tab.label}
          </span>
          {!loading && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'var(--bg-tertiary)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {items.length} items
            </span>
          )}
        </div>
        <button
          onClick={load}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '5px 10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 200px',
          gap: 12,
          padding: '8px 16px',
          marginBottom: 8,
        }}
      >
        {['Name', 'Platform Price', 'Added By'].map((h) => (
          <span
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              margin: '0 auto 12px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)',
              animation: 'bpSpin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes bpSpin { to { transform: rotate(360deg); } }`}</style>
          Loading {tab.label.toLowerCase()}…
        </div>
      ) : items.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '40px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No items found in the platform catalog yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map((item) => {
            const itemId = item.id ?? item.docId;
            return (
              <div
                key={itemId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 200px',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.name}
                  </div>
                  {item.category && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.category}
                    </div>
                  )}
                </div>

                {/* Platform Price */}
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {fmtPrice(item)}
                </div>

                {/* Added By */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Added by {item.createdByName ?? 'Admin'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
const BusinessPricing = () => {
  const { currentUser } = useAuth();
  const businessId = currentUser?.uid;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const validTabId = TABS.find((t) => t.id === tabFromUrl)?.id ?? 'modules';
  const [activeTab, setActiveTab] = useState(validTabId);

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) setActiveTab(tabFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const [businessName, setBusinessName] = useState('');
  useEffect(() => {
    if (!businessId) return;
    getDoc(doc(db, 'businesses', businessId))
      .then((snap) => {
        if (snap.exists()) setBusinessName(snap.data().businessName ?? '');
      })
      .catch(() => {});
  }, [businessId]);

  return (
    <BusinessLayout businessName={businessName}>
      {/* Page title */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: 4,
            fontFamily: 'var(--font-display)',
          }}
        >
          Platform Catalog
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          These are managed by NirmanBook Admin. Add your own priced modules in{' '}
          <a
            href="/business/catalog"
            style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
          >
            My Modules
          </a>
          .
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 0,
        }}
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => switchTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: active ? 'var(--bg-secondary)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '22px 24px',
        }}
      >
        <CatalogTable key={activeTab} tabId={activeTab} />
      </div>
    </BusinessLayout>
  );
};

export default BusinessPricing;

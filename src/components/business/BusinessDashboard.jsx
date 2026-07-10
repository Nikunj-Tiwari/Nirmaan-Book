import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  Building2,
  Tag,
  Layers,
  Package,
  Wrench,
  FileText,
  ChevronRight,
  Clock,
  CheckCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import BusinessLayout from './BusinessLayout';
import { getBusinessQuotes, getCatalogItems, getPriceOverrides } from '../../utils/quotesService';
import { seedPlatformCatalog } from '../../utils/seedPlatformCatalog';

// ── Shared card style ─────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '22px 24px',
};

// ── Quick nav card definition ─────────────────────────────────────────────────
const PRICING_SECTIONS = [
  {
    tab: 'modules',
    label: 'Module Pricing',
    Icon: Layers,
    accent: '#3b82f6',
    desc: 'Set per-module prices for your customers.',
  },
  {
    tab: 'materials',
    label: 'Material Pricing',
    Icon: Package,
    accent: '#8b5cf6',
    desc: 'Override material multipliers.',
  },
  {
    tab: 'handles',
    label: 'Handle Pricing',
    Icon: Wrench,
    accent: '#f59e0b',
    desc: 'Customise hardware pricing.',
  },
  {
    tab: 'accessories',
    label: 'Accessory Pricing',
    Icon: Tag,
    accent: '#22c55e',
    desc: 'Internal fittings and add-ons.',
  },
];

// ── Relative time helper ──────────────────────────────────────────────────────
function relTime(ts) {
  if (!ts) return null;
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─────────────────────────────────────────────────────────────────────────────

const BusinessDashboardNew = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const businessId = currentUser?.uid;

  // Business profile
  const [businessName, setBusinessName] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Catalog counts
  const [catalogCounts, setCatalogCounts] = useState({
    modules: 0,
    materials: 0,
    handles: 0,
    accessories: 0,
  });
  const [overrideCount, setOverrideCount] = useState(0);

  // Recent quotes
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  // ── Fetch business profile ──
  useEffect(() => {
    if (!businessId) return;
    getDoc(doc(db, 'businesses', businessId))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setBusinessName(data.businessName ?? '');
          setLastUpdated(data.updatedAt ?? data.createdAt ?? null);
        }
      })
      .catch(() => {});
  }, [businessId]);

  const [seeding, setSeeding] = useState(false);

  // ── Fetch catalog counts + overrides; auto-seed if empty ──
  const loadCounts = useCallback(async () => {
    if (!businessId) return;
    try {
      const [mods, mats, hands, accs, overrides] = await Promise.all([
        getCatalogItems('modules'),
        getCatalogItems('materials'),
        getCatalogItems('handles'),
        getCatalogItems('accessories'),
        getPriceOverrides(businessId),
      ]);
      const counts = {
        modules: mods.length,
        materials: mats.length,
        handles: hands.length,
        accessories: accs.length,
      };
      setCatalogCounts(counts);
      setOverrideCount(overrides.length);
      // Last price update = most recent updatedAt across overrides
      if (overrides.length > 0) {
        const latest = overrides.reduce((acc, ov) => {
          const t = ov.updatedAt?.seconds ?? 0;
          return t > acc ? t : acc;
        }, 0);
        if (latest > 0) setLastUpdated({ seconds: latest });
      }

      // Auto-seed if catalog is completely empty
      const isEmpty =
        counts.modules === 0 &&
        counts.materials === 0 &&
        counts.handles === 0 &&
        counts.accessories === 0;
      if (isEmpty && !seeding) {
        console.info('[BusinessDashboard] Catalog empty — auto-seeding...');
        setSeeding(true);
        try {
          await seedPlatformCatalog();
          // Re-fetch counts after seed
          const [m2, mat2, h2, a2] = await Promise.all([
            getCatalogItems('modules'),
            getCatalogItems('materials'),
            getCatalogItems('handles'),
            getCatalogItems('accessories'),
          ]);
          setCatalogCounts({
            modules: m2.length,
            materials: mat2.length,
            handles: h2.length,
            accessories: a2.length,
          });
        } catch (seedErr) {
          console.error('[BusinessDashboard] Auto-seed failed:', seedErr);
        } finally {
          setSeeding(false);
        }
      }
    } catch (err) {
      console.error('[BusinessDashboard] Catalog load failed:', err);
    }
  }, [businessId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // ── Fetch recent quotes ──
  useEffect(() => {
    if (!businessId) return;
    setQuotesLoading(true);
    getBusinessQuotes(businessId)
      .then(setQuotes)
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
  }, [businessId]);

  const totalProducts =
    catalogCounts.modules +
    catalogCounts.materials +
    catalogCounts.handles +
    catalogCounts.accessories;

  const pendingQuotes = quotes.filter((q) => q.status === 'sent').length;

  const fmtCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  return (
    <BusinessLayout businessName={businessName}>
      {/* ── Welcome ── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: 4,
            fontFamily: 'var(--font-display)',
          }}
        >
          {businessName || 'My Business'} 🏢
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {currentUser?.email} &nbsp;·&nbsp; Business Partner
          {lastUpdated && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
              · Last price update: <strong>{relTime(lastUpdated)}</strong>
            </span>
          )}
        </p>
      </div>

      {/* ── Catalog seeding banner ── */}
      {seeding && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-border)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent)',
          }}
        >
          <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          Setting up your product catalog for the first time… this takes a few seconds.
        </div>
      )}

      {/* ── Top stats row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          marginBottom: 28,
        }}
      >
        {[
          {
            label: 'Total Products',
            value: totalProducts,
            Icon: Building2,
            color: 'var(--accent)',
          },
          { label: 'Price Overrides', value: overrideCount, Icon: Tag, color: '#8b5cf6' },
          { label: 'Pending Quotes', value: pendingQuotes, Icon: Clock, color: '#f59e0b' },
          {
            label: 'Approved Quotes',
            value: quotes.filter((q) => q.status === 'approved').length,
            Icon: CheckCircle,
            color: '#22c55e',
          },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={19} color={color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Navigation Cards: Pricing sections ── */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Pricing Management
          </h2>
          <button
            onClick={loadCounts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'none',
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {PRICING_SECTIONS.map(({ tab, label, Icon, accent, desc }) => (
            <button
              key={tab}
              onClick={() => navigate(`/business/pricing?tab=${tab}`)}
              style={{
                ...card,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                transition: 'all 0.15s',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accent;
                e.currentTarget.style.background = `${accent}08`;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${accent}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${accent}15`,
                  border: `1.5px solid ${accent}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} color={accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {desc}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  {catalogCounts[tab]} items
                </div>
              </div>
              <ChevronRight
                size={16}
                color="var(--text-muted)"
                style={{ marginTop: 2, flexShrink: 0 }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Quotes ── */}
      <div style={card}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              Recent Quotes
            </span>
          </div>
          <button
            onClick={() => navigate('/business/quotes')}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-sans)',
            }}
          >
            View all <ChevronRight size={13} />
          </button>
        </div>

        {quotesLoading ? (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '24px 0',
              fontSize: 13,
            }}
          >
            Loading…
          </p>
        ) : quotes.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '24px 0',
              fontSize: 13,
            }}
          >
            No quotes received yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quotes.slice(0, 5).map((q) => {
              const statusColor =
                {
                  draft: '#6b7280',
                  sent: '#f59e0b',
                  approved: '#22c55e',
                  rejected: '#ef4444',
                }[q.status] ?? '#6b7280';

              return (
                <div
                  key={q.quoteId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    borderRadius: 10,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {q.projectName || 'Untitled'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {q.customerEmail || q.customerId}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: 3,
                      }}
                    >
                      {fmtCurrency(q.totalAmount)}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: `${statusColor}18`,
                        color: statusColor,
                        textTransform: 'capitalize',
                      }}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BusinessLayout>
  );
};

export default BusinessDashboardNew;

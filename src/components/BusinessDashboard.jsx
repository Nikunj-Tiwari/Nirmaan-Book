import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Building2,
  LogOut,
  Tag,
  FileText,
  Users,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Edit2,
  Save,
  X,
  IndianRupee,
  Package,
  Layers,
} from 'lucide-react';
import logo from '../assets/logo.png';
import {
  getBusinessQuotes,
  updateQuoteStatus,
  getPriceOverrides,
  savePriceOverride,
  deletePriceOverride,
  getCatalogItems,
} from '../utils/quotesService';

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '24px',
};

const STATUS_CONFIG = {
  draft: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Draft', Icon: Clock },
  sent: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Sent', Icon: Clock },
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Approved', Icon: CheckCircle },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected', Icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const { Icon, label, color, bg } = cfg;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 99,
        background: bg,
        color,
      }}
    >
      <Icon size={11} /> {label}
    </span>
  );
}

// ── Price Override Row ────────────────────────────────────────────────────────
function PriceOverrideRow({ item, type, overrideMap, businessId, onSaved }) {
  const existingOverride = overrideMap[item.id ?? item.docId];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(existingOverride?.customPrice ?? '');
  const [saving, setSaving] = useState(false);

  const platformPrice =
    type === 'materials'
      ? (item.priceMultiplier ?? item.multiplier)
      : (item.basePrice ?? item.price);

  const handleSave = async () => {
    if (!value && value !== 0) return;
    setSaving(true);
    try {
      await savePriceOverride(businessId, item.id ?? item.docId, type.slice(0, -1), Number(value));
      onSaved();
      setEditing(false);
    } catch (err) {
      console.error('Override save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await deletePriceOverride(businessId, item.id ?? item.docId);
      setValue('');
      onSaved();
      setEditing(false);
    } catch (err) {
      console.error('Override delete failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 130px 160px 100px',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 10,
        background: 'var(--bg-primary)',
        border: `1px solid ${existingOverride ? 'var(--accent-border)' : 'var(--border)'}`,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {item.id ?? item.docId}
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
        {type === 'materials'
          ? `×${platformPrice}`
          : `₹${Number(platformPrice).toLocaleString('en-IN')}`}
      </div>
      <div>
        {editing ? (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={String(platformPrice)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 7,
              border: '1.5px solid var(--accent)',
              background: 'var(--bg-primary)',
              fontSize: 13,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: existingOverride ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {existingOverride
              ? type === 'materials'
                ? `×${existingOverride.customPrice}`
                : `₹${Number(existingOverride.customPrice).toLocaleString('en-IN')}`
              : '—  (platform price)'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                border: 'none',
                background: 'var(--accent)',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Save size={11} /> {saving ? '…' : 'Save'}
            </button>
            {existingOverride && (
              <button
                onClick={handleClear}
                disabled={saving}
                style={{
                  padding: '5px 8px',
                  borderRadius: 7,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                <X size={11} />
              </button>
            )}
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '5px 8px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <X size={11} />
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setValue(existingOverride?.customPrice ?? '');
              setEditing(true);
            }}
            style={{
              padding: '5px 10px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Edit2 size={11} /> Edit
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const BusinessDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const businessId = currentUser?.uid;

  const [businessName, setBusinessName] = useState('');

  // Fetch business profile
  useEffect(() => {
    if (!businessId) return;
    getDoc(doc(db, 'businesses', businessId))
      .then((snap) => {
        if (snap.exists()) setBusinessName(snap.data().businessName ?? '');
      })
      .catch(() => {});
  }, [businessId]);

  const [activeTab, setActiveTab] = useState('overview');
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(true);

  // Pricing overrides
  const [catalog, setCatalog] = useState({
    modules: [],
    materials: [],
    handles: [],
    accessories: [],
  });
  const [overrideMap, setOverrideMap] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogTab, setCatalogTab] = useState('modules');

  const loadQuotes = useCallback(async () => {
    if (!businessId) return;
    setQuotesLoading(true);
    try {
      const data = await getBusinessQuotes(businessId);
      setQuotes(data);
    } catch (err) {
      console.error('[BusinessDashboard] Quotes fetch failed:', err);
    } finally {
      setQuotesLoading(false);
    }
  }, [businessId]);

  const loadCatalogAndOverrides = useCallback(async () => {
    if (!businessId) return;
    setCatalogLoading(true);
    try {
      const [mods, mats, hands, accs, overrides] = await Promise.all([
        getCatalogItems('modules'),
        getCatalogItems('materials'),
        getCatalogItems('handles'),
        getCatalogItems('accessories'),
        getPriceOverrides(businessId),
      ]);
      setCatalog({ modules: mods, materials: mats, handles: hands, accessories: accs });
      // Build a map: productId → override doc
      const map = {};
      overrides.forEach((ov) => {
        map[ov.productId] = ov;
      });
      setOverrideMap(map);
    } catch (err) {
      console.error('[BusinessDashboard] Catalog fetch failed:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    if (activeTab === 'pricing') loadCatalogAndOverrides();
  }, [activeTab, loadCatalogAndOverrides]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleQuoteAction = async (quoteId, status) => {
    try {
      await updateQuoteStatus(quoteId, status);
      await loadQuotes();
    } catch (err) {
      console.error('Quote update failed:', err);
    }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fmtCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const totalRevenue = quotes
    .filter((q) => q.status === 'approved')
    .reduce((sum, q) => sum + (q.totalAmount ?? 0), 0);
  const pendingCount = quotes.filter((q) => q.status === 'sent').length;

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: Building2 },
    { id: 'quotes', label: `Quotes (${quotes.length})`, Icon: FileText },
    { id: 'pricing', label: 'Pricing Overrides', Icon: Tag },
  ];

  const catalogTabs = [
    { id: 'modules', label: `Modules (${catalog.modules.length})` },
    { id: 'materials', label: `Materials (${catalog.materials.length})` },
    { id: 'handles', label: `Handles (${catalog.handles.length})` },
    { id: 'accessories', label: `Accessories (${catalog.accessories.length})` },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          height: 58,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={logo} alt="NirmanBook" style={{ height: 26 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            Business Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleLogout}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <LogOut size={13} /> Sign out
          </button>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'B'}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>
        {/* Welcome */}
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
            {businessName || currentUser?.name || 'My Business'} 🏢
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {currentUser?.email} · Business Partner
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[
            { label: 'Total Quotes', value: quotes.length, Icon: FileText, color: 'var(--accent)' },
            { label: 'Pending Review', value: pendingCount, Icon: Clock, color: '#f59e0b' },
            {
              label: 'Approved',
              value: quotes.filter((q) => q.status === 'approved').length,
              Icon: CheckCircle,
              color: '#22c55e',
            },
            {
              label: 'Approved Revenue',
              value: fmtCurrency(totalRevenue),
              Icon: IndianRupee,
              color: '#8b5cf6',
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
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 20,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '10px 18px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === id ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom:
                  activeTab === id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ─ Overview Tab ─ */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent Quotes */}
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
                  <FileText size={17} color="var(--accent)" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    Recent Quotes
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('quotes')}
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
                  View All <ChevronRight size={13} />
                </button>
              </div>
              {quotesLoading ? (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  Loading…
                </p>
              ) : (
                quotes.slice(0, 5).map((q) => (
                  <div
                    key={q.quoteId}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      marginBottom: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
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
                        {fmtDate(q.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 4,
                        }}
                      >
                        {fmtCurrency(q.totalAmount)}
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                  </div>
                ))
              )}
              {quotes.length === 0 && !quotesLoading && (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  No quotes yet
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Building2 size={17} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  Quick Actions
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    label: 'Manage Pricing Overrides',
                    sub: 'Customise prices for your customers',
                    Icon: Tag,
                    action: () => setActiveTab('pricing'),
                  },
                  {
                    label: 'Review Pending Quotes',
                    sub: `${pendingCount} quote(s) awaiting action`,
                    Icon: FileText,
                    action: () => setActiveTab('quotes'),
                  },
                  {
                    label: 'Sign Out',
                    sub: 'Securely log out',
                    Icon: LogOut,
                    action: handleLogout,
                  },
                ].map(({ label, sub, Icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--accent-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-primary)';
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color="var(--accent)" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
                    </div>
                    <ChevronRight
                      size={15}
                      color="var(--text-muted)"
                      style={{ marginLeft: 'auto' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─ Quotes Tab ─ */}
        {activeTab === 'quotes' && (
          <div style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={17} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                  All Quotes
                </span>
              </div>
              <button
                onClick={loadQuotes}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            {quotesLoading ? (
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '40px 0',
                  fontSize: 14,
                }}
              >
                Loading…
              </p>
            ) : quotes.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '48px 0',
                  fontSize: 14,
                }}
              >
                No quotes received yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {quotes.map((q) => (
                  <div
                    key={q.quoteId}
                    style={{
                      padding: '16px 18px',
                      borderRadius: 12,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: q.status === 'sent' ? 12 : 0,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                          }}
                        >
                          {q.projectName || 'Untitled'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Customer: {q.customerEmail || q.customerId} · {fmtDate(q.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: 5,
                          }}
                        >
                          {fmtCurrency(q.totalAmount)}
                        </div>
                        <StatusBadge status={q.status} />
                      </div>
                    </div>
                    {q.status === 'sent' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleQuoteAction(q.quoteId, 'approved')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#22c55e',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleQuoteAction(q.quoteId, 'rejected')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: 8,
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─ Pricing Overrides Tab ─ */}
        {activeTab === 'pricing' && (
          <div style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag size={17} color="var(--accent)" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    Pricing Overrides
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Set custom prices for your customers. Leave blank to use platform prices.
                </p>
              </div>
              <button
                onClick={loadCatalogAndOverrides}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {/* Catalog sub-tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {catalogTabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCatalogTab(id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    background: catalogTab === id ? 'var(--accent)' : 'var(--bg-primary)',
                    color: catalogTab === id ? 'white' : 'var(--text-secondary)',
                    border: catalogTab === id ? 'none' : '1px solid var(--border)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 130px 160px 100px',
                gap: 12,
                padding: '8px 14px',
                marginBottom: 8,
              }}
            >
              {['Item', 'Platform Price', 'Your Override', ''].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {catalogLoading ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: '32px 0',
                }}
              >
                Loading catalog…
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(catalog[catalogTab] || []).map((item) => (
                  <PriceOverrideRow
                    key={item.id ?? item.docId}
                    item={item}
                    type={catalogTab}
                    overrideMap={overrideMap}
                    businessId={businessId}
                    onSaved={loadCatalogAndOverrides}
                  />
                ))}
                {(catalog[catalogTab] || []).length === 0 && (
                  <p
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      textAlign: 'center',
                      padding: '24px 0',
                    }}
                  >
                    No items in this category. Run the seed script first.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;

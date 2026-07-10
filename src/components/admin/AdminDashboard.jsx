import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../store/AuthContext';
import {
  Users,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Save,
  X,
  Check,
  Layers,
  Wrench,
  Tag,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  getAllUsers,
  getAllQuotes,
  getCatalogItems,
  updateUserStatus,
} from '../../utils/quotesService';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const ADMIN_ACCENT = '#4f46e5';

const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '24px',
};

const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === 'success' ? '#22c55e' : '#ef4444';
  const Icon = type === 'success' ? Check : AlertTriangle;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: bg,
        color: 'white',
        padding: '12px 18px',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        boxShadow: `0 8px 24px ${bg}44`,
        animation: 'adToastIn 0.25s ease',
      }}
    >
      <style>{`@keyframes adToastIn { from { transform:translateY(16px);opacity:0 } to { transform:translateY(0);opacity:1 } }`}</style>
      <Icon size={14} />
      {msg}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '28px',
          maxWidth: 380,
          width: '90%',
          fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1.5px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <AlertTriangle size={22} color={danger ? '#ef4444' : '#f59e0b'} />
        </div>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 9,
              border: 'none',
              background: danger ? '#ef4444' : '#f59e0b',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 9,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Active', Icon: CheckCircle },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending', Icon: Clock },
  suspended: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Suspended', Icon: XCircle },
  rejected: { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', label: 'Rejected', Icon: XCircle },
};
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 10px',
        borderRadius: 99,
        background: c.bg,
        color: c.color,
      }}
    >
      <c.Icon size={11} /> {c.label}
    </span>
  );
}

// ─── Table header row ─────────────────────────────────────────────────────────
function THead({ cols }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        gap: 12,
        padding: '8px 16px',
        marginBottom: 8,
      }}
    >
      {['Business Name', 'Owner Email', 'Date', 'Actions'].map((h) => (
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
  );
}

// ─── Section 1: Pending Applications ─────────────────────────────────────────
function PendingApplications({ onToast }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { biz, action }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'businesses'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      const rows = [];
      for (const d of snap.docs) {
        rows.push({ bizId: d.id, ...d.data() });
      }
      // Enrich with owner email from users collection
      const enriched = await Promise.all(
        rows.map(async (biz) => {
          try {
            const { getDoc, doc: fsDoc } = await import('firebase/firestore');
            const uSnap = await getDoc(fsDoc(db, 'users', biz.ownerUid));
            return { ...biz, ownerEmail: uSnap.exists() ? uSnap.data().email : biz.ownerUid };
          } catch {
            return { ...biz, ownerEmail: biz.ownerUid };
          }
        })
      );
      setBusinesses(enriched);
    } catch (err) {
      console.error('[AdminDashboard] Pending fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doAction = async (biz, newStatus) => {
    setConfirm(null);
    try {
      await updateUserStatus(biz.ownerUid, newStatus);
      // Also update businesses doc directly
      await updateDoc(doc(db, 'businesses', biz.bizId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      onToast(
        newStatus === 'active' ? `Approved: ${biz.businessName}` : `Rejected: ${biz.businessName}`,
        newStatus === 'active' ? 'success' : 'error'
      );
      await load();
    } catch (err) {
      console.error('[AdminDashboard] Action failed:', err);
      onToast('Action failed — check console', 'error');
    }
  };

  const COLS = '1fr 200px 130px 190px';

  return (
    <section style={{ ...card, marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={17} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Pending Applications
          </span>
          {!loading && businesses.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'rgba(245,158,11,0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {businesses.length} awaiting review
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

      <THead cols={COLS} />

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Loading…
        </p>
      ) : businesses.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No pending applications 🎉
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {businesses.map((biz) => (
            <div
              key={biz.bizId}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                borderRadius: 10,
                background: 'var(--bg-primary)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {biz.businessName}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {biz.bizId}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{biz.ownerEmail}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {fmtDate(biz.createdAt)}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button
                  onClick={() => doAction(biz, 'active')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: 'none',
                    background: '#22c55e',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <CheckCircle size={11} /> Approve
                </button>
                <button
                  onClick={() => setConfirm({ biz, action: 'rejected' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 7,
                    border: '1px solid #ef4444',
                    background: 'transparent',
                    color: '#ef4444',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <XCircle size={11} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject confirm */}
      {confirm && (
        <ConfirmDialog
          message={`Are you sure you want to reject the application from "${confirm.biz.businessName}"? This action cannot be undone.`}
          confirmLabel="Yes, Reject"
          danger
          onConfirm={() => doAction(confirm.biz, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}

// ─── Section 2: Active Business Partners ─────────────────────────────────────
function ActivePartners({ onToast }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'businesses'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ bizId: d.id, ...d.data() }));
      const enriched = await Promise.all(
        rows.map(async (biz) => {
          try {
            const { getDoc, doc: fsDoc } = await import('firebase/firestore');
            const uSnap = await getDoc(fsDoc(db, 'users', biz.ownerUid));
            return { ...biz, ownerEmail: uSnap.exists() ? uSnap.data().email : biz.ownerUid };
          } catch {
            return { ...biz, ownerEmail: biz.ownerUid };
          }
        })
      );
      setBusinesses(enriched);
    } catch (err) {
      console.error('[AdminDashboard] Active partners fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doSuspend = async (biz) => {
    setConfirm(null);
    try {
      await updateUserStatus(biz.ownerUid, 'suspended');
      await updateDoc(doc(db, 'businesses', biz.bizId), {
        status: 'suspended',
        updatedAt: serverTimestamp(),
      });
      onToast(`Suspended: ${biz.businessName}`, 'error');
      await load();
    } catch (err) {
      console.error('[AdminDashboard] Suspend failed:', err);
      onToast('Suspend failed — check console', 'error');
    }
  };

  const COLS = '1fr 200px 130px 120px';

  return (
    <section style={{ ...card, marginBottom: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={17} color="#22c55e" />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Active Business Partners
          </span>
          {!loading && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'rgba(34,197,94,0.1)',
                color: '#22c55e',
                border: '1px solid rgba(34,197,94,0.25)',
              }}
            >
              {businesses.length} active
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

      {/* Table header — different labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          gap: 12,
          padding: '8px 16px',
          marginBottom: 8,
        }}
      >
        {['Business Name', 'Owner Email', 'Active Since', 'Actions'].map((h) => (
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

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Loading…
        </p>
      ) : businesses.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No active partners yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {businesses.map((biz) => (
            <div
              key={biz.bizId}
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                borderRadius: 10,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {biz.businessName}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {biz.bizId}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{biz.ownerEmail}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {fmtDate(biz.updatedAt ?? biz.createdAt)}
              </div>
              <button
                onClick={() => setConfirm(biz)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: '1px solid #ef4444',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  width: 'fit-content',
                }}
              >
                <XCircle size={11} /> Suspend
              </button>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          message={`Suspend "${confirm.businessName}"? They will lose access to the Business Dashboard immediately.`}
          confirmLabel="Yes, Suspend"
          danger
          onConfirm={() => doSuspend(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}

// ─── Section 3: Platform Catalog Management ───────────────────────────────────
const CAT_TABS = [
  { id: 'modules', label: 'Modules', Icon: Layers, isMult: false },
  { id: 'materials', label: 'Materials', Icon: Package, isMult: true },
  { id: 'handles', label: 'Handles', Icon: Wrench, isMult: false },
  { id: 'accessories', label: 'Accessories', Icon: Tag, isMult: false },
];

// Inline-editable catalog row with master-default warning
function CatalogRow({ item, isMult, tabId, onToast, onReload }) {
  const itemId = item.id ?? item.docId;
  const priceField = isMult
    ? (item.priceMultiplier ?? item.multiplier ?? 1)
    : (item.basePrice ?? item.price ?? 0);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showWarn, setShowWarn] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const startEdit = () => {
    setVal(String(priceField));
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setVal('');
  };

  const attemptSave = () => {
    if (!val) return;
    setShowWarn(true); // always show master warning before saving
  };

  const doSave = async () => {
    setShowWarn(false);
    setSaving(true);
    try {
      const fieldName = isMult ? 'priceMultiplier' : 'basePrice';
      await updateDoc(doc(db, 'platform_catalog', 'catalog', tabId, itemId), {
        [fieldName]: Number(val),
        updatedAt: serverTimestamp(),
      });
      onToast(`Updated: ${item.name}`, 'success');
      setEditing(false);
      onReload();
    } catch (err) {
      console.error('[AdminDashboard] Catalog update failed:', err);
      onToast('Update failed — check console', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fmtPrice = (v) => (isMult ? `×${v}` : `₹${Number(v).toLocaleString('en-IN')}`);
  const COLS = '1fr 160px 90px';

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 10,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}
          >
            {item.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {itemId}
          </div>
        </div>

        {/* Price column */}
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') attemptSave();
              if (e.key === 'Escape') cancelEdit();
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: 7,
              border: '1.5px solid var(--accent)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-sans)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {fmtPrice(priceField)}
          </span>
        )}

        {/* Action */}
        <div style={{ display: 'flex', gap: 5 }}>
          {editing ? (
            <>
              <button
                onClick={attemptSave}
                disabled={saving || !val}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '5px 10px',
                  borderRadius: 7,
                  border: 'none',
                  background: ADMIN_ACCENT,
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  opacity: saving || !val ? 0.6 : 1,
                }}
              >
                <Save size={11} /> {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  padding: '5px 8px',
                  borderRadius: 7,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={11} />
              </button>
            </>
          ) : (
            <button
              onClick={startEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '5px 10px',
                borderRadius: 7,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = ADMIN_ACCENT;
                e.currentTarget.style.color = ADMIN_ACCENT;
                e.currentTarget.style.background = `${ADMIN_ACCENT}0d`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Edit2 size={11} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Master-default warning */}
      {showWarn && (
        <ConfirmDialog
          message={`⚠️ This will update the default price for ALL Business Partners who haven't set a custom price. This cannot be undone easily. Continue?`}
          confirmLabel="Yes, Update Default"
          danger={false}
          onConfirm={doSave}
          onCancel={() => setShowWarn(false)}
        />
      )}
    </>
  );
}

function CatalogManagement({ onToast }) {
  const [activeTab, setActiveTab] = useState('modules');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabMeta = CAT_TABS.find((t) => t.id === activeTab);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getCatalogItems(activeTab));
    } catch (err) {
      console.error('[AdminDashboard] Catalog load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const COLS = '1fr 160px 90px';

  return (
    <section style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={17} color={ADMIN_ACCENT} />
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
            Platform Catalog
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 99,
              background: `${ADMIN_ACCENT}12`,
              color: ADMIN_ACCENT,
              border: `1px solid ${ADMIN_ACCENT}30`,
              fontWeight: 600,
            }}
          >
            Master defaults — affects all partners
          </span>
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

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {CAT_TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
                background: active ? ADMIN_ACCENT : 'var(--bg-primary)',
                color: active ? 'white' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border)',
              }}
            >
              <Icon size={12} /> {label}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          gap: 12,
          padding: '8px 16px',
          marginBottom: 8,
        }}
      >
        {['Name', 'Current Price', 'Action'].map((h) => (
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

      {loading ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          No items yet — run the Seed script first.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map((item) => (
            <CatalogRow
              key={item.id ?? item.docId}
              item={item}
              isMult={tabMeta?.isMult ?? false}
              tabId={activeTab}
              onToast={onToast}
              onReload={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  // Keep pending count for layout badge
  useEffect(() => {
    const run = async () => {
      try {
        const q = query(collection(db, 'businesses'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        setPendingCount(snap.size);
      } catch {
        /* ignore */
      }
    };
    run();
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    // Refresh pending count after any action
    query(collection(db, 'businesses'), where('status', '==', 'pending'));
  }, []);

  return (
    <AdminLayout pendingCount={pendingCount}>
      {/* Page heading */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: 4,
            fontFamily: 'var(--font-display)',
          }}
        >
          Admin Dashboard 🛡️
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {currentUser?.email} &nbsp;·&nbsp; Super Admin
        </p>
      </div>

      {/* Section 1 */}
      <PendingApplications onToast={showToast} />

      {/* Section 2 */}
      <ActivePartners onToast={showToast} />

      {/* Section 3 */}
      <CatalogManagement onToast={showToast} />

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
};

export default AdminDashboard;

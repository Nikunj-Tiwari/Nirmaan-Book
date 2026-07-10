import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { FileText, X, ChevronDown } from 'lucide-react';

const STATUS_COLORS = {
  draft: { bg: '#f1f5f9', color: '#64748b' },
  sent: { bg: '#eff6ff', color: '#2563eb' },
  approved: { bg: '#dcfce7', color: '#16a34a' },
  rejected: { bg: '#fee2e2', color: '#dc2626' },
};

const td = {
  padding: '11px 16px',
  fontSize: 13,
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
};
const th = {
  ...td,
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'var(--bg-tertiary)',
  borderBottom: '2px solid var(--border)',
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 99,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
      }}
    >
      {status || 'draft'}
    </span>
  );
};

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null); // quote detail modal

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'quotes'), orderBy('createdAt', 'desc')));
        setQuotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[AdminQuotes] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filtered =
    filter === 'all' ? quotes : quotes.filter((q) => (q.status || 'draft') === filter);

  return (
    <AdminLayout>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              marginBottom: 4,
            }}
          >
            All Quotes
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {quotes.length} total quotes across all businesses
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'draft', 'sent', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
                background: filter === s ? 'var(--accent)' : 'var(--bg-secondary)',
                color: filter === s ? 'white' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading quotes…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Quote ID', 'Customer', 'Business', 'Amount', 'Status', 'Date', 'Actions'].map(
                    (h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...td,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: 40,
                      }}
                    >
                      <FileText
                        size={28}
                        style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }}
                      />
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  filtered.map((q) => (
                    <tr key={q.id}>
                      <td style={td}>
                        <div
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          #{q.id?.slice(0, 8)}…
                        </div>
                      </td>
                      <td style={td}>{q.customerEmail || q.customerId?.slice(0, 10) || '—'}</td>
                      <td style={td}>{q.businessId?.slice(0, 10) || '—'}</td>
                      <td style={{ ...td, fontWeight: 600 }}>
                        {q.totalAmount != null
                          ? `₹${Number(q.totalAmount).toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td style={td}>
                        <StatusBadge status={q.status} />
                      </td>
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>
                        {fmtDate(q.createdAt)}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() => setSelected(q)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid var(--accent)20',
                            background: 'var(--accent)10',
                            color: 'var(--accent)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1.5px solid var(--border)',
              borderRadius: 18,
              padding: 32,
              maxWidth: 540,
              width: '92%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                Quote Details
              </h2>
              <button
                onClick={() => setSelected(null)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Meta */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}
            >
              {[
                ['Quote ID', selected.id],
                ['Status', selected.status || 'draft'],
                ['Customer', selected.customerEmail || selected.customerId || '—'],
                ['Business', selected.businessId || '—'],
                [
                  'Amount',
                  selected.totalAmount != null
                    ? `₹${Number(selected.totalAmount).toLocaleString('en-IN')}`
                    : '—',
                ],
                ['Created', fmtDate(selected.createdAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: 3,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>

            {/* Config snapshot */}
            {selected.configSnapshot && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  Configuration
                </div>
                <pre
                  style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    overflowX: 'auto',
                    maxHeight: 220,
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(selected.configSnapshot, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminQuotes;

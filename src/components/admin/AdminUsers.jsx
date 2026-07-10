import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { Users, Building2, CheckCircle, XCircle, Eye } from 'lucide-react';

/* ── shared style primitives ── */
const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '24px',
};
const tableHead = {
  background: 'var(--bg-tertiary)',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};
const td = {
  padding: '12px 16px',
  fontSize: 13,
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
};
const th = { ...td, ...tableHead, borderBottom: '2px solid var(--border)' };

const StatusBadge = ({ status }) => {
  const colors = {
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
    pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    suspended: { bg: '#fee2e2', color: '#dc2626', label: 'Suspended' },
  };
  const s = colors[status] || {
    bg: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    label: status,
  };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 99,
        padding: '2px 10px',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {s.label}
    </span>
  );
};

const AdminUsers = () => {
  const [tab, setTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [custSnap, partSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'customer'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'business_partner'))),
        ]);
        setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setPartners(partSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[AdminUsers] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (uid, status) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { status, updatedAt: serverTimestamp() });
      const update = (list) => list.map((u) => (u.id === uid ? { ...u, status } : u));
      setCustomers(update);
      setPartners(update);
    } catch (err) {
      console.error('[AdminUsers] update error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const btnStyle = (color) => ({
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${color}20`,
    background: `${color}10`,
    color,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    transition: 'all 0.15s',
  });

  const renderCustomers = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Name', 'Email', 'Joined', 'Status', 'Actions'].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>
                No customers found
              </td>
            </tr>
          ) : (
            customers.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.name || u.email?.split('@')[0] || '—'}</td>
                <td style={td}>{u.email}</td>
                <td style={{ ...td, color: 'var(--text-secondary)' }}>
                  {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString('en-IN') : '—'}
                </td>
                <td style={td}>
                  <StatusBadge status={u.status} />
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.status !== 'active' && (
                      <button
                        style={btnStyle('#16a34a')}
                        disabled={actionLoading === u.id}
                        onClick={() => updateStatus(u.id, 'active')}
                      >
                        <CheckCircle size={11} style={{ marginRight: 3 }} />
                        Activate
                      </button>
                    )}
                    {u.status !== 'suspended' && (
                      <button
                        style={btnStyle('#dc2626')}
                        disabled={actionLoading === u.id}
                        onClick={() => updateStatus(u.id, 'suspended')}
                      >
                        <XCircle size={11} style={{ marginRight: 3 }} />
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPartners = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Business Name', 'Email', 'Status', 'Actions'].map((h) => (
              <th key={h} style={th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {partners.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>
                No business partners found
              </td>
            </tr>
          ) : (
            partners.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.businessName || u.name || '—'}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <StatusBadge status={u.status} />
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.status !== 'active' && (
                      <button
                        style={btnStyle('#16a34a')}
                        disabled={actionLoading === u.id}
                        onClick={() => updateStatus(u.id, 'active')}
                      >
                        <CheckCircle size={11} style={{ marginRight: 3 }} />
                        Activate
                      </button>
                    )}
                    {u.status === 'pending' && (
                      <button
                        style={btnStyle('#2563eb')}
                        disabled={actionLoading === u.id}
                        onClick={() => updateStatus(u.id, 'active')}
                      >
                        Approve
                      </button>
                    )}
                    {u.status !== 'suspended' && (
                      <button
                        style={btnStyle('#dc2626')}
                        disabled={actionLoading === u.id}
                        onClick={() => updateStatus(u.id, 'suspended')}
                      >
                        <XCircle size={11} style={{ marginRight: 3 }} />
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

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
          Users
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Manage all customers and business partners
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'customers', label: `Customers (${customers.length})`, Icon: Users },
          { id: 'partners', label: `Business Partners (${partners.length})`, Icon: Building2 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              background: tab === id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--border)'}`,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading users…
          </div>
        ) : tab === 'customers' ? (
          renderCustomers()
        ) : (
          renderPartners()
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

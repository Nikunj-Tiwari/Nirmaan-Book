import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import { Users, Building2, Shield, CheckCircle, XCircle, UserCheck } from 'lucide-react';

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
    label: status || 'Active',
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
  const [tab, setTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.error('[AdminUsers] fetch error:', err);
      showToast('Error loading users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateStatus = async (uid, status) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { status, updatedAt: serverTimestamp() });
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, status } : u)));
      showToast(`User status updated to ${status}`);
    } catch (err) {
      console.error('[AdminUsers] update status error:', err);
      showToast('Error updating status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const updateRole = async (uid, newRole, userName) => {
    const roleLabels = {
      super_admin: 'Super Admin',
      business_partner: 'Business Partner',
      customer: 'Customer / User',
    };
    const targetLabel = roleLabels[newRole] || newRole;

    if (
      !window.confirm(
        `Are you sure you want to change ${userName || 'this user'}'s role to ${targetLabel}?`
      )
    ) {
      return;
    }

    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u)));
      showToast(`Role changed to ${targetLabel} successfully`);
    } catch (err) {
      console.error('[AdminUsers] update role error:', err);
      showToast('Error updating role: ' + err.message);
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

  const customers = users.filter(
    (u) =>
      u.role === 'customer' ||
      (!u.role && u.role !== 'business_partner' && u.role !== 'super_admin')
  );
  const partners = users.filter((u) => u.role === 'business_partner');
  const admins = users.filter((u) => u.role === 'super_admin');

  let displayUsers = users;
  if (tab === 'customers') displayUsers = customers;
  else if (tab === 'partners') displayUsers = partners;
  else if (tab === 'admins') displayUsers = admins;

  return (
    <AdminLayout>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 72,
            right: 24,
            zIndex: 9999,
            background: '#1e3a5f',
            color: 'white',
            borderRadius: 10,
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

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
          User & Role Management
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Manage user accounts and assign roles (Super Admin, Business Partner, or Customer)
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Users (${users.length})`, Icon: Users },
          { id: 'customers', label: `Customers (${customers.length})`, Icon: UserCheck },
          { id: 'partners', label: `Business Partners (${partners.length})`, Icon: Building2 },
          { id: 'admins', label: `Super Admins (${admins.length})`, Icon: Shield },
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
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Loading users…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'User / Name',
                    'Email',
                    'Assigned Role (Change)',
                    'Status',
                    'Joined',
                    'Actions',
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        ...td,
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: 40,
                      }}
                    >
                      No users found in this category
                    </td>
                  </tr>
                ) : (
                  displayUsers.map((u) => (
                    <tr key={u.id}>
                      <td style={td}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {u.businessName ||
                            u.name ||
                            u.displayName ||
                            u.email?.split('@')[0] ||
                            '—'}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {u.id}
                        </div>
                      </td>
                      <td style={td}>{u.email || '—'}</td>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select
                            value={u.role || 'customer'}
                            disabled={actionLoading === u.id}
                            onChange={(e) =>
                              updateRole(u.id, e.target.value, u.name || u.businessName || u.email)
                            }
                            style={{
                              padding: '5px 8px',
                              borderRadius: 6,
                              border: '1.5px solid var(--border)',
                              background: 'var(--bg-primary)',
                              color:
                                u.role === 'super_admin'
                                  ? '#7c3aed'
                                  : u.role === 'business_partner'
                                    ? '#2563eb'
                                    : 'var(--text-primary)',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                              outline: 'none',
                            }}
                          >
                            <option value="customer">👤 Customer</option>
                            <option value="business_partner">🏢 Business Partner</option>
                            <option value="super_admin">⚡ Super Admin</option>
                          </select>
                        </div>
                      </td>
                      <td style={td}>
                        <StatusBadge status={u.status} />
                      </td>
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>
                        {u.createdAt?.toDate
                          ? u.createdAt.toDate().toLocaleDateString('en-IN')
                          : '—'}
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
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

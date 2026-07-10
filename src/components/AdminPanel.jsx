import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  ShieldCheck,
  LogOut,
  Users,
  Package,
  Tag,
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Database,
  ToggleLeft,
  ToggleRight,
  Zap,
  Search,
} from 'lucide-react';
import logo from '../assets/logo.png';
import {
  getAllUsers,
  getAllQuotes,
  getCatalogItems,
  setCatalogItemActive,
  updateUserStatus,
} from '../utils/quotesService';
import { seedPlatformCatalog } from '../utils/seedPlatformCatalog';

// ── Shared styles ─────────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '24px',
};

const ROLE_CONFIG = {
  super_admin: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Super Admin' },
  business_partner: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Business' },
  customer: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Customer' },
};

const STATUS_CONFIG = {
  active: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Active', Icon: CheckCircle },
  pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending', Icon: Clock },
  suspended: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Suspended', Icon: XCircle },
};

const QUOTE_STATUS = {
  draft: { color: '#6b7280', label: 'Draft' },
  sent: { color: '#f59e0b', label: 'Sent' },
  approved: { color: '#22c55e', label: 'Approved' },
  rejected: { color: '#ef4444', label: 'Rejected' },
};

function Badge({ type, value }) {
  const cfg = (type === 'role' ? ROLE_CONFIG : STATUS_CONFIG)[value] ?? {};
  const { Icon } = cfg;
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
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {Icon && <Icon size={11} />}
      {cfg.label ?? value}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={17} color="#4f46e5" />
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const AdminPanel = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');

  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Quotes
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  // Catalog
  const [catalog, setCatalog] = useState({
    modules: [],
    materials: [],
    handles: [],
    accessories: [],
  });
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogTab, setCatalogTab] = useState('modules');

  // Seed
  const [seedRunning, setSeedRunning] = useState(false);
  const [seedLog, setSeedLog] = useState('');

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      setUsers(await getAllUsers());
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    try {
      setQuotes(await getAllQuotes());
    } catch (e) {
      console.error(e);
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [mods, mats, hands, accs] = await Promise.all([
        getCatalogItems('modules'),
        getCatalogItems('materials'),
        getCatalogItems('handles'),
        getCatalogItems('accessories'),
      ]);
      setCatalog({ modules: mods, materials: mats, handles: hands, accessories: accs });
    } catch (e) {
      console.error(e);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'quotes') loadQuotes();
    if (activeTab === 'catalog') loadCatalog();
  }, [activeTab, loadUsers, loadQuotes, loadCatalog]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleStatusToggle = async (uid, current) => {
    const next = current === 'active' ? 'suspended' : current === 'pending' ? 'active' : 'active';
    try {
      await updateUserStatus(uid, next);
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (subCol, itemId, current) => {
    try {
      await setCatalogItemActive(subCol, itemId, !current);
      await loadCatalog();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeed = async () => {
    setSeedRunning(true);
    setSeedLog('');
    const originalLog = console.log;
    const originalError = console.error;
    const lines = [];
    console.log = (...a) => {
      lines.push(a.join(' '));
      originalLog(...a);
      setSeedLog(lines.join('\n'));
    };
    console.error = (...a) => {
      lines.push('❌ ' + a.join(' '));
      originalError(...a);
      setSeedLog(lines.join('\n'));
    };
    try {
      await seedPlatformCatalog();
    } catch (e) {
      setSeedLog((prev) => prev + '\n❌ Error: ' + e.message);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setSeedRunning(false);
    }
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fmtCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const filteredUsers = users.filter(
    (u) =>
      !userSearch ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.uid?.includes(userSearch)
  );

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: ShieldCheck },
    { id: 'users', label: `Users (${users.length})`, Icon: Users },
    { id: 'catalog', label: 'Catalog', Icon: Package },
    { id: 'quotes', label: `Quotes (${quotes.length})`, Icon: FileText },
    { id: 'seed', label: 'Seed Data', Icon: Database },
  ];

  const catalogTabs = [
    { id: 'modules', label: `Modules (${catalog.modules.length})` },
    { id: 'materials', label: `Materials (${catalog.materials.length})` },
    { id: 'handles', label: `Handles (${catalog.handles.length})` },
    { id: 'accessories', label: `Accessories (${catalog.accessories.length})` },
  ];

  const totalRevenue = quotes
    .filter((q) => q.status === 'approved')
    .reduce((s, q) => s + (q.totalAmount ?? 0), 0);
  const businessCount = users.filter((u) => u.role === 'business_partner').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const pendingBiz = users.filter(
    (u) => u.role === 'business_partner' && u.status === 'pending'
  ).length;

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
            Super Admin Panel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {pendingBiz > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 99,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                fontSize: 12,
                fontWeight: 700,
                color: '#f59e0b',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('users')}
            >
              <AlertTriangle size={12} /> {pendingBiz} pending
            </div>
          )}
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
              background: '#4f46e5',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        {/* Title */}
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
            Admin Dashboard 🛡️
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {currentUser?.email} · Super Admin
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[
            { label: 'Total Users', value: users.length, color: 'var(--accent)' },
            { label: 'Businesses', value: businessCount, color: '#f59e0b' },
            { label: 'Customers', value: customerCount, color: '#3b82f6' },
            { label: 'Pending Approval', value: pendingBiz, color: '#ef4444' },
            { label: 'Total Quotes', value: quotes.length, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                ...card,
                textAlign: 'center',
                padding: '18px 12px',
                borderTop: `3px solid ${color}`,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
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
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                background: activeTab === id ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === id ? '#4f46e5' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderBottom: activeTab === id ? '2px solid #4f46e5' : '2px solid transparent',
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
            <div style={card}>
              <SectionHeader
                icon={Users}
                title="User Summary"
                right={
                  <button
                    onClick={() => {
                      setActiveTab('users');
                      loadUsers();
                    }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#4f46e5',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Manage <ChevronRight size={13} />
                  </button>
                }
              />
              {[
                {
                  label: 'Business Partners',
                  value: businessCount,
                  sub: `${pendingBiz} pending approval`,
                },
                { label: 'Customers', value: customerCount, sub: 'Active accounts' },
                {
                  label: 'Total Revenue',
                  value: fmtCurrency(totalRevenue),
                  sub: 'From approved quotes',
                },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <div style={card}>
              <SectionHeader icon={Zap} title="Quick Actions" />
              {[
                {
                  label: 'Approve Pending Businesses',
                  Icon: CheckCircle,
                  action: () => setActiveTab('users'),
                  badge: pendingBiz > 0 ? `${pendingBiz} pending` : null,
                },
                {
                  label: 'Seed Platform Catalog',
                  Icon: Database,
                  action: () => setActiveTab('seed'),
                },
                {
                  label: 'View All Quotes',
                  Icon: FileText,
                  action: () => {
                    setActiveTab('quotes');
                    loadQuotes();
                  },
                },
                {
                  label: 'Manage Catalog Items',
                  Icon: Package,
                  action: () => {
                    setActiveTab('catalog');
                    loadCatalog();
                  },
                },
              ].map(({ label, Icon, action, badge }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    width: '100%',
                    marginBottom: 8,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4f46e5';
                    e.currentTarget.style.background = 'rgba(79,70,229,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <Icon size={15} color="#4f46e5" />
                  <span
                    style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                  >
                    {label}
                  </span>
                  {badge && (
                    <span
                      style={{
                        fontSize: 11,
                        background: 'rgba(245,158,11,0.15)',
                        color: '#f59e0b',
                        borderRadius: 99,
                        padding: '2px 8px',
                        fontWeight: 700,
                      }}
                    >
                      {badge}
                    </span>
                  )}
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─ Users Tab ─ */}
        {activeTab === 'users' && (
          <div style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <SectionHeader icon={Users} title="All Users" />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email..."
                    style={{
                      padding: '7px 10px 7px 30px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      width: 200,
                    }}
                  />
                </div>
                <button
                  onClick={loadUsers}
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
            </div>

            {/* Table */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 120px 150px',
                gap: 12,
                padding: '8px 14px',
                marginBottom: 8,
              }}
            >
              {['Email / UID', 'Role', 'Status', 'Actions'].map((h, i) => (
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

            {usersLoading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                Loading users…
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredUsers.map((u) => (
                  <div
                    key={u.uid}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 120px 150px',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'var(--bg-primary)',
                      border: `1px solid ${u.status === 'pending' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {u.email}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {u.uid}
                      </div>
                    </div>
                    <Badge type="role" value={u.role} />
                    <Badge type="status" value={u.status} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.role !== 'super_admin' && u.status === 'pending' && (
                        <button
                          onClick={() => handleStatusToggle(u.uid, u.status)}
                          style={{
                            padding: '5px 12px',
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
                          Approve
                        </button>
                      )}
                      {u.role !== 'super_admin' && u.status === 'active' && (
                        <button
                          onClick={() => handleStatusToggle(u.uid, u.status)}
                          style={{
                            padding: '5px 12px',
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
                          Suspend
                        </button>
                      )}
                      {u.role !== 'super_admin' && u.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusToggle(u.uid, u.status)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--accent)',
                            color: 'white',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                    No users found
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─ Catalog Tab ─ */}
        {activeTab === 'catalog' && (
          <div style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <SectionHeader icon={Package} title="Platform Catalog" />
              <button
                onClick={loadCatalog}
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

            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {catalogTabs.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCatalogTab(id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                    background: catalogTab === id ? '#4f46e5' : 'var(--bg-primary)',
                    color: catalogTab === id ? 'white' : 'var(--text-secondary)',
                    border: catalogTab === id ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 140px 100px 80px',
                gap: 12,
                padding: '8px 14px',
                marginBottom: 8,
              }}
            >
              {['Name / ID', 'Price / Multiplier', 'Category', 'Active'].map((h, i) => (
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
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                Loading…
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(catalog[catalogTab] || []).map((item) => {
                  const price =
                    catalogTab === 'materials'
                      ? `×${item.priceMultiplier ?? item.multiplier ?? 1}`
                      : `₹${Number(item.basePrice ?? item.price ?? 0).toLocaleString('en-IN')}`;
                  return (
                    <div
                      key={item.docId ?? item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 140px 100px 80px',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-primary)',
                        border: `1px solid ${item.isActive === false ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                        opacity: item.isActive === false ? 0.6 : 1,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: 2,
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.id ?? item.docId}
                        </div>
                      </div>
                      <div
                        style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}
                      >
                        {price}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.category ?? '—'}
                      </div>
                      <button
                        onClick={() =>
                          handleToggleActive(
                            catalogTab,
                            item.docId ?? item.id,
                            item.isActive !== false
                          )
                        }
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: item.isActive !== false ? '#22c55e' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {item.isActive !== false ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                    </div>
                  );
                })}
                {(catalog[catalogTab] || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Package
                      size={36}
                      color="var(--text-muted)"
                      style={{ opacity: 0.3, marginBottom: 12 }}
                    />
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                      No catalog items yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('seed')}
                      style={{
                        marginTop: 12,
                        padding: '8px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#4f46e5',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Go to Seed Data →
                    </button>
                  </div>
                )}
              </div>
            )}
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
                marginBottom: 18,
              }}
            >
              <SectionHeader icon={FileText} title="All Platform Quotes" />
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
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>
                Loading…
              </p>
            ) : quotes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
                No quotes on the platform yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {quotes.map((q) => (
                  <div
                    key={q.quoteId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 180px 120px 100px',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
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
                        {q.projectName || 'Untitled'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Customer: {q.customerEmail || q.customerId?.slice(0, 8) + '…'}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {fmtDate(q.createdAt)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {fmtCurrency(q.totalAmount)}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: `${QUOTE_STATUS[q.status]?.color ?? '#6b7280'}18`,
                        color: QUOTE_STATUS[q.status]?.color ?? '#6b7280',
                      }}
                    >
                      {QUOTE_STATUS[q.status]?.label ?? q.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─ Seed Tab ─ */}
        {activeTab === 'seed' && (
          <div style={card}>
            <SectionHeader icon={Database} title="Seed Platform Catalog" />
            <div
              style={{
                padding: '20px',
                borderRadius: 12,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.25)',
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={15} color="#f59e0b" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                  Run Once Only
                </span>
              </div>
              <p
                style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}
              >
                This will populate{' '}
                <code
                  style={{
                    background: 'var(--bg-primary)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                >
                  platform_catalog
                </code>{' '}
                with <strong>48 modules</strong>, <strong>5 materials</strong>,{' '}
                <strong>4 handles</strong>, and <strong>9 accessories</strong> from the local data
                files. Re-running will overwrite existing documents. Watch the log below.
              </p>
            </div>
            <button
              onClick={handleSeed}
              disabled={seedRunning}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: 'none',
                background: seedRunning ? 'var(--accent-border)' : '#4f46e5',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                cursor: seedRunning ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 20,
              }}
            >
              {seedRunning ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Seeding…
                </>
              ) : (
                <>
                  <Zap size={15} /> Run Seed Script
                </>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            {seedLog && (
              <pre
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '16px',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  maxHeight: 400,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {seedLog}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;

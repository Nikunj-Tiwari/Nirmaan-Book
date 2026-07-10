import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  LayoutDashboard,
  LogOut,
  Wrench,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Bookmark,
  RefreshCw,
  Package,
  IndianRupee,
} from 'lucide-react';
import logo from '../assets/logo.png';
import { getCustomerQuotes } from '../utils/quotesService';
import { getConfigs, deleteConfig } from '../utils/storage';

// ── Shared design tokens ──────────────────────────────────────────────────────
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

function SectionHeader({ icon: Icon, title, action, onAction }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={17} color="var(--accent)" />
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {action && (
        <button
          onClick={onAction}
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
          {action} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const CustomerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'quotes' | 'designs'

  // Load saved designs from localStorage
  const refreshDesigns = useCallback(() => {
    setSavedDesigns(getConfigs());
  }, []);

  // Load Firestore quotes
  const loadQuotes = useCallback(async () => {
    if (!currentUser?.uid) return;
    setQuotesLoading(true);
    try {
      const data = await getCustomerQuotes(currentUser.uid);
      setQuotes(data);
    } catch (err) {
      console.error('[CustomerDashboard] Failed to load quotes:', err);
    } finally {
      setQuotesLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    refreshDesigns();
    loadQuotes();
  }, [refreshDesigns, loadQuotes]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteDesign = (id) => {
    deleteConfig(id);
    refreshDesigns();
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fmtCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { id: 'quotes', label: `Quotes (${quotes.length})`, Icon: FileText },
    { id: 'designs', label: `Designs (${savedDesigns.length})`, Icon: Bookmark },
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
            Customer Dashboard
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/configure/project')}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Wrench size={13} /> New Design
          </button>
          <div
            title={currentUser?.email}
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
              cursor: 'pointer',
            }}
            onClick={handleLogout}
          >
            {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
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
            Welcome back, {currentUser?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{currentUser?.email}</p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginBottom: 28,
          }}
        >
          {[
            {
              label: 'Saved Designs',
              value: savedDesigns.length,
              Icon: Bookmark,
              color: 'var(--accent)',
            },
            { label: 'Total Quotes', value: quotes.length, Icon: FileText, color: '#f59e0b' },
            {
              label: 'Approved',
              value: quotes.filter((q) => q.status === 'approved').length,
              Icon: CheckCircle,
              color: '#22c55e',
            },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={color} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
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
            paddingBottom: 0,
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent Quotes */}
            <div style={card}>
              <SectionHeader
                icon={FileText}
                title="Recent Quotes"
                action="View All"
                onAction={() => setActiveTab('quotes')}
              />
              {quotesLoading ? (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    padding: '24px 0',
                  }}
                >
                  Loading…
                </p>
              ) : quotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <FileText size={32} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    No quotes yet
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.7 }}>
                    Request a quote from the configurator
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quotes.slice(0, 3).map((q) => (
                    <div
                      key={q.quoteId}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
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
                  ))}
                </div>
              )}
            </div>

            {/* Saved Designs */}
            <div style={card}>
              <SectionHeader
                icon={Bookmark}
                title="Saved Designs"
                action="View All"
                onAction={() => setActiveTab('designs')}
              />
              {savedDesigns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Bookmark size={32} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                    No saved designs
                  </p>
                  <button
                    onClick={() => navigate('/configure/project')}
                    style={{
                      marginTop: 12,
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    Start Designing
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {savedDesigns.slice(0, 3).map((d) => (
                    <div
                      key={d.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <Package size={16} color="var(--accent)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.name || 'Untitled Design'}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/configure/dimensions')}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          background: 'var(--accent-light)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ ...card, gridColumn: '1 / -1' }}>
              <SectionHeader icon={Wrench} title="Quick Actions" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  {
                    label: 'Start New Design',
                    sub: 'Launch the configurator',
                    Icon: Wrench,
                    action: () => navigate('/configure/project'),
                  },
                  {
                    label: 'View My Quotes',
                    sub: 'Track quote statuses',
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
                      padding: '16px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.15s',
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
                    <Icon size={18} color="var(--accent)" style={{ marginBottom: 8 }} />
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
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quotes Tab */}
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
              <SectionHeader icon={FileText} title="All Quotes" />
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
                Loading quotes…
              </p>
            ) : quotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <FileText
                  size={48}
                  color="var(--text-muted)"
                  style={{ opacity: 0.3, marginBottom: 16 }}
                />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                  No quotes yet
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.7, marginTop: 4 }}>
                  Configure a wardrobe and request a quote to get started.
                </p>
                <button
                  onClick={() => navigate('/configure/project')}
                  style={{
                    marginTop: 20,
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Start Designing
                </button>
              </div>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IndianRupee size={18} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {q.projectName || 'Untitled Project'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {q.wallType} wall · {fmtDate(q.createdAt)}
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Designs Tab */}
        {activeTab === 'designs' && (
          <div style={card}>
            <SectionHeader
              icon={Bookmark}
              title="Saved Designs"
              action="New Design"
              onAction={() => navigate('/configure/project')}
            />
            {savedDesigns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Bookmark
                  size={48}
                  color="var(--text-muted)"
                  style={{ opacity: 0.3, marginBottom: 16 }}
                />
                <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
                  No saved designs yet
                </p>
                <button
                  onClick={() => navigate('/configure/project')}
                  style={{
                    marginTop: 20,
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Start Your First Design
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savedDesigns.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Package size={18} color="var(--accent)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.name || 'Untitled Design'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Last saved{' '}
                        {d.savedAt
                          ? new Date(d.savedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => navigate('/configure/dimensions')}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--accent)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteDesign(d.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;

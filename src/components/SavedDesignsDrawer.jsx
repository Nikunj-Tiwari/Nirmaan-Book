import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Bookmark,
  Trash2,
  FolderOpen,
  Clock,
  IndianRupee,
  Layers,
  Search,
  Edit2,
  Undo2,
} from 'lucide-react';
import { getConfigs, deleteConfig, formatDate } from '../utils/storage';
import SaveDesignModal from './SaveDesignModal';
import { renameConfig } from '../utils/storage';

/**
 * SavedDesignsDrawer — right-side slide-in panel
 *
 * Props:
 *   isOpen: boolean
 *   onClose(): void
 *   onLoad(savedEntry): void   ← called when user clicks "Load"
 *   activeConfigId: string | null
 *   onToast(msg, type): void
 */
const SavedDesignsDrawer = ({
  isOpen,
  onClose,
  onLoad,
  activeConfigId,
  onToast,
  onRefreshCount,
}) => {
  const [configs, setConfigs] = useState([]);
  const [query, setQuery] = useState('');
  const [renameTarget, setRenameTarget] = useState(null); // { id, name }
  const [mounted, setMounted] = useState(false);
  // pendingDelete: Map of id -> { entry, timerId }
  const pendingDeleteRef = useRef(new Map());

  /* ── Refresh list from storage ── */
  const refresh = useCallback(() => setConfigs(getConfigs()), []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        refresh();
        setMounted(true);
      });
    } else {
      // Commit any pending deletes immediately when drawer closes
      pendingDeleteRef.current.forEach(({ timerId }, id) => {
        clearTimeout(timerId);
        deleteConfig(id);
      });
      pendingDeleteRef.current.clear();
      requestAnimationFrame(() => {
        setMounted(false);
        setQuery('');
      });
    }
  }, [isOpen, refresh]);

  /* ── Delete with 5-second undo ── */
  const handleDelete = (entry) => {
    // Optimistically remove from visible list
    setConfigs((prev) => prev.filter((c) => c.id !== entry.id));

    // Schedule real deletion after 5 seconds
    const timerId = setTimeout(() => {
      deleteConfig(entry.id);
      pendingDeleteRef.current.delete(entry.id);
      if (onRefreshCount) onRefreshCount();
    }, 5000);

    pendingDeleteRef.current.set(entry.id, { entry, timerId });

    // Show toast with Undo action
    onToast(
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span>Design deleted</span>
        <button
          onClick={() => {
            // Cancel deletion — restore the entry
            const pending = pendingDeleteRef.current.get(entry.id);
            if (pending) {
              clearTimeout(pending.timerId);
              pendingDeleteRef.current.delete(entry.id);
              setConfigs(getConfigs()); // re-read from storage (entry still there)
            }
          }}
          style={{
            background: 'none',
            border: '1px solid currentColor',
            borderRadius: 5,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            color: 'inherit',
            fontFamily: 'var(--font-sans)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Undo2 size={11} /> Undo
        </button>
      </span>,
      'success',
      6000
    );
  };

  /* ── Rename flow ── */
  const handleRename = (name) => {
    const newList = renameConfig(renameTarget.id, name);
    setConfigs(newList);
    setRenameTarget(null);
    onToast('Design renamed', 'success');
  };

  /* ── Filter ── */
  const filtered = configs.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 400,
          backdropFilter: 'blur(2px)',
          animation: 'drawerFadeIn 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Saved Designs"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
          zIndex: 401,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.18)',
          transform: mounted ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Bookmark size={16} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Saved Designs
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {configs.length} {configs.length === 1 ? 'project' : 'projects'} saved
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 6,
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Search ── */}
        {configs.length > 0 && (
          <div
            style={{
              padding: '12px 22px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <Search size={13} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search designs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* ── List ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 22px 22px' }}>
          {/* Empty state */}
          {configs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 14,
                textAlign: 'center',
                paddingBottom: 40,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Layers size={26} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 6,
                  }}
                >
                  No saved designs yet
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    maxWidth: 240,
                  }}
                >
                  Configure a wardrobe and click <strong>"Save Design"</strong> on the Quote page to
                  store it here.
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                paddingTop: 40,
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No designs match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
              {filtered.map((entry) => (
                <ConfigCard
                  key={entry.id}
                  entry={entry}
                  isActive={entry.id === activeConfigId}
                  onDelete={() => handleDelete(entry)}
                  onLoad={() => {
                    onLoad(entry);
                    onClose();
                  }}
                  onRename={() => setRenameTarget({ id: entry.id, name: entry.name })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rename modal */}
      {renameTarget && (
        <SaveDesignModal
          mode="update"
          initialName={renameTarget.name}
          existingNames={[]}
          onConfirm={handleRename}
          onClose={() => setRenameTarget(null)}
        />
      )}

      <style>{`
        @keyframes drawerFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

/* ── Individual Config Card ── */
const ConfigCard = ({ entry, isActive, onDelete, onLoad, onRename }) => {
  const [hov, setHov] = useState(false);

  const moduleCount = entry.data?.modules
    ? Object.values(entry.data.modules).reduce((a, b) => a + b, 0)
    : 0;

  const totalPrice = entry.data?.totalPrice ?? 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isActive ? 'var(--accent-light)' : 'var(--bg-primary)',
        border: `1.5px solid ${isActive ? 'var(--accent-border)' : hov ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        transition: 'all 0.18s',
        cursor: 'default',
      }}
    >
      {/* Name row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: isActive ? 'var(--accent)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {entry.name}
          </div>
          {isActive && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 2,
                fontSize: 10,
                fontWeight: 700,
                background: 'var(--accent)',
                color: 'white',
                padding: '1px 7px',
                borderRadius: 99,
                letterSpacing: '0.04em',
              }}
            >
              ACTIVE
            </span>
          )}
        </div>
        {/* Rename icon */}
        <button
          onClick={onRename}
          aria-label={`Rename ${entry.name}`}
          title="Rename"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Edit2 size={13} />
        </button>
      </div>

      {/* Meta row */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <MetaBit icon={<Clock size={11} />} label={formatDate(entry.updatedAt)} />
        <MetaBit
          icon={<Layers size={11} />}
          label={`${moduleCount} module${moduleCount !== 1 ? 's' : ''}`}
        />
        <MetaBit
          icon={<IndianRupee size={11} />}
          label={`₹${totalPrice.toLocaleString('en-IN')}`}
          accent
        />
      </div>

      {/* Material / wall type chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {entry.data?.material?.name && <Chip label={entry.data.material.name} />}
        {entry.data?.wallType && <Chip label={entry.data.wallType.replace('-', ' ')} />}
        {entry.data?.colour?.name && (
          <Chip label={entry.data.colour.name} dot={entry.data.colour.hex} />
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onLoad}
          style={{
            flex: 1,
            padding: '8px 0',
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
            justifyContent: 'center',
            gap: 6,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <FolderOpen size={14} />
          Load Design
        </button>
        <button
          onClick={onDelete}
          aria-label={`Delete ${entry.name}`}
          title="Delete (can undo)"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/* ── Tiny helpers ── */
const MetaBit = ({ icon, label, accent }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: accent ? 'var(--accent)' : 'var(--text-muted)',
      fontWeight: accent ? 600 : 400,
    }}
  >
    {icon}
    <span>{label}</span>
  </div>
);

const Chip = ({ label, dot }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 99,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      fontSize: 10,
      color: 'var(--text-secondary)',
      fontWeight: 500,
      textTransform: 'capitalize',
    }}
  >
    {dot && (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      />
    )}
    {label}
  </span>
);

export default SavedDesignsDrawer;

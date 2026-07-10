import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from './AdminLayout';
import {
  Plus,
  Pencil,
  XCircle,
  CheckCircle,
  Package,
  Upload,
  Download,
  X as XIcon,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import { parseFile, validateRows, downloadTemplate } from '../../utils/bulkImport';

const card = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 14,
  overflow: 'hidden',
};
const inp = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-primary)',
  fontSize: 13,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const th = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'var(--bg-tertiary)',
  borderBottom: '2px solid var(--border)',
  textAlign: 'left',
};
const td = {
  padding: '11px 16px',
  fontSize: 13,
  color: 'var(--text-primary)',
  borderBottom: '1px solid var(--border)',
};
const lbl = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 5,
};
const fld = { display: 'flex', flexDirection: 'column', gap: 0 };
const sel = {
  ...inp,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 30,
};

const MODULE_CATS = ['Shelves', 'Hanging', 'Drawers', 'Shoe', 'Corner', 'Specialty', 'Other'];
const ACC_CATS = ['Trouser Rack', 'Jewellery', 'Shoe Storage', 'Hanger', 'Mirror', 'Tray', 'Other'];
const TABS = [
  { id: 'modules', label: 'Modules' },
  { id: 'materials', label: 'Materials' },
  { id: 'handles', label: 'Handles' },
  { id: 'accessories', label: 'Accessories' },
];

function makeId(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now()
  );
}
const focAcc = (e) => (e.target.style.borderColor = 'var(--accent)');
const blrBdr = (e) => (e.target.style.borderColor = 'var(--border)');

const CategorySelect = ({ value, onChange, options }) => {
  const known = options.slice(0, -1);
  const isOther = !!value && !known.includes(value);
  const sv = isOther ? 'Other' : value || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select
        style={sel}
        value={sv}
        onFocus={focAcc}
        onBlur={blrBdr}
        onChange={(e) => {
          if (e.target.value === 'Other') onChange('');
          else onChange(e.target.value);
        }}
      >
        <option value="">Select Category</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {(sv === 'Other' || isOther) && (
        <input
          style={inp}
          placeholder="Describe your category..."
          value={isOther ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focAcc}
          onBlur={blrBdr}
        />
      )}
    </div>
  );
};

const StatusToggle = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 6 }}>
    {[true, false].map((v) => (
      <button
        key={String(v)}
        type="button"
        onClick={() => onChange(v)}
        style={{
          padding: '7px 14px',
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
          background: value === v ? (v ? '#dcfce7' : '#fee2e2') : 'var(--bg-primary)',
          color: value === v ? (v ? '#16a34a' : '#dc2626') : 'var(--text-muted)',
          border: `1.5px solid ${value === v ? (v ? '#16a34a40' : '#dc262640') : 'var(--border)'}`,
        }}
      >
        {v ? 'Active' : 'Inactive'}
      </button>
    ))}
  </div>
);

const TF = ({ label: l, field, form, setForm, type = 'text', ph = '' }) => (
  <div style={fld}>
    <label style={lbl}>{l}</label>
    <input
      style={inp}
      type={type}
      value={form[field] ?? ''}
      placeholder={ph}
      onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
      onFocus={focAcc}
      onBlur={blrBdr}
    />
  </div>
);

const ModuleForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="Module name" />
    <div style={fld}>
      <label style={lbl}>Category</label>
      <CategorySelect
        value={form.category || ''}
        options={MODULE_CATS}
        onChange={(v) => setForm((p) => ({ ...p, category: v }))}
      />
    </div>
    <TF
      label="Base Price (Rs)"
      field="basePrice"
      form={form}
      setForm={setForm}
      type="number"
      ph="5500"
    />
    <TF label="Width (mm)" field="width" form={form} setForm={setForm} type="number" ph="600" />
    <TF label="Height (mm)" field="height" form={form} setForm={setForm} type="number" ph="2400" />
    <TF label="Depth (mm)" field="depth" form={form} setForm={setForm} type="number" ph="600" />
    <div style={{ ...fld, gridColumn: 'span 2' }}>
      <label style={lbl}>Module Image (optional)</label>
      <ImageUploadField
        value={form.imageUrl || ''}
        onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
      />
    </div>
    <div style={fld}>
      <label style={lbl}>Status</label>
      <StatusToggle
        value={form.isActive !== false}
        onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
      />
    </div>
  </div>
);

const MaterialForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="Material name" />
    <TF label="Sub-label" field="sub" form={form} setForm={setForm} ph="e.g. Economy grade" />
    <TF
      label="Price Multiplier"
      field="priceMultiplier"
      form={form}
      setForm={setForm}
      type="number"
      ph="1.35"
    />
    <div style={{ ...fld, gridColumn: 'span 2' }}>
      <label style={lbl}>Material Image (optional)</label>
      <ImageUploadField
        value={form.imageUrl || ''}
        onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
      />
    </div>
    <div style={fld}>
      <label style={lbl}>Status</label>
      <StatusToggle
        value={form.isActive !== false}
        onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
      />
    </div>
  </div>
);

const HandleForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="Handle name" />
    <TF
      label="Base Price (Rs)"
      field="basePrice"
      form={form}
      setForm={setForm}
      type="number"
      ph="800"
    />
    <div style={{ ...fld, gridColumn: 'span 2' }}>
      <label style={lbl}>Handle Image (optional)</label>
      <ImageUploadField
        value={form.imageUrl || ''}
        onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
      />
    </div>
    <div style={fld}>
      <label style={lbl}>Status</label>
      <StatusToggle
        value={form.isActive !== false}
        onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
      />
    </div>
  </div>
);

const AccessoryForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="Accessory name" />
    <div style={fld}>
      <label style={lbl}>Category</label>
      <CategorySelect
        value={form.category || ''}
        options={ACC_CATS}
        onChange={(v) => setForm((p) => ({ ...p, category: v }))}
      />
    </div>
    <TF
      label="Base Price (Rs)"
      field="basePrice"
      form={form}
      setForm={setForm}
      type="number"
      ph="1200"
    />
    <div style={fld}>
      <label style={lbl}>Status</label>
      <StatusToggle
        value={form.isActive !== false}
        onChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
      />
    </div>
  </div>
);

const itemToForm = (item, type) => {
  const b = { isActive: item.isActive !== false };
  if (type === 'modules')
    return {
      ...b,
      name: item.name || '',
      category: item.category || '',
      basePrice: item.basePrice ?? '',
      width: item.width ?? '',
      height: item.height ?? '',
      depth: item.depth ?? '',
      imageUrl: item.imageUrl || '',
    };
  if (type === 'materials')
    return {
      ...b,
      name: item.name || '',
      sub: item.sub || '',
      priceMultiplier: item.priceMultiplier ?? '',
      imageUrl: item.imageUrl || '',
    };
  if (type === 'handles')
    return {
      ...b,
      name: item.name || '',
      basePrice: item.basePrice ?? '',
      imageUrl: item.imageUrl || '',
    };
  if (type === 'accessories')
    return {
      ...b,
      name: item.name || '',
      category: item.category || '',
      basePrice: item.basePrice ?? '',
      imageUrl: item.imageUrl || '',
    };
  return { ...b };
};

const displayCat = (item) => {
  if (item.category) return item.category;
  if (item.priceMultiplier != null) return 'x' + item.priceMultiplier;
  return '-';
};

const AdminCatalog = () => {
  const [tab, setTab] = useState('modules');
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadTab = useCallback(async (type) => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', type));
      setItems((prev) => ({ ...prev, [type]: snap.docs.map((d) => ({ id: d.id, ...d.data() })) }));
    } catch (err) {
      console.error('[AdminCatalog] load error:', err);
      showToast('Load failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  const startEdit = (item) => {
    setAddingNew(false);
    setEditId(item.id);
    setForm(itemToForm(item, tab));
  };
  const startAdd = () => {
    setEditId(null);
    setAddingNew(true);
    setForm(itemToForm({}, tab));
  };
  const cancelEdit = () => {
    setEditId(null);
    setAddingNew(false);
    setForm({});
  };

  const [bulkModal, setBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState(null); // null = not parsed yet
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  const handleBulkFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await parseFile(file);
      const { validRows, errorRows } = validateRows(raw, tab);
      setBulkRows(validRows);
      setBulkErrors(errorRows);
      setBulkDone(false);
    } catch (err) {
      showToast('Could not parse file: ' + err.message);
    }
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    if (!bulkRows || bulkRows.length === 0) return;
    setBulkImporting(true);
    try {
      let count = 0;
      for (const row of bulkRows) {
        const id = makeId(row.name || 'item');
        await setDoc(doc(db, 'platform_catalog', 'catalog', tab, id), {
          id,
          ...row,
          isActive: true,
          isDeleted: false,
          createdBy: 'admin',
          createdByName: 'Admin',
          createdAt: serverTimestamp(),
        });
        count++;
      }
      showToast(`✅ ${count} items imported successfully`);
      setBulkDone(true);
      loadTab(tab);
    } catch (err) {
      showToast('Import failed: ' + err.message);
    } finally {
      setBulkImporting(false);
    }
  };

  const closeBulk = () => {
    setBulkModal(false);
    setBulkRows(null);
    setBulkErrors([]);
    setBulkDone(false);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      showToast('Name is required');
      return;
    }
    setSaving(true);

    try {
      const payload = { ...form, updatedAt: serverTimestamp() };
      ['basePrice', 'priceMultiplier', 'width', 'height', 'depth'].forEach((f) => {
        if (payload[f] !== undefined && payload[f] !== '') payload[f] = Number(payload[f]);
        else if (payload[f] === '') delete payload[f];
      });
      if (payload.imageUrl === '') delete payload.imageUrl;
      if (addingNew) {
        const id = makeId(form.name || 'item');
        await setDoc(doc(db, 'platform_catalog', 'catalog', tab, id), {
          id,
          ...payload,
          isActive: form.isActive !== false,
          isDeleted: false,
          createdBy: 'admin',
          createdByName: 'Admin',
          createdAt: serverTimestamp(),
        });
        showToast('Item added');
      } else {
        await updateDoc(doc(db, 'platform_catalog', 'catalog', tab, editId), payload);
        showToast('Changes saved');
      }
      cancelEdit();
      loadTab(tab);
    } catch (err) {
      console.error('[AdminCatalog] save error:', err);
      showToast('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    const next = item.isActive === false;
    try {
      await updateDoc(doc(db, 'platform_catalog', 'catalog', tab, item.id), {
        isActive: next,
        updatedAt: serverTimestamp(),
      });
      showToast(next ? 'Item activated' : 'Item deactivated');
      loadTab(tab);
    } catch (err) {
      showToast('Failed: ' + err.message);
    }
  };

  const current = items[tab] || [];
  const tabLabel = TABS.find((t) => t.id === tab)?.label || tab;

  const renderForm = () => {
    if (tab === 'modules') return <ModuleForm form={form} setForm={setForm} />;
    if (tab === 'materials') return <MaterialForm form={form} setForm={setForm} />;
    if (tab === 'handles') return <HandleForm form={form} setForm={setForm} />;
    if (tab === 'accessories') return <AccessoryForm form={form} setForm={setForm} />;
    return null;
  };

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

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
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
            Platform Catalog
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Manage all modules, materials, handles and accessories
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              setBulkModal(true);
              setBulkRows(null);
              setBulkErrors([]);
              setBulkDone(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              border: '1.5px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Upload size={14} /> Bulk Import
          </button>
          <button
            onClick={startAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Plus size={15} /> Add New {tabLabel.slice(0, -1)}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => {
              setTab(id);
              cancelEdit();
            }}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: `1px solid ${tab === id ? 'var(--accent)' : 'var(--border)'}`,
              background: tab === id ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === id ? 'white' : 'var(--text-secondary)',
              fontSize: 13,
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

      {(addingNew || editId) && (
        <div style={{ ...card, marginBottom: 20, padding: 24 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 18,
            }}
          >
            {addingNew ? 'Add New ' + tabLabel.slice(0, -1) : 'Edit ' + tabLabel.slice(0, -1)}
          </h3>
          {renderForm()}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '9px 22px',
                borderRadius: 8,
                border: 'none',
                background: saving ? 'var(--accent-border)' : 'var(--accent)',
                color: 'white',
                fontSize: 13,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={cancelEdit}
              style={{
                padding: '9px 20px',
                borderRadius: 8,
                border: '1px solid var(--border)',
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
      )}

      <div style={card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            Loading {tab}...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'Name',
                    'Category / Type',
                    'Price',
                    'Image',
                    'Added By',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
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
                      <Package
                        size={28}
                        style={{ opacity: 0.3, display: 'block', margin: '0 auto 8px' }}
                      />
                      No items found. Click Add New to get started.
                    </td>
                  </tr>
                ) : (
                  current.map((item) => (
                    <tr key={item.id} style={{ opacity: item.isActive === false ? 0.5 : 1 }}>
                      <td style={td}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.id}
                        </div>
                      </td>
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>{displayCat(item)}</td>
                      <td style={td}>
                        {item.basePrice != null
                          ? 'Rs ' + Number(item.basePrice).toLocaleString('en-IN')
                          : item.priceMultiplier != null
                            ? 'x' + item.priceMultiplier
                            : '-'}
                      </td>
                      <td style={td}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: '1px solid var(--border)',
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ ...td, color: 'var(--text-muted)', fontSize: 12 }}>
                        {item.createdByName ?? 'Admin'}
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            background: item.isActive !== false ? '#dcfce7' : '#fee2e2',
                            color: item.isActive !== false ? '#16a34a' : '#dc2626',
                            borderRadius: 99,
                            padding: '2px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {item.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(59,130,246,0.25)',
                              background: 'rgba(59,130,246,0.07)',
                              color: 'var(--accent)',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            onClick={() => toggleActive(item)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border:
                                item.isActive !== false
                                  ? '1px solid rgba(220,38,38,0.25)'
                                  : '1px solid rgba(22,163,74,0.25)',
                              background:
                                item.isActive !== false
                                  ? 'rgba(220,38,38,0.07)'
                                  : 'rgba(22,163,74,0.07)',
                              color: item.isActive !== false ? '#dc2626' : '#16a34a',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            {item.isActive !== false ? (
                              <>
                                <XCircle size={11} /> Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle size={11} /> Activate
                              </>
                            )}
                          </button>
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
      {/* ── Bulk Import Modal ── */}
      {bulkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: 700,
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: 28,
              boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}
                >
                  Bulk Import — {tabLabel}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Import multiple items at once from an Excel or CSV file.
                </p>
              </div>
              <button
                onClick={closeBulk}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Step 1: Download template */}
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Step 1 — Download Template
              </p>
              <button
                onClick={() => downloadTemplate(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Download size={13} /> Download {tabLabel} Template (.xlsx)
              </button>
            </div>

            {/* Step 2: Upload file */}
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Step 2 — Upload File
              </p>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1.5px dashed var(--border)',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                <Upload size={14} />
                {bulkRows !== null
                  ? `${bulkRows.length} valid + ${bulkErrors.length} error rows detected — upload new file to replace`
                  : 'Choose .xlsx or .csv file…'}
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  style={{ display: 'none' }}
                  onChange={handleBulkFile}
                />
              </label>
            </div>

            {/* Step 3: Preview */}
            {bulkRows !== null && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      margin: 0,
                    }}
                  >
                    Step 3 — Preview
                  </p>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#dcfce7',
                      color: '#16a34a',
                    }}
                  >
                    {bulkRows.length} valid
                  </span>
                  {bulkErrors.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: '#fee2e2',
                        color: '#dc2626',
                      }}
                    >
                      {bulkErrors.length} errors
                    </span>
                  )}
                </div>

                {/* Error rows */}
                {bulkErrors.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 11, color: '#dc2626', marginBottom: 6, fontWeight: 600 }}>
                      ⚠ Rows with errors (will be skipped):
                    </p>
                    {bulkErrors.map(({ index, errors }) => (
                      <div
                        key={index}
                        style={{
                          fontSize: 11,
                          color: '#dc2626',
                          background: '#fff5f5',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          padding: '6px 10px',
                          marginBottom: 4,
                        }}
                      >
                        Row {index}: {errors.join('; ')}
                      </div>
                    ))}
                  </div>
                )}

                {/* Valid rows preview table */}
                {bulkRows.length > 0 && (
                  <div
                    style={{
                      overflowX: 'auto',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          {Object.keys(bulkRows[0]).map((k) => (
                            <th key={k} style={{ ...th, fontSize: 10, padding: '6px 10px' }}>
                              {k}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((v, j) => (
                              <td key={j} style={{ ...td, padding: '6px 10px', fontSize: 11 }}>
                                {String(v).slice(0, 40)}
                                {String(v).length > 40 ? '…' : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bulkRows.length > 10 && (
                      <p
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                          padding: '6px 0',
                        }}
                      >
                        Showing first 10 of {bulkRows.length} valid rows
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={closeBulk}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkRows || bulkRows.length === 0 || bulkImporting || bulkDone}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: bulkDone ? '#16a34a' : 'var(--accent)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    !bulkRows || bulkRows.length === 0 || bulkImporting || bulkDone
                      ? 'not-allowed'
                      : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  opacity: !bulkRows || bulkRows.length === 0 ? 0.5 : 1,
                }}
              >
                {bulkDone
                  ? '✓ Imported!'
                  : bulkImporting
                    ? 'Importing…'
                    : `Import ${bulkRows?.length ?? 0} items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCatalog;

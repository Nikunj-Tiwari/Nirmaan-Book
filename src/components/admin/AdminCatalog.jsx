import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
  Trash2,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import Model3DUploadField from './Model3DUploadField';
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

const MODULE_CATS = [
  'Shelves',
  'Hanging',
  'Drawers',
  'Shoe',
  'Corner',
  'Specialty',
  'Mixed',
  'Other',
];
const ACC_CATS = ['Trouser Rack', 'Jewellery', 'Shoe Storage', 'Hanger', 'Mirror', 'Tray', 'Other'];
const ACC_SLOT_TYPES = ['hanging', 'accessory', 'shoe'];
const TABS = [
  { id: 'modules', label: 'Modules' },
  { id: 'businessModules', label: 'Business Modules' },
  { id: 'materials', label: 'Materials' },
  { id: 'handles', label: 'Handles' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'internalColours', label: 'Internal Colours' },
  { id: 'drawerFascia', label: 'Drawer Fascia' },
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

// Category → sensible default layout (used when Admin picks a category in the form)
const CATEGORY_LAYOUT_DEFAULTS = {
  Hanging: { hang: 1, shelves: 1, drawers: 0, shoe: 0, cubbies: 0 },
  Shelves: { hang: 0, shelves: 4, drawers: 0, shoe: 0, cubbies: 0 },
  Drawers: { hang: 0, shelves: 0, drawers: 4, shoe: 0, cubbies: 0 },
  Shoe: { hang: 0, shelves: 0, drawers: 0, shoe: 4, cubbies: 0 },
  Corner: { hang: 0, shelves: 3, drawers: 0, shoe: 0, cubbies: 2 },
  Specialty: { hang: 0, shelves: 2, drawers: 1, shoe: 0, cubbies: 0 },
  Other: { hang: 0, shelves: 2, drawers: 0, shoe: 0, cubbies: 0 },
};

const LayoutField = ({ label: l, layoutKey, form, setForm }) => (
  <div style={fld}>
    <label style={lbl}>{l}</label>
    <input
      style={inp}
      type="number"
      min={0}
      max={10}
      value={(form.layout || {})[layoutKey] ?? 0}
      onChange={(e) =>
        setForm((p) => ({
          ...p,
          layout: { ...(p.layout || {}), [layoutKey]: Number(e.target.value) },
        }))
      }
      onFocus={focAcc}
      onBlur={blrBdr}
    />
  </div>
);

const ModuleForm = ({ form, setForm }) => {
  // Auto-fill layout defaults when category changes
  const handleCategoryChange = (v) => {
    const defaults = CATEGORY_LAYOUT_DEFAULTS[v] || CATEGORY_LAYOUT_DEFAULTS.Other;
    setForm((p) => ({
      ...p,
      category: v,
      layout: p.layout && Object.values(p.layout).some((n) => n > 0) ? p.layout : { ...defaults },
    }));
  };

  return (
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
          onChange={handleCategoryChange}
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
      <TF
        label="Height (mm)"
        field="height"
        form={form}
        setForm={setForm}
        type="number"
        ph="2400"
      />
      <TF label="Depth (mm)" field="depth" form={form} setForm={setForm} type="number" ph="600" />
      {/* ── 3D Layout fields — controls what appears in the 3D preview ── */}
      <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
        <p
          style={{
            ...lbl,
            marginBottom: 10,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          3D Interior Layout
          <span
            style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}
          >
            Controls shelves/drawers/rails shown in 3D preview
          </span>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}
        >
          <LayoutField label="Hanging Rails" layoutKey="hang" form={form} setForm={setForm} />
          <LayoutField label="Shelves" layoutKey="shelves" form={form} setForm={setForm} />
          <LayoutField label="Drawers" layoutKey="drawers" form={form} setForm={setForm} />
          <LayoutField label="Shoe Levels" layoutKey="shoe" form={form} setForm={setForm} />
        </div>
      </div>
      <div style={{ ...fld, gridColumn: 'span 2' }}>
        <label style={lbl}>Module Image (optional)</label>
        <ImageUploadField
          value={form.imageUrl || ''}
          onChange={(v) => setForm((p) => ({ ...p, imageUrl: v }))}
        />
      </div>
      <div style={{ ...fld, gridColumn: 'span 2' }}>
        <label style={lbl}>Custom 3D Model (.glb / .gltf / .obj, optional)</label>
        <Model3DUploadField
          value={form.model3dUrl || ''}
          onChange={(v) => setForm((p) => ({ ...p, model3dUrl: v }))}
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
};

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
    <div style={fld}>
      <label style={lbl}>Slot Type</label>
      <select
        style={sel}
        value={form.slotType || ''}
        onFocus={focAcc}
        onBlur={blrBdr}
        onChange={(e) => setForm((p) => ({ ...p, slotType: e.target.value }))}
      >
        <option value="">Select slot type…</option>
        {ACC_SLOT_TYPES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
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

const InternalColourForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="e.g. Twist Ivory" />
    <div style={fld}>
      <label style={lbl}>Hex Colour</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={form.hex || '#ffffff'}
          onChange={(e) => setForm((p) => ({ ...p, hex: e.target.value }))}
          style={{
            width: 38,
            height: 38,
            border: '1.5px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
            padding: 2,
          }}
        />
        <input
          style={{ ...inp, flex: 1 }}
          type="text"
          value={form.hex || ''}
          placeholder="#f2f1ec"
          onChange={(e) => setForm((p) => ({ ...p, hex: e.target.value }))}
          onFocus={focAcc}
          onBlur={blrBdr}
        />
      </div>
    </div>
    <div style={{ ...fld, gridColumn: 'span 2' }}>
      <label style={lbl}>Colour Swatch Image (optional)</label>
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

const DrawerFasciaForm = ({ form, setForm }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: 14,
    }}
  >
    <TF label="Name" field="name" form={form} setForm={setForm} ph="e.g. Akila" />
    <TF
      label="Handle Style"
      field="handleStyle"
      form={form}
      setForm={setForm}
      ph="e.g. twin-pull"
    />
    <div style={{ ...fld, gridColumn: 'span 2' }}>
      <label style={lbl}>Fascia Image (optional)</label>
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

const itemToForm = (item, type) => {
  const b = { isActive: item.isActive !== false };
  if (type === 'modules' || type === 'businessModules')
    return {
      ...b,
      name: item.name || '',
      category: item.category || '',
      basePrice: item.basePrice ?? '',
      width: item.width ?? '',
      height: item.height ?? '',
      depth: item.depth ?? '',
      imageUrl: item.imageUrl || '',
      model3dUrl: item.model3dUrl || '',
      businessId: item.businessId || '',
      createdByName: item.createdByName || '',
      layout: item.layout || { hang: 0, shelves: 0, drawers: 0, shoe: 0, cubbies: 0 },
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
      slotType: item.slotType || '',
      basePrice: item.basePrice ?? '',
      imageUrl: item.imageUrl || '',
    };
  if (type === 'internalColours')
    return {
      ...b,
      name: item.name || '',
      hex: item.hex || '#ffffff',
      imageUrl: item.imageUrl || '',
    };
  if (type === 'drawerFascia')
    return {
      ...b,
      name: item.name || '',
      handleStyle: item.handleStyle || '',
      imageUrl: item.imageUrl || '',
    };
  return { ...b };
};

const displayCat = (item) => {
  if (item.hex) return item.hex; // internalColours
  if (item.handleStyle) return item.handleStyle; // drawerFascia
  if (item.slotType) return 'slot: ' + item.slotType; // accessories with slotType
  if (item.category) return item.category;
  if (item.priceMultiplier != null) return 'x' + item.priceMultiplier;
  return '-';
};

const AdminCatalog = () => {
  const [tab, setTab] = useState('modules');
  const [moduleFilter, setModuleFilter] = useState('all'); // 'all' | 'platform' | 'business'
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
      if (type === 'modules' || type === 'businessModules') {
        // 1. Fetch platform modules
        let platformMods = [];
        try {
          const pSnap = await getDocs(collection(db, 'platform_catalog', 'catalog', 'modules'));
          platformMods = pSnap.docs
            .map((d) => ({ id: d.id, ...d.data(), source: 'platform', isPlatform: true }))
            .filter((m) => m.isDeleted !== true);
        } catch (pErr) {
          console.warn('[AdminCatalog] platform modules fetch error:', pErr);
        }

        // 2. Fetch business modules
        let bizRows = [];
        try {
          const snap = await getDocs(collectionGroup(db, 'modules'));
          snap.docs.forEach((d) => {
            const data = d.data();
            const pathParts = d.ref.path.split('/');
            const isBiz = pathParts[0] === 'business_modules' || !!data.businessId;
            if (isBiz && data.isDeleted !== true) {
              bizRows.push({
                ...data,
                id: d.id,
                businessId: data.businessId || pathParts[1],
                createdByName: data.createdByName || data.businessName || 'Business Partner',
                source: 'business',
                isPlatform: false,
              });
            }
          });
        } catch (cgErr) {
          console.warn('[AdminCatalog] collectionGroup error, trying businesses scan:', cgErr);
        }

        if (bizRows.length === 0) {
          try {
            const bSnap = await getDocs(collection(db, 'businesses'));
            for (const bDoc of bSnap.docs) {
              const bData = bDoc.data();
              const mSnap = await getDocs(collection(db, 'business_modules', bDoc.id, 'modules'));
              mSnap.docs.forEach((d) => {
                const data = d.data();
                if (data.isDeleted !== true) {
                  bizRows.push({
                    ...data,
                    id: d.id,
                    businessId: bDoc.id,
                    createdByName: data.createdByName || bData.businessName || 'Business Partner',
                    source: 'business',
                    isPlatform: false,
                  });
                }
              });
            }
          } catch (bErr) {
            console.warn('[AdminCatalog] businesses scan error:', bErr);
          }
        }

        const seen = new Set();
        const uniqueBiz = [];
        bizRows.forEach((r) => {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            uniqueBiz.push(r);
          }
        });

        // Combined all modules with business modules first so Super Admin sees them immediately
        const allModules = [...uniqueBiz, ...platformMods];

        setItems((prev) => ({
          ...prev,
          modules: allModules,
          platformModules: platformMods,
          businessModules: uniqueBiz,
        }));
        return;
      }

      const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', type));
      setItems((prev) => ({
        ...prev,
        [type]: snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((m) => m.isDeleted !== true),
      }));
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
      if (payload.model3dUrl === '') delete payload.model3dUrl;

      const allModulesList = [...(items.modules || []), ...(items.businessModules || [])];
      const itemObj = allModulesList.find((i) => i.id === editId) || {};
      const bId = form.businessId || itemObj.businessId;

      if (bId || tab === 'businessModules') {
        if (!bId) throw new Error('Business account ID missing for this module');
        await updateDoc(doc(db, 'business_modules', bId, 'modules', editId), payload);
        showToast('Business module updated successfully');
      } else if (addingNew) {
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
      if (item.businessId || tab === 'businessModules') {
        const bId = item.businessId;
        if (!bId) throw new Error('Business account ID missing');
        await updateDoc(doc(db, 'business_modules', bId, 'modules', item.id), {
          isActive: next,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'platform_catalog', 'catalog', tab, item.id), {
          isActive: next,
          updatedAt: serverTimestamp(),
        });
      }
      showToast(next ? 'Item activated' : 'Item deactivated');
      loadTab(tab);
    } catch (err) {
      showToast('Failed: ' + err.message);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    try {
      if (item.businessId || tab === 'businessModules') {
        const bId = item.businessId;
        if (!bId) throw new Error('Business account ID missing');
        await updateDoc(doc(db, 'business_modules', bId, 'modules', item.id), {
          isDeleted: true,
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, 'platform_catalog', 'catalog', tab, item.id), {
          isDeleted: true,
          isActive: false,
          updatedAt: serverTimestamp(),
        });
      }
      showToast('Item deleted successfully');
      loadTab(tab);
    } catch (err) {
      showToast('Delete failed: ' + err.message);
    }
  };

  let current = items[tab] || [];
  if (tab === 'modules') {
    if (moduleFilter === 'platform') current = items.platformModules || [];
    else if (moduleFilter === 'business') current = items.businessModules || [];
    else current = items.modules || [];
  }
  const tabLabel = TABS.find((t) => t.id === tab)?.label || tab;

  const renderForm = () => {
    if (tab === 'modules' || tab === 'businessModules')
      return <ModuleForm form={form} setForm={setForm} />;
    if (tab === 'materials') return <MaterialForm form={form} setForm={setForm} />;
    if (tab === 'handles') return <HandleForm form={form} setForm={setForm} />;
    if (tab === 'accessories') return <AccessoryForm form={form} setForm={setForm} />;
    if (tab === 'internalColours') return <InternalColourForm form={form} setForm={setForm} />;
    if (tab === 'drawerFascia') return <DrawerFasciaForm form={form} setForm={setForm} />;
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
            Manage all modules, materials, handles, accessories, internal colours and drawer fascia
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
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

      {tab === 'modules' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Filter:</span>
          {[
            { id: 'all', label: `All Modules (${(items.modules || []).length})` },
            { id: 'platform', label: `Platform (${(items.platformModules || []).length})` },
            {
              id: 'business',
              label: `Business Partners (${(items.businessModules || []).length})`,
            },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setModuleFilter(f.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: `1.5px solid ${moduleFilter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                background: moduleFilter === f.id ? 'var(--accent-light)' : 'var(--bg-secondary)',
                color: moduleFilter === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

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
                      colSpan={7}
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
                      <td style={{ ...td, color: 'var(--text-secondary)' }}>
                        {item.hex ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                background: item.hex,
                                border: '1px solid var(--border)',
                                flexShrink: 0,
                              }}
                            />
                            {item.hex}
                          </div>
                        ) : (
                          displayCat(item)
                        )}
                      </td>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.createdByName ||
                              item.businessName ||
                              (item.businessId ? 'Business Partner' : 'Admin')}
                          </span>
                          {item.businessId && (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'var(--accent)',
                                background: 'var(--accent-light)',
                                padding: '1px 6px',
                                borderRadius: 4,
                                width: 'fit-content',
                                fontFamily: 'monospace',
                              }}
                            >
                              Biz ID: {item.businessId}
                            </span>
                          )}
                          {item.model3dUrl && (
                            <span
                              style={{
                                fontSize: 10,
                                color: '#16a34a',
                                background: '#dcfce7',
                                padding: '1px 6px',
                                borderRadius: 4,
                                width: 'fit-content',
                                fontWeight: 700,
                              }}
                            >
                              ✓ 3D Model
                            </span>
                          )}
                        </div>
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
                          <button
                            onClick={() => deleteItem(item)}
                            title="Delete this item"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid rgba(220,38,38,0.25)',
                              background: 'rgba(220,38,38,0.07)',
                              color: '#dc2626',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'var(--font-sans)',
                            }}
                          >
                            <Trash2 size={11} /> Delete
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

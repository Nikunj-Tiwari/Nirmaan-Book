/**
 * NirmanBook — Saved Configurations Storage Utility
 * All persistence is localStorage-based (MVP).
 * Key: "nirmanbook_configs"
 *
 * Stored schema per config:
 * {
 *   id: string,
 *   name: string,
 *   createdAt: ISO string,
 *   updatedAt: ISO string,
 *   data: {
 *     wallType, width, height, depth, width2, width3,
 *     modules: { [id]: qty },
 *     colour: { name, sub, hex },
 *     material: { name, sub, multiplier },
 *     fascia: string,
 *     handle: { name, icon, sub, price },
 *     lighting: { name, icon, sub, price },
 *     selectedAccessories: string[],  ← serialised from Set
 *     totalPrice: number,
 *   }
 * }
 */

const STORAGE_KEY = 'nirmanbook_configs';
const DRAFT_KEY = 'nirmanbook_draft';

/* ── Draft: auto-save current config ── */
export const saveDraft = (config) => {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ savedAt: new Date().toISOString(), data: configToData(config) })
    );
  } catch {
    /* storage full or unavailable — silently ignore */
  }
};

export const getDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch (e) {
    // ignore errors
  }
};

/* ── Relative time helper (e.g. "3 min ago") ── */
export const relativeTime = (isoString) => {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(isoString);
  } catch {
    return '';
  }
};

/* ── ID generator ── */
const generateId = () => `nb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/* ── Serialise context config → storable data object ── */
export const configToData = (config, totalPrice = 0) => ({
  wallType: config.wallType,
  width: config.width,
  height: config.height,
  depth: config.depth,
  width2: config.width2,
  width3: config.width3,
  modules: { ...config.modules },
  colour: { ...config.colour },
  material: { ...config.material },
  fascia: config.fascia,
  handle: { ...config.handle },
  lighting: { ...config.lighting },
  selectedAccessories: Array.from(config.selectedAccessories),
  totalPrice,
});

/* ── Deserialise stored data → context-ready config ── */
export const dataToConfig = (data) => ({
  wallType: data.wallType,
  width: data.width,
  height: data.height,
  depth: data.depth,
  width2: data.width2,
  width3: data.width3,
  modules: { ...data.modules },
  colour: { ...data.colour },
  material: { ...data.material },
  fascia: data.fascia,
  handle: { ...data.handle },
  lighting: { ...data.lighting },
  selectedAccessories: new Set(data.selectedAccessories || []),
});

/* ── Read all saved configs ── */
export const getConfigs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/* ── Persist full list ── */
const persist = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
};

/* ── Save a new config ── */
export const saveConfig = ({ name, configState, totalPrice }) => {
  const list = getConfigs();
  const now = new Date().toISOString();
  const entry = {
    id: generateId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    data: configToData(configState, totalPrice),
  };
  return persist([entry, ...list]);
};

/* ── Update an existing config (overwrite data) ── */
export const updateConfig = (id, configState, totalPrice) => {
  const list = getConfigs();
  const updated = list.map((c) =>
    c.id === id
      ? { ...c, updatedAt: new Date().toISOString(), data: configToData(configState, totalPrice) }
      : c
  );
  return persist(updated);
};

/* ── Rename a config ── */
export const renameConfig = (id, newName) => {
  const list = getConfigs();
  const updated = list.map((c) =>
    c.id === id ? { ...c, name: newName.trim(), updatedAt: new Date().toISOString() } : c
  );
  return persist(updated);
};

/* ── Delete a config ── */
export const deleteConfig = (id) => {
  const list = getConfigs();
  return persist(list.filter((c) => c.id !== id));
};

/* ── Format a date string nicely ── */
export const formatDate = (isoString) => {
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

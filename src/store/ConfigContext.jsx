import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { COLOURS, MATERIALS, HANDLES, ACCESSORIES, LIGHTING, BRANDS } from '../data/config.jsx';
import { MODULES } from '../data/modules';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  updateModuleQty,
  updateFinishes,
  updateDimensions,
  getDerivedState,
} from '../utils/engine';
import { canAddModule } from '../utils/rules';
import { dataToConfig, saveDraft } from '../utils/storage';
// ── CHANGED: import Firestore pricing helpers ──────────────────────────────
import { fetchActivePricing, buildLocalFallbackPricing } from '../utils/firestorePricing';
// ── CHANGED: import calculateValuation so derived.valuation uses activePricing
import { calculateValuation } from '../utils/pricing';
// ── CHANGED: import useAuth so we can react to the user's linkedBusinessId ──
import { useAuth } from './AuthContext';

const ConfigContext = createContext();

const initialState = {
  wallType: 'single',
  width: 2400,
  height: 2400,
  depth: 600,
  width2: 1200,
  width3: 1200,
  modules: {},
  // moduleWalls: maps "moduleId:instanceIndex" -> 'A' | 'B' | 'C'
  // 'A' = main/center wall, 'B' = left wall, 'C' = right wall
  moduleWalls: {},
  // moduleOverrides: maps "moduleId:instanceIndex" -> { rotation: 0|90|180|270, ... }
  moduleOverrides: {},
  // wallOffsets: per-wall Z-offset in mm for B and C walls (how far from corner)
  wallOffsets: { B: 0, C: 0 },
  colour: COLOURS[0],
  material: MATERIALS[0],
  fascia: 'Akila',
  handle: HANDLES[0],
  lighting: LIGHTING[0],
  brand: BRANDS[0],
  selectedAccessories: new Set(),
  // moduleAccessories: maps moduleId -> selected accessory id (for accessoryEditable modules)
  // Defaults to the module's original sections accessory slot; customer can swap.
  moduleAccessories: {},
  projectInfo: {
    name: '',
    type: 'Consultation',
    city: '',
    startDate: '',
  },
};

function configReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_DIMENSION':
      return updateDimensions(state, action.payload.key, action.payload.value);
    case 'UPDATE_PROJECT_INFO':
      return {
        ...state,
        projectInfo: { ...state.projectInfo, [action.payload.key]: action.payload.value },
      };
    case 'UPDATE_FINISH':
      return updateFinishes(state, action.payload.key, action.payload.value);
    case 'UPDATE_MODULE_QTY': {
      return updateModuleQty(state, action.payload.id, action.payload.delta);
    }
    case 'SET_MODULE_WALL': {
      // wallKey = "moduleId:instanceIndex", wall = 'A' | 'B' | 'C'
      const { wallKey, wall } = action.payload;
      const newWalls = { ...state.moduleWalls };
      if (wall === 'A') {
        // 'A' is default — remove the override to keep state lean
        delete newWalls[wallKey];
      } else {
        newWalls[wallKey] = wall;
      }
      return { ...state, moduleWalls: newWalls };
    }
    case 'SET_MODULE_OVERRIDE': {
      const { wallKey, key, value } = action.payload;
      const newOverrides = { ...state.moduleOverrides };
      const current = newOverrides[wallKey] || {};
      newOverrides[wallKey] = { ...current, [key]: value };
      return { ...state, moduleOverrides: newOverrides };
    }
    case 'SET_WALL_OFFSET': {
      const { wall, offset } = action.payload;
      return { ...state, wallOffsets: { ...state.wallOffsets, [wall]: offset } };
    }
    case 'TOGGLE_ACCESSORY': {
      const newAccessories = new Set(state.selectedAccessories);
      if (newAccessories.has(action.payload.id)) {
        newAccessories.delete(action.payload.id);
      } else {
        newAccessories.add(action.payload.id);
      }
      return { ...state, selectedAccessories: newAccessories };
    }
    case 'SET_MODULE_ACCESSORY': {
      const { moduleId, accessoryId } = action.payload;
      const newModuleAccessories = { ...state.moduleAccessories };
      if (!accessoryId) {
        delete newModuleAccessories[moduleId];
      } else {
        newModuleAccessories[moduleId] = accessoryId;
      }
      return { ...state, moduleAccessories: newModuleAccessories };
    }
    case 'LOAD_CONFIG':
      return { ...initialState, ...action.payload };
    case 'RESET_CONFIG':
      return initialState;
    default:
      return state;
  }
}

export const ConfigProvider = ({ children }) => {
  const [config, dispatch] = useReducer(configReducer, initialState);
  const [lastDraftSave, setLastDraftSave] = useState(null);

  // ── activePricing state — null until Firestore fetch completes ───
  const [activePricing, setActivePricing] = useState(null);
  // pricingLoaded: false while fetching, true once resolved (success or fallback)
  const [pricingLoaded, setPricingLoaded] = useState(false);
  // pricingChangedBanner: true if loaded design was saved with different prices
  const [pricingChangedBanner, setPricingChangedBanner] = useState(false);
  // Track which uid/businessId the current pricing was fetched for
  const pricingFetchedFor = useRef(null);

  // ── Catalog state: Firestore data with local fallbacks ───────────────────
  const [activeModules, setActiveModules] = useState(MODULES);
  const [activeMaterials, setActiveMaterials] = useState(MATERIALS);
  const [activeHandles, setActiveHandles] = useState(HANDLES);
  const [activeAccessories, setActiveAccessories] = useState(ACCESSORIES);

  // ── Read user profile from AuthContext (safe for use before auth settles) ─
  const auth = (() => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAuth();
    } catch {
      return null;
    }
  })();
  const currentUser = auth?.currentUser ?? null;
  const linkedBusinessId = auth?.linkedBusinessId ?? null;
  const role = auth?.role ?? null;

  // ── Fetch active pricing (no longer merges price_overrides) ──────────────
  const loadPricing = useCallback(async () => {
    const fetchKey = currentUser?.uid ?? 'anonymous';
    if (pricingFetchedFor.current === fetchKey) return;
    pricingFetchedFor.current = fetchKey;
    setPricingLoaded(false);
    try {
      const pricing = await fetchActivePricing();
      setActivePricing(pricing);
      console.info('[ConfigContext] Pricing loaded from Firestore', {
        modulesCount: Object.keys(pricing.modules).length,
      });
    } catch (err) {
      console.error('[ConfigContext] Pricing fetch failed, using local fallback:', err);
      setActivePricing(buildLocalFallbackPricing());
    } finally {
      setPricingLoaded(true);
    }
  }, [currentUser?.uid]);

  // ── Fetch all 4 catalog types + business modules in parallel ──────────────
  const loadCatalog = useCallback(async () => {
    // Helper: normalise a platform_catalog doc to module shape
    const normModule = (m) => ({
      id: m.id,
      name: m.name || m.id,
      type: (m.category || 'other').toLowerCase().replace(/\s+/g, '_'),
      category: m.category || '',
      width: Number(m.width) || 600,
      height: Number(m.height) || 2400,
      depth: Number(m.depth) || 600,
      basePrice: Number(m.basePrice) || 0,
      imageUrl: m.imageUrl || null,
      layout: m.layout || {},
      // Preserve catalogue fields needed for Fix 6 accessory swap UI
      sections: m.sections || [],
      accessoryEditable: m.accessoryEditable || false,
      displayId: m.displayId || m.id,
      availableIn: m.availableIn || [],
      cornerVariant: m.cornerVariant || null,
      createdByName: m.createdByName || 'Admin',
      source: 'platform',
    });

    const active = (docs) => docs.filter((d) => d.isActive !== false && d.isDeleted !== true);

    // -- 1. platform_catalog/catalog/modules --------------------------------
    const fetchPlatformModules = async () => {
      try {
        const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', 'modules'));
        const rows = active(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        return rows.length > 0 ? rows.map(normModule) : null;
      } catch (err) {
        console.error('[ConfigContext] modules fetch failed:', err);
        return null;
      }
    };

    // -- 2. platform_catalog/catalog/materials ------------------------------
    const fetchMaterials = async () => {
      try {
        const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', 'materials'));
        const rows = active(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        if (!rows.length) return null;
        return rows.map((m) => ({
          id: m.id,
          name: m.name || m.id,
          sub: m.sub || '',
          multiplier: Number(m.priceMultiplier ?? m.multiplier) || 1.0,
          imageUrl: m.imageUrl || null,
        }));
      } catch (err) {
        console.error('[ConfigContext] materials fetch failed:', err);
        return null;
      }
    };

    // -- 3. platform_catalog/catalog/handles --------------------------------
    const fetchHandles = async () => {
      try {
        const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', 'handles'));
        const rows = active(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        if (!rows.length) return null;
        return rows.map((h) => ({
          id: h.id,
          name: h.name || h.id,
          sub: h.sub || '',
          price: Number(h.basePrice ?? h.price) || 0,
          icon: null, // JSX icons can't be stored in Firestore; rendered generically in UI
          imageUrl: h.imageUrl || null,
        }));
      } catch (err) {
        console.error('[ConfigContext] handles fetch failed:', err);
        return null;
      }
    };

    // -- 4. platform_catalog/catalog/accessories ----------------------------
    const fetchAccessories = async () => {
      try {
        const snap = await getDocs(collection(db, 'platform_catalog', 'catalog', 'accessories'));
        const rows = active(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        if (!rows.length) return null;
        return rows.map((a) => ({
          id: a.id,
          name: a.name || a.id,
          desc: a.desc || a.description || '',
          price: Number(a.basePrice ?? a.price) || 0,
          icon: null,
          category: a.category || '',
          // Preserve slotType for interior fittings selector (Fix 6)
          slotType: a.slotType || null,
          imageUrl: a.imageUrl || null,
        }));
      } catch (err) {
        console.error('[ConfigContext] accessories fetch failed:', err);
        return null;
      }
    };

    // -- 5. business_modules (own for BP, linked business for customer) ------
    const fetchBusinessModules = async (businessId) => {
      if (!businessId) return [];
      try {
        const snap = await getDocs(collection(db, 'business_modules', businessId, 'modules'));
        const rows = active(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        return rows.map((m) => ({
          ...normModule(m),
          createdByName: m.createdByName || 'My Business',
          source: 'business',
        }));
      } catch (err) {
        console.error('[ConfigContext] business modules fetch failed:', err);
        return [];
      }
    };

    const [mods, mats, hdls, accs] = await Promise.all([
      fetchPlatformModules(),
      fetchMaterials(),
      fetchHandles(),
      fetchAccessories(),
    ]);

    // Apply results — fall back to local if Firestore returned null/empty
    const platformModules =
      mods ?? MODULES.map((m) => ({ ...m, source: 'platform', createdByName: 'Admin' }));
    if (mods)
      console.info('[ConfigContext] Loaded', mods.length, 'platform modules from Firestore');
    if (mats) setActiveMaterials(mats);
    if (hdls) setActiveHandles(hdls);
    if (accs) setActiveAccessories(accs);

    // Append business modules (own for BP, linked business for customer)
    const bizId =
      role === 'business_partner'
        ? currentUser?.uid
        : role === 'customer'
          ? linkedBusinessId
          : null;
    const bizMods = await fetchBusinessModules(bizId);

    if (bizMods.length > 0) {
      console.info('[ConfigContext] merged', bizMods.length, 'business modules from', bizId);
    }

    const allModules = [...platformModules, ...bizMods];
    setActiveModules(allModules);
    console.info('[ConfigContext] Total modules available:', allModules.length);
  }, [currentUser?.uid, role, linkedBusinessId]);

  // Run on auth state change (login / logout)
  useEffect(() => {
    if (currentUser?.uid) {
      loadPricing();
      loadCatalog();
    } else {
      setActivePricing(buildLocalFallbackPricing());
      setActiveModules(MODULES.map((m) => ({ ...m, source: 'platform', createdByName: 'Admin' })));
      setActiveMaterials(MATERIALS);
      setActiveHandles(HANDLES);
      setActiveAccessories(ACCESSORIES);
      setPricingLoaded(true);
      pricingFetchedFor.current = null;
    }
  }, [currentUser?.uid, loadPricing, loadCatalog]);

  const refreshPricing = useCallback(async () => {
    pricingFetchedFor.current = null;
    setPricingChangedBanner(false);
    await loadPricing();
    await loadCatalog();
  }, [loadPricing, loadCatalog]);

  // Derived metrics are memoized for performance
  // Pass activeModules so business-created modules appear in modulesList
  // (fixes 3D preview, 2D blueprint, and Summary page for business modules)
  const derived = useMemo(() => {
    const base = getDerivedState(config, activeModules);
    // Override the valuation with Firestore-aware prices
    const valuation = calculateValuation(config, activePricing);
    return { ...base, valuation };
  }, [config, activePricing, activeModules]);

  /* ── Auto-draft: debounced save on every config change ── */
  const skipFirstRender = useRef(true);
  const draftTimer = useRef(null);

  useEffect(() => {
    // Skip the very first mount so we don't overwrite draft with blank initial state
    if (skipFirstRender.current) {
      skipFirstRender.current = false;
      return;
    }
    // Debounce — write draft 1.5s after last change burst
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      saveDraft(config);
      setLastDraftSave(new Date().toISOString());
    }, 1500);

    return () => clearTimeout(draftTimer.current);
  }, [config]);

  // Specialized action helpers
  const actions = {
    setDimension: (key, value) => dispatch({ type: 'UPDATE_DIMENSION', payload: { key, value } }),
    setProjectInfo: (key, value) =>
      dispatch({ type: 'UPDATE_PROJECT_INFO', payload: { key, value } }),
    setFinish: (key, value) => dispatch({ type: 'UPDATE_FINISH', payload: { key, value } }),
    setModuleQty: (id, delta) => {
      // Guard here (not in reducer) so we have access to activeModules —
      // the merged platform + business catalog. This fixes +/- for
      // business-created modules whose IDs aren't in the static MODULES array.
      if (delta > 0 && !canAddModule(config.width, config.modules, id, activeModules)) {
        return; // silently block — canAdd UI state already shows greyed-out +
      }
      dispatch({ type: 'UPDATE_MODULE_QTY', payload: { id, delta } });
    },
    setModuleWall: (wallKey, wall) =>
      dispatch({ type: 'SET_MODULE_WALL', payload: { wallKey, wall } }),
    setModuleOverride: (wallKey, key, value) =>
      dispatch({ type: 'SET_MODULE_OVERRIDE', payload: { wallKey, key, value } }),
    setWallOffset: (wall, offset) =>
      dispatch({ type: 'SET_WALL_OFFSET', payload: { wall, offset } }),
    toggleAccessory: (id) => dispatch({ type: 'TOGGLE_ACCESSORY', payload: { id } }),
    setModuleAccessory: (moduleId, accessoryId) =>
      dispatch({ type: 'SET_MODULE_ACCESSORY', payload: { moduleId, accessoryId } }),
    reset: () => dispatch({ type: 'RESET_CONFIG' }),
    loadConfig: (data) => {
      dispatch({ type: 'LOAD_CONFIG', payload: dataToConfig(data) });
      // ── CHANGED: when a saved design is loaded, check if prices have changed ──
      // We set the banner if activePricing is already loaded (prices may have shifted
      // since the design was last saved). The user can dismiss via [Recalculate].
      if (pricingLoaded && activePricing) {
        setPricingChangedBanner(true);
      }
    },
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        derived,
        actions,
        lastDraftSave,
        // Pricing fields
        activePricing,
        pricingLoaded,
        pricingChangedBanner,
        setPricingChangedBanner,
        refreshPricing,
        // Catalog from Firestore (with local fallbacks)
        activeModules,
        activeMaterials,
        activeHandles,
        activeAccessories,
        // moduleAccessories: moduleId -> selected accessory id
        moduleAccessories: config.moduleAccessories,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

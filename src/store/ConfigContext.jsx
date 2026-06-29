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
import { COLOURS, MATERIALS, HANDLES, LIGHTING, BRANDS } from '../data/config.jsx';
import {
  updateModuleQty,
  updateFinishes,
  updateDimensions,
  getDerivedState,
} from '../utils/engine';
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

  // ── CHANGED: activePricing state — null until Firestore fetch completes ───
  const [activePricing, setActivePricing] = useState(null);
  // pricingLoaded: false while fetching, true once resolved (success or fallback)
  const [pricingLoaded, setPricingLoaded] = useState(false);
  // pricingChangedBanner: true if loaded design was saved with different prices
  const [pricingChangedBanner, setPricingChangedBanner] = useState(false);
  // Track which uid/businessId the current pricing was fetched for
  const pricingFetchedFor = useRef(null);

  // ── CHANGED: read user profile from AuthContext ───────────────────────────
  // Use optional chaining — ConfigProvider may render before AuthProvider
  // settles, so we tolerate undefined safely.
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

  // ── CHANGED: fetch active pricing once per login / businessId change ──────
  const loadPricing = useCallback(async () => {
    const fetchKey = currentUser?.uid ?? 'anonymous';
    if (pricingFetchedFor.current === fetchKey) return; // already fetched for this session
    pricingFetchedFor.current = fetchKey;

    setPricingLoaded(false);
    try {
      const pricing = await fetchActivePricing(linkedBusinessId);
      setActivePricing(pricing);
      console.info('[ConfigContext] Pricing loaded from Firestore', {
        linkedBusinessId,
        modulesCount: Object.keys(pricing.modules).length,
      });
    } catch (err) {
      // CHANGED: fall back to local data silently on Firestore failure
      console.error('[ConfigContext] Firestore pricing fetch failed, using local fallback:', err);
      setActivePricing(buildLocalFallbackPricing());
    } finally {
      setPricingLoaded(true);
    }
  }, [currentUser?.uid, linkedBusinessId]);

  // Run on auth state change (login / logout)
  useEffect(() => {
    if (currentUser) {
      loadPricing();
    } else {
      // Logged out — reset to local fallback so the configurator still works
      setActivePricing(buildLocalFallbackPricing());
      setPricingLoaded(true);
      pricingFetchedFor.current = null;
    }
  }, [currentUser?.uid, loadPricing]);

  // ── CHANGED: refreshPricing action — re-fetches from Firestore and dismisses banner ──
  const refreshPricing = useCallback(async () => {
    pricingFetchedFor.current = null; // force re-fetch
    setPricingChangedBanner(false);
    await loadPricing();
  }, [loadPricing]);

  // Derived metrics are memoized for performance
  // ── CHANGED: pass activePricing to calculateValuation ────────────────────
  const derived = useMemo(() => {
    const base = getDerivedState(config);
    // Override the valuation with Firestore-aware prices
    const valuation = calculateValuation(config, activePricing);
    return { ...base, valuation };
  }, [config, activePricing]);

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
    setModuleQty: (id, delta) => dispatch({ type: 'UPDATE_MODULE_QTY', payload: { id, delta } }),
    setModuleWall: (wallKey, wall) =>
      dispatch({ type: 'SET_MODULE_WALL', payload: { wallKey, wall } }),
    setModuleOverride: (wallKey, key, value) =>
      dispatch({ type: 'SET_MODULE_OVERRIDE', payload: { wallKey, key, value } }),
    setWallOffset: (wall, offset) =>
      dispatch({ type: 'SET_WALL_OFFSET', payload: { wall, offset } }),
    toggleAccessory: (id) => dispatch({ type: 'TOGGLE_ACCESSORY', payload: { id } }),
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
    // ── CHANGED: expose activePricing, pricingLoaded, pricingChangedBanner, refreshPricing ──
    <ConfigContext.Provider
      value={{
        config,
        derived,
        actions,
        lastDraftSave,
        // New pricing fields
        activePricing,
        pricingLoaded,
        pricingChangedBanner,
        setPricingChangedBanner, // so StepBOQ can dismiss it
        refreshPricing,
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

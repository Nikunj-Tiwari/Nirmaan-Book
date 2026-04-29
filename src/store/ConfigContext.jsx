import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useEffect,
  useRef,
  useState,
} from 'react';
import { COLOURS, MATERIALS, HANDLES, LIGHTING } from '../data/config';
import {
  updateModuleQty,
  updateFinishes,
  updateDimensions,
  getDerivedState,
} from '../utils/engine';
import { dataToConfig, saveDraft } from '../utils/storage';

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
  colour: COLOURS[0],
  material: MATERIALS[0],
  fascia: 'Akila',
  handle: HANDLES[0],
  lighting: LIGHTING[0],
  selectedAccessories: new Set(),
};

function configReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_DIMENSION':
      return updateDimensions(state, action.payload.key, action.payload.value);
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

  // Derived metrics are memoized for performance
  const derived = useMemo(() => getDerivedState(config), [config]);

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
    setFinish: (key, value) => dispatch({ type: 'UPDATE_FINISH', payload: { key, value } }),
    setModuleQty: (id, delta) => dispatch({ type: 'UPDATE_MODULE_QTY', payload: { id, delta } }),
    setModuleWall: (wallKey, wall) =>
      dispatch({ type: 'SET_MODULE_WALL', payload: { wallKey, wall } }),
    toggleAccessory: (id) => dispatch({ type: 'TOGGLE_ACCESSORY', payload: { id } }),
    reset: () => dispatch({ type: 'RESET_CONFIG' }),
    loadConfig: (data) => dispatch({ type: 'LOAD_CONFIG', payload: dataToConfig(data) }),
  };

  return (
    <ConfigContext.Provider value={{ config, derived, actions, lastDraftSave }}>
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

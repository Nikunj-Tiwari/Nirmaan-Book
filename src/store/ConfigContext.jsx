import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { COLOURS, MATERIALS, HANDLES, LIGHTING } from '../data/config';
import {
  updateModuleQty,
  updateFinishes,
  updateDimensions,
  getDerivedState,
} from '../utils/engine';

const ConfigContext = createContext();

const initialState = {
  wallType: 'single',
  width: 2400,
  height: 2400,
  depth: 600,
  width2: 1200,
  width3: 1200,
  modules: {},
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
    case 'UPDATE_MODULE_QTY':
      return updateModuleQty(state, action.payload.id, action.payload.delta);
    case 'TOGGLE_ACCESSORY':
      const newAccessories = new Set(state.selectedAccessories);
      if (newAccessories.has(action.payload.id)) {
        newAccessories.delete(action.payload.id);
      } else {
        newAccessories.add(action.payload.id);
      }
      return { ...state, selectedAccessories: newAccessories };
    case 'RESET_CONFIG':
      return initialState;
    default:
      return state;
  }
}

export const ConfigProvider = ({ children }) => {
  const [config, dispatch] = useReducer(configReducer, initialState);

  // Derived metrics are memoized for performance
  const derived = useMemo(() => getDerivedState(config), [config]);

  // Specialized action helpers
  const actions = {
    setDimension: (key, value) => dispatch({ type: 'UPDATE_DIMENSION', payload: { key, value } }),
    setFinish: (key, value) => dispatch({ type: 'UPDATE_FINISH', payload: { key, value } }),
    setModuleQty: (id, delta) => dispatch({ type: 'UPDATE_MODULE_QTY', payload: { id, delta } }),
    toggleAccessory: (id) => dispatch({ type: 'TOGGLE_ACCESSORY', payload: { id } }),
    reset: () => dispatch({ type: 'RESET_CONFIG' }),
  };

  return (
    <ConfigContext.Provider value={{ config, derived, actions }}>{children}</ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

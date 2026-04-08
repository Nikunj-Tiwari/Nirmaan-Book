import { materials } from '../data/materials';

export const initialState = {
  roomWidth: 3000,
  height: 2100,
  modules: [],
  material: materials[0] || null,
  accessories: [],
};

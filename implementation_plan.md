# Implementation Plan - NirmanBook Wardrobe Configurator

Build a modular wardrobe configurator with a system-first architecture: Logic → UI → Visualization.

## User Review Required

> [!IMPORTANT]
> The current plan uses standard React state management in `src/store/store.js`. If you prefer a specific library like Zustand or Redux, please let me know. 
> 3D visualization is planned as a stub for Phase 1-5, with Phase 6 introducing basic 3D rendering.

## Proposed Changes

### Foundation & Data Models
Establish the project structure and static data required for the configurator.

#### [NEW] [Project Setup](file:///d:/rudra/nirvanbookk/)
- Initialize Vite + React project in the current directory.
- Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei` (optional but recommended for Phase 6), `lucide-react` (for icons).

#### [NEW] [modules.js](file:///d:/rudra/nirvanbookk/src/data/modules.js)
- Define standard wardrobe modules (e.g., Shelf, Drawer, Hanger) with dimensions and base prices.

#### [NEW] [materials.js](file:///d:/rudra/nirvanbookk/src/data/materials.js)
- Define materials (MDF, Plywood, etc.) with price multipliers and hex colors.

#### [NEW] [accessories.js](file:///d:/rudra/nirvanbookk/src/data/accessories.js)
- Define accessories (Hanger rods, Trouser racks, Lights).

---

### Core System Engines
Implement the logic layers that drive the application state.

#### [NEW] [rules.js](file:///d:/rudra/nirvanbookk/src/utils/rules.js)
- Validation logic for width constraints and module compatibility.

#### [NEW] [pricing.js](file:///d:/rudra/nirvanbookk/src/utils/pricing.js)
- Calculation logic for real-time pricing based on modules, materials, and accessories.

#### [NEW] [bom.js](file:///d:/rudra/nirvanbookk/src/utils/bom.js)
- Logic to generate a structured Bill of Materials from the current state.

#### [NEW] [store.js](file:///d:/rudra/nirvanbookk/src/store/store.js)
- React context or Zustand store to manage global configurator state.

---

### UI Components
Develop the interface to interact with the core engine.

#### [NEW] [LeftPanel.jsx](file:///d:/rudra/nirvanbookk/src/components/LeftPanel.jsx)
- Form inputs for room dimensions.
- Lists for adding/removing modules and selecting materials.

#### [NEW] [Viewer.jsx](file:///d:/rudra/nirvanbookk/src/components/Viewer.jsx)
- A placeholder visualizer that will eventually host the 3D scene.

#### [NEW] [SummaryPanel.jsx](file:///d:/rudra/nirvanbookk/src/components/SummaryPanel.jsx)
- Real-time price display and BOM breakdown.

#### [NEW] [index.css](file:///d:/rudra/nirvanbookk/src/index.css)
- Modern, premium styling using CSS variables, glassmorphism, and smooth transitions.

## Open Questions

> [!QUESTION]
> Do you have specific dimensions or pricing for the standard modules from the PDF catalogue that I should pre-populate? If not, I will use representative placeholder values.

## Verification Plan

### Automated Tests
- `npm run dev` to verify visual layout and interactivity.
- Console logging of state transitions to ensure rules engine blocks invalid widths.

### Manual Verification
1. Enter a room width (e.g., 2400mm).
2. Add modules until the limit is reached; verify that further additions are blocked.
3. Change material and verify that total price updates instantly.
4. Review the BOM for accuracy against the selected configuration.

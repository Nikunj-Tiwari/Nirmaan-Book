# NirmanBook — Modular Wardrobe Configurator & B2B Platform

[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r161-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![ImageKit](https://img.shields.io/badge/CDN-ImageKit-0052CC?logo=imagekit&logoColor=white)](https://imagekit.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A state-of-the-art, rule-based web platform designed for interior designers, business partners, and homeowners to design, configure, visualize, and price custom modular wardrobes dynamically in real time.

🌐 **Live Deployment**: [https://nirmanbook-15825.web.app](https://nirmanbook-15825.web.app)

---

## ✨ Key Features

### 🎨 Real-Time 3D & 2D Configurator

- **Compositional 3D Renderer**: Powered by `@react-three/fiber` and Three.js with realistic carcass layouts, internal shelving, drawers, cubbies, hanging rails, and accessories.
- **Custom 3D Model Support**: Upload custom `.glb` / `.gltf` 3D wardrobe module files with automatic scaling and procedural fallback rendering.
- **Interactive Add-ons & Accessories**: Dynamic visualization of LED strip lighting with realistic glow, trouser racks, wooden & glass trays, shoe rails, sensor lights, and jewelry organizers.
- **Parametric Materials & Handles**: Real-time finish switches for carcasses, shutters, handles (gola profiles, edge profiles, surface bars), and drawer fascia.

### 🏢 Multi-Role Business Architecture

- **Customer Portal**:
  - Intuitive step-by-step wardrobe dimension and configuration wizard.
  - Live 2D structural diagram and real-time interactive 3D preview.
  - Instant pricing breakdown, PDF quotation generation, and saved design drafts.
- **Business Partner Dashboard**:
  - Dedicated pricing tier management (markup percentages, custom rates per sq.ft).
  - Custom module creation with 3D model upload and ImageKit image hosting.
  - Branded client quote generation with PDF & Excel (BOM) export.
- **Super Admin Control Center**:
  - Complete control over Platform modules and Business Partner modules with instant approval, edit, and deletion.
  - Global user management with instant role promotion/assignment (`Customer`, `Business Partner`, `Super Admin`).
  - Platform catalog management for materials, handles, accessories, and drawer fascia styles.
  - Automated catalog seed tools for instant bootstrap.

### 📊 Dynamic Pricing & Bill of Materials (BOM)

- **Instant Cost Calculation**: Real-time calculation based on carcass area, shutter square footage, hardware specs, finishes, and accessories.
- **Document Exporting**:
  - Professional PDF quote generation with detailed layout previews.
  - Complete Bill of Materials (BOM) spreadsheet export (`.xlsx`) via SheetJS.
  - Raw JSON configuration export for CAD/CAM manufacturing integration.

---

## 🛠 Tech Stack

| Layer                 | Technologies                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core Framework**    | [React 18](https://react.dev/), [Vite](https://vitejs.dev/)                                                                                         |
| **3D Rendering**      | [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| **Styling**           | Vanilla CSS (Tailored Design System, Glassmorphism, CSS Variables)                                                                                  |
| **Routing**           | [React Router DOM (v7)](https://reactrouter.com/) with Role-Based Route Guards                                                                      |
| **Backend / Auth**    | [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Firebase Hosting)                                                        |
| **Media & Asset CDN** | [ImageKit.io](https://imagekit.io/) (High-speed direct client upload & CDN optimization)                                                            |
| **Export Engines**    | [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [XLSX](https://sheetjs.com/)                           |
| **Icons & UI**        | [Lucide React](https://lucide.dev/)                                                                                                                 |

---

## 📁 Project Structure

```text
nirrmaaan/
├── public/                 # Static assets, catalogue images, and favicons
├── src/
│   ├── assets/             # Branding graphics, logos, and textures
│   ├── components/
│   │   ├── admin/          # Super Admin dashboard, users, catalog, seed tools
│   │   ├── business/       # Business partner dashboard, pricing, and catalog
│   │   ├── guards/         # Protected role-based route guards
│   │   ├── three/          # Three.js 3D viewport, shaders, lighting, and ModuleMesh
│   │   ├── ConfiguratorFlow.jsx # Step-by-step wardrobe configuration engine
│   │   ├── StepBOQ.jsx     # Bill of Materials, pricing breakdown, and PDF export
│   │   └── LoginPage.jsx   # Multi-auth login (Google, Email, Phone OTP)
│   ├── store/              # Global state contexts (AuthContext, ConfigContext)
│   ├── utils/              # Calculation engines, Firestore services, ImageKit uploaders
│   ├── App.jsx             # Master application router
│   └── firebase.js         # Firebase client initialization
├── firestore.rules         # Security rules for multi-tenant data
├── firebase.json           # Firebase Hosting & deployment configuration
└── vite.config.js          # Vite build pipeline configuration
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites

- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later

### 2. Clone the Repository

```bash
git clone https://github.com/Nikunj-Tiwari/Nirmaan-Book.git
cd Nirmaan-Book
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ImageKit CDN
VITE_IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Build & Deployment

### Build Production Bundle

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

---

## 👩‍💻 Scripts

- `npm run dev` — Starts the local Vite development server with hot module replacement (HMR).
- `npm run build` — Generates a minified, tree-shaken production bundle in `dist/`.
- `npm run preview` — Locally preview the production build.
- `npm run lint` — Runs ESLint with zero-warning enforcement.
- `npm run format` — Automatically formats codebase using Prettier.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

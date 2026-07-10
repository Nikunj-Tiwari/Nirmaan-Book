import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ConfigProvider } from './store/ConfigContext.jsx';
import { AuthProvider } from './store/AuthContext.jsx';
import { initTheme } from './components/ThemeToggle.jsx';

// ── Silent startup bootstrap ──────────────────────────────────────────────────
// Runs once per app start. No UI impact. All output goes to browser console.
import { ensureSuperAdmin } from './utils/createSuperAdmin.js';
import { seedPlatformCatalog } from './utils/seedPlatformCatalog.js';
import { db } from './firebase.js';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function runStartupBootstrap() {
  try {
    // Step 1 — Ensure super admin documents exist in Firestore
    await ensureSuperAdmin();

    // Step 2 — Seed platform catalog if empty
    try {
      const modulesSnap = await getDocs(
        query(collection(db, 'platform_catalog', 'catalog', 'modules'), limit(1))
      );
      if (modulesSnap.empty) {
        console.log('🌱 Seeding platform catalog...');
        await seedPlatformCatalog();
        console.log('✅ Platform catalog seeded successfully');
        console.log('Modules, materials, handles, accessories loaded.');
      } else {
        console.log('✅ Platform catalog already seeded');
      }
    } catch (seedErr) {
      // Catalog seed is non-fatal — app works with local data as fallback
      console.warn('[startup] Catalog seed check failed (non-fatal):', seedErr.message);
    }
  } catch (err) {
    // Super admin setup is non-fatal — Firestore rules may already block it
    console.warn('[startup] Super admin check failed (non-fatal):', err.message);
  }
}

// Apply saved theme before React paints — prevents flash of wrong theme
initTheme();

// Run bootstrap in background — does NOT block rendering
runStartupBootstrap();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

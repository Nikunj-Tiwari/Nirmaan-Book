import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// NirmanBook Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if API key is present to avoid crash in dev
let auth;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    console.warn(
      '[Firebase] API key missing — running in offline/dev mode. Auth will be bypassed.'
    );
    auth = null;
  }
} catch (err) {
  console.error('[Firebase] Initialization failed:', err.message);
  auth = null;
}

export { auth };

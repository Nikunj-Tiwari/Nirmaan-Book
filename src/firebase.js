import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// NirmanBook Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBpa6m_X3FC_pupCjhTZ1QUUEtU0_HZ9SA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nirmanbook-fef4c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nirmanbook-fef4c',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nirmanbook-fef4c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '79564307707',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:79564307707:web:25d970b2539425d0bbc45e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YRGFVJ0X26',
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth — always available
const auth = getAuth(app);

// Analytics — only in browser environments that support it (not SSR / some browsers)
let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {});

export { auth, analytics };

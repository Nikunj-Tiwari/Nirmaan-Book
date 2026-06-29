import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// NirmanBook Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCnuAm7FcFrObKIsh2Zlssp63ChtmlLr_U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nirmanbook-15825.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nirmanbook-15825',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nirmanbook-15825.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '425973286997',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:425973286997:web:7a2d955e60c4b3e8412cdc',
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Auth — always available
const auth = getAuth(app);

// Firestore — always available
const db = getFirestore(app);

// Analytics — only in browser environments that support it (not SSR / some browsers)
let analytics = null;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  })
  .catch(() => {});

export { auth, db, analytics };

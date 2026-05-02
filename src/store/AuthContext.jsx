import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    // Safety check: If Firebase is not configured, don't hang on loading
    if (!auth?.app?.options?.apiKey) {
      console.warn('Firebase API Key missing. Bypassing Auth loading for local development.');
      // Use microtask to avoid setState-in-effect lint warning
      queueMicrotask(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to our app user object
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Fallback: If auth takes too long (e.g. network issues), clear loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth initialization timed out. Clearing loading state.');
        setLoading(false);
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (email, password) => {
    try {
      if (!auth) {
        console.warn('Firebase Auth bypassed: Logging in with demo account');
        setUser({
          uid: 'demo-uid-123',
          email: email,
          name: email.split('@')[0],
        });
        return { ok: true };
      }
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  };

  const register = async (email, password, name = '', extraData = {}) => {
    try {
      if (!auth) {
        console.warn('Firebase Auth bypassed: Registering demo account');
        setUser({
          uid: 'demo-uid-123',
          email: email,
          name: name || email.split('@')[0],
        });
        return { ok: true };
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      // Note: extraData (firmName, contactNumber, city, profession)
      // can be saved to Firestore here if needed.
      console.log('Registration extra data:', extraData);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      if (!auth) {
        setUser(null);
        return;
      }
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

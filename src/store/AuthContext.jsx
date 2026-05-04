import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  /* ── Sync Firebase Auth state ── */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fb) => {
      setUser(
        fb
          ? {
              uid: fb.uid,
              email: fb.email,
              emailVerified: fb.emailVerified,
              name: fb.displayName || fb.email?.split('@')[0] || '',
              phoneNumber: fb.phoneNumber,
            }
          : null
      );
      setLoading(false);
    });
    const t = setTimeout(() => setLoading(false), 4000);
    return () => {
      unsubscribe();
      clearTimeout(t);
    };
  }, []);

  /* ── Email + Password Login ── */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  /* ── Register → send email verification ── */
  const register = async (email, password, name = '', extraData = {}) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      // TODO: persist extraData to Firestore when Firestore is added
      console.log('[NirmanBook] Registration extra data:', extraData);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  /* ── Forgot Password ── */
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  /* ── Phone OTP: send ── */
  const sendPhoneOTP = async (phoneNumber, containerId) => {
    try {
      // Clear old verifier if any
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (_) {
          /* ignore */
        }
        recaptchaRef.current = null;
      }

      recaptchaRef.current = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      });

      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        recaptchaRef.current
      );
      return { ok: true };
    } catch (err) {
      console.error('[sendPhoneOTP]', err);
      return { ok: false, error: err.message };
    }
  };

  /* ── Phone OTP: verify ── */
  const verifyPhoneOTP = async (code) => {
    try {
      if (!confirmationRef.current) {
        return { ok: false, error: 'Session expired. Please request a new OTP.' };
      }
      await confirmationRef.current.confirm(code);
      return { ok: true };
    } catch (_) {
      return { ok: false, error: 'Invalid OTP code. Please try again.' };
    }
  };

  /* ── Logout ── */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        sendPhoneOTP,
        verifyPhoneOTP,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

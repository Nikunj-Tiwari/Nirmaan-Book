import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// ─── Helper: fetch the user's Firestore profile ───────────────────────────────
async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data(); // { uid, email, role, status, linkedBusinessId, createdAt }
}

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  // Firebase Auth user object (raw)
  const [currentUser, setCurrentUser] = useState(null);

  // Firestore user document
  const [userProfile, setUserProfile] = useState(null);

  // Derived convenience fields (null until profile is loaded)
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);

  // True while the auth state AND Firestore profile are both being resolved
  const [loading, setLoading] = useState(true);

  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  // ── Clear all profile state (used on logout or fetch failure) ──────────────
  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setRole(null);
    setStatus(null);
  }, []);

  // ── Resolve Firestore profile for a given Firebase Auth user ───────────────
  const resolveProfile = useCallback(
    async (fb) => {
      try {
        const profile = await fetchUserProfile(fb.uid);
        if (!profile) {
          // Document doesn't exist yet (e.g. newly registered user)
          console.warn('[AuthContext] No Firestore profile found for uid:', fb.uid);
          clearProfile();
          return;
        }
        setUserProfile(profile);
        setRole(profile.role ?? null);
        setStatus(profile.status ?? null);
      } catch (err) {
        console.error('[AuthContext] Failed to fetch user profile:', err);
        clearProfile();
      }
    },
    [clearProfile]
  );

  // ── Sync Firebase Auth state ───────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fb) => {
      if (fb) {
        // Build the currentUser shape (same fields as before + raw object)
        setCurrentUser({
          uid: fb.uid,
          email: fb.email,
          emailVerified: fb.emailVerified,
          name: fb.displayName || fb.email?.split('@')[0] || '',
          phoneNumber: fb.phoneNumber,
          _raw: fb, // keep the raw object available if needed
        });

        // Fetch Firestore profile ONCE per login — not on every route change
        await resolveProfile(fb);
      } else {
        // Signed out
        setCurrentUser(null);
        clearProfile();
      }
      setLoading(false);
    });

    // Safety timeout — unblock UI if auth takes too long
    const t = setTimeout(() => setLoading(false), 4000);

    return () => {
      unsubscribe();
      clearTimeout(t);
    };
  }, [resolveProfile, clearProfile]);

  // ── Email + Password Login ─────────────────────────────────────────────────
  // Profile is fetched automatically via onAuthStateChanged above.
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ── Register → send email verification ────────────────────────────────────
  const register = async (email, password, name = '', extraData = {}) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      // extraData (role, businessName, etc.) must be written to Firestore by
      // the caller or a Cloud Function — AuthContext does not write user docs.
      console.log('[NirmanBook] Registration extra data (persist via caller):', extraData);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ── Phone OTP: send ────────────────────────────────────────────────────────
  const sendPhoneOTP = async (phoneNumber, containerId) => {
    try {
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

  // ── Phone OTP: verify ──────────────────────────────────────────────────────
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

  // ── Logout — clears profile state and signs out ────────────────────────────
  const logout = async () => {
    try {
      clearProfile();
      setCurrentUser(null);
      await signOut(auth);
      // Redirect to /login handled by the caller or a ProtectedRoute
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    }
  };

  // ── Derived helpers ────────────────────────────────────────────────────────
  // businessId: for business_partner users their uid IS their businessId
  const businessId = role === 'business_partner' ? (currentUser?.uid ?? null) : null;

  // linkedBusinessId: for customers, stored in their Firestore profile
  const linkedBusinessId = userProfile?.linkedBusinessId ?? null;

  // ── Backwards-compatible `user` alias ─────────────────────────────────────
  // Existing components that use `user` from useAuth() keep working.
  const user = currentUser;

  return (
    <AuthContext.Provider
      value={{
        // ── Raw auth object (backwards compat) ──
        user,

        // ── New structured API ──
        currentUser,
        userProfile,
        role,
        status,
        loading,
        businessId,
        linkedBusinessId,

        // ── Actions ──
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

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
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { seedPlatformCatalog } from '../utils/seedPlatformCatalog';

const AuthContext = createContext(null);

// ─── Helper: fetch the user's Firestore profile ───────────────────────────────
// Returns the full document data or null if the document doesn't exist.
async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data(); // { uid, email, role, status, linkedBusinessId, createdAt }
}

// ─── Helper: hard-redirect to /login (works outside Router context) ───────────
// Used for security-critical redirects (auth failure, Firestore error, logout).
// window.location.replace keeps history clean (no back-button loop).
function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  // ── Firebase Auth user object (raw) ──────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);

  // ── Firestore user document ───────────────────────────────────────────────
  // Shape: { uid, email, role, status, linkedBusinessId, createdAt }
  const [userProfile, setUserProfile] = useState(null);

  // ── Derived convenience fields (null until profile is loaded) ─────────────
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);

  // ── True while auth state AND Firestore profile are both being resolved ───
  const [loading, setLoading] = useState(true);

  // ── Phone auth refs ───────────────────────────────────────────────────────
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  // ─── Clear all profile state ──────────────────────────────────────────────
  // Called on logout or on any auth/Firestore failure.
  const clearProfile = useCallback(() => {
    setUserProfile(null);
    setRole(null);
    setStatus(null);
  }, []);

  // ─── Resolve Firestore profile for a given Firebase Auth user ─────────────
  // Fetched ONCE per login via onAuthStateChanged — NOT on every route change.
  // On failure: logs error, clears role, redirects to /login (Req 5).
  const resolveProfile = useCallback(
    async (fb) => {
      try {
        const profile = await fetchUserProfile(fb.uid);

        if (!profile) {
          // Document doesn't exist yet (e.g. newly registered user before Firestore
          // write completes). Clear profile but don't redirect — registration flow
          // handles this case and will write the doc immediately after.
          console.warn('[AuthContext] No Firestore profile found for uid:', fb.uid);
          clearProfile();
          return;
        }

        setUserProfile(profile);
        setRole(profile.role ?? null);
        setStatus(profile.status ?? null);
      } catch (err) {
        // Req 5: Log error, set role to null, redirect to /login
        console.error('[AuthContext] Failed to fetch user profile from Firestore:', err);
        clearProfile();
        redirectToLogin();
      }
    },
    [clearProfile]
  );

  // ─── Sync Firebase Auth state ─────────────────────────────────────────────
  // onAuthStateChanged fires exactly once on:
  //   - App mount (restoring session from cookie)
  //   - Login (signInWithEmailAndPassword resolves)
  //   - Logout (signOut resolves)
  // It does NOT fire on route changes.
  const SUPER_ADMIN_UID = 'D7bvmKJAWLckfIKMyDA5p7vhlCn2';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fb) => {
      if (fb) {
        // Build the currentUser shape with all needed fields
        setCurrentUser({
          uid: fb.uid,
          email: fb.email,
          emailVerified: fb.emailVerified,
          name: fb.displayName || fb.email?.split('@')[0] || '',
          phoneNumber: fb.phoneNumber,
          _raw: fb, // raw Firebase user object, available if needed
        });

        // Req 4: Fetch Firestore profile ONCE on login — stored in state and reused
        await resolveProfile(fb);

        // Auto-seed catalog when super admin logs in (if catalog is empty)
        if (fb.uid === SUPER_ADMIN_UID) {
          try {
            const catalogRef = collection(db, 'platform_catalog', 'catalog', 'modules');
            const snapshot = await getDocs(query(catalogRef, limit(1)));
            if (snapshot.empty) {
              console.log('[AuthContext] Catalog empty — seeding platform catalog...');
              await seedPlatformCatalog();
              console.log('✅ Platform catalog seeded');
            } else {
              console.log('✅ Catalog already seeded');
            }
          } catch (seedErr) {
            console.error('[AuthContext] Auto-seed failed (non-fatal):', seedErr);
          }
        }
      } else {
        // User signed out — clear everything
        setCurrentUser(null);
        clearProfile();
      }

      setLoading(false);
    });

    // Safety timeout — unblock UI if Firebase auth takes too long to initialise
    const t = setTimeout(() => setLoading(false), 4000);

    return () => {
      unsubscribe();
      clearTimeout(t);
    };
  }, [resolveProfile, clearProfile]);

  // ─── Email + Password Login ───────────────────────────────────────────────
  // Profile fetch is handled automatically by onAuthStateChanged above.
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ─── Register → create Auth account + send email verification ────────────
  // Firestore user/business documents are written by the caller (LoginPage)
  // immediately after this resolves, so AuthContext stays write-agnostic.
  const register = async (email, password, name = '', extraData = {}) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      // extraData logged for caller reference; persistence is the caller's responsibility
      console.log('[AuthContext] Registration extra data (persist via caller):', extraData);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ─── Forgot Password ──────────────────────────────────────────────────────
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ─── Phone OTP: send ──────────────────────────────────────────────────────
  const sendPhoneOTP = async (phoneNumber, containerId) => {
    try {
      // Tear down any previous RecaptchaVerifier before creating a new one
      if (recaptchaRef.current) {
        try {
          recaptchaRef.current.clear();
        } catch (_) {
          /* ignore — verifier may already be destroyed */
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
      console.error('[AuthContext] sendPhoneOTP error:', err);
      return { ok: false, error: err.message };
    }
  };

  // ─── Phone OTP: verify ────────────────────────────────────────────────────
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

  // ─── Google Sign-In ───────────────────────────────────────────────────────
  const signInWithGoogle = async (targetRole = 'customer') => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists()) {
          const isSuperAdminUser =
            fbUser.uid === SUPER_ADMIN_UID || fbUser.email === 'developer@nirmanbook.com';
          const role = isSuperAdminUser ? 'super_admin' : targetRole;

          await setDoc(userDocRef, {
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role,
            status: 'active',
            linkedBusinessId: null,
            createdAt: serverTimestamp(),
          });

          if (isSuperAdminUser) {
            await setDoc(doc(db, 'admins', fbUser.uid), {
              uid: fbUser.uid,
              email: fbUser.email,
              role: 'super_admin',
              createdAt: serverTimestamp(),
            });
          }
        }
      } catch (docErr) {
        console.warn('[AuthContext] Firestore profile init after Google sign-in:', docErr.message);
      }

      await resolveProfile(fbUser);
      return { ok: true, user: fbUser };
    } catch (err) {
      console.error('[AuthContext] Google sign-in error:', err);
      return { ok: false, error: err.message };
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  // Req 6: Clear all stored profile data AND redirect to /login.
  const logout = async () => {
    try {
      clearProfile();
      setCurrentUser(null);
      await signOut(auth);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      // Req 6: Always redirect to /login after logout, regardless of errors
      redirectToLogin();
    }
  };

  // ─── Derived convenience values ───────────────────────────────────────────

  // businessId: business_partner users — their uid IS their businessId
  const businessId = role === 'business_partner' ? (currentUser?.uid ?? null) : null;

  // linkedBusinessId: customers — stored in their Firestore profile by the admin
  const linkedBusinessId = userProfile?.linkedBusinessId ?? null;

  // Backwards-compatible `user` alias — components using `user` from useAuth() still work
  const user = currentUser;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        // ── Backwards-compat alias ──
        user,

        // ── Firebase Auth user object (uid, email, name, emailVerified, _raw) ──
        currentUser,

        // ── Firestore user document (role, status, linkedBusinessId, createdAt) ──
        userProfile,

        // ── Derived role + status (null while loading) ──
        role,
        status,

        // ── True while auth + Firestore are being resolved ──
        loading,

        // ── Derived helpers ──
        businessId, // non-null only for business_partner
        linkedBusinessId, // non-null only for customers with an assigned business

        // ── Actions ──
        login,
        register,
        signInWithGoogle,
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

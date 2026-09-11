/**
 * createSuperAdmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Auto-creates the hardcoded super admin user in Firestore on first run.
 * Called automatically from main.jsx on every app startup (idempotent).
 *
 * Writes:
 *   users/{UID}  — user profile with role: "super_admin"
 *   admins/{UID} — admin registry document
 *
 * Safe to run repeatedly — if the super_admin document already exists,
 * nothing is overwritten.
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// ── Hardcoded super admin credentials ────────────────────────────────────────
const SUPER_ADMIN_UID = 'D7bvmKJAWLckfIKMyDA5p7vhlCn2';
const SUPER_ADMIN_EMAIL = 'developer@nirmanbook.com';

/**
 * Ensures the super admin documents exist in Firestore.
 * Exported so main.jsx can await it on startup.
 *
 * @returns {Promise<'created'|'exists'>}
 */
export async function ensureSuperAdmin() {
  const userRef = doc(db, 'users', SUPER_ADMIN_UID);
  const adminRef = doc(db, 'admins', SUPER_ADMIN_UID);

  // Check if super_admin already exists — skip if so
  const snap = await getDoc(userRef);
  if (snap.exists() && snap.data().role === 'super_admin') {
    console.log('✅ Super Admin already configured');
    return 'exists';
  }

  // ── Create users/{UID} ───────────────────────────────────────────────────
  await setDoc(userRef, {
    uid: SUPER_ADMIN_UID,
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    status: 'active',
    linkedBusinessId: null,
    createdAt: serverTimestamp(),
  });

  // ── Create admins/{UID} ──────────────────────────────────────────────────
  await setDoc(adminRef, {
    uid: SUPER_ADMIN_UID,
    email: SUPER_ADMIN_EMAIL,
    role: 'super_admin',
    createdAt: serverTimestamp(),
  });

  console.log('✅ Super Admin auto-created');
  console.log('UID:', SUPER_ADMIN_UID);
  console.log('Email:', SUPER_ADMIN_EMAIL);
  return 'created';
}

// ── Legacy export alias kept for any existing call-sites ─────────────────────
export { ensureSuperAdmin as createSuperAdmin };

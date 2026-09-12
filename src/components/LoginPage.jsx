import React, { useState, useId } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Mail,
  Phone,
  ShieldCheck,
  Home,
  Building2,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import logo from '../assets/logo.png';

/* ─── shared style helpers (unchanged from original) ─── */
const inp = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: 'var(--bg-primary)',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};
const focus = (e) => (e.target.style.borderColor = 'var(--accent)');
const blur = (e) => (e.target.style.borderColor = 'var(--border)');

const Label = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--text-primary)',
      marginBottom: 6,
    }}
  >
    {children}
  </label>
);

const Field = ({ label, id, ...rest }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <input id={id} style={inp} onFocus={focus} onBlur={blur} {...rest} />
  </div>
);

const Err = ({ msg }) =>
  msg ? (
    <div
      style={{
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#dc2626',
        marginBottom: 16,
        fontWeight: 500,
      }}
    >
      {msg}
    </div>
  ) : null;

const Btn = ({ loading, children, ...rest }) => (
  <button
    type="submit"
    disabled={loading}
    style={{
      width: '100%',
      padding: '12px',
      borderRadius: 8,
      border: 'none',
      background: loading ? 'var(--accent-border)' : 'var(--accent)',
      color: 'white',
      fontSize: 14,
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      transition: 'all 0.15s',
      boxShadow: loading ? 'none' : 'var(--shadow-sm)',
      marginTop: 4,
    }}
    {...rest}
  >
    {loading ? (
      <>
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'white',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
        Processing…
      </>
    ) : (
      children
    )}
  </button>
);

const Divider = ({ text = 'or' }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: 12 }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    <span
      style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
      }}
    >
      {text}
    </span>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

const GoogleBtn = ({ onClick, loading, text = 'Continue with Google' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    style={{
      width: '100%',
      padding: '11px 16px',
      borderRadius: 8,
      border: '1.5px solid var(--border)',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: 14,
      fontWeight: 600,
      cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      transition: 'all 0.15s ease',
      boxShadow: 'var(--shadow-sm)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--text-muted)';
      e.currentTarget.style.background = 'var(--bg-secondary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.background = 'var(--bg-primary)';
    }}
  >
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
    {text}
  </button>
);

/* ─── Role Selection Screen ─── */
const RoleSelector = ({ onSelect }) => (
  <div style={{ width: '100%', maxWidth: 420 }}>
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          marginBottom: 10,
          fontFamily: 'var(--font-display)',
        }}
      >
        Choose Your Account Type
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Select how you'll use NirmanBook
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Customer Card */}
      <button
        onClick={() => onSelect('customer')}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          padding: '24px 22px',
          borderRadius: 14,
          border: '2px solid var(--border)',
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.18s',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.background = 'var(--accent-light)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'var(--bg-primary)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--accent-light)',
            border: '1.5px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Home size={22} color="var(--accent)" />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            🏠 Customer
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Design wardrobes, save projects and request quotes.
          </div>
        </div>
        <ArrowRight
          size={18}
          color="var(--text-muted)"
          style={{ marginLeft: 'auto', marginTop: 4, flexShrink: 0 }}
        />
      </button>

      {/* Business Partner Card */}
      <button
        onClick={() => onSelect('business_partner')}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          padding: '24px 22px',
          borderRadius: 14,
          border: '2px solid var(--border)',
          background: 'var(--bg-primary)',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.18s',
          fontFamily: 'var(--font-sans)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.background = 'var(--accent-light)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'var(--bg-primary)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--accent-light)',
            border: '1.5px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Building2 size={22} color="var(--accent)" />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}
          >
            🏢 Business Partner
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Manage products, pricing and customer projects.
          </div>
        </div>
        <ArrowRight
          size={18}
          color="var(--text-muted)"
          style={{ marginLeft: 'auto', marginTop: 4, flexShrink: 0 }}
        />
      </button>
    </div>

    <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>
      Already have an account?{' '}
      <button
        onClick={() => onSelect('__login__')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          fontSize: 12,
        }}
      >
        Sign in →
      </button>
    </p>
  </div>
);

/* ═══════════════════════════════════════════════════ */
const LoginPage = () => {
  const { login, register, signInWithGoogle, forgotPassword, sendPhoneOTP, verifyPhoneOTP } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const rcId = useId().replace(/:/g, 'rc');

  /* ── NEW: role selection screen ── */
  /* selectedRole: null | 'customer' | 'business_partner' */
  /* Default to 'customer' so Sign In form shows immediately on /login */
  const [selectedRole, setSelectedRole] = useState('customer');

  /* mode: 'login' | 'register' | 'forgot' */
  const [mode, setMode] = useState('login');

  /* register sub-step: 'details' | 'emailSent' | 'phone' | 'otp' */
  const [regStep, setRegStep] = useState('details');

  /* form fields */
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [profession, setProfession] = useState('Interior Designer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const go = (m) => {
    setMode(m);
    setError('');
    setRegStep('details');
  };

  /* ── Handle role card click ── */
  const handleRoleSelect = (role) => {
    if (role === '__login__') {
      setSelectedRole('customer'); // role doesn't matter for login
      go('login');
      return;
    }
    setSelectedRole(role);
    go('register');
  };

  /* ── LOGIN — reads Firestore profile to route correctly ─────────────────
     Flow:
       1. signInWithEmailAndPassword (Firebase Auth)
       2. auth.currentUser.uid is available synchronously after resolve
       3. Fetch users/{uid} from Firestore → check status + role
       4. Route: pending → /pending-approval
                 suspended → show inline error
                 super_admin → /admin
                 business_partner active → /business
                 customer active → /dashboard
  ── */
  const handleLoginSmart = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const r = await login(email, password);
    if (!r.ok) {
      setLoading(false);
      const code = r.error || '';
      if (
        code.includes('invalid-credential') ||
        code.includes('wrong-password') ||
        code.includes('user-not-found') ||
        code.includes('invalid-email')
      ) {
        setError('Incorrect email or password. Please try again.');
      } else if (code.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Sign in failed. Please try again.');
      }
      return;
    }

    // auth.currentUser is set synchronously after signInWithEmailAndPassword resolves
    try {
      const { getAuth } = await import('firebase/auth');
      const fbAuth = getAuth();
      const uid = fbAuth.currentUser?.uid;
      if (uid) {
        const { getDoc, doc: fsDoc } = await import('firebase/firestore');
        const snap = await getDoc(fsDoc(db, 'users', uid));
        if (snap.exists()) {
          const { role, status } = snap.data();
          setLoading(false);
          if (status === 'suspended') {
            setError('Your account has been suspended. Please contact support.');
            return;
          }
          if (status === 'pending') {
            navigate('/pending-approval', { replace: true });
            return;
          }
          if (role === 'super_admin') {
            navigate('/admin', { replace: true });
            return;
          }
          if (role === 'business_partner') {
            navigate('/business', { replace: true });
            return;
          }
          // customer active
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    } catch (err) {
      console.error('[LoginPage] Profile fetch after login failed:', err);
    }

    setLoading(false);
    navigate(from === '/' ? '/dashboard' : from, { replace: true });
  };

  /* ── GOOGLE SIGN-IN ── */
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const r = await signInWithGoogle(selectedRole || 'customer');
    if (!r.ok) {
      setLoading(false);
      if (r.error?.includes('popup-closed-by-user')) {
        return;
      }
      if (r.error?.includes('unauthorized-domain')) {
        setError(
          'Domain not authorized: Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.'
        );
      } else if (r.error?.includes('operation-not-allowed')) {
        setError(
          'Google Sign-in is not enabled in Firebase Console > Authentication > Sign-in method.'
        );
      } else {
        setError(
          r.error ? `Google sign in failed: ${r.error}` : 'Google sign in failed. Please try again.'
        );
      }
      return;
    }

    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (uid) {
        const { getDoc, doc: fsDoc } = await import('firebase/firestore');
        const snap = await getDoc(fsDoc(db, 'users', uid));
        if (snap.exists()) {
          const { role, status } = snap.data();
          setLoading(false);
          if (status === 'suspended') {
            setError('Your account has been suspended. Please contact support.');
            return;
          }
          if (status === 'pending') {
            navigate('/pending-approval', { replace: true });
            return;
          }
          if (role === 'super_admin') {
            navigate('/admin', { replace: true });
            return;
          }
          if (role === 'business_partner') {
            navigate('/business', { replace: true });
            return;
          }
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    } catch (err) {
      console.error('[LoginPage] Google redirect error:', err);
    }

    setLoading(false);
    navigate(from === '/' ? '/dashboard' : from, { replace: true });
  };

  /* ── REGISTER step 1: create Auth account + write Firestore docs ── */
  const handleRegisterDetails = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const r = await register(email, password, name, {});
    if (!r.ok) {
      setLoading(false);
      setError(
        r.error.includes('email-already-in-use')
          ? 'This email is already registered.'
          : r.error.includes('weak-password')
            ? 'Password must be at least 6 characters.'
            : r.error
      );
      return;
    }

    // At this point Firebase Auth created the user; write Firestore docs.
    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error('No UID after registration');

      if (selectedRole === 'customer') {
        // users/{uid}
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          role: 'customer',
          status: 'active',
          linkedBusinessId: null,
          createdAt: serverTimestamp(),
        });
      } else {
        // business_partner
        // users/{uid}
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          role: 'business_partner',
          status: 'pending',
          linkedBusinessId: null,
          createdAt: serverTimestamp(),
        });
        // businesses/{uid}
        await setDoc(doc(db, 'businesses', uid), {
          businessId: uid,
          businessName: firmName || name,
          ownerUid: uid,
          role: 'business_partner',
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('[Register] Firestore write failed:', err);
      // Non-fatal — user is authenticated, profile can be created later
    }

    setLoading(false);
    setRegStep('emailSent');
  };

  /* ── After email verification step: redirect based on role ── */
  const handlePostEmailStep = () => {
    if (selectedRole === 'business_partner') {
      navigate('/pending-approval', { replace: true });
    } else {
      setRegStep('phone');
    }
  };

  /* ── REGISTER step 3: send phone OTP ── */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (!phone.match(/^\+?[0-9\s-]{8,15}$/)) {
      setError('Enter a valid phone number (e.g. +91 98765 43210)');
      setLoading(false);
      return;
    }
    const num = phone.startsWith('+') ? phone : '+91' + phone.replace(/\s/g, '');
    const r = await sendPhoneOTP(num, rcId);
    setLoading(false);
    if (r.ok) setRegStep('otp');
    else
      setError(
        r.error.includes('too-many-requests') ? 'Too many attempts. Try again later.' : r.error
      );
  };

  /* ── REGISTER step 4: verify OTP → redirect to /dashboard ── */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const r = await verifyPhoneOTP(otp);
    setLoading(false);
    if (r.ok) navigate('/dashboard', { replace: true });
    else setError(r.error);
  };

  /* ── FORGOT PASSWORD ── */
  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const r = await forgotPassword(forgotEmail);
    setLoading(false);
    if (r.ok) setForgotSent(true);
    else
      setError(r.error.includes('user-not-found') ? 'No account found with this email.' : r.error);
  };

  const features = [
    'Configure wardrobes in minutes',
    'Instant accurate pricing',
    'Full bill of materials export',
    'Catalogue-backed modules',
  ];

  /* ─── Render right-panel content based on mode/step ─── */
  const renderRight = () => {
    /* FORGOT PASSWORD */
    if (mode === 'forgot')
      return (
        <div>
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Mail size={22} color="var(--accent)" />
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Reset password
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              We'll send a reset link to your email.
            </p>
          </div>
          {forgotSent ? (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: 10,
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <Check size={28} color="#16a34a" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>
                Reset link sent!
              </div>
              <div style={{ fontSize: 13, color: '#166534' }}>
                Check your inbox at <strong>{forgotEmail}</strong>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleForgot}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <Err msg={error} />
              <Field
                label="Email address"
                id="fp-email"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Btn loading={loading}>
                <Mail size={15} />
                Send Reset Link
              </Btn>
            </form>
          )}
          <p
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <button
              onClick={() => {
                setSelectedRole(null);
                go('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              ← Back to sign in
            </button>
          </p>
        </div>
      );

    /* REGISTER — step: emailSent */
    if (mode === 'register' && regStep === 'emailSent')
      return (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Mail size={28} color="var(--accent)" />
          </div>
          <h2
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}
          >
            Verify your email
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: 28,
            }}
          >
            A verification link was sent to <strong>{email}</strong>.<br />
            Click it to confirm your email, then continue below.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handlePostEmailStep}
              style={{
                ...inp,
                padding: '12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: 'var(--accent)',
                color: 'white',
                fontWeight: 700,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
              }}
            >
              {selectedRole === 'business_partner' ? (
                <>
                  <Check size={15} /> I've verified — submit for review
                </>
              ) : (
                <>
                  <Phone size={15} /> I've verified — continue with phone
                </>
              )}
            </button>
            <button
              onClick={() => go('login')}
              style={{
                ...inp,
                padding: '11px',
                borderRadius: 8,
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Skip for now — go to sign in
            </button>
          </div>
        </div>
      );

    /* REGISTER — step: phone */
    if (mode === 'register' && regStep === 'phone')
      return (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Phone size={22} color="var(--accent)" />
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Verify your phone
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              We'll send a 6-digit OTP via SMS.
            </p>
          </div>
          <Err msg={error} />
          <div id={rcId} />
          <form
            onSubmit={handleSendOTP}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <Field
              label="Phone number"
              id="reg-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Btn loading={loading}>
              <Phone size={15} />
              Send OTP
            </Btn>
          </form>
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Skip — go to dashboard
            </button>
          </p>
        </div>
      );

    /* REGISTER — step: otp */
    if (mode === 'register' && regStep === 'otp')
      return (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <ShieldCheck size={22} color="#16a34a" />
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Enter OTP
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              6-digit code sent to <strong>{phone}</strong>
            </p>
          </div>
          <Err msg={error} />
          <form
            onSubmit={handleVerifyOTP}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <Label htmlFor="otp-input">Verification Code</Label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="••••••"
                style={{
                  ...inp,
                  fontSize: 24,
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  fontWeight: 700,
                  padding: '14px',
                }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            <Btn loading={loading}>
              <ShieldCheck size={15} />
              Verify &amp; Finish
            </Btn>
          </form>
          <p
            style={{
              textAlign: 'center',
              marginTop: 16,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Didn't get it?{' '}
            <button
              onClick={() => setRegStep('phone')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Resend OTP
            </button>
          </p>
        </div>
      );

    /* REGISTER — step: details */
    if (mode === 'register')
      return (
        <div>
          <div style={{ marginBottom: 20 }}>
            {/* Role badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 99,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 16,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRole(null)}
              title="Change role"
            >
              {selectedRole === 'customer' ? '🏠 Customer' : '🏢 Business Partner'}
              <span style={{ fontSize: 11, opacity: 0.7 }}>· change</span>
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {selectedRole === 'customer'
                ? 'Join NirmanBook to start designing'
                : 'Set up your business partner account'}
            </p>
          </div>
          <Err msg={error} />
          <GoogleBtn onClick={handleGoogleSignIn} loading={loading} text="Sign up with Google" />
          <Divider text="or register with email" />
          <form
            onSubmit={handleRegisterDetails}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field
                label="Full name"
                id="r-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Kapoor"
              />
              {selectedRole === 'business_partner' ? (
                <Field
                  label="Business name"
                  id="r-firm"
                  type="text"
                  required
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="Kapoor Designs"
                />
              ) : (
                <Field
                  label="City"
                  id="r-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                />
              )}
              {selectedRole === 'business_partner' && (
                <>
                  <Field
                    label="City"
                    id="r-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                  />
                  <div>
                    <Label htmlFor="r-prof">Profession</Label>
                    <select
                      id="r-prof"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      style={{ ...inp, appearance: 'auto' }}
                      onFocus={focus}
                      onBlur={blur}
                    >
                      <option>Architect</option>
                      <option>Interior Designer</option>
                      <option>Manufacturer</option>
                      <option>Retailer</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <Field
              label="Email address"
              id="r-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div>
              <Label htmlFor="r-pass">Password</Label>
              <div style={{ position: 'relative' }}>
                <input
                  id="r-pass"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={focus}
                  onBlur={blur}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Btn loading={loading}>
              <Mail size={15} />
              {selectedRole === 'business_partner'
                ? 'Create Account & Send Verification'
                : 'Create Account & Send Verification'}
              <ArrowRight size={14} />
            </Btn>
          </form>
          <p
            style={{
              textAlign: 'center',
              marginTop: 20,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            Already have an account?{' '}
            <button
              onClick={() => {
                setSelectedRole('customer'); // back to sign-in, no role selector
                go('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Sign in →
            </button>
          </p>
        </div>
      );

    /* LOGIN (default) */
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Sign in to your NirmanBook account
          </p>
        </div>
        <Err msg={error} />
        <GoogleBtn onClick={handleGoogleSignIn} loading={loading} text="Continue with Google" />
        <Divider text="or continue with email" />
        <form
          onSubmit={handleLoginSmart}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <Field
            label="Email address"
            id="l-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label>Password</Label>
              <button
                type="button"
                onClick={() => go('forgot')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="l-pass"
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inp, paddingRight: 44 }}
                onFocus={focus}
                onBlur={blur}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2,
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Btn loading={loading}>
            Sign In <ArrowRight size={15} />
          </Btn>
        </form>
        <p
          style={{
            textAlign: 'center',
            marginTop: 28,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          Don't have an account?{' '}
          <button
            onClick={() => {
              setSelectedRole(null); // show role selector → then sign-up
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Create one →
          </button>
        </p>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        fontFamily: 'var(--font-sans)',
        background: 'var(--bg-primary)',
      }}
    >
      {/* ── Left Brand Panel ── */}
      <div
        style={{
          background: 'linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 50%,#3b82f6 100%)',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -60,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 'auto',
            zIndex: 1,
          }}
        >
          <img
            src={logo}
            alt="Nirmanbook"
            style={{ height: 32, width: 'auto', display: 'block' }}
          />
        </div>

        <div style={{ zIndex: 1, marginTop: 'auto', marginBottom: 'auto', paddingTop: 48 }}>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 99,
              padding: '4px 14px',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 20,
            }}
          >
            Wardrobe Design Platform
          </div>
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(32px,3.5vw,48px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Design better
            <br />
            wardrobes, faster.
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 380,
            }}
          >
            The professional tool for configuring, pricing, and presenting modular wardrobe
            solutions to your clients.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} color="white" strokeWidth={3} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            zIndex: 1,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14,
            padding: '20px 24px',
            marginTop: 40,
          }}
        >
          <p
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 12,
            }}
          >
            "NirmanBook cut our sales cycle by 40%. Clients love being able to see the configuration
            live."
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: 'white',
              }}
            >
              RK
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Rahul Kapoor</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
                Interior Designer, Mumbai
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Role Selector OR Form Panel ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 56px',
          background: 'var(--bg-secondary)',
          overflowY: 'auto',
        }}
        className="animate-fade-in"
      >
        {/* Show role selector until a role is chosen */}
        {selectedRole === null ? (
          <RoleSelector onSelect={handleRoleSelect} />
        ) : (
          <div style={{ width: '100%', maxWidth: 420 }}>
            {/* Step indicator for register */}
            {mode === 'register' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                {[
                  { step: 'details', label: 'Account' },
                  { step: 'emailSent', label: 'Email' },
                  ...(selectedRole === 'customer'
                    ? [
                        { step: 'phone', label: 'Phone' },
                        { step: 'otp', label: 'OTP' },
                      ]
                    : []),
                ].map((s, i, arr) => {
                  const steps = arr.map((x) => x.step);
                  const cur = steps.indexOf(regStep);
                  const idx = steps.indexOf(s.step);
                  const done = idx < cur;
                  const active = idx === cur;
                  return (
                    <React.Fragment key={s.step}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            fontSize: 12,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: done
                              ? '#16a34a'
                              : active
                                ? 'var(--accent)'
                                : 'var(--bg-tertiary)',
                            color: done || active ? 'white' : 'var(--text-muted)',
                            border: `2px solid ${done ? '#16a34a' : active ? 'var(--accent)' : 'var(--border)'}`,
                          }}
                        >
                          {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: active ? 'var(--accent)' : 'var(--text-muted)',
                            fontWeight: active ? 700 : 500,
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            height: 2,
                            background: done ? '#16a34a' : 'var(--border)',
                            marginBottom: 14,
                            borderRadius: 1,
                            transition: 'background 0.3s',
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {renderRight()}

            <p
              style={{
                margin: '32px 0 0',
                fontSize: 11,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              By signing in you agree to our{' '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms</span> and{' '}
              <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;

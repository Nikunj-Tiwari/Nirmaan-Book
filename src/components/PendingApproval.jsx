import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Clock, LogOut, CheckCircle, Mail } from 'lucide-react';
import logo from '../assets/logo.png';

/**
 * PendingApproval
 *
 * Shown after a business_partner registers.
 * Polls the AuthContext status field (which is fetched from Firestore once on login).
 * If an admin approves the account (status → "active"), the user is automatically
 * redirected to /business without needing to log out and back in.
 *
 * To see the redirect in action: log out and log back in after the admin
 * updates the Firestore status field — AuthContext re-fetches on every login.
 */
const PendingApproval = () => {
  const { status, role, logout, currentUser } = useAuth();
  const navigate = useNavigate();

  /* Auto-redirect when status becomes "active" */
  useEffect(() => {
    if (status === 'active') {
      if (role === 'business_partner') navigate('/business', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [status, role, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <img src={logo} alt="NirmanBook" style={{ height: 36, width: 'auto', display: 'block' }} />
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-secondary)',
          borderRadius: 20,
          border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Top accent strip */}
        <div
          style={{
            height: 5,
            background: 'linear-gradient(90deg, var(--accent) 0%, #f59e0b 100%)',
          }}
        />

        <div style={{ padding: '44px 40px' }}>
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background:
                'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(166,106,63,0.12) 100%)',
              border: '1.5px solid rgba(245,158,11,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 28,
            }}
          >
            <Clock size={34} color="#f59e0b" />
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: 12,
              fontFamily: 'var(--font-display)',
            }}
          >
            Your account is under review.
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            You will receive access within{' '}
            <strong style={{ color: 'var(--text-primary)' }}>24–48 hours</strong> once our team
            reviews and approves your business partner application.
          </p>

          {/* Info steps */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: 'var(--bg-tertiary)',
              borderRadius: 14,
              padding: '20px 22px',
              marginBottom: 32,
            }}
          >
            {[
              {
                icon: <CheckCircle size={17} color="var(--success)" />,
                text: 'Account created successfully',
                done: true,
              },
              {
                icon: <Mail size={17} color="var(--accent)" />,
                text: 'Verification email sent',
                done: true,
              },
              {
                icon: <Clock size={17} color="#f59e0b" />,
                text: 'Admin review in progress',
                done: false,
              },
              {
                icon: <CheckCircle size={17} color="var(--text-muted)" />,
                text: 'Access granted to Business Dashboard',
                done: false,
              },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: step.done
                      ? 'var(--success-light)'
                      : i === 2
                        ? 'rgba(245,158,11,0.1)'
                        : 'var(--bg-primary)',
                    border: `1.5px solid ${
                      step.done
                        ? 'var(--success)'
                        : i === 2
                          ? 'rgba(245,158,11,0.3)'
                          : 'var(--border)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: step.done ? 600 : 500,
                    color: step.done ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {step.text}
                  {i === 2 && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: 8,
                        fontSize: 11,
                        background: 'rgba(245,158,11,0.15)',
                        color: '#d97706',
                        borderRadius: 99,
                        padding: '1px 8px',
                        fontWeight: 600,
                      }}
                    >
                      In Progress
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Email note */}
          {currentUser?.email && (
            <div
              style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
                marginBottom: 28,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Mail size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
              <span>
                We'll notify you at{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{currentUser.email}</strong> when
                your account is approved.
              </span>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--danger)';
              e.currentTarget.style.color = 'var(--danger)';
              e.currentTarget.style.background = 'var(--danger-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Questions? Contact us at{' '}
        <a
          href="mailto:support@nirmanbook.com"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
        >
          support@nirmanbook.com
        </a>
      </p>
    </div>
  );
};

export default PendingApproval;

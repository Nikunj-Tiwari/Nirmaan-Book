import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import BackgroundSlider from './BackgroundSlider';
import { BACKGROUND_IMAGES } from '../data/backgroundImages';
import {
  ArrowRight,
  Layers,
  Ruler,
  CheckCircle,
  Zap,
  Users,
  Star,
  ChevronRight,
  Sparkles,
  Package,
  BarChart3,
  FileText,
} from 'lucide-react';

/* ── tiny helpers ── */
const Tag = ({ children }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 12px',
      borderRadius: 99,
      background: 'var(--accent-light)',
      border: '1px solid var(--accent-border)',
      color: 'var(--accent)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.01em',
    }}
  >
    {children}
  </span>
);

const StatBadge = ({ value, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: 32,
        fontWeight: 800,
        color: 'var(--text-primary)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
      {label}
    </div>
  </div>
);

const FeatureCard = ({ icon, title, desc, accent }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${hov ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? 'var(--shadow-lg)' : 'var(--shadow-xs)',
        cursor: 'default',
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: hov ? 'var(--accent)' : 'var(--accent-light)',
          border: `1px solid ${hov ? 'var(--accent)' : 'var(--accent-border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: hov ? 'white' : 'var(--accent)',
          transition: 'all 0.2s',
        }}
      >
        {icon}
      </div>
      <div>
        <h4
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h4>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  );
};

const StepItem = ({ num, title, desc }) => (
  <div style={{ display: 'flex', gap: 20 }}>
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        flexShrink: 0,
        background: 'var(--accent)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 14,
        marginTop: 2,
      }}
    >
      {num}
    </div>
    <div>
      <h4
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 4,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

const ImageGallery = () => {
  const images = [
    'Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0001.jpg',
    'Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0002.jpg',
    'Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0003.jpg',
    'Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0004.jpg',
    'Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0005.jpg',
  ];

  // URL encode fixed strings for safety with [ ] characters
  const getPath = (name) => `/images/${name.replace('[', '%5B').replace(']', '%5D')}`;

  return (
    <div
      style={{
        padding: '60px 0',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        className="marquee-wrapper"
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {/* Row 1 - Scroll Left */}
        <div className="marquee-track scroll-left">
          {[...images, ...images].map((img, idx) => (
            <img key={idx} src={getPath(img)} className="marquee-img" alt="Wardrobe Design" />
          ))}
        </div>

        {/* Row 2 - Scroll Right */}
        <div className="marquee-track scroll-right">
          {[...images, ...images].reverse().map((img, idx) => (
            <img key={idx} src={getPath(img)} className="marquee-img" alt="Wardrobe Layout" />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const EnhancedHomePage = ({ onStart }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStart = () => {
    if (onStart) onStart();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
        position: 'relative',
      }}
    >
      {/* ── Dynamic Background Slider ── */}
      <BackgroundSlider images={BACKGROUND_IMAGES} />

      {/* ── Sticky Navbar ── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--bg-secondary)',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
          padding: '0 48px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--accent)',
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            NirmanBook
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'How it works', 'Pricing'].map((l) => (
            <span
              key={l}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {l}
            </span>
          ))}
        </div>

        {/* CTA group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Hi, {user.name.split(' ')[0]}
              </span>
              <button
                onClick={handleStart}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Open Configurator <ChevronRight size={14} />
              </button>
              <button
                onClick={logout}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Log in
              </Link>
              <button
                onClick={handleStart}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              >
                Get started free
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          padding: '100px 48px 80px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        {/* Soft glow background */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 700,
            height: 400,
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Tag>
          <Sparkles size={11} /> AI-Powered Wardrobe Configurator
        </Tag>

        <h1
          style={{
            fontSize: 'clamp(44px, 7vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1.05,
            color: '#ffffff',
            maxWidth: 760,
            marginTop: 24,
            marginBottom: 20,
            textShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          Design Your Perfect{' '}
          <span
            style={{
              color: '#60d5ff',
              textShadow: '0 0 20px rgba(96, 213, 255, 0.4)',
            }}
          >
            Wardrobe
          </span>
        </h1>

        <p
          style={{
            fontSize: 18,
            color: '#f0f0f0',
            maxWidth: 540,
            lineHeight: 1.7,
            marginBottom: 40,
            textShadow: '0 1px 8px rgba(0, 0, 0, 0.25)',
          }}
        >
          Configure, customize, and get instant pricing — all in one place. Built for interior
          designers and sales professionals.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            id="hero-start-btn"
            onClick={handleStart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 32px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.35)';
            }}
          >
            Start Configuring Free <ArrowRight size={16} />
          </button>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-xs)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
            }}
          >
            Sign in to account
          </Link>
        </div>

        {/* Trust bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 24,
            fontSize: 12,
            color: '#e0e0e0',
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
          ))}
          <span style={{ marginLeft: 4 }}>
            Trusted by <strong style={{ color: '#ffffff' }}>500+ designers</strong> across India
          </span>
        </div>

        {/* Hero illustration / app preview */}
        <div
          style={{
            marginTop: 64,
            width: '100%',
            maxWidth: 860,
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--border)',
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.1)',
            position: 'relative',
          }}
        >
          {/* Browser bar */}
          <div
            style={{
              height: 40,
              background: 'var(--bg-tertiary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 8,
            }}
          >
            {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
            <div
              style={{
                flex: 1,
                height: 22,
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: 10,
                fontSize: 11,
                color: 'var(--text-muted)',
                marginLeft: 8,
              }}
            >
              nirmanbook.com/configure
            </div>
          </div>

          {/* App preview */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 180px',
              height: 340,
            }}
          >
            {/* Sidebar */}
            <div
              style={{
                borderRight: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div
                  style={{ width: 24, height: 24, background: 'var(--accent)', borderRadius: 6 }}
                />
                <div
                  style={{
                    height: 10,
                    width: 80,
                    background: 'var(--border-strong)',
                    borderRadius: 3,
                  }}
                />
              </div>
              {['Room Setup', 'Modules', 'Finishes', 'Quote'].map((s, i) => (
                <div
                  key={s}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 7,
                    background: i === 1 ? 'var(--accent-light)' : 'transparent',
                    border: i === 1 ? '1px solid var(--accent-border)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background:
                        i < 1 ? 'var(--accent)' : i === 1 ? 'var(--accent)' : 'var(--bg-tertiary)',
                      border: `2px solid ${i <= 1 ? 'var(--accent)' : 'var(--border-strong)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      color: 'white',
                      fontWeight: 700,
                    }}
                  >
                    {i < 1 ? '✓' : i + 1}
                  </div>
                  <div
                    style={{
                      height: 9,
                      width: 60,
                      borderRadius: 2,
                      background: i === 1 ? 'var(--accent)' : 'var(--border-strong)',
                      opacity: i === 1 ? 1 : 0.6,
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  marginTop: 'auto',
                  padding: '14px 12px',
                  background: 'var(--accent-light)',
                  borderRadius: 8,
                  border: '1px solid var(--accent-border)',
                }}
              >
                <div
                  style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 3 }}
                >
                  TOTAL PRICE
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: 'var(--accent)',
                    letterSpacing: '-0.03em',
                  }}
                >
                  ₹48,500
                </div>
              </div>
            </div>

            {/* Main area - module grid */}
            <div style={{ padding: '20px', background: 'var(--bg-primary)', overflowY: 'hidden' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['All Modules', 'Hanging', 'Shelves', 'Drawers'].map((f, i) => (
                  <div
                    key={f}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 600,
                      background: i === 0 ? 'var(--accent-light)' : 'var(--bg-secondary)',
                      border: `1.5px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border)'}`,
                      color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { name: 'Full Hanging', w: '600mm', price: '₹8,000', sel: true },
                  { name: 'Double Shelf', w: '900mm', price: '₹11,500', sel: false },
                  { name: 'Drawer Tower', w: '600mm', price: '₹14,000', sel: false },
                  { name: 'L&D Combo', w: '900mm', price: '₹16,000', sel: true },
                  { name: 'Corner Unit', w: '1200mm', price: '₹22,000', sel: false },
                  { name: 'Shoe Rack', w: '600mm', price: '₹9,500', sel: false },
                ].map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `1.5px solid ${m.sel ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: 60,
                        background: m.sel ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Package size={20} color={m.sel ? 'var(--accent)' : 'var(--text-muted)'} />
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 1,
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{m.w}</div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--accent)',
                          marginTop: 4,
                        }}
                      >
                        {m.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right summary */}
            <div
              style={{
                borderLeft: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                Your Config
              </div>
              {['Full Hanging × 1', 'L&D Combo × 2'].map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 7,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {item}
                </div>
              ))}
              <div style={{ marginTop: 'auto' }}>
                <div
                  style={{
                    height: 5,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 99,
                    overflow: 'hidden',
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: '72%',
                      height: '100%',
                      background: 'var(--accent)',
                      borderRadius: 99,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>2100mm</span>
                  <span>72%</span>
                </div>
              </div>
              <div
                style={{
                  background: 'var(--accent)',
                  borderRadius: 8,
                  padding: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                  TOTAL
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: 'white',
                    letterSpacing: '-0.03em',
                  }}
                >
                  ₹48,500
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Visual Gallery ── */}
      <ImageGallery />

      {/* ── Stats bar ── */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '36px 48px',
          display: 'flex',
          justifyContent: 'center',
          gap: 80,
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <StatBadge value="500+" label="Active designers" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatBadge value="47" label="Wardrobe modules" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatBadge value="10K+" label="Configurations done" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatBadge value="4.9★" label="Designer rating" />
      </section>

      {/* ── Features ── */}
      <section
        style={{
          padding: '80px 48px',
          maxWidth: 1100,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <Tag>Why NirmanBook?</Tag>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              marginTop: 16,
              marginBottom: 12,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            Everything your design workflow needs
          </h2>
          <p
            style={{
              fontSize: 15,
              color: '#f0f0f0',
              maxWidth: 500,
              margin: '0 auto',
              lineHeight: 1.6,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            From first measurement to final quote — designed for speed and accuracy.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <FeatureCard
            icon={<Ruler size={20} />}
            title="Space-aware Geometry"
            desc="Enter your room dimensions and the system automatically calculates module slots, spacing, and constraints."
          />
          <FeatureCard
            icon={<Package size={20} />}
            title="47 Catalogue Modules"
            desc="Every module from the NirmanBook catalogue — precision-engineered, pre-priced, and ready to place."
          />
          <FeatureCard
            icon={<Zap size={20} />}
            title="Instant Pricing Engine"
            desc="Real-time price calculation as you build. Material multipliers, accessories, and hardware — all factored in."
          />
          <FeatureCard
            icon={<FileText size={20} />}
            title="One-click BOM Export"
            desc="Generate a professional bill of materials PDF, ready to share with clients or procurement teams."
          />
          <FeatureCard
            icon={<BarChart3 size={20} />}
            title="Smart Width Validation"
            desc="The engine prevents over-configuration. You'll always know how much space is left before adding the next module."
          />
          <FeatureCard
            icon={<Users size={20} />}
            title="Built for Sales Teams"
            desc="Walk clients through the configurator live. Pick finishes, hardware, and accessories together — close faster."
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{
          padding: '80px 48px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
        >
          <div>
            <Tag>How it works</Tag>
            <h2
              style={{
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                marginTop: 16,
                marginBottom: 12,
              }}
            >
              From dimensions to quote in 4 steps
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                marginBottom: 40,
              }}
            >
              No training required. Start designing immediately.
            </p>
            <button
              onClick={handleStart}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 9,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                boxShadow: 'var(--shadow-md)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              Try it now <ArrowRight size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <StepItem
              num={1}
              title="Enter room dimensions"
              desc="Set the width, height, and depth of your wardrobe alcove."
            />
            <StepItem
              num={2}
              title="Pick your modules"
              desc="Browse and add from the full catalogue. The system tracks every mm."
            />
            <StepItem
              num={3}
              title="Choose finishes & hardware"
              desc="Select material grade, colour tone, handles, and lighting."
            />
            <StepItem
              num={4}
              title="Download your quote"
              desc="Export a professional PDF instantly — no back-and-forth needed."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        style={{
          padding: '80px 48px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: '#ffffff',
            marginBottom: 14,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          Ready to design your wardrobe?
        </h2>
        <p
          style={{
            fontSize: 15,
            color: '#f0f0f0',
            marginBottom: 36,
            maxWidth: 420,
            lineHeight: 1.65,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
          }}
        >
          Join hundreds of interior designers using NirmanBook to win clients faster.
        </p>
        <button
          onClick={handleStart}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '15px 36px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            boxShadow: '0 6px 20px rgba(59,130,246,0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Start Configuring — It's Free <ArrowRight size={17} />
        </button>
        <Link
          to="/login"
          style={{
            marginTop: 14,
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Already have an account? Sign in →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          padding: '28px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: 'var(--accent)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={14} color="white" />
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            NirmanBook
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>© 2026</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Documentation', 'Support', 'Privacy', 'Terms'].map((l) => (
            <span
              key={l}
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default EnhancedHomePage;

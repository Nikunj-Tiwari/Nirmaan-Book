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
  Bookmark,
  Plus,
  Minus,
} from 'lucide-react';
import SavedDesignsDrawer from './SavedDesignsDrawer';
import { getConfigs } from '../utils/storage';
import { useToast } from './ToastProvider';
import ThemeToggle from './ThemeToggle';
import { useResponsive } from '../hooks/useResponsive';
import MobileNav from './MobileNav';

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

const PricingCard = ({
  plan,
  price,
  period,
  description,
  features,
  cta,
  onCta,
  highlighted,
  badge,
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: highlighted ? 'var(--accent)' : 'var(--bg-secondary)',
        border: `2px solid ${highlighted ? 'var(--accent)' : hov ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 18,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        position: 'relative',
        transition: 'all 0.2s ease',
        transform:
          hov && !highlighted ? 'translateY(-4px)' : highlighted ? 'scale(1.03)' : 'translateY(0)',
        boxShadow: highlighted
          ? '0 20px 48px rgba(59,130,246,0.35)'
          : hov
            ? 'var(--shadow-lg)'
            : 'var(--shadow-xs)',
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#f59e0b',
            color: '#1a1200',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 16px',
            borderRadius: 99,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      )}

      {/* Plan name */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: highlighted ? 'rgba(255,255,255,0.75)' : 'var(--accent)',
            marginBottom: 8,
          }}
        >
          {plan}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span
            style={{
              fontSize: price === 'Free' || price === 'Custom' ? 36 : 40,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: highlighted ? '#ffffff' : 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {price}
          </span>
          {period && (
            <span
              style={{
                fontSize: 14,
                color: highlighted ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {period}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            color: highlighted ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)',
            marginTop: 8,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: highlighted ? 'rgba(255,255,255,0.2)' : 'var(--border)',
        }}
      />

      {/* Features list */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
            <span
              style={{
                flexShrink: 0,
                marginTop: 1,
                color: highlighted ? '#a5f3fc' : 'var(--accent)',
                fontSize: 15,
                lineHeight: 1,
              }}
            >
              ✓
            </span>
            <span
              style={{
                color: highlighted ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onCta}
        style={{
          marginTop: 'auto',
          padding: '12px 0',
          borderRadius: 9,
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all 0.15s',
          background: highlighted ? '#ffffff' : 'var(--accent)',
          color: highlighted ? 'var(--accent)' : 'white',
          border: 'none',
          width: '100%',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {cta}
      </button>
    </div>
  );
};

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

const DEMO_STEPS = [
  { name: 'Full Hanging', price: 5500, width: '600mm' },
  { name: 'Drawer Tower', price: 8200, width: '450mm' },
  { name: 'Shoe Rack', price: 6500, width: '450mm' },
];

/* ── Animated Demo Widget ── */
const AnimatedDemo = () => {
  const [active, setActive] = useState(0);
  const [total, setTotal] = useState(5500);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % DEMO_STEPS.length;
        setTotal((t) => t + DEMO_STEPS[next].price);
        return next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{
        padding: '72px 48px',
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 40,
        }}
      >
        {/* Label */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              background: 'var(--accent-light)',
              border: '1px solid var(--accent-border)',
              borderRadius: 99,
              padding: '4px 14px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--accent)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            ⚡ Live Preview
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              marginBottom: 8,
            }}
          >
            Watch it build in real time
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 420,
              lineHeight: 1.65,
              margin: '0 auto',
            }}
          >
            Each module you add instantly updates the configuration and price — no page reloads, no
            waiting.
          </p>
        </div>

        {/* Demo UI */}
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 280px',
            gap: 20,
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Module list */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Choose Modules
            </div>
            {DEMO_STEPS.map((m, i) => {
              const isActive = i <= active;
              return (
                <div
                  key={m.name}
                  role="listitem"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${isActive ? '#16a34a' : 'var(--border)'}`,
                    background: isActive ? '#f0fdf4' : 'var(--bg-secondary)',
                    transition: 'all 0.5s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isActive ? 'rgba(34,197,94,0.12)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Package size={15} color={isActive ? '#16a34a' : 'var(--text-muted)'} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isActive ? '#15803d' : 'var(--text-primary)',
                        }}
                      >
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.width}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive ? '#16a34a' : 'var(--accent)',
                      }}
                    >
                      ₹{m.price.toLocaleString()}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: '#16a34a',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.04em',
                          animation: 'demoFadeIn 0.4s ease',
                        }}
                      >
                        ADDED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live summary panel */}
          <div
            style={{
              borderLeft: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Live Total
            </div>
            <div
              style={{
                background: 'var(--accent-light)',
                border: '1px solid var(--accent-border)',
                borderRadius: 10,
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}
              >
                CONFIGURATION TOTAL
              </div>
              <div
                key={total}
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '-0.04em',
                  animation: 'demoPriceFlash 0.5s ease',
                }}
              >
                ₹{total.toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO_STEPS.slice(0, active + 1).map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span>{m.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    ₹{m.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 'auto',
                fontSize: 10,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Updates instantly as you configure
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes demoFadeIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes demoPriceFlash { 0% { transform: scale(1.1); color: #22c55e; } 100% { transform: scale(1); } }
      `}</style>
    </section>
  );
};

const EnhancedHomePage = ({ onStart, activeConfigId, setActiveConfigId, onLaunchConfigurator }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(() => getConfigs().length);
  const { isMobile } = useResponsive();

  // Refresh count whenever drawer closes
  const handleDrawerClose = () => {
    setSavedDrawerOpen(false);
    setSavedCount(getConfigs().length);
  };

  const handleLoadFromHome = (entry) => {
    if (setActiveConfigId) setActiveConfigId(entry.id);
    // Trigger config load via context — App will mount ConfiguratorApp
    // We store it and navigate into configurator
    if (onLaunchConfigurator) onLaunchConfigurator();
    // addToast is available now
    addToast(`Loaded “${entry.name}”`, 'success');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStart = () => {
    if (onStart) onStart();
  };

  return (
    <>
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          fontFamily: 'var(--font-sans)',
          position: 'relative',
        }}
      >
        {isMobile && (
          <MobileNav
            user={user}
            onLogout={logout}
            onBack={() => {}}
            onSavedDesigns={() => setSavedDrawerOpen(true)}
          />
        )}
        {/* ── Dynamic Background Slider ── */}
        <BackgroundSlider images={BACKGROUND_IMAGES} />

        {/* ── Sticky Navbar ── */}
        <nav
          className="no-print desktop-nav"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'var(--bg-secondary)',
            borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
            boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
            padding: '0 48px',
            height: 64,
            display: isMobile ? 'none' : 'flex',
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
            {[
              { label: 'Features', anchor: 'features' },
              { label: 'How it works', anchor: 'how-it-works' },
              { label: 'Pricing', anchor: 'pricing' },
            ].map(({ label, anchor }) => (
              <span
                key={label}
                onClick={() => {
                  const el = document.getElementById(anchor);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
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
                {label}
              </span>
            ))}

            {/* Saved Designs button */}
            {savedCount > 0 && (
              <button
                id="home-saved-btn"
                onClick={() => setSavedDrawerOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--accent-border)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-light)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
                }}
              >
                <Bookmark size={13} />
                Saved
                <span
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    borderRadius: 99,
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    lineHeight: 1.4,
                  }}
                >
                  {savedCount}
                </span>
              </button>
            )}
            {/* Theme Toggle */}
            <ThemeToggle size="sm" />
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
              {user ? (
                <>
                  Open Configurator <ChevronRight size={16} />
                </>
              ) : (
                <>
                  Start Configuring Free <ArrowRight size={16} />
                </>
              )}
            </button>

            {!user && (
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
            )}
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
                <div
                  key={c}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: c }}
                />
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
                          i < 1
                            ? 'var(--accent)'
                            : i === 1
                              ? 'var(--accent)'
                              : 'var(--bg-tertiary)',
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
                    style={{
                      fontSize: 10,
                      color: 'var(--accent)',
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
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
              <div
                style={{ padding: '20px', background: 'var(--bg-primary)', overflowY: 'hidden' }}
              >
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

        {/* ── Animated Demo ── */}
        <AnimatedDemo />

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
          id="features"
          style={{
            padding: '80px 48px',
            maxWidth: 1100,
            margin: '0 auto',
            width: '100%',
            position: 'relative',
            zIndex: 2,
            scrollMarginTop: 64,
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
          id="how-it-works"
          style={{
            padding: '80px 48px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
            zIndex: 2,
            scrollMarginTop: 64,
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

        {/* ── Pricing ── */}
        <section
          id="pricing"
          style={{
            padding: '80px 48px',
            position: 'relative',
            zIndex: 2,
            scrollMarginTop: 64,
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <Tag>Simple, transparent pricing</Tag>
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
              One tool, every wardrobe project
            </h2>
            <p
              style={{
                fontSize: 15,
                color: '#f0f0f0',
                maxWidth: 480,
                margin: '0 auto',
                lineHeight: 1.6,
                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              }}
            >
              Start free, upgrade when you grow. All plans include the full module catalogue and
              instant BOM export.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
              maxWidth: 1000,
              margin: '0 auto',
            }}
          >
            {/* Starter */}
            <PricingCard
              plan="Starter"
              price="Free"
              period=""
              description="Perfect for independent designers exploring the tool."
              features={[
                'Up to 5 configurations / month',
                'All 47 catalogue modules',
                'Instant pricing engine',
                'PDF BOM export',
                'Email support',
              ]}
              cta="Get started free"
              onCta={handleStart}
              highlighted={false}
            />

            {/* Professional */}
            <PricingCard
              plan="Professional"
              price="₹999"
              period="/ month"
              description="For active designers and small studios closing deals daily."
              features={[
                'Unlimited configurations',
                'Priority customer support',
                'Client-ready branded exports',
                'Saved project history',
                'Multi-wall & U-shape layouts',
                'Custom finish & hardware uploads',
              ]}
              cta="Start free trial"
              onCta={handleStart}
              highlighted={true}
              badge="Most popular"
            />

            {/* Enterprise */}
            <PricingCard
              plan="Enterprise"
              price="Custom"
              period=""
              description="For dealerships, manufacturers, and large interior firms."
              features={[
                'Everything in Professional',
                'Dedicated account manager',
                'Custom module catalogues',
                'ERP / CRM integrations',
                'Team seat management',
                'SLA-backed support',
              ]}
              cta="Contact sales"
              onCta={() => window.open('mailto:sales@nirmanbook.com', '_blank')}
              highlighted={false}
            />
          </div>

          {/* Feature comparison callout */}
          <div
            style={{
              marginTop: 48,
              textAlign: 'center',
              padding: '24px 32px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              maxWidth: 640,
              margin: '48px auto 0',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <CheckCircle size={16} color="var(--accent)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                All plans include no lock-in & instant cancellation
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Start with Starter and upgrade anytime. Your configurations and exports are always
              yours — no data held hostage.
            </p>
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
            {user ? (
              <>
                Open Configurator <ChevronRight size={18} />
              </>
            ) : (
              <>
                Start Configuring — It's Free <ArrowRight size={17} />
              </>
            )}
          </button>
          {!user && (
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
          )}
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

      {/* Saved Designs Drawer */}
      <SavedDesignsDrawer
        isOpen={savedDrawerOpen}
        onClose={handleDrawerClose}
        onLoad={handleLoadFromHome}
        activeConfigId={activeConfigId}
        onToast={addToast}
      />
    </>
  );
};

export default EnhancedHomePage;

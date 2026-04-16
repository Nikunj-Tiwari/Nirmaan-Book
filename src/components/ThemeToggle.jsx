import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'nirmanbook_theme';

/**
 * Reads saved theme or defaults to 'light'.
 */
const getSavedTheme = () => localStorage.getItem(STORAGE_KEY) || 'light';

/**
 * Applies the theme data attribute to <html> and manages the
 * .theme-transition class to keep switches smooth.
 */
export const applyTheme = (theme) => {
  const root = document.documentElement;

  // Add transition class, then remove it after the animation finishes
  root.classList.add('theme-transition');
  root.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);

  window.setTimeout(() => root.classList.remove('theme-transition'), 350);
};

/**
 * Call this once (e.g. in main.jsx) to restore the saved theme on page load.
 */
export const initTheme = () => {
  const saved = getSavedTheme();
  document.documentElement.setAttribute('data-theme', saved);
};

/**
 * A self-contained toggle button.
 * Accepts an optional `size` prop ('sm' | 'md').
 */
const ThemeToggle = ({ size = 'md' }) => {
  const [theme, setTheme] = useState(getSavedTheme);

  useEffect(() => {
    // Sync if another tab changes preference
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setTheme(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  const isDark = theme === 'dark';
  const btnSize = size === 'sm' ? 32 : 36;
  const iconSize = size === 'sm' ? 15 : 17;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        width: btnSize,
        height: btnSize,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-border)';
        e.currentTarget.style.background = 'var(--accent-light)';
        e.currentTarget.style.color = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg-tertiary)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {isDark ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
    </button>
  );
};

export default ThemeToggle;

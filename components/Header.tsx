'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  onReset?: () => void;
}

export default function Header({ onReset }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const router = useRouter();

  useEffect(() => {
    // Sync the toggle icon to the persisted theme after mount. Server + first client render both
    // default to 'light', so the button always renders (no blink) — only the icon flips post-mount.
    const stored = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-bs-theme', next);
  };

  return (
    <nav className="navbar navbar-expand-lg site-navbar sticky-top">
      <div className="container">
        <span className="navbar-brand-logo">
          <span className="brand-mark">
            <i className="bi bi-briefcase-fill" />
          </span>
          <span className="brand-text">
            CV Job <span className="brand-accent">Matcher</span>
          </span>
        </span>

        <div className="ms-auto d-flex align-items-center gap-2 nav-actions">
          <button
            className="nav-btn nav-btn-primary"
            onClick={() => onReset ? onReset() : router.push('/')}
            title="Начало"
          >
            <i className="bi bi-house-door" />
            <span className="d-none d-sm-inline">Начало</span>
          </button>

          <a
            href="https://dev.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-btn nav-btn-ghost"
            title="Към dev.bg"
          >
            <span className="d-none d-sm-inline">dev.bg</span>
            <i className="bi bi-box-arrow-up-right" />
          </a>

          <button
            className="nav-btn nav-btn-icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Тъмна тема' : 'Светла тема'}
            aria-label="Смени темата"
            suppressHydrationWarning
          >
            <i
              className={`bi ${theme === 'light' ? 'bi-moon-stars' : 'bi-sun'}`}
              suppressHydrationWarning
            />
          </button>
        </div>
      </div>
    </nav>
  );
}

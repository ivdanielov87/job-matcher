'use client';

import { useEffect, useState } from 'react';

export default function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    setTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-bs-theme', next);
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom">
      <div className="container">
        <span className="navbar-brand-logo">
          <i className="bi bi-briefcase-fill me-2" style={{ color: 'var(--bs-primary)' }} />
          CV Job<span> Matcher</span>
        </span>

        <div className="ms-auto d-flex align-items-center gap-2">
          <span className="d-none d-sm-inline text-muted" style={{ fontSize: '0.82rem' }}>
            Powered by Gemini Flash + dev.bg
          </span>
          {mounted && (
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Тъмна тема' : 'Светла тема'}
            >
              <i className={`bi ${theme === 'light' ? 'bi-moon-fill' : 'bi-sun-fill'}`} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

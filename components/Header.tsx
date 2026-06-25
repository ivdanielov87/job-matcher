'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  onReset?: () => void;
}

export default function Header({ onReset }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

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
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onReset ? onReset() : router.push('/')}
            title="Начало"
          >
            <i className="bi bi-house-fill" />
            <span className="d-none d-sm-inline ms-1">Начало</span>
          </button>

          <a
            href="https://dev.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary"
            title="Към dev.bg"
          >
            <i className="bi bi-code-slash d-sm-none" />
            <span className="d-none d-sm-inline">
              Към dev.bg
              <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.7rem' }} />
            </span>
          </a>

          <a
            href="https://www.jobs.bg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-secondary"
            title="Към jobs.bg"
          >
            <i className="bi bi-briefcase d-sm-none" />
            <span className="d-none d-sm-inline">
              Към jobs.bg
              <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.7rem' }} />
            </span>
          </a>

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

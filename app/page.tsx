'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import CVUploadForm from '@/components/CVUploadForm';
import LoadingState from '@/components/LoadingState';
import JobResults from '@/components/JobResults';
import type { AnalyzeResponse, FormData } from '@/types';

type AppState = 'form' | 'loading' | 'results';

// Last results are cached per-tab so a refresh restores the view instead of wiping a paid analysis.
const STORAGE_KEY = 'cvjm:last-results';

export default function Home() {
  const [state, setState] = useState<AppState>('form');
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [daysBack, setDaysBack] = useState<number>(7);
  const [apiError, setApiError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<string>('');

  // Restore the last results on mount, THEN reveal the UI. Until then we show a neutral splash, so
  // the SSR-rendered form is never flashed before we swap to the restored results. Client-only.
  useEffect(() => {
    // One-time mount sync; the set-state-in-effect rule guards render-loop cascades, not this.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as { results?: AnalyzeResponse; daysBack?: number }) : null;
      if (saved?.results) {
        setResults(saved.results);
        setDaysBack(saved.daysBack ?? 7);
        setState('results');
      }
    } catch {
      /* ignore malformed / unavailable storage */
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleSubmit = async (file: File, form: FormData) => {
    setState('loading');
    setApiError('');
    setDaysBack(form.days_back);

    const requestId = crypto.randomUUID();
    requestIdRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;

    const fd = new FormData();
    fd.append('data', file);
    fd.append('location', form.location);
    fd.append('days_back', String(form.days_back));
    fd.append('request_id', requestId);
    if (form.email) fd.append('email', form.email);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      });
      const data: AnalyzeResponse = await res.json();

      if (!res.ok || data.success === false) {
        setApiError(data.message || 'Възникна грешка. Опитайте отново.');
        setState('form');
        return;
      }

      setResults(data);
      setState('results');
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ results: data, daysBack: form.days_back }));
      } catch {
        /* storage full / unavailable — non-fatal */
      }
    } catch (err) {
      // Прекратено от потребителя — състоянието вече е върнато в handleCancel.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setApiError('Не може да се свържем с сървъра. Проверете връзката.');
      setState('form');
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    // 1) Прекъсваме fetch-а към /api/analyze → route-ът освобождава server lock-а.
    abortRef.current?.abort();
    abortRef.current = null;

    // 2) Сигнализираме на n8n да спре текущото изпълнение (best-effort).
    const requestId = requestIdRef.current;
    if (requestId) {
      fetch('/api/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId }),
        keepalive: true,
      }).catch(() => {});
    }

    // 3) Връщаме потребителя към формата.
    setApiError('');
    setState('form');
  };

  const handleReset = () => {
    setResults(null);
    setApiError('');
    setState('form');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Header onReset={handleReset} />

      <main className="container py-4 flex-grow-1">
        {!hydrated && (
          <div className="page-splash">
            <div className="spinner-border text-primary" role="status" />
          </div>
        )}

        {hydrated && state === 'form' && (
          <>
            <div className="hero-section">
              <h1>
                Намери работа,{' '}
                <span className="hero-gradient-text">съобразена с твоето CV</span>
              </h1>
              <p className="lead">
                Качи CV-то си и AI ще намери най-подходящите обяви от dev.bg, оценени по умения и опит.
              </p>
              <div className="how-it-works mt-4 mb-2">
                <div className="how-step">
                  <div className="how-step-num">1</div>
                  <div className="how-step-label">Качи CV</div>
                </div>
                <div className="how-step">
                  <div className="how-step-num">2</div>
                  <div className="how-step-label">AI анализ</div>
                </div>
                <div className="how-step">
                  <div className="how-step-num">3</div>
                  <div className="how-step-label">Топ резултати</div>
                </div>
              </div>
            </div>

            <div className="row justify-content-center">
              <div className="col-12 col-lg-8 col-xl-7">
                {apiError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    <i className="bi bi-exclamation-circle me-2" />
                    {apiError}
                  </div>
                )}
                <CVUploadForm onSubmit={handleSubmit} loading={false} />
              </div>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 text-center">
              <LoadingState onCancel={handleCancel} />
            </div>
          </div>
        )}

        {state === 'results' && results && (
          <JobResults data={results} onReset={handleReset} daysBack={daysBack} />
        )}
      </main>

      {hydrated && (
        <footer className="site-footer border-top">
          <div className="container">
            CV Job Matcher — AI-powered job matching за разработчици
          </div>
        </footer>
      )}
    </>
  );
}

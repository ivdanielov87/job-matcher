'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import CVUploadForm from '@/components/CVUploadForm';
import LoadingState from '@/components/LoadingState';
import JobResults from '@/components/JobResults';
import type { AnalyzeResponse, FormData } from '@/types';

type AppState = 'form' | 'loading' | 'results';

export default function Home() {
  const [state, setState] = useState<AppState>('form');
  const [results, setResults] = useState<AnalyzeResponse | null>(null);
  const [daysBack, setDaysBack] = useState<number>(7);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (file: File, form: FormData) => {
    setState('loading');
    setApiError('');
    setDaysBack(form.days_back);

    const fd = new FormData();
    fd.append('data', file);
    fd.append('location', form.location);
    fd.append('language', form.language);
    fd.append('days_back', String(form.days_back));
    if (form.email) fd.append('email', form.email);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data: AnalyzeResponse = await res.json();

      if (!res.ok || data.success === false) {
        setApiError(data.message || 'Възникна грешка. Опитайте отново.');
        setState('form');
        return;
      }

      setResults(data);
      setState('results');
    } catch {
      setApiError('Не може да се свържем с сървъра. Проверете връзката.');
      setState('form');
    }
  };

  const handleReset = () => {
    setResults(null);
    setApiError('');
    setState('form');
  };

  return (
    <>
      <Header onReset={handleReset} />

      <main className="container py-4 flex-grow-1">
        {state === 'form' && (
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
              <LoadingState />
            </div>
          </div>
        )}

        {state === 'results' && results && (
          <JobResults data={results} onReset={handleReset} daysBack={daysBack} />
        )}
      </main>

      <footer className="site-footer border-top">
        <div className="container">
          CV Job Matcher — AI-powered job matching за разработчици
        </div>
      </footer>
    </>
  );
}

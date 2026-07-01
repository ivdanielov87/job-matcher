'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Четем твоето CV...',
  'Анализираме профила ти...',
  'Търсим обяви от dev.bg...',
  'Извличаме обявите...',
  'Оценяваме съвпаденията...',
  'Почти готово...',
];

export default function LoadingState({ onCancel }: { onCancel?: () => void }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(msgInterval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (s: number) =>
    s < 60 ? `${s} сек` : `${Math.floor(s / 60)} мин ${s % 60} сек`;

  return (
    <div className="loading-state">
      <div className="loading-spinner-wrap">
        <div className="spinner-border text-primary" role="status" />
        <i className="bi bi-file-earmark-person spinner-icon text-primary" />
      </div>

      <p
        className="loading-message text-body"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s' }}
      >
        {MESSAGES[msgIndex]}
      </p>

      <p className="loading-sub text-muted">
        Това може да отнеме 60–120 секунди
      </p>

      <p className="text-muted" style={{ fontSize: '0.82rem' }}>
        <i className="bi bi-clock me-1" />
        {formatElapsed(elapsed)}
      </p>

      <div className="mt-2">
        <div
          className="progress mx-auto"
          style={{ height: '3px', maxWidth: '280px', borderRadius: '2px' }}
        >
          <div
            className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {onCancel && (
        <div className="mt-4">
          <button
            type="button"
            className="cancel-search-btn"
            onClick={onCancel}
          >
            <i className="bi bi-x-circle" />
            Прекрати търсенето
          </button>
        </div>
      )}
    </div>
  );
}

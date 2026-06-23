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

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
        Това може да отнеме 30–90 секунди
      </p>

      <div className="mt-3">
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
    </div>
  );
}

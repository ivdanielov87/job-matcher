'use client';

import { useEffect, useState } from 'react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-top"
      aria-label="Нагоре"
      title="Нагоре"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="bi bi-arrow-up" />
    </button>
  );
}

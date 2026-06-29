import type { CVReview } from '@/types';

export default function CVReviewSection({ review }: { review?: CVReview }) {
  const gaps = review?.market_gaps ?? [];
  const tips = review?.tips ?? [];

  if (gaps.length === 0 && tips.length === 0) return null;

  return (
    <div className="cv-review card mb-4">
      <div className="card-body">
        <div className="cv-review-title">
          <i className="bi bi-lightbulb-fill me-2" />
          Препоръки за CV-то
        </div>

        {gaps.length > 0 && (
          <div className="cv-review-block">
            <div className="cv-review-subtitle">
              <i className="bi bi-graph-up-arrow me-1" />
              Най-търсени умения, които ти липсват
            </div>
            <div className="gap-tags">
              {gaps.map((g, i) => (
                <span key={i} className="gap-tag" title={`Търси се в ${g.jobs_count} обяви`}>
                  {g.skill}
                  <span className="gap-count">{g.jobs_count}</span>
                </span>
              ))}
            </div>
            <p className="cv-review-hint">
              Тези технологии се търсят в няколко от подходящите за теб обяви — добавянето им
              би отключило повече съвпадения.
            </p>
          </div>
        )}

        {tips.length > 0 && (
          <div className="cv-review-block mt-3">
            <div className="cv-review-subtitle">
              <i className="bi bi-pencil-square me-1" />
              Съвети за CV-то
            </div>
            <ul className="cv-tips-list">
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

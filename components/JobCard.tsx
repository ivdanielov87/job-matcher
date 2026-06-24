import type { Job } from '@/types';

function scoreClass(score: number): string {
  if (score >= 75) return 'score-excellent';
  if (score >= 50) return 'score-good';
  return 'score-partial';
}

function scoreLabel(score: number): string {
  if (score >= 75) return 'Отлично';
  if (score >= 50) return 'Добро';
  return 'Частично';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('bg-BG', { day: 'numeric', month: 'long' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function JobCard({ job }: { job: Job }) {
  const cls = scoreClass(job.score);
  const sourceClass = job.source ? `source-${job.source.replace('.', '-')}` : '';

  return (
    <div className={`job-card card ${cls}`}>
      <div className="card-body">

        {/* Header — separated from the rest */}
        <div className="job-card-header">
          <div className="d-flex align-items-start gap-3">
            <div className="flex-grow-1 min-width-0">
              <div className="job-title text-truncate" title={job.title}>
                {job.title}
              </div>
              <div className="job-company">
                <i className="bi bi-building me-1" />
                {job.company}
              </div>
            </div>
            <div className="d-flex flex-column align-items-end gap-1 flex-shrink-0">
              <div
                className={`score-badge ${cls}`}
                style={{ ['--score' as string]: job.score }}
              >
                <span className="score-badge-inner">{job.score}%</span>
              </div>
              {job.source && (
                <span className={`source-badge ${sourceClass}`}>
                  <i className="bi bi-globe2" />
                  {job.source}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 d-flex align-items-center gap-2">
            <small className={`fw-semibold ${cls === 'score-excellent' ? 'text-success' : cls === 'score-good' ? 'text-warning' : 'text-danger'}`}>
              {scoreLabel(job.score)} съвпадение
            </small>
            {job.experience_match && (
              <span className="experience-match-badge">
                <i className="bi bi-patch-check-fill me-1" />
                Опит ✓
              </span>
            )}
          </div>
        </div>

        {/* Meta badges */}
        <div className="job-meta">
          {job.location && (
            <span className="badge bg-secondary-subtle text-secondary-emphasis">
              <i className="bi bi-geo-alt me-1" />
              {job.location}
            </span>
          )}
          {job.employment_type && (
            <span className="badge bg-info-subtle text-info-emphasis">
              <i className="bi bi-clock me-1" />
              {job.employment_type}
            </span>
          )}
        </div>

        {/* Matched skills */}
        {job.matched_skills.length > 0 && (
          <div className="skills-section">
            <div className="skills-label">
              <i className="bi bi-check-circle me-1" />
              Съвпадащи умения
            </div>
            <div className="skill-tags">
              {job.matched_skills.map((skill, i) => (
                <span key={i} className="skill-tag matched">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills */}
        {job.missing_skills.length > 0 && (
          <div className="skills-section mt-2">
            <div className="skills-label">
              <i className="bi bi-x-circle me-1" />
              Липсващи умения
            </div>
            <div className="skill-tags">
              {job.missing_skills.map((skill, i) => (
                <span key={i} className="skill-tag missing">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        {job.summary && (
          <p className="job-summary">{job.summary}</p>
        )}

        {/* Footer */}
        <div className="job-footer">
          <span className="job-date">
            <i className="bi bi-calendar3 me-1" />
            {formatDate(job.date_posted)}
          </span>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
          >
            Виж обявата
            <i className="bi bi-arrow-up-right ms-1" />
          </a>
        </div>
      </div>
    </div>
  );
}

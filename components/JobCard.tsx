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

  return (
    <div className={`job-card card ${cls}`}>
      <div className="card-body">
        {/* Header row */}
        <div className="d-flex align-items-start gap-3 mb-1">
          <div className="flex-grow-1 min-width-0">
            <div className="job-title text-truncate" title={job.title}>
              {job.title}
            </div>
            <div className="job-company">{job.company}</div>
          </div>
          <div className={`score-badge ${cls} flex-shrink-0`}>
            {job.score}%
          </div>
        </div>

        {/* Score label */}
        <div className="mb-1">
          <small className={`fw-semibold ${cls === 'score-excellent' ? 'text-success' : cls === 'score-good' ? 'text-warning' : 'text-danger'}`}>
            {scoreLabel(job.score)} съвпадение
          </small>
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

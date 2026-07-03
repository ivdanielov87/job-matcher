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

// Обяви от последните 3 календарни дни се маркират като нови.
const NEW_JOB_DAYS = 3;

// Whole-day difference between today and the posting date (UTC-normalized), or null.
function daysAgo(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const postedDay = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((startOfToday - postedDay) / 86_400_000);
}

function isRecent(dateStr: string): boolean {
  const n = daysAgo(dateStr);
  return n != null && n >= 0 && n <= NEW_JOB_DAYS;
}

// Relative label used ONLY for recent (new) jobs; older ones keep the absolute date.
function relativeDate(dateStr: string): string {
  const n = daysAgo(dateStr);
  if (n == null) return formatDate(dateStr);
  if (n <= 0) return 'днес';
  if (n === 1) return 'вчера';
  return `преди ${n} дни`;
}

export default function JobCard({ job }: { job: Job }) {
  const cls = scoreClass(job.score);
  // Restore alongside the source badge below when a second job source is added.
  // const sourceClass = job.source ? `source-${job.source.replace('.', '-')}` : '';

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
              {/* Source badge hidden while we only pull from a single site (dev.bg).
                  Restore this once a second source is added, so users can see which
                  site each job came from. */}
              {/* {job.source && (
                <span className={`source-badge ${sourceClass}`}>
                  <i className="bi bi-globe2" />
                  {job.source}
                </span>
              )} */}
            </div>
          </div>
          <div className="mt-1">
            <small className={`fw-semibold d-block ${cls === 'score-excellent' ? 'text-success' : cls === 'score-good' ? 'text-warning' : 'text-danger'}`}>
              {scoreLabel(job.score)} съвпадение
            </small>
            <span className={`experience-match-badge mt-2 ${job.experience_match ? 'exp-ok' : 'exp-below'}`}>
              <i className={`bi ${job.experience_match ? 'bi-patch-check-fill' : 'bi-exclamation-triangle-fill'} me-1`} />
              {job.experience_match ? 'Опитът отговаря' : 'Опит под изискването'}
            </span>
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

        {/* Main stack of the role */}
        <div className="main-stack-line">
          <i className="bi bi-bullseye me-1" />
          <span className="main-stack-label">Главни технологии:</span>{' '}
          {job.main_stack && job.main_stack.length > 0 ? (
            job.main_stack.join(', ')
          ) : (
            <span className="main-stack-empty">не е посочен</span>
          )}
          {job.main_alt && (
            <span className="main-stack-alt">({job.main_alt})</span>
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
                <span key={i} className={`skill-tag ${skill.includes(' (') ? 'partial' : 'matched'}`}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing skills — always shown */}
        <div className="skills-section mt-2">
          <div className="skills-label">
            <i className="bi bi-x-circle me-1" />
            Липсващи умения
          </div>
          {job.missing_skills.length > 0 ? (
            <div className="skill-tags">
              {job.missing_skills.map((skill, i) => (
                <span key={i} className="skill-tag missing">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="skills-empty">Не са открити</div>
          )}
        </div>

        {/* AI Summary */}
        {job.summary && (
          <p className="job-summary">{job.summary}</p>
        )}

        {/* Footer */}
        <div className="job-footer">
          <span className="job-date-wrap">
            <span className="job-date">
              <i className="bi bi-calendar3 me-1" />
              {isRecent(job.date_posted) ? relativeDate(job.date_posted) : formatDate(job.date_posted)}
            </span>
            {isRecent(job.date_posted) && (
              <span className="job-new-badge">
                <i className="bi bi-stars" />
                Нова обява
              </span>
            )}
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

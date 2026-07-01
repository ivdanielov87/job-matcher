import type { AnalyzeResponse } from '@/types';
import JobCard from './JobCard';
import CVReviewSection from './CVReviewSection';
import CVStats from './CVStats';

interface Props {
  data: AnalyzeResponse;
  onReset: () => void;
  daysBack: number;
}

function formatTime(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} сек` : `${Math.floor(s / 60)} мин ${s % 60} сек`;
}

// Bulgarian-correct count phrasing.
function foundLabel(n: number): string {
  if (n <= 0) return 'Няма подходящи обяви';
  if (n === 1) return 'Намерена 1 подходяща обява';
  return `Намерени ${n} подходящи обяви`;
}

export default function JobResults({ data, onReset, daysBack }: Props) {
  const { jobs, total, message, processing_time_ms } = data;
  const periodLabel = daysBack === 7 ? 'последната седмица' : `последните ${daysBack} дни`;
  const hasResults = total > 0;

  return (
    <div>
      {/* Mobile only: full-width "Ново търсене" above the card */}
      <button
        className="btn btn-sm reset-btn results-reset-mobile w-100 mb-3"
        onClick={onReset}
      >
        <i className="bi bi-arrow-left me-1" />
        Ново търсене
      </button>

      <div className="results-card card mb-4">
        <div className="card-body">
          <div className="results-header">
            <div className="results-header-main">
              <div className={`results-badge${hasResults ? '' : ' results-badge--empty'}`}>
                <i className={`bi ${hasResults ? 'bi-bullseye' : 'bi-search'}`} />
              </div>
              <div>
                <div className="results-eyebrow">Резултати от търсенето</div>
                <h2 className="results-title mb-0">{foundLabel(total)}</h2>
                <p className="results-meta mb-0">
                  <i className="bi bi-calendar3 me-1" />
                  {periodLabel}
                  {processing_time_ms != null && (
                    <span className="results-meta-sep">
                      <i className="bi bi-clock me-1" />
                      обработено за {formatTime(processing_time_ms)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button className="btn btn-sm reset-btn results-reset" onClick={onReset}>
              <i className="bi bi-arrow-left me-1" />
              Ново търсене
            </button>
          </div>

          <CVStats stats={data.stats} />
        </div>
      </div>

      {message && (
        <div className="alert alert-info mb-3" role="alert">
          <i className="bi bi-info-circle me-2" />
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <i className="bi bi-search" />
          <p className="mb-1 fw-medium">Не намерихме подходящи обяви</p>
          <p className="small">Опитай с по-широки предпочитания или по-голям брой дни</p>
        </div>
      ) : (
        <div className="row g-3">
          {jobs.map((job, i) => (
            <div key={i} className="col-12 col-md-6 col-xl-4">
              <JobCard job={job} />
            </div>
          ))}
        </div>
      )}

      <CVReviewSection review={data.cv_review} />
    </div>
  );
}

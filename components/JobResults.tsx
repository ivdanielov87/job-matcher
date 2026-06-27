import type { AnalyzeResponse } from '@/types';
import JobCard from './JobCard';

interface Props {
  data: AnalyzeResponse;
  onReset: () => void;
  daysBack: number;
}

function formatTime(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s} сек` : `${Math.floor(s / 60)} мин ${s % 60} сек`;
}

export default function JobResults({ data, onReset, daysBack }: Props) {
  const { jobs, total, message, processing_time_ms } = data;
  const periodLabel = daysBack === 7 ? 'последната седмица' : `последните ${daysBack} дни`;

  return (
    <div>
      <div className="results-header">
        <div>
          <h2 className="mb-0">
            {total > 0 ? (
              <>
                <i className="bi bi-check-circle-fill text-success me-2" />
                Намерени {total} подходящи обяви
              </>
            ) : (
              <>
                <i className="bi bi-info-circle text-warning me-2" />
                Няма намерени обяви
              </>
            )}
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>
            <i className="bi bi-calendar3 me-1" />
            Резултати от {periodLabel}
            {processing_time_ms != null && (
              <span className="ms-3">
                <i className="bi bi-clock me-1" />
                Обработено за {formatTime(processing_time_ms)}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>
          <i className="bi bi-arrow-left me-1" />
          Ново търсене
        </button>
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
    </div>
  );
}

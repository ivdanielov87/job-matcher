import type { AnalyzeResponse } from '@/types';
import JobCard from './JobCard';

interface Props {
  data: AnalyzeResponse;
  onReset: () => void;
}

export default function JobResults({ data, onReset }: Props) {
  const { jobs, total, message } = data;

  return (
    <div>
      <div className="results-header">
        <h2>
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

'use client';

import { Fragment, useEffect, useState } from 'react';
import type { FormData } from '@/types';

// Remember the user's search preferences (location / days / email) across visits.
const PREFS_KEY = 'cvjm:prefs';

interface Props {
  onSubmit: (file: File, form: FormData) => void;
  loading: boolean;
}

const LOCATIONS = ['Remote', 'София', 'Пловдив', 'Варна', 'Бургас', 'Русе', 'Стара Загора'];
const DAYS = [7, 14, 21];
const WEEK_LABEL: Record<number, string> = { 7: '1 седмица', 14: '2 седмици', 21: '3 седмици' };

export default function CVUploadForm({ onSubmit, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState<FormData>({
    location: 'Remote',
    days_back: 7,
    email: '',
  });
  const [error, setError] = useState('');

  // Load saved preferences on mount (client-only, so no hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<FormData>;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({
        location: saved.location ?? f.location,
        days_back: saved.days_back ?? f.days_back,
        email: saved.email ?? f.email,
      }));
    } catch {
      /* ignore malformed / unavailable storage */
    }
  }, []);

  const handleFile = (f: File) => {
    if (f.size > 5 * 1024 * 1024) {
      setError('Файлът е твърде голям. Максимален размер: 5 MB.');
      return;
    }
    if (f.type !== 'application/pdf') {
      setError('Моля изберете PDF файл.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Моля качете вашето CV (PDF).');
      return;
    }
    setError('');
    // Persist preferences for next time (not the file itself).
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(form));
    } catch {
      /* storage unavailable — non-fatal */
    }
    onSubmit(file, form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="upload-card card">
        <div className="card-body">

          {/* Drop zone */}
          <label className="form-label fw-semibold">Вашето CV (PDF)</label>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              // Strict MIME hint so mobile opens the documents picker directly
              // (a generic chooser may offer camera/gallery, which need media
              // permissions and can hang the picker). Actual validation is in JS.
              accept="application/pdf"
              onChange={e => {
                const f = e.target.files?.[0];
                // Clear the value so a subsequent pick works even if a previous
                // picker was cancelled or hung (mobile re-open reliability).
                e.target.value = '';
                if (f) handleFile(f);
              }}
              onClick={e => e.stopPropagation()}
            />
            {file ? (
              <>
                <i className="bi bi-file-earmark-check-fill drop-zone-icon text-success" />
                <div className="drop-zone-filename">{file.name}</div>
                <div className="drop-zone-text mt-1">Натисни за замяна</div>
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload drop-zone-icon" />
                <div className="drop-zone-text">
                  <strong>Провлачи PDF тук</strong> или натисни за избор
                </div>
                <div className="drop-zone-text mt-1 small">(само PDF, макс. 5 MB)</div>
              </>
            )}
          </div>

          {/* Preferences section */}
          <div className="prefs-section mt-4">
            <div className="prefs-section-header">
              <i className="bi bi-sliders" />
              Предпочитания
            </div>

            <div className="row g-3">
              {/* Location */}
              <div className="col-12 col-sm-6">
                <div className="pref-label">
                  <i className="bi bi-geo-alt-fill" />
                  Локация
                </div>
                <select
                  className="form-select form-select-sm"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                >
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              {/* Email */}
              <div className="col-12 col-sm-6">
                <div className="pref-label">
                  <i className="bi bi-envelope" />
                  Email
                  <span className="pref-optional ms-1">(по желание)</span>
                </div>
                <div className="input-group input-group-sm">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="ivan@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Days */}
              <div className="col-12 col-sm-6">
                <div className="pref-label">
                  <i className="bi bi-calendar3" />
                  {form.days_back === 7
                    ? 'Обяви от последната седмица'
                    : `Обяви от последните ${form.days_back / 7} седмици`}
                </div>
                <div className="d-flex gap-2">
                  {DAYS.map(d => (
                    <Fragment key={d}>
                      <input
                        type="radio"
                        className="btn-check"
                        name="days_back"
                        id={`days-${d}`}
                        value={d}
                        checked={form.days_back === d}
                        onChange={() => setForm(f => ({ ...f, days_back: d }))}
                      />
                      <label className="btn week-btn btn-sm" htmlFor={`days-${d}`}>
                        {WEEK_LABEL[d]}
                      </label>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger mt-3 py-2 mb-0" role="alert">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="mt-4 d-grid">
            <button
              type="submit"
              className="btn submit-btn w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Анализираме...
                </>
              ) : (
                <>
                  <i className="bi bi-search me-2" />
                  Намери подходящи обяви
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}


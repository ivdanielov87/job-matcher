'use client';

import { Fragment, useState } from 'react';
import type { FormData } from '@/types';

interface Props {
  onSubmit: (file: File, form: FormData) => void;
  loading: boolean;
}

const LOCATIONS = ['Remote', 'София', 'Пловдив', 'Варна', 'Бургас', 'Русе', 'Стара Загора'];
const LANGUAGES = ['И двата', 'Български', 'English'];
const DAYS = [1, 5, 10];

export default function CVUploadForm({ onSubmit, loading }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState<FormData>({
    location: 'Remote',
    language: 'И двата',
    days_back: 5,
    email: '',
  });
  const [error, setError] = useState('');

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
              accept=".pdf,application/pdf"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
              onClick={e => e.stopPropagation()}
            />
            {file ? (
              <>
                <i className="bi bi-file-earmark-check-fill drop-zone-icon text-success" />
                <div className="drop-zone-filename">{file.name}</div>
                <div className="drop-zone-text mt-1">Кликни за замяна</div>
              </>
            ) : (
              <>
                <i className="bi bi-cloud-upload drop-zone-icon" />
                <div className="drop-zone-text">
                  <strong>Провлачи PDF тук</strong> или кликни за избор
                </div>
                <div className="drop-zone-text mt-1 small">Само PDF, макс. 5 MB</div>
              </>
            )}
          </div>

          {/* Preferences row */}
          <div className="row g-3 mt-2">
            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label fw-semibold small">Локация</label>
              <select
                className="form-select form-select-sm"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              >
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label fw-semibold small">Език на обявите</label>
              <select
                className="form-select form-select-sm"
                value={form.language}
                onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              >
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Обяви от последните <strong>{form.days_back}</strong> {form.days_back === 1 ? 'ден' : 'дни'}
              </label>
              <div className="days-selector d-flex gap-1 flex-wrap">
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
                    <label className="btn btn-outline-primary btn-sm" htmlFor={`days-${d}`}>
                      {d} {d === 1 ? 'ден' : 'дни'}
                    </label>
                  </Fragment>
                ))}
              </div>
            </div>

            <div className="col-12 col-sm-6">
              <label className="form-label fw-semibold small">
                Email <span className="text-muted fw-normal">(по желание)</span>
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="ivan@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
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
              className="btn btn-primary btn-lg"
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


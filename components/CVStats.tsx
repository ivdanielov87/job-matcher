import type { SearchStats } from '@/types';

function periodLabel(days: number): string {
  if (!days) return 'избрания период';
  if (days === 7) return 'последната седмица';
  if (days % 7 === 0) return `последните ${days / 7} седмици`;
  return `последните ${days} дни`;
}

// "Fullstack, Backend и Frontend"
function joinBg(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' и ' + items[items.length - 1];
}

export default function CVStats({ stats }: { stats?: SearchStats }) {
  if (!stats || stats.total_listings == null) return null;

  const cats = stats.categories?.length ? stats.categories : stats.role ? [stats.role] : [];
  const catsLabel = joinBg(cats);
  const matchWord = stats.matched === 1 ? 'съвпада' : 'съвпадат';
  const period = periodLabel(stats.period_days);
  // When several dev.bg sections are searched, the same ad is often cross-listed in
  // more than one — we count it once, so flag that the total is de-duplicated.
  const multiCat = cats.length > 1;
  // Location: "remote" when Remote/unset, otherwise "в <city>".
  const loc = stats.location;
  const isRemote = !loc || /remote/i.test(loc);

  const tiles = [
    { value: stats.total_listings, label: 'В dev.bg', icon: 'bi-collection', tone: 'neutral' },
    { value: stats.in_period, label: 'За периода', icon: 'bi-calendar3', tone: 'neutral' },
    ...(stats.from_core_stack != null
      ? [{ value: stats.from_core_stack, label: 'В твоя стек', icon: 'bi-stack', tone: 'neutral' }]
      : []),
    { value: stats.matched, label: 'Съвпадения', icon: 'bi-check-circle', tone: 'good' },
    { value: stats.below_threshold, label: 'Под прага', icon: 'bi-dash-circle', tone: 'muted' },
  ];

  const core = stats.stack_core ?? [];
  const tools = stats.stack_tools ?? [];
  const demand = stats.tech_demand ?? [];

  return (
    <div className="search-stats">
      <p className="search-stats-text">
        В сайта на <strong>DEV.BG</strong> намерихме <strong>{stats.total_listings}</strong>
        {multiCat ? ' уникални' : ''}
        {isRemote ? ' remote' : ''} обяви
        {catsLabel && (
          <>
            {' '}за <strong>{catsLabel}</strong>
          </>
        )}
        {!isRemote && (
          <>
            {' '}в <strong>{loc}</strong>
          </>
        )}
        {multiCat ? ' (без дублиращите се между разделите)' : ''}. От тях{' '}
        <strong>{stats.in_period}</strong> са от <strong>{period}</strong>, а спрямо твоя
        профил <strong>{stats.matched}</strong> {matchWord} над прага от {stats.threshold}%
        {stats.below_threshold > 0 && (
          <> — останалите {stats.below_threshold} не го достигнаха</>
        )}
        .
      </p>

      {(core.length > 0 || tools.length > 0) && (
        <ul className="stack-legend">
          <li className="stack-legend-heading">
            <i className="bi bi-person-badge" />
            Твоят стек
          </li>
          {core.length > 0 && (
            <li>
              <i className="bi bi-code-slash" />
              <span className="stack-legend-label">Езици и фреймуорци:</span>
              <span className="stack-legend-items">{core.join(', ')}</span>
            </li>
          )}
          {tools.length > 0 && (
            <li>
              <i className="bi bi-tools" />
              <span className="stack-legend-label">Инструменти:</span>
              <span className="stack-legend-items">{tools.join(', ')}</span>
            </li>
          )}
        </ul>
      )}

      <div className="search-stats-grid">
        {tiles.map((t, i) => (
          <div key={i} className={`stat-item stat-${t.tone}`}>
            <div className="stat-value">{t.value}</div>
            <div className="stat-label">
              <i className={`bi ${t.icon}`} />
              {t.label}
            </div>
          </div>
        ))}
      </div>

      {demand.length > 0 && (
        <div className="tech-demand">
          <div className="tech-demand-title">
            <i className="bi bi-bar-chart-line me-1" />
            Най-търсени технологии в обявите за периода
          </div>
          <div className="tech-demand-list">
            {demand.map((d, i) => (
              <span key={i} className="tech-demand-item">
                {d.tech}
                <span className="tech-demand-count">{d.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

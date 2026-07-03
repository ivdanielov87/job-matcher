'use client';

import { useState } from 'react';
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

// A small leading icon per demand group — quick visual scanning, no colour overload.
const GROUP_ICON: Record<string, string> = {
  languages: 'bi-code-slash',
  frameworks: 'bi-boxes',
  databases: 'bi-database',
  cloud: 'bi-cloud',
  tools: 'bi-tools',
};

// How many stack items to show per row before "+N още".
const STACK_CAP = 6;

export default function CVStats({ stats }: { stats?: SearchStats }) {
  // On mobile the detailed analysis collapses (see SCSS); on desktop it's always shown.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stackExpanded, setStackExpanded] = useState(false);

  if (!stats || stats.total_listings == null) return null;

  const cats = stats.categories?.length ? stats.categories : stats.role ? [stats.role] : [];
  const catsLabel = joinBg(cats);
  const matchWord = stats.matched === 1 ? 'съвпада' : 'съвпадат';
  const period = periodLabel(stats.period_days);
  const multiCat = cats.length > 1;
  const loc = stats.location;
  const isRemote = !loc || /remote/i.test(loc);

  // "Capped" = there were more main-stack matches than we could evaluate in detail (we scored the
  // best ones). Compare the in-stack pool to what actually reached scoring — stays honest even when
  // the pre-filter's 15-cap and the later seniority filter both trim the evaluated count.
  const capped =
    stats.from_core_stack != null &&
    stats.evaluated != null &&
    stats.evaluated < stats.from_core_stack;

  const tiles = [
    { value: stats.total_listings, label: 'В dev.bg', icon: 'bi-collection', tone: 'neutral' },
    { value: stats.in_period, label: 'За периода', icon: 'bi-calendar3', tone: 'neutral' },
    ...(stats.from_core_stack != null
      ? [{ value: stats.from_core_stack, label: 'В твоя стек', icon: 'bi-stack', tone: 'neutral' }]
      : []),
    ...(stats.evaluated != null
      ? [{ value: stats.evaluated, label: 'Оценени', icon: 'bi-search', tone: 'neutral' }]
      : []),
    { value: stats.matched, label: 'Съвпадения', icon: 'bi-check-circle', tone: 'good' },
    { value: stats.below_threshold, label: 'Под прага', icon: 'bi-dash-circle', tone: 'muted' },
  ];

  const core = stats.stack_core ?? [];
  const tools = stats.stack_tools ?? [];
  const demand = stats.tech_demand ?? [];
  const demandGroups = stats.tech_demand_groups ?? [];
  const hasStack = core.length > 0 || tools.length > 0;
  const hasDemand = demandGroups.length > 0 || demand.length > 0;

  const coreShown = stackExpanded ? core : core.slice(0, STACK_CAP);
  const toolsShown = stackExpanded ? tools : tools.slice(0, STACK_CAP);
  const stackHidden = core.length - coreShown.length + (tools.length - toolsShown.length);

  return (
    <div className="search-stats">
      {/* Key numbers — always visible */}
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

      {/* Detailed analysis — collapsible on mobile, always open on desktop */}
      <div className={`search-stats-detail${detailsOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="search-stats-toggle"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((o) => !o)}
        >
          <span className="search-stats-toggle-label">
            <i className="bi bi-bar-chart-line" />
            Анализ на търсенето
          </span>
          <i className="bi bi-chevron-down search-stats-chevron" />
        </button>

        <div className="search-stats-detail-body">
          <ul className="search-stats-points">
            <li>
              <strong>{stats.in_period}</strong> {isRemote ? 'remote ' : ''}обяви
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
              {' '}от <strong>{period}</strong>
              {multiCat ? ' (без дублиращите се между разделите)' : ''}.
            </li>

            {stats.from_core_stack != null && (
              <li>
                <strong>{stats.from_core_stack}</strong> от тях съвпадат с главния ти стек
                {stats.primary_stack && stats.primary_stack.length > 0 && (
                  <> ({stats.primary_stack.join(', ')})</>
                )}
                .
              </li>
            )}

            {stats.evaluated != null && (
              <li>
                {capped ? (
                  <>
                    От тях оценихме в детайл най-подходящите <strong>{stats.evaluated}</strong>.
                  </>
                ) : (
                  <>
                    Оценихме в детайл всичките <strong>{stats.evaluated}</strong> от тях.
                  </>
                )}
              </li>
            )}

            <li>
              <strong>{stats.matched}</strong> {matchWord} над прага от <strong>{stats.threshold}%</strong>
              {stats.below_threshold > 0 && (
                <> — останалите {stats.below_threshold} не го достигнаха</>
              )}
              .
            </li>
          </ul>

          {(hasStack || hasDemand) && (
            <div className="stack-vs-demand">
              {hasStack && (
                <ul className="stack-legend">
                  <li className="stack-legend-heading">
                    <i className="bi bi-person-badge" />
                    Твоят стек
                  </li>
                  {core.length > 0 && (
                    <li>
                      <i className="bi bi-code-slash" />
                      <span className="stack-legend-label">Езици и фреймуорци:</span>
                      <span className="stack-legend-items">{coreShown.join(', ')}</span>
                    </li>
                  )}
                  {tools.length > 0 && (
                    <li>
                      <i className="bi bi-tools" />
                      <span className="stack-legend-label">Инструменти:</span>
                      <span className="stack-legend-items">{toolsShown.join(', ')}</span>
                    </li>
                  )}
                  {(stackHidden > 0 || stackExpanded) && (
                    <li>
                      <button
                        type="button"
                        className="stack-legend-more"
                        onClick={() => setStackExpanded((v) => !v)}
                      >
                        {stackExpanded ? 'Скрий' : `+${stackHidden} още`}
                      </button>
                    </li>
                  )}
                </ul>
              )}

              {hasDemand && (
                <div className="tech-demand">
                  <div className="tech-demand-title">
                    <i className="bi bi-bar-chart-line me-1" />
                    Най-търсени в обявите
                  </div>

                  {demandGroups.length > 0 ? (
                    <div className="tech-demand-groups">
                      {demandGroups.map((g) => (
                        <div key={g.key} className={`tech-demand-group tdg-${g.key}`}>
                          <div className="tech-demand-group-label">
                            <i className={`bi ${GROUP_ICON[g.key] ?? 'bi-tag'}`} />
                            {g.label}
                          </div>
                          <div className="tech-demand-list">
                            {g.items.map((d, i) => (
                              <span key={i} className="tech-demand-item">
                                {d.tech}
                                <span className="tech-demand-count">{d.count}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tech-demand-list">
                      {demand.map((d, i) => (
                        <span key={i} className="tech-demand-item">
                          {d.tech}
                          <span className="tech-demand-count">{d.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

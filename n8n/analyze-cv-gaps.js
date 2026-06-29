// Deterministic CV "market gap" analysis: aggregates the skills that show up as MISSING
// across the candidate's relevant (already-scored) jobs, so we can tell them which skills
// would unlock the most opportunities. No LLM — pure aggregation of data we already have.
const jobs = $input.first().json.jobs || [];                    // passthrough from Aggregate
const scored = $('Build Scoring Input').first().json.scored || [];
const cv = $('Build dev.bg Target URL').first().json.cv_profile || {};

const ALIASES = {'js':'javascript','ts':'typescript','postgres':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','csharp':'c#','golang':'go','reactjs':'react','react.js':'react','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net'};
function norm(s){ const t = (s||'').toLowerCase().trim(); return ALIASES[t] || t; }

// skills the candidate already has (exclude from gaps)
const cvTech = new Set([...(cv.skills||[]), ...(cv.programming_languages||[]), ...(cv.frameworks||[]), ...(cv.tools||[])].map(norm));
// ubiquitous / non-tech things that aren't worth recommending
const FOUNDATIONAL = new Set(['git','github','gitlab','bitbucket','agile','scrum','kanban','jira','confluence','rest','rest apis','soap'].map(norm));
const HUMAN_LANGS = new Set(['english','bulgarian','german','french','spanish','russian','italian','dutch','polish','romanian','greek','turkish','ukrainian'].map(norm));

// Aggregate the skills the candidate is missing across all relevant scored jobs.
const agg = {}; // norm -> { label, count, best }
for (const s of scored){
  for (const raw of (s.missing_skills || [])){
    const label = String(raw).split(' (')[0].trim();
    const n = norm(label);
    if (!n || cvTech.has(n) || FOUNDATIONAL.has(n) || HUMAN_LANGS.has(n)) continue;
    if (!agg[n]) agg[n] = { label, count: 0, best: 0 };
    agg[n].count++;
    agg[n].best = Math.max(agg[n].best, s.score || 0);
  }
}
const all = Object.values(agg)
  .map(g => ({ skill: g.label, jobs_count: g.count, best_score: g.best }))
  .sort((a, b) => b.jobs_count - a.jobs_count || b.best_score - a.best_score);

// Recommend skills wanted by 2+ jobs (a real market signal — one job's niche stack is noise).
// If the pool is too scattered for any skill to repeat, fall back to the strongest few.
let market_gaps = all.filter(g => g.jobs_count >= 2);
if (market_gaps.length === 0) market_gaps = all.slice(0, 3);
market_gaps = market_gaps.slice(0, 5);

return [{ json: { jobs, market_gaps } }];

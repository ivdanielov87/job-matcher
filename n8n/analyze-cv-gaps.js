// Deterministic CV "market gap" analysis: aggregates the skills that show up as MISSING
// across the candidate's relevant (already-scored) jobs, so we can tell them which skills
// would unlock the most opportunities. No LLM — pure aggregation of data we already have.
const jobs = $input.first().json.jobs || [];                    // passthrough from Aggregate
const scored = $('Build Scoring Input').first().json.scored || [];
const cv = $('Build dev.bg Target URL').first().json.cv_profile || {};

const ALIASES = {'js':'javascript','ts':'typescript','postgres':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','csharp':'c#','golang':'go','reactjs':'react','react.js':'react','nextjs':'next.js','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','tailwind css':'tailwindcss','tailwind':'tailwindcss'};
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

// ---- Funnel statistics (transparency for the user) -----------------------
// The full funnel, widest to narrowest:
//   total_listings : ALL remote listings in the category(ies) on dev.bg (any date)
//   in_period      : those within the selected days_back window (the date-filtered pool)
//   evaluated      : jobs that passed the keyword pre-filter and got scored
//   matched        : jobs we actually show (score >= adaptive threshold)
//   below_threshold: of the EVALUATED jobs, how many fell below the threshold
const evaluated = jobs.length;
const strong = jobs.filter(j => (j.score || 0) >= 40).length;
// Adaptive show-threshold: only relax to 30% when the candidate has few strong hits.
const threshold = strong >= 4 ? 40 : 30;
const matched = jobs.filter(j => (j.score || 0) >= threshold).length;
const below_30 = jobs.filter(j => (j.score || 0) < 30).length;

// in_period = date-filtered pool (Assign Job URLs). Fallback to evaluated count.
let in_period = evaluated;
const periodPool = (((($('Assign Job URLs').first() || {}).json) || {}).output || {}).jobs;
if (Array.isArray(periodPool)) in_period = periodPool.length;

// total_listings = everything scraped from dev.bg before the date filter.
let total_listings = in_period;
const allPool = (((($('Parse & Merge Categories').first() || {}).json) || {}).output || {}).jobs;
if (Array.isArray(allPool)) total_listings = allPool.length;

const below_threshold = Math.max(0, evaluated - matched);
const role = cv.job_type || '';
const period_days = ($('Normalize Input').first().json.days_back) || 0;
const location = ($('Build dev.bg Target URL').first().json.location) || '';

// One pass over the in-period listings for two things:
//   from_core_stack : how many share >=1 of the candidate's MAIN stack (the defining techs we rank on)
//   tech_demand     : how many listings request each technology (from the icons) — market view
// MAIN mirrors the Keyword Pre-Score definition: the LLM-picked primary_stack (minus markup), with a
// fallback to professionally-used languages + frameworks for older profiles. Markup/styling is excluded
// so "in your stack" honestly means a real language/framework match — not just HTML/CSS.
const MARKUP = new Set(['html', 'css', 'scss', 'sass', 'less', 'tailwindcss', 'bootstrap', 'jquery'].map(norm));
let mainList = (cv.primary_stack || []).map(norm).filter(Boolean).filter(t => !MARKUP.has(t));
if (mainList.length === 0) {
  mainList = [...(cv.primary_languages || []), ...(cv.frameworks || [])].map(norm).filter(Boolean).filter(t => !MARKUP.has(t));
}
const coreStack = new Set(mainList);
let from_core_stack = 0;
const demandMap = {}; // norm -> { tech, count }
const periodJobs = (((($('Assign Job URLs').first() || {}).json) || {}).output || {}).jobs;
if (Array.isArray(periodJobs)) {
  for (const j of periodJobs) {
    const seen = new Set();
    let inStack = false;
    for (const raw of String(j.description || '').replace('Tech stack:', '').split(',')) {
      const label = String(raw).trim();
      const n = norm(label);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      if (coreStack.has(n)) inStack = true;
      if (FOUNDATIONAL.has(n) || HUMAN_LANGS.has(n)) continue;
      if (!demandMap[n]) demandMap[n] = { tech: label, count: 0 };
      demandMap[n].count++;
    }
    if (inStack) from_core_stack++;
  }
}
const tech_demand = Object.values(demandMap).sort((a, b) => b.count - a.count).slice(0, 8);

// Structured market view: group the demanded techs by type so the UI can show MORE of the core
// ones (languages/frameworks) while keeping tools compact. Markup (html/css/…) is omitted here —
// near-universal, low signal, and already de-emphasised elsewhere.
const DEMAND_LANGS = new Set(['java','kotlin','javascript','typescript','python','c#','c++','c','go','ruby','php','scala','rust','swift','objective-c','sql','r','dart','perl','groovy','elixir','clojure','bash','powershell','plsql','pl/sql','vb.net','assembly','haskell','lua','matlab','solidity','f#','abap','cobol','shell'].map(norm));
const DEMAND_FRAMEWORKS = new Set(['react','angular','angularjs','vue.js','node.js','next.js','nuxt.js','nuxt','svelte','sveltekit','express','express.js','nestjs','nest.js','spring','spring boot','spring mvc','spring webflux','.net','asp.net','.net core','django','flask','fastapi','laravel','symfony','ruby on rails','rails','rxjs','jquery','tailwindcss','bootstrap','react native','flutter','hibernate','jpa','spring data','entity framework','quarkus','micronaut','gin','fiber','phoenix','ktor','blazor','electron','redux','material ui','materialui','remix','astro','apollo client'].map(norm));
const DEMAND_DATABASES = new Set(['postgresql','mysql','mongodb','redis','oracle','sql server','ms sql','mssql','mariadb','dynamodb','amazon dynamodb','elasticsearch','cassandra','sqlite','neo4j','couchbase','cosmos db','firestore','influxdb','snowflake','bigquery','nosql'].map(norm));
const DEMAND_CLOUD = new Set(['aws','azure','gcp','google cloud','google cloud platform','docker','kubernetes','terraform','jenkins','ansible','github actions','gitlab ci','helm','prometheus','grafana','serverless','openshift','circleci','azure devops','cloudformation','pulumi','nginx','linux','unix','linux/unix','ci/cd','datadog','argocd','istio','aws lambda','lambda'].map(norm));
const DEMAND_MARKUP = new Set(['html','css','scss','sass','less'].map(norm));

function demandGroupOf(n) {
  if (DEMAND_MARKUP.has(n)) return null;      // skip markup entirely
  if (DEMAND_LANGS.has(n)) return 'languages';
  if (DEMAND_FRAMEWORKS.has(n)) return 'frameworks';
  if (DEMAND_DATABASES.has(n)) return 'databases';
  if (DEMAND_CLOUD.has(n)) return 'cloud';
  return 'tools';                             // catch-all
}
const GROUP_META = [
  { key: 'languages',  label: 'Езици',          limit: 5 },
  { key: 'frameworks', label: 'Фреймуорци',     limit: 5 },
  { key: 'databases',  label: 'Бази данни',     limit: 3 },
  { key: 'cloud',      label: 'Cloud & DevOps', limit: 3 },
  { key: 'tools',      label: 'Инструменти',    limit: 3 }
];
const groupBuckets = {};
for (const [n, v] of Object.entries(demandMap)) {
  const g = demandGroupOf(n);
  if (!g) continue;
  (groupBuckets[g] = groupBuckets[g] || []).push({ tech: v.tech, count: v.count });
}
const tech_demand_groups = GROUP_META
  .filter(m => groupBuckets[m.key] && groupBuckets[m.key].length)
  .map(m => ({
    key: m.key,
    label: m.label,
    items: groupBuckets[m.key].sort((a, b) => b.count - a.count).slice(0, m.limit)
  }));

// The candidate's stack, surfaced for transparency (so the user sees what we match against).
const stack_core = [...(cv.programming_languages || []), ...(cv.frameworks || [])];
const stack_tools = [...(cv.tools || [])];

// Categories actually searched (a role like Fullstack spans several dev.bg sections).
// Primary (job_type) first, then the rest in scrape order — so the UI can say
// "за Fullstack, Backend и Frontend" honestly.
let categories = role ? [role] : [];
try {
  const built = $('Build dev.bg Target URL').all().map(i => i.json.category).filter(Boolean);
  const distinct = [...new Set(built)];
  categories = role
    ? [role, ...distinct.filter(c => c !== role)]
    : distinct;
} catch (e) { /* keep [role] */ }

// The candidate's MAIN stack (what we actually rank/match on), surfaced for transparency.
const primary_stack = [...(cv.primary_stack || [])];

const stats = {
  total_listings, in_period, from_core_stack, evaluated, matched,
  below_threshold, below_30, threshold, role, categories, period_days, location,
  stack_core, stack_tools, primary_stack, tech_demand, tech_demand_groups,
  // legacy alias kept so older clients don't break
  found: in_period
};

return [{ json: { jobs, market_gaps, stats } }];

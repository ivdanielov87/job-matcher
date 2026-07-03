// Relevance pre-filter: rank every in-period listing by how its tech-tag set ("icons") overlaps
// the candidate's stack, then keep the best matches for the expensive AI analysis. Ranking is
// TWO-LEVEL: first by the number of MAIN matches (the candidate's defining stack — primary_stack:
// the 3-5 languages/frameworks/tools they actually build with), then by SECONDARY matches
// (everything else they know, incl. markup/styling and tools) as a tie-breaker, then by date.
// A job needs at least ONE MAIN match to be evaluated at all — sharing only HTML/CSS or a tool
// (e.g. Git, MySQL) is NOT enough. We DON'T pad to 15 with near-irrelevant listings; if the MAIN
// matches are thin we top up to a small floor with the best secondary-only jobs, no further.
// Role-agnostic — a dev matches on languages/frameworks, a QA on its testing frameworks/tools.
const item = $input.first();
const jobs = item.json.output?.jobs || [];
const cv = $('Build dev.bg Target URL').first().json.cv_profile || {};

const ALIASES = {'js':'javascript','ts':'typescript','postgres':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','golang':'go','reactjs':'react','react.js':'react','nextjs':'next.js','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','.net core':'.net','spring framework':'spring','springboot':'spring boot','tailwind css':'tailwindcss','tailwind':'tailwindcss','scss/sass':'scss'};
const norm = s => { const t = (s || '').toLowerCase().trim(); return ALIASES[t] || t; };

// Markup / styling / ubiquitous UI tech — never counts as MAIN, only as a secondary tie-breaker.
// (A candidate's real coding direction is defined by languages/frameworks, not by HTML/CSS.)
const MARKUP = new Set(['html', 'css', 'scss', 'sass', 'less', 'tailwindcss', 'bootstrap', 'jquery'].map(norm));

// MAIN = the candidate's defining stack (LLM-picked primary_stack), minus any markup that slipped in.
// Fallback for older/cached profiles without primary_stack: professionally-used languages + frameworks.
let mainList = (cv.primary_stack || []).map(norm).filter(Boolean).filter(t => !MARKUP.has(t));
if (mainList.length === 0) {
  mainList = [...(cv.primary_languages || []), ...(cv.frameworks || [])].map(norm).filter(Boolean).filter(t => !MARKUP.has(t));
}
const mainSet = new Set(mainList);

// SECONDARY = everything else the candidate has (other languages/frameworks, tools, skills, and the
// demoted markup). Used ONLY as a tie-breaker between jobs that already share a MAIN tech.
const secondarySet = new Set([
  ...(cv.programming_languages || []),
  ...(cv.frameworks || []),
  ...(cv.tools || []),
  ...(cv.skills || [])
].map(norm).filter(Boolean).filter(t => !mainSet.has(t)));

// Non-discriminating tags: present on almost every listing, so they don't indicate fit.
const IGNORE = new Set([
  'git', 'github', 'gitlab', 'bitbucket', 'svn',
  'agile', 'scrum', 'kanban', 'jira', 'confluence',
  'english', 'bulgarian', 'german', 'french', 'spanish', 'russian', 'italian',
  'dutch', 'portuguese', 'polish', 'romanian', 'greek', 'turkish', 'ukrainian'
].map(norm));

function tagsOf(job) {
  if (Array.isArray(job.tech_tags) && job.tech_tags.length) return job.tech_tags;
  return String(job.description || '').replace('Tech stack:', '').split(',');
}
// Count DISTINCT shared technologies, split by tier: MAIN (defining stack) and SECONDARY (the rest).
function tiers(job) {
  let main = 0, sec = 0;
  const seen = new Set();
  for (const raw of tagsOf(job)) {
    const t = norm(String(raw).trim());
    if (!t || seen.has(t) || IGNORE.has(t)) continue;
    seen.add(t);
    if (mainSet.has(t)) main++;
    else if (secondarySet.has(t)) sec++;
  }
  return { main, sec };
}

const MAX_JOBS = 15;   // hard ceiling sent to the scorer
const MIN_JOBS = 6;    // if MAIN matches are thinner than this, top up with secondary-only up to here

// Two-level ranking: more MAIN matches always wins; SECONDARY breaks ties; then original order (date).
// So a job sharing 2 of the candidate's defining techs always ranks above one sharing only 1.
const ranked = jobs
  .map((job, i) => { const t = tiers(job); return { job, i, main: t.main, sec: t.sec }; })
  .sort((a, b) => b.main - a.main || b.sec - a.sec || a.i - b.i);

// Primary pool: jobs sharing >=1 MAIN tech — the real matches. Take up to MAX_JOBS.
let keptR = ranked.filter(r => r.main > 0).slice(0, MAX_JOBS);

// If MAIN matches are too thin, top up ONLY up to MIN_JOBS (never to MAX_JOBS) with the best
// secondary-only jobs — so we never pad the full list with near-irrelevant listings.
if (keptR.length < MIN_JOBS) {
  const secOnly = ranked.filter(r => r.main === 0 && r.sec > 0);
  keptR = keptR.concat(secOnly.slice(0, MIN_JOBS - keptR.length));
}

let kept = keptR.map(r => r.job);
// Safety net: sparse/odd tagging left nothing overlapping → never return empty, keep most-recent.
if (kept.length === 0) kept = jobs.slice(0, MAX_JOBS);

return [{ json: { output: { jobs: kept } } }];

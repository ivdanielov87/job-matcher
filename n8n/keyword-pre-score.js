// Relevance pre-filter: rank every in-period listing by how its tech-tag set ("icons") overlaps
// the candidate's stack, then keep the best MAX_JOBS for the expensive AI analysis. Ranking is
// TWO-LEVEL: first by the number of CORE matches (the candidate's languages + frameworks), then
// by AUX matches (tools) as a tie-breaker, then by date. So a job sharing more of the candidate's
// core stack always ranks above one sharing fewer, regardless of incidental tool overlap.
// Role-agnostic — a dev matches on languages/frameworks, a QA on its testing frameworks/tools.
// Ubiquitous tags (version control, Agile ceremonies, human languages) are ignored. We pick the
// 15 best-matching jobs — not the 15 most recent — so the strongest matches reach the scorer.
const item = $input.first();
const jobs = item.json.output?.jobs || [];
const cv = $('Build dev.bg Target URL').first().json.cv_profile || {};

const ALIASES = {'js':'javascript','ts':'typescript','postgres':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','golang':'go','reactjs':'react','react.js':'react','nextjs':'next.js','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','.net core':'.net','spring framework':'spring','springboot':'spring boot'};
const norm = s => { const t = (s || '').toLowerCase().trim(); return ALIASES[t] || t; };

// Candidate's stack, split into two tiers so a match on the CORE stack (the languages and
// frameworks they actually build with) ranks a job higher than a match on a peripheral tool.
// Role-agnostic: a QA's testing frameworks land in CORE, their tools in AUX — both still count.
const coreSet = new Set([
  ...(cv.programming_languages || []),
  ...(cv.frameworks || [])
].map(norm).filter(Boolean));
const auxSet = new Set([
  ...(cv.tools || []),
  ...(cv.skills || [])
].map(norm).filter(Boolean));

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
// Count DISTINCT shared technologies, split by tier: CORE (languages/frameworks) and AUX (tools).
function tiers(job) {
  let core = 0, aux = 0;
  const seen = new Set();
  for (const raw of tagsOf(job)) {
    const t = norm(String(raw).trim());
    if (!t || seen.has(t) || IGNORE.has(t)) continue;
    seen.add(t);
    if (coreSet.has(t)) core++;
    else if (auxSet.has(t)) aux++;
  }
  return { core, aux };
}

const MAX_JOBS = 15;
// Two-level ranking: more CORE (language/framework) matches always wins; AUX (tool) matches
// break ties; then date. So a job sharing 2 of the candidate's core techs always ranks above
// one sharing only 1 — no matter how many incidental tools the latter shares.
const ranked = jobs
  .map((job, i) => { const t = tiers(job); return { job, i, core: t.core, aux: t.aux }; })
  .sort((a, b) => b.core - a.core || b.aux - a.aux || a.i - b.i);

let kept = ranked.filter(r => r.core > 0 || r.aux > 0).map(r => r.job);
// Safety net: sparse/odd tagging left nothing overlapping → never return empty, keep recent.
if (kept.length === 0) kept = jobs;
kept = kept.slice(0, MAX_JOBS);

return [{ json: { output: { jobs: kept } } }];

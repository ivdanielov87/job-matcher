// Language-first pre-filter: only fetch + AI-analyse listings that share a PROGRAMMING
// LANGUAGE or FRAMEWORK with the candidate. Shared infra/tools (Docker, SQL, AWS, Git,
// Linux) does NOT qualify a job — those are ubiquitous and not decisive. This keeps the
// expensive DeepSeek calls focused on listings in the candidate's actual stack.
const item = $input.first();
const jobs = item.json.output?.jobs || [];
const cv = $('Build dev.bg Target URL').first().json.cv_profile || {};

const ALIASES = {'js':'javascript','ts':'typescript','postgres':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','golang':'go','reactjs':'react','react.js':'react','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','.net core':'.net','spring framework':'spring','springboot':'spring boot'};
const norm = s => { const t = (s || '').toLowerCase().trim(); return ALIASES[t] || t; };

// Decisive set = candidate's languages + frameworks (NOT skills/tools/databases).
const core = new Set([...(cv.programming_languages || []), ...(cv.frameworks || [])].map(norm));

// Per-language ecosystem boosters: a tag that strongly implies one of the candidate's
// languages also qualifies a job (handles dev.bg's inconsistent tagging, e.g. a Java job
// tagged only "Maven/Hibernate"). Deliberately NO frontend expansion for JS/TS so a
// backend candidate is not pulled into React/Angular-only roles.
const ECOSYSTEM = {
  'java':   ['spring','spring boot','spring data','spring webflux','hibernate','jpa','maven','gradle','quarkus','micronaut','junit'],
  'kotlin': ['spring','spring boot','ktor','gradle','maven'],
  'python': ['django','flask','fastapi','pandas','numpy','pytest','poetry'],
  'c#':     ['.net','asp.net','asp.net core','blazor','entity framework'],
  'php':    ['laravel','symfony','yii'],
  'go':     ['gin','echo','fiber'],
  'ruby':   ['rails','ruby on rails']
};
for (const lang of [...core]) { (ECOSYSTEM[lang] || []).forEach(x => core.add(norm(x))); }

function tagsOf(job){
  if (Array.isArray(job.tech_tags) && job.tech_tags.length) return job.tech_tags;
  return String(job.description || '').replace('Tech stack:', '').split(',');
}
function langMatch(job){
  for (const raw of tagsOf(job)) { if (core.has(norm(String(raw).trim()))) return true; }
  return false;
}
// secondary signal for the safety fallback: any tag overlap with the full CV stack
const cvAll = new Set([...(cv.skills||[]), ...(cv.programming_languages||[]), ...(cv.frameworks||[]), ...(cv.tools||[])].map(norm));
function anyOverlap(job){
  for (const raw of tagsOf(job)) { if (cvAll.has(norm(String(raw).trim()))) return true; }
  return false;
}

const MAX_JOBS = 15;
let kept = jobs.filter(langMatch);
// Safety net: if dev.bg's tagging is too sparse and almost nothing matches by language,
// fall back to the looser "any stack overlap" filter so we never return an empty result.
if (kept.length < 2) kept = jobs.filter(anyOverlap);
if (kept.length === 0) kept = jobs;
kept = kept.slice(0, MAX_JOBS);

return [{ json: { output: { jobs: kept } } }];

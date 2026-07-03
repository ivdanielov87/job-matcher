const jobs = $('Prepare Batch Input').first().json.jobs || [];
const cv = $('Prepare Batch Input').first().json.cv_profile;
const requirements = $input.first().json.output.requirements || [];

const cvAllTech = [...(cv.skills||[]), ...(cv.programming_languages||[]), ...(cv.frameworks||[]), ...(cv.tools||[])];
const cvAllTechLower = cvAllTech.map(s => s.toLowerCase().trim());
const hasTech = (n) => cvAllTechLower.some(t => t.includes(n));

const years = cv.years_of_experience || 0;
const level = (cv.experience_level || '').toLowerCase();
const jobType = (cv.job_type || '').toLowerCase();
const isMidPlus = ['mid','senior','lead'].includes(level) || years >= 3;
const hasAnyDb = ['postgresql','postgres','mysql','mariadb','oracle','sql server','mssql','sqlite','rds'].some(db => hasTech(db));

const IMPLIED = [
  { s: 'Git',    w: () => isMidPlus },
  { s: 'GitHub', w: () => isMidPlus },
  { s: 'Maven',  w: () => hasTech('spring') },
  { s: 'SQL',    w: () => ['backend','fullstack','full-stack','data'].includes(jobType) || hasAnyDb }
];
const impliedSkills = [];
for (const r of IMPLIED) { if (r.w() && !cvAllTechLower.includes(r.s.toLowerCase())) impliedSkills.push(r.s); }

const LINEAGE = [
  { w: () => hasTech('typescript') || hasTech('node'), a: 'JavaScript', src: () => hasTech('typescript') ? 'TypeScript' : 'Node.js' },
  { w: () => hasTech('scss') || hasTech('sass'),       a: 'CSS',        src: () => hasTech('scss') ? 'SCSS' : 'SASS' },
  { w: () => hasTech('spring'),                        a: 'Spring',     src: () => 'Spring' }
];
const lineageSkills = [];
const derivedFrom = {};
for (const r of LINEAGE) { const al = r.a.toLowerCase(); if (r.w() && !cvAllTechLower.includes(al) && !lineageSkills.map(x=>x.toLowerCase()).includes(al)) { lineageSkills.push(r.a); derivedFrom[al] = r.src(); } }

const candidateSkills = [...cvAllTech, ...impliedSkills, ...lineageSkills];

const AWS_SERVICES = ['ec2','rds','s3','lambda','ecs','eks','dynamodb','cloudwatch','codedeploy','cloudformation','sqs','sns','cloudfront','elasticache','redshift','kinesis','fargate','opensearch'];
const CLOUD = [
  { term: 'AWS',   prov: 'aws',   svc: AWS_SERVICES },
  { term: 'Azure', prov: 'azure', svc: [] },
  { term: 'GCP',   prov: 'gcp',   svc: ['google cloud','bigquery','gke'] }
];
for (const c of CLOUD) {
  if (cvAllTechLower.includes(c.term.toLowerCase())) continue;
  const has = candidateSkills.some(s => {
    const sl = s.toLowerCase().trim();
    return sl === c.prov || sl.includes(c.prov) || c.svc.includes(sl);
  });
  if (has) candidateSkills.push(c.term);
}

const spokenLangs = cv.spoken_languages || [];

const ALIASES = {'js':'javascript','ecmascript':'javascript','ts':'typescript','postgres':'postgresql','postgre':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','csharp':'c#','golang':'go','reactjs':'react','react.js':'react','nextjs':'next.js','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','.net core':'.net','.net 8':'.net','.net framework':'.net','rest':'rest apis','rest api':'rest apis','restful apis':'rest apis','restful api':'rest apis','tailwind css':'tailwindcss','tailwind':'tailwindcss'};
function norm(s){ const t = (s||'').toLowerCase().trim(); return ALIASES[t] || t; }
const candidateNorm = candidateSkills.map(norm);
const candidateSet = new Set(candidateNorm);
function langCovered(jobLang){ const jl = norm(jobLang); return spokenLangs.some(sl => norm(sl).includes(jl)); }

const primarySet = new Set((cv.primary_languages || []).map(norm));
const SECONDARY_LANG_CREDIT = 0.4;

function skillBase(s){ return norm(String(s).split(' (')[0]); }
function dedupSkills(arr){
  const byBase = new Map();
  for (const s of arr){
    const str = String(s);
    const annotated = str.includes(' (');
    const base = skillBase(str);
    if (!byBase.has(base)) { byBase.set(base, s); }
    else { const ex = String(byBase.get(base)); if (ex.includes(' (') && !annotated) byBase.set(base, s); }
  }
  return [...byBase.values()];
}

const FOUNDATIONAL = new Set(['git','github','gitlab','bitbucket','agile','scrum','kanban','jira','confluence'].map(norm));
const HUMAN_LANGS = new Set(['english','bulgarian','german','french','spanish','russian','italian','dutch','portuguese','polish','romanian','greek','turkish','ukrainian','czech','hungarian','croatian','serbian','arabic','chinese','japanese'].map(norm));
const LANGUAGES = new Set(['java','kotlin','go','python','c#','javascript','typescript','php','ruby','c++','c','rust','scala','swift','objective-c','perl','dart','elixir','clojure','groovy','f#','vb.net','lua','haskell','julia'].map(norm));
const FRONTEND_FRAMEWORKS = new Set(['react','angular','angularjs','vue.js','svelte','next.js','nuxt'].map(norm));
const isFrontendCandidate = ['frontend','fullstack','full-stack'].includes(jobType);
const techWeight = (t) => {
  const n = norm(t);
  if (LANGUAGES.has(n)) return 3;
  if (isFrontendCandidate && FRONTEND_FRAMEWORKS.has(n)) return 2;
  return 1;
};

const MAIN_DISPLAY = {'java':'Java','kotlin':'Kotlin','go':'Go','python':'Python','c#':'C#','javascript':'JavaScript','typescript':'TypeScript','php':'PHP','ruby':'Ruby','c++':'C++','rust':'Rust','scala':'Scala','swift':'Swift','.net':'.NET','node.js':'Node.js','react':'React','angular':'Angular','vue.js':'Vue.js','spring':'Spring','django':'Django','laravel':'Laravel','blazor':'Blazor','dart':'Dart','elixir':'Elixir'};
const MAIN_KNOWN = new Set(Object.keys(MAIN_DISPLAY));
const MAIN_LANG_SET = new Set(['java','kotlin','go','python','c#','javascript','typescript','php','ruby','c++','rust','scala','swift','.net','dart','elixir']);
const FRONTEND_FW = new Set(['react','angular','vue.js','svelte'].map(norm));
const BACKEND_MS = new Set(['java','kotlin','go','python','c#','php','ruby','rust','scala','.net','node.js','elixir','c++'].map(norm));
function detectMainStack(title, description){
  const titleTokens = []; const tseen = new Set();
  for (const tok of String(title || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean)){
    const n = norm(tok); if (MAIN_KNOWN.has(n) && !tseen.has(n)){ tseen.add(n); titleTokens.push(n); }
  }
  const tLower = String(title || '').toLowerCase();
  const roleFull  = /full[ \-]?stack/.test(tLower);
  const roleFront = /front[ \-]?end/.test(tLower);
  const roleBack  = /back[ \-]?end/.test(tLower);
  const iconTags = String(description || '').replace('Tech stack:', '').split(',').map(s => norm(s.trim())).filter(Boolean);
  const pick = (set) => {
    const fromTitle = titleTokens.find(t => set.has(t));
    if (fromTitle) return fromTitle;
    const inIcons = iconTags.filter(t => set.has(t));
    return inIcons.length === 1 ? inIcons[0] : null;
  };
  const backend = pick(BACKEND_MS);
  const frontend = pick(FRONTEND_FW);
  let out;
  if (roleFront)               out = [frontend || backend];
  else if (roleBack)           out = [backend];
  else if (roleFull)           out = [backend, frontend];
  else if (titleTokens.length) out = titleTokens.slice(0, 2);
  else                         out = [backend, frontend];
  const seen = new Set(); const res = [];
  for (const t of out){ if (t && !seen.has(t)){ seen.add(t); res.push(t); } }
  return res.slice(0, 2);
}

const COMPARABLE_PAIRS = [
  ['Angular','React','Vue.js'],
  ['Angular','AngularJS'],
  ['Express','NestJS','Koa','Fastify'],
  ['Django','FastAPI','Flask'],
  ['Spring Boot','Quarkus','Micronaut'],
  ['PostgreSQL','MySQL','MariaDB','Oracle','SQL Server','SQL'],
  ['Hibernate','JPA','Spring Data'],
  ['SCSS','SASS','Less'],
  ['Jest','Mocha','Jasmine','Vitest'],
  ['Cypress','Playwright','Selenium','WebdriverIO']
];
const ALWAYS_COMPARABLE = new Set(['PostgreSQL','MySQL','MariaDB','Oracle','SQL Server','SQL','AngularJS'].map(norm));
const VERSION_LINEAGE = [['angular','angularjs']];
function isLineage(a, b){ return VERSION_LINEAGE.some(p => p.includes(a) && p.includes(b) && a !== b); }
function findComparable(reqTech, allowedNorm){
  const rn = norm(reqTech);
  if (!ALWAYS_COMPARABLE.has(rn) && !allowedNorm.includes(rn)) return null;
  for (const pair of COMPARABLE_PAIRS){
    const pl = pair.map(norm);
    if (!pl.includes(rn)) continue;
    for (let i=0;i<pair.length;i++){
      if (pl[i]===rn) continue;
      if (candidateSet.has(pl[i])){
        const idx = candidateNorm.indexOf(pl[i]);
        const cvTech = idx!==-1 ? candidateSkills[idx] : pair[i];
        if (isLineage(rn, pl[i])) return `${reqTech} (имаш познания от ${cvTech})`;
        return `${cvTech} (алтернатива на ${reqTech})`;
      }
    }
  }
  return null;
}

function levelRank(s){
  const t = ' ' + (s||'').toLowerCase() + ' ';
  if (t.includes('lead')||t.includes('principal')||t.includes('staff')||t.includes('chief')||t.includes('architect')||t.includes('head of')) return 4;
  if (t.includes('senior')||t.includes('sr.')||t.includes('sr ')) return 3;
  if (t.includes('middle')||t.includes('mid-')||t.includes('mid ')||t.includes('intermediate')||t.includes('regular')) return 2;
  if (t.includes('junior')||t.includes('jr.')||t.includes('jr ')||t.includes('entry')||t.includes('graduate')||t.includes('trainee')||t.includes('intern')) return 1;
  return 0;
}
// Candidate seniority = level implied by TOTAL years (bands: <2 Junior, 2-5 Mid, 5-10 Senior, 10+ Lead),
// falling back to the extractor's word if years are missing. Held titles may lift the level by AT MOST
// one step above what the years imply (and never lower it) — credits real seniority without letting an
// inflated title (e.g. "Senior" at 2 yrs) over-promote. If no title carries a seniority word, years win.
function bandRank(y){ if (y >= 10) return 4; if (y >= 5) return 3; if (y >= 2) return 2; return 1; }
const yearsRank = (cv.years_of_experience > 0) ? bandRank(cv.years_of_experience) : levelRank(cv.experience_level);
const titleRank = Math.max(0, ...(cv.job_titles || []).map(levelRank));
const candRank = titleRank > 0 ? Math.max(yearsRank, Math.min(titleRank, yearsRank + 1)) : yearsRank;
const SHOW_THRESHOLD = 30;

const scored = requirements.map((req, i) => {
  const allowedNorm = (req.accepts_alternatives_for || []).map(norm);
  const matched = [];
  const missing = [];

  function coverTech(t){
    const nt = norm(t);
    if (candidateSet.has(nt)) {
      if (LANGUAGES.has(nt) && primarySet.size > 0 && !primarySet.has(nt)) {
        const src = derivedFrom[nt];
        matched.push(src ? `${t} (имаш познания от ${src})` : `${t} (имаш познания)`);
        return SECONDARY_LANG_CREDIT;
      }
      matched.push(t);
      return 1;
    }
    const comp = findComparable(t, allowedNorm);
    if (comp) { matched.push(comp); return 0.5; }
    missing.push(t);
    return 0;
  }

  const prefTech = req.preferred_tech || [];
  const methods = req.methodologies || [];
  const langs = req.human_languages || [];

  const jobTags = String((jobs[i] || {}).description || '').replace('Tech stack:', '').split(',').map(s => s.trim()).filter(Boolean);
  const knownNorm = new Set([...(req.required_tech || []), ...prefTech].map(norm));
  const reqTech = [...(req.required_tech || [])];
  for (const tag of jobTags) {
    const tn = norm(tag);
    if (!tn || knownNorm.has(tn) || HUMAN_LANGS.has(tn)) continue;
    if ([...knownNorm].some(k => isLineage(tn, k))) continue;
    knownNorm.add(tn); reqTech.push(tag);
  }

  for (const alt of (req.accepts_alternatives_for || [])) {
    const an = norm(alt);
    if (an && !knownNorm.has(an) && candidateSet.has(an)) { knownNorm.add(an); reqTech.push(alt); }
  }

  let aCovW = 0, aTotW = 0, coreCovW = 0, coreTotW = 0;
  for (const t of reqTech){
    const w = techWeight(t);
    const c = coverTech(t);
    aCovW += c * w; aTotW += w;
    if (!FOUNDATIONAL.has(norm(t))) { coreTotW += w; coreCovW += c * w; }
  }
  const aScore = (aTotW ? aCovW/aTotW : 1) * 0.60;
  const coreCoverage = coreTotW ? coreCovW/coreTotW : 1;

  let bCov = 0; for (const t of prefTech) bCov += coverTech(t);
  const bScore = (prefTech.length ? bCov/prefTech.length : 1) * 0.10;

  const jobRank = Math.max(levelRank(req.experience_level), levelRank((jobs[i]||{}).title));
  const meetsLevel = (candRank===0 || jobRank===0 || candRank>=jobRank);
  const meetsYears = years >= (req.experience_years_min||0);
  const expMatch = meetsLevel && meetsYears;
  const expGrade = expMatch ? 1 : ((meetsLevel || meetsYears) ? 0.6 : 0.2);
  const expScore = expGrade * 0.20;

  let mlItems = 0, mlCov = 0;
  for (const m of methods){ mlItems++; if (candidateSet.has(norm(m))){ mlCov++; matched.push(m); } else missing.push(m); }
  for (const l of langs){ mlItems++; if (langCovered(l)){ mlCov++; matched.push(l); } else missing.push(l); }
  const mlScore = (mlItems ? mlCov/mlItems : 1) * 0.10;

  const mainStackNorm = detectMainStack((jobs[i] || {}).title, (jobs[i] || {}).description);
  const mainLangs = mainStackNorm.filter(m => MAIN_LANG_SET.has(m));
  const decisive = mainLangs.length ? mainLangs : mainStackNorm;
  function coverMain(m){
    if (candidateSet.has(m)){
      if (LANGUAGES.has(m) && primarySet.size > 0 && !primarySet.has(m)) return 'weak';
      return 'strong';
    }
    if (allowedNorm.includes(m)){
      if ([...primarySet].some(p => allowedNorm.includes(p))) return 'strong';
      if (allowedNorm.some(a => candidateSet.has(a))) return 'weak';
    }
    return 'none';
  }
  let mainFactor = 1;
  if (decisive.length){
    const covs = decisive.map(coverMain);
    mainFactor = covs.includes('strong') ? 1 : (covs.includes('weak') ? 0.85 : 0.55);
  }
  let main_alt = '';
  for (const m of decisive){
    if (!candidateSet.has(m) && allowedNorm.includes(m)){
      const p = [...primarySet].find(x => allowedNorm.includes(x));
      if (p){ const idx = candidateNorm.indexOf(p); const have = idx !== -1 ? candidateSkills[idx] : p; main_alt = `${have} (приема се вместо ${MAIN_DISPLAY[m] || m})`; break; }
    }
  }
  const main_stack = mainStackNorm.map(m => MAIN_DISPLAY[m] || m);

  const raw = (aScore + bScore + expScore + mlScore) * 100;
  const coreFactor = coreTotW === 0 ? 1 : Math.min(1, 0.3 + 1.4 * coreCoverage);
  let score = Math.round(raw * coreFactor * mainFactor);
  if (!expMatch) score = Math.max(0, score - 5);

  const overqualified = candRank>0 && jobRank>0 && (candRank - jobRank >= 2);
  const matchedFinal = dedupSkills(matched);
  const matchedBases = new Set(matchedFinal.map(skillBase));
  const missingFinal = dedupSkills(missing).filter(m => !matchedBases.has(skillBase(m)));
  return { job_index: i+1, score, matched_skills: matchedFinal, missing_skills: missingFinal, experience_match: expMatch, main_stack, main_alt, _overq: overqualified };
});

const toSummarize = scored.filter(s => s.score >= SHOW_THRESHOLD && !s._overq);
const summary_text = toSummarize.map(s => {
  const job = jobs[s.job_index - 1] || {};
  return 'JOB ' + s.job_index + ': ' + (job.title||'') + ' @ ' + (job.company||'') + '\n' +
    'Score: ' + s.score + '%\n' +
    'Matched: ' + (s.matched_skills.join(', ') || 'none') + '\n' +
    'Missing: ' + (s.missing_skills.join(', ') || 'none') + '\n' +
    'Experience match: ' + (s.experience_match ? 'yes' : 'no');
}).join('\n\n') + '\n\nFor EACH job above, write ONE Bulgarian sentence summarising the key technical match or gap. Return exactly ' + toSummarize.length + ' entries, each with its job_index.';

return [{ json: { summary_text, scored, jobs } }];

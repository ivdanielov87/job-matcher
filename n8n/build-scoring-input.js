const jobs = $('Prepare Batch Input').first().json.jobs || [];
const cv = $('Prepare Batch Input').first().json.cv_profile;
const requirements = $input.first().json.output.requirements || [];

// === Candidate skill set (explicit + implied + lineage) ===
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
  { w: () => hasTech('typescript') || hasTech('node'), a: 'JavaScript' },
  { w: () => hasTech('scss') || hasTech('sass'),       a: 'CSS' },
  { w: () => hasTech('spring'),                        a: 'Spring' }
];
const lineageSkills = [];
for (const r of LINEAGE) { const al = r.a.toLowerCase(); if (r.w() && !cvAllTechLower.includes(al) && !lineageSkills.map(x=>x.toLowerCase()).includes(al)) lineageSkills.push(r.a); }

const candidateSkills = [...cvAllTech, ...impliedSkills, ...lineageSkills];
const spokenLangs = cv.spoken_languages || [];

// === Normalisation (absorbs extractor variance) ===
const ALIASES = {'js':'javascript','ecmascript':'javascript','ts':'typescript','postgres':'postgresql','postgre':'postgresql','node':'node.js','nodejs':'node.js','k8s':'kubernetes','csharp':'c#','golang':'go','reactjs':'react','react.js':'react','vuejs':'vue.js','vue':'vue.js','css3':'css','html5':'html','dotnet':'.net','.net core':'.net','.net 8':'.net','.net framework':'.net','rest':'rest apis','rest api':'rest apis','restful apis':'rest apis','restful api':'rest apis'};
function norm(s){ const t = (s||'').toLowerCase().trim(); return ALIASES[t] || t; }
const candidateNorm = candidateSkills.map(norm);
const candidateSet = new Set(candidateNorm);
function langCovered(jobLang){ const jl = norm(jobLang); return spokenLangs.some(sl => norm(sl).includes(jl)); }

// Collapse duplicate skill labels (e.g. one CV skill that covers several required techs).
// Keys on the underlying CV skill (the part before the "(алтернатива на …)" annotation);
// prefers a plain label over an alternative one when both appear.
function dedupSkills(arr){
  const byBase = new Map();
  for (const s of arr){
    const str = String(s);
    const isAlt = str.includes(' (алтернатива');
    const base = norm(str.split(' (алтернатива')[0]);
    if (!byBase.has(base)) { byBase.set(base, s); }
    else { const ex = String(byBase.get(base)); if (ex.includes(' (алтернатива') && !isAlt) byBase.set(base, s); }
  }
  return [...byBase.values()];
}

// Ubiquitous skills that should NOT inflate the core-tech score
const FOUNDATIONAL = new Set(['git','github','gitlab','bitbucket','agile','scrum','kanban','jira','confluence'].map(norm));

// Programming languages weigh more — the role's language is the decisive skill
const LANGUAGES = new Set(['java','kotlin','go','python','c#','javascript','typescript','php','ruby','c++','c','rust','scala','swift','objective-c','perl','dart','elixir','clojure','groovy','f#','vb.net','lua','haskell','julia'].map(norm));
const techWeight = (t) => LANGUAGES.has(norm(t)) ? 3 : 1;

// === Comparable / interchangeable groups (kept within a single language/ecosystem) ===
const COMPARABLE_PAIRS = [
  ['Angular','React','Vue.js'],
  ['Express','NestJS','Koa','Fastify'],
  ['Django','FastAPI','Flask'],
  ['Spring Boot','Quarkus','Micronaut'],
  ['PostgreSQL','MySQL','MariaDB','Oracle','SQL Server','SQL'],
  ['Hibernate','JPA','Spring Data'],
  ['SCSS','SASS','Less'],
  ['Jest','Mocha','Jasmine','Vitest'],
  ['Cypress','Playwright','Selenium','WebdriverIO']
];
// RDBMS dialects are interchangeable regardless of whether the listing explicitly
// invites alternatives — SQL knowledge transfers across them. These bypass the
// accepts_alternatives_for gate; all other groups still require it.
const ALWAYS_COMPARABLE = new Set(['PostgreSQL','MySQL','MariaDB','Oracle','SQL Server','SQL'].map(norm));
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
const candRank = levelRank(cv.experience_level);
const SHOW_THRESHOLD = 30;

// === Deterministic scoring per job ===
const scored = requirements.map((req, i) => {
  const allowedNorm = (req.accepts_alternatives_for || []).map(norm);
  const matched = [];
  const missing = [];

  function coverTech(t){
    if (candidateSet.has(norm(t))) { matched.push(t); return 1; }
    const comp = findComparable(t, allowedNorm);
    if (comp) { matched.push(comp); return 0.5; }
    missing.push(t);
    return 0;
  }

  const reqTech = req.required_tech || [];
  const prefTech = req.preferred_tech || [];
  const methods = req.methodologies || [];
  const langs = req.human_languages || [];

  // Required tech (60%) — programming languages weighted 3x
  let aCovW = 0, aTotW = 0, coreCovW = 0, coreTotW = 0;
  for (const t of reqTech){
    const w = techWeight(t);
    const c = coverTech(t);
    aCovW += c * w; aTotW += w;
    if (!FOUNDATIONAL.has(norm(t))) { coreTotW += w; coreCovW += c * w; }
  }
  const aScore = (aTotW ? aCovW/aTotW : 1) * 0.60;
  const coreCoverage = coreTotW ? coreCovW/coreTotW : 1;

  // Preferred tech (10%)
  let bCov = 0; for (const t of prefTech) bCov += coverTech(t);
  const bScore = (prefTech.length ? bCov/prefTech.length : 1) * 0.10;

  // Experience (20%, graded)
  const jobRank = Math.max(levelRank(req.experience_level), levelRank((jobs[i]||{}).title));
  const meetsLevel = (candRank===0 || jobRank===0 || candRank>=jobRank);
  const meetsYears = years >= (req.experience_years_min||0);
  const expMatch = meetsLevel && meetsYears;
  const expGrade = expMatch ? 1 : ((meetsLevel || meetsYears) ? 0.6 : 0.2);
  const expScore = expGrade * 0.20;

  // Methodologies + languages (10%)
  let mlItems = 0, mlCov = 0;
  for (const m of methods){ mlItems++; if (candidateSet.has(norm(m))){ mlCov++; matched.push(m); } else missing.push(m); }
  for (const l of langs){ mlItems++; if (langCovered(l)){ mlCov++; matched.push(l); } else missing.push(l); }
  const mlScore = (mlItems ? mlCov/mlItems : 1) * 0.10;

  // Core-coverage multiplier
  const raw = (aScore + bScore + expScore + mlScore) * 100;
  const coreFactor = coreTotW === 0 ? 1 : Math.min(1, 0.3 + 1.4 * coreCoverage);
  const score = Math.round(raw * coreFactor);

  const overqualified = candRank>0 && jobRank>0 && (candRank - jobRank >= 2);
  return { job_index: i+1, score, matched_skills: dedupSkills(matched), missing_skills: dedupSkills(missing), experience_match: expMatch, _overq: overqualified };
});

// === Summary input — ONLY for jobs that will actually be shown (pass threshold + not overqualified) ===
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

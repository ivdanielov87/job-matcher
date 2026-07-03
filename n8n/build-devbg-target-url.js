const cvProfile = $input.first().json.output;
const prefs = $('Normalize Input').first().json;

const urlMap = {
  'Backend':  'https://dev.bg/company/jobs/back-end-development/',
  'Frontend': 'https://dev.bg/company/jobs/front-end-development/',
  'Fullstack': 'https://dev.bg/company/jobs/full-stack-development/',
  'QA':       'https://dev.bg/company/jobs/quality-assurance/',
  'Mobile':   'https://dev.bg/company/jobs/mobile/',
  'DevOps':   'https://dev.bg/company/jobs/infrastructure/',
  'Data':     'https://dev.bg/company/jobs/data-science-and-analytics/'
};

const categoryMap = {
  'Backend':  ['Backend', 'Fullstack'],
  'Frontend': ['Frontend', 'Fullstack'],
  'Fullstack': ['Backend', 'Frontend', 'Fullstack'],
  'QA':       ['QA'],
  'Mobile':   ['Mobile'],
  'DevOps':   ['DevOps'],
  'Data':     ['Data']
};

const locationMap = {
  'Remote':       'remote',
  'София':        'sofiya',
  'Пловдив':      'plovdiv',
  'Варна':        'varna',
  'Бургас':       'burgas',
  'Русе':         'ruse',
  'Стара Загора': 'stara-zagora'
};

// The extractor's job_type SHOULD be one of our canonical categories, but the LLM sometimes
// free-forms it (e.g. "Full-Stack Web Developer" instead of "Fullstack"). Normalize to a known
// category so we never build an "undefined" scrape URL (which silently returns zero jobs).
function normalizeJobType(raw){
  const t = String(raw || '').toLowerCase();
  if (/full[\s-]?stack/.test(t)) return 'Fullstack';
  if (/front[\s-]?end/.test(t)) return 'Frontend';
  if (/back[\s-]?end/.test(t)) return 'Backend';
  if (/\bqa\b|quality|tester|testing/.test(t)) return 'QA';
  if (/mobile|android|\bios\b|flutter|react native/.test(t)) return 'Mobile';
  if (/devops|\bsre\b|infrastructure|platform eng/.test(t)) return 'DevOps';
  if (/data (scien|eng|analy)|analytic|machine learning|\bml\b/.test(t)) return 'Data';
  const known = ['Backend','Frontend','Fullstack','QA','Mobile','DevOps','Data'];
  return known.find(k => k.toLowerCase() === t) || 'Backend';
}
const jobType = normalizeJobType(cvProfile?.job_type);
const categories = categoryMap[jobType] || [jobType];
const locationSlug = locationMap[prefs.location];

const cvProfileData = {
  skills:                cvProfile?.skills || [],
  programming_languages: cvProfile?.programming_languages || [],
  primary_languages:     cvProfile?.primary_languages || [],
  primary_stack:         cvProfile?.primary_stack || [],
  frameworks:            cvProfile?.frameworks || [],
  tools:                 cvProfile?.tools || [],
  spoken_languages:      cvProfile?.spoken_languages || [],
  experience_level:      cvProfile?.experience_level || 'Mid',
  job_type:              jobType,
  years_of_experience:   cvProfile?.years_of_experience || 0,
  job_titles:            cvProfile?.job_titles || []
};

// One page-1 URL per category. Pagination (fetching the remaining pages) is handled in
// "Parse & Merge Categories", which reads the real page count from each page-1 HTML.
return categories.map(cat => {
  const baseUrl = urlMap[cat];
  const scrapeUrl = locationSlug
    ? baseUrl + '?_job_location=' + encodeURIComponent(locationSlug)
    : baseUrl;
  return {
    json: {
      cv_profile:  cvProfileData,
      scrape_url:  scrapeUrl,
      category:    cat,
      location:    prefs.location,
      language:    prefs.language,
      user_email:  prefs.user_email,
      days_back:   prefs.days_back || 5
    }
  };
});

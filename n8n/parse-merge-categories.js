// Parses dev.bg listing pages into job objects AND paginates: for each category's page 1
// (received as input) it reads the real last-page number from the FacetWP pager embedded in
// the HTML, then fetches the remaining pages itself. Count-driven — no wasted requests.
// Pagination is wrapped in try/catch so a failed page (or an environment without
// this.helpers.httpRequest) degrades gracefully to whatever pages we already have.
const allItems = $input.all();
const builtUrls = $('Build dev.bg Target URL').all();
const allJobs = [];
const seenUrls = new Set();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_PAGES = 10; // hard safety cap (=200 jobs/category)

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function convertBgDate(dateStr) {
  const months = { 'яну': 1, 'фев': 2, 'мар': 3, 'апр': 4, 'май': 5, 'юни': 6, 'юли': 7, 'авг': 8, 'сеп': 9, 'окт': 10, 'ное': 11, 'дек': 12 };
  const match = dateStr.match(/(\d+)\s+(\S+)/);
  if (!match) return new Date().toISOString().split('T')[0];
  const day = parseInt(match[1]);
  const monthKey = match[2].toLowerCase().substring(0, 3);
  const month = months[monthKey] || (new Date().getMonth() + 1);
  const year = new Date().getFullYear();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseJobsFromHtml(html) {
  const jobs = [];
  const blocks = html.split('<div class="job-list-item');
  blocks.shift();
  for (const block of blocks) {
    const urlMatch = block.match(/href="(https:\/\/dev\.bg\/company\/jobads\/[^"]+)"/);
    if (!urlMatch) continue;
    const url = urlMatch[1];
    const titleMatch = block.match(/class="job-title[^"]*"[^>]*>\s*([^<]+?)\s*<\/h6>/);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';
    if (!title) continue;
    const companyMatch = block.match(/class="company-name[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/);
    const company = companyMatch ? decodeHtmlEntities(companyMatch[1].trim()) : '';
    const dateMatch = block.match(/class="date[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/);
    const dateRaw = dateMatch ? dateMatch[1].trim() : '';
    const date_posted = convertBgDate(dateRaw);
    const isRemote = /class="badge[^"]*remote[^"]*"/.test(block);
    const isHybrid = /class="badge[^"]*hybrid[^"]*"/.test(block);
    let location = 'Bulgaria';
    if (isRemote) location = 'Remote';
    else if (isHybrid) location = 'Hybrid';
    const techMatches = [...block.matchAll(/<img[^>]+title="([^"]+)"[^>]*>/g)];
    const techStack = [...new Set(techMatches.map(m => m[1]).filter(t => t && !t.toLowerCase().includes('icon') && t.length > 1))];
    jobs.push({
      title, company, url, date_posted, location,
      employment_type: 'Full-time',
      description: techStack.length > 0 ? 'Tech stack: ' + techStack.join(', ') : '',
      source: 'dev.bg'
    });
  }
  return jobs;
}

// Read the real number of pages from the FacetWP pager. Its markup is embedded in the page
// as an escaped string (data-page=\"5\"), so unescape first, then take the largest data-page.
function lastPageOf(html) {
  const clean = String(html).replace(/\\"/g, '"');
  let max = 1;
  const re = /data-page="(\d+)"/g;
  let m;
  while ((m = re.exec(clean)) !== null) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  return max;
}

function addJobs(html) {
  for (const job of parseJobsFromHtml(html)) {
    if (!seenUrls.has(job.url)) { seenUrls.add(job.url); allJobs.push(job); }
  }
}

for (let i = 0; i < allItems.length; i++) {
  const html = allItems[i].json.data || '';
  if (!html) continue;
  addJobs(html);

  const baseUrl = (builtUrls[i] && builtUrls[i].json && builtUrls[i].json.scrape_url) || '';
  if (!baseUrl) continue;

  const lastPage = Math.min(lastPageOf(html), MAX_PAGES);
  for (let p = 2; p <= lastPage; p++) {
    const pageUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + '_paged=' + p;
    try {
      const resp = await this.helpers.httpRequest({ url: pageUrl, method: 'GET', headers: { 'User-Agent': UA }, json: false, timeout: 20000 });
      const pageHtml = typeof resp === 'string' ? resp : ((resp && resp.body) || '');
      if (pageHtml) addJobs(pageHtml);
    } catch (e) {
      // transient page error or no http helper — keep what we have and move on
    }
  }
}

return [{ json: { output: { jobs: allJobs } } }];

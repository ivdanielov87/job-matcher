const httpItems = $input.all();
const splitItems = $('Split Jobs for Fetch').all();

return httpItems.map((item, i) => {
  const markdown = (item.json.data && item.json.data.markdown || '').substring(0, 6000);
  const originalJob = (splitItems[i] && splitItems[i].json) || {};

  return { json: {
    title: originalJob.title || '',
    company: originalJob.company || '',
    url: originalJob.url || '',
    date_posted: originalJob.date_posted || '',
    location: originalJob.location || '',
    employment_type: originalJob.employment_type || '',
    description: originalJob.description || '',
    full_description: markdown || originalJob.description || ''
  }};
});

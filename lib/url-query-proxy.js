module.exports = function urlQueryProxy(req, res) {
  if (req.method !== 'GET') return false;
  if (!(req.url === '/proxy' || req.url.startsWith('/proxy?') || req.url.startsWith('/proxy/'))) return false;

  let target = '';
  const rawUrl = req.url;

  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    target = parsed.searchParams.get('url') || '';
  } catch (_) {}

  // Support /proxy/https://example.com/path?x=1 in addition to /proxy?url=...
  if (!target && rawUrl.startsWith('/proxy/')) {
    target = rawUrl.slice('/proxy/'.length);
  }

  if (!target) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing url query parameter' }));
    return true;
  }

  req.headers['target-url'] = target;
  req.url = '/';
  return false;
};

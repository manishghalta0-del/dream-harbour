const http = require('http');
const https = require('https');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Set CORS headers FIRST and CORRECTLY
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${req.method} ${req.url}`);

  const options = {
    hostname: 'qrewtecibeikvwhenk.supabase.co',
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'Host': 'qrewtecibeikvwhenk.supabase.co'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Error:', err.message);
    res.writeHead(500);
    res.end('Proxy error');
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`✅ Proxy running on http://localhost:${PORT}`);
});
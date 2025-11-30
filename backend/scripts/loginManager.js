const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { return resolve({ statusCode: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null }); } catch (e) { return resolve({ statusCode: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  const host = 'localhost';
  const port = 3000;
  const creds = JSON.stringify({ email: 'manager@example.com', password: 'ManagerPass123!' });
  try {
    const res = await request({ method: 'POST', hostname: host, port, path: '/api/auth/login', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(creds) } }, creds);
    console.log('Login response:', res.statusCode, res.body);
  } catch (err) {
    console.error('Request failed:', err);
  }
})();

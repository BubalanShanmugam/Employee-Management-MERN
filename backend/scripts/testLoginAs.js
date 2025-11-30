const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, headers: res.headers, body: data ? JSON.parse(data) : null }); }
        catch (e) { resolve({ statusCode: res.statusCode, headers: res.headers, body: data }); }
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
  const loginAs = process.argv[2] || 'manager';
  const email = process.argv[3] || (loginAs === 'manager' ? 'manager@example.com' : 'testuser@example.com');
  const password = process.argv[4] || (loginAs === 'manager' ? 'ManagerPass123!' : 'Password123!');

  const body = JSON.stringify({ email, password, loginAs });

  try {
    const res = await request({ method: 'POST', hostname: host, port, path: '/api/auth/login', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, body);
    console.log('Status:', res.statusCode);
    console.log('Body:', res.body);
  } catch (err) {
    console.error('Request error:', err.message || err);
  }
})();

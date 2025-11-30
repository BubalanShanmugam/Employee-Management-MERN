const http = require('http');
const fs = require('fs');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const ct = res.headers['content-type'] || '';
        if (ct.includes('application/json')) {
          try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); } catch (e) { resolve({ statusCode: res.statusCode, body: data }); }
        } else {
          resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
        }
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
  try {
    const creds = JSON.stringify({ email: 'manager@example.com', password: 'Password123!' });
    const login = await request({ method: 'POST', hostname: host, port, path: '/api/auth/login', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(creds) } }, creds);
    console.log('Manager login:', login.statusCode, login.body && login.body.message);
    const token = login.body && login.body.token;
    if (!token) return console.error('No token received for manager; aborting export test.');

    // Request CSV export
    const exportOptions = { method: 'GET', hostname: host, port, path: '/api/attendance/export', headers: { 'Authorization': `Bearer ${token}` } };
    const res = await new Promise((resolve, reject) => {
      const req = http.request(exportOptions, (r) => {
        const file = fs.createWriteStream('attendance_export.csv');
        r.pipe(file);
        r.on('end', () => resolve({ statusCode: r.statusCode, headers: r.headers }));
        r.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });

    console.log('Export request status:', res.statusCode);
    if (res.statusCode === 200) console.log('CSV saved to attendance_export.csv');
  } catch (err) {
    console.error('Test failed', err);
  }
})();

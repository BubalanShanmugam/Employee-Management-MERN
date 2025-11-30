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
          try { resolve({ statusCode: res.statusCode, body: JSON.parse(data), headers: res.headers }); } catch (e) { resolve({ statusCode: res.statusCode, body: data, headers: res.headers }); }
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
  const host = '127.0.0.1';
  const port = 3000;
  try {
    const creds = JSON.stringify({ email: 'manager@example.com', password: 'Password123!' });
    const login = await request({ method: 'POST', hostname: host, port, path: '/api/auth/login', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(creds) } }, creds);
    console.log('Manager login status:', login.statusCode);
    console.log('Manager login body:', login.body);

    const token = login.body && login.body.token;
    if (!token) return console.error('No token received for manager; cannot proceed.');

    // GET CSV and stream
    const options = { method: 'GET', hostname: host, port, path: '/api/attendance/export', headers: { 'Authorization': `Bearer ${token}` } };
    const req = http.request(options, (res) => {
      console.log('Export status:', res.statusCode, 'content-type:', res.headers['content-type']);
      const file = fs.createWriteStream('attendance_export_debug.csv');
      let firstChunk = '';
      res.on('data', (chunk) => {
        if (!firstChunk) firstChunk = '';
        const s = chunk.toString('utf8');
        if (firstChunk.length < 10000) firstChunk += s;
        file.write(chunk);
      });
      res.on('end', () => {
        file.end();
        console.log('Saved CSV to attendance_export_debug.csv');
        const lines = firstChunk.split(/\r?\n/).slice(0, 10).filter(Boolean);
        console.log('First lines of CSV:\n', lines.join('\n'));
      });
      res.on('error', (e) => { console.error('Stream error', e); });
    });
    req.on('error', (e) => { console.error('Request error', e); });
    req.end();
  } catch (err) {
    console.error('Test failed', err);
  }
})();

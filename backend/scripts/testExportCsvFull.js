const http = require('http');
const fs = require('fs');
const path = require('path');

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        let parsed = data;
        if (contentType.includes('application/json')) {
          try { parsed = JSON.parse(data); } catch (e) { }
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('Step 1: Login as manager...');
    const loginCreds = JSON.stringify({ email: 'manager@example.com', password: 'Password123!' });
    const loginRes = await httpRequest(
      { method: 'POST', hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginCreds) } },
      loginCreds
    );
    console.log('Login response status:', loginRes.statusCode);
    if (loginRes.statusCode !== 200) {
      console.error('Login failed:', loginRes.body);
      return;
    }
    const token = loginRes.body && loginRes.body.token;
    if (!token) {
      console.error('No token in response:', loginRes.body);
      return;
    }
    console.log('Login successful. Token:', token.substring(0, 20) + '...');

    console.log('\nStep 2: Request CSV export...');
    const exportRes = await new Promise((resolve, reject) => {
      const req = http.request(
        { method: 'GET', hostname: '127.0.0.1', port: 3000, path: '/api/attendance/export', headers: { 'Authorization': `Bearer ${token}` } },
        (res) => {
          let csvData = '';
          res.on('data', (chunk) => { csvData += chunk.toString('utf8'); });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, headers: res.headers, body: csvData });
          });
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.end();
    });

    console.log('Export response status:', exportRes.statusCode);
    console.log('Content-Type:', exportRes.headers['content-type']);
    console.log('Content-Disposition:', exportRes.headers['content-disposition']);

    if (exportRes.statusCode === 200 && exportRes.body) {
      const lines = exportRes.body.split('\n').slice(0, 15).filter(l => l);
      console.log('\nFirst 15 lines of CSV:');
      lines.forEach((line, idx) => console.log(`  ${idx}: ${line}`));

      // Save to file
      const outputPath = path.join(__dirname, 'exported_attendance.csv');
      fs.writeFileSync(outputPath, exportRes.body, 'utf8');
      console.log(`\nCSV saved to: ${outputPath}`);
      console.log(`File size: ${Buffer.byteLength(exportRes.body)} bytes`);
    } else {
      console.error('Export failed:', exportRes.body);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
  process.exit(0);
})();

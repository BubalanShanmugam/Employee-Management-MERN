const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json') && data) {
          try { return resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); } catch (e) { return resolve({ statusCode: res.statusCode, body: data }); }
        }
        return resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function run() {
  const base = 'http://localhost:3000';
  const user = { name: 'Test User', email: 'testuser@example.com', password: 'Password123!', employeeId: 'EMP100', department: 'Engineering' };

  try {
    // Register
    const regOptions = { method: 'POST', hostname: 'localhost', port: 3000, path: '/api/auth/register', headers: { 'Content-Type': 'application/json' } };
    const reg = await request(regOptions, JSON.stringify(user));
    console.log('REGISTER:', reg.statusCode);

    // Login
    const loginBody = JSON.stringify({ email: user.email, password: user.password });
    const loginOptions = { method: 'POST', hostname: 'localhost', port: 3000, path: '/api/auth/login', headers: { 'Content-Type': 'application/json' } };
    const login = await request(loginOptions, loginBody);
    console.log('LOGIN STATUS:', login.statusCode);
    console.log('LOGIN BODY:', login.body);

    const token = login.body && login.body.token;
    if (!token) return console.error('No token returned; aborting /me test.');

    // Me
    const meOptions = { method: 'GET', hostname: 'localhost', port: 3000, path: '/api/auth/me', headers: { 'Authorization': `Bearer ${token}` } };
    const me = await request(meOptions);
    console.log('ME STATUS:', me.statusCode);
    console.log('ME BODY:', me.body);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

run();

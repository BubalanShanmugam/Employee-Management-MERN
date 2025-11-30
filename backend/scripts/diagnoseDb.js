// Diagnostic script to help debug PostgreSQL auth/connectivity issues.
// Usage (PowerShell):
// $env:DATABASE_URL='postgres://user:pass@host:5432/db'; node scripts/diagnoseDb.js

const { Client } = require('pg');
const { Sequelize } = require('sequelize');

function parseDbUrl(url) {
  try {
    const u = new URL(url);
    return {
      username: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      host: u.hostname,
      port: u.port || '5432',
      database: (u.pathname || '').replace(/^\//, ''),
    };
  } catch (e) {
    return null;
  }
}

(async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Please set DATABASE_URL in the environment and re-run. Example:');
    console.error("$env:DATABASE_URL='postgres://employee_user:Password@127.0.0.1:5432/employee_db'; node scripts/diagnoseDb.js");
    process.exit(1);
  }

  console.log('Parsing DATABASE_URL...');
  const info = parseDbUrl(url);
  if (!info) {
    console.error('Failed to parse DATABASE_URL. Make sure it is a proper URL.');
    process.exit(1);
  }

  console.log('Connection details (from URL):');
  console.log(`  host: ${info.host}`);
  console.log(`  port: ${info.port}`);
  console.log(`  database: ${info.database}`);
  console.log(`  username: ${info.username}`);

  // Try raw pg client first
  console.log('\n1) Testing raw pg (node-postgres) connection...');
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query("SELECT current_user, current_database(), inet_server_addr();");
    console.log('PG connection OK:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('PG connection failed:');
    console.error(err && err.message ? err.message : err);
    // show error code if available
    if (err && err.code) console.error('Error code:', err.code);
  }

  // Try Sequelize connection
  console.log('\n2) Testing Sequelize connection...');
  const dbName = info.database;
  const sequelize = new Sequelize(dbName, info.username, info.password, {
    host: info.host,
    port: info.port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: false },
  });

  try {
    await sequelize.authenticate();
    console.log('Sequelize: connected OK');
    await sequelize.close();
  } catch (err) {
    console.error('Sequelize connection failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.parent && err.parent.code) console.error('Error code:', err.parent.code);
  }

  console.log('\n3) Quick checklist:');
  console.log('- If PG connection failed with "password authentication failed", re-check the password and reset via a superuser:');
  console.log("  ALTER ROLE employee_user WITH PASSWORD 'yourpassword';");
  console.log('- If psql (CLI) works but node fails, try 127.0.0.1 in the URL instead of localhost to avoid IPv6 mismatches.');
  console.log('- Check pg_hba.conf to ensure host 127.0.0.1/32 and ::1/128 use md5 (password) auth.');
  console.log('- If you changed pg_hba.conf, restart Postgres service.');
  console.log('- If you are using SSL/TLS, ensure dialectOptions.ssl is configured accordingly.');

  process.exit(0);
})();

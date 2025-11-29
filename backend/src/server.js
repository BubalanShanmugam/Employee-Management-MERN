const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routers
app.use('/api/auth', require('./authenticator/router'));
app.use('/api/attendance', require('./employee/router/attendanceRouter'));
app.use('/api/attendance', require('./manager/router/attendanceRouter'));
app.use('/api/dashboard', require('./dashboard/router'));

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

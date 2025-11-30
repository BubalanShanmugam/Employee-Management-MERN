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

// If DB is unavailable, quickly respond 503 for API routes to avoid throwing DB exceptions
app.use((req, res, next) => {
  // Only apply to API routes
  if (req.path && req.path.startsWith('/api') && req.app && req.app.locals && req.app.locals.dbConnected === false) {
    return res.status(503).json({ message: 'Service temporarily unavailable (database)' });
  }
  return next();
});

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.sync();
    app.locals.dbConnected = true;
    const server = app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

    // Graceful shutdown handlers
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // In production you might want to exit the process
    });

    // Export server for tests if needed
    app.locals.server = server;
  } catch (err) {
    // Log DB startup error but do NOT crash the application.
    // Mark DB as disconnected so middleware can respond appropriately.
    console.error('Database startup error (continuing without DB):', err && err.stack ? err.stack : err);
    app.locals.dbConnected = false;
    // Start server anyway so health-check endpoints and other non-DB routes remain available.
    const server = app.listen(PORT, () => console.log(`Server listening (DB unavailable) on http://localhost:${PORT}`));

    // Export server for tests if needed
    app.locals.server = server;
  }
}

start();

// Mount centralized error handler (placed after routes/mounting above)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Load environment variables first (from parent directory where .env is located)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { supabase, testConnection } = require('./db');

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));
}

// Routers
app.use('/api/auth', require('./authenticator/router'));
app.use('/api/attendance', require('./employee/router/attendanceRouter'));
app.use('/api/attendance', require('./manager/router/attendanceRouter'));
app.use('/api/dashboard', require('./dashboard/router'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const connected = await testConnection();
    if (connected) {
      res.json({ 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Database connection failed');
    }
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

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
    // Test Supabase connection
    const connected = await testConnection();
    app.locals.dbConnected = connected;
    
    const server = app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

    // Graceful shutdown handlers
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
    });

    app.locals.server = server;
  } catch (err) {
    console.error('Server startup error:', err && err.stack ? err.stack : err);
    app.locals.dbConnected = false;
    const server = app.listen(PORT, () => console.log(`Server listening (DB unavailable) on http://localhost:${PORT}`));
    app.locals.server = server;
  }
}

start();

// Mount centralized error handler (placed after routes/mounting above)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Serve frontend for all non-API routes in production (SPA support)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
    res.sendFile(frontendPath);
  });
}

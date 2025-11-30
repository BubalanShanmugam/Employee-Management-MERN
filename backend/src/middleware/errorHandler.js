function errorHandler(err, req, res, next) {
  // Log the full error server-side (stack included for diagnostics)
  console.error(err && err.stack ? err.stack : err);

  // Determine status code
  // If this is a Sequelize/database error, do not expose exception details to clients.
  const isSequelizeError = err && (err.name && String(err.name).toLowerCase().includes('sequelize'));
  if (isSequelizeError) {
    // Log already done above; respond with generic DB unavailable message and 503
    return res.status(503).json({ message: 'Service temporarily unavailable (database)' });
  }

  const status = err && err.status && Number(err.status) >= 400 ? Number(err.status) : 500;
  // Return sanitized response but include the exception message for non-DB errors (no stack)
  const message = err && err.message ? String(err.message) : 'Internal server error';

  res.status(status).json({ message });
}

module.exports = errorHandler;

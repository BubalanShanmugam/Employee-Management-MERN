const { Sequelize, DataTypes } = require('sequelize');

// Allow running without Postgres by falling back to SQLite when DATABASE_URL is not provided
const DATABASE_URL = process.env.DATABASE_URL;
let sequelize;
if (DATABASE_URL) {
  // Parse the URL and construct Sequelize with explicit connection fields.
  // This is more robust for authentication and gives us control over options.
  try {
    const parsed = new URL(DATABASE_URL);
    const dbName = (parsed.pathname || '').replace(/^\//, '') || process.env.DB_NAME;
    const dbUser = decodeURIComponent(parsed.username || process.env.DB_USER || '');
    const dbPassword = decodeURIComponent(parsed.password || process.env.DB_PASSWORD || '');
    const dbHost = parsed.hostname || process.env.DB_HOST || 'localhost';
    const dbPort = parsed.port || process.env.DB_PORT || 5432;

    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        // Allow optionally enabling SSL via env var
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  } catch (err) {
    // Fallback: if parsing fails, try passing the raw URL directly to Sequelize
    sequelize = new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
    });
  }
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './backend.sqlite',
    logging: false,
  });
}

// Import model factories
const createUserModel = require('../../models/users');
const createAttendanceModel = require('../../models/attendance');

const User = createUserModel(sequelize, DataTypes);
const Attendance = createAttendanceModel(sequelize, DataTypes);

// Associations
User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

const models = { User, Attendance };

module.exports = { sequelize, Sequelize, DataTypes, models };

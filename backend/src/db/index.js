const { Sequelize, DataTypes } = require('sequelize');

// Allow running without Postgres by falling back to SQLite when DATABASE_URL is not provided
const DATABASE_URL = process.env.DATABASE_URL;
let sequelize;
if (DATABASE_URL) {
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
  });
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

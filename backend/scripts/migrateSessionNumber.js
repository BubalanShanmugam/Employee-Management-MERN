/**
 * Migration script to add sessionNumber column to attendances table
 * and update existing records to have sessionNumber = 1
 * 
 * Run with: node scripts/migrateSessionNumber.js
 */

require('dotenv').config();
const { sequelize, models } = require('../src/db');

async function migrate() {
  try {
    console.log('Starting migration: Adding sessionNumber column...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('attendances');
    
    if (tableDescription.session_number) {
      console.log('Column session_number already exists. Skipping column addition.');
    } else {
      // Add the column
      await queryInterface.addColumn('attendances', 'session_number', {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      });
      console.log('Added session_number column successfully.');
    }
    
    // Update all existing records to have sessionNumber = 1 if not set
    const [results] = await sequelize.query(
      `UPDATE attendances SET session_number = 1 WHERE session_number IS NULL`
    );
    console.log('Updated existing records with default sessionNumber = 1');
    
    // Drop the old unique index if it exists and create new one
    try {
      // For SQLite, we need to handle this differently
      const dialect = sequelize.getDialect();
      
      if (dialect === 'postgres') {
        // Try to drop old index
        await sequelize.query(`
          DROP INDEX IF EXISTS attendances_user_id_date;
        `);
        
        // Create new composite unique index
        await sequelize.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS attendances_user_id_date_session_number 
          ON attendances (user_id, date, session_number);
        `);
      } else if (dialect === 'sqlite') {
        // SQLite requires recreating the table for index changes
        // For now, just sync the model with alter
        console.log('SQLite detected - will sync model on next startup');
      }
      
      console.log('Index updated successfully.');
    } catch (indexErr) {
      console.log('Index update note:', indexErr.message);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

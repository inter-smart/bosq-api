require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    dialectOptions: {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
    define: {
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
    pool: {
      max: 20,      // Maximum connections in pool (increased)
      min: 2,       // Minimum connections (always keep some ready)
      acquire: 60000, // Time (ms) to wait before throwing error (increased to 60s)
      idle: 20000,    // Time (ms) a connection can be idle before released (increased)
      evict: 5000,    // Time (ms) interval to check for evictable connections
      handleDisconnects: true // Automatically handle disconnects
    }
  }
);

module.exports = sequelize;

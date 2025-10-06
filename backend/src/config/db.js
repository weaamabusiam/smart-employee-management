const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_system',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Convert pool to use promises
const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Database connection pool created successfully');
  connection.release();
});

module.exports = pool;
module.exports.promise = promisePool;


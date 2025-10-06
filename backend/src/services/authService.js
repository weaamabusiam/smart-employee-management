// Auth Service
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = (username, password) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT 
        u.id, u.username, u.password_hash, u.role_id,
        e.id as employee_db_id, 
        e.employee_id as employee_code, 
        e.name as employee_name, 
        e.email as employee_email
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.username = ?
    `, [username], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return reject(new Error('Invalid credentials'));
      const user = results[0];
      bcrypt.compare(password, user.password_hash, (err, match) => {
        if (err) return reject(err);
        if (!match) return reject(new Error('Invalid credentials'));
        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role_id: user.role_id,
            employee_id: user.employee_code  // Use employee code (like "EMP041"), not database ID
          },
          process.env.JWT_SECRET || 'dev_secret',
          { expiresIn: '8h' }
        );
        resolve({ 
          token, 
          user: { 
            id: user.id, 
            username: user.username, 
            role_id: user.role_id,
            employee_id: user.employee_id,
            employee_name: user.employee_name,
            employee_email: user.employee_email
          } 
        });
      });
    });
  });
};


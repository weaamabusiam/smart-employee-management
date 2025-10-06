// User Service
const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, username, role_id FROM users', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.createUser = (username, password, role_id) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(err);
      const query = 'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)';
      const params = [username, hash, role_id];
      db.query(query, params, (err, result) => {
        if (err) {
          console.error('DB Error:', err);
          return reject(err);
        }
        resolve({ id: result.insertId, username, role_id });
      });
    });
  });
};

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id, u.username, u.role_id,
        e.id as employee_id, e.employee_id as emp_code, e.name, e.email, e.phone, e.department_id,
        d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE u.id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

exports.updateUser = (userId, userData) => {
  return new Promise((resolve, reject) => {
    const { username, password, role_id } = userData;
    let fields = [];
    let values = [];
    if (username) { fields.push('username = ?'); values.push(username); }
    if (role_id) { fields.push('role_id = ?'); values.push(role_id); }
    if (password) {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) return reject(err);
        fields.push('password_hash = ?');
        values.push(hash);
        values.push(userId);
        db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, (err, result) => {
          if (err) return reject(err);
          resolve({ message: 'User updated' });
        });
      });
      return;
    }
    values.push(userId);
    db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values, (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'User updated' });
    });
  });
};

exports.deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'User deleted successfully' });
    });
  });
};

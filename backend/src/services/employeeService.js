// Employee Service
const db = require('../config/db');

exports.getAllEmployees = (userDepartmentId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT e.*, d.name as department_name, u.username, r.name as role_name
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
    `;
    
    let params = [];
    
    // If userDepartmentId is provided, filter by department (for managers)
    if (userDepartmentId) {
      query += ` WHERE e.department_id = ?`;
      params.push(userDepartmentId);
    }
    
    query += ` ORDER BY e.name`;
    
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.addEmployee = (employee_id, name, email, phone, department_id, user_id) => {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO employees (employee_id, name, email, phone, department_id, user_id) VALUES (?, ?, ?, ?, ?, ?)', 
      [employee_id, name, email, phone, department_id, user_id || null], (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, employee_id, name, email, phone, department_id, user_id });
    });
  });
};

exports.updateEmployee = (id, employeeData) => {
  return new Promise((resolve, reject) => {
    const { employee_id, name, email, phone, department_id, user_id } = employeeData;
    
    db.query('UPDATE employees SET employee_id = ?, name = ?, email = ?, phone = ?, department_id = ?, user_id = ? WHERE id = ?', 
      [employee_id, name, email, phone, department_id, user_id || null, id], (err, result) => {
      if (err) return reject(err);
      resolve({ id, employee_id, name, email, phone, department_id, user_id });
    });
  });
};

exports.deleteEmployee = (id) => {
  return new Promise((resolve, reject) => {
    db.query('DELETE FROM employees WHERE id = ?', [id], (err, result) => {
      if (err) return reject(err);
      resolve({ id });
    });
  });
};

exports.updateEmployeePresence = (employee_id, is_present) => {
  return new Promise((resolve, reject) => {
    db.query('UPDATE employees SET is_present = ? WHERE employee_id = ?', 
      [is_present, employee_id], (err, result) => {
      if (err) return reject(err);
      resolve({ employee_id, is_present });
    });
  });
};

exports.createEmployee = (employeeData) => {
  return new Promise((resolve, reject) => {
    const { user_id, name, email, phone, department_id, employee_id } = employeeData;
    
    if (!employee_id) {
      return reject(new Error('employee_id is required'));
    }
    
    const query = 'INSERT INTO employees (employee_id, user_id, name, email, phone, department_id) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [employee_id, user_id, name, email, phone, department_id];
    
    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id: result.insertId, employee_id, user_id, name, email, phone, department_id });
    });
  });
};

exports.getEmployeeByUserId = (userId) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM employees WHERE user_id = ?', [userId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

exports.updateEmployee = (id, employeeData) => {
  return new Promise((resolve, reject) => {
    const { name, email, phone, department_id } = employeeData;
    const query = 'UPDATE employees SET name = ?, email = ?, phone = ?, department_id = ? WHERE id = ?';
    const params = [name, email, phone, department_id, id];
    
    db.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve({ id, name, email, phone, department_id });
    });
  });
};

exports.deleteEmployee = (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM employees WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) return reject(err);
      resolve({ message: 'Employee deleted successfully' });
    });
  });
};

exports.deleteEmployeeAttendanceLogs = (employeeId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM attendance_logs WHERE employee_id = ?';
    db.query(query, [employeeId], (err, result) => {
      if (err) return reject(err);
      resolve({ message: `Deleted ${result.affectedRows} attendance logs` });
    });
  });
};


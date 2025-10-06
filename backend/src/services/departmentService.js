// Department Service
const db = require('../config/db');

exports.getAllDepartments = () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT d.*, u.username as manager_username, u.id as manager_id
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      ORDER BY d.name
    `, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getDepartmentById = (id) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT d.*, u.username as manager_username, u.id as manager_id
      FROM departments d
      LEFT JOIN users u ON d.manager_id = u.id
      WHERE d.id = ?
    `, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

exports.createDepartment = (name, description, managerId = null) => {
  return new Promise((resolve, reject) => {
    // If managerId is provided, validate that the user is a manager and not already assigned
    if (managerId) {
      // Check if user is a manager (role_id = 2)
      db.query('SELECT role_id FROM users WHERE id = ?', [managerId], (err, userResult) => {
        if (err) return reject(err);
        if (!userResult.length || userResult[0].role_id !== 2) {
          return reject(new Error('User must be a manager to be assigned as department manager'));
        }
        
        // Check if user is already a manager of another department
        db.query('SELECT id FROM departments WHERE manager_id = ?', [managerId], (err, deptResult) => {
          if (err) return reject(err);
          if (deptResult.length > 0) {
            return reject(new Error('User is already a manager of another department'));
          }
          
          // Create department with manager
          db.query('INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)', 
            [name, description, managerId], (err, result) => {
            if (err) return reject(err);
            resolve({ id: result.insertId, name, description, manager_id: managerId });
          });
        });
      });
    } else {
      // Create department without manager
      db.query('INSERT INTO departments (name, description) VALUES (?, ?)', 
        [name, description], (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, name, description, manager_id: null });
      });
    }
  });
};

exports.updateDepartment = (id, name, description, managerId = null) => {
  return new Promise((resolve, reject) => {
    // If managerId is provided, validate that the user is a manager and not already assigned
    if (managerId) {
      // Check if user is a manager (role_id = 2)
      db.query('SELECT role_id FROM users WHERE id = ?', [managerId], (err, userResult) => {
        if (err) return reject(err);
        if (!userResult.length || userResult[0].role_id !== 2) {
          return reject(new Error('User must be a manager to be assigned as department manager'));
        }
        
        // Check if user is already a manager of another department (excluding current department)
        db.query('SELECT id FROM departments WHERE manager_id = ? AND id != ?', [managerId, id], (err, deptResult) => {
          if (err) return reject(err);
          if (deptResult.length > 0) {
            return reject(new Error('User is already a manager of another department'));
          }
          
          // Update department with manager
          db.query('UPDATE departments SET name = ?, description = ?, manager_id = ? WHERE id = ?', 
            [name, description, managerId, id], (err, result) => {
            if (err) return reject(err);
            resolve({ id, name, description, manager_id: managerId });
          });
        });
      });
    } else {
      // Update department without manager (clear manager_id)
      db.query('UPDATE departments SET name = ?, description = ?, manager_id = NULL WHERE id = ?', 
        [name, description, id], (err, result) => {
        if (err) return reject(err);
        resolve({ id, name, description, manager_id: null });
      });
    }
  });
};

exports.deleteDepartment = (id) => {
  return new Promise((resolve, reject) => {
    // First, check if there are employees in this department
    db.query('SELECT COUNT(*) as employeeCount FROM employees WHERE department_id = ?', [id], (err, countResult) => {
      if (err) return reject(err);
      
      const employeeCount = countResult[0].employeeCount;
      
      if (employeeCount > 0) {
        return reject(new Error(`Cannot delete department. There are ${employeeCount} employees in this department. Please delete the employees first.`));
      }
      
      // If no employees, proceed with deletion
      db.query('DELETE FROM departments WHERE id = ?', [id], (err, result) => {
        if (err) return reject(err);
        
        if (result.affectedRows === 0) {
          return reject(new Error('Department not found'));
        }
        
        resolve({ message: 'Department deleted successfully' });
      });
    });
  });
};

exports.getDepartmentEmployees = (departmentId) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT e.id, e.name, e.email, e.employee_id
      FROM employees e
      WHERE e.department_id = ?
      ORDER BY e.name
    `, [departmentId], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getAvailableManagers = () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT u.id, u.username, u.email
      FROM users u
      WHERE u.role_id = 2 
      AND u.id NOT IN (
        SELECT COALESCE(manager_id, 0) 
        FROM departments 
        WHERE manager_id IS NOT NULL
      )
      ORDER BY u.username
    `, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.updateDepartmentManager = (departmentId, managerId) => {
  return new Promise((resolve, reject) => {
    // First, check if the user is a manager
    db.query('SELECT role_id FROM users WHERE id = ?', [managerId], (err, userResult) => {
      if (err) return reject(err);
      if (!userResult.length || userResult[0].role_id !== 2) {
        return reject(new Error('User must be a manager to be assigned as department manager'));
      }
      
      // Check if user is already a manager of another department
      db.query('SELECT id FROM departments WHERE manager_id = ? AND id != ?', [managerId, departmentId], (err, deptResult) => {
        if (err) return reject(err);
        if (deptResult.length > 0) {
          return reject(new Error('User is already a manager of another department'));
        }
        
        // Update the department's manager
        db.query('UPDATE departments SET manager_id = ? WHERE id = ?', [managerId, departmentId], (err, result) => {
          if (err) return reject(err);
          if (result.affectedRows === 0) {
            return reject(new Error('Department not found'));
          }
          
          // Return the updated department with manager info
          db.query(`
            SELECT d.*, u.username as manager_username, u.id as manager_id
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.id
            WHERE d.id = ?
          `, [departmentId], (err, finalResult) => {
            if (err) return reject(err);
            resolve(finalResult[0]);
          });
        });
      });
    });
  });
};

// Alias for getAllDepartments to match what userController expects
exports.getDepartments = exports.getAllDepartments;

// Method to update department with object parameter (for userController)
exports.updateDepartmentWithObject = (id, updateData) => {
  return new Promise((resolve, reject) => {
    const { name, description, manager_id } = updateData;
    
    if (manager_id) {
      // Update with manager
      db.query('UPDATE departments SET name = ?, description = ?, manager_id = ? WHERE id = ?', 
        [name, description, manager_id, id], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) {
          return reject(new Error('Department not found'));
        }
        resolve({ id, name, description, manager_id });
      });
    } else {
      // Update without manager (clear manager_id)
      db.query('UPDATE departments SET name = ?, description = ?, manager_id = NULL WHERE id = ?', 
        [name, description, id], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) {
          return reject(new Error('Department not found'));
        }
        resolve({ id, name, description, manager_id: null });
      });
    }
  });
};

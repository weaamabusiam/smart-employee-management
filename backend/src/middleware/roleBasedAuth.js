// Role-Based Access Control Middleware
const db = require('../config/db');

// Check if user has access to dashboard (admin or manager only)
exports.requireDashboardAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Only admin (role_id: 1) and manager (role_id: 2) can access dashboard
  if (req.user.role_id !== 1 && req.user.role_id !== 2) {
    return res.status(403).json({ error: 'Dashboard access denied. Only admins and managers can access the dashboard.' });
  }
  
  next();
};

// Check if user is admin
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Check if user is manager
exports.requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role_id !== 2) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  
  next();
};

// Check if user is employee
exports.requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role_id !== 3) {
    return res.status(403).json({ error: 'Employee access required' });
  }
  
  next();
};

// Get user's department ID (for managers to filter data)
exports.getUserDepartment = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    if (req.user.role_id === 1) {
      // Admin can see all departments
      req.user.department_id = null;
      req.user.department_name = 'All Departments';
    } else if (req.user.role_id === 2) {
      // Manager can only see their department
      const result = await new Promise((resolve, reject) => {
        db.query(`
          SELECT d.id as department_id, d.name as department_name 
          FROM departments d 
          WHERE d.manager_id = ?
        `, [req.user.id], (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      });
      
      if (!result) {
        return res.status(403).json({ error: 'Manager not assigned to any department' });
      }
      
      req.user.department_id = result.department_id;
      req.user.department_name = result.department_name;
    } else if (req.user.role_id === 3) {
      // Employee can only see their own data
      const result = await new Promise((resolve, reject) => {
        db.query(`
          SELECT e.department_id, d.name as department_name 
          FROM employees e 
          LEFT JOIN departments d ON e.department_id = d.id 
          WHERE e.user_id = ?
        `, [req.user.id], (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      });
      
      if (!result) {
        return res.status(403).json({ error: 'Employee not found' });
      }
      
      req.user.department_id = result.department_id;
      req.user.department_name = result.department_name;
    }
    
    next();
  } catch (error) {
    console.error('Error getting user department:', error);
    res.status(500).json({ error: 'Failed to get user department information' });
  }
};

// Filter data based on user role and department
exports.filterDataByRole = (req, res, next) => {
  // Add department filter to request for managers
  if (req.user.role_id === 2 && req.user.department_id) {
    req.departmentFilter = `AND e.department_id = ${req.user.department_id}`;
  } else if (req.user.role_id === 3) {
    // Employees can only see their own data
    req.employeeFilter = `AND e.user_id = ${req.user.id}`;
  } else {
    // Admin can see all data
    req.departmentFilter = '';
    req.employeeFilter = '';
  }
  
  next();
};

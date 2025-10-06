// Employee Controller
const employeeService = require('../services/employeeService');

exports.getAllEmployees = async (req, res) => {
  try {
    let userDepartmentId = null;
    if (req.user && req.user.role_id === 2) {
      const db = require('../config/db');
      const managerEmployee = await new Promise((resolve, reject) => {
        db.query(
          'SELECT department_id FROM employees WHERE user_id = ?',
          [req.user.id],
          (err, results) => {
            if (err) return reject(err);
            resolve(results);
          }
        );
      });
      if (managerEmployee.length > 0) {
        userDepartmentId = managerEmployee[0].department_id;
      }
    }
    
    const employees = await employeeService.getAllEmployees(userDepartmentId);
    res.json(employees);
  } catch (err) {
    console.error('Error in getAllEmployees:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { employee_id, name, email, phone, department_id, user_id } = req.body;
    if (!employee_id || !name || !email) {
      return res.status(400).json({ error: 'employee_id, name and email are required' });
    }
    const employee = await employeeService.addEmployee(employee_id, name, email, phone, department_id, user_id);
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee_id, name, email, phone, department_id, user_id } = req.body;
    if (!employee_id || !name || !email) {
      return res.status(400).json({ error: 'employee_id, name and email are required' });
    }
    const employee = await employeeService.updateEmployee(id, { employee_id, name, email, phone, department_id, user_id });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await employeeService.deleteEmployee(id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


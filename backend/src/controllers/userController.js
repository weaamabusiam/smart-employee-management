// User Controller
const userService = require('../services/userService');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role_id, name, email, phone, department_id, employee_id } = req.body;
    
    if (!username || !password || !role_id) {
      return res.status(400).json({ error: 'username, password, and role_id are required' });
    }
    
    // Create the user first
    const user = await userService.createUser(username, password, role_id);
    
    // If additional employee info is provided, create employee record
    if (name && email && employee_id) {
      const employeeService = require('../services/employeeService');
      await employeeService.createEmployee({
        user_id: user.id,
        name,
        email,
        phone: phone || null,
        department_id: department_id || null,
        employee_id
      });
    }
    
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role_id, name, email, phone, department_id, employee_id } = req.body;
    
    const user = await userService.updateUser(id, { username, password, role_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If additional employee info is provided, update employee record
    if (name && email) {
      const employeeService = require('../services/employeeService');
      const existingEmployee = await employeeService.getEmployeeByUserId(id);
      
      if (existingEmployee) {
        await employeeService.updateEmployee(existingEmployee.id, {
          name,
          email,
          phone: phone || null,
          department_id: department_id || null,
          employee_id: employee_id || existingEmployee.employee_id
        });
      } else {
        await employeeService.createEmployee({
          user_id: id,
          name,
          email,
          phone: phone || null,
          department_id: department_id || null,
          employee_id: employee_id || `EMP${String(id).padStart(3, '0')}`
        });
      }
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, check if this user is a manager of any department
    const departmentService = require('../services/departmentService');
    const departments = await departmentService.getDepartments();
    const managedDepartments = departments.filter(dept => dept.manager_id == id);
    
    // If user is a manager, first unassign them from all departments
    for (const dept of managedDepartments) {
      await departmentService.updateDepartmentWithObject(dept.id, { 
        name: dept.name, 
        description: dept.description, 
        manager_id: null 
      });
    }
    
    // Then delete the associated employee record if it exists
    const employeeService = require('../services/employeeService');
    const employee = await employeeService.getEmployeeByUserId(id);
    if (employee) {
      // First delete all attendance logs for this employee
      await employeeService.deleteEmployeeAttendanceLogs(employee.id);
      // Then delete the employee record
      await employeeService.deleteEmployee(employee.id);
    }
    
    // Finally delete the user
    await userService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
};


// Department Controller
const departmentService = require('../services/departmentService');

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await departmentService.getDepartmentById(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const department = await departmentService.createDepartment(name, description, manager_id);
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manager_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Department name is required' });
    }
    const department = await departmentService.updateDepartment(id, name, description, manager_id);
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await departmentService.deleteDepartment(id);
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const employees = await departmentService.getDepartmentEmployees(id);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAvailableManagers = async (req, res) => {
  try {
    const managers = await departmentService.getAvailableManagers();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDepartmentManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { manager_id } = req.body;
    
    if (!manager_id) {
      return res.status(400).json({ error: 'Manager ID is required' });
    }
    
    const department = await departmentService.updateDepartmentManager(id, manager_id);
    res.json(department);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

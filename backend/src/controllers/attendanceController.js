// Attendance Controller
const attendanceService = require('../services/attendanceService');

// Log attendance (public route for ESP32 and mobile app)
exports.logAttendance = async (req, res) => {
  try {
    const { employee_id, status, source } = req.body;
    
    if (!employee_id || !status) {
      return res.status(400).json({ error: 'employee_id and status are required' });
    }
    
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'status must be present, absent, or late' });
    }
    
    const attendance = await attendanceService.logAttendance(employee_id, status, source);
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all attendance logs (public route)
exports.getAttendanceLogs = async (req, res) => {
  try {
    const { employee_id, date, limit = 100 } = req.query || {};
    const logs = await attendanceService.getAttendanceLogs(employee_id, date, limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get employee attendance (protected route)
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    const attendance = await attendanceService.getEmployeeAttendance(id, start_date, end_date);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance report (protected route)
exports.getAttendanceReport = async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;
    
    // For managers (role_id = 2), only show attendance from their department
    let userDepartmentId = null;
    if (req.user && req.user.role_id === 2) {
      // Get the manager's department ID from their employee record
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
    
    const report = await attendanceService.getAttendanceReport(start_date, end_date, status, userDepartmentId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update attendance log (protected route)
exports.updateAttendanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, source } = req.body;
    
    if (status && !['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'status must be present, absent, or late' });
    }
    
    const attendance = await attendanceService.updateAttendanceLog(id, { status, source });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete attendance log (protected route)
exports.deleteAttendanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    await attendanceService.deleteAttendanceLog(id);
    res.json({ message: 'Attendance log deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current user's attendance (protected route for mobile app)
exports.getMyAttendance = async (req, res) => {
  try {
    const { user } = req; // This comes from the authenticateJWT middleware
    if (!user.employee_id) {
      return res.status(403).json({ error: 'Employee ID not found. Please contact administrator.' });
    }
    
    const { start_date, end_date, limit = 50 } = req.query;
    
    // Get the employee's database ID from their employee code
    const employee = await attendanceService.getEmployeeByCode(user.employee_id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const attendance = await attendanceService.getEmployeeAttendance(employee.id, start_date, end_date, limit);
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get attendance history (protected route for mobile app)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { user } = req; // This comes from the authenticateJWT middleware
    if (!user.employee_id) {
      return res.status(403).json({ error: 'Employee ID not found. Please contact administrator.' });
    }
    
    const limit = parseInt(req.query.limit) || 10;
    const history = await attendanceService.getAttendanceHistory(user.employee_id, limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get monthly presence time (protected route for mobile app)
exports.getMonthlyPresenceTime = async (req, res) => {
  try {
    const { user } = req; // This comes from the authenticateJWT middleware
    if (!user.employee_id) {
      return res.status(403).json({ error: 'Employee ID not found. Please contact administrator.' });
    }
    
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }
    
    const monthlyData = await attendanceService.getMonthlyPresenceTime(user.employee_id, parseInt(year), parseInt(month));
    res.json(monthlyData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get monthly presence time for any employee (dashboard route)
exports.getEmployeeMonthlyPresence = async (req, res) => {
  try {
    const { employee_code } = req.params;
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }
    
    const monthlyData = await attendanceService.getMonthlyPresenceTime(employee_code, parseInt(year), parseInt(month));
    res.json(monthlyData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


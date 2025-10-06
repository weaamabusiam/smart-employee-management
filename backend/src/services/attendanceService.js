// Attendance Service
const db = require('../config/db');

// Get employee by employee code (like "EMP041")
exports.getEmployeeByCode = async (employeeCode) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, employee_id, name, email FROM employees WHERE employee_id = ?';
    db.query(query, [employeeCode], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

exports.logAttendance = async (employee_id, status, source = 'unknown', esp32_id = null, rssi = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // First, find the employee by id (the mobile app sends the employees.id value)
      const employeeQuery = 'SELECT id FROM employees WHERE id = ?';
      const employeeResult = await new Promise((resolveEmp, rejectEmp) => {
        db.query(employeeQuery, [employee_id], (err, results) => {
          if (err) return rejectEmp(err);
          resolveEmp(results);
        });
      });

      if (employeeResult.length === 0) {
        return reject(new Error('Employee not found'));
      }

      const employeeDbId = employeeResult[0].id;

      // Log the attendance
      const query = 'INSERT INTO attendance_logs (employee_id, status, source, esp32_id, rssi) VALUES (?, ?, ?, ?, ?)';
      db.query(query, [employeeDbId, status, source, esp32_id, rssi], (err, result) => {
        if (err) return reject(err);
        
        // Update employee presence status using presence service
        const presenceService = require('./presenceService');
        const isPresent = status === 'present';
        presenceService.updatePresence(employeeDbId, isPresent)
          .catch(err => console.error('Failed to update presence:', err));
        
        
        resolve({ id: result.insertId, employee_id, status, source, timestamp: new Date() });
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.getAttendanceLogs = async (employee_id = null, date = null, limit = 100) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        al.*,
        e.name as employee_name,
        e.employee_id as employee_code,
        e.email as employee_email,
        d.name as department_name
      FROM attendance_logs al
      LEFT JOIN employees e ON al.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    let params = [];
    let whereConditions = [];
    
    if (employee_id) {
      whereConditions.push('al.employee_id = ?');
      params.push(employee_id);
    }
    
    if (date) {
      whereConditions.push('DATE(al.timestamp) = ?');
      params.push(date);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getEmployeeAttendance = async (employee_id, start_date = null, end_date = null) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM attendance_logs WHERE employee_id = ?';
    let params = [employee_id];
    
    if (start_date && end_date) {
      query += ' AND DATE(timestamp) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getAttendanceReport = async (start_date = null, end_date = null, status = null, department_id = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        al.*,
        e.name as employee_name,
        e.email as employee_email,
        e.department_id,
        d.name as department_name
      FROM attendance_logs al
      JOIN employees e ON al.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    let params = [];
    let conditions = [];
    
    if (start_date && end_date) {
      conditions.push('DATE(al.timestamp) BETWEEN ? AND ?');
      params.push(start_date, end_date);
    }
    
    if (status) {
      conditions.push('al.status = ?');
      params.push(status);
    }
    
    // Filter by department if specified (for managers)
    if (department_id) {
      conditions.push('e.department_id = ?');
      params.push(department_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY al.timestamp DESC';
    
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.updateAttendanceLog = async (id, updates) => {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    if (fields.length === 0) {
      return resolve(null);
    }
    
    values.push(id);
    const query = `UPDATE attendance_logs SET ${fields.join(', ')} WHERE id = ?`;
    
    db.query(query, values, (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) return resolve(null);
      
      // Return the updated record
      db.query('SELECT * FROM attendance_logs WHERE id = ?', [id], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  });
};

exports.deleteAttendanceLog = async (id) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM attendance_logs WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        reject(new Error('Attendance log not found'));
      } else {
        resolve();
      }
    });
  });
};

// Get attendance history for a specific employee (last N records)
exports.getAttendanceHistory = async (employee_code, limit = 10) => {
  return new Promise((resolve, reject) => {
    // First, get the employee's database ID from their employee code
    const employeeQuery = 'SELECT id FROM employees WHERE employee_id = ?';
    db.query(employeeQuery, [employee_code], (err, employeeResults) => {
      if (err) return reject(err);
      
      if (employeeResults.length === 0) {
        return resolve([]); // Return empty array if employee not found
      }
      
      const employeeDbId = employeeResults[0].id;
      
      // Get attendance history showing only status changes (not every report)
      const query = `
        SELECT 
          al.id,
          al.employee_id,
          al.status,
          al.source,
          al.esp32_id,
          al.rssi,
          al.timestamp,
          e.name as employee_name,
          e.employee_id as employee_code,
          @prev_status AS prev_status,
          @prev_status := al.status AS curr_status
        FROM attendance_logs al
        JOIN employees e ON al.employee_id = e.id
        CROSS JOIN (SELECT @prev_status := NULL) AS init
        WHERE al.employee_id = ?
        ORDER BY al.timestamp DESC
      `;
      
      db.query(query, [employeeDbId], (err, allResults) => {
        if (err) return reject(err);
        
        // Filter to only include records where status changed from previous
        const statusChanges = [];
        let lastStatus = null;
        
        // Process in reverse order (oldest first) to track status changes correctly
        for (let i = allResults.length - 1; i >= 0; i--) {
          const record = allResults[i];
          if (record.status !== lastStatus) {
            statusChanges.unshift(record); // Add to beginning to maintain DESC order
            lastStatus = record.status;
          }
        }
        
        // Limit to requested number of records
        const limitedResults = statusChanges.slice(0, limit);
        
        resolve(limitedResults);
      });
    });
  });
};

// Get monthly presence time - calculates accumulated time for each day
exports.getMonthlyPresenceTime = async (employee_code, year, month) => {
  return new Promise((resolve, reject) => {
    // First, get the employee's database ID from their employee code
    const employeeQuery = 'SELECT id FROM employees WHERE employee_id = ?';
    db.query(employeeQuery, [employee_code], (err, employeeResults) => {
      if (err) return reject(err);
      
      if (employeeResults.length === 0) {
        return resolve([]); // Return empty array if employee not found
      }
      
      const employeeDbId = employeeResults[0].id;
      
      // Get all attendance logs for the specified month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0); // Last day of month
      const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      // Use SQL to find only status changes (transitions) - much more efficient!
      const query = `
        WITH StatusChanges AS (
          SELECT 
            DATE(timestamp) as date,
            status,
            timestamp,
            LAG(status) OVER (ORDER BY timestamp) as prev_status
          FROM attendance_logs
          WHERE employee_id = ?
            AND DATE(timestamp) BETWEEN ? AND ?
        )
        SELECT date, status, timestamp
        FROM StatusChanges
        WHERE status != prev_status OR prev_status IS NULL
        ORDER BY timestamp ASC
      `;
      
      db.query(query, [employeeDbId, startDate, endDateStr], (err, results) => {
        if (err) return reject(err);
        
        
        // Calculate presence time for each day
        const dailyPresence = {};
        let sessionStart = null;
        
        results.forEach(record => {
          const recordDate = record.date.toISOString().split('T')[0];
          const recordTime = new Date(record.timestamp);
          
          if (record.status === 'present') {
            // Start of presence session
            sessionStart = recordTime;
          } else if (record.status === 'absent' && sessionStart) {
            // End of presence session - calculate duration
            const duration = (recordTime - sessionStart) / (1000 * 60); // minutes
            const startDateStr = sessionStart.toISOString().split('T')[0];
            
            // Add to daily total
            if (!dailyPresence[startDateStr]) {
              dailyPresence[startDateStr] = {
                date: startDateStr,
                totalMinutes: 0,
                sessions: []
              };
            }
            dailyPresence[startDateStr].totalMinutes += duration;
            dailyPresence[startDateStr].sessions.push({
              start: sessionStart.toISOString(),
              end: recordTime.toISOString(),
              minutes: Math.round(duration)
            });
            
            sessionStart = null;
          }
        });
        
        // If still present at end of data, calculate until now
        if (sessionStart) {
          const now = new Date();
          const duration = (now - sessionStart) / (1000 * 60); // minutes
          const startDateStr = sessionStart.toISOString().split('T')[0];
          
          if (!dailyPresence[startDateStr]) {
            dailyPresence[startDateStr] = {
              date: startDateStr,
              totalMinutes: 0,
              sessions: []
            };
          }
          dailyPresence[startDateStr].totalMinutes += duration;
          dailyPresence[startDateStr].sessions.push({
            start: sessionStart.toISOString(),
            end: now.toISOString(),
            minutes: Math.round(duration),
            ongoing: true
          });
        }
        
        // Convert to array and format
        const result = Object.values(dailyPresence).map(day => ({
          date: day.date,
          totalMinutes: Math.round(day.totalMinutes),
          totalHours: (day.totalMinutes / 60).toFixed(2),
          sessions: day.sessions
        }));
        
        resolve(result);
      });
    });
  });
};


const db = require('../config/db');
const attendanceService = require('./attendanceService');

// Process presence report from mobile app
exports.processPresenceReport = async (presenceData) => {
  const { employee_id, esp32_id, rssi, timestamp, source } = presenceData;
  
  try {
    const employee = await getEmployeeById(employee_id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    let esp32Device = null;
    if (esp32_id && esp32_id !== 'none') {
      esp32Device = await getESP32DeviceById(esp32_id);
      if (!esp32Device) {
        throw new Error('ESP32 device not found');
      }
    }

    // Determine if this is presence or absence
    const isPresent = esp32Device !== null;
    const status = isPresent ? 'present' : 'absent';

    const attendanceEvent = await attendanceService.logAttendance(
      employee.id,
      status, 
      source,
      esp32Device ? esp32Device.esp32_id : null,
      rssi
    );

    // Update presence record (only if present)
    if (isPresent) {
      await updatePresenceRecord(
        employee.id,
        esp32Device.esp32_id,
        rssi,
        timestamp,
        source
      );
    }

    return {
      employee_id,
      esp32_id: esp32Device ? esp32Device.esp32_id : null,
      status,
      attendance_event: attendanceEvent,
      timestamp
    };
  } catch (err) {
    console.error('Error processing presence report:', err);
    throw err;
  }
};

// Get employee by ID
const getEmployeeById = (employee_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM employees WHERE employee_id = ?', [employee_id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

// Get ESP32 device by ID
const getESP32DeviceById = (esp32_id) => {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM esp32_devices WHERE esp32_id = ?', [esp32_id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

const getLastPresence = (employee_id) => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT * FROM attendance_logs 
      WHERE employee_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [employee_id], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
};

// Update presence record
const updatePresenceRecord = (employeeDbId, esp32_id, rssi, timestamp, source) => {
  return new Promise((resolve, reject) => {
    db.query(`
      INSERT INTO attendance_logs (employee_id, status, esp32_id, rssi, source, timestamp)
      VALUES (?, 'present', ?, ?, ?, ?)
    `, [employeeDbId, esp32_id, rssi, source, timestamp], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.getPresenceStatus = async (employee_id) => {
  try {
    const lastPresence = await getLastPresence(employee_id);
    const isPresent = lastPresence && 
      (Date.now() - new Date(lastPresence.timestamp).getTime()) < 10 * 60 * 1000; // 10 minutes
    
    return {
      employee_id,
      is_present: isPresent,
      last_seen: lastPresence?.timestamp || null,
      esp32_id: lastPresence?.esp32_id || null
    };
  } catch (err) {
    console.error('Error getting presence status:', err);
    throw err;
  }
};

exports.updatePresence = async (employee_id, isPresent) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE employees 
      SET is_present = ?, last_seen = NOW() 
      WHERE id = ?
    `;
    
    db.query(query, [isPresent, employee_id], (err, result) => {
      if (err) {
        console.error('Failed to update employee presence:', err);
        return reject(err);
      }
      resolve(result);
    });
  });
};
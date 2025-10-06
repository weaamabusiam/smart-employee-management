const db = require('../config/db');

// Process scan results from ESP32
exports.processScanResults = async (scanData) => {
  const { esp32_id } = scanData;

  // Update ESP32 last_seen timestamp
  await updateEsp32LastSeen(esp32_id);

  // Return success - actual presence tracking is done by mobile app
  return { 
    processed: 0, 
    attendance_events: [],
    message: 'ESP32 beacon heartbeat received. Presence tracking handled by mobile app.'
  };
};

// Update ESP32 beacon status
exports.updateBeaconStatus = async (beaconData) => {
  const { esp32_id, beacon_uuid, beacon_major, beacon_minor, is_advertising, timestamp } = beaconData;
  
  return new Promise((resolve, reject) => {
    // First, try to update existing device
    const updateQuery = `
      UPDATE esp32_devices 
      SET last_seen = ?, status = ?
      WHERE esp32_id = ?
    `;
    
    db.query(updateQuery, [timestamp, 'active', esp32_id], (err, result) => {
      if (err) {
        console.error('Update query error:', err);
        return reject(err);
      }
      
      if (result.affectedRows > 0) {
        // Device updated
        resolve({ esp32_id, status: 'updated' });
      } else {
        // Device doesn't exist, create new one
        const insertQuery = `
          INSERT INTO esp32_devices (esp32_id, location, description, status, last_seen)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [
          esp32_id, 
          'Unknown Location', 
          `ESP32 Beacon - UUID: ${beacon_uuid}`, 
          'active', 
          timestamp
        ], (err, result) => {
          if (err) {
            console.error('Insert query error:', err);
            return reject(err);
          }
          resolve({ esp32_id, status: 'created' });
        });
      }
    });
  });
};

// Update ESP32 last_seen timestamp
const updateEsp32LastSeen = (esp32_id) => {
  return new Promise((resolve, reject) => {
    db.query(`
      UPDATE esp32_devices 
      SET last_seen = NOW()
      WHERE esp32_id = ?
    `, [esp32_id], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Get ESP32 status
exports.getStatus = async () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        SUM(CASE WHEN e.is_present = 1 THEN 1 ELSE 0 END) as present_employees,
        COUNT(DISTINCT esp32_id) as active_scanners
      FROM employees e
      LEFT JOIN attendance_logs a ON e.id = a.employee_id
      WHERE a.timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || { total_employees: 0, present_employees: 0, active_scanners: 0 });
    });
  });
};

// Register new ESP32 device
exports.registerDevice = async (deviceData) => {
  const { esp32_id, location, description } = deviceData;
  
  return new Promise((resolve, reject) => {
    db.query(`
      INSERT INTO esp32_devices (esp32_id, location, description, status, created_at)
      VALUES (?, ?, ?, 'active', NOW())
      ON DUPLICATE KEY UPDATE
      location = VALUES(location),
      description = VALUES(description),
      status = 'active',
      last_seen = NOW()
    `, [esp32_id, location, description], (err, result) => {
      if (err) return reject(err);
      resolve({ esp32_id, location, description, status: 'active' });
    });
  });
};

// Get all ESP32 devices
exports.getDevices = async () => {
  return new Promise((resolve, reject) => {
    db.query(`
      SELECT 
        id,
        esp32_id,
        location,
        description,
        status,
        last_seen,
        created_at
      FROM esp32_devices
      ORDER BY created_at DESC
    `, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Update ESP32 device
exports.updateDevice = async (id, updateData) => {
  const { location, description, status } = updateData;
  
  return new Promise((resolve, reject) => {
    db.query(`
      UPDATE esp32_devices 
      SET location = ?, description = ?, status = ?
      WHERE id = ?
    `, [location, description, status, id], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        return reject(new Error('ESP32 device not found'));
      }
      resolve({ id, location, description, status });
    });
  });
};

// Delete ESP32 device
exports.deleteDevice = async (id) => {
  return new Promise((resolve, reject) => {
    db.query(`
      DELETE FROM esp32_devices 
      WHERE id = ?
    `, [id], (err, result) => {
      if (err) return reject(err);
      if (result.affectedRows === 0) {
        return reject(new Error('ESP32 device not found'));
      }
      resolve({ id });
    });
  });
};

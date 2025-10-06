const db = require('../config/db');

// Background service to update employee presence status
class PresenceBackgroundService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60000; // Check every minute
  }

  // Start the background service
  start() {
    if (this.isRunning) {
      console.log('Presence background service is already running');
      return;
    }

    console.log('🔄 Starting presence background service...');
    this.isRunning = true;
    
    // Run immediately on start
    this.updatePresenceStatus();
    
    // Then run every minute
    this.intervalId = setInterval(() => {
      this.updatePresenceStatus();
    }, this.checkInterval);
  }

  // Stop the background service
  stop() {
    if (!this.isRunning) {
      console.log('Presence background service is not running');
      return;
    }

    console.log('⏹️ Stopping presence background service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Update presence status for all employees
  async updatePresenceStatus() {
    try {
      console.log('🔍 Checking employee presence status...');
      
      // Get all employees with their last attendance record
      const employees = await this.getEmployeesWithLastAttendance();
      
      let updatedCount = 0;
      const now = Date.now();
      const tenMinutesAgo = now - (10 * 60 * 1000);

      for (const employee of employees) {
        let shouldBePresent = false;
        let lastSeen = employee.last_seen;

        // Check if employee should be present based on last attendance
        if (employee.last_attendance_timestamp) {
          const lastAttendanceTime = new Date(employee.last_attendance_timestamp).getTime();
          
          // Present if last attendance was "present" and within 10 minutes
          shouldBePresent = employee.last_attendance_status === 'present' && 
                           lastAttendanceTime > tenMinutesAgo;
          
          lastSeen = employee.last_attendance_timestamp;
        }

        // Update if presence status has changed
        if (employee.is_present !== shouldBePresent) {
          await this.updateEmployeePresence(employee.id, shouldBePresent, lastSeen);
          updatedCount++;
          
          console.log(`📝 Updated ${employee.name}: ${employee.is_present ? 'Present' : 'Absent'} → ${shouldBePresent ? 'Present' : 'Absent'}`);
        }
      }

      if (updatedCount > 0) {
        console.log(`✅ Updated presence status for ${updatedCount} employees`);
      } else {
        console.log('✅ No presence updates needed');
      }

    } catch (error) {
      console.error('❌ Error updating presence status:', error);
    }
  }

  // Get all employees with their last attendance record
  getEmployeesWithLastAttendance() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT e.id, e.name, e.is_present, e.last_seen,
               al.timestamp as last_attendance_timestamp,
               al.status as last_attendance_status
        FROM employees e
        LEFT JOIN (
          SELECT employee_id, status, timestamp,
                 ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY timestamp DESC) as rn
          FROM attendance_logs
        ) al ON e.id = al.employee_id AND al.rn = 1
        ORDER BY e.name
      `;

      db.query(query, [], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  // Update employee presence status in database
  updateEmployeePresence(employeeId, isPresent, lastSeen) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE employees 
        SET is_present = ?, last_seen = ?
        WHERE id = ?
      `;
      
      const lastSeenValue = lastSeen ? new Date(lastSeen) : new Date();
      
      db.query(query, [isPresent, lastSeenValue, employeeId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      nextCheck: this.isRunning ? new Date(Date.now() + this.checkInterval) : null
    };
  }
}

// Create singleton instance
const presenceBackgroundService = new PresenceBackgroundService();

module.exports = presenceBackgroundService;

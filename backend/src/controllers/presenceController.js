const presenceService = require('../services/presenceService');

// Report presence from mobile app
exports.reportPresence = async (req, res) => {
  try {
    const { employee_id, esp32_id, rssi, timestamp, source } = req.body;
    
    if (!employee_id || !esp32_id) {
      return res.status(400).json({ error: 'employee_id and esp32_id are required' });
    }

    // Process presence report
    const result = await presenceService.processPresenceReport({
      employee_id,
      esp32_id,
      rssi,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: source || 'mobile_scanner'
    });

    res.json({
      success: true,
      message: 'Presence reported successfully',
      data: result
    });
  } catch (err) {
    console.error('Error processing presence report:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get presence status for employee
exports.getPresenceStatus = async (req, res) => {
  try {
    const { employee_id } = req.params;
    
    const status = await presenceService.getPresenceStatus(employee_id);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

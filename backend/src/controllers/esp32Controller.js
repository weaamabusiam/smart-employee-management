const esp32Service = require('../services/esp32Service');

// Process scan results from ESP32
exports.processScanResults = async (req, res) => {
  try {
    const { esp32_id, scan_timestamp, devices } = req.body;
    
    
    if (!esp32_id || !devices) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate device count from devices array
    const device_count = devices ? devices.length : 0;

    // Process the scan results
    const result = await esp32Service.processScanResults({
      esp32_id,
      scan_timestamp,
      device_count,
      devices
    });

    res.json({
      success: true,
      processed: result.processed,
      attendance_events: result.attendance_events
    });
  } catch (err) {
    console.error('Error processing scan results:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get ESP32 status
exports.getStatus = async (req, res) => {
  try {
    const status = await esp32Service.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Register new ESP32 device
exports.registerDevice = async (req, res) => {
  try {
    const { esp32_id, location, description } = req.body;
    
    if (!esp32_id) {
      return res.status(400).json({ error: 'ESP32 ID is required' });
    }

    const device = await esp32Service.registerDevice({
      esp32_id,
      location,
      description
    });

    res.status(201).json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle ESP32 beacon heartbeat
exports.beaconHeartbeat = async (req, res) => {
  try {
    const { esp32_id, beacon_uuid, beacon_major, beacon_minor, timestamp, is_advertising } = req.body;
    
    
    if (!esp32_id) {
      return res.status(400).json({ error: 'ESP32 ID is required' });
    }

    // Update or create ESP32 device record
    // ESP32 sends seconds since boot, so we use current time instead
    const device = await esp32Service.updateBeaconStatus({
      esp32_id,
      beacon_uuid,
      beacon_major,
      beacon_minor,
      is_advertising,
      timestamp: new Date() // Use current server time instead of ESP32 timestamp
    });

    res.json({
      success: true,
      message: 'Beacon heartbeat received',
      device: device
    });
  } catch (err) {
    console.error('Error processing beacon heartbeat:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all ESP32 devices
exports.getDevices = async (req, res) => {
  try {
    
    const devices = await esp32Service.getDevices();
    res.json(devices);
  } catch (err) {
    console.error('Error getting ESP32 devices:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update ESP32 device
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, description, status } = req.body;
    
    const device = await esp32Service.updateDevice(id, {
      location,
      description,
      status
    });

    res.json(device);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete ESP32 device
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    
    await esp32Service.deleteDevice(id);
    res.json({ message: 'ESP32 device deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

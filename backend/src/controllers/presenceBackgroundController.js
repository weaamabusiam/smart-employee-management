const presenceBackgroundService = require('../services/presenceBackgroundService');

// Get background service status
exports.getServiceStatus = async (req, res) => {
  try {
    const status = presenceBackgroundService.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('Error getting service status:', err);
    res.status(500).json({ error: err.message });
  }
};

// Manually trigger presence update
exports.triggerUpdate = async (req, res) => {
  try {
    console.log('🔄 Manual presence update triggered');
    await presenceBackgroundService.updatePresenceStatus();
    res.json({
      success: true,
      message: 'Presence update completed'
    });
  } catch (err) {
    console.error('Error triggering presence update:', err);
    res.status(500).json({ error: err.message });
  }
};

// Start background service
exports.startService = async (req, res) => {
  try {
    presenceBackgroundService.start();
    res.json({
      success: true,
      message: 'Background service started'
    });
  } catch (err) {
    console.error('Error starting service:', err);
    res.status(500).json({ error: err.message });
  }
};

// Stop background service
exports.stopService = async (req, res) => {
  try {
    presenceBackgroundService.stop();
    res.json({
      success: true,
      message: 'Background service stopped'
    });
  } catch (err) {
    console.error('Error stopping service:', err);
    res.status(500).json({ error: err.message });
  }
};

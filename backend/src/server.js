require('dotenv').config();
const app = require('./app');
const db = require('./config/db');
const presenceBackgroundService = require('./services/presenceBackgroundService');

const PORT = process.env.PORT || 3000;

db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Database connected successfully');
  connection.release();
  
  // Start server after database connection
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔌 API endpoints available at http://localhost:${PORT}/api`);
    
    // Start presence background service
    presenceBackgroundService.start();
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  presenceBackgroundService.stop();
  db.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  presenceBackgroundService.stop();
  db.end();
  process.exit(0);
});


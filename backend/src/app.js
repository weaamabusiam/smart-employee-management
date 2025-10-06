// This file initializes the Express app and applies middleware.
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());
app.use(cors());
// Rate limiting with exemptions for auth endpoints
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 requests per window
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for auth endpoints
        return req.path.startsWith('/api/auth/');
    }
});

app.use(generalLimiter);

// Routers
app.use('/api/employees', require('./routes/employees'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/esp32', require('./routes/esp32'));
app.use('/api/presence', require('./routes/presence'));
app.use('/api/presence-background', require('./routes/presenceBackground'));

// Error handler
app.use(errorHandler);

module.exports = app;


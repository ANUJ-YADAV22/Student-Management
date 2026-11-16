require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB } = require('./config/database');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Parse allowed frontend origins from FRONTEND_URL
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = rawFrontendUrl
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// CORS configuration:
// Allow origins configured in FRONTEND_URL, plus *.vercel.app and *.netlify.app preview URLs
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. curl, server-to-server, Render health check)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.replace(/\/$/, '');

    // Check explicit allowed origins
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Check *.vercel.app pattern
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Check *.netlify.app pattern
    if (/^https:\/\/[a-zA-Z0-9_-]+\.netlify\.app$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Check localhost for local development
    if (/^http:\/\/localhost:[0-9]+$/i.test(cleanOrigin) || /^http:\/\/127\.0\.0\.1:[0-9]+$/i.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Otherwise reject
    const corsError = new Error(`Origin ${origin} not allowed by CORS`);
    corsError.status = 403;
    return callback(corsError, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbState = stateMap[mongoose.connection.readyState] || 'unknown';
  const isHealthy = mongoose.connection.readyState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    dbState: dbState,
    timestamp: new Date().toISOString()
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management System API is running',
    healthCheck: '/api/health',
    endpoints: {
      students: '/api/students'
    }
  });
});

// Student REST API Routes
app.use('/api/students', studentRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware (Never leak stack traces)
app.use((err, req, res, next) => {
  if (err && (err.message?.includes('CORS') || err.status === 403)) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation: Access from this origin is denied.'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred'
  });
});

// Start Server and Connect DB
async function startServer() {
  try {
    // Only attempt DB connection if MONGODB_URI is provided
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('WARNING: MONGODB_URI is not set. Database not connected yet.');
    }

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal startup error:', error.message);
    // Still start server so Render health check can respond with degraded state and logs show hint
    app.listen(PORT, () => {
      console.log(`Server started in degraded mode on port ${PORT} (DB connection pending)`);
    });
  }
}

startServer();

module.exports = app;

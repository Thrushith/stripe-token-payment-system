require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paymentController = require('./controllers/paymentController');
const webhookController = require('./controllers/webhookController');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS Configuration - Allow both localhost and production URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or server requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.json());

// ==================== LOGGING ====================

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Payment Routes
app.post('/api/create-checkout-session', paymentController.createCheckoutSession);
app.post('/api/create-payment-intent', paymentController.createPaymentIntent);
app.get('/api/payment-status/:id', paymentController.getPaymentStatus);
app.get('/api/session/:id', paymentController.getSessionDetails);
app.get('/api/transactions/:userId', paymentController.getTransactions);

// Webhook Route
app.post('/api/webhook', express.raw({type: 'application/json'}), webhookController.handleWebhook);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    service: 'Stripe Token Payment System'
  });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Server ready!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;

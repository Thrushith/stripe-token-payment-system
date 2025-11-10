require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS - Allow all origins for API access
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.json());

// Logging
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
    service: 'Stripe Token Payment System API',
    version: '1.0.0'
  });
});

// Welcome/Home Route
app.get('/', (req, res) => {
  res.json({
    message: 'Stripe Token Payment System API',
    status: 'online',
    endpoints: {
      health: '/health',
      getAllTransactions: '/api/transactions',
      getUserTransactions: '/api/user/{userId}/transactions',
      getTransaction: '/api/transaction/{transactionId}',
      createTransaction: '/api/transaction/create'
    },
    documentation: 'See API_DOCUMENTATION.md for details'
  });
});

// API Controller
const apiController = require('./controllers/apiController');

// API Routes
app.get('/api/transactions', apiController.getAllTransactions);
app.get('/api/user/:userId/transactions', apiController.getUserTransactions);
app.get('/api/transaction/:transactionId', apiController.getTransaction);
app.post('/api/transaction/create', apiController.createTransaction);

// Payment Routes (if they exist)
try {
  const paymentController = require('./controllers/paymentController');
  const webhookController = require('./controllers/webhookController');
  
  if (paymentController.createCheckoutSession) {
    app.post('/api/create-checkout-session', paymentController.createCheckoutSession);
  }
  
  if (webhookController.handleWebhook) {
    app.post('/api/webhook', express.raw({type: 'application/json'}), webhookController.handleWebhook);
  }
} catch (error) {
  console.log('Payment routes not loaded (optional)');
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path 
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ API ready!`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM: Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

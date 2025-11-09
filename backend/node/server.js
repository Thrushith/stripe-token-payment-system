require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paymentController = require('./controllers/paymentController');
const webhookController = require('./controllers/webhookController');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use(express.json());

// ==================== LOGGING ====================

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================
// ==================== ROUTES ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System'
  });
});

// Payment Routes
if (paymentController.createCheckoutSession) {
  app.post('/api/create-checkout-session', paymentController.createCheckoutSession);
}

if (paymentController.createPaymentIntent) {
  app.post('/api/create-payment-intent', paymentController.createPaymentIntent);
}

// Webhook
app.post('/api/webhook', express.raw({type: 'application/json'}), webhookController.handleWebhook);

// API Routes for Professor
const apiController = require('./controllers/apiController');
app.get('/api/user/:userId/transactions', apiController.getUserTransactions);
app.get('/api/transaction/:transactionId', apiController.getTransaction);
app.get('/api/transactions', apiController.getAllTransactions);
app.post('/api/transaction/create', apiController.createTestTransaction);


// ==================== START SERVER ====================

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Server ready!`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

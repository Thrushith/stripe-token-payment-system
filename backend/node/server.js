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

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System'
  });
});

// Payment Routes - ONLY include routes that exist in your controller
if (paymentController.createCheckoutSession) {
  app.post('/api/create-checkout-session', paymentController.createCheckoutSession);
}

if (paymentController.createPaymentIntent) {
  app.post('/api/create-payment-intent', paymentController.createPaymentIntent);
}

// Webhook
app.post('/api/webhook', express.raw({type: 'application/json'}), webhookController.handleWebhook);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

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

// ==================== STRIPE TOKEN PAYMENT SYSTEM ====================
// SIMPLIFIED Server File - No Error Handling on Require

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 4000;

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== IMPORT CONTROLLERS & SERVICES ====================
console.log('Loading controllers and services...');

const paymentController = require('./controllers/paymentController');
const webhookController = require('./controllers/webhookController');

console.log('✓ Controllers loaded successfully');

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System'
  });
});

// ==================== API ROUTES ====================
app.post('/api/create-checkout-session', paymentController.createCheckoutSession);
app.post('/api/create-payment-intent', paymentController.createPaymentIntent);
app.get('/api/payment-status/:paymentIntentId', paymentController.getPaymentStatus);
app.get('/api/session/:sessionId', paymentController.getSessionDetails);
app.get('/api/transactions/:userId', paymentController.getUserTransactions);
app.post('/api/webhook', webhookController.handleWebhook);

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 Server running on port ' + PORT);
  console.log('✅ Server ready!');
  console.log(`${'='.repeat(60)}\n`);
});

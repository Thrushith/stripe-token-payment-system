require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== MONGODB CONNECTION ====================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://erc3643-admin:jKtDVj9NxHMYNj6c@cluster1.96uvob6.mongodb.net/erc3643_production?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Stripe Token Payment System API',
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      health: '/health',
      getAllTransactions: '/api/transactions',
      getUserTransactions: '/api/user/{userId}/transactions',
      getTransaction: '/api/transaction/{transactionId}',
      createTransaction: '/api/transaction/create'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const apiController = require('./controllers/apiController');

app.get('/api/transactions', apiController.getAllTransactions);
app.get('/api/user/:userId/transactions', apiController.getUserTransactions);
app.get('/api/transaction/:transactionId', apiController.getTransaction);
app.post('/api/transaction/create', apiController.createTransaction);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found'
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
});

process.on('SIGTERM', () => {
  console.log('SIGTERM: Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

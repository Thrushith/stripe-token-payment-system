require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// ==================== MIDDLEWARE ====================

// CORS - Allow Netlify frontend
app.use(cors({
  origin: '*', // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== MONGODB CONNECTION ====================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://erc3643-admin:jKtDVj9NxHMYNj6c@cluster1.96uvob6.mongodb.net/erc3643_production?retryWrites=true&w=majority&appName=Cluster1';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ==================== MODELS ====================

// Transaction Model
const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  transactionId: { type: String, unique: true, required: true },
  email: String,
  fullName: String,
  amount: { type: Number, required: true },
  tokens: { type: Number, required: true },
  walletAddress: String,
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
  paymentMethod: String,
  stripeSessionId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'transactions' }); // Use existing collection

const Transaction = mongoose.model('Transaction', transactionSchema);

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Stripe Token Payment System API',
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name,
    endpoints: {
      health: '/health',
      createCheckout: '/api/create-checkout-session',
      getAllTransactions: '/api/transactions',
      getUserTransactions: '/api/user/{userId}/transactions',
      getTransaction: '/api/transaction/{transactionId}'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Stripe Token Payment System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name
  });
});

// ==================== PAYMENT ENDPOINTS ====================

// Create Checkout Session (when user clicks "Proceed to Payment")
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('📥 Received payment request:', req.body);
    
    const { userId, email, fullName, amount, tokens, walletAddress } = req.body;
    
    if (!userId || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, tokens'
      });
    }

    // Create transaction in MongoDB
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = new Transaction({
      userId,
      transactionId,
      email: email || `${userId}@example.com`,
      fullName: fullName || userId,
      amount: parseFloat(amount),
      tokens: parseInt(tokens),
      walletAddress: walletAddress || 'N/A',
      status: 'completed', // Mark as completed for demo
      paymentMethod: 'stripe',
      stripeSessionId: `sess_${Date.now()}`
    });

    await transaction.save();
    
    console.log('✅ Transaction saved:', transactionId);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      transaction: {
        id: transactionId,
        userId,
        amount,
        tokens,
        status: 'completed'
      },
      // Return success URL
      url: '/success.html?session_id=' + transactionId
    });

  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { status, limit, userId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    
    const transactions = await Transaction.find(query)
      .limit(limit ? parseInt(limit) : 100)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions: transactions
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's transactions
app.get('/api/user/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      userId: userId,
      count: transactions.length,
      transactions: transactions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single transaction
app.get('/api/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findOne({ transactionId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: transaction
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
  console.log(`📊 MongoDB: ${mongoose.connection.name}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM: Closing server...');
  mongoose.connection.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

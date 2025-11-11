require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// ==================== MIDDLEWARE ====================

app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// ==================== MODELS ====================

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
}, { collection: 'transactions' });

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

// Create Checkout Session with REAL STRIPE
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('📥 Checkout request received:', req.body);
    
    const { userId, email, fullName, amount, tokens, walletAddress } = req.body;
    
    // Validate
    if (!userId || !amount || !tokens || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, tokens, email'
      });
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51SQVqVJLQxGcJ3163jizOziPR2tqaWoNaFhWLxQuZMJgpa7DO458xuEePAV8FhuK0cupFkwhcOhGTspeLlnYBi9k00SLQF3hee');
    const frontendUrl = process.env.FRONTEND_URL || 'https://stipe-token-system.netlify.app';

    console.log('💳 Creating STRIPE checkout session...');

    // Create REAL Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tokens} Tokens`,
            description: `Token purchase for ${fullName}`
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: email,
      client_reference_id: userId,
      success_url: `${frontendUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/index.html?error=cancelled`,
      metadata: {
        userId,
        fullName,
        tokens: tokens.toString(),
        walletAddress: walletAddress || 'N/A'
      }
    });

    console.log('✅ STRIPE session created:', session.id);
    console.log('🔗 Checkout URL:', session.url);

    // Save to MongoDB with pending status
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = new Transaction({
      userId,
      transactionId,
      email: email || `${userId}@example.com`,
      fullName: fullName || userId,
      amount: parseFloat(amount),
      tokens: parseInt(tokens),
      walletAddress: walletAddress || 'N/A',
      status: 'pending', // Will update to completed when payment succeeds
      paymentMethod: 'stripe',
      stripeSessionId: session.id // Real Stripe session ID
    });

    await transaction.save();
    
    console.log('✅ Transaction saved to MongoDB:', transactionId);

    // Return the Stripe checkout URL to frontend
    res.json({
      success: true,
      message: 'Checkout session created - redirect to Stripe',
      sessionId: session.id,
      checkoutUrl: session.url, // IMPORTANT: Frontend redirects to this!
      transaction: {
        id: transactionId,
        userId,
        amount,
        tokens,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Stripe error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.raw?.message || 'Unknown error'
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

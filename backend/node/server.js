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
  country: String, // NEW: Store customer country
  currency: String, // NEW: Store transaction currency
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'transactions' });

const Transaction = mongoose.model('Transaction', transactionSchema);

// ==================== HELPER FUNCTIONS ====================

// Get payment methods based on country
function getPaymentMethodsForCountry(country) {
  const paymentMethodMap = {
    'IN': ['card', 'upi'],                              // India - UPI
    'CN': ['card', 'alipay', 'wechat_pay'],            // China - Alipay, WeChat
    'MY': ['card', 'grabpay', 'fpx'],                  // Malaysia - GrabPay, FPX
    'SG': ['card', 'grabpay', 'paynow'],               // Singapore - GrabPay, PayNow
    'ID': ['card', 'gopay'],                           // Indonesia - GoPay
    'TH': ['card', 'promptpay'],                       // Thailand - PromptPay
    'JP': ['card', 'konbini'],                         // Japan - Konbini
    'KR': ['card', 'kakaopay'],                        // Korea - KakaoPay
    'PH': ['card', 'grabpay', 'paymaya'],              // Philippines - GrabPay, PayMaya
    'VN': ['card'],                                     // Vietnam
    'AU': ['card'],                                     // Australia
    'NZ': ['card'],                                     // New Zealand
    'BR': ['card', 'boleto'],                          // Brazil - Boleto
    'MX': ['card', 'oxxo'],                            // Mexico - OXXO
    'NL': ['card', 'ideal'],                           // Netherlands - iDEAL
    'BE': ['card', 'bancontact'],                      // Belgium - Bancontact
    'PL': ['card', 'p24'],                             // Poland - Przelewy24
    'AT': ['card', 'eps'],                             // Austria - EPS
    'ES': ['card'],                                     // Spain
    'IT': ['card'],                                     // Italy
    'DE': ['card', 'giropay', 'sofort'],               // Germany - Giropay, Sofort
    'FR': ['card'],                                     // France
    'GB': ['card', 'bacs_debit'],                      // UK - BACS
    'US': ['card', 'us_bank_account'],                 // USA - ACH
    'CA': ['card'],                                     // Canada
    'AE': ['card'],                                     // UAE
    'SA': ['card'],                                     // Saudi Arabia
  };

  return paymentMethodMap[country] || ['card']; // Default to card
}

// Get currency based on country
function getCurrencyForCountry(country) {
  const currencyMap = {
    'IN': 'inr',  // Indian Rupee
    'CN': 'cny',  // Chinese Yuan
    'MY': 'myr',  // Malaysian Ringgit
    'SG': 'sgd',  // Singapore Dollar
    'ID': 'idr',  // Indonesian Rupiah
    'TH': 'thb',  // Thai Baht
    'JP': 'jpy',  // Japanese Yen
    'KR': 'krw',  // Korean Won
    'PH': 'php',  // Philippine Peso
    'VN': 'vnd',  // Vietnamese Dong
    'AU': 'aud',  // Australian Dollar
    'NZ': 'nzd',  // New Zealand Dollar
    'BR': 'brl',  // Brazilian Real
    'MX': 'mxn',  // Mexican Peso
    'NL': 'eur',  // Euro
    'BE': 'eur',  // Euro
    'PL': 'pln',  // Polish Zloty
    'AT': 'eur',  // Euro
    'ES': 'eur',  // Euro
    'IT': 'eur',  // Euro
    'DE': 'eur',  // Euro
    'FR': 'eur',  // Euro
    'GB': 'gbp',  // British Pound
    'US': 'usd',  // US Dollar
    'CA': 'cad',  // Canadian Dollar
    'AE': 'aed',  // UAE Dirham
    'SA': 'sar',  // Saudi Riyal
  };

  return currencyMap[country] || 'usd'; // Default to USD
}

// ==================== ROUTES ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Stripe Token Payment System API - Global Payments',
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name,
    supportedCountries: ['IN', 'CN', 'MY', 'SG', 'ID', 'TH', 'JP', 'KR', 'PH', 'BR', 'MX', 'NL', 'BE', 'PL', 'AT', 'ES', 'IT', 'DE', 'FR', 'GB', 'US', 'CA', 'AE', 'SA'],
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

// Create Checkout Session with GLOBAL PAYMENT METHODS
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    console.log('📥 Checkout request received:', req.body);
    
    const { userId, email, fullName, amount, tokens, walletAddress, country } = req.body;
    
    // Validate
    if (!userId || !amount || !tokens || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, tokens, email'
      });
    }

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const frontendUrl = process.env.FRONTEND_URL || 'https://stipe-token-system.netlify.app';

    // Get payment methods and currency for country
    const userCountry = country || 'US';
    const paymentMethods = getPaymentMethodsForCountry(userCountry);
    const currency = getCurrencyForCountry(userCountry);

    console.log('💳 Creating STRIPE checkout session...');
    console.log('🌍 Country:', userCountry);
    console.log('💵 Currency:', currency);
    console.log('🎯 Payment methods:', paymentMethods);

    // Create REAL Stripe session with multiple payment methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: `${tokens} Tokens`,
            description: `Token purchase for ${fullName}`,
            images: ['https://your-logo-url.com/token-icon.png'] // Optional: Add your logo
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
        walletAddress: walletAddress || 'N/A',
        country: userCountry
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
      status: 'pending',
      paymentMethod: paymentMethods.join(', '),
      stripeSessionId: session.id,
      country: userCountry,
      currency: currency
    });

    await transaction.save();
    
    console.log('✅ Transaction saved to MongoDB:', transactionId);

    // Return the Stripe checkout URL to frontend
    res.json({
      success: true,
      message: 'Checkout session created - redirect to Stripe',
      sessionId: session.id,
      checkoutUrl: session.url,
      paymentMethods: paymentMethods,
      currency: currency,
      country: userCountry,
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
    const { status, limit, userId, country } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (country) query.country = country;
    
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
  console.log(`✅ API ready with global payment support!`);
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

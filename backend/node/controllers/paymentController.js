// ==================== PAYMENT CONTROLLER ====================
const tokenService = require('../services/tokenService');
const databaseService = require('../services/databaseService');
// ==================== PAYMENT CONTROLLER ====================
// Handles Stripe payments and MongoDB transaction storage

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51SQVqVJLQxGcJ3163jizOziPR2tqaWoNaFhWLxQuZMJgpa7DO458xuEePAV8FhuK0cupFkwhcOhGTspeLlnYBi9k00SLQF3hee');
const Transaction = require('../models/Transaction');

// ==================== CREATE CHECKOUT SESSION ====================
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log('📥 Received checkout request:', req.body);
    
    // Get data from request (using new field names)
    const { userId, email, fullName, amount, tokens, walletAddress } = req.body;
    
    // Validate required fields
    if (!userId || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, amount, tokens'
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://stipe-token-system.netlify.app';
    
    console.log(`💳 Creating Stripe checkout for ${tokens} tokens ($${amount})`);

    try {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${tokens} Tokens`,
                description: `Token purchase for ${fullName}`,
                metadata: {
                  userId: userId,
                  tokens: tokens.toString()
                }
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          }
        ],
        mode: 'payment',
        customer_email: email,
        client_reference_id: userId,
        success_url: `${frontendUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/index.html?error=cancelled`,
        metadata: {
          userId: userId,
          fullName: fullName,
          tokens: tokens.toString(),
          walletAddress: walletAddress || 'N/A'
        }
      });

      console.log('✅ Stripe session created:', session.id);

      // Create transaction record in MongoDB
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction = new Transaction({
        userId,
        transactionId,
        email: email,
        fullName: fullName || userId,
        amount: parseFloat(amount),
        tokens: parseInt(tokens),
        walletAddress: walletAddress || 'N/A',
        status: 'pending', // Will be updated when Stripe confirms
        paymentMethod: 'stripe',
        stripeSessionId: session.id // Store Stripe session ID for webhook matching
      });

      await transaction.save();
      
      console.log('✅ Transaction saved to MongoDB:', transactionId);

      // Return response with Stripe checkout URL
      res.json({
        success: true,
        message: 'Checkout session created',
        sessionId: session.id,
        checkoutUrl: session.url, // This is what frontend needs!
        transaction: {
          id: transactionId,
          userId,
          amount,
          tokens,
          status: 'pending'
        }
      });

    } catch (stripeError) {
      console.error('❌ Stripe API error:', stripeError);
      throw new Error(`Stripe error: ${stripeError.message}`);
    }

  } catch (error) {
    console.error('❌ Checkout session error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== CREATE PAYMENT INTENT ====================
exports.createPaymentIntent = async (req, res) => {
  try {
    const { userId, email, fullName, amount, tokens, walletAddress } = req.body;
    
    if (!userId || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: `Purchase of ${tokens} tokens`,
      metadata: {
        userId,
        fullName,
        tokens: tokens.toString(),
        email,
        walletAddress
      },
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      tokens: tokens
    });

  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET PAYMENT STATUS ====================
exports.getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    
    res.json({
      success: true,
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET SESSION DETAILS ====================
exports.getSessionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(id);
    
    // Update transaction status if payment was successful
    if (session.payment_status === 'paid') {
      await Transaction.updateOne(
        { stripeSessionId: session.id },
        { 
          status: 'completed',
          updatedAt: new Date()
        }
      );
      console.log('✅ Transaction updated to completed');
    }

    res.json({
      success: true,
      id: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('Get session details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== GET USER TRANSACTIONS ====================
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 });
    
    const totalTokens = transactions.reduce((sum, t) => sum + (t.tokens || 0), 0);
    const totalSpent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      success: true,
      userId,
      count: transactions.length,
      totalTokens,
      totalSpent,
      transactions
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== WEBHOOK HANDLER (OPTIONAL) ====================
// This handles Stripe webhooks to update transaction status
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.log('⚠️ Webhook secret not configured');
    return res.json({ received: true });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      console.log('✅ Payment completed! Session:', session.id);

      // Update transaction to completed
      const result = await Transaction.updateOne(
        { stripeSessionId: session.id },
        { 
          status: 'completed',
          updatedAt: new Date()
        }
      );

      console.log('Updated transactions:', result.modifiedCount);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

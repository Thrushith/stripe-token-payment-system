// ==================== PAYMENT CONTROLLER ====================
const tokenService = require('../services/tokenService');
const databaseService = require('../services/databaseService');

let stripe;
try {
  stripe = require('../config/stripe');
} catch (err) {
  console.error('Stripe config error:', err.message);
}

const logger = console;

exports.createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { tokenAmount, customerEmail, customerName, customWalletAddress, userId } = req.body;

    if (!tokenAmount || tokenAmount <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' });
    }
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email required' });
    }
    if (!customWalletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const pricePerToken = parseFloat(process.env.PRICE_PER_TOKEN) || 1;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    console.log(`Creating checkout session for ${tokenAmount} tokens`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Token Purchase',
            description: `${tokenAmount} Tokens for ${customerEmail}`,
          },
          unit_amount: Math.round(pricePerToken * 100),
        },
        quantity: parseInt(tokenAmount),
      }],
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${frontendUrl}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment-cancel.html`,
      metadata: {
        userId: userId || 'guest',
        walletAddress: customWalletAddress,
        tokenAmount: tokenAmount.toString(),
        customerEmail: customerEmail,
        customerName: customerName || 'Unknown',
      },
    });

    console.log(`✓ Checkout session created: ${session.id}`);

    await databaseService.savePendingTransaction({
      sessionId: session.id,
      userId,
      walletAddress: customWalletAddress,
      tokenAmount,
      amount: pricePerToken * tokenAmount,
      status: 'pending',
      customerEmail
    });

    res.json({ 
      sessionId: session.id,
      url: session.url,
      amount: pricePerToken * tokenAmount,
      tokenAmount: tokenAmount
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createPaymentIntent = async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    
    const { tokenAmount, customerEmail, customerName, customWalletAddress, userId } = req.body;
    if (!tokenAmount || tokenAmount <= 0) return res.status(400).json({ error: 'Invalid token amount' });

    const pricePerToken = parseFloat(process.env.PRICE_PER_TOKEN) || 1;
    const totalAmount = Math.round(tokenAmount * pricePerToken * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      description: `Purchase of ${tokenAmount} tokens`,
      metadata: { userId, customWalletAddress, tokenAmount: tokenAmount.toString(), customerEmail },
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount / 100,
      tokenAmount: tokenAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { paymentIntentId } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSessionDetails = async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      id: session.id,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total / 100,
      metadata: session.metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await databaseService.getUserTransactions(userId);
    
    res.json({
      userId,
      transactions,
      totalTokens: transactions.reduce((sum, t) => sum + (t.tokenAmount || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

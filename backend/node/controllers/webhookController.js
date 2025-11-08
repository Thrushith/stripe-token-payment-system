// ==================== WEBHOOK CONTROLLER ====================
// Complete Webhook Handler - Handles All Events

const tokenService = require('../services/tokenService');
const databaseService = require('../services/databaseService');

let stripe;
try {
  stripe = require('../config/stripe');
} catch (err) {
  console.error('Stripe config error:', err.message);
}

const logger = console;

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    logger.error('Stripe not configured');
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    logger.log(`✓ Webhook verified: ${event.type}`);
  } catch (err) {
    logger.error(`⚠️  Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error(`Error handling webhook: ${error.message}`);
    res.status(500).json({ error: 'Webhook handler error' });
  }
};

// ==================== CHECKOUT SESSION COMPLETED ====================
async function handleCheckoutSessionCompleted(session) {
  logger.log(`\n${'='.repeat(60)}`);
  logger.log('💰 PAYMENT SUCCESSFUL - CHECKOUT SESSION COMPLETED');
  logger.log(`${'='.repeat(60)}`);
  
  const {
    userId,
    walletAddress,
    tokenAmount,
    customerEmail,
    customerName
  } = session.metadata;

  const transactionData = {
    sessionId: session.id,
    paymentIntentId: session.payment_intent,
    userId,
    walletAddress,
    tokenAmount: parseInt(tokenAmount),
    amount: session.amount_total / 100,
    customerEmail,
    customerName,
    status: 'completed',
    paymentStatus: session.payment_status,
    timestamp: new Date()
  };

  logger.log(`User ID: ${userId}`);
  logger.log(`Wallet: ${walletAddress}`);
  logger.log(`Tokens: ${tokenAmount}`);
  logger.log(`Amount: $${transactionData.amount}`);
  logger.log(`Email: ${customerEmail}`);

  try {
    // 1. Credit tokens to user's wallet
    logger.log('\n📤 Crediting tokens to wallet...');
    await tokenService.creditTokens(userId, walletAddress, parseInt(tokenAmount));
    logger.log(`✓ Successfully credited ${tokenAmount} tokens`);

    // 2. Save transaction to database
    logger.log('\n💾 Saving transaction to database...');
    await databaseService.saveCompletedTransaction(transactionData);
    logger.log('✓ Transaction saved successfully');

    logger.log(`\n${'='.repeat(60)}`);
    logger.log('✅ PAYMENT PROCESSING COMPLETE');
    logger.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    logger.error('❌ Error processing payment:', error);
    await databaseService.flagTransactionForReview(transactionData, error.message);
  }
}

// ==================== PAYMENT INTENT SUCCEEDED ====================
async function handlePaymentIntentSucceeded(paymentIntent) {
  logger.log('Payment Intent succeeded:', paymentIntent.id);
  
  const {
    userId,
    walletAddress,
    tokenAmount,
    customerEmail
  } = paymentIntent.metadata;

  // Only process if not already handled by checkout.session.completed
  const existing = await databaseService.findTransactionByPaymentIntent(paymentIntent.id);
  if (existing) {
    logger.log('Transaction already processed via checkout session');
    return;
  }

  const transactionData = {
    paymentIntentId: paymentIntent.id,
    userId,
    walletAddress,
    tokenAmount: parseInt(tokenAmount),
    amount: paymentIntent.amount / 100,
    customerEmail,
    status: 'completed',
    timestamp: new Date()
  };

  try {
    await tokenService.creditTokens(userId, walletAddress, parseInt(tokenAmount));
    await databaseService.saveCompletedTransaction(transactionData);
    logger.log(`✓ Payment intent processed: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('Error processing payment intent:', error);
    await databaseService.flagTransactionForReview(transactionData, error.message);
  }
}

// ==================== PAYMENT FAILED ====================
async function handlePaymentIntentFailed(paymentIntent) {
  logger.error(`\n❌ PAYMENT FAILED: ${paymentIntent.id}`);
  
  const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';
  logger.error(`Error: ${errorMessage}`);
  
  const {
    userId,
    walletAddress,
    tokenAmount,
    customerEmail
  } = paymentIntent.metadata;

  await databaseService.saveFailedTransaction({
    paymentIntentId: paymentIntent.id,
    userId,
    walletAddress,
    tokenAmount,
    customerEmail,
    status: 'failed',
    errorMessage,
    timestamp: new Date()
  });
}

// ==================== CHARGE REFUNDED ====================
async function handleChargeRefunded(charge) {
  logger.log(`\n💸 REFUND PROCESSED: ${charge.id}`);
  logger.log(`Amount refunded: $${charge.amount_refunded / 100}`);
  
  // Find original transaction
  const transaction = await databaseService.findTransactionByChargeId(charge.id);
  
  if (transaction) {
    // Deduct tokens if they were already credited
    await tokenService.deductTokens(
      transaction.userId, 
      transaction.walletAddress, 
      transaction.tokenAmount
    );
    
    // Update transaction status
    await databaseService.updateTransactionStatus(transaction.id, 'refunded');
    
    logger.log(`✓ Tokens deducted and transaction updated`);
  }
}
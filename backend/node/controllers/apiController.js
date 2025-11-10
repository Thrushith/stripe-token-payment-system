const Transaction = require('../models/Transaction');

// GET /api/transactions
exports.getAllTransactions = async (req, res) => {
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
};

// GET /api/user/:userId/transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      userId: userId,
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
};

// GET /api/transaction/:transactionId
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

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
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/transaction/create
exports.createTransaction = async (req, res) => {
  try {
    const { userId, amount, tokens, walletAddress, paymentMethod } = req.body;
    
    if (!userId || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and tokens are required'
      });
    }

    const transactionId = `txn_${Date.now()}`;

    const transaction = new Transaction({
      userId,
      transactionId,
      amount: parseFloat(amount),
      tokens: parseInt(tokens),
      walletAddress: walletAddress || 'N/A',
      paymentMethod: paymentMethod || 'api',
      status: 'completed'
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction created successfully',
      transaction: transaction
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ==================== API CONTROLLER ====================
// Simple API endpoints for retrieving transaction data

const transactionService = require('../services/transactionService');

// GET /api/user/:userId/transactions
// Get all transactions for a user
exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const transactions = transactionService.getTransactionsByUserId(userId);
    
    res.json({
      success: true,
      userId: userId,
      count: transactions.length,
      transactions: transactions
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
};

// GET /api/transaction/:transactionId
// Get specific transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    const transaction = transactionService.getTransactionById(transactionId);
    
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
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
};

// GET /api/transactions
// Get all transactions (with optional filters)
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, limit } = req.query;
    
    let transactions = transactionService.getAllTransactions();
    
    // Filter by status if provided
    if (status) {
      transactions = transactions.filter(t => t.status === status);
    }
    
    // Limit results if provided
    if (limit) {
      transactions = transactions.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: transactions.length,
      transactions: transactions
    });

  } catch (error) {
    console.error('Error fetching all transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
};

// POST /api/transaction/create
// Create a test transaction (for demonstration)
exports.createTestTransaction = async (req, res) => {
  try {
    const { userId, amount, tokens, walletAddress } = req.body;
    
    if (!userId || !amount || !tokens) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and tokens are required'
      });
    }

    const transaction = {
      id: `txn_${Date.now()}`,
      userId: userId,
      amount: parseFloat(amount),
      tokens: parseInt(tokens),
      walletAddress: walletAddress || 'N/A',
      status: 'completed',
      timestamp: new Date().toISOString(),
      paymentMethod: 'test'
    };

    transactionService.saveTransaction(transaction);

    res.json({
      success: true,
      message: 'Transaction created successfully',
      transaction: transaction
    });

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
};

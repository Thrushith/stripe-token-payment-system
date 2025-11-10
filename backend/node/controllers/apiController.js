// ==================== API CONTROLLER ====================
// Simple API endpoints for retrieving transaction data

// In-memory storage for demo (replace with database in production)
let transactions = [
  {
    id: "txn_demo_001",
    userId: "user123",
    amount: 25.00,
    tokens: 25,
    walletAddress: "0xABC123...",
    status: "completed",
    timestamp: "2025-11-08T10:30:00Z",
    paymentMethod: "stripe"
  },
  {
    id: "txn_demo_002",
    userId: "user456",
    amount: 50.00,
    tokens: 50,
    walletAddress: "0xDEF456...",
    status: "completed",
    timestamp: "2025-11-08T11:15:00Z",
    paymentMethod: "stripe"
  }
];

// GET /api/user/:userId/transactions
exports.getUserTransactions = (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const userTransactions = transactions.filter(t => t.userId === userId);
    
    res.json({
      success: true,
      userId: userId,
      count: userTransactions.length,
      transactions: userTransactions
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
exports.getTransaction = (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    const transaction = transactions.find(t => t.id === transactionId);
    
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

// GET /api/transactions
exports.getAllTransactions = (req, res) => {
  try {
    const { status, limit } = req.query;
    
    let results = [...transactions];
    
    // Filter by status if provided
    if (status) {
      results = results.filter(t => t.status === status);
    }
    
    // Limit results if provided
    if (limit) {
      results = results.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: results.length,
      transactions: results
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
exports.createTransaction = (req, res) => {
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
      paymentMethod: 'api'
    };

    transactions.push(transaction);

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

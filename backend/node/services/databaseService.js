// ==================== DATABASE SERVICE ====================
// Complete Database Service - In-Memory Storage for Demo

const logger = console;
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo purposes
// In production, replace with actual database (PostgreSQL, MongoDB, etc.)
const transactions = [];
const pendingTransactions = [];

class DatabaseService {
  
  // ==================== SAVE PENDING TRANSACTION ====================
  async savePendingTransaction(data) {
    try {
      const transaction = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        status: 'pending'
      };
      
      pendingTransactions.push(transaction);
      logger.log(`✓ Pending transaction saved: ${transaction.id}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error saving pending transaction:', error);
      throw error;
    }
  }
  
  // ==================== SAVE COMPLETED TRANSACTION ====================
  async saveCompletedTransaction(data) {
    try {
      const transaction = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        status: 'completed'
      };
      
      transactions.push(transaction);
      
      // Remove from pending if exists
      const pendingIndex = pendingTransactions.findIndex(
        t => t.sessionId === data.sessionId
      );
      if (pendingIndex > -1) {
        pendingTransactions.splice(pendingIndex, 1);
      }
      
      logger.log(`✓ Transaction saved: ${transaction.id}`);
      logger.log(`Total completed transactions: ${transactions.length}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error saving transaction:', error);
      throw error;
    }
  }
  
  // ==================== SAVE FAILED TRANSACTION ====================
  async saveFailedTransaction(data) {
    try {
      const transaction = {
        id: uuidv4(),
        ...data,
        createdAt: new Date(),
        status: 'failed'
      };
      
      transactions.push(transaction);
      logger.log(`✓ Failed transaction saved: ${transaction.id}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error saving failed transaction:', error);
      throw error;
    }
  }
  
  // ==================== GET USER TRANSACTIONS ====================
  async getUserTransactions(userId) {
    try {
      const userTransactions = transactions.filter(t => t.userId === userId);
      return userTransactions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      logger.error('Error getting user transactions:', error);
      return [];
    }
  }
  
  // ==================== FIND TRANSACTION BY PAYMENT INTENT ====================
  async findTransactionByPaymentIntent(paymentIntentId) {
    try {
      return transactions.find(t => t.paymentIntentId === paymentIntentId);
    } catch (error) {
      logger.error('Error finding transaction:', error);
      return null;
    }
  }
  
  // ==================== FIND TRANSACTION BY CHARGE ID ====================
  async findTransactionByChargeId(chargeId) {
    try {
      // In real implementation, you'd query by charge ID
      return transactions.length > 0 ? transactions[transactions.length - 1] : null;
    } catch (error) {
      logger.error('Error finding transaction:', error);
      return null;
    }
  }
  
  // ==================== UPDATE TRANSACTION STATUS ====================
  async updateTransactionStatus(transactionId, status) {
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        transaction.status = status;
        transaction.updatedAt = new Date();
        logger.log(`✓ Transaction ${transactionId} updated to ${status}`);
      }
      return transaction;
    } catch (error) {
      logger.error('Error updating transaction:', error);
      throw error;
    }
  }
  
  // ==================== FLAG TRANSACTION FOR REVIEW ====================
  async flagTransactionForReview(transactionData, errorMessage) {
    try {
      const transaction = {
        id: uuidv4(),
        ...transactionData,
        status: 'needs_review',
        errorMessage,
        flaggedAt: new Date(),
        createdAt: new Date()
      };
      
      transactions.push(transaction);
      logger.error(`⚠️  Transaction flagged for review: ${transaction.id}`);
      logger.error(`Error: ${errorMessage}`);
      
      return transaction;
    } catch (error) {
      logger.error('Error flagging transaction:', error);
      throw error;
    }
  }
  
  // ==================== GET ALL TRANSACTIONS (FOR ADMIN) ====================
  async getAllTransactions() {
    try {
      return transactions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      logger.error('Error getting all transactions:', error);
      return [];
    }
  }
  
  // ==================== GET TRANSACTION STATS ====================
  async getStats() {
    try {
      const completed = transactions.filter(t => t.status === 'completed');
      const failed = transactions.filter(t => t.status === 'failed');
      const pending = pendingTransactions.length;
      
      const totalRevenue = completed.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalTokens = completed.reduce((sum, t) => sum + (t.tokenAmount || 0), 0);
      
      return {
        totalTransactions: transactions.length,
        completed: completed.length,
        failed: failed.length,
        pending,
        totalRevenue,
        totalTokens
      };
    } catch (error) {
      logger.error('Error getting stats:', error);
      return {};
    }
  }
}

module.exports = new DatabaseService();
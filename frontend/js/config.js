// ==================== FRONTEND CONFIGURATION ====================
// Configuration file for payment system

const CONFIG = {
    API_URL: 'https://stripe-token-payment-system-production.up.railway.app',
    PRICE_PER_TOKEN: 1,
    ENDPOINTS: {
        CREATE_CHECKOUT: '/api/create-checkout-session',
        PAYMENT_STATUS: '/api/payment-status',
        GET_TRANSACTIONS: '/api/user/{userId}/transactions',
        CREATE_TRANSACTION: '/api/transaction/create'
    }
};

// Validate configuration on load
if (!CONFIG.API_URL) {
    console.error('❌ API_URL not configured');
}

console.log('✓ Config loaded:', CONFIG);
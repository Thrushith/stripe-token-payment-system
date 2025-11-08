// ==================== FRONTEND CONFIGURATION ====================
// Configuration file for payment system

const CONFIG = {
    // Backend API URL - Change this to your deployed backend URL in production
    API_URL: 'https://stripe-token-payment-system-production.up.railway.app',
    
    // Price per token (should match backend)
    PRICE_PER_TOKEN: 1,
    
    // API Endpoints
    ENDPOINTS: {
        CREATE_CHECKOUT: '/api/create-checkout-session',
        CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
        PAYMENT_STATUS: '/api/payment-status',
        SESSION_DETAILS: '/api/session'
    }
};

// Validate configuration on load
if (!CONFIG.API_URL) {
    console.error('❌ API_URL not configured');
}

console.log('✓ Config loaded:', CONFIG);
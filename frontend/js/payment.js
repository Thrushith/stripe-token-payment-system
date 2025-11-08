// ==================== PAYMENT HANDLER ====================
// Handles token purchase flow

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing payment form...');
    initializePaymentForm();
});

// ==================== INITIALIZE PAYMENT FORM ====================
function initializePaymentForm() {
    const form = document.getElementById('tokenPurchaseForm');
    const tokenAmountInput = document.getElementById('tokenAmount');
    const buyButton = document.getElementById('buyTokensBtn');
    
    console.log('Initializing payment form...');
    
    // Update total when token amount changes
    if (tokenAmountInput) {
        tokenAmountInput.addEventListener('input', updateTotal);
        updateTotal(); // Initial calculation
        console.log('Token amount listener added');
    }
    
    // Handle form submission
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        console.log('Form submission listener added');
    }
}

// ==================== UPDATE TOTAL AMOUNT ====================
function updateTotal() {
    const tokenAmount = parseInt(document.getElementById('tokenAmount').value) || 0;
    const pricePerToken = CONFIG.PRICE_PER_TOKEN;
    const total = tokenAmount * pricePerToken;
    
    document.getElementById('totalAmount').textContent = total.toFixed(2);
    document.getElementById('displayTokens').textContent = tokenAmount;
    
    console.log(`Total updated: ${tokenAmount} tokens × $${pricePerToken} = $${total.toFixed(2)}`);
}

// ==================== HANDLE FORM SUBMISSION ====================
async function handleFormSubmit(event) {
    event.preventDefault();
    console.log('Form submitted!');
    
    // Get form data
    const formData = {
        customerName: document.getElementById('customerName').value.trim(),
        customerEmail: document.getElementById('customerEmail').value.trim(),
        userId: document.getElementById('userId').value.trim(),
        customWalletAddress: document.getElementById('customWalletAddress').value.trim(),
        tokenAmount: parseInt(document.getElementById('tokenAmount').value)
    };
    
    console.log('Form data:', formData);
    
    // Validate
    if (!validateFormData(formData)) {
        return;
    }
    
    // Show loading
    showLoading(true);
    hideError();
    
    try {
        await createCheckoutSession(formData);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred. Please try again.');
        showLoading(false);
    }
}

// ==================== VALIDATE FORM DATA ====================
function validateFormData(data) {
    console.log('Validating form data...');
    
    if (!data.customerName) {
        showError('Please enter your name');
        return false;
    }
    
    if (!data.customerEmail || !isValidEmail(data.customerEmail)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if (!data.userId) {
        showError('Please enter your user ID');
        return false;
    }
    
    if (!data.customWalletAddress) {
        showError('Please enter your wallet address');
        return false;
    }
    
    if (!data.tokenAmount || data.tokenAmount <= 0) {
        showError('Please enter a valid token amount');
        return false;
    }
    
    console.log('✓ Form validation passed');
    return true;
}

// ==================== EMAIL VALIDATION ====================
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==================== CREATE CHECKOUT SESSION ====================
async function createCheckoutSession(data) {
    console.log('Creating checkout session...');
    console.log('Sending data to backend:', data);
    
    try {
        const url = `${CONFIG.API_URL}${CONFIG.ENDPOINTS.CREATE_CHECKOUT}`;
        console.log('POST to:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create checkout session');
        }
        
        const result = await response.json();
        console.log('Checkout session created:', result);
        
        // Redirect to Stripe Checkout
        if (result.url) {
            console.log('Redirecting to Stripe Checkout...');
            window.location.href = result.url;
        } else {
            throw new Error('No checkout URL received');
        }
        
    } catch (error) {
        console.error('Checkout session error:', error);
        throw error;
    }
}

// ==================== CREATE PAYMENT INTENT (ALTERNATIVE) ====================
// This is an alternative approach if you want to use Payment Intent instead of Checkout
async function createPaymentIntent(data) {
    console.log('Creating payment intent...');
    
    try {
        const url = `${CONFIG.API_URL}${CONFIG.ENDPOINTS.CREATE_PAYMENT_INTENT}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const result = await response.json();
        console.log('Payment intent created:', result);
        
        return result;
        
    } catch (error) {
        console.error('Payment intent error:', error);
        throw error;
    }
}

// ==================== CHECK PAYMENT STATUS ====================
async function checkPaymentStatus(paymentIntentId) {
    try {
        const url = `${CONFIG.API_URL}${CONFIG.ENDPOINTS.PAYMENT_STATUS}/${paymentIntentId}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Failed to check payment status');
        }
        
        const result = await response.json();
        console.log('Payment status:', result);
        
        return result;
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        throw error;
    }
}

// ==================== UI HELPERS ====================
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const buyButton = document.getElementById('buyTokensBtn');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'block' : 'none';
    }
    
    if (buyButton) {
        buyButton.disabled = show;
        buyButton.textContent = show ? '⏳ Processing...' : '🛒 Proceed to Payment';
    }
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Scroll to error
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    console.error('Error shown to user:', message);
}

function hideError() {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// ==================== DEMO HELPERS ====================
// Quick fill form with test data for demo purposes
function fillTestData() {
    document.getElementById('customerName').value = 'John Doe';
    document.getElementById('customerEmail').value = '[email protected]';
    document.getElementById('userId').value = 'user_12345';
    document.getElementById('customWalletAddress').value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    document.getElementById('tokenAmount').value = 100;
    updateTotal();
    console.log('Test data filled!');
}

// Make it available in console during demo
console.log('💡 Demo tip: Type fillTestData() in console to auto-fill form with test data');
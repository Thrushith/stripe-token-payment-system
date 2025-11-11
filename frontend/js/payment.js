// ==================== PAYMENT HANDLER ====================
// Handles token purchase flow - Updated for MongoDB backend


// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing payment form...');
    console.log('API URL:', CONFIG.API_URL);
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
        fullName: document.getElementById('customerName').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        userId: document.getElementById('userId').value.trim(),
        walletAddress: document.getElementById('customWalletAddress').value.trim(),
        tokens: parseInt(document.getElementById('tokenAmount').value),
        amount: (parseInt(document.getElementById('tokenAmount').value) || 0) * CONFIG.PRICE_PER_TOKEN
    };
    
    console.log('Form data to send:', formData);
    
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
    
    if (!data.fullName) {
        showError('Please enter your name');
        return false;
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    if (!data.userId) {
        showError('Please enter your user ID');
        return false;
    }
    
    if (!data.walletAddress) {
        showError('Please enter your wallet address');
        return false;
    }
    
    if (!data.tokens || data.tokens <= 0) {
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
        console.log('CORS enabled for:', CONFIG.API_URL);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // credentials: 'include',
            body: JSON.stringify({
                userId: data.userId,
                email: data.email,
                fullName: data.fullName,
                amount: data.amount,
                tokens: data.tokens,
                walletAddress: data.walletAddress
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Backend error:', errorData);
            throw new Error(errorData.error || `Failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Checkout session created:', result);
        
        // Show success message
        if (result.success) {
            // Option 1: Redirect to success page
            if (result.url) {
                console.log('Redirecting to:', result.url);
                window.location.href = result.url;
            } else {
                // Option 2: Show success and redirect after 2 seconds
                showSuccess(`✅ Payment successful! Transaction ID: ${result.transaction.id}`);
                setTimeout(() => {
                    window.location.href = 'payment-success.html?session_id=' + result.transaction.id;
                }, 2000);
            }
        } else {
            throw new Error(result.error || 'Payment processing failed');
        }
        
    } catch (error) {
        console.error('❌ Checkout session error:', error);
        throw error;
    }
}


// ==================== CREATE PAYMENT INTENT (ALTERNATIVE) ====================
// This is an alternative approach if you want to use Payment Intent instead of Checkout
async function createPaymentIntent(data) {
    console.log('Creating payment intent...');
    
    try {
        const url = `${CONFIG.API_URL}${CONFIG.ENDPOINTS.CREATE_PAYMENT_INTENT || '/api/create-payment-intent'}`;
        
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
        const url = `${CONFIG.API_URL}/api/transaction/${paymentIntentId}`;
        
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
        errorElement.style.color = 'red';
        
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


function showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.style.color = 'green';
        
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    console.log('Success message:', message);
}


// ==================== DEMO HELPERS ====================
// Quick fill form with test data for demo purposes
function fillTestData() {
    document.getElementById('customerName').value = 'John Doe';
    document.getElementById('customerEmail').value = 'john@example.com';
    document.getElementById('userId').value = 'user_12345';
    document.getElementById('customWalletAddress').value = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    document.getElementById('tokenAmount').value = 100;
    updateTotal();
    console.log('✅ Test data filled! Ready to test payment.');
}


// Log configuration on page load
console.log('🚀 Payment system initialized');
console.log('📍 API Endpoint:', CONFIG.API_URL);
console.log('💡 Demo tip: Type fillTestData() in console to auto-fill form with test data');

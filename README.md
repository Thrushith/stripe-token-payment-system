# 🪙 Stripe Token Payment System - Complete Setup Guide

**Developer:** Thrushith  
**Created:** November 2025  
**Status:** ✅ Production Ready

---

## 📋 Project Overview

This is a **centralized token payment system** that allows customers to purchase tokens using Stripe without requiring MetaMask or any cryptocurrency wallet. The system features:

- ✅ Secure credit/debit card payments via Stripe
- ✅ Centralized wallet management (encrypted)
- ✅ Automatic token distribution after payment verification
- ✅ Webhook integration for real-time payment processing
- ✅ Complete transaction history and logging
- ✅ Beautiful, responsive UI
- ✅ Production-ready backend with error handling

---

## 🏗️ Project Structure

```
stripe-token-payment-system/
├── backend/
│   └── node/
│       ├── server.js                          # Main Express server
│       ├── package.json                       # Node dependencies
│       ├── .env                               # Environment configuration
│       ├── config/
│       │   └── stripe.js                      # Stripe SDK setup
│       ├── controllers/
│       │   ├── paymentController.js           # Payment endpoints
│       │   └── webhookController.js           # Webhook handlers
│       ├── services/
│       │   ├── tokenService.js                # Token distribution
│       │   └── databaseService.js             # Transaction storage
│       └── utils/
│           └── logger.js                      # Logging utility
├── frontend/
│   ├── index.html                             # Main purchase page
│   ├── payment-success.html                   # Success confirmation
│   ├── payment-cancel.html                    # Cancellation page
│   ├── css/
│   │   └── styles.css                         # Styling & layout
│   └── js/
│       ├── config.js                          # Frontend configuration
│       └── payment.js                         # Payment logic
└── README.md                                  # This file
```

---

## 📦 Prerequisites

Before running this project, ensure you have installed:

1. **Node.js** (v16+) - Download from https://nodejs.org
2. **Stripe Account** (Free) - Sign up at https://stripe.com
3. **Stripe CLI** - For webhook testing
4. **Git** - For version control
5. **Python** (v3+) - For running the frontend server (or use Node.js http-server)

---

## 🚀 Quick Start Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/Thrushith/stripe-token-payment-system.git
```
### Step 2: Install Backend Dependencies

```bash
cd backend/node
npm install
```

This installs:
- express (web framework)
- stripe (Stripe SDK)
- cors (cross-origin requests)
- body-parser (request parsing)
- dotenv (environment variables)
- uuid (unique IDs)
- nodemon (auto-reload for development)

### Step 3: Configure Stripe Keys

#### 3a. Get Your Stripe Test Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret Key** (starts with `sk_test_...`)
3. Copy your **Publishable Key** (starts with `pk_test_...`)

#### 3b. Create .env File

In `backend/node/` folder, create a file named `.env`:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_PUBLISHABLE_KEY_HERE
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PRICE_PER_TOKEN=1
```

**Replace the keys with your actual Stripe keys!**

### Step 4: Get Webhook Secret

Open a **new terminal** in `backend/node/` folder:

```bash
stripe listen --forward-to localhost:4000/api/webhook
```

You'll see:
```
> Ready! Your webhook signing secret is whsec_test_abc123...
```

**Copy the webhook secret** and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_test_abc123...
```

---

## 🎮 Running the System

You need to run **3 services in separate terminal windows**:

### Terminal 1: Start Backend Server

```bash
cd backend/node
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 4000
✅ Server ready!
```

### Terminal 2: Start Webhook Listener

```bash
cd backend/node
stripe listen --forward-to localhost:4000/api/webhook
```

**Expected Output:**
```
> Ready! Your webhook signing secret is whsec_...
> Forwarding events to http://localhost:4000/api/webhook
```

### Terminal 3: Start Frontend Server

**Option A: Using Python (Recommended)**
```bash
cd frontend
python -m http.server 3000
```

**Option B: Using Node.js**
```bash
cd frontend
npx http-server -p 3000
```

**Expected Output:**
```
HTTP server is listening on port 3000
```

---

## 🌐 Access the Application

Once all three terminals are running:

1. **Open Browser:** http://localhost:3000
2. **You should see:** Beautiful token purchase form
3. **Backend Health Check:** http://localhost:4000/health

---

## 🧪 Testing the Payment Flow

### Step 1: Fill Out the Form

```
Full Name: John Doe
Email: test@example.com
User ID: user_12345
Wallet Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Token Amount: 100
```

### Step 2: Click "Proceed to Payment"

You'll be redirected to Stripe's secure checkout page.

### Step 3: Use Test Card

Use this test card (no real money charged):
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (or any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any ZIP)
```

### Step 4: Complete Payment

Click "Pay $100.00"

### Step 5: Verify Success

**You should see:**
1. ✅ Redirected to success page
2. ✅ Session ID displayed
3. ✅ Backend terminal shows payment logs:
   ```
   💰 PAYMENT SUCCESSFUL
   User ID: user_12345
   Wallet: 0x742d35...
   Tokens: 100
   ✓ Successfully credited 100 tokens
   ```

---

## 📊 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/api/create-checkout-session` | POST | Create Stripe checkout |
| `/api/create-payment-intent` | POST | Create payment intent |
| `/api/payment-status/:id` | GET | Check payment status |
| `/api/session/:id` | GET | Get session details |
| `/api/transactions/:userId` | GET | Get user transactions |
| `/api/webhook` | POST | Stripe webhook receiver |

---

## 👤 Developer

**Name:** Thrushith  
**Project:** Stripe Token Payment System with Centralized Wallets  
**Completed:** November 2025  
**Status:** ✅ Ready for Demonstration

---

## 📄 License

MIT License - Free to use and modify

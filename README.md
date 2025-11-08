Stripe Token Payment System
A centralized payment solution for token purchases using Stripe. No MetaMask, no crypto wallet needed - just a credit card.

What This Project Does
I built this to solve a real problem: how do you let customers buy tokens without forcing them to use MetaMask or understand blockchain wallets?

This system:

Lets customers buy tokens with a credit/debit card

Processes payments securely through Stripe

Automatically credits tokens to a centralized wallet

Handles everything without requiring blockchain knowledge from the user

How It Works
Customer fills out a form with how many tokens they want

They get redirected to Stripe to pay

After payment, tokens are automatically added to their wallet

Done. Simple as that.

The backend handles all the Stripe stuff - webhooks, payment verification, and token distribution. The frontend is just a clean form that does the job.

Tech Stack
Backend: Node.js, Express, Stripe API
Frontend: HTML, CSS, Vanilla JavaScript
Main Libraries:

stripe (payment processing)

express (web server)

cors (cross-origin requests)

dotenv (environment config)

Getting Started
Prerequisites
Node.js installed

Stripe account (free)

Stripe CLI for webhook testing

Installation
Clone the repo

bash
git clone https://github.com/Thrushith/stripe-token-payment-system.git
cd stripe-token-payment-system
Install dependencies

bash
cd backend/node
npm install
Create .env file with your Stripe keys

text
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
PORT=4000
FRONTEND_URL=http://localhost:3000
PRICE_PER_TOKEN=1
Running the Project
You need to start 3 things:

Terminal 1 - Backend Server:

bash
cd backend/node
npm run dev
Terminal 2 - Webhook Listener:

bash
cd backend/node
stripe listen --forward-to localhost:4000/api/webhook
Terminal 3 - Frontend:

bash
cd frontend
python -m http.server 3000
Then open: http://localhost:3000

Testing
Use Stripe's test cards:

4242 4242 4242 4242 - Success

4000 0000 0000 0002 - Declined

4000 0025 0000 3155 - Requires authentication

Expiry: any future date
CVC: any 3 digits

Project Structure
text
backend/node/
├── server.js              # Main server
├── controllers/           # Payment logic
├── services/              # Token distribution
├── config/                # Stripe setup
└── utils/                 # Logging

frontend/
├── index.html             # Main page
├── payment-success.html   # Success page
├── payment-cancel.html    # Cancel page
├── css/styles.css         # Styling
└── js/                    # Frontend logic
How Payments Work
Customer submits payment form

Frontend sends wallet address + token amount to backend

Backend creates Stripe checkout session with this data

Customer pays on Stripe's secure page

Stripe tells our backend "payment received" via webhook

Backend credits tokens to the wallet

Customer sees success page

Key Features
Secure payment processing with Stripe

Real-time webhook handling for payment verification

Clean, responsive UI

Complete error handling

Transaction history tracking

Works without any blockchain knowledge required

Troubleshooting
Can't access frontend?

Make sure Terminal 3 is running

Check http://localhost:3000

Payment not working?

Verify Stripe keys in .env

Restart backend after updating .env

Check webhook listener is running

Backend errors?

Check all files in backend/node/controllers/ and backend/node/services/ exist

Run npm install again

Check .env has all required variables

What I Learned
Working on this taught me a lot about:

Integrating third-party payment systems

Webhook verification and security

Managing API keys safely

Building a complete full-stack application

Error handling in production code

Future Improvements
Things I'd add with more time:

Database integration instead of in-memory storage

Email notifications for transactions

Admin dashboard to view all payments

Subscription support

Refund processing

Notes
This is a demo/educational project. For production use:

Switch to a real database (PostgreSQL/MongoDB)

Use HTTPS everywhere

Add more security measures

Set up monitoring and alerts

Integrate with actual token system

Author
Thrushith - November 2025

Built as a solution to simplify token purchases without requiring blockchain expertise from end users.

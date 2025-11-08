#!/bin/bash
cd backend/node
npm run dev
stripe listen --forward-to localhost:4000/api/webhook
cd ..
cd ..
cd frontend
npx http-server -p 3000

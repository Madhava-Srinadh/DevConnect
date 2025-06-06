// src/utils/constants.js (or similar)

// This will be picked up from Render's environment variables in production,
// and from your .env.development file (if you have one) in local dev.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Your Razorpay Key ID
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID; // Assuming you want this on the client

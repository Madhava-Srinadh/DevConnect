// models/payment.js

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentId: {
      // This will store the actual Razorpay payment ID (e.g., 'pay_xxxxxxxxxxxxxx')
      type: String,
    },
    orderId: {
      // This is the Razorpay Order ID (e.g., 'order_xxxxxxxxxxxxxx')
      type: String,
      required: true,
      unique: true, // Ensure order IDs are unique in your DB
    },
    status: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    notes: {
      // It's good to keep these flexible or define them clearly
      firstName: { type: String },
      lastName: { type: String },
      emailId: { type: String },
      membershipType: { type: String }, // e.g., "silver", "gold"
      upgradeFrom: { type: String }, // For upgrade payments, e.g., "silver"
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

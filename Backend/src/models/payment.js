const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentId: String,
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
    },
    amount: Number,
    currency: String,
    receipt: String,
    notes: {
      firstName: String,
      lastName: String,
      emailId: String,
      membershipType: String,
      upgradeFrom: String,

      // 🔥 premium request metadata
      requestType: String,
      toUserId: String,
      purpose: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);

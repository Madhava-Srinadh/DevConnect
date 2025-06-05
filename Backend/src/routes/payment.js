// routes/paymentRouter.js

const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

// ─── CREATE A NEW MEMBERSHIP ORDER (SILVER OR GOLD) ───────────────────────────
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body; // "silver" or "gold"
    const { firstName, lastName, emailId } = req.user;

    // 1. create an order for FULL membershipAmount[silver|gold]
    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100, // in paise
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType, // save requested type
      },
    });

    // 2. persist it
    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    // 3. return order details + keyId
    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ─── UPGRADE FROM SILVER → GOLD (CHARGE ONLY THE DIFFERENCE) ────────────────────
paymentRouter.post("/payment/upgrade", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Only silver members can upgrade
    if (!user.isPremium || user.membershipType !== "silver") {
      return res
        .status(400)
        .json({ msg: "Upgrade only allowed for existing silver members." });
    }

    // Calculate difference: gold amount – silver amount
    const upgradeAmount = membershipAmount.gold - membershipAmount.silver;
    if (upgradeAmount <= 0) {
      return res
        .status(400)
        .json({ msg: "No upgrade available or amounts misconfigured." });
    }

    const { firstName, lastName, emailId } = req.user;

    // 1. create a new Razorpay order for the difference
    const order = await razorpayInstance.orders.create({
      amount: upgradeAmount * 100, // in paise
      currency: "INR",
      receipt: "upgrade_receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: "gold", // denote target type
        upgradeFrom: "silver",
      },
    });

    // 2. persist upgrade payment record
    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    // 3. return order + keyId
    return res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ─── RAZORPAY WEBHOOK HANDLER ─────────────────────────────────────────────────
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    console.log("Webhook Called");
    const webhookSignature = req.get("X-Razorpay-Signature");
    console.log("Webhook Signature", webhookSignature);

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      console.log("Invalid Webhook Signature");
      return res.status(400).json({ msg: "Webhook signature is invalid" });
    }
    console.log("Valid Webhook Signature");

    // ─── Update payment status ───────────────────────────────
    const paymentDetails = req.body.payload.payment.entity;
    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    if (!payment) {
      return res.status(404).json({ msg: "Payment record not found" });
    }

    payment.status = paymentDetails.status;
    await payment.save();
    console.log("Payment updated in DB");

    // ─── If captured, mark user as premium (or upgrade) ──────
    if (paymentDetails.status === "captured") {
      const user = await User.findById(payment.userId);
      user.isPremium = true;
      user.membershipType = payment.notes.membershipType;
      await user.save();
      console.log("User upgraded to:", user.membershipType);
    }

    // Respond back to Razorpay
    return res.status(200).json({ msg: "Webhook received successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// ─── CHECK PREMIUM STATUS ───────────────────────────────────────
paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user.toJSON();
  return res.json({ ...user });
});

module.exports = paymentRouter;

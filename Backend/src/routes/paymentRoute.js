// routes/paymentRouter.js

const express = require("express");
const { userAuth } = require("../middlewares/auth"); // Assuming userAuth populates req.user with user details
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmount } = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

// --- CREATE A NEW MEMBERSHIP ORDER (SILVER OR GOLD) ───────────────────────────
paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body; // "silver" or "gold"
    const { firstName, lastName, emailId, _id: userId } = req.user; // Get user ID from req.user

    // Validate membershipType
    if (!["silver", "gold"].includes(membershipType)) {
      return res.status(400).json({ msg: "Invalid membership type." });
    }

    // Check if user is already premium of the requested type
    const currentUser = await User.findById(userId);
    if (
      currentUser &&
      currentUser.isPremium &&
      currentUser.membershipType === membershipType
    ) {
      return res
        .status(400)
        .json({ msg: `You are already a ${membershipType} member.` });
    }
    // Prevent buying gold if already silver (should use upgrade route instead)
    if (
      currentUser &&
      currentUser.isPremium &&
      currentUser.membershipType === "silver" &&
      membershipType === "gold"
    ) {
      return res.status(400).json({
        msg: "Please use the upgrade option to go from Silver to Gold.",
      });
    }

    // 1. Create a Razorpay order for the full membership amount
    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100, // in paise
      currency: "INR",
      receipt: `receipt_membership_${Date.now()}`, // Unique receipt ID
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType, // Save requested type
      },
    });

    // 2. Persist the payment record in your database
    const payment = new Payment({
      userId: userId, // Use userId from req.user
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    // 3. Return order details + keyId to the frontend
    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// --- UPGRADE FROM SILVER → GOLD (CHARGE ONLY THE DIFFERENCE) ────────────────────
paymentRouter.post("/payment/upgrade", userAuth, async (req, res) => {
  try {
    const { _id: userId, firstName, lastName, emailId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

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

    // 1. Create a new Razorpay order for the difference
    const order = await razorpayInstance.orders.create({
      amount: upgradeAmount * 100, // in paise
      currency: "INR",
      receipt: `receipt_upgrade_${Date.now()}`, // Unique receipt ID for upgrade
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: "gold", // Denote target type
        upgradeFrom: "silver", // Denote original type
      },
    });

    // 2. Persist upgrade payment record
    const payment = new Payment({
      userId: userId,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    // 3. Return order + keyId
    return res.json({
      ...savedPayment.toJSON(),
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// --- RAZORPAY WEBHOOK HANDLER ─────────────────────────────────────────────────
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");

    // Validate the webhook signature
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      return res.status(400).json({ msg: "Webhook signature is invalid" });
    }

    // Extract payment details from the webhook payload
    const paymentEntity = req.body.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentStatus = paymentEntity.status; // 'captured', 'failed', etc.
    const razorpayPaymentId = paymentEntity.id; // Razorpay's unique payment ID

    // Find the corresponding payment record in your DB
    const payment = await Payment.findOne({ orderId: orderId });
    if (!payment) {
      // It's crucial to return 200 OK to Razorpay even if you don't find the order
      // to prevent it from retrying.
      return res
        .status(200)
        .json({ msg: "Payment record not found, but webhook acknowledged." });
    }

    // Update the payment record in your DB
    payment.status = paymentStatus;
    payment.paymentId = razorpayPaymentId; // Save the actual Razorpay payment ID
    await payment.save();
    if (
      paymentStatus === "captured" &&
      payment.notes.requestType === "PAY_REQUEST"
    ) {
      const ConnectionRequest = require("../models/connectionRequest");
      console.log("Creating premium connection request from webhook");
      await ConnectionRequest.create({
        fromUserId: payment.userId,
        toUserId: payment.notes.toUserId,
        status: "interested",
        requestType: "premium",
        purpose: payment.notes.purpose,
      });
    }

    // If payment is captured, update the user's premium status and membership type
    if (paymentStatus === "captured") {
      const user = await User.findById(payment.userId);
      if (!user) {
        return res
          .status(200)
          .json({ msg: "User not found, but webhook acknowledged." });
      }

      user.isPremium = true;
      // Use the membershipType from the notes that was saved during order creation
      user.membershipType = payment.notes.membershipType;
      await user.save();
    } else if (paymentStatus === "failed") {
      // Optionally handle failed payments: e.g., send email to user
    }

    // Return success response to Razorpay
    return res
      .status(200)
      .json({ msg: "Webhook received and processed successfully" });
  } catch (err) {
    // Even on error, return 200 to Razorpay to prevent excessive retries.
    return res
      .status(200)
      .json({ msg: "Error processing webhook, but acknowledged." });
  }
});

// --- CHECK PREMIUM STATUS ───────────────────────────────────────
paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  // req.user should already be populated by userAuth middleware
  const userDetails = {
    _id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    emailId: req.user.emailId,
    isPremium: req.user.isPremium || false, // Ensure it's a boolean
    membershipType: req.user.membershipType || null, // Ensure it's null if not set
  };
  return res.json(userDetails);
});

// ---Premium Request  ───────────────────────────────────────
paymentRouter.post("/payment/request", userAuth, async (req, res) => {
  const { toUserId, purpose } = req.body;
  const amount = 50;

  if (!purpose || purpose.trim().length < 5) {
    return res.status(400).json({ msg: "Purpose required" });
  }

  const order = await razorpayInstance.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_request_${Date.now()}`,
    notes: {
      requestType: "PAY_REQUEST",
      toUserId,
      purpose,
      userId: req.user._id.toString(),
    },
  });

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order.id,
    status: order.status,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    notes: order.notes,
  });

  res.json({ ...payment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
});



module.exports = paymentRouter;

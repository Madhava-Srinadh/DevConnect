const express = require("express");
const paymentRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const instance = require("../utils/razorpay");

paymentRouter.post("/createOrder", userAuth, async (req, res) => {
  try {
    const user = req.user;

    const options = {
      amount: user.membershipType === "silver" ? 50000 : 90000,
      currency: "INR",
      receipt: `receipt_${user._id}`,
      notes: {
        firstName: user.firstName,
        lastName: user.lastName,
        membershipType: user.membershipType === "silver" ? "silver" : "gold",
      },
    };

    const order = await instance.orders.create(options);
    res.json({ order });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

paymentRouter.post("/upgrade", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.membershipType === "silver") {
      const order = await instance.orders.create({
        amount: 40000, // Difference between gold and silver
        currency: "INR",
        receipt: `receipt_${user._id}_upgrade`,
        notes: {
          firstName: user.firstName,
          lastName: user.lastName,
          membershipType: "gold",
        },
      });
      res.json({ order });
    } else {
      res.status(400).json({ message: "Invalid upgrade request" });
    }
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

paymentRouter.post("/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const user = req.user;

    const crypto = require("crypto");
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const membershipType =
        user.membershipType === "silver" ? "gold" : "silver";
      await User.findByIdAndUpdate(user._id, { membershipType });
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = paymentRouter;

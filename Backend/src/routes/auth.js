const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user"); // Assuming your User model is correctly imported and defines getJWT() and validatePassword()
const bcrypt = require("bcrypt"); // Assuming bcrypt is used for password hashing

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req); // Assuming this throws if invalid
    const { firstName, lastName, emailId, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();

    // --- FIX HERE: Add secure and sameSite attributes ---
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours expiry
      httpOnly: true, // Recommended for security
      secure: true, // IMPORTANT: Only send over HTTPS
      sameSite: "none", // IMPORTANT: Allow cross-site requests
    });

    // Note: It's common practice to send the user data in the body,
    // but the token via cookie. Your frontend expects `res.data` to be the user object.
    // If `savedUser` is the full user object, this is fine.
    res.json({ message: "User Added successfully!", data: savedUser });
  } catch (err) {
    // Better error handling for duplicate emails, etc.
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      // More descriptive error for frontend
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      // --- FIX HERE: Add secure and sameSite attributes ---
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000), // 8 hours expiry
        httpOnly: true, // Recommended for security
        secure: true, // IMPORTANT: Only send over HTTPS
        sameSite: "none", // IMPORTANT: Allow cross-site requests
      });

      // Your frontend's Login.jsx expects `res.data` to be the user object.
      // Ensure 'user' is the full user object expected by Redux.
      res.send(user); // Sends the user object in the response body
    } else {
      return res.status(400).json({ message: "Invalid credentials." });
    }
  } catch (err) {
    console.error("Login Error:", err); // Log the actual error on the server
    res.status(500).send("ERROR : " + err.message); // Generic error for client
  }
});

authRouter.post("/logout", async (req, res) => {
  // --- FIX HERE: Add secure and sameSite attributes to clearCookie as well ---
  res.cookie("token", null, {
    expires: new Date(Date.now()), // Expires immediately
    httpOnly: true, // Match set cookie attributes for clear to work correctly
    secure: true, // Match set cookie attributes
    sameSite: "none", // Match set cookie attributes
  });
  res.send("Logout Successful!!");
});

module.exports = authRouter;

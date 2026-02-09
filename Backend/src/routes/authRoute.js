const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { encrypt } = require("../utils/encryption");
const { userAuth } = require("../middlewares/auth");

// ─────────────────────────────────────────────
// HELPER: Generate GitHub Auth URL
// ─────────────────────────────────────────────
const getGithubAuthUrl = () => {
  const scopes = "repo,codespace,read:user,delete_repo";
  return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scopes}`;
};

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
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

    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.json({
      message: "User Added successfully!",
      data: savedUser,
      githubAuthUrl: getGithubAuthUrl(),
      actionRequired: "CONNECT_GITHUB",
    });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT();

      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });

      const userData = user.toObject();

      if (
        !user.githubId ||
        !user.githubAccessToken ||
        !user.githubAccessToken.content
      ) {
        userData.githubAuthUrl = getGithubAuthUrl();
        userData.actionRequired = "CONNECT_GITHUB";
      }

      res.send(userData);
    } else {
      return res.status(400).json({ message: "Invalid credentials." });
    }
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("ERROR : " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.send("Logout Successful!!");
});

// ─────────────────────────────────────────────
// GITHUB CONNECTION ROUTES
// ─────────────────────────────────────────────

// 1. START: User clicks "Connect/Login GitHub" button
// ✅ REMOVED userAuth so new users can login via GitHub too
authRouter.get("/auth/github", (req, res) => {
  res.json({ url: getGithubAuthUrl() });
});

// 2. CALLBACK: GitHub redirects back here
// ✅ REMOVED userAuth to prevent cookie blocking issues
authRouter.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided from GitHub");
  }

  try {
    // A. Exchange Code for Token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } },
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      return res
        .status(400)
        .json({ message: "Failed to get token from GitHub" });
    }

    // B. Get User Details
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubUser = userResponse.data;
    const encryptedToken = encrypt(accessToken);

    // C. Find User (Fallback to email since we don't have req.user)
    // Note: GitHub email might be null if private; handle accordingly in prod
    const userEmail = githubUser.email;
    let user = await User.findOne({ emailId: userEmail });

    if (!user) {
      // Option: Auto-signup user here if you want, or show error
      return res.status(404).send("User not found. Please Sign Up first.");
    }

    // D. Update User
    user.githubId = githubUser.id.toString();
    user.githubUsername = githubUser.login;
    user.githubAccessToken = encryptedToken;
    await user.save();

    // E. Generate Token & Redirect to Frontend with Token
    const token = await user.getJWT();

    // Set cookie as backup (might fail cross-domain)
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    // ✅ Redirect to Frontend Login Page with Token
    // Replace with your actual Frontend URL
    res.redirect(`https://devconnect18.onrender.com/login?token=${token}`);
  } catch (err) {
    console.error("GitHub Link Error:", err);
    res.status(500).send("Failed to connect GitHub account");
  }
});

module.exports = authRouter;

const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { encrypt } = require("../utils/encryption");
const { userAuth } = require("../middlewares/auth");

// HELPER: Generate GitHub Auth URL with state (user id)
const getGithubAuthUrl = (userId) => {
  const scopes = "repo,codespace,read:user,delete_repo";

  return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scopes}&state=${userId}`;
};

// --- SIGNUP ---
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

    res.json({ message: "User Added successfully!", data: savedUser });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// --- LOGIN ---
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

      res.send(user);
    } else {
      return res.status(400).json({ message: "Invalid credentials." });
    }
  } catch (err) {
    res.status(500).send("ERROR : " + err.message);
  }
});

// --- LOGOUT ---
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.send("Logout Successful!!");
});

// --- GITHUB CONNECTION ROUTES ---

// Get GitHub Auth URL (Protected)
authRouter.get("/auth/github/url", userAuth, (req, res) => {
  res.json({
    url: getGithubAuthUrl(req.user._id.toString()),
  });
});

// GitHub OAuth Callback (PUBLIC ROUTE - NO userAuth)
authRouter.get("/auth/github/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send("No code provided from GitHub");
  }

  if (!state) {
    return res.status(400).send("User identification missing (state)");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      {
        headers: { Accept: "application/json" },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Failed to get GitHub token" });
    }

    // Get GitHub user info
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Find user using state (which contains userId)
    const user = await User.findById(state);

    if (!user) {
      return res.status(400).send("User not found");
    }

    // Save GitHub details
    user.githubId = userResponse.data.id.toString();
    user.githubUsername = userResponse.data.login;
    user.githubAccessToken = encrypt(accessToken);

    await user.save();
    console.log(`GitHub account linked for user ${user.emailId} (${user.githubUsername})`);
    // Redirect to frontend after success
    res.redirect("https://devconnect18.onrender.com/login");
  } catch (err) {
    console.error("GitHub Link Error:", err.message);
    res.status(500).send("Failed to connect GitHub account");
  }
});

module.exports = authRouter;

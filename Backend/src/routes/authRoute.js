const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { encrypt } = require("../utils/encryption");
const { userAuth } = require("../middlewares/auth");

// HELPER: Generate GitHub Auth URL
const getGithubAuthUrl = () => {
  const scopes = "repo,codespace,read:user,delete_repo";
  return `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=${scopes}`;
};

// --- SIGNUP (Generic logic restored) ---
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
      secure: true, // Required for cross-site persistence
      sameSite: "none", // Allows cookie to be sent on GitHub redirect
    });

    res.json({ message: "User Added successfully!", data: savedUser });
  } catch (err) {
    res.status(400).send("ERROR : " + err.message);
  }
});

// --- LOGIN (Generic logic restored) ---
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
        secure: true, // Required for cross-site persistence
        sameSite: "none", // Allows cookie to be sent on GitHub redirect
      });
      res.send(user);
    } else {
      return res.status(400).json({ message: "Invalid credentials." });
    }
  } catch (err) {
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

// --- GITHUB CONNECTION ROUTES ---

authRouter.get("/auth/github/url", userAuth, (req, res) => {
  res.json({ url: getGithubAuthUrl() });
});

authRouter.get("/auth/github/callback", userAuth, async (req, res) => {
  // CRITICAL FIX: Ensure req.user exists to avoid the 'undefined' error
  if (!req.user) {
    return res
      .status(401)
      .send("Authentication failed: Session cookie not found.");
  }

  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided from GitHub");

  try {
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
    if (!accessToken)
      return res.status(400).json({ message: "Failed to get token" });

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const user = req.user;
    user.githubId = userResponse.data.id.toString();
    user.githubUsername = userResponse.data.login;
    user.githubAccessToken = encrypt(accessToken);

    await user.save();

    // Redirect to the groups page after successful link
    res.redirect("https://devconnect18.onrender.com/groups");
  } catch (err) {
    console.error("GitHub Link Error:", err.message);
    res.status(500).send("Failed to connect GitHub account");
  }
});

module.exports = authRouter;

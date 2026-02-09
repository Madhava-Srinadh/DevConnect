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

// --- AUTH ROUTES ---

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

// Endpoint for the Groups component to get the URL
authRouter.get("/auth/github/url", userAuth, (req, res) => {
  res.json({ url: getGithubAuthUrl() });
});

authRouter.get("/auth/github/callback", userAuth, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided from GitHub");

  try {
    console.log("Received GitHub code:", code);
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      },
      { headers: { Accept: "application/json" } },
    );
    console.log("GitHub token response:", tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;
    if (!accessToken)
      return res.status(400).json({ message: "Failed to get token" });

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("GitHub user response:", userResponse.data);
    const user = req.user;
    user.githubId = userResponse.data.id.toString();
    user.githubUsername = userResponse.data.login;
    user.githubAccessToken = encrypt(accessToken);

    await user.save();

    // Redirect back to the Groups page
    res.redirect("https://devconnect18.onrender.com/groups");
  } catch (err) {
    console.error("GitHub Link Error:", err);
    res.status(500).send("Failed to connect GitHub account");
  }
});

module.exports = authRouter;

// models/user.js

const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxLength: 50,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter a Strong Password: " + value);
        }
      },
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true, // Important: Allows multiple users to have 'null'
    },
    githubUsername: {
      type: String,
    },
    // We store the encrypted access token here
    githubAccessToken: {
      iv: { type: String },
      content: { type: String },
    },
    // ─────────────────────────────────────────────
    // NEW: Profile Status (Public vs Private)
    // ─────────────────────────────────────────────
    profileStatus: {
      type: String,
      enum: {
        values: ["public", "private"],
        message: "{VALUE} is not a valid profile status",
      },
      default: "public", // Default to public
    },

    dailyRequestCount: {
      type: Number,
      default: 0,
    },
    lastRequestDate: {
      type: Date,
      default: null,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "{VALUE} is not a valid gender type",
      },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    membershipType: {
      type: String,
    },
    photoUrl: {
      type: String,
      default: "https://geographyandyou.com/images/user-profile.png",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid Photo URL: " + value);
        }
      },
    },
    about: {
      type: String,
      default: "This is a default about of the user!",
    },
    skills: {
      type: [String],
    },

    // ─────────────────────────────────────────────
    // Connections Logic
    // ─────────────────────────────────────────────
    connections: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    connectionsCount: {
      type: Number,
      default: 0,
    },

    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────
// AUTOMATION: Update count on save
// ─────────────────────────────────────────────
userSchema.pre("save", function (next) {
  if (this.isModified("connections")) {
    this.connectionsCount = this.connections.length;
  }
  next();
});

userSchema.methods.updateLastSeen = async function () {
  this.lastSeen = new Date();
  await this.save();
};

userSchema.methods.setOnline = async function () {
  this.isOnline = true;
  await this.save();
};

userSchema.methods.setOffline = async function () {
  this.isOnline = false;
  this.lastSeen = new Date();
  await this.save();
};

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    user.password,
  );
  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);

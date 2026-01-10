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
      minLength: 4,
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
  }
);

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
/**
  JWT (JSON Web Token)
JWT is a compact and secure way to transmit data between parties as a JSON object.

🔸 Why use JWT?
For stateless authentication: the server doesn’t store session data.

Tokens are signed using a secret so they can't be tampered with.

Can be used for authorization across microservices or APIs. 
 */

userSchema.methods.getJWT = async function () {
  const user = this;
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

/**
 bcrypt
bcrypt is a password hashing library designed for securely storing user passwords.

🔸 Why use bcrypt?
Plaintext passwords are insecure.

bcrypt hashes passwords so they are unreadable even if the database is hacked.

It adds a "salt" to protect against rainbow table attacks.
 */
userSchema.methods.validatePassword = async function (passwordInputByUser) {
  const user = this;
  const isPasswordValid = await bcrypt.compare(
    passwordInputByUser,
    user.password
  );
  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");

/**
 * Member sub-document
 * - userId  → reference to User
 * - role    → admin | member
 * - tags    → custom labels inside group
 */
const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    tags: {
      type: [String], // e.g. ["frontend", "mentor"]
      default: [],
    },
  },
  { _id: false },
);

/**
 * Group schema
 * - name    → group name
 * - members → list of members with roles
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ─────────────────────────────────────────────
    // ✅ NEW: GitHub Repository Details
    // ─────────────────────────────────────────────
    githubRepoId: {
      type: String, // GitHub's internal ID
      sparse: true,
    },
    githubRepoName: {
      type: String, // e.g. "devconnect-group-123"
    },
    githubRepoUrl: {
      type: String, // e.g. "https://github.com/madhav/devconnect-group-123"
    },
    // ─────────────────────────────────────────────

    members: {
      type: [memberSchema],
      required: true,
      validate: {
        validator: function (members) {
          // Ensure at least one admin exists
          return members.some((m) => m.role === "admin");
        },
        message: "Group must have at least one admin",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

/**
 * IMPORTANT INDEX
 * Enables fast lookup of groups by user
 */
groupSchema.index({ "members.userId": 1 });

module.exports = mongoose.model("Group", groupSchema);

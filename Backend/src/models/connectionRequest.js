const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["ignored", "interested", "accepted", "rejected"],
    },

    // 🔥 NEW (safe defaults)
    requestType: {
      type: String,
      enum: ["normal", "premium"],
      default: "normal",
    },
    purpose: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

connectionRequestSchema.pre("save", function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    throw new Error("Cannot send connection request to yourself!");
  }
  next();
});

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);

const mongoose = require("mongoose");

/**
 * Individual group message schema
 */
const groupMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

/**
 * Group chat schema
 * - groupId → reference to Group
 * - messages → array of group messages
 */
const groupChatSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      unique: true,
    },
    messages: [groupMessageSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("GroupChat", groupChatSchema);

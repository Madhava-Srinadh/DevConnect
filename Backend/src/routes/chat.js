const express = require("express");
const mongoose = require("mongoose");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const User = require("../models/user");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    // Validate targetUserId
    if (!mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: "Invalid target user ID" });
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId).select(
      "firstName lastName isOnline lastSeen"
    );
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Fetch or create chat
    let chat = await Chat.findOne({
      participants: { $all: [userId, targetUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, targetUserId],
        messages: [],
      });
      await chat.save();
    }

    // Prepare response with messages and target user details
    res.json({
      messages: chat.messages,
      targetUser: {
        _id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        isOnline: targetUser.isOnline,
        lastSeen: targetUser.lastSeen,
      },
    });
  } catch (err) {
    res.status(400).json({ message: "ERROR: " + err.message });
  }
});

module.exports = chatRouter;

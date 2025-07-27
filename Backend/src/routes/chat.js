const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const User = require("../models/user");

const chatRouter = express.Router();

// GET /chat/:targetUserId
// Returns:
//   {
//     chat: { _id, participants, messages: [ { senderId: { _id, firstName, lastName }, text, createdAt, ... } ] },
//     targetStatus: { userId, firstName, lastName, isOnline, lastSeen }
//   }
chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user._id;

  try {
    // 1. Find existing chat or create a new one  
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
      // Re-populate after saving so messages.senderId is populated (though messages is empty now)
      chat = await Chat.findById(chat._id).populate({
        path: "messages.senderId",
        select: "firstName lastName",
      });
    }

    // 2. Fetch the target user's status (isOnline, lastSeen, name)
    const targetUser = await User.findById(targetUserId).select(
      "firstName lastName isOnline lastSeen"
    );

    // 3. Return both
    return res.json({
      chat,
      targetStatus: {
        userId: targetUserId,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        isOnline: targetUser.isOnline,
        lastSeen: targetUser.lastSeen,
      },
    });
  } catch (err) {
    console.error("Error in GET /chat/:targetUserId →", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = chatRouter;

const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Group = require("../models/group");
const GroupChat = require("../models/groupChat");

const router = express.Router();

router.get("/group-chat/:groupId", userAuth, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const isMember = group.members.some(
      (m) => m.userId.toString() === userId.toString(),
    );

    if (!isMember)
      return res.status(403).json({ message: "Not a group member" });

    let groupChat = await GroupChat.findOne({ groupId }).populate({
      path: "messages.senderId",
      select: "firstName lastName",
    });

    if (!groupChat) {
      groupChat = new GroupChat({
        groupId,
        messages: [],
      });

      await groupChat.save();

      groupChat = await GroupChat.findOne({ groupId }).populate({
        path: "messages.senderId",
        select: "firstName lastName",
      });
    }

    return res.json({
      group: {
        _id: group._id,
        name: group.name,
      },
      messages: groupChat.messages,
    });
  } catch (err) {
    console.error("Error in GET /group-chat/:groupId →", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

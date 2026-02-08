const socketio = require("socket.io");
const crypto = require("crypto");

const { Chat } = require("../models/chat");
const Group = require("../models/group");
const GroupChat = require("../models/groupChat");
const User = require("../models/user");

const getSecretRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("$"))
    .digest("hex");
};

const initializeSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // ─────── 1-1 CHAT JOIN ───────
    socket.on("joinChat", async ({ userId, targetUserId }) => {
      socket.userId = userId;

      await User.findByIdAndUpdate(userId, { isOnline: true });

      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);

      io.to(roomId).emit("peerStatusChanged", {
        userId,
        isOnline: true,
        lastSeen: null,
      });
    });

    // ─────── 1-1 SEND MESSAGE ───────
    socket.on("sendMessage", async ({ userId, targetUserId, text }) => {
      const roomId = getSecretRoomId(userId, targetUserId);

      let chat = await Chat.findOne({
        participants: { $all: [userId, targetUserId] },
      });

      if (!chat) {
        chat = new Chat({
          participants: [userId, targetUserId],
          messages: [],
        });
      }

      chat.messages.push({
        senderId: userId,
        text,
      });

      await chat.save();

      io.to(roomId).emit("messageReceived", {
        text,
        senderId: userId,
        timestamp: new Date().toISOString(),
      });
    });

    // ─────── GROUP JOIN ───────
    socket.on("joinGroup", async ({ userId, groupId }) => {
      socket.userId = userId;

      await User.findByIdAndUpdate(userId, { isOnline: true });

      const group = await Group.findById(groupId);
      if (!group) return;

      const isMember = group.members.some((member) => {
        const idToCheck = member.userId._id || member.userId;
        return idToCheck.toString() === userId.toString();
      });

      if (isMember) {
        socket.join(groupId.toString());
      }
    });

    // ─────── GROUP SEND MESSAGE ───────
    socket.on("sendGroupMessage", async ({ userId, groupId, text }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const user = await User.findById(userId);

        const isMember = group.members.some((member) => {
          const idToCheck = member.userId._id || member.userId;
          return idToCheck.toString() === userId.toString();
        });

        if (!isMember) return;

        const mongoose = require("mongoose");
        const groupObjectId = new mongoose.Types.ObjectId(groupId);

        let groupChat = await GroupChat.findOne({
          groupId: groupObjectId,
        });

        if (!groupChat) {
          groupChat = new GroupChat({
            groupId: groupObjectId,
            messages: [],
          });
        }

        groupChat.messages.push({
          senderId: userId,
          text,
        });

        await groupChat.save();

        io.to(groupId.toString()).emit("groupMessageReceived", {
          senderId: userId,
          senderName: user?.firstName || "User",
          text,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        // Error handling silently
      }
    });

    socket.on("disconnect", async () => {
      const disconnectedUserId = socket.userId;
      if (!disconnectedUserId) return;

      await User.findByIdAndUpdate(disconnectedUserId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit("peerStatusChanged", {
        userId: disconnectedUserId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};

module.exports = initializeSocket;

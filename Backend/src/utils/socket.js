// socket.js

const socketio = require("socket.io");
const crypto = require("crypto");
const { Chat } = require("../models/chat");
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
      origin: [
        "http://localhost:5173",
        "https://devconnect18.onrender.com/",
        "https://devconnect18.onrender.com",
      ], // adjust as needed
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", async ({ firstName, userId, targetUserId }) => {
      socket.userId = userId;
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (err) {
        console.error("Error setting user online:", err);
      }

      const roomId = getSecretRoomId(userId, targetUserId);
      socket.join(roomId);

      io.to(roomId).emit("peerStatusChanged", {
        userId,
        isOnline: true,
        lastSeen: null,
      });
    });

    socket.on(
      "sendMessage",
      async ({ firstName, lastName, userId, targetUserId, text }) => {
        try {
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

          // ─── INCLUDE senderId IN THE PAYLOAD ─────────────────────────────────
          io.to(roomId).emit("messageReceived", {
            text,
            senderId: userId,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Error in sendMessage:", err);
        }
      }
    );

    socket.on("disconnect", async () => {
      const disconnectedUserId = socket.userId;
      if (!disconnectedUserId) return;

      try {
        await User.findByIdAndUpdate(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error("Error setting user offline:", err);
      }

      io.emit("peerStatusChanged", {
        userId: disconnectedUserId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });
};

module.exports = initializeSocket;

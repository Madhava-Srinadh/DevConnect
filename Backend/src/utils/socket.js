const socket = require("socket.io");
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
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("userConnected", async (userId) => {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      socket.userId = userId;
      socket.broadcast.emit("userOnline", userId);
    });

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      const roomId = getSecretRoomId(userId, targetUserId);
      console.log(firstName + " joined Room : " + roomId);
      socket.join(roomId);
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

          const newMessage = {
            senderId: userId,
            text,
            status: "sent",
          };

          chat.messages.push(newMessage);
          await chat.save();

          io.to(roomId).emit("messageReceived", {
            firstName,
            lastName,
            text,
            status: "sent",
            _id: newMessage._id,
          });
        } catch (err) {
          console.log(err);
        }
      }
    );

    socket.on("messageSeen", async ({ messageId, roomId }) => {
      try {
        const chat = await Chat.findOne({ "messages._id": messageId });
        const message = chat.messages.id(messageId);
        message.status = "seen";
        await chat.save();
        io.to(roomId).emit("messageStatusUpdated", {
          messageId,
          status: "seen",
        });
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        socket.broadcast.emit("userOffline", socket.userId);
      }
    });
  });
};

module.exports = initializeSocket;

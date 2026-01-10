// socket.js
/**  
 * What is Socket.IO?
Socket.IO is a JavaScript library that enables real-time, bidirectional, and event-based communication between a client (e.g., a web browser) and a server. It uses WebSockets as the primary transport mechanism. In this application, Socket.IO is used to:

Handle real-time messaging between users.
Notify users about online/offline status changes.
Manage chat rooms for private conversations.

What Are WebSockets?
WebSockets are a protocol that enables two-way, real-time communication between the client and server over a single, persistent connection.
WebSockets allow for low-latency communication, making them ideal for applications that require real-time updates, such as chat applications, live notifications, and gaming.
Unlike traditional HTTP requests, which are request-response based, WebSockets allow the server to push data to the client without the client needing to request it first. This makes WebSockets more efficient for real-time applications.
WebSockets are initiated by the client, which sends a handshake request to the server. If the server supports WebSockets, it responds with a handshake response, and the connection is established. After that, both the client and server can send messages to each other at any time.
 */

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

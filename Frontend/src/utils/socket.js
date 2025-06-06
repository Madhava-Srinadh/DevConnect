// frontend/src/utils/socket.js

import { io } from "socket.io-client";

// Use the environment variable for the backend URL
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;

export const createSocketConnection = () => {
  if (!SOCKET_SERVER_URL) {
    console.error(
      "VITE_SOCKET_SERVER_URL is not defined in environment variables!"
    );
    // You might want to throw an error or handle this gracefully
    return null;
  }

  return io(SOCKET_SERVER_URL, {
    path: "/socket.io", // Ensure this matches your backend Socket.IO path
    transports: ["websocket", "polling"],
    withCredentials: true, // You have this enabled in your backend cors, so include it here
  });
};

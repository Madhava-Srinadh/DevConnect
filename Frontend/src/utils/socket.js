// frontend/src/utils/socket.js

import { io } from "socket.io-client";

// The URL of your locally running backend:
const LOCAL_SERVER_URL = "http://localhost:7777";

// If you later host your backend, replace this with something like:
// const API_SERVER_URL = "https://api.myapp.com";

export const createSocketConnection = () => {
  // Always connect to the local server on port 7777 for now:
  return io(LOCAL_SERVER_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    // If you ever send auth cookies, add: withCredentials: true
  });
};

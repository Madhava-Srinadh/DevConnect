// src/components/Chat.jsx

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { createSocketConnection } from "../utils/socket";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { format, isToday, isYesterday } from "date-fns";

const Chat = () => {
  const { targetUserId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [targetStatus, setTargetStatus] = useState({
    isOnline: false,
    lastSeen: null,
    firstName: "",
    lastName: "",
  });

  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  // Utility to add a new message while enforcing max‑100 rule
  const addMessage = (msg) => {
    setMessages((prev) => {
      if (prev.length >= 100) {
        return [msg];
      }
      return [...prev, msg];
    });
  };

  // 1. Fetch chat messages + target user status
  const fetchChatMessages = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/chat/${targetUserId}`, {
        withCredentials: true,
      });
      const { chat, targetStatus } = response.data;

      const chatMessages = chat.messages.map((msg) => ({
        fromSelf: msg.senderId._id === userId,
        text: msg.text,
        timestamp: msg.createdAt,
      }));

      if (chatMessages.length > 100) {
        setMessages(chatMessages.slice(-100));
      } else {
        setMessages(chatMessages);
      }

      setTargetStatus({
        isOnline: targetStatus.isOnline,
        lastSeen: targetStatus.lastSeen,
        firstName: targetStatus.firstName,
        lastName: targetStatus.lastName,
      });
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  };

  // 2. Scroll to bottom whenever messages change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. On mount: fetch data, connect socket, emit joinChat
  useEffect(() => {
    if (!userId) return;
    fetchChatMessages();

    socketRef.current = createSocketConnection();
    socketRef.current.emit("joinChat", {
      firstName: user.firstName,
      userId,
      targetUserId,
    });

    socketRef.current.on("messageReceived", ({ text, senderId, timestamp }) => {
      if (senderId !== userId) {
        addMessage({
          fromSelf: false,
          text,
          timestamp: timestamp || new Date().toISOString(),
        });
      }
    });

    socketRef.current.on(
      "peerStatusChanged",
      ({ userId: peerId, isOnline, lastSeen }) => {
        if (peerId === targetUserId) {
          setTargetStatus((prev) => ({
            ...prev,
            isOnline,
            lastSeen,
          }));
        }
      }
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, targetUserId, user.firstName]);

  // 4. sendMessage
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      userId,
      targetUserId,
      text: newMessage,
    };
    socketRef.current.emit("sendMessage", payload);

    addMessage({
      fromSelf: true,
      text: newMessage,
      timestamp: new Date().toISOString(),
    });
    setNewMessage("");
  };

  // 5. Format "last seen"
  const renderLastSeen = () => {
    if (targetStatus.isOnline) {
      return <span className="text-green-400">Online</span>;
    }
    if (!targetStatus.lastSeen) {
      return <span className="text-gray-400">Offline</span>;
    }

    const when = new Date(targetStatus.lastSeen);
    let label;
    if (isToday(when)) {
      label = `Last seen today at ${format(when, "hh:mm a")}`;
    } else if (isYesterday(when)) {
      label = `Last seen yesterday at ${format(when, "hh:mm a")}`;
    } else {
      label = `Last seen ${format(when, "MMM d yyyy 'at' hh:mm a")}`;
    }
    return <span className="text-gray-400">{label}</span>;
  };

  return (
    <div className="w-full max-w-screen-md mx-auto h-[70vh] flex flex-col bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      {/* ─── HEADER ──────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Chat with {targetStatus.firstName} {targetStatus.lastName}
          </h2>
          <div className="text-sm">{renderLastSeen()}</div>
        </div>
      </div>

      {/* ─── MESSAGES CONTAINER ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-900"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.fromSelf ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`w-full sm:w-auto max-w-[75%] px-4 py-2 break-words ${
                msg.fromSelf
                  ? "bg-blue-600 text-white rounded-l-lg rounded-tr-lg"
                  : "bg-gray-700 text-gray-100 rounded-r-lg rounded-tl-lg"
              }`}
            >
              <div>{msg.text}</div>
              <div className="text-xs text-gray-400 text-right mt-1">
                {format(new Date(msg.timestamp), "hh:mm a")}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── INPUT BOX ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex items-center gap-3">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-5 py-2 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;

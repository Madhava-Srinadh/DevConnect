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
    // photoUrl: "" // Assuming you might add this later, utilizing Initials for now
  });

  const user = useSelector((store) => store.user);
  const userId = user?._id;
  const socketRef = useRef(null);
  const containerRef = useRef(null);

  // Utility to add a new message while enforcing max‑100 rule
  const addMessage = (msg) => {
    setMessages((prev) => {
      if (prev.length >= 100) {
        return [...prev.slice(1), msg];
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

      const chatMessages = (chat?.messages || []).map((msg) => ({
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
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
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
      },
    );

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, targetUserId, user?.firstName]);

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
    if (socketRef.current) {
      socketRef.current.emit("sendMessage", payload);
    }

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
      return (
        <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
          Online
        </span>
      );
    }
    if (!targetStatus.lastSeen) {
      return <span className="text-gray-500 text-xs">Offline</span>;
    }

    const when = new Date(targetStatus.lastSeen);
    let label;
    try {
      if (isToday(when)) {
        label = `Last seen today at ${format(when, "hh:mm a")}`;
      } else if (isYesterday(when)) {
        label = `Last seen yesterday at ${format(when, "hh:mm a")}`;
      } else {
        label = `Last seen ${format(when, "MMM d, hh:mm a")}`;
      }
    } catch (e) {
      label = "Offline";
    }
    return <span className="text-gray-500 text-xs">{label}</span>;
  };

  // Helper for timestamp on message
  const formatMessageTime = (isoString) => {
    try {
      return format(new Date(isoString), "hh:mm a");
    } catch (e) {
      return "";
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-4xl mx-auto h-[85vh] flex flex-col bg-[#121212] rounded-3xl shadow-2xl overflow-hidden border border-gray-800 my-4">
      {/* ─── HEADER ──────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          {/* Avatar Placeholder / Gradient Initials */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg border-2 border-gray-800">
            <span className="text-white font-bold text-lg">
              {targetStatus.firstName?.charAt(0)}
              {targetStatus.lastName?.charAt(0)}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              {targetStatus.firstName} {targetStatus.lastName}
            </h2>
            <div className="mt-0.5">{renderLastSeen()}</div>
          </div>
        </div>
      </div>

      {/* ─── MESSAGES CONTAINER ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div
          ref={containerRef}
          className="flex flex-col space-y-4 min-h-full justify-end"
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-600 my-10 text-sm">
              No messages yet. Start the conversation! 👋
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col animate-fade-in-up ${
                msg.fromSelf ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`relative px-5 py-3 rounded-2xl max-w-[85%] md:max-w-[70%] break-words text-sm shadow-md leading-relaxed ${
                  msg.fromSelf
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none"
                    : "bg-[#1f2937] text-gray-100 border border-gray-700 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div
                  className={`text-[9px] mt-1 text-right font-medium opacity-80 ${msg.fromSelf ? "text-blue-100" : "text-gray-400"}`}
                >
                  {formatMessageTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── INPUT BOX ───────────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-full px-6 py-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="btn btn-circle bg-gradient-to-r from-blue-600 to-purple-600 border-none text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 rotate-90 transform ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { createSocketConnection } from "../utils/socket";
import { format } from "date-fns";

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user);
  const userId = user?._id;

  const socketRef = useRef(null);
  const containerRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [connections, setConnections] = useState([]);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [tagInputs, setTagInputs] = useState({});

  const me = group?.members.find(
    (m) => (m.userId?._id || m.userId)?.toString() === userId,
  );
  const isAdmin = me?.role === "admin";

  // ─────────────────────────────────────────────
  // API CALLS
  // ─────────────────────────────────────────────
  const fetchGroup = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/groups/${groupId}`, {
        withCredentials: true,
      });
      setGroup(res.data.group);
    } catch (err) {
      console.error("Error fetching group:", err);
    }
  }, [groupId]);

  const fetchGroupChat = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/group-chat/${groupId}`, {
        withCredentials: true,
      });
      setMessages(
        res.data.messages.map((m) => ({
          senderId: m.senderId?._id || "deleted",
          senderName: m.senderId?.firstName || "Unknown",
          text: m.text,
          timestamp: m.createdAt || new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.error("Error fetching chat:", err);
    }
  }, [groupId]);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/user/connections`, {
        withCredentials: true,
      });
      setConnections(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // ─────────────────────────────────────────────
  // SOCKET & EFFECTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !groupId) return;

    fetchGroup();
    fetchGroupChat();
    fetchConnections();

    if (!socketRef.current) {
      socketRef.current = createSocketConnection();
      socketRef.current.on("connect", () => {
        socketRef.current.emit("joinGroup", { userId, groupId });
      });
    } else {
      socketRef.current.emit("joinGroup", { userId, groupId });
    }

    const handleMessage = ({ senderId, senderName, text, timestamp }) => {
      if (senderId === userId) return;
      setMessages((prev) => [
        ...prev,
        {
          senderId,
          senderName,
          text,
          timestamp: timestamp || new Date().toISOString(),
        },
      ]);
    };

    socketRef.current.off("groupMessageReceived");
    socketRef.current.on("groupMessageReceived", handleMessage);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("groupMessageReceived", handleMessage);
      }
    };
  }, [groupId, userId, fetchGroup, fetchGroupChat, fetchConnections]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit("sendGroupMessage", {
        userId,
        groupId,
        text: newMessage,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        senderId: userId,
        senderName: user?.firstName || "Me",
        text: newMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const handleAdminAction = async (action, payload) => {
    try {
      let url = `${BASE_URL}/group/${groupId}`;

      // Map actions to routes
      if (action === "add") url += "/add";
      else if (action === "remove") url += "/remove";
      else if (action === "tags") url += "/tags";
      else if (action === "leave") url += "/leave";
      else if (action === "github-write") url += "/github-write";
      else if (action === "github-read") url += "/github-read";

      await axios.post(url, payload, { withCredentials: true });

      if (action === "leave") {
        navigate("/groups");
      } else {
        fetchGroup();
        if (action === "add") setSelectedUser("");
        if (action === "tags")
          setTagInputs((p) => ({ ...p, [payload.targetUserId]: "" }));
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    }
  };

  const deleteGroup = async () => {
    // ✅ Removed window.confirm (No Alert)
    try {
      await axios.delete(`${BASE_URL}/group/${groupId}`, {
        withCredentials: true,
      });
      navigate("/groups");
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (isoString) => {
    try {
      return format(new Date(isoString), "hh:mm a");
    } catch (e) {
      return "";
    }
  };

  if (!group) return null;

  return (
    <div className="h-[85vh] max-w-7xl mx-auto flex bg-[#121212] text-gray-100 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 my-4 relative">
      {/* ── CHAT SECTION ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {/* HEADER */}
        <div
          onClick={() => setShowGroupInfo(true)}
          className="px-6 py-4 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-10 sticky top-0 cursor-pointer hover:bg-gray-800/80 transition-colors group/header"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg ring-2 ring-transparent group-hover/header:ring-blue-500 transition-all">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                {group.name}
                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                  Tap for info
                </span>
              </h2>
              <span className="text-xs text-gray-400">
                {group.members.length} members
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-circle text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* MESSAGES */}
        <div
          ref={containerRef}
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-gradient-to-b from-gray-900/50 to-black/50"
        >
          {messages.map((m, i) => {
            const isMe = m.senderId === userId;
            return (
              <div
                key={i}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in-up`}
              >
                {!isMe && (
                  <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1 tracking-wider">
                    {m.senderName}
                  </span>
                )}
                <div
                  className={`relative px-5 py-3 rounded-2xl max-w-[85%] md:max-w-[70%] text-sm shadow-lg leading-relaxed ${
                    isMe
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none"
                      : "bg-[#1f2937] text-gray-100 border border-gray-700 rounded-tl-none"
                  }`}
                >
                  <div className="break-words whitespace-pre-wrap">
                    {m.text}
                  </div>
                  <div
                    className={`text-[9px] mt-1 text-right font-medium ${isMe ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {formatTime(m.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <input
              className="flex-1 bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button
              className="btn btn-circle btn-primary bg-gradient-to-r from-blue-600 to-purple-600 border-none shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105"
              onClick={sendMessage}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 rotate-90 transform"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── DRAWER ── */}
      <div
        className={`absolute inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showGroupInfo ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setShowGroupInfo(false)}
      ></div>

      <div
        className={`absolute top-0 right-0 h-full w-full md:w-96 bg-[#161616] border-l border-gray-700 shadow-2xl z-30 transform transition-transform duration-300 ease-out flex flex-col ${showGroupInfo ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
          <h3 className="font-bold text-lg text-white">Group Info</h3>
          <button
            onClick={() => setShowGroupInfo(false)}
            className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-3">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-bold text-white">{group.name}</h2>
            <p className="text-gray-500 text-sm">
              Created {new Date(group.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="divider text-gray-600 text-xs">
            MEMBERS ({group.members.length})
          </div>

          <div className="space-y-3">
            {group.members.map((m) => {
              if (!m.userId) return null;

              const hasWriteAccess = m.tags.includes("write");

              return (
                <div
                  key={m.userId._id}
                  className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="overflow-hidden">
                        <div className="font-semibold text-sm text-gray-200 truncate">
                          {m.userId.firstName} {m.userId.lastName}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {m.role === "admin" ? "👑 Group Admin" : "Member"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {m.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 pl-1">
                      {m.tags.map((t, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 text-[10px] rounded border ${t === "write" ? "bg-purple-900/30 text-purple-300 border-purple-500/30" : "bg-blue-900/30 text-blue-300 border-blue-500/30"}`}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-2 pt-2 border-t border-gray-700 space-y-2">
                      {/* Tag Input */}
                      <div className="flex gap-1">
                        <input
                          className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white focus:border-blue-500 outline-none"
                          placeholder="Add tags..."
                          value={tagInputs[m.userId._id] || ""}
                          onChange={(e) =>
                            setTagInputs((p) => ({
                              ...p,
                              [m.userId._id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="btn btn-xs btn-square btn-ghost text-blue-400"
                          onClick={() =>
                            handleAdminAction("tags", {
                              targetUserId: m.userId._id,
                              tags: tagInputs[m.userId._id]?.split(","),
                            })
                          }
                        >
                          ✓
                        </button>
                      </div>

                      {/* Member Actions (Only on others) */}
                      {m.userId._id !== userId && (
                        <div className="flex flex-col gap-2">
                          {/* Remove User */}
                          <button
                            onClick={() =>
                              handleAdminAction("remove", {
                                targetUserId: m.userId._id,
                              })
                            }
                            className="w-full py-1.5 text-[10px] font-semibold text-red-300 bg-red-900/30 border border-red-500/30 rounded hover:bg-red-900/50 transition-colors"
                          >
                            ✕ Remove
                          </button>

                          {/* GitHub Write Access Toggle */}
                          {group.githubRepoUrl && (
                            <>
                              {!hasWriteAccess ? (
                                <button
                                  onClick={() =>
                                    handleAdminAction("github-write", {
                                      targetUserId: m.userId._id,
                                    })
                                  }
                                  className="w-full py-1.5 text-[10px] font-bold text-purple-300 bg-purple-900/30 border border-purple-500/30 rounded hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-1"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3 h-3"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Grant Write Access
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleAdminAction("github-read", {
                                      targetUserId: m.userId._id,
                                    })
                                  }
                                  className="w-full py-1.5 text-[10px] font-bold text-orange-300 bg-orange-900/30 border border-orange-500/30 rounded hover:bg-orange-900/50 transition-colors flex items-center justify-center gap-1"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3 h-3"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Revoke Write Access
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          {isAdmin ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm w-full bg-gray-800 text-xs"
                  onChange={(e) => setSelectedUser(e.target.value)}
                  value={selectedUser}
                >
                  <option value="">+ Add connection</option>
                  {connections.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-sm btn-square btn-success"
                  disabled={!selectedUser}
                  onClick={() =>
                    handleAdminAction("add", { newUserId: selectedUser })
                  }
                >
                  +
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={deleteGroup}
                  className="btn btn-xs btn-outline btn-error"
                >
                  Delete Group
                </button>
                <button
                  onClick={() => handleAdminAction("leave", {})}
                  className="btn btn-xs btn-ghost"
                >
                  Leave Group
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleAdminAction("leave", {})}
              className="btn btn-sm btn-outline btn-error w-full"
            >
              Leave Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChat;

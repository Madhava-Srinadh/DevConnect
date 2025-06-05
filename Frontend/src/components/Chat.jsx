import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { format, isToday, isYesterday } from "date-fns";
import io from "socket.io-client";
import { BASE_URL } from "../utils/constants";

const socket = io(BASE_URL);

const Chat = ({ targetUserId }) => {
  const user = useSelector((store) => store.user);
  const [messages, setMessages] = useState([]);
  const [onlineStatus, setOnlineStatus] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [text, setText] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/chat/${targetUserId}?page=${page}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        setMessages(prev => [...prev, ...data.messages]);
        setTargetUser(data.targetUser);
        setOnlineStatus(data.targetUser.isOnline);
        setLastSeen(data.targetUser.lastSeen);
        setHasMore(data.hasMore);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [targetUserId, page]);

  useEffect(() => {
    socket.emit("userConnected", user._id);
    socket.emit("joinChat", {
      firstName: user.firstName,
      userId: user._id,
      targetUserId,
    });

    socket.on("messageReceived", (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on("userOnline", (userId) => {
      if (userId === targetUserId) {
        setOnlineStatus(true);
        setLastSeen(null);
      }
    });

    socket.on("userOffline", (userId) => {
      if (userId === targetUserId) {
        setOnlineStatus(false);
        setLastSeen(new Date());
      }
    });

    socket.on("messageStatusUpdated", ({ messageId, status }) => {
      setMessages(prev =>
        prev.map(msg => (msg._id === messageId ? { ...msg, status } : msg))
      );
    });

    return () => {
      socket.off("messageReceived");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("messageStatusUpdated");
    };
  }, [targetUserId]);

  const sendMessage = () => {
    if (text.trim()) {
      socket.emit("sendMessage", {
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user._id,
        targetUserId,
        text,
      });
      setText("");
    }
  };

  const formatMessageDate = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, "h:mm a");
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    }
    return format(messageDate, "MMM d, yyyy");
  };

  const formatLastSeen = (date) => {
    if (!date) return "";
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-2xl mx-auto p-4">
      <div className="bg-base-300 p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">
          {targetUser?.firstName} {targetUser?.lastName}
        </h2>
        <p className="text-sm">
          {onlineStatus ? (
            <span className="text-green-500">● Online</span>
          ) : (
            <span className="text-gray-500">
              Last seen: {formatLastSeen(lastSeen)}
            </span>
          )}
        </p>
      </div>

      <div 
        className="flex-1 overflow-y-auto bg-base-200 p-4"
        onScroll={handleScroll}
      >
        {loading && (
          <div className="flex justify-center my-2">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const showDate = index === 0 || 
            formatMessageDate(messages[index - 1]?.createdAt) !== 
            formatMessageDate(msg.createdAt);

          return (
            <div key={msg._id || index}>
              {showDate && (
                <div className="text-center text-sm text-gray-500 my-2">
                  {formatMessageDate(msg.createdAt)}
                </div>
              )}
              <div className={`chat ${
                msg.senderId === user._id ? "chat-end" : "chat-start"
              }`}>
                <div className="chat-bubble">
                  {msg.text}
                  <span className="text-xs ml-2 opacity-70">
                    {msg.status === "seen" ? "✓✓" : "✓"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="bg-base-300 p-4 rounded-b-lg flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="input input-bordered flex-1"
        />
        <button 
          onClick={sendMessage} 
          className="btn btn-primary"
          disabled={!text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
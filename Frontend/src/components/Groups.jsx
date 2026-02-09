import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Groups = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);

  const [myGroups, setMyGroups] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchData = async () => {
    // Only attempt fetch if user has connected GitHub
    if (!user?.githubId) return;

    setLoading(true);
    try {
      const [groupsRes, connRes] = await Promise.all([
        axios.get(`${BASE_URL}/groups/my`, { withCredentials: true }),
        axios.get(`${BASE_URL}/user/connections`, { withCredentials: true }),
      ]);
      setMyGroups(groupsRes.data.groups || []);
      setConnections(connRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    try {
      await axios.post(
        `${BASE_URL}/group/create`,
        { name: groupName, memberIds: selectedMembers },
        { withCredentials: true },
      );
      setGroupName("");
      setSelectedMembers([]);
      setShowCreate(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  // 1. AUTHORIZATION VIEW
  if (!user?.githubId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-[#121212] border border-gray-800 p-10 rounded-3xl text-center max-w-lg shadow-2xl">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            GitHub Authorization Required
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Community Groups use GitHub Codespaces for collaboration. You need
            to connect your GitHub account to access this feature.
          </p>
          <button
            onClick={async () => {
              const res = await axios.get(`${BASE_URL}/auth/github/url`, {
                withCredentials: true,
              });
              window.location.href = res.data.url;
            }}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Connect GitHub Account
          </button>
        </div>
      </div>
    );
  }

  // 2. LOADING VIEW
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 min-h-screen">
        <div className="h-10 w-48 bg-gray-800 rounded mb-8 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // 3. MAIN COMPONENT VIEW
  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-10 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Community Groups
          </h1>
          <p className="text-gray-500 mt-2">
            Collaborate, chat, and code with your connections.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`mt-4 md:mt-0 px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2
            ${showCreate ? "bg-gray-800 text-gray-300" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"}`}
        >
          {showCreate ? "✕ Cancel" : "Create New Group"}
        </button>
      </div>

      {/* CREATE PANEL */}
      <div
        className={`overflow-hidden transition-all duration-500 ${showCreate ? "max-h-[800px] opacity-100 mb-12" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-[#121212] border border-gray-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Setup your Squad
          </h2>
          <div className="mb-6">
            <label className="text-gray-400 text-sm font-semibold mb-2 block uppercase">
              Group Name
            </label>
            <input
              type="text"
              className="w-full bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-700 focus:border-blue-500 outline-none"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="mb-8">
            <label className="text-gray-400 text-sm font-semibold mb-3 block uppercase">
              Add Members ({selectedMembers.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
              {connections.map((u) => (
                <div
                  key={u._id}
                  onClick={() => toggleMember(u._id)}
                  className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all
                    ${selectedMembers.includes(u._id) ? "bg-blue-900/30 border-blue-500" : "bg-gray-800 border-gray-700"}`}
                >
                  <img
                    src={u.photoUrl || "https://via.placeholder.com/40"}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm truncate">{u.firstName}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName || selectedMembers.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-50"
          >
            🚀 Launch Group
          </button>
        </div>
      </div>

      {/* GROUPS LIST */}
      {myGroups.length === 0 ? (
        <div className="text-center py-20 bg-[#121212] rounded-3xl border border-gray-800 border-dashed">
          <h3 className="text-2xl font-bold text-gray-300">No Groups Found</h3>
          <p className="text-gray-500 mt-2">
            Create a group above to start chatting!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.map((group) => (
            <div
              key={group._id}
              onClick={() => navigate(`/groups/${group._id}`)}
              className="group bg-[#121212] p-6 rounded-2xl border border-gray-800 hover:border-gray-600 cursor-pointer transition-all hover:-translate-y-2"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                {group.myRole === "admin" && (
                  <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                {group.name}
              </h3>
              <p className="text-gray-500 text-sm mt-4 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                {group.membersCount || 1} Members
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;

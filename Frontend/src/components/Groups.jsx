import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";

const Groups = () => {
  const navigate = useNavigate();

  const [myGroups, setMyGroups] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // ─────────────────────────────────────────────
  // FETCH DATA
  // ─────────────────────────────────────────────
  const fetchData = async () => {
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
  }, []);

  // ─────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────
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
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to create group", err);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────

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

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-10 max-w-7xl mx-auto">
      {/* ─── HEADER ─── */}
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
            ${
              showCreate
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-blue-500/30 hover:-translate-y-1"
            }`}
        >
          {showCreate ? (
            <>✕ Cancel</>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Group
            </>
          )}
        </button>
      </div>

      {/* ─── CREATE GROUP PANEL (Collapsible) ─── */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${showCreate ? "max-h-[800px] opacity-100 mb-12" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-[#121212] border border-gray-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <h2 className="text-2xl font-bold text-white mb-6">
            Setup your Squad
          </h2>

          {/* Group Name Input */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm font-semibold mb-2 block uppercase tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. React Developers, Weekend Project..."
              className="w-full bg-gray-900 text-white text-lg p-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* Member Selection */}
          <div className="mb-8">
            <label className="text-gray-400 text-sm font-semibold mb-3 block uppercase tracking-wider">
              Add Members ({selectedMembers.length} selected)
            </label>

            {connections.length === 0 ? (
              <p className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
                You need connections to create a group!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {connections.map((user) => {
                  const isSelected = selectedMembers.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user._id)}
                      className={`cursor-pointer p-3 rounded-xl border flex items-center gap-3 transition-all duration-200
                          ${
                            isSelected
                              ? "bg-blue-900/30 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                              : "bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500"
                          }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-blue-500 bg-blue-500" : "border-gray-500"}`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <img
                        src={user.photoUrl || "https://via.placeholder.com/40"}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-400"}`}
                      >
                        {user.firstName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleCreateGroup}
            disabled={!groupName || selectedMembers.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
          >
            🚀 Launch Group
          </button>
        </div>
      </div>

      {/* ─── GROUPS GRID ─── */}
      {myGroups.length === 0 ? (
        <div className="text-center py-20 bg-[#121212] rounded-3xl border border-gray-800 border-dashed">
          <div className="text-6xl mb-4">😶‍🌫️</div>
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
              onClick={() => navigate(`/groups/${group._id}`)} // This route needs to exist in your App.js
              className="group relative bg-[#121212] p-6 rounded-2xl border border-gray-800 hover:border-gray-600 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              {/* Card Decoration */}
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-inner
                     ${group.myRole === "admin" ? "bg-gradient-to-br from-yellow-500 to-orange-600" : "bg-gradient-to-br from-blue-500 to-purple-600"}
                  `}
                  >
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  {group.myRole === "admin" && (
                    <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold px-2 py-1 rounded border border-yellow-500/20">
                      ADMIN
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {group.name}
                </h3>

                <div className="flex items-center gap-4 text-gray-500 text-sm mt-4">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {group.membersCount || 1} Members
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Created recently
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                  <span className="text-blue-500 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                    Open Chat →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;

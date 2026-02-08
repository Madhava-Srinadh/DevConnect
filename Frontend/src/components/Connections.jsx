// src/components/Connections.jsx
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnections } from "../utils/conectionSlice";
import { Link, useNavigate } from "react-router-dom";
import { removeUser } from "../utils/userSlice";
import UserCard from "./UserCard";

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnections(res.data.data));
    } catch (err) {
      console.error("Error fetching connections:", err);
      if (err.response && err.response.status === 401) {
        dispatch(removeUser());
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      // Small artificial delay for smooth transition
      setTimeout(() => setLoading(false), 300);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [dispatch, navigate]);

  // Filter connections based on search
  const filteredConnections = connections
    ? connections.filter((c) =>
        (c.firstName + " " + c.lastName)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : [];

  // ------------------- RENDER -------------------

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Decor - Glowing Orb */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* ─── HEADER SECTION ─── */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              My Network
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">
              Manage your professional circle and stay in touch.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search connections..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-800 rounded-xl leading-5 bg-gray-900/50 text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all shadow-lg backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ─── CONTENT SECTION ─── */}

        {/* 1. Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-80 h-[420px] bg-gray-900/50 border border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-4"
              >
                <div className="w-32 h-32 bg-gray-800 rounded-full"></div>
                <div className="w-48 h-6 bg-gray-800 rounded"></div>
                <div className="w-24 h-4 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Loaded State */}
        {!loading && (
          <>
            {/* Case A: No Connections at all */}
            {connections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800 shadow-xl">
                  <span className="text-4xl">🕸️</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  No connections yet
                </h2>
                <p className="text-gray-400 max-w-sm mb-8">
                  Your network is empty. Start exploring the feed to connect
                  with developers!
                </p>
                <Link
                  to="/"
                  className="btn btn-primary px-8 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  Discover People
                </Link>
              </div>
            )}

            {/* Case B: Connections exist, but Search matches nothing */}
            {connections.length > 0 && filteredConnections.length === 0 && (
              <div className="text-center py-20">
                <p className="text-xl text-gray-400 font-semibold">
                  No connections found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-blue-400 hover:text-blue-300 underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Case C: Show List */}
            {filteredConnections.length > 0 && (
              <>
                <div className="mb-6 text-gray-500 text-sm font-semibold uppercase tracking-wider">
                  Showing {filteredConnections.length}{" "}
                  {filteredConnections.length === 1
                    ? "Connection"
                    : "Connections"}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center">
                  {filteredConnections.map((connection) => (
                    <div
                      key={connection._id}
                      className="transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                    >
                      <UserCard
                        user={{
                          ...connection,
                          connectionStatus: "connected",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Connections;

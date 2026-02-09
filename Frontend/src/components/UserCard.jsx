import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";

const UserCard = ({ user, isSearch = false, setSearchResults }) => {
  const {
    _id,
    firstName,
    lastName,
    photoUrl,
    about,
    skills,
    age,
    gender,
    connectionStatus: initialStatus = "none",
    requestId,
    connectionsCount = 0,
    profileStatus = "public", // Default to public
  } = user;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [connectionStatus, setConnectionStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // ---------------- MODAL STATES ----------------
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);

  // ---------------- DATA STATES ----------------
  const [purpose, setPurpose] = useState("");
  const [connectionsList, setConnectionsList] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // ---------------- HELPER: SHOW TOAST ----------------
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ---------------- LOGIC: REMOVE USER ----------------
  const removeFromSearch = () => {
    if (!setSearchResults) return;
    setSearchResults((prev) => prev.filter((u) => u._id !== _id));
  };

  const removeEverywhere = () => {
    removeFromSearch();
    dispatch(removeUserFromFeed(_id));
  };

  // ---------------- API ACTIONS ----------------

  const fetchConnections = async () => {
    setLoadingConnections(true);
    setConnectionsError(null);
    try {
      const res = await axios.get(`${BASE_URL}/user/userConnections/${_id}`, {
        withCredentials: true,
      });
      setConnectionsList(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch connections", err);
      if (err.response && err.response.status === 403) {
        setConnectionsError(
          "🔒 This account is private. Connect to view network.",
        );
        setConnectionsList([]);
      } else {
        setConnectionsError("Failed to load connections.");
      }
    } finally {
      setLoadingConnections(false);
    }
  };

  // ✅ UPDATED: Send Request with correct error handling
  const sendRequest = async (status) => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${_id}`,
        {},
        { withCredentials: true },
      );
      if (status === "ignored" || status === "interested") {
        removeEverywhere();
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error("Send request failed", err);
      // 🔥 FIX: Extract the specific message from the backend response
      const errorMsg = err.response?.data?.message || "Failed to send request.";
      showToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const sendPremiumRequest = async () => {
    if (!purpose.trim()) {
      alert("Please enter purpose");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/payment/request`,
        { toUserId: _id, purpose },
        { withCredentials: true },
      );
      const { amount, currency, orderId, keyId } = res.data;
      const options = {
        key: keyId,
        amount,
        currency,
        name: "DevConnect",
        description: "Premium Connection Request",
        order_id: orderId,
        handler: () => {
          removeEverywhere();
          setShowDetailModal(false);
          setShowPremiumModal(false);
        },
        theme: { color: "#7c3aed" },
      };
      new window.Razorpay(options).open();
      setPurpose("");
    } catch (err) {
      console.error("Premium request failed", err);
      const errorMsg =
        err.response?.data?.message || "Failed to process premium request.";
      showToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/request/respond/accepted/${requestId}`,
        {},
        { withCredentials: true },
      );
      setConnectionStatus("connected");
    } catch (err) {
      console.error("Accept failed", err);
      showToast(err.response?.data?.message || "Failed to accept request.");
    } finally {
      setLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/request/respond/rejected/${requestId}`,
        {},
        { withCredentials: true },
      );
      removeEverywhere();
      setShowDetailModal(false);
    } catch (err) {
      console.error("Reject failed", err);
      showToast(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER HELPERS ----------------
  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {connectionStatus === "none" && (
          <>
            <button
              disabled={loading}
              onClick={() => sendRequest("ignored")}
              className="px-6 py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition font-semibold"
            >
              Ignore
            </button>
            <button
              disabled={loading}
              onClick={() => sendRequest("interested")}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white shadow-lg shadow-blue-500/30 transition font-semibold"
            >
              Interested
            </button>
            <button
              disabled={loading}
              onClick={() => setShowPremiumModal(true)}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold shadow-lg shadow-yellow-500/30 transition"
            >
              Premium
            </button>
          </>
        )}

        {connectionStatus === "pending" && (
          <span className="px-4 py-2 bg-yellow-900/50 text-yellow-500 border border-yellow-500 rounded-full">
            Request Pending
          </span>
        )}

        {connectionStatus === "received" && (
          <>
            <button
              disabled={loading}
              onClick={rejectRequest}
              className="btn btn-error btn-sm rounded-full text-white"
            >
              Reject
            </button>
            <button
              disabled={loading}
              onClick={acceptRequest}
              className="btn btn-success btn-sm rounded-full text-white"
            >
              Accept
            </button>
          </>
        )}

        {connectionStatus === "connected" && (
          <button
            onClick={() => navigate(`/chat/${_id}`)}
            className="w-full btn btn-primary rounded-full"
          >
            Chat Now
          </button>
        )}
      </div>
    );
  };

  // ---------------- UI: MAIN COMPONENT ----------------
  return (
    <>
      {/* 1. THE CARD (Visible Grid Item) */}
      <div
        onClick={() => setShowDetailModal(true)}
        className="relative w-80 h-[420px] rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-[1.02] shadow-2xl bg-[#0f1014]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-[#121212] to-black opacity-90 z-0"></div>
        <div className="absolute top-0 w-full h-1/2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

        <div className="relative z-10 flex flex-col items-center pt-12 px-4 h-full">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-600 to-blue-600 shadow-[0_0_30px_rgba(147,51,234,0.5)]">
              <img
                src={photoUrl || "https://via.placeholder.com/150"}
                alt={firstName}
                className="w-full h-full rounded-full object-cover border-4 border-[#0f1014]"
              />
            </div>
            {/* Online/Status Indicator */}
            <div
              className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#0f1014] ${
                profileStatus === "public" ? "bg-green-500" : "bg-orange-500"
              }`}
              title={
                profileStatus === "public"
                  ? "Public Profile"
                  : "Private Profile"
              }
            ></div>
          </div>

          <h2 className="text-3xl font-bold text-purple-200 tracking-wide text-center drop-shadow-lg">
            {firstName} {lastName}
          </h2>

          <p className="text-gray-400 font-medium mt-1">
            {age ? `${age}, ` : ""} {gender || "Developer"}
          </p>

          <p className="text-gray-500 text-sm text-center mt-4 italic px-2 line-clamp-2">
            {about ||
              "A passionate developer looking for exciting collaborations!"}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {skills &&
              skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-1 rounded-full border border-blue-900 bg-blue-900/20 text-blue-400 text-xs font-semibold shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                >
                  {skill}
                </span>
              ))}
            {skills && skills.length > 3 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{skills.length - 3}
              </span>
            )}
          </div>

          <div className="mt-auto mb-6 text-gray-600 text-xs">
            Tap to view profile
          </div>
        </div>
      </div>

      {/* 2. THE DETAIL MODAL (Popup) */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-20"
            >
              ✕
            </button>

            <div className="h-24 bg-gradient-to-r from-black to-blue-900 relative"></div>

            <div className="px-6 pb-6 -mt-12 relative">
              <img
                src={photoUrl || "https://via.placeholder.com/150"}
                alt={firstName}
                className="w-24 h-24 rounded-full border-4 border-gray-900 object-cover shadow-lg"
              />

              <div className="mt-3">
                <h2 className="text-2xl font-bold text-white">
                  {firstName} {lastName}
                </h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>{connectionsCount} Connections</span>
                  {profileStatus === "private" && (
                    <span className="flex items-center gap-1 text-orange-400">
                      • 🔒 Private
                    </span>
                  )}
                </div>

                <p className="text-gray-300 mt-3 text-sm">{about}</p>

                <div className="flex flex-wrap gap-2 mt-4">
                  {skills?.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-gray-300 border border-gray-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION AREA */}
              <div className="mt-6 border-t border-gray-800 pt-4">
                {/* View Connections Button Logic */}
                {profileStatus === "private" &&
                connectionStatus !== "connected" ? (
                  <div className="w-full mb-4 py-2 text-sm text-yellow-600 bg-yellow-900/10 border border-yellow-900/30 rounded text-center">
                    🔒 Connect to view {firstName}'s network
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      fetchConnections();
                      setShowConnectionsModal(true);
                    }}
                    className="w-full mb-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition border border-transparent hover:border-gray-700"
                  >
                    View Connections List
                  </button>
                )}

                {renderActionButtons()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONNECTIONS LIST MODAL */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center backdrop-blur-md">
          <div className="bg-gray-900 w-full max-w-md h-[500px] rounded-xl border border-gray-800 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-white font-bold">{firstName}'s Network</h3>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="text-gray-400 hover:text-white btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loadingConnections ? (
                <div className="flex justify-center p-10">
                  <span className="loading loading-spinner text-purple-500"></span>
                </div>
              ) : connectionsError ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <span className="text-3xl mb-2">🔒</span>
                  <p className="text-yellow-500 font-medium">
                    {connectionsError}
                  </p>
                </div>
              ) : connectionsList.length === 0 ? (
                <p className="text-gray-500 text-center mt-10">
                  No visible connections.
                </p>
              ) : (
                <div className="space-y-3">
                  {connectionsList.map((conn) => (
                    <div
                      key={conn._id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-xl cursor-pointer transition border border-transparent hover:border-gray-700"
                    >
                      <img
                        src={conn.photoUrl || "https://via.placeholder.com/150"}
                        className="w-10 h-10 rounded-full object-cover"
                        alt=""
                      />
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {conn.firstName} {conn.lastName}
                        </p>
                        <p className="text-gray-500 text-xs line-clamp-1">
                          {conn.about || "No bio available"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. PREMIUM MODAL */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm">
          <div className="bg-gray-900 p-6 rounded-xl w-80 md:w-96 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <h3 className="text-xl font-bold mb-4 text-white text-center">
              Premium Connect 💎
            </h3>
            <textarea
              className="w-full bg-gray-800 text-white rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows="3"
              placeholder="Write a message telling them why you want to connect..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            <div className="flex gap-3 mt-5">
              <button
                className="flex-1 py-2 text-gray-400 hover:text-white transition"
                onClick={() => setShowPremiumModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={sendPremiumRequest}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded text-white font-semibold hover:shadow-lg transition"
              >
                Pay ₹50
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl border border-gray-700 z-[100] animate-bounce">
          {toastMessage}
        </div>
      )}
    </>
  );
};

export default UserCard;

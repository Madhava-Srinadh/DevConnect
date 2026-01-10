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
    connectionStatus: initialStatus = "none",
    requestId,
  } = user;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [connectionStatus, setConnectionStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // 🔥 Premium modal state
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [purpose, setPurpose] = useState("");

  // ---------------- REMOVE HELPERS ----------------
  const removeFromSearch = () => {
    if (!setSearchResults) return;
    setSearchResults((prev) => prev.filter((u) => u._id !== _id));
  };

  const removeEverywhere = () => {
    removeFromSearch();
    dispatch(removeUserFromFeed(_id));
  };

  // ---------------- NORMAL REQUEST ----------------
  const sendRequest = async (status) => {
    if (loading) return;
    setLoading(true);

    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${_id}`,
        {},
        { withCredentials: true }
      );

      if (status === "ignored" || status === "interested") {
        removeEverywhere();
      }
    } catch (err) {
      console.error("Send request failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- PREMIUM REQUEST ----------------
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
        { withCredentials: true }
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
          // webhook handles DB
          removeEverywhere();
        },
        theme: { color: "#7c3aed" },
      };

      new window.Razorpay(options).open();
      setShowPremiumModal(false);
      setPurpose("");
    } catch (err) {
      console.error("Premium request failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- ACCEPT / REJECT ----------------
  const acceptRequest = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await axios.post(
        `${BASE_URL}/request/respond/accepted/${requestId}`,
        {},
        { withCredentials: true }
      );
      setConnectionStatus("connected");
    } catch (err) {
      console.error("Accept failed", err);
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
        { withCredentials: true }
      );
      removeEverywhere();
    } catch (err) {
      console.error("Reject failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md bg-gray-800 text-white rounded-xl shadow-lg border border-gray-700">
      <div className="flex flex-col items-center">
        <img
          src={photoUrl || "https://via.placeholder.com/150"}
          alt={firstName}
          className="w-28 h-28 rounded-full object-cover mb-3"
        />
        <h2 className="text-xl font-bold">
          {firstName} {lastName}
        </h2>
        <p className="text-gray-400 text-sm text-center">{about}</p>
      </div>

      {skills?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {skills.map((s, i) => (
            <span key={i} className="badge badge-outline">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-5">
        {connectionStatus === "none" && (
          <>
            <button
              disabled={loading}
              onClick={() => sendRequest("ignored")}
              className="btn btn-error"
            >
              Ignore
            </button>

            <button
              disabled={loading}
              onClick={() => sendRequest("interested")}
              className="btn btn-success"
            >
              Interested
            </button>

            <button
              disabled={loading}
              onClick={() => setShowPremiumModal(true)}
              className="btn btn-warning"
            >
              Premium Request ₹50
            </button>
          </>
        )}

        {connectionStatus === "pending" && (
          <button className="btn btn-warning cursor-not-allowed">
            Pending
          </button>
        )}

        {connectionStatus === "received" && (
          <>
            <button
              disabled={loading}
              onClick={rejectRequest}
              className="btn btn-error"
            >
              Reject
            </button>
            <button
              disabled={loading}
              onClick={acceptRequest}
              className="btn btn-success"
            >
              Accept
            </button>
          </>
        )}

        {connectionStatus === "connected" && (
          <button
            onClick={() => navigate(`/chat/${_id}`)}
            className="btn btn-primary"
          >
            Chat
          </button>
        )}
      </div>

      {/* 🔥 PREMIUM MODAL */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-2">Premium Request</h3>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Why do you want to connect?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost"
                onClick={() => setShowPremiumModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                disabled={loading}
                onClick={sendPremiumRequest}
              >
                Pay ₹50 & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;

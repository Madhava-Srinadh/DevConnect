import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { useEffect, useState } from "react";
import UserCard from "./UserCard"; // Import to use inside Modal

const Requests = () => {
  const requests = useSelector((store) => store.requests);
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null); // For the Modal

  const reviewRequest = async (status, requestId) => {
    try {
      await axios.post(
        BASE_URL + "/request/review/" + status + "/" + requestId,
        {},
        { withCredentials: true },
      );
      dispatch(removeRequest(requestId));
      if (selectedRequest && selectedRequest._id === requestId) {
        setSelectedRequest(null); // Close modal if we handled the request
      }
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL + "/user/requests/received", {
        withCredentials: true,
      });
      dispatch(addRequests(res.data.data));
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [dispatch]);

  // ------------------- HELPERS -------------------

  // 1. Skeleton Loader
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 my-10">
        <h1 className="text-3xl font-bold text-white mb-8 pl-4">
          Loading Requests...
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-900 rounded-3xl animate-pulse border border-gray-800 flex items-center p-6 gap-4"
            >
              <div className="w-24 h-24 bg-gray-800 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="w-3/4 h-6 bg-gray-800 rounded"></div>
                <div className="w-1/2 h-4 bg-gray-800 rounded"></div>
                <div className="w-full h-12 bg-gray-800 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
        <p className="text-gray-400 max-w-sm">
          No pending connection requests at the moment.
        </p>
      </div>
    );
  }

  // 3. Main Content
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Connection Requests
        </h1>
        <p className="text-gray-500 mt-2">
          Review people who want to join your network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {requests.map((request) => {
          const { _id, fromUserId, requestType, purpose } = request;
          const { firstName, lastName, photoUrl, age, gender, about } =
            fromUserId;
          const isPremium = requestType === "premium";

          return (
            <div
              key={_id}
              className={`relative flex flex-col sm:flex-row bg-[#121212] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group
                ${isPremium ? "border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]" : "border border-gray-800"}`}
            >
              {/* --- LEFT: Image & Info --- */}
              <div
                onClick={() => setSelectedRequest(request)} // Click opens full modal
                className="p-6 flex-1 flex flex-row items-start gap-5 cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={photoUrl || "https://via.placeholder.com/150"}
                    alt={firstName}
                    className={`w-20 h-20 rounded-2xl object-cover ${isPremium ? "border-2 border-yellow-500" : "border border-gray-700"}`}
                  />
                  {isPremium && (
                    <span className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg z-10">
                      👑 PREMIUM
                    </span>
                  )}
                </div>

                {/* Text Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {firstName} {lastName}
                  </h2>

                  <p className="text-gray-400 text-xs font-medium mt-1 uppercase tracking-wide">
                    {age ? `${age}, ` : ""}
                    {gender || "Developer"}
                  </p>

                  {/* Premium Message or Bio */}
                  {isPremium && purpose ? (
                    <div className="mt-3 bg-yellow-900/20 border-l-2 border-yellow-500 pl-3 py-1">
                      <p className="text-xs text-yellow-500 font-bold mb-0.5">
                        Message:
                      </p>
                      <p className="text-gray-300 text-sm italic line-clamp-2">
                        "{purpose}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                      {about}
                    </p>
                  )}
                </div>
              </div>

              {/* --- RIGHT/BOTTOM: Actions --- */}
              <div className="flex sm:flex-col justify-center gap-3 p-6 pt-0 sm:pt-6 sm:border-l border-gray-800 bg-gray-900/30">
                <button
                  onClick={() => reviewRequest("accepted", _id)}
                  className={`flex-1 sm:w-24 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95
                     ${
                       isPremium
                         ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:from-yellow-400 hover:to-amber-500"
                         : "bg-white text-black hover:bg-blue-50"
                     }`}
                >
                  Accept
                </button>

                <button
                  onClick={() => reviewRequest("rejected", _id)}
                  className="flex-1 sm:w-24 px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800 text-gray-400 hover:bg-red-500/20 hover:text-red-400 border border-transparent hover:border-red-500/50 transition-all active:scale-95"
                >
                  Ignore
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------- DETAIL MODAL ---------------- */}
      {/* We reuse the UserCard inside a simple Modal wrapper. 
          The UserCard handles its own internal "Accept/Reject" logic too, 
          but here we primarily use it for viewing the profile.
      */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          {/* Trick: We render UserCard but inject the 'requestId' and 'connectionStatus' 
                so if the user interacts inside the modal, it works too. 
             */}
          <UserCard
            user={{
              ...selectedRequest.fromUserId, // Spread user details
              _id: selectedRequest.fromUserId._id,
              requestId: selectedRequest._id, // Important for API calls inside UserCard
              connectionStatus: "received", // Tells UserCard to show Accept/Reject buttons
              requestType: selectedRequest.requestType, // Pass type just in case
            }}
          />

          {/* Close Overlay (invisible, behind card) */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setSelectedRequest(null)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Requests;

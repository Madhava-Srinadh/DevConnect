import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { useEffect } from "react";

const Requests = () => {
  const requests = useSelector((store) => store.requests);
  const dispatch = useDispatch();

  const reviewRequest = async (status, requestId) => {
    try {
      await axios.post(
        BASE_URL + "/request/review/" + status + "/" + requestId,
        {},
        { withCredentials: true }
      );
      dispatch(removeRequest(requestId));
    } catch (err) {
      console.error("Error reviewing request:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/requests/received", {
        withCredentials: true,
      });

      dispatch(addRequests(res.data.data));
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (!requests) return null;

  if (requests.length === 0) {
    return (
      <h1 className="flex justify-center my-10 text-white">
        No Requests Found
      </h1>
    );
  }

  return (
    <div className="text-center my-10">
      <h1 className="font-bold text-white text-3xl mb-6">
        Connection Requests
      </h1>

      {requests.map((request) => {
        const {
          _id,
          fromUserId,
          requestType = "normal",
          purpose,
        } = request;

        const {
          firstName,
          lastName,
          photoUrl,
          age,
          gender,
          about,
        } = fromUserId;

        const isPremium = requestType === "premium";

        return (
          <div
            key={_id}
            className={`flex justify-between items-center m-4 p-5 rounded-lg mx-auto max-w-3xl
              ${
                isPremium
                  ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400"
                  : "bg-base-300"
              }`}
          >
            {/* LEFT: PHOTO */}
            <div className="relative">
              <img
                alt="photo"
                className="w-20 h-20 rounded-full"
                src={photoUrl}
              />

              {/* ⭐ PREMIUM BADGE */}
              {isPremium && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                  ⭐ Premium
                </span>
              )}
            </div>

            {/* MIDDLE: DETAILS */}
            <div className="text-left mx-4 flex-1">
              <h2 className="font-bold text-xl text-white">
                {firstName} {lastName}
              </h2>

              {age && gender && (
                <p className="text-sm text-gray-300">
                  {age}, {gender}
                </p>
              )}

              <p className="text-gray-300">{about}</p>

              {/* 🔥 PURPOSE (ONLY FOR PREMIUM) */}
              {isPremium && purpose && (
                <div className="mt-2 p-3 bg-black/30 rounded-md border-l-4 border-yellow-400">
                  <p className="text-sm text-yellow-300 font-semibold">
                    Purpose
                  </p>
                  <p className="text-sm text-gray-200 italic">
                    “{purpose}”
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-error btn-sm"
                onClick={() => reviewRequest("rejected", _id)}
              >
                Reject
              </button>

              <button
                className={`btn btn-sm ${
                  isPremium ? "btn-warning" : "btn-success"
                }`}
                onClick={() => reviewRequest("accepted", _id)}
              >
                Accept
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Requests;

// src/components/UserCard.jsx

import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeUserFromFeed, resetFeed } from "../utils/feedSlice";
import { useNavigate } from "react-router-dom";
import { removeUser as removeAuthUser } from "../utils/userSlice";

const UserCard = ({ user }) => {
  // Destructure user properties
  const { _id, firstName, lastName, photoUrl, age, gender, about, skills } = user || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Separate loading states for each button
  const [loadingIgnore, setLoadingIgnore] = useState(false);
  const [loadingInterested, setLoadingInterested] = useState(false);
  const [actionError, setActionError] = useState(null);

  if (!user) return null;

  const handleSendRequest = async (status, userId) => {
    setActionError(null);
    if (status === "ignored") {
      setLoadingIgnore(true);
    } else {
      setLoadingInterested(true);
    }

    try {
      await axios.post(
        `${BASE_URL}/request/send/${status}/${userId}`,
        {},
        { withCredentials: true }
      );
      dispatch(removeUserFromFeed(userId));
    } catch (err) {
      console.error(`Error sending ${status} request:`, err);
      setActionError("Failed to send request. Please try again.");

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        dispatch(removeAuthUser());
        dispatch(resetFeed());
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      if (status === "ignored") {
        setLoadingIgnore(false);
      } else {
        setLoadingInterested(false);
      }
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-gray-800 rounded-xl shadow-2xl my-10 text-white border border-gray-700">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-purple-500 ring-offset-base-100 ring-offset-2 shadow-lg mb-4">
          <img
            src={photoUrl || "https://via.placeholder.com/160x160?text=Profile+Image"}
            alt={`${firstName}'s profile`}
            className="object-cover w-full h-full"
          />
        </div>
        <h2 className="text-3xl font-extrabold mb-1 text-purple-400">
          {firstName} {lastName}
        </h2>
        {age && gender && (
          <p className="text-lg text-gray-300">
            {age}, {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </p>
        )}
      </div>

      {/* About Section */}
      <div className="mt-6">
        <p className="text-gray-400 text-sm leading-relaxed">
          {about || "Passionate developer looking for exciting collaborations!"}
        </p>
      </div>

      {/* Skills */}
      {skills?.length > 0 && (
        <>
          <div className="divider text-gray-600 my-6 text-xl font-semibold">Skills</div>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="badge badge-lg badge-outline badge-primary text-purple-300 border-purple-500 py-3 px-5 text-base shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
        <button
          onClick={() => handleSendRequest("ignored", _id)}
          disabled={loadingIgnore}
          className={`btn btn-error btn-lg text-white flex-1 ${loadingIgnore ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loadingIgnore ? (
            <span className="loading loading-spinner loading-md text-white"></span>
          ) : (
            "Ignore"
          )}
        </button>
        <button
          onClick={() => handleSendRequest("interested", _id)}
          disabled={loadingInterested}
          className={`btn btn-success btn-lg text-white flex-1 ${loadingInterested ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loadingInterested ? (
            <span className="loading loading-spinner loading-md text-white"></span>
          ) : (
            "Interested"
          )}
        </button>
      </div>

      {/* Error Message */}
      {actionError && (
        <p className="text-red-400 text-sm mt-4 text-center">
          {actionError}
        </p>
      )}
    </div>
  );
};

export default UserCard;

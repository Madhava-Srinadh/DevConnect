import React from "react";

const UserCard = ({ user, onAction, loadingAction, isSelfProfile = false }) => {
  if (!user || !user.firstName) return null;

  const { _id, firstName, lastName, photoUrl, age, gender, about, skills } = user;

  return (
    <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-visible shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 transform transition-all duration-500 ease-in-out hover:scale-105 pt-24 pb-6 px-6">
      {/* Profile Image - fully visible and centered */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-xl bg-gray-700">
          <img
            src={photoUrl || "https://via.placeholder.com/160x160?text=Profile+Image"}
            alt={`${firstName}'s profile`}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>

      {/* User Info */}
      <div className="text-white text-center mt-4">
        <h2 className="text-4xl font-extrabold mb-1">
          {firstName} {lastName}
        </h2>
        {age && gender && (
          <p className="text-lg text-gray-300 mb-2">
            {age}, {gender}
          </p>
        )}
        <p className="text-sm text-gray-400 mb-4">
          {about || "Passionate developer looking for exciting collaborations!"}
        </p>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="badge badge-outline badge-info text-xs font-semibold px-3 py-2 border-blue-400 text-blue-300"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="badge badge-outline badge-info text-xs font-semibold px-3 py-2 border-blue-400 text-blue-300">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!isSelfProfile && onAction && (
          <div className="flex justify-center gap-6 mt-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white w-14 h-14 rounded-full text-xl"
              onClick={() => onAction("reject", _id)}
              disabled={loadingAction}
            >
              ✕
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full text-xl"
              onClick={() => onAction("accept", _id)}
              disabled={loadingAction}
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;

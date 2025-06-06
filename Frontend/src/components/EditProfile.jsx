import { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";

const EditProfile = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState("");
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhotoUrl(user.photoUrl || "");
      setAge(user.age || "");
      setGender(user.gender || "");
      setAbout(user.about || "");
      setSkills(user.skills ? user.skills.join(", ") : "");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-900 text-white text-lg">
        Loading user data or please log in...
      </div>
    );
  }

  const saveProfile = async () => {
    setError("");
    setLoadingSave(true);

    try {
      const skillsArray = skills.split(",").map(skill => skill.trim()).filter(skill => skill !== "");

      await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          photoUrl,
          age: Number(age),
          gender,
          about,
          skills: skillsArray,
        },
        { withCredentials: true }
      ).then(res => {
          dispatch(addUser(res?.data?.data));
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 3000);
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong saving profile.");
    } finally {
      setLoadingSave(false);
    }
  };

  const previewUser = {
    _id: user._id,
    firstName: firstName,
    lastName: lastName,
    photoUrl: photoUrl,
    age: age,
    gender: gender,
    about: about,
    skills: skills.split(",").map(s => s.trim()).filter(s => s !== ""),
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start py-10 px-4 gap-10 min-h-[calc(100vh-120px)]">
        {/* Edit Profile Card (Form) */}
        <div className="card bg-base-300 w-full max-w-md shadow-2xl rounded-xl p-6 lg:p-8">
          <div className="card-body p-0">
            <h2 className="text-4xl font-extrabold text-center text-primary mb-6">Edit Your Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-base-content/80">First Name:</span>
                </div>
                <input
                  type="text"
                  value={firstName}
                  className="input input-bordered w-full text-base"
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-base-content/80">Last Name:</span>
                </div>
                <input
                  type="text"
                  value={lastName}
                  className="input input-bordered w-full text-base"
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </label>
              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text text-base-content/80">Photo URL:</span>
                </div>
                <input
                  type="text"
                  value={photoUrl}
                  className="input input-bordered w-full text-base"
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Link to your profile photo"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-base-content/80">Age:</span>
                </div>
                <input
                  type="number"
                  value={age}
                  className="input input-bordered w-full text-base"
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text text-base-content/80">Gender:</span>
                </div>
                <select
                  value={gender}
                  className="select select-bordered w-full text-base"
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text text-base-content/80">About:</span>
                </div>
                <textarea
                  value={about}
                  className="textarea textarea-bordered h-24 w-full text-base"
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell us about yourself..."
                ></textarea>
              </label>
              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text text-base-content/80">Skills (comma-separated):</span>
                </div>
                <input
                  type="text"
                  value={skills}
                  className="input input-bordered w-full text-base"
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, JavaScript"
                />
              </label>
            </div>
            <p className="text-error text-sm mt-4 text-center">{error}</p>
            <div className="flex justify-center mt-6">
              <button
                className="btn btn-primary btn-lg min-w-[120px]"
                onClick={saveProfile}
                disabled={loadingSave}
              >
                {loadingSave ? (
                  <span className="loading loading-spinner loading-md"></span>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- LIVE PREVIEW OF USER PROFILE (Updated UI) --- */}
        <div className="w-full max-w-sm"> {/* Max width of the preview card */}
          <div className="relative w-full mx-auto rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-800 to-gray-950 transform group"> {/* Removed hover:scale-105 for static preview */}
            {/* Subtle Background Animation */}
            <div className="absolute inset-0 bg-cover bg-center opacity-10 blur-sm transition-all duration-700"
                 style={{ backgroundImage: `url(${previewUser.photoUrl || 'https://via.placeholder.com/600x400?text=Background'})` }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-90"></div>

            {/* Profile Image - Moved slightly lower for better framing */}
            <div className="relative z-10 pt-8 flex justify-center">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-purple-600 shadow-xl bg-gray-700 ring-4 ring-purple-400/50">
                <img
                  src={previewUser.photoUrl || "https://via.placeholder.com/160x160?text=Profile+Image"}
                  alt={`${previewUser.firstName}'s profile`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="relative text-white text-center px-6 pb-6 pt-4 z-10">
              <h2 className="text-4xl font-extrabold mb-1 text-purple-300 drop-shadow-lg">
                {previewUser.firstName} {previewUser.lastName}
              </h2>
              {previewUser.age && previewUser.gender && (
                <p className="text-lg text-gray-300 mb-2">
                  {previewUser.age}, {previewUser.gender}
                </p>
              )}
              <p className="text-sm text-gray-400 mb-4 italic leading-relaxed">
                {previewUser.about || "A passionate developer looking for exciting collaborations and new challenges!"}
              </p>

              {/* Skills */}
              {previewUser.skills && previewUser.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {previewUser.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="badge badge-outline text-xs font-semibold px-4 py-2 border-blue-500 text-blue-300 bg-blue-900/30 backdrop-blur-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {previewUser.skills.length > 4 && (
                    <span className="badge badge-outline text-xs font-semibold px-4 py-2 border-blue-500 text-blue-300 bg-blue-900/30 backdrop-blur-sm rounded-full">
                      +{previewUser.skills.length - 4} more
                    </span>
                  )}
                </div>
              )}
              {/* No Action Buttons in the preview */}
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div className="z-50 toast toast-top toast-center">
          <div className="alert alert-success">
            <span>Profile saved successfully.</span>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;
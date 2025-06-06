import { useState } from "react";
import UserCard from "./UserCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux"; // Import useSelector
import { addUser } from "../utils/userSlice";

const EditProfile = () => {
  const user = useSelector((store) => store.user); // Fetch user from Redux store

  // Handle case where user data is not yet available (e.g., direct access before user fetch)
  if (!user) {
    // You might want to redirect to login or show a loading state
    return <div className="p-4 text-center text-lg min-h-[calc(100vh-80px)] bg-gray-900 text-white flex items-center justify-center">Loading user data or please log in...</div>;
  }

  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "");
  const [about, setAbout] = useState(user.about || "");
  const [skills, setSkills] = useState(user.skills ? user.skills.join(", ") : "");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);

  const saveProfile = async () => {
    setError(""); //Clear Errors
    try {
      const skillsArray = skills.split(",").map(skill => skill.trim()).filter(skill => skill !== "");

      const res = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          photoUrl,
          age,
          gender,
          about,
          skills: skillsArray,
        },
        { withCredentials: true }
      );
      dispatch(addUser(res?.data?.data));
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong saving profile.");
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start my-10 px-4">
        {/* Edit Profile Card */}
        <div className="card bg-base-300 w-full max-w-sm shadow-xl lg:mr-10 mb-10 lg:mb-0">
          <div className="card-body">
            <h2 className="card-title justify-center text-3xl font-bold mb-4">Edit Your Profile</h2>
            <div className="space-y-4">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">First Name:</span>
                </div>
                <input
                  type="text"
                  value={firstName}
                  className="input input-bordered w-full"
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Last Name:</span>
                </div>
                <input
                  type="text"
                  value={lastName}
                  className="input input-bordered w-full"
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Photo URL :</span>
                </div>
                <input
                  type="text"
                  value={photoUrl}
                  className="input input-bordered w-full"
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Link to your profile photo"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Age:</span>
                </div>
                <input
                  type="number"
                  value={age}
                  className="input input-bordered w-full"
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Gender:</span>
                </div>
                <select
                  value={gender}
                  className="select select-bordered w-full"
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="ther">Other</option>
                </select>
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">About:</span>
                </div>
                <textarea
                  value={about}
                  className="textarea textarea-bordered h-24 w-full"
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell us about yourself..."
                ></textarea>
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Skills (comma-separated):</span>
                </div>
                <input
                  type="text"
                  value={skills}
                  className="input input-bordered w-full"
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, JavaScript"
                />
              </label>
            </div>
            <p className="text-red-500 text-sm mt-4">{error}</p>
            <div className="card-actions justify-center m-2">
              <button className="btn btn-primary btn-lg" onClick={saveProfile}>
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview UserCard */}
        <div className="w-full max-w-sm">
          <UserCard
            user={{ ...user, firstName, lastName, photoUrl, age, gender, about, skills: skills.split(",").map(s => s.trim()).filter(s => s !== "") }}
            isSelfProfile={true}
          />
        </div>
      </div>
      {showToast && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-success">
            <span>Profile saved successfully.</span>
          </div>
        </div>
      )}
    </>
  );
};
export default EditProfile;
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
  // New State for Profile Status
  const [profileStatus, setProfileStatus] = useState("public");
  
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
      setProfileStatus(user.profileStatus || "public");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-900 text-white text-lg">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  const saveProfile = async () => {
    setError("");
    setLoadingSave(true);

    try {
      const skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      const res = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          photoUrl,
          age: Number(age),
          gender,
          about,
          skills: skillsArray,
          profileStatus, // Send the new status
        },
        { withCredentials: true }
      );

      dispatch(addUser(res?.data?.data));
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong saving profile."
      );
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
    skills: skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== ""),
    profileStatus: profileStatus,
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-center items-center lg:items-start py-10 px-4 gap-10 min-h-[calc(100vh-120px)] bg-gray-950">
        {/* Edit Profile Card (Form) */}
        <div className="card bg-gray-900 border border-gray-800 w-full max-w-md shadow-2xl rounded-2xl p-6 lg:p-8">
          <div className="card-body p-0">
            <h2 className="text-3xl font-extrabold text-center text-white mb-6">
              Edit Your Profile
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    First Name
                  </span>
                </div>
                <input
                  type="text"
                  value={firstName}
                  className="input input-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>

              {/* Last Name */}
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Last Name
                  </span>
                </div>
                <input
                  type="text"
                  value={lastName}
                  className="input input-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>

              {/* Photo URL */}
              <label className="form-control w-full md:col-span-2">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Photo URL
                  </span>
                </div>
                <input
                  type="text"
                  value={photoUrl}
                  className="input input-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </label>

              {/* Age */}
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Age
                  </span>
                </div>
                <input
                  type="number"
                  value={age}
                  className="input input-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setAge(e.target.value)}
                />
              </label>

              {/* Gender */}
              <label className="form-control w-full">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Gender
                  </span>
                </div>
                <select
                  value={gender}
                  className="select select-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              {/* ─────────────────────────────────────────────
                   NEW: Profile Status Selection
              ───────────────────────────────────────────── */}
              <label className="form-control w-full md:col-span-2">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Profile Privacy
                  </span>
                </div>
                <div className="flex gap-4 p-1">
                  <label className="cursor-pointer label gap-2 border border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-800 transition flex-1">
                    <input 
                      type="radio" 
                      name="status" 
                      className="radio radio-success radio-sm" 
                      checked={profileStatus === 'public'}
                      onChange={() => setProfileStatus('public')}
                    />
                    <span className="label-text text-gray-300 font-medium">Public 🌍</span>
                  </label>
                  <label className="cursor-pointer label gap-2 border border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-800 transition flex-1">
                    <input 
                      type="radio" 
                      name="status" 
                      className="radio radio-warning radio-sm" 
                      checked={profileStatus === 'private'}
                      onChange={() => setProfileStatus('private')}
                    />
                    <span className="label-text text-gray-300 font-medium">Private 🔒</span>
                  </label>
                </div>
                <div className="label pt-0">
                   <span className="label-text-alt text-gray-500">
                     {profileStatus === 'public' 
                        ? 'Visible to everyone in feed.' 
                        : 'Hidden from feed. Only connections can see details.'}
                   </span>
                </div>
              </label>

              {/* About */}
              <label className="form-control w-full md:col-span-2">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    About
                  </span>
                </div>
                <textarea
                  value={about}
                  className="textarea textarea-bordered h-24 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setAbout(e.target.value)}
                ></textarea>
              </label>

              {/* Skills */}
              <label className="form-control w-full md:col-span-2">
                <div className="label pb-1">
                  <span className="label-text text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Skills (comma-separated)
                  </span>
                </div>
                <input
                  type="text"
                  value={skills}
                  className="input input-bordered w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  onChange={(e) => setSkills(e.target.value)}
                />
              </label>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            <div className="flex justify-center mt-8">
              <button
                className="btn btn-primary w-full md:w-auto px-10 rounded-full font-bold shadow-lg shadow-blue-500/30"
                onClick={saveProfile}
                disabled={loadingSave}
              >
                {loadingSave ? (
                  <span className="loading loading-spinner loading-md"></span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- LIVE PREVIEW (UserCard Style) --- */}
        <div className="w-full max-w-sm sticky top-10">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center mb-4">Live Preview</div>
          
          {/* Card Container */}
          <div className="relative w-80 h-[420px] mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#0f1014] border border-gray-800">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-[#121212] to-black opacity-90 z-0"></div>

            <div className="relative z-10 flex flex-col items-center pt-12 px-4 h-full">
              
              {/* Avatar with Glow based on Status */}
              <div className="relative mb-4">
                <div className={`w-32 h-32 rounded-full p-1 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                    profileStatus === 'public' 
                    ? 'bg-gradient-to-tr from-green-500 to-emerald-600 shadow-green-500/20' 
                    : 'bg-gradient-to-tr from-orange-500 to-amber-600 shadow-orange-500/20'
                }`}>
                  <img
                    src={previewUser.photoUrl || "https://via.placeholder.com/150"}
                    alt={previewUser.firstName}
                    className="w-full h-full rounded-full object-cover border-4 border-[#0f1014]"
                  />
                </div>
                {/* Status Dot */}
                <div 
                   className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-[#0f1014] ${
                       profileStatus === 'public' ? 'bg-green-500' : 'bg-orange-500'
                   }`}
                   title={profileStatus}
                ></div>
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-white tracking-wide text-center">
                {previewUser.firstName} {previewUser.lastName}
              </h2>

              {/* Age & Gender */}
              <p className="text-gray-400 font-medium mt-1 text-sm">
                 {previewUser.age ? `${previewUser.age}, ` : "Age, "} {previewUser.gender || "Gender"}
              </p>

              {/* Bio */}
              <p className="text-gray-500 text-sm text-center mt-4 italic px-2 line-clamp-3">
                {previewUser.about || "Your bio will appear here..."}
              </p>

              {/* Skills Pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {previewUser.skills && previewUser.skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full border border-blue-900 bg-blue-900/20 text-blue-400 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
                {previewUser.skills && previewUser.skills.length > 3 && (
                    <span className="px-2 py-1 text-gray-500 text-xs">+{previewUser.skills.length - 3}</span>
                )}
              </div>
              
              {/* Status Indicator Text */}
              <div className="mt-auto mb-6">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      profileStatus === 'public' 
                      ? 'border-green-900 bg-green-900/20 text-green-400' 
                      : 'border-orange-900 bg-orange-900/20 text-orange-400'
                  }`}>
                      {profileStatus === 'public' ? 'Public Profile' : 'Private Profile'}
                  </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Profile updated successfully!</span>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;
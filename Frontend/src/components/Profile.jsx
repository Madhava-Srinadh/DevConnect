
import { useSelector} from "react-redux";
import { Link, useNavigate } from "react-router-dom";

const Profile = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate(); // Initialize the navigate hook

  // Updated handleUpgrade function to navigate to the /premium page
  const handleUpgrade = () => {
    navigate("/premium");
  };

  if (!user) {
    return (
      <div className="p-4 text-center text-lg min-h-[calc(100vh-80px)] bg-gray-900 text-white flex items-center justify-center">
        <p>Please <Link to="/login" className="text-blue-500 hover:underline">log in</Link> to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl my-10 text-white border border-gray-700">
      <h1 className="text-5xl font-extrabold mb-8 text-center text-purple-400">My Profile</h1>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        {/* Profile Picture */}
        <div className="avatar">
          <div className="w-40 h-40 rounded-full ring ring-purple-500 ring-offset-base-100 ring-offset-2 overflow-hidden shadow-lg">
            <img
              src={user.photoUrl || "https://via.placeholder.com/160x160?text=Profile"}
              alt={`${user.firstName}'s photo`}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-4xl font-bold mb-2 text-white">{user.firstName} {user.lastName}</h2>
          {user.age && user.gender && (
            <p className="text-xl text-gray-300 mb-2">
              <span className="font-semibold">{user.age}</span> years old, <span className="font-semibold">{user.gender}</span>
            </p>
          )}
          <p className="text-lg text-gray-400 leading-relaxed max-w-prose">
            {user.about || "Looks like you haven't told us much about yourself yet! Click 'Edit Profile' to add a description."}
          </p>
        </div>
      </div>

      <div className="divider text-gray-600 my-8 text-xl font-semibold">Contact & Membership</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-lg mb-8">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v2m0 6l2 2h14l2-2m-2 0V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2z" />
          </svg>
          <p><span className="font-semibold text-gray-300">Email:</span> {user.emailId}</p>
        </div>

        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20a6 6 0 100-12 6 6 0 000 12z" />
          </svg>
          <p>
            <span className="font-semibold text-gray-300">Membership:</span>{" "}
            <span className={`badge ${user.membershipType === "gold" ? "badge-warning" : "badge-info"} text-white font-bold`}>
              {user.membershipType ? user.membershipType.toUpperCase() : "FREE"}
            </span>
          </p>
        </div>

      </div>



      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
        <Link to="/profile/edit" className="btn btn-warning btn-lg text-white hover:bg-orange-500 transition-colors duration-300">
          Edit Profile
        </Link>
        {!user.isPremium && (
          <button onClick={handleUpgrade} className="btn btn-success btn-lg text-white hover:bg-green-600 transition-colors duration-300">
            Upgrade Membership
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
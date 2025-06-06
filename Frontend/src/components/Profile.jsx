import React from "react";
import { useSelector, useDispatch } from "react-redux"; // Import useDispatch
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { Link } from "react-router-dom";
import { addUser } from "../utils/userSlice"; // Import addUser to update Redux store

const Profile = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch(); // Initialize useDispatch

  const handleUpgrade = async () => {
    if (!user) {
      alert("Please log in to upgrade your membership.");
      return;
    }
    try {
      const res = await axios.post(
        BASE_URL + "/payment/upgrade",
        {},
        { withCredentials: true }
      );
      const { amount, keyId, currency, orderId } = res.data.order; // Destructure keyId

      const options = {
        key: keyId, // Use keyId from the backend
        amount,
        currency,
        name: "DevTinder",
        description: "Membership Upgrade",
        order_id: orderId,
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.emailId,
          contact: "9999999999", // This should ideally come from user data or be optional
        },
        theme: {
          color: "#6D28D9", // Consistent with Premium.jsx
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(
              BASE_URL + "/payment/verify", // This endpoint should handle upgrade verification
              response,
              { withCredentials: true }
            );
            if (verifyRes.data.success) {
              alert("Membership upgraded to Gold!");
              // Re-fetch user data to update Redux store with new membership status
              const updatedUserRes = await axios.get(BASE_URL + "/profile/view", { withCredentials: true });
              dispatch(addUser(updatedUserRes.data)); // Update user in Redux store
            } else {
              alert("Membership upgrade verification failed.");
            }
          } catch (verifyError) {
            console.error("Membership upgrade verification error:", verifyError);
            alert("Error verifying upgrade. Please try again or contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal dismissed for upgrade');
            alert('Upgrade process cancelled.');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error initiating membership upgrade:", err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(`Upgrade error: ${err.response.data.message}`);
      } else {
        alert("Failed to initiate upgrade. Please try again.");
      }
    }
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
        
        {user.isPremium && user.premiumExpiry && (
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p><span className="font-semibold text-gray-300">Premium Expiry:</span> {new Date(user.premiumExpiry).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {user.skills && user.skills.length > 0 && (
        <>
          <div className="divider text-gray-600 my-8 text-xl font-semibold">Skills</div>
          <div className="flex flex-wrap gap-3 mb-8 justify-center">
            {user.skills.map((skill, index) => (
              <span key={index} className="badge badge-lg badge-outline badge-primary text-purple-300 border-purple-500 py-3 px-5 text-base shadow-sm">
                {skill}
              </span>
            ))}
          </div>
        </>
      )}

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
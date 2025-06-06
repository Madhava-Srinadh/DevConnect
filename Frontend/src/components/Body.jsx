// src/components/Body.jsx

import { Outlet, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser, removeUser } from "../utils/userSlice"; // Corrected to include removeUser
import { useEffect } from "react";

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((store) => store.user); // Get user data from Redux store

  const fetchUser = async () => {
    // Only fetch if userData is not already present in Redux
    // This is important because redux-persist will load it from localStorage
    // If userData is already loaded (persisted), we don't need to fetch it again immediately.
    if (userData) {
      console.log("User data already in Redux store, skipping API fetch.");
      return;
    }

    try {
      console.log("Fetching user data from API...");
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      // Assuming `res.data.data` contains the user object.
      // If it's directly `res.data`, adjust `res.data.data` to `res.data`.
      dispatch(addUser(res.data.data));
      console.log("User data fetched and added to Redux:", res.data.data);
    } catch (err) {
      // Check for 401 Unauthorized status (e.g., token expired, not logged in)
      if (err.response && err.response.status === 401) {
        console.warn("Unauthorized: User session invalid. Clearing user data.");
        dispatch(removeUser()); // Clear user state in Redux
        // Optionally, clear any token from localStorage if you're storing it there
        // localStorage.removeItem('authToken');
        navigate("/login"); // Redirect to login page
      } else {
        console.error("Error fetching user data:", err);
        // You might want to navigate to login even on other errors if user data is crucial
        // navigate("/login");
      }
    }
  };

  useEffect(() => {
    // This effect runs on component mount and when userData changes.
    // If userData becomes null (e.g., after logout or 401), it will trigger a fetch.
    // If userData is present (persisted or just logged in), the 'if (userData) return;' handles it.
    fetchUser();
  }, [userData]); // Added userData to dependency array to react to changes

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1">
        <Outlet /> {/* This is where the specific protected route component (Feed, Profile, etc.) will render */}
      </main>
      <Footer />
    </div>
  );
};

export default Body;
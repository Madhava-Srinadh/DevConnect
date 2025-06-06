// src/components/Body.jsx
// (This file is likely already correct based on your previous versions)
import { Outlet, useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useEffect } from "react";
import { removeUser } from "../utils/userSlice"; // Import removeUser for 401 handling

const Body = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userData = useSelector((store) => store.user);

  const fetchUser = async () => {
    // Only fetch if userData is not already present in Redux
    if (userData) return;
    try {
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      dispatch(addUser(res.data.data)); // Assuming `res.data` directly contains user object, if nested under `data`, use `res.data.data`
    } catch (err) {
      // Check for 401 Unauthorized status
      if (err.response && err.response.status === 401) {
        dispatch(removeUser()); // Clear user state
        localStorage.removeItem('authToken'); // Clear any stored token
        navigate("/login"); // Redirect to login
      }
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userData]); // Re-run if userData changes (e.g., after logout)

  return (
    <div className="flex flex-col min-h-screen"> {/* Ensure Body takes full height */}
      <NavBar />
      <main className="flex-1"> {/* main tag for semantic HTML and flex-1 to push footer down */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
export default Body;
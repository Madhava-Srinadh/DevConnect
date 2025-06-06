// src/components/ProtectedRoute.jsx

import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { addUser, removeUser } from "../utils/userSlice"; // Actions for user slice
import { resetFeed } from "../utils/feedSlice"; // To clear feed on logout/unauth

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user); // Get user data from Redux store

  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Loading state for auth check
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication status

  useEffect(() => {
    const verifyAuth = async () => {
      // If user data is already in Redux (likely restored by redux-persist),
      // we assume they are authenticated for the initial render, but *still*
      // re-validate with the backend for true session status.
      if (user && user.emailId) {
        setIsAuthenticated(true);
      }

      try {
        console.log("ProtectedRoute: Verifying user session via API...");
        const res = await axios.get(BASE_URL + "/profile/view", {
          withCredentials: true,
        });
        // If API call is successful, the user is authenticated and session is valid.
        dispatch(addUser(res.data.data)); // Update Redux store with latest user data
        setIsAuthenticated(true);
      } catch (err) {
        console.warn("ProtectedRoute: User session invalid or not found.", err.response?.status, err.message);
        // If 401 or any error, the user is not authenticated or session expired.
        dispatch(removeUser());      // Clear user data from Redux
        dispatch(resetFeed());       // Clear feed data as well
        localStorage.removeItem('authToken'); // Clear any local token if used
        setIsAuthenticated(false);
        navigate("/login");          // Redirect to login page
      } finally {
        setIsLoadingAuth(false);     // Authentication check is complete
      }
    };

    // Run the verification on component mount
    verifyAuth();
  }, [dispatch, navigate, user]); // Depend on 'user' to re-verify if it changes unexpectedly

  if (isLoadingAuth) {
    // Show a global loading spinner or splash screen while checking authentication
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">
        Verifying session...
      </div>
    );
  }

  // If not authenticated (and loading is done), the navigate hook has already handled the redirect.
  // If authenticated, render the children routes.
  return isAuthenticated ? <Outlet /> : null;
};

export default ProtectedRoute;
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { addUser } from "../utils/userSlice";

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((store) => store.user);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      // If user is already in Redux, we are good
      if (user) {
        setIsChecking(false);
        return;
      }

      // If user is null (page reload), try to fetch profile
      try {
        // ✅ Try to use token from localStorage if cookie fails (optional robustness)
        const storedToken = localStorage.getItem("authToken");
        const headers = storedToken
          ? { Authorization: `Bearer ${storedToken}` }
          : {};

        const res = await axios.get(`${BASE_URL}/profile/view`, {
          withCredentials: true,
          headers: headers, // Send token if we have it
        });

        // Restore Redux state
        dispatch(addUser(res.data));
        setIsChecking(false);
      } catch (err) {
        console.error("Session check failed", err);
        navigate("/login");
      }
    };

    checkSession();
  }, [user, navigate, dispatch]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white text-xl">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return user ? <Outlet /> : null;
};

export default ProtectedRoute;

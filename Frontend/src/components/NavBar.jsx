import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants"; // Use the same BASE_URL
import { removeUser } from "../utils/userSlice";
import {
  User,
  Edit,
  Users,
  UserPlus,
  Briefcase,
  Gem,
  LogOut,
} from "lucide-react";

const NavBar = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Remove /jobs from BASE_URL for logout endpoint
      const authBaseUrl = BASE_URL.replace("/jobs", "");
      await axios.post(`${authBaseUrl}/logout`, {}, { withCredentials: true });
      dispatch(removeUser());
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
      // Force logout on client even if backend fails
      dispatch(removeUser());
      navigate("/login");
    }
  };

  return (
    <div className="navbar bg-gradient-to-r z-50 from-gray-800 to-gray-900 shadow-lg px-4 border-b border-gray-700">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-2xl text-white hover:bg-transparent">
          <span className="text-purple-400">👩‍💻</span> <span className="font-bold">DevConnect</span>
        </Link>
      </div>

      {user ? (
        <div className="flex-none space-x-4 items-center flex">
          <span className="text-white text-lg hidden sm:inline">
            Welcome, <span className="font-semibold text-purple-300">{user.firstName}</span>
          </span>

          {/* Profile Dropdown */}
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              className="btn btn-circle avatar ring-2 ring-purple-500 hover:ring-offset-2 hover:ring-offset-gray-800 transition-all duration-300"
            >
              <div className="w-10 rounded-full">
                <img
                  alt="User profile"
                  src={
                    user.photoUrl ||
                    `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
                  }
                />
              </div>
            </button>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-gray-800 rounded-box w-52 border border-gray-700"
            >
              <li>
                <Link to="/profile" className="flex items-center space-x-2 p-2">
                  <User size={18} />
                  <span>Profile</span>
                </Link>
              </li>
              <li>
                <Link to="/profile/edit" className="flex items-center space-x-2 p-2">
                  <Edit size={18} />
                  <span>Edit Profile</span>
                </Link>
              </li>
              <div className="divider my-1"></div>
              <li>
                <Link to="/connections" className="flex items-center space-x-2 p-2">
                  <Users size={18} />
                  <span>Connections</span>
                </Link>
              </li>
              <li>
                <Link to="/requests" className="flex items-center space-x-2 p-2">
                  <UserPlus size={18} />
                  <span>Requests</span>
                </Link>
              </li>
              <div className="divider my-1"></div>
              <li>
                <Link to="/jobs" className="flex items-center space-x-2 p-2 font-semibold text-purple-300">
                  <Briefcase size={18} />
                  <span>Find Jobs</span>
                </Link>
              </li>
              <li>
                <Link to="/premium" className="flex items-center space-x-2 p-2">
                  <Gem size={18} />
                  <span>Premium</span>
                </Link>
              </li>
              <div className="divider my-1"></div>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-2 p-2 text-left text-red-400"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex-none">
          <Link
            to="/login"
            className="btn btn-outline btn-sm text-white border-purple-500 hover:bg-purple-500 hover:text-white transition"
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default NavBar;
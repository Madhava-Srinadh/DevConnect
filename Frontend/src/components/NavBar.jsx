// src/components/NavBar.jsx

import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";

const NavBar = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/logout`, {}, { withCredentials: true });
      dispatch(removeUser());
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="navbar bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost normal-case text-2xl text-white hover:bg-transparent">
          👩‍💻 <span className="font-bold">DevTinder</span>
        </Link>
      </div>
      {user && (
        <div className="flex-none space-x-4 items-center hidden sm:flex">
          <span className="text-white text-lg">Welcome, <span className="font-semibold">{user.firstName}</span></span>
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-circle avatar ring-2 ring-white hover:ring-offset-2 hover:ring-offset-purple-600 transition">
              <div className="w-10 rounded-full">
                <img alt="user avatar" src={user.photoUrl} />
              </div>
            </button>
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-white rounded-lg w-48"
            >
              <li className="hover:bg-gray-100 rounded">
                <Link to="/profile" className="flex items-center space-x-2 px-3 py-2">
                  <span className="text-xl">🧑‍💼</span>
                  <span>Profile</span>
                </Link>
              </li>
              <li className="hover:bg-gray-100 rounded">
                <Link to="/connections" className="flex items-center space-x-2 px-3 py-2">
                  <span className="text-xl">🤝</span>
                  <span>Connections</span>
                </Link>
              </li>
              <li className="hover:bg-gray-100 rounded">
                <Link to="/requests" className="flex items-center space-x-2 px-3 py-2">
                  <span className="text-xl">📥</span>
                  <span>Requests</span>
                </Link>
              </li>
              <li className="hover:bg-gray-100 rounded">
                <Link to="/premium" className="flex items-center space-x-2 px-3 py-2">
                  <span className="text-xl">💎</span>
                  <span>Premium</span>
                </Link>
              </li>
              <li className="hover:bg-gray-100 rounded">
                <button onClick={handleLogout} className="flex w-full items-center space-x-2 px-3 py-2 text-left">
                  <span className="text-xl">🚪</span>
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
      {!user && (
        <div className="flex-none">
          <Link to="/login" className="btn btn-outline btn-sm text-white border-white hover:border-transparent hover:bg-white hover:text-indigo-600 transition">
            Login
          </Link>
        </div>
      )}
    </div>
  );
};

export default NavBar;

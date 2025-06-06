// src/components/Connections.jsx
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addConnections } from "../utils/conectionSlice";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import { removeUser } from "../utils/userSlice"; // Import removeUser

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Added loading state


  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnections(res.data.data));
    } catch (err) {
      console.error("Error fetching connections:", err);
      if (err.response && err.response.status === 401) {
        dispatch(removeUser()); // Clear user state
        localStorage.removeItem('authToken'); // Clear token
        navigate("/login"); // Redirect to login
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [dispatch, navigate]);

  if (loading) {
    return <div className="text-center my-10 text-lg">Loading your connections...</div>;
  }

  if (!connections || connections.length === 0)
    return (
      <div className="flex justify-center my-10 text-lg text-gray-500">
        No connections found. Start swiping on the <Link to="/" className="text-blue-500 hover:underline ml-1">feed</Link>!
      </div>
    );

  return (
    <div className="text-center my-10 p-4">
      <h1 className="text-bold text-white text-4xl mb-8">My Connections</h1>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {connections.map((connection) => {
          const { _id, firstName, lastName, photoUrl, age, gender, about, skills } =
            connection;

          return (
            <div
              key={_id}
              className="flex flex-col md:flex-row justify-between items-center p-6 rounded-lg bg-gray-800 shadow-lg border border-gray-700 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="avatar mr-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img
                      alt={`${firstName}'s photo`}
                      className="object-cover w-full h-full"
                      src={photoUrl || "https://via.placeholder.com/150?text=Profile"}
                    />
                  </div>
                </div>
                <div className="text-left">
                  <h2 className="font-bold text-2xl text-green-400">
                    {firstName || "Unknown"} {lastName || "User"}
                  </h2>
                  {age && gender && <p className="text-gray-300">{age} yrs, {gender}</p>}
                  <p className="text-gray-400 text-sm line-clamp-2">{about || "No 'about' provided."}</p>
                   {skills && skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="badge badge-outline badge-success text-xs">{skill}</span>
                      ))}
                      {skills.length > 3 && <span className="badge badge-outline badge-success text-xs">+{skills.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4 md:mt-0">
                <Link to={`/chat/${_id}`} className="btn btn-info btn-md shadow-md hover:shadow-lg transition-shadow duration-200">
                  Chat
                </Link>
                {/* You might want a "View Profile" button here too */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Connections;
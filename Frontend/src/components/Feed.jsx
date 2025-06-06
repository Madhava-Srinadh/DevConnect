// src/components/Feed.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import UserCard from "./UserCard";
import { useDispatch } from "react-redux"; // Import useDispatch
import { removeUser } from "../utils/userSlice"; // Import removeUser
import { useNavigate } from "react-router-dom"; // Import useNavigate

const Feed = () => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null); // Added error state
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchUsers = async (currentPage) => {
    setLoading(true); // Set loading to true before fetch
    setError(null); // Clear previous errors
    try {
      const res = await axios.get(BASE_URL + "/feed", {
        params: { page: currentPage, limit: 10 },
        withCredentials: true,
      });
      if (res.data.data.length < 10) {
        setHasMore(false);
      }
      setUsers((prev) => [...prev, ...res.data.data]);
    } catch (err) {
      console.error("Error fetching feed:", err);
      setError("Failed to load feed. Please try again later."); // Set a user-friendly error message
      if (err.response && err.response.status === 401) {
        dispatch(removeUser()); // Clear user state
        localStorage.removeItem('authToken'); // Clear token
        navigate("/login"); // Redirect to login
      }
    } finally {
      setLoading(false); // Set loading to false after fetch (success or failure)
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page, dispatch, navigate]); // Added dependencies

  const handleNextUser = () => {
    // Only allow next if not currently loading and there are more users or more pages
    if (!loading && (currentIndex + 1 < users.length || hasMore)) {
      if (currentIndex + 1 < users.length) {
        setCurrentIndex(currentIndex + 1);
      } else if (hasMore) {
        setPage(page + 1);
        setCurrentIndex(0); // Reset index for new page
      }
    }
  };

  // Add `onAction` and `loadingAction` props here for UserCard
  const handleCardAction = async (status, userId) => {
    // This function will be passed to UserCard
    // and will call the API for ignored/interested
    // For now, let's just simulate removing the user from the feed
    // You would integrate your actual API call here
    console.log(`User ${userId} was ${status}`);
    // Simulate API call for demonstration:
    // await axios.post(BASE_URL + `/request/send/${status}/${userId}`, {}, { withCredentials: true });

    // After action, move to the next user
    handleNextUser();
  };

  if (loading && users.length === 0) {
    return <div className="p-4 text-center text-lg">Loading amazing developers...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500 text-lg">{error}</div>;
  }

  if (users.length === 0 && !hasMore && !loading) {
    return <div className="p-4 text-center text-lg">No more users to show! Check back later.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4 bg-gray-900">
      {users[currentIndex] ? (
        <UserCard
          user={users[currentIndex]}
          onAction={handleCardAction}
          loadingAction={null} // You can manage individual card loading states if needed
        />
      ) : (
        <div className="text-white text-xl">Fetching more users...</div>
      )}
    </div>
  );
};

export default Feed;
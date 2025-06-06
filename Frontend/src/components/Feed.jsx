// src/components/Feed.jsx

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import UserCard from "./UserCard";
import { useDispatch, useSelector } from "react-redux";
import { setFeed, addFeed, resetFeed } from "../utils/feedSlice";
import { removeUser as removeAuthUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";

const Feed = () => {
  const feedItems = useSelector((store) => store.feed.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(
    async (pageToFetch, isInitialLoad = false) => {
      if ((loading && !isInitialLoad) || (!hasMore && !isInitialLoad)) return;
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(BASE_URL + "/feed", {
          params: { page: pageToFetch, limit: 10 },
          withCredentials: true,
        });

        const newUsers = res.data.data || [];

        if (pageToFetch === 1) {
          dispatch(setFeed(newUsers));
        } else {
          dispatch(addFeed(newUsers));
        }

        setHasMore(newUsers.length === 10);
        setCurrentPage(pageToFetch);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError("Failed to load feed. Please try again.");
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          dispatch(removeAuthUser());
          dispatch(resetFeed());
          localStorage.removeItem("authToken");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, dispatch, navigate]
  );

  useEffect(() => {
    if (feedItems.length === 0 && !loading && currentPage === 1 && hasMore) {
      fetchUsers(1, true);
    } else if (!feedItems[0] && hasMore && !loading) {
      fetchUsers(currentPage + 1);
    } else if (feedItems.length > 0 && feedItems.length <= 1 && hasMore && !loading) {
      fetchUsers(currentPage + 1);
    }
  }, [feedItems, hasMore, loading, currentPage, fetchUsers]);

  if (loading && feedItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <span className="text-white text-lg">Loading amazing developers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <span className="text-red-500 text-lg">{error}</span>
      </div>
    );
  }

  if (feedItems.length === 0 && !hasMore && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <h1 className="text-white text-2xl">No new users found!</h1>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      {feedItems.length > 0 ? (
        <UserCard user={feedItems[0]} />
      ) : (
        <div className="text-white text-lg">
          {loading ? "Fetching more users..." : "No more users to show! Check back later."}
        </div>
      )}
    </div>
  );
};

export default Feed;

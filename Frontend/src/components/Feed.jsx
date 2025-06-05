import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import UserCard from "./UserCard";

const Feed = () => {
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async (pageNum) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BASE_URL}/feed`, {
        params: { page: pageNum, limit: 10 },
        withCredentials: true,
      });
      
      if (res.data.data.length < 10) {
        setHasMore(false);
      }
      
      setUsers(prevUsers => [...prevUsers, ...res.data.data]);
    } catch (err) {
      setError("Failed to load profiles. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleNextUser = () => {
    if (currentIndex + 1 >= users.length && hasMore) {
      setPage(prev => prev + 1);
    }
    setCurrentIndex(prev => prev + 1);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-error mb-4">{error}</p>
        <button 
          onClick={() => fetchUsers(page)} 
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-xl text-center">
          No profiles available at the moment.<br/>
          Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      {users[currentIndex] && (
        <>
          <UserCard user={users[currentIndex]} />
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleNextUser}
              className="btn btn-primary"
              disabled={!hasMore && currentIndex >= users.length - 1}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Next Profile"
              )}
            </button>
          </div>
          
          {!hasMore && currentIndex >= users.length - 1 && (
            <p className="mt-4 text-gray-500">
              You've seen all available profiles
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Feed;
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

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔍 SEARCH STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ---------------- NORMAL FEED FETCH ----------------
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
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          dispatch(removeAuthUser());
          dispatch(resetFeed());
          localStorage.removeItem("authToken");
          navigate("/login");
        }
        setError("Failed to load feed");
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, dispatch, navigate]
  );

  // ---------------- SEARCH API ----------------
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await axios.get(BASE_URL + "/user/search", {
        params: { q: query },
        withCredentials: true,
      });

      setSearchResults(res.data.data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // 🔁 DEBOUNCE SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) searchUsers(searchTerm);
      else setSearchResults([]);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ---------------- INITIAL FEED LOAD ----------------
  useEffect(() => {
    if (searchTerm) return;

    if (feedItems.length === 0 && !loading && currentPage === 1 && hasMore) {
      fetchUsers(1, true);
    } else if (!feedItems[0] && hasMore && !loading) {
      fetchUsers(currentPage + 1);
    }
  }, [feedItems, hasMore, loading, currentPage, fetchUsers, searchTerm]);

  // ---------------- UI ----------------
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900">

      {/* 🔍 SEARCH BAR */}
      <div className="w-full flex justify-center mt-6">
        <input
          type="text"
          placeholder="Search by name..."
          className="input input-bordered w-96"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ---------------- SEARCH MODE ---------------- */}
      {searchTerm ? (
        <div className="w-full flex flex-col items-center mt-8 gap-4">
          {searchLoading && <p className="text-white">Searching...</p>}
          {!searchLoading && searchResults.length === 0 && (
            <p className="text-white">No users found</p>
          )}

          {searchResults.map((user) => (
  <UserCard
    key={user._id}
    user={user}
    isSearch
    setSearchResults={setSearchResults}
  />
))}

        </div>
      ) : (
        /* ---------------- FEED MODE ---------------- */
        <div className="flex items-center justify-center flex-1 w-full">
          {loading && feedItems.length === 0 ? (
            <span className="text-white">Loading amazing developers...</span>
          ) : error ? (
            <span className="text-red-500">{error}</span>
          ) : feedItems.length > 0 ? (
            <UserCard user={feedItems[0]} />
          ) : (
            <span className="text-white">No more users to show</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;

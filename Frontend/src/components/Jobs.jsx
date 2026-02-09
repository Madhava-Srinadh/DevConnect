import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";

const Jobs = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();

  // 1. Store ALL fetched jobs here
  const [allRecommendedJobs, setAllRecommendedJobs] = useState([]);
  // 2. Store only the CURRENT PAGE jobs here
  const [jobs, setJobs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Limits
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [membership, setMembership] = useState("free");

  const JOBS_PER_PAGE = 6;

  // ─────────────────────────────────────────────
  // 1. FETCH DATA (Only once on mount/user change)
  // ─────────────────────────────────────────────
  const fetchRecommended = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/jobs/recommendations`, {
        withCredentials: true,
      });

      const allData = res.data.recommendations || [];

      // Store the master list
      setAllRecommendedJobs(allData);

      // Set Metadata
      setLimit(res.data.limit);
      setMembership(res.data.membershipType);
      setTotalFound(allData.length);

      // Calculate total pages immediately
      setTotalPages(Math.ceil(allData.length / JOBS_PER_PAGE));
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) navigate("/login");
      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecommended();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ⚡ Dependency removed: currentPage

  // ─────────────────────────────────────────────
  // 2. SLICE DATA (Runs instantly when page changes)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;

    // Slice from memory instead of fetching
    const currentSlice = allRecommendedJobs.slice(startIndex, endIndex);
    setJobs(currentSlice);
  }, [currentPage, allRecommendedJobs]);

  // 🎨 Helper for membership color
  const getMembershipColor = (type) => {
    switch (type) {
      case "premium":
        return "bg-gradient-to-r from-yellow-400 to-orange-500 text-black";
      case "gold":
        return "bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 text-white";
      case "silver":
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      default:
        return "bg-gray-700 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10 flex flex-col items-center">
      {/* ── HEADER SECTION ── */}
      <div className="w-full max-w-5xl mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Recommended Jobs
          </h1>
          <p className="text-gray-400 mt-2">
            Curated opportunities based on your skills.
          </p>
        </div>

        {/* Membership Badge */}
        <div
          className={`px-5 py-2 rounded-full font-bold shadow-lg ${getMembershipColor(membership)}`}
        >
          {membership ? membership.toUpperCase() : "FREE"} PLAN
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="w-full max-w-5xl bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700 flex justify-between items-center shadow-sm">
        <span className="text-gray-300 text-sm">
          Showing <span className="text-white font-bold">{jobs.length}</span>{" "}
          jobs on this page
        </span>
        <span className="text-gray-400 text-xs uppercase tracking-wider">
          Total: {totalFound} / Limit: {limit === 9999 ? "∞" : limit}
        </span>
      </div>

      {/* ── CONTENT AREA ── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center mt-10">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-500 animate-pulse">
            Scanning the job market...
          </p>
        </div>
      ) : error ? (
        <div className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 opacity-50">
          <h3 className="text-2xl font-bold">No Jobs Found</h3>
          <p>
            Try adding more skills to your profile or wait for new postings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {jobs.map((item, i) => (
            <div
              key={i}
              className="group relative bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {item.job.company
                      ? item.job.company.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                  {item.matchedSkills.length > 0 && (
                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-900/30 text-green-400 border border-green-800">
                      {item.matchedSkills.length} MATCHES
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {item.job.title}
                </h2>
                <p className="text-sm text-gray-400 font-medium mb-4">
                  {item.job.company}
                </p>

                {/* Skills Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.matchedSkills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded-md bg-gray-700 text-gray-300 border border-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                  {item.matchedSkills.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{item.matchedSkills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <a
                href={item.job.redirect_url}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-transform active:scale-95"
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {!loading && totalPages > 1 && (
        <div className="mt-12 flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-sm btn-circle btn-ghost text-white disabled:text-gray-600"
          >
            ❮
          </button>

          {/* Page Numbers */}
          <div className="flex gap-2">
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`btn btn-sm w-8 h-8 rounded-lg border-0 ${
                  currentPage === idx + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-sm btn-circle btn-ghost text-white disabled:text-gray-600"
          >
            ❯
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs;

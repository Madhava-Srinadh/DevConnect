import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const Jobs = () => {
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper: normalize a returned item to a flat job DTO for display
  const normalizeItem = (item) => {
    // item may be { job, matchCount, matchedSkills } OR a job doc itself
    const doc = item?.job ? item.job : item;
    if (!doc) return null;
    const location = doc.location?.display_name
      ? doc.location.display_name
      : Array.isArray(doc.location?.area)
      ? doc.location.area.join(", ")
      : doc.location || "";
    return {
      _id: doc._id || doc.id || doc.adId || doc.ad_id,
      title: doc.title || "Untitled",
      company: doc.company || (doc.company && doc.company.display_name) || "",
      location,
      description: doc.description || doc.summary || "",
      skills: doc.skills || [],
      jobUrl: doc.redirect_url || doc.redirectUrl || doc.jobUrl || doc.url,
      matchCount: item?.matchCount ?? null,
      matchedSkills: item?.matchedSkills ?? null,
      locationMatch: item?.locationMatch ?? null,
    };
  };

  const handleApiError = (err, message) => {
    console.error(message, err);
    if (err?.response?.status === 401) {
      navigate("/login");
    } else {
      setError(message);
    }
  };

  // Fetch recommendations for logged in user (simple: only once on mount)
  const fetchRecommended = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/jobs/recommendations`, { withCredentials: true });
      const recs = res.data?.recommendations || [];
      setJobs(recs);
    } catch (err) {
      handleApiError(err, "Failed to fetch recommended jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommended();
    } else {
      navigate("/login");
    }
  }, [user, navigate]);

  // Render helpers
  const renderJobCard = (rawItem) => {
    const job = normalizeItem(rawItem);
    if (!job) return null;
    return (
      <div key={job._id || Math.random()} className="card bg-white shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
        <p className="text-gray-600">{job.company} - {job.location}</p>
        <p className="text-gray-500 text-sm mt-2">{(job.description || "").substring(0, 150)}...</p>
        {job.skills && job.skills.length > 0 && (
          <p className="text-gray-500 text-sm mt-2"><strong>Skills:</strong> {job.skills.join(", ")}</p>
        )}
        {job.matchCount != null && (
          <p className="text-sm text-gray-600 mt-2">Matched skills: {job.matchCount} {job.matchedSkills?.length ? `(${job.matchedSkills.join(", ")})` : ""}</p>
        )}
        <a href={job.jobUrl || "#"} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 mt-4 self-start">
          Apply Now
        </a>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Recommended Jobs For You
      </h1>

      {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}

      {loading ? (
        <div className="text-center text-gray-600">Loading recommendations...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-gray-600">
          No recommendations yet. Update your skills in your profile to see jobs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((item) => renderJobCard(item))}
        </div>
      )}
    </div>
  );
};

export default Jobs;

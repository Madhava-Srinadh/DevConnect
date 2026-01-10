// src/components/Jobs.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useNavigate } from "react-router-dom";

const Jobs = () => {
  const user = useSelector((store) => store.user);
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [limit, setLimit] = useState(0);
  const [membership, setMembership] = useState("free");
  const [loading, setLoading] = useState(false);

  const fetchRecommended = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/jobs/recommendations`,
        { withCredentials: true }
      );

      console.log("[JOB API RESPONSE]", res.data);

      setJobs(res.data.recommendations || []);
      setLimit(res.data.limit);
      setMembership(res.data.membershipType);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRecommended();
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Recommended Jobs</h1>

      <p className="text-sm text-gray-500 mb-4">
        Membership: <b>{membership.toUpperCase()}</b> · Showing {jobs.length} / {limit}
      </p>

      {loading && <p>Loading jobs...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((item, i) => (
          <div key={i} className="border p-4 rounded">
            <h2 className="font-semibold">{item.job.title}</h2>
            <p>{item.job.company}</p>
            <p className="text-sm text-gray-500">
              Matched skills: {item.matchedSkills.join(", ")}
            </p>
            <a
              href={item.job.redirect_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Apply
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Jobs;

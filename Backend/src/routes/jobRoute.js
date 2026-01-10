// routes/job.js
const express = require("express");
const jobRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { getJobsForSkills } = require("../services/smartJobFetcher");

// Helper: normalize skills from user profile
function cleanSkills(arr) {
  if (!Array.isArray(arr)) return [];
  return [
    ...new Set(arr.map((s) => String(s).toLowerCase().trim()).filter(Boolean)),
  ];
}

// -------- RECOMMEND JOBS FOR USER (simple: based only on skills) --------
jobRouter.get("/jobs/recommendations", userAuth, async (req, res) => {
  try {
    const userSkills = cleanSkills(req.user?.skills || []);
    if (!userSkills.length) {
      return res.json({
        ok: false,
        error: "user has no skills",
        recommendations: [],
      });
    }

    // Fetch jobs directly from JSearch based only on skills
    const fetchedJobs = await getJobsForSkills(userSkills);

    // For simplicity: keep only jobs that match at least one user skill,
    // and sort by number of matched skills (no location, no percentages).
    const recommendations = fetchedJobs
      .map((job) => {
        const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
        const matched = jobSkills.filter((s) => userSkills.includes(s));
        const matchCount = matched.length;
        return {
          job,
          matchedSkills: matched,
          matchCount,
        };
      })
      .filter((r) => r.matchCount >= 1)
      .sort((a, b) => b.matchCount - a.matchCount);

    res.json({ 
      ok: true, 
      recommendations: recommendations.slice(0, 50), // Top 50 recommendations
      totalMatches: recommendations.length,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = jobRouter;

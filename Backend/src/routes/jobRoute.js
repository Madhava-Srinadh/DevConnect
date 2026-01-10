// routes/job.js
const express = require("express");
const jobRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const { getJobsForSkills } = require("../services/smartJobFetcher");

function cleanSkills(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map((s) => s.toLowerCase().trim()).filter(Boolean))];
}

function getJobLimit(user) {
  if (!user?.isPremium) return 5;
  if (user.membershipType === "silver") return 10;
  if (user.membershipType === "gold") return 25;
  return 5;
}

jobRouter.get("/jobs/recommendations", userAuth, async (req, res) => {

  try {
    const user = req.user;
    const userSkills = cleanSkills(user?.skills || []);
    const limit = getJobLimit(user);


    if (!userSkills.length) {
      return res.json({
        ok: false,
        message: "No skills found",
        recommendations: [],
      });
    }

    const jobs = await getJobsForSkills(userSkills);

    const recommendations = jobs
      .map((job) => {
        const matchedSkills = job.skills.filter((js) =>
          userSkills.some((us) => js.includes(us) || us.includes(js))
        );

        return {
          job,
          matchedSkills,
          matchCount: matchedSkills.length,
        };
      })
      .filter((j) => j.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, limit); // 🔥 SUBSCRIPTION LIMIT HERE


    res.json({
      ok: true,
      membershipType: user.membershipType || "free",
      limit,
      recommendations,
    });
  } catch (err) {
    console.error("[JOB_RECO_ERROR]", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = jobRouter;

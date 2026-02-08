// services/smartJobFetcher.js
const axios = require("axios");
const { extractSkillsFromText } = require("./skillExtractor");

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY;
const JSEARCH_HOST = "jsearch.p.rapidapi.com";
const JSEARCH_COUNTRY = process.env.JSEARCH_COUNTRY || "in";

function buildSearchQueryFromSkills(skills) {
  if (!skills.length) return "software developer";

  return skills
    .slice(0, 3)
    .map((s) => `${s} developer`)
    .join(" ");
}

async function fetchJobsBySkills(skills) {
  if (!JSEARCH_API_KEY) {
    console.warn("[JSEARCH] API KEY missing");
    return [];
  }

  const query = buildSearchQueryFromSkills(skills);

  try {
    const res = await axios.get(`https://${JSEARCH_HOST}/search`, {
      params: {
        query,
        page: "1",
        num_pages: "1",
        country: JSEARCH_COUNTRY,
      },
      headers: {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": JSEARCH_HOST,
      },
      timeout: 20000,
    });

    return res.data?.data || [];
  } catch (err) {
    console.error("[JSEARCH] ERROR:", err.message);
    return [];
  }
}

function normalizeJob(raw) {
  return {
    adId: raw.job_id || null,
    title: raw.job_title || null,
    company: raw.employer_name || null,
    description: raw.job_description || "",
    location: {
      display_name: raw.job_city || raw.job_country || null,
    },
    salary_min: raw.job_min_salary || null,
    salary_max: raw.job_max_salary || null,
    redirect_url: raw.job_apply_link || null,
    contract_time: raw.job_employment_type || null,
  };
}

async function getJobsForSkills(userSkills) {

  const rawJobs = await fetchJobsBySkills(userSkills);
  if (!rawJobs.length) return [];

  return rawJobs.slice(0, 30).map((raw, idx) => {
    const normalized = normalizeJob(raw);
    const extractedSkills = extractSkillsFromText(normalized.description);


    return {
      ...normalized,
      skills: extractedSkills,
    };
  });
}

module.exports = { getJobsForSkills };

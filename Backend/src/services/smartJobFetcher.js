// services/smartJobFetcher.js
// Simple JSearch-based job fetcher.
// Fetches jobs once per request based only on user skills – no caching, no location logic.

const axios = require("axios");
const { extractSkillsFromText } = require("./skillExtractor");

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || process.env.RAPIDAPI_KEY;
const JSEARCH_HOST = "jsearch.p.rapidapi.com";
const JSEARCH_COUNTRY = process.env.JSEARCH_COUNTRY || "in";

/**
 * Build search query from user skills
 */
function buildSearchQueryFromSkills(skills) {
  if (!skills || skills.length === 0) {
    return "developer software engineer";
  }

  // Take top 3 skills for query
  const topSkills = skills.slice(0, 3);

  // Map skills to search-friendly terms
  const skillMap = {
    javascript: "javascript developer",
    python: "python developer",
    java: "java developer",
    react: "react developer",
    "node.js": "node.js developer",
    "c#": "c# developer",
    ".net": ".net developer",
    aws: "aws developer",
    devops: "devops engineer",
    "machine learning": "machine learning engineer",
  };

  // Use mapped terms or original skills
  const queryTerms = topSkills.map((skill) => {
    const normalized = skill.toLowerCase();
    return skillMap[normalized] || `${normalized} developer`;
  });

  return queryTerms.join(" ");
}

/**
 * Fetch jobs from JSearch API based on skills (single page)
 */
async function fetchJobsBySkills(skills = [], page = 1) {
  if (!JSEARCH_API_KEY) {
    console.warn("[smartJobFetcher] JSEARCH_API_KEY not provided");
    return { results: [] };
  }

  const query = buildSearchQueryFromSkills(skills);
  const url = `https://${JSEARCH_HOST}/search`;

  const params = {
    query: query,
    page: page.toString(),
    num_pages: "1",
    country: JSEARCH_COUNTRY,
  };

  try {
    console.log(
      `[smartJobFetcher] Fetching jobs for query: "${query}" (page ${page})`
    );

    const r = await axios.get(url, {
      params,
      timeout: 20000,
      headers: {
        "X-RapidAPI-Key": JSEARCH_API_KEY,
        "X-RapidAPI-Host": JSEARCH_HOST,
      },
    });

    const results = (r.data && r.data.data) || [];
    console.log(`[smartJobFetcher] Fetched ${results.length} jobs from API`);

    return { results };
  } catch (err) {
    console.error(
      "[smartJobFetcher] API error:",
      err?.response?.data || err?.message
    );
    return { results: [], error: err?.message };
  }
}

/**
 * Normalize JSearch job data to a flat object used by the frontend.
 */
function normalizeJob(raw) {
  return {
    adId: raw.job_id || raw.id || null,
    title: raw.job_title || raw.title || null,
    company: raw.employer_name || raw.company_name || raw.company || null,
    description:
      raw.job_description ||
      (raw.job_highlights?.items ? raw.job_highlights.items.join(" ") : "") ||
      raw.description ||
      "",
    location: {
      display_name: raw.job_city
        ? `${raw.job_city}, ${raw.job_state || raw.job_country || ""}`.trim()
        : raw.job_location || raw.job_country || null,
      area: raw.job_city ? [raw.job_city] : [],
      latitude: raw.job_latitude || null,
      longitude: raw.job_longitude || null,
    },
    salary_min: raw.job_min_salary || null,
    salary_max: raw.job_max_salary || null,
    redirect_url:
      raw.job_apply_link || raw.job_google_link || raw.redirect_url || null,
    contract_time: raw.job_employment_type || raw.contract_time || null,
  };
}

/**
 * Get jobs for user skills (no caching, no DB writes).
 */
async function getJobsForSkills(userSkills) {
  const cleanSkills = userSkills
    .map((s) => String(s).toLowerCase().trim())
    .filter(Boolean);

  console.log(
    "[smartJobFetcher] Fetching jobs directly from JSearch (simple mode)"
  );

  const { results: rawJobs, error } = await fetchJobsBySkills(cleanSkills, 1);

  if (error || rawJobs.length === 0) {
    console.log("[smartJobFetcher] No jobs returned from API");
    return [];
  }

  // Normalize and attach extracted skills for each job
  const processedJobs = rawJobs.slice(0, 30).map((raw) => {
    const normalized = normalizeJob(raw);
    const { skills: extractedSkills } = extractSkillsFromText(
      normalized.description || ""
    );
    return {
      ...normalized,
      skills: extractedSkills,
    };
  });

  return processedJobs;
}

module.exports = {
  getJobsForSkills,
};
